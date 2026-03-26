package telegram

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"reqst/backend/internal/store"
)

func TestBotWorkerHelpers(t *testing.T) {
	telegramID := int64(42)
	worker := &BotWorker{
		publicAppURL: "https://reqst.test/app/",
		sessions:     map[int64]*botSession{},
	}

	if got := sellerTelegramLabel(nil); got != "unlinked" {
		t.Fatalf("expected unlinked label, got %q", got)
	}
	if got := sellerTelegramLabel(&telegramID); got != "42" {
		t.Fatalf("expected telegram label 42, got %q", got)
	}

	keyboard := worker.reqstKeyboard([][]tgInlineKeyboardButton{{{Text: "Home", CallbackData: "nav:home"}}})
	if len(keyboard.InlineKeyboard) != 2 {
		t.Fatalf("expected reqst row to be appended, got %#v", keyboard.InlineKeyboard)
	}
	if keyboard.InlineKeyboard[1][0].URL != "https://reqst.test/app" {
		t.Fatalf("unexpected reqst button URL: %q", keyboard.InlineKeyboard[1][0].URL)
	}

	payload := notificationPayload{
		PublicID: "INV123",
		InvoiceActions: []notificationAction{
			{Kind: "callback", Text: "Mark paid", Data: "invoice:paid:1"},
			{Kind: "url", Text: "Open", URL: "https://example.com/hook"},
		},
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("json.Marshal returned error: %v", err)
	}
	notificationKeyboard := worker.notificationKeyboard(raw)
	if len(notificationKeyboard.InlineKeyboard) < 3 {
		t.Fatalf("expected action rows and checkout row, got %#v", notificationKeyboard.InlineKeyboard)
	}

	if got := worker.walletAddressPrompt(store.NetworkEVM); !strings.Contains(got, "shared EVM wallet") {
		t.Fatalf("unexpected EVM prompt: %q", got)
	}
	if got := worker.invoiceAmountPrompt(botInvoiceDraft{WalletLabel: "Main", Title: "Pro Plan"}); !strings.Contains(got, "Step 2/3") {
		t.Fatalf("unexpected amount prompt: %q", got)
	}
	if got := worker.invoiceLifetimePrompt(botInvoiceDraft{WalletLabel: "Main", Title: "Pro Plan", Amount: "39"}); !strings.Contains(got, "39 USD") {
		t.Fatalf("unexpected lifetime prompt: %q", got)
	}

	session := worker.session(10)
	session.MenuMessageID = 55
	if worker.session(10).MenuMessageID != 55 {
		t.Fatal("expected session to be reused")
	}
	worker.resetSession(10)
	if worker.session(10).MenuMessageID != 0 {
		t.Fatal("expected session to be reset")
	}

	if got := worker.appURL("/checkout/INV123"); got != "https://reqst.test/app/checkout/INV123" {
		t.Fatalf("unexpected app URL: %q", got)
	}
	if got := shortAddress("0x1111111111111111111111111111111111111111"); got != "0x1111...111111" {
		t.Fatalf("unexpected short address: %q", got)
	}
	if got := valueOrFallback("   ", "fallback"); got != "fallback" {
		t.Fatalf("expected fallback, got %q", got)
	}
	if networks := payableNetworksForWallet(store.NetworkEVM); len(networks) != 4 {
		t.Fatalf("expected 4 payable networks for EVM wallet, got %#v", networks)
	}
	if got := networkButtonLabel(store.NetworkBASE); got != "BASE / USDT" {
		t.Fatalf("unexpected network label: %q", got)
	}
}

func TestBotWorkerTelegramAPIHelpers(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case strings.HasSuffix(r.URL.Path, "/getUpdates"):
			_, _ = w.Write([]byte(`{"ok":true,"result":[{"update_id":1}]}`))
		case strings.HasSuffix(r.URL.Path, "/sendMessage"):
			_, _ = w.Write([]byte(`{"ok":true,"result":{"message_id":77}}`))
		case strings.HasSuffix(r.URL.Path, "/editMessageText"):
			_, _ = w.Write([]byte(`{"ok":true,"result":true}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	worker := &BotWorker{
		token:      "bot-token",
		httpClient: rewriteTelegramHTTPClient(t, server),
		sessions:   map[int64]*botSession{},
	}

	updates, err := worker.getUpdates(context.Background())
	if err != nil {
		t.Fatalf("getUpdates returned error: %v", err)
	}
	if len(updates) != 1 || updates[0].UpdateID != 1 {
		t.Fatalf("unexpected updates: %#v", updates)
	}

	messageID, err := worker.sendMessage(context.Background(), 100, "hello", nil)
	if err != nil {
		t.Fatalf("sendMessage returned error: %v", err)
	}
	if messageID != 77 {
		t.Fatalf("expected message id 77, got %d", messageID)
	}

	if err := worker.editMessage(context.Background(), 100, 77, "updated", nil); err != nil {
		t.Fatalf("editMessage returned error: %v", err)
	}

	if err := worker.sendOrEdit(context.Background(), 100, 0, "menu", nil); err != nil {
		t.Fatalf("sendOrEdit returned error: %v", err)
	}
	if worker.session(100).MenuMessageID != 77 {
		t.Fatalf("expected menu message id 77, got %d", worker.session(100).MenuMessageID)
	}
}

type telegramRewriteTransport struct {
	base   http.RoundTripper
	target *url.URL
}

func (t telegramRewriteTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	clone := req.Clone(req.Context())
	clone.URL.Scheme = t.target.Scheme
	clone.URL.Host = t.target.Host
	clone.Host = t.target.Host
	return t.base.RoundTrip(clone)
}

func rewriteTelegramHTTPClient(t *testing.T, server *httptest.Server) *http.Client {
	t.Helper()

	target, err := url.Parse(server.URL)
	if err != nil {
		t.Fatalf("url.Parse returned error: %v", err)
	}
	return &http.Client{
		Timeout: 2 * time.Second,
		Transport: telegramRewriteTransport{
			base:   server.Client().Transport,
			target: target,
		},
	}
}
