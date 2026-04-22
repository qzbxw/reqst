package watcher

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strings"
	"time"

	"reqst/backend/internal/config"
	"reqst/backend/internal/metrics"
	"reqst/backend/internal/service"
	"reqst/backend/internal/store"

	"github.com/shopspring/decimal"
)

const erc20TransferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55aebf523b3ef"

type stablecoinSpec struct {
	Symbol      string
	Decimals    int32
	EVMContract string
	SolanaMint  string
}

func stablecoinForNetwork(network store.Network) stablecoinSpec {
	switch network {
	case store.NetworkEVM:
		return stablecoinSpec{
			Symbol:      "USDT",
			Decimals:    6,
			EVMContract: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		}
	case store.NetworkBASE:
		return stablecoinSpec{
			Symbol:      "USDT",
			Decimals:    6,
			EVMContract: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
		}
	case store.NetworkARBITRUM:
		return stablecoinSpec{
			Symbol:      "USDT",
			Decimals:    6,
			EVMContract: "0xFd086bC7CD5C481DCC9C85ebe478A1C0b69FCbb9",
		}
	case store.NetworkBSC:
		return stablecoinSpec{
			Symbol:      "USDT",
			Decimals:    18,
			EVMContract: "0x55d398326f99059fF775485246999027B3197955",
		}
	case store.NetworkSOLANA:
		return stablecoinSpec{
			Symbol:     "USDT",
			Decimals:   6,
			SolanaMint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
		}
	default:
		return stablecoinSpec{}
	}
}

func (w *Watcher) pollEVMStablecoin(ctx context.Context, wallet store.WatchedWallet) ([]store.ObservedTransfer, error) {
	spec := stablecoinForNetwork(wallet.PayableNetwork)
	if spec.EVMContract == "" {
		return nil, fmt.Errorf("stablecoin contract is not configured for network %s", wallet.PayableNetwork)
	}
	rpcURL := w.evmRPCURL(wallet.PayableNetwork)
	if rpcURL == "" {
		return nil, fmt.Errorf("rpc url is not configured for network %s", wallet.PayableNetwork)
	}

	latestBlockHex, err := w.callEVMRPCString(ctx, rpcURL, wallet.PayableNetwork, "eth_blockNumber", []any{})
	if err != nil {
		return nil, err
	}
	latestBlock, err := parseHexInt(latestBlockHex)
	if err != nil {
		return nil, fmt.Errorf("parse latest evm block: %w", err)
	}
	toBlock := latestBlock - w.cfg.EVMConfirmationDepth
	if toBlock < 0 {
		return nil, nil
	}
	fromBlock := toBlock - w.cfg.WatcherBackfillBlocks
	checkpoint, err := w.store.GetWatcherCheckpoint(ctx, wallet.PollNetwork, wallet.PayableNetwork, wallet.Address)
	if err == nil && checkpoint.LastBlock > 0 {
		fromBlock = checkpoint.LastBlock + 1
	}
	if fromBlock < 0 {
		fromBlock = 0
	}
	if fromBlock > toBlock {
		return nil, nil
	}

	filter := map[string]any{
		"fromBlock": hexQuantity(fromBlock),
		"toBlock":   hexQuantity(toBlock),
		"address":   spec.EVMContract,
		"topics":    []any{erc20TransferTopic, nil, paddedEVMTopic(wallet.Address)},
	}
	var logs []struct {
		Address     string   `json:"address"`
		Topics      []string `json:"topics"`
		Data        string   `json:"data"`
		BlockNumber string   `json:"blockNumber"`
		TxHash      string   `json:"transactionHash"`
		LogIndex    string   `json:"logIndex"`
		Removed     bool     `json:"removed"`
	}
	if err := w.callEVMRPC(ctx, rpcURL, wallet.PayableNetwork, "eth_getLogs", []any{filter}, &logs); err != nil {
		return nil, err
	}

	blockTimestamps := map[string]time.Time{}
	transfers := make([]store.ObservedTransfer, 0, len(logs))
	for _, item := range logs {
		if item.Removed {
			continue
		}
		amount, err := hexAmountToDecimal(item.Data, spec.Decimals)
		if err != nil || !amount.IsPositive() {
			continue
		}
		observedAt, ok := blockTimestamps[item.BlockNumber]
		if !ok {
			observedAt, err = w.evmBlockTimestamp(ctx, rpcURL, item.BlockNumber)
			if err != nil {
				continue
			}
			blockTimestamps[item.BlockNumber] = observedAt
		}
		raw, _ := json.Marshal(item)
		transfer := store.ObservedTransfer{
			TxHash:             fmt.Sprintf("%s:%s", item.TxHash, item.LogIndex),
			Network:            wallet.PayableNetwork,
			DestinationAddress: wallet.Address,
			Amount:             amount.Round(6),
			ObservedAt:         observedAt,
			RawPayload:         raw,
		}
		if err := service.NormalizeObservedTransfer(&transfer); err != nil {
			continue
		}
		transfers = append(transfers, transfer)
	}
	transfers = w.filterTransfersAfterCheckpoint(ctx, wallet, transfers, toBlock)
	return transfers, nil
}

func (w *Watcher) pollSolanaStablecoin(ctx context.Context, wallet store.WatchedWallet) ([]store.ObservedTransfer, error) {
	spec := stablecoinForNetwork(wallet.PayableNetwork)
	if spec.SolanaMint == "" {
		return nil, fmt.Errorf("solana stablecoin mint is not configured")
	}
	var tokenAccounts struct {
		Value []struct {
			Pubkey string `json:"pubkey"`
		} `json:"value"`
	}
	if err := w.callSolanaRPC(ctx, w.cfg.SolanaRPCURL, "getTokenAccountsByOwner", []any{
		wallet.Address,
		map[string]any{"mint": spec.SolanaMint},
		map[string]any{"encoding": "jsonParsed", "commitment": "finalized"},
	}, &tokenAccounts); err != nil {
		return nil, err
	}

	transfers := make([]store.ObservedTransfer, 0)
	for _, account := range tokenAccounts.Value {
		var signatures []struct {
			Signature string `json:"signature"`
			BlockTime *int64 `json:"blockTime"`
		}
		if err := w.callSolanaRPC(ctx, w.cfg.SolanaRPCURL, "getSignaturesForAddress", []any{
			account.Pubkey,
			map[string]any{"limit": 25, "commitment": "finalized"},
		}, &signatures); err != nil {
			continue
		}

		for _, signature := range signatures {
			var tx struct {
				BlockTime *int64 `json:"blockTime"`
				Meta      struct {
					PreTokenBalances  []solanaTokenBalance `json:"preTokenBalances"`
					PostTokenBalances []solanaTokenBalance `json:"postTokenBalances"`
				} `json:"meta"`
			}
			if err := w.callSolanaRPC(ctx, w.cfg.SolanaRPCURL, "getTransaction", []any{
				signature.Signature,
				map[string]any{"encoding": "jsonParsed", "maxSupportedTransactionVersion": 0, "commitment": "finalized"},
			}, &tx); err != nil {
				continue
			}

			diffs := computeSolanaBalanceDiffs(wallet.Address, spec.SolanaMint, tx.Meta.PreTokenBalances, tx.Meta.PostTokenBalances)
			for accountIndex, amount := range diffs {
				if !amount.IsPositive() {
					continue
				}
				observedAt := time.Now().UTC()
				if tx.BlockTime != nil {
					observedAt = time.Unix(*tx.BlockTime, 0).UTC()
				} else if signature.BlockTime != nil {
					observedAt = time.Unix(*signature.BlockTime, 0).UTC()
				}
				raw, _ := json.Marshal(tx)
				transfer := store.ObservedTransfer{
					TxHash:             fmt.Sprintf("%s:%d", signature.Signature, accountIndex),
					Network:            wallet.PayableNetwork,
					DestinationAddress: wallet.Address,
					Amount:             amount.Round(6),
					ObservedAt:         observedAt,
					RawPayload:         raw,
				}
				if err := service.NormalizeObservedTransfer(&transfer); err != nil {
					continue
				}
				transfers = append(transfers, transfer)
			}
		}
	}
	transfers = w.filterTransfersAfterCheckpoint(ctx, wallet, transfers, 0)
	return transfers, nil
}

type solanaTokenBalance struct {
	AccountIndex  int    `json:"accountIndex"`
	Mint          string `json:"mint"`
	Owner         string `json:"owner"`
	UITokenAmount struct {
		Amount string `json:"amount"`
	} `json:"uiTokenAmount"`
}

func computeSolanaBalanceDiffs(owner string, mint string, pre []solanaTokenBalance, post []solanaTokenBalance) map[int]decimal.Decimal {
	preMap := map[int]decimal.Decimal{}
	postMap := map[int]decimal.Decimal{}

	for _, item := range pre {
		if !strings.EqualFold(item.Owner, owner) || item.Mint != mint {
			continue
		}
		if value, err := decimal.NewFromString(item.UITokenAmount.Amount); err == nil {
			preMap[item.AccountIndex] = value
		}
	}
	for _, item := range post {
		if !strings.EqualFold(item.Owner, owner) || item.Mint != mint {
			continue
		}
		if value, err := decimal.NewFromString(item.UITokenAmount.Amount); err == nil {
			postMap[item.AccountIndex] = value
		}
	}

	diffs := map[int]decimal.Decimal{}
	for accountIndex, after := range postMap {
		before := preMap[accountIndex]
		diff := after.Sub(before).Div(decimal.NewFromInt(1_000_000))
		if diff.IsPositive() {
			diffs[accountIndex] = diff
		}
	}
	return diffs
}

func (w *Watcher) evmRPCURL(network store.Network) string {
	switch network {
	case store.NetworkEVM:
		return w.cfg.EthereumRPCURL
	case store.NetworkBASE:
		return w.cfg.BaseRPCURL
	case store.NetworkARBITRUM:
		return w.cfg.ArbitrumRPCURL
	case store.NetworkBSC:
		return w.cfg.BSCRPCURL
	default:
		return ""
	}
}

func (w *Watcher) evmBlockTimestamp(ctx context.Context, rpcURL string, blockNumber string) (time.Time, error) {
	var block struct {
		Timestamp string `json:"timestamp"`
	}
	if err := w.callEVMRPC(ctx, rpcURL, networkFromRPCURL(rpcURL, w.cfg), "eth_getBlockByNumber", []any{blockNumber, false}, &block); err != nil {
		return time.Time{}, err
	}
	timestamp, err := parseHexInt(block.Timestamp)
	if err != nil {
		return time.Time{}, err
	}
	return time.Unix(timestamp, 0).UTC(), nil
}

func (w *Watcher) callEVMRPCString(ctx context.Context, rpcURL string, network store.Network, method string, params []any) (string, error) {
	var result string
	if err := w.callEVMRPC(ctx, rpcURL, network, method, params, &result); err != nil {
		return "", err
	}
	return result, nil
}

func (w *Watcher) callEVMRPC(ctx context.Context, rpcURL string, network store.Network, method string, params []any, target any) error {
	startedAt := time.Now()
	err := w.callJSONRPC(ctx, rpcURL, method, params, target)
	metrics.ObserveRPC("evm", string(network), method, ternaryWatcherResult(err), time.Since(startedAt))
	return err
}

func (w *Watcher) callSolanaRPC(ctx context.Context, rpcURL string, method string, params []any, target any) error {
	startedAt := time.Now()
	err := w.callJSONRPC(ctx, rpcURL, method, params, target)
	metrics.ObserveRPC("solana", string(store.NetworkSOLANA), method, ternaryWatcherResult(err), time.Since(startedAt))
	return err
}

func (w *Watcher) callJSONRPC(ctx context.Context, rpcURL string, method string, params []any, target any) error {
	body, err := json.Marshal(map[string]any{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  method,
		"params":  params,
	})
	if err != nil {
		return fmt.Errorf("marshal json rpc request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, rpcURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := w.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		payload, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return fmt.Errorf("json rpc error: %s", strings.TrimSpace(string(payload)))
	}

	var response struct {
		Result json.RawMessage `json:"result"`
		Error  *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return fmt.Errorf("decode json rpc response: %w", err)
	}
	if response.Error != nil {
		return fmt.Errorf("json rpc method %s failed: %s", method, response.Error.Message)
	}
	if target == nil {
		return nil
	}
	if err := json.Unmarshal(response.Result, target); err != nil {
		return fmt.Errorf("decode json rpc result: %w", err)
	}
	return nil
}

func parseHexInt(value string) (int64, error) {
	value = strings.TrimSpace(strings.ToLower(value))
	value = strings.TrimPrefix(value, "0x")
	if value == "" {
		return 0, nil
	}
	parsed := new(big.Int)
	if _, ok := parsed.SetString(value, 16); !ok {
		return 0, fmt.Errorf("invalid hex quantity")
	}
	return parsed.Int64(), nil
}

func hexQuantity(value int64) string {
	return fmt.Sprintf("0x%x", value)
}

func paddedEVMTopic(address string) string {
	address = strings.TrimSpace(strings.ToLower(strings.TrimPrefix(address, "0x")))
	return "0x000000000000000000000000" + address
}

func hexAmountToDecimal(raw string, decimals int32) (decimal.Decimal, error) {
	value := strings.TrimPrefix(strings.TrimSpace(raw), "0x")
	if value == "" {
		return decimal.Zero, nil
	}
	parsed := new(big.Int)
	if _, ok := parsed.SetString(value, 16); !ok {
		return decimal.Zero, fmt.Errorf("invalid amount hex")
	}
	amount, err := decimal.NewFromString(parsed.String())
	if err != nil {
		return decimal.Zero, err
	}
	scale := decimal.NewFromInt(10).Pow(decimal.NewFromInt32(decimals))
	return amount.Div(scale), nil
}

func ternaryWatcherResult(err error) string {
	if err != nil {
		return "failure"
	}
	return "success"
}

func networkFromRPCURL(rpcURL string, cfg config.Config) store.Network {
	switch rpcURL {
	case cfg.EthereumRPCURL:
		return store.NetworkEVM
	case cfg.BaseRPCURL:
		return store.NetworkBASE
	case cfg.ArbitrumRPCURL:
		return store.NetworkARBITRUM
	case cfg.BSCRPCURL:
		return store.NetworkBSC
	default:
		return store.NetworkEVM
	}
}
