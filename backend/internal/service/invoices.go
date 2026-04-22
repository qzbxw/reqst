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

	"reqst/backend/internal/metrics"
	"reqst/backend/internal/store"

	"github.com/shopspring/decimal"
)

const (
	TrialInvoiceLimit = 15
)

var reqstBillingWallets = map[store.Network]string{
	store.NetworkTON:    "UQBuzCySn6dYEHzKoGzUPmclj9Dg_m1dA-mzeDEvuF3F9x6P",
	store.NetworkTRON:   "TYNY19wFMM24dJN4ciyuGZDNzzQHVcaMPd",
	store.NetworkSOLANA: "FuJjhzKnFePteS35Ehyc6LHXYnax1G8TsJa1c1goem5V",
	store.NetworkEVM:    "0x117cd2295ba0f280a2fdb757157c33ef049d34af",
}

type InvoiceService struct {
	store      *store.Store
	httpClient *http.Client
	tonRateEnv string
}

type CreateInvoiceInput struct {
	Title            string
	BaseAmountUSD    decimal.Decimal
	PayableNetwork   store.Network
	WalletID         int64
	ExpiresInMinutes int
	Mode             string
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
	source := metrics.SourceFromContext(ctx)
	planCode := seller.EffectivePlanCode(time.Now())
	network := input.PayableNetwork
	if network == "" {
		network = seller.DefaultNetwork
	}

	if seller.IsBlocked {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(network), string(planCode), "failure", "seller_blocked")
		return store.Invoice{}, errors.New("seller account is blocked")
	}
	if input.Title == "" {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(network), string(planCode), "failure", "missing_title")
		return store.Invoice{}, errors.New("title is required")
	}
	if !input.BaseAmountUSD.IsPositive() {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(network), string(planCode), "failure", "invalid_amount")
		return store.Invoice{}, errors.New("base_amount_usd must be positive")
	}
	if input.ExpiresInMinutes <= 0 {
		input.ExpiresInMinutes = 30
	}
	if input.PayableNetwork == "" {
		input.PayableNetwork = seller.DefaultNetwork
	}
	if !input.PayableNetwork.IsSupportedPayableNetwork() {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(input.PayableNetwork), string(planCode), "failure", "unsupported_network")
		return store.Invoice{}, fmt.Errorf("unsupported network %s", input.PayableNetwork)
	}

	if seller.EffectivePlanCode(time.Now()) == store.PlanCodeTrial && seller.FreeInvoicesUsed >= TrialInvoiceLimit {
		metrics.IncLimitDecision("trial_invoice_cap", "denied", "reached")
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(input.PayableNetwork), string(planCode), "failure", "trial_limit_reached")
		return store.Invoice{}, fmt.Errorf("trial limit reached: %d invoices. Unlock a paid Reqst plan to keep generating links.", TrialInvoiceLimit)
	}

	var (
		wallet store.Wallet
		err    error
	)
	if input.WalletID > 0 {
		wallet, err = s.store.GetWalletByID(ctx, seller.ID, input.WalletID)
		if err != nil {
			metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(input.PayableNetwork), string(planCode), "failure", "wallet_lookup")
			return store.Invoice{}, fmt.Errorf("selected wallet %d: %w", input.WalletID, err)
		}
		if input.PayableNetwork == "" {
			input.PayableNetwork = wallet.Network
		}
		if wallet.Network != input.PayableNetwork.WalletBucket() {
			metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(input.PayableNetwork), string(planCode), "failure", "wallet_network_mismatch")
			return store.Invoice{}, fmt.Errorf("wallet %d does not support network %s", wallet.ID, input.PayableNetwork)
		}
	} else {
		wallet, err = s.store.GetActiveWalletForNetwork(ctx, seller.ID, input.PayableNetwork.WalletBucket())
		if err != nil {
			metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(input.PayableNetwork), string(planCode), "failure", "active_wallet_lookup")
			return store.Invoice{}, fmt.Errorf("active wallet for network %s: %w", input.PayableNetwork, err)
		}
	}

	mode := normalizedMode(input.Mode)
	invoice, err := s.createInvoiceWithDestination(ctx, store.CreateInvoiceParams{
		SellerID:           seller.ID,
		Kind:               store.InvoiceKindMerchant,
		SubscriptionDays:   0,
		PlanCode:           "",
		CountTowardsTrial:  mode != "test",
		Title:              strings.TrimSpace(input.Title),
		BaseAmountUSD:      input.BaseAmountUSD.Round(6),
		PayableNetwork:     input.PayableNetwork,
		DestinationAddress: wallet.Address,
		Mode:               mode,
	}, input.ExpiresInMinutes)
	if err != nil {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(input.PayableNetwork), string(planCode), "failure", "create_invoice")
		return store.Invoice{}, err
	}
	metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(invoice.PayableNetwork), string(planCode), "success", "created")
	return invoice, nil
}

func (s *InvoiceService) CreateSubscriptionInvoice(ctx context.Context, seller store.Seller, network store.Network) (store.Invoice, error) {
	return s.CreatePlanInvoice(ctx, seller, store.PlanCodePro, network)
}

func (s *InvoiceService) CreatePlanInvoice(ctx context.Context, seller store.Seller, planCode store.PlanCode, network store.Network) (store.Invoice, error) {
	return s.CreatePlanInvoiceWithPrice(ctx, seller, planCode, network, nil)
}

func (s *InvoiceService) CreatePlanInvoiceWithPrice(ctx context.Context, seller store.Seller, planCode store.PlanCode, network store.Network, overridePriceUSD *decimal.Decimal) (store.Invoice, error) {
	source := metrics.SourceFromContext(ctx)
	planCode = store.NormalizePlanCode(string(planCode))
	if seller.IsBlocked {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindSubscription), string(network), string(planCode), "failure", "seller_blocked")
		return store.Invoice{}, errors.New("seller account is blocked")
	}
	plan := store.ResolvePlan(planCode)
	if plan.Code == store.PlanCodeTrial {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindSubscription), string(network), string(plan.Code), "failure", "trial_plan")
		return store.Invoice{}, errors.New("trial does not require billing")
	}
	if !network.IsSupportedPayableNetwork() {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindSubscription), string(network), string(plan.Code), "failure", "unsupported_network")
		return store.Invoice{}, fmt.Errorf("unsupported network %s", network)
	}
	baseAmountUSD := plan.PriceUSD
	if overridePriceUSD != nil {
		baseAmountUSD = overridePriceUSD.Round(6)
	}
	if !baseAmountUSD.IsPositive() {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindSubscription), string(network), string(plan.Code), "failure", "invalid_price")
		return store.Invoice{}, errors.New("subscription price must be positive")
	}
	address, ok := reqstBillingWallets[network.WalletBucket()]
	if !ok || strings.TrimSpace(address) == "" {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindSubscription), string(network), string(plan.Code), "failure", "billing_wallet_missing")
		return store.Invoice{}, fmt.Errorf("billing wallet is not configured for network %s", network)
	}

	invoice, err := s.createInvoiceWithDestination(ctx, store.CreateInvoiceParams{
		SellerID:           seller.ID,
		Kind:               store.InvoiceKindSubscription,
		SubscriptionDays:   plan.BillingDays,
		PlanCode:           plan.Code,
		CountTowardsTrial:  false,
		Title:              plan.CheckoutTitle,
		BaseAmountUSD:      baseAmountUSD,
		PayableNetwork:     network,
		DestinationAddress: address,
		Mode:               "live",
	}, 60)
	if err != nil {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindSubscription), string(network), string(plan.Code), "failure", "create_invoice")
		return store.Invoice{}, err
	}
	metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindSubscription), string(invoice.PayableNetwork), string(plan.Code), "success", "created")
	return invoice, nil
}

func normalizedMode(mode string) string {
	if strings.EqualFold(strings.TrimSpace(mode), "test") {
		return "test"
	}
	return "live"
}

func (s *InvoiceService) createInvoiceWithDestination(ctx context.Context, params store.CreateInvoiceParams, expiresInMinutes int) (store.Invoice, error) {
	publicID, err := s.generateUniquePublicID(ctx)
	if err != nil {
		return store.Invoice{}, err
	}

	var payableAmount decimal.Decimal
	var paymentComment *string
	var matchingSuffix *decimal.Decimal

	switch params.PayableNetwork {
	case store.NetworkTON:
		payableAmount, err = s.calculateTONAmount(ctx, params.BaseAmountUSD)
		if err != nil {
			return store.Invoice{}, err
		}
		comment := "REQST-" + publicID
		paymentComment = &comment
	case store.NetworkTRON, store.NetworkSOLANA, store.NetworkEVM, store.NetworkBASE, store.NetworkARBITRUM, store.NetworkBSC:
		suffix, err := s.generateUniqueSuffix(ctx, params.DestinationAddress, params.PayableNetwork)
		if err != nil {
			return store.Invoice{}, err
		}
		payableAmount = params.BaseAmountUSD.Add(suffix).Round(6)
		matchingSuffix = &suffix
	default:
		return store.Invoice{}, fmt.Errorf("unsupported network %s", params.PayableNetwork)
	}

	if expiresInMinutes <= 0 {
		expiresInMinutes = 30
	}
	params.PublicID = publicID
	params.PayableAmount = payableAmount
	params.PaymentComment = paymentComment
	params.MatchingSuffix = matchingSuffix
	params.ExpiresAt = time.Now().UTC().Add(time.Duration(expiresInMinutes) * time.Minute)
	if params.Kind == "" {
		params.Kind = store.InvoiceKindMerchant
	}
	return s.store.CreateInvoice(ctx, params)
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
		n, err := rand.Int(rand.Reader, big.NewInt(9999))
		if err != nil {
			return decimal.Zero, fmt.Errorf("random suffix: %w", err)
		}

		// Keep the matching suffix tiny so the checkout amount stays visually close to the base price.
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
			metrics.ObserveUpstream("ton_rate_override", "parse", "failure", 0)
			return decimal.Zero, fmt.Errorf("TON_USD_RATE: %w", err)
		}
		metrics.ObserveUpstream("ton_rate_override", "parse", "success", 0)
		return value, nil
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd", nil)
	if err != nil {
		return decimal.Zero, fmt.Errorf("build ton rate request: %w", err)
	}
	startedAt := time.Now()
	resp, err := s.httpClient.Do(req)
	if err != nil {
		metrics.ObserveUpstream("coingecko", "ton_rate", "failure", time.Since(startedAt))
		return decimal.Zero, fmt.Errorf("fetch ton rate: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		metrics.ObserveUpstream("coingecko", "ton_rate", "failure", time.Since(startedAt))
		return decimal.Zero, fmt.Errorf("fetch ton rate failed: %s", strings.TrimSpace(string(body)))
	}

	var payload struct {
		TheOpenNetwork struct {
			USD json.Number `json:"usd"`
		} `json:"the-open-network"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		metrics.ObserveUpstream("coingecko", "ton_rate", "failure", time.Since(startedAt))
		return decimal.Zero, fmt.Errorf("decode ton rate: %w", err)
	}
	value, err := decimal.NewFromString(payload.TheOpenNetwork.USD.String())
	if err != nil {
		metrics.ObserveUpstream("coingecko", "ton_rate", "failure", time.Since(startedAt))
		return decimal.Zero, fmt.Errorf("parse ton rate: %w", err)
	}
	metrics.ObserveUpstream("coingecko", "ton_rate", "success", time.Since(startedAt))
	return value, nil
}
