package service

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strings"
	"time"

	"reqst/backend/internal/store"

	"github.com/shopspring/decimal"
)

const trialInvoiceLimit = 15

type InvoiceService struct {
	store      *store.Store
	httpClient *http.Client
	tonRateEnv string
}

type CreateInvoiceInput struct {
	Title            string
	BaseAmountUSD    decimal.Decimal
	PayableNetwork   store.Network
	ExpiresInMinutes int
}

func NewInvoiceService(st *store.Store, tonRateEnv string) *InvoiceService {
	return &InvoiceService{
		store: st,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		tonRateEnv: tonRateEnv,
	}
}

func (s *InvoiceService) CreateInvoice(ctx context.Context, seller store.Seller, input CreateInvoiceInput) (store.Invoice, error) {
	if seller.IsBlocked {
		return store.Invoice{}, errors.New("seller account is blocked")
	}
	if input.Title == "" {
		return store.Invoice{}, errors.New("title is required")
	}
	if !input.BaseAmountUSD.IsPositive() {
		return store.Invoice{}, errors.New("base_amount_usd must be positive")
	}
	if input.ExpiresInMinutes <= 0 {
		input.ExpiresInMinutes = 30
	}
	if input.PayableNetwork == "" {
		input.PayableNetwork = seller.DefaultNetwork
	}

	if !seller.IsPRO(time.Now()) && seller.FreeInvoicesUsed >= trialInvoiceLimit {
		return store.Invoice{}, fmt.Errorf("trial limit reached: %d invoices", trialInvoiceLimit)
	}

	wallet, err := s.store.GetActiveWalletForNetwork(ctx, seller.ID, input.PayableNetwork)
	if err != nil {
		return store.Invoice{}, fmt.Errorf("active wallet for network %s: %w", input.PayableNetwork, err)
	}

	publicID, err := s.generateUniquePublicID(ctx)
	if err != nil {
		return store.Invoice{}, err
	}

	var payableAmount decimal.Decimal
	var paymentComment *string
	var matchingSuffix *decimal.Decimal

	switch input.PayableNetwork {
	case store.NetworkTON:
		payableAmount, err = s.calculateTONAmount(ctx, input.BaseAmountUSD)
		if err != nil {
			return store.Invoice{}, err
		}
		comment := "REQST-" + publicID
		paymentComment = &comment
	case store.NetworkTRON, store.NetworkEVM:
		suffix, err := s.generateUniqueSuffix(ctx, wallet.Address, input.PayableNetwork)
		if err != nil {
			return store.Invoice{}, err
		}
		payableAmount = input.BaseAmountUSD.Add(suffix).Round(6)
		matchingSuffix = &suffix
	default:
		return store.Invoice{}, fmt.Errorf("unsupported network %s", input.PayableNetwork)
	}

	expiresAt := time.Now().UTC().Add(time.Duration(input.ExpiresInMinutes) * time.Minute)
	return s.store.CreateInvoice(ctx, store.CreateInvoiceParams{
		PublicID:           publicID,
		SellerID:           seller.ID,
		Title:              strings.TrimSpace(input.Title),
		BaseAmountUSD:      input.BaseAmountUSD.Round(6),
		PayableAmount:      payableAmount,
		PayableNetwork:     input.PayableNetwork,
		DestinationAddress: wallet.Address,
		PaymentComment:     paymentComment,
		MatchingSuffix:     matchingSuffix,
		ExpiresAt:          expiresAt,
	})
}

func (s *InvoiceService) generateUniquePublicID(ctx context.Context) (string, error) {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	for range 20 {
		var b strings.Builder
		for i := 0; i < 16; i++ {
			n, err := rand.Int(rand.Reader, big.NewInt(int64(len(alphabet))))
			if err != nil {
				return "", fmt.Errorf("random public id: %w", err)
			}
			b.WriteByte(alphabet[n.Int64()])
		}
		candidate := b.String()
		exists, err := s.store.InvoicePublicIDExists(ctx, candidate)
		if err != nil {
			return "", err
		}
		if !exists {
			return candidate, nil
		}
	}
	return "", errors.New("failed to generate unique public id")
}

func (s *InvoiceService) generateUniqueSuffix(ctx context.Context, address string, network store.Network) (decimal.Decimal, error) {
	for range 64 {
		n, err := rand.Int(rand.Reader, big.NewInt(999999))
		if err != nil {
			return decimal.Zero, fmt.Errorf("random suffix: %w", err)
		}

		suffix := decimal.NewFromInt(n.Int64() + 1).Div(decimal.NewFromInt(1_000_000)).Round(6)
		used, err := s.store.SuffixRecentlyUsed(ctx, address, network, suffix)
		if err != nil {
			return decimal.Zero, err
		}
		if !used {
			return suffix, nil
		}
	}
	return decimal.Zero, errors.New("failed to generate unique matching suffix")
}

func (s *InvoiceService) calculateTONAmount(ctx context.Context, baseAmountUSD decimal.Decimal) (decimal.Decimal, error) {
	rate, err := s.tonRateUSD(ctx)
	if err != nil {
		return decimal.Zero, err
	}
	if !rate.IsPositive() {
		return decimal.Zero, errors.New("invalid TON/USD rate")
	}
	return baseAmountUSD.Div(rate).Round(6), nil
}

func (s *InvoiceService) tonRateUSD(ctx context.Context) (decimal.Decimal, error) {
	if strings.TrimSpace(s.tonRateEnv) != "" {
		value, err := decimal.NewFromString(strings.TrimSpace(s.tonRateEnv))
		if err != nil {
			return decimal.Zero, fmt.Errorf("TON_USD_RATE: %w", err)
		}
		return value, nil
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd", nil)
	if err != nil {
		return decimal.Zero, fmt.Errorf("build ton rate request: %w", err)
	}
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return decimal.Zero, fmt.Errorf("fetch ton rate: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return decimal.Zero, fmt.Errorf("fetch ton rate failed: %s", strings.TrimSpace(string(body)))
	}

	var payload struct {
		TheOpenNetwork struct {
			USD json.Number `json:"usd"`
		} `json:"the-open-network"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return decimal.Zero, fmt.Errorf("decode ton rate: %w", err)
	}
	value, err := decimal.NewFromString(payload.TheOpenNetwork.USD.String())
	if err != nil {
		return decimal.Zero, fmt.Errorf("parse ton rate: %w", err)
	}
	return value, nil
}
