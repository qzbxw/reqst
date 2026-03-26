package watcher

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"reqst/backend/internal/config"
	"reqst/backend/internal/store"

	"github.com/shopspring/decimal"
)

func TestStablecoinForNetwork(t *testing.T) {
	cases := map[store.Network]string{
		store.NetworkEVM:      "USDT",
		store.NetworkBASE:     "USDT",
		store.NetworkARBITRUM: "USDT",
		store.NetworkBSC:      "USDT",
		store.NetworkSOLANA:   "USDT",
	}
	for network, symbol := range cases {
		spec := stablecoinForNetwork(network)
		if spec.Symbol != symbol {
			t.Fatalf("network %s expected %s, got %s", network, symbol, spec.Symbol)
		}
	}
}

func TestComputeSolanaBalanceDiffs(t *testing.T) {
	pre := []solanaTokenBalance{
		{AccountIndex: 1, Mint: "mint-a", Owner: "owner-1", UITokenAmount: struct {
			Amount string "json:\"amount\""
		}{Amount: "5000000"}},
	}
	post := []solanaTokenBalance{
		{AccountIndex: 1, Mint: "mint-a", Owner: "owner-1", UITokenAmount: struct {
			Amount string "json:\"amount\""
		}{Amount: "8000000"}},
		{AccountIndex: 2, Mint: "mint-a", Owner: "owner-2", UITokenAmount: struct {
			Amount string "json:\"amount\""
		}{Amount: "9999999"}},
	}
	diffs := computeSolanaBalanceDiffs("owner-1", "mint-a", pre, post)
	if len(diffs) != 1 {
		t.Fatalf("expected 1 diff, got %d", len(diffs))
	}
	if !diffs[1].Equal(decimal.RequireFromString("3")) {
		t.Fatalf("unexpected diff: %s", diffs[1])
	}
}

func TestHexHelpers(t *testing.T) {
	if got := paddedEVMTopic("0x1234"); got != "0x0000000000000000000000001234" {
		t.Fatalf("unexpected padded topic: %s", got)
	}
	value, err := parseHexInt("0x10")
	if err != nil || value != 16 {
		t.Fatalf("unexpected parseHexInt result: %d %v", value, err)
	}
	amount, err := hexAmountToDecimal("0xf4240", 6)
	if err != nil {
		t.Fatalf("hexAmountToDecimal returned error: %v", err)
	}
	if !amount.Equal(decimal.RequireFromString("1")) {
		t.Fatalf("unexpected amount: %s", amount)
	}
}

func TestPollEVMStablecoin(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		var payload struct {
			Method string `json:"method"`
		}
		_ = json.Unmarshal(body, &payload)

		switch payload.Method {
		case "eth_blockNumber":
			_ = json.NewEncoder(w).Encode(map[string]any{"jsonrpc": "2.0", "id": 1, "result": "0x64"})
		case "eth_getLogs":
			_ = json.NewEncoder(w).Encode(map[string]any{
				"jsonrpc": "2.0",
				"id":      1,
				"result": []map[string]any{
					{
						"address":         "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
						"topics":          []string{erc20TransferTopic},
						"data":            "0xf4240",
						"blockNumber":     "0x64",
						"transactionHash": "0xabc",
						"logIndex":        "0x1",
						"removed":         false,
					},
				},
			})
		case "eth_getBlockByNumber":
			_ = json.NewEncoder(w).Encode(map[string]any{
				"jsonrpc": "2.0",
				"id":      1,
				"result":  map[string]any{"timestamp": "0x65f4f100"},
			})
		default:
			t.Fatalf("unexpected rpc method: %s", payload.Method)
		}
	}))
	defer server.Close()

	w := &Watcher{
		cfg: config.Config{BaseRPCURL: server.URL},
		httpClient: &http.Client{
			Timeout: 2 * time.Second,
		},
		logger: slog.New(slog.NewTextHandler(os.Stdout, nil)),
	}

	transfers, err := w.pollEVMStablecoin(context.Background(), store.WatchedWallet{
		PayableNetwork: store.NetworkBASE,
		Address:        "0x1111111111111111111111111111111111111111",
	})
	if err != nil {
		t.Fatalf("pollEVMStablecoin returned error: %v", err)
	}
	if len(transfers) != 1 {
		t.Fatalf("expected 1 transfer, got %d", len(transfers))
	}
	if transfers[0].TxHash != "0xabc:0x1" {
		t.Fatalf("unexpected tx hash: %s", transfers[0].TxHash)
	}
	if !transfers[0].Amount.Equal(decimal.RequireFromString("1.000000")) {
		t.Fatalf("unexpected amount: %s", transfers[0].Amount)
	}
}

func TestPollSolanaStablecoin(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		var payload struct {
			Method string `json:"method"`
		}
		_ = json.Unmarshal(body, &payload)

		switch payload.Method {
		case "getTokenAccountsByOwner":
			_ = json.NewEncoder(w).Encode(map[string]any{
				"jsonrpc": "2.0",
				"id":      1,
				"result": map[string]any{
					"value": []map[string]any{
						{"pubkey": "token-account-1"},
					},
				},
			})
		case "getSignaturesForAddress":
			_ = json.NewEncoder(w).Encode(map[string]any{
				"jsonrpc": "2.0",
				"id":      1,
				"result": []map[string]any{
					{"signature": "sig-1", "blockTime": 1710000000},
				},
			})
		case "getTransaction":
			_ = json.NewEncoder(w).Encode(map[string]any{
				"jsonrpc": "2.0",
				"id":      1,
				"result": map[string]any{
					"blockTime": 1710000000,
					"meta": map[string]any{
						"preTokenBalances": []map[string]any{
							{
								"accountIndex": 1,
								"mint":         stablecoinForNetwork(store.NetworkSOLANA).SolanaMint,
								"owner":        "owner-sol",
								"uiTokenAmount": map[string]any{
									"amount": "1000000",
								},
							},
						},
						"postTokenBalances": []map[string]any{
							{
								"accountIndex": 1,
								"mint":         stablecoinForNetwork(store.NetworkSOLANA).SolanaMint,
								"owner":        "owner-sol",
								"uiTokenAmount": map[string]any{
									"amount": "3500000",
								},
							},
						},
					},
				},
			})
		default:
			t.Fatalf("unexpected rpc method: %s", payload.Method)
		}
	}))
	defer server.Close()

	w := &Watcher{
		cfg: config.Config{SolanaRPCURL: server.URL},
		httpClient: &http.Client{
			Timeout: 2 * time.Second,
		},
		logger: slog.New(slog.NewTextHandler(os.Stdout, nil)),
	}

	transfers, err := w.pollSolanaStablecoin(context.Background(), store.WatchedWallet{
		PayableNetwork: store.NetworkSOLANA,
		Address:        "owner-sol",
	})
	if err != nil {
		t.Fatalf("pollSolanaStablecoin returned error: %v", err)
	}
	if len(transfers) != 1 {
		t.Fatalf("expected 1 transfer, got %d", len(transfers))
	}
	if !strings.HasPrefix(transfers[0].TxHash, "sig-1:") {
		t.Fatalf("unexpected tx hash: %s", transfers[0].TxHash)
	}
	if !transfers[0].Amount.Equal(decimal.RequireFromString("2.500000")) {
		t.Fatalf("unexpected amount: %s", transfers[0].Amount)
	}
}

func TestEVMRPCURL(t *testing.T) {
	w := &Watcher{
		cfg: config.Config{
			EthereumRPCURL: "eth",
			BaseRPCURL:     "base",
			ArbitrumRPCURL: "arb",
			BSCRPCURL:      "bsc",
		},
	}
	if got := w.evmRPCURL(store.NetworkEVM); got != "eth" {
		t.Fatalf("unexpected ethereum rpc url: %s", got)
	}
	if got := w.evmRPCURL(store.NetworkBASE); got != "base" {
		t.Fatalf("unexpected base rpc url: %s", got)
	}
	if got := w.evmRPCURL(store.NetworkARBITRUM); got != "arb" {
		t.Fatalf("unexpected arbitrum rpc url: %s", got)
	}
	if got := w.evmRPCURL(store.NetworkBSC); got != "bsc" {
		t.Fatalf("unexpected bsc rpc url: %s", got)
	}
	if got := w.evmRPCURL(store.NetworkTON); got != "" {
		t.Fatalf("unexpected rpc url for ton: %s", got)
	}
}

func TestCallJSONRPCReportsError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"jsonrpc": "2.0",
			"id":      1,
			"error": map[string]any{
				"message": "upstream failed",
			},
		})
	}))
	defer server.Close()

	w := &Watcher{
		httpClient: &http.Client{Timeout: time.Second},
	}
	var result any
	err := w.callJSONRPC(context.Background(), server.URL, "test_method", nil, &result)
	if err == nil || !strings.Contains(err.Error(), "upstream failed") {
		t.Fatalf("expected upstream error, got %v", err)
	}
}
