package watcher

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"reqst/backend/internal/config"
	"reqst/backend/internal/service"
	"reqst/backend/internal/store"

	"github.com/shopspring/decimal"
)

type Watcher struct {
	store          *store.Store
	paymentService *service.PaymentService
	cfg            config.Config
	httpClient     *http.Client
	logger         *slog.Logger
}

func New(st *store.Store, paymentService *service.PaymentService, cfg config.Config, logger *slog.Logger) *Watcher {
	return &Watcher{
		store:          st,
		paymentService: paymentService,
		cfg:            cfg,
		logger:         logger,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (w *Watcher) Run(ctx context.Context) error {
	ticker := time.NewTicker(w.cfg.WatcherPollInterval)
	defer ticker.Stop()

	for {
		if err := w.tick(ctx); err != nil {
			w.logger.Error("watcher tick failed", "error", err)
		}

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
		}
	}
}

func (w *Watcher) tick(ctx context.Context) error {
	expired, err := w.store.ExpireOverdueInvoices(ctx)
	if err != nil {
		return err
	}
	if expired > 0 {
		w.logger.Info("expired invoices", "count", expired)
	}

	wallets, err := w.store.GetWatchedWallets(ctx)
	if err != nil {
		return err
	}

	for _, wallet := range wallets {
		var transfers []store.ObservedTransfer
		switch wallet.PollNetwork {
		case store.NetworkTRON:
			transfers, err = w.pollTRC20(ctx, wallet)
		case store.NetworkTON:
			transfers, err = w.pollTON(ctx, wallet)
		default:
			continue
		}
		if err != nil {
			w.logger.Warn("wallet poll failed", "network", wallet.PayableNetwork, "address", wallet.Address, "error", err)
			continue
		}

		for _, transfer := range transfers {
			result, err := w.paymentService.ProcessObservedTransfer(ctx, transfer)
			if err != nil {
				w.logger.Warn("process observed transfer failed", "tx_hash", transfer.TxHash, "error", err)
				continue
			}
			if result.Classification != "duplicate" && result.Classification != "unmatched" {
				w.logger.Info("classified transfer", "tx_hash", transfer.TxHash, "classification", result.Classification)
			}
		}
	}
	return nil
}

func (w *Watcher) pollTRC20(ctx context.Context, wallet store.WatchedWallet) ([]store.ObservedTransfer, error) {
	base := strings.TrimRight(w.cfg.TronGridBaseURL, "/")
	query := url.Values{}
	query.Set("only_to", "true")
	query.Set("limit", "50")

	endpoint := fmt.Sprintf("%s/v1/accounts/%s/transactions/trc20?%s", base, wallet.Address, query.Encode())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	if w.cfg.TronGridAPIKey != "" {
		req.Header.Set("TRON-PRO-API-KEY", w.cfg.TronGridAPIKey)
	}

	resp, err := w.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return nil, fmt.Errorf("trongrid error: %s", strings.TrimSpace(string(body)))
	}

	var payload struct {
		Data []struct {
			TransactionID string `json:"transaction_id"`
			To            string `json:"to"`
			Value         string `json:"value"`
			BlockTime     int64  `json:"block_timestamp"`
			TokenInfo     struct {
				Symbol   string `json:"symbol"`
				Decimals int32  `json:"decimals"`
			} `json:"token_info"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("decode trongrid: %w", err)
	}

	var transfers []store.ObservedTransfer
	for _, item := range payload.Data {
		if !strings.EqualFold(item.TokenInfo.Symbol, "USDT") {
			continue
		}

		rawAmount, err := decimal.NewFromString(item.Value)
		if err != nil {
			continue
		}
		scale := decimal.NewFromInt(10).Pow(decimal.NewFromInt32(item.TokenInfo.Decimals))
		amount := rawAmount.Div(scale).Round(6)

		raw, _ := json.Marshal(item)
		transfer := store.ObservedTransfer{
			TxHash:             item.TransactionID,
			Network:            wallet.PayableNetwork,
			DestinationAddress: item.To,
			Amount:             amount,
			ObservedAt:         time.UnixMilli(item.BlockTime).UTC(),
			RawPayload:         raw,
		}
		if err := service.NormalizeObservedTransfer(&transfer); err != nil {
			continue
		}
		transfers = append(transfers, transfer)
	}
	return transfers, nil
}

func (w *Watcher) pollTON(ctx context.Context, wallet store.WatchedWallet) ([]store.ObservedTransfer, error) {
	base := strings.TrimRight(w.cfg.TonCenterBaseURL, "/")
	endpoint := fmt.Sprintf("%s/getTransactions?address=%s&limit=30&archival=true", base, url.QueryEscape(wallet.Address))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	if w.cfg.TonCenterAPIKey != "" {
		req.Header.Set("X-API-Key", w.cfg.TonCenterAPIKey)
	}

	resp, err := w.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return nil, fmt.Errorf("toncenter error: %s", strings.TrimSpace(string(body)))
	}

	var payload struct {
		OK     bool `json:"ok"`
		Result []struct {
			UTime int64 `json:"utime"`
			TxID  struct {
				Hash string `json:"hash"`
			} `json:"transaction_id"`
			InMsg struct {
				Value   string `json:"value"`
				Message string `json:"message"`
			} `json:"in_msg"`
		} `json:"result"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("decode toncenter: %w", err)
	}

	var transfers []store.ObservedTransfer
	for _, item := range payload.Result {
		nanoTons, err := decimal.NewFromString(item.InMsg.Value)
		if err != nil {
			continue
		}
		amount := nanoTons.Div(decimal.NewFromInt(1_000_000_000)).Round(6)
		raw, _ := json.Marshal(item)

		transfer := store.ObservedTransfer{
			TxHash:             item.TxID.Hash,
			Network:            wallet.PayableNetwork,
			DestinationAddress: wallet.Address,
			Amount:             amount,
			PaymentComment:     strings.TrimSpace(item.InMsg.Message),
			ObservedAt:         time.Unix(item.UTime, 0).UTC(),
			RawPayload:         raw,
		}
		if err := service.NormalizeObservedTransfer(&transfer); err != nil {
			continue
		}
		transfers = append(transfers, transfer)
	}
	return transfers, nil
}

func parseTronTimestamp(value any) time.Time {
	switch v := value.(type) {
	case int64:
		return time.UnixMilli(v).UTC()
	case float64:
		return time.UnixMilli(int64(v)).UTC()
	case string:
		parsed, _ := strconv.ParseInt(v, 10, 64)
		return time.UnixMilli(parsed).UTC()
	default:
		return time.Time{}
	}
}
