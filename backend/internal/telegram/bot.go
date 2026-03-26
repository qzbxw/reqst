package telegram

import (
	"bytes"
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

	"reqst/backend/internal/metrics"
	"reqst/backend/internal/service"
	"reqst/backend/internal/store"

	"github.com/shopspring/decimal"
)

type botFlow string

const (
	flowIdle          botFlow = ""
	flowWalletAddress botFlow = "wallet_address"
	flowInvoiceTitle  botFlow = "invoice_title"
	flowInvoiceAmount botFlow = "invoice_amount"
)

type BotWorker struct {
	store          *store.Store
	invoiceService *service.InvoiceService
	token          string
	publicAppURL   string
	httpClient     *http.Client
	logger         *slog.Logger
	offset         int64
	sessions       map[int64]*botSession
}

type botSession struct {
	MenuMessageID int64
	Flow          botFlow
	WalletNetwork store.Network
	DraftInvoice  botInvoiceDraft
}

type botInvoiceDraft struct {
	WalletID       int64
	WalletNetwork  store.Network
	PayableNetwork store.Network
	WalletLabel    string
	Title          string
	Amount         string
}

type tgAPIResponse[T any] struct {
	OK          bool   `json:"ok"`
	Description string `json:"description"`
	Result      T      `json:"result"`
}

type tgUpdate struct {
	UpdateID      int64            `json:"update_id"`
	Message       *tgMessage       `json:"message"`
	CallbackQuery *tgCallbackQuery `json:"callback_query"`
}

type tgMessage struct {
	MessageID int64  `json:"message_id"`
	Text      string `json:"text"`
	Chat      struct {
		ID int64 `json:"id"`
	} `json:"chat"`
	From *tgUser `json:"from"`
}

type tgUser struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
}

type tgCallbackQuery struct {
	ID      string     `json:"id"`
	Data    string     `json:"data"`
	From    tgUser     `json:"from"`
	Message *tgMessage `json:"message"`
}

type tgInlineKeyboardMarkup struct {
	InlineKeyboard [][]tgInlineKeyboardButton `json:"inline_keyboard"`
}

type tgInlineKeyboardButton struct {
	Text         string `json:"text"`
	CallbackData string `json:"callback_data,omitempty"`
	URL          string `json:"url,omitempty"`
}

type notificationPayload struct {
	InvoiceID      int64                `json:"invoice_id"`
	PublicID       string               `json:"public_id"`
	InvoiceActions []notificationAction `json:"invoice_actions"`
}

type notificationAction struct {
	Kind string `json:"kind"`
	Text string `json:"text"`
	Data string `json:"data"`
	URL  string `json:"url"`
}

func NewBotWorker(st *store.Store, invoiceService *service.InvoiceService, token string, publicAppURL string, logger *slog.Logger) *BotWorker {
	return &BotWorker{
		store:          st,
		invoiceService: invoiceService,
		token:          token,
		publicAppURL:   publicAppURL,
		logger:         logger,
		sessions:       map[int64]*botSession{},
		httpClient: &http.Client{
			Timeout: 35 * time.Second,
		},
	}
}

func (b *BotWorker) Run(ctx context.Context) error {
	ctx = metrics.WithSource(ctx, "telegram_bot")
	if strings.TrimSpace(b.token) == "" {
		b.logger.Info("telegram bot token is empty, running delivery worker without Telegram polling")
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()
		for {
			if err := b.flush(ctx); err != nil {
				b.logger.Error("flush delivery jobs", "error", err)
			}
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-ticker.C:
			}
		}
	}

	for {
		if err := b.flush(ctx); err != nil {
			b.logger.Error("flush delivery jobs", "error", err)
		}

		updates, err := b.getUpdates(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return ctx.Err()
			}
			b.logger.Error("poll telegram updates", "error", err)
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(2 * time.Second):
			}
			continue
		}

		for _, update := range updates {
			b.offset = update.UpdateID + 1
			if err := b.handleUpdate(ctx, update); err != nil {
				b.logger.Error("handle telegram update", "update_id", update.UpdateID, "error", err)
			}
		}
	}
}

func (b *BotWorker) flush(ctx context.Context) error {
	if strings.TrimSpace(b.token) != "" {
		jobs, err := b.store.ClaimNotificationJobs(ctx, 20)
		if err != nil {
			return err
		}

		for _, job := range jobs {
			keyboard := b.notificationKeyboard(job.Payload)
			if _, err := b.sendMessage(ctx, job.RecipientTelegramID, job.Message, keyboard); err != nil {
				_ = b.store.MarkNotificationFailed(ctx, job.ID, err.Error())
				continue
			}
			_ = b.store.MarkNotificationSent(ctx, job.ID)
		}
	}

	if err := b.flushWebhookDeliveries(ctx); err != nil {
		return err
	}
	return nil
}

func (b *BotWorker) handleUpdate(ctx context.Context, update tgUpdate) error {
	switch {
	case update.CallbackQuery != nil:
		return b.handleCallback(ctx, update.CallbackQuery)
	case update.Message != nil:
		return b.handleMessage(ctx, update.Message)
	default:
		return nil
	}
}

func (b *BotWorker) handleMessage(ctx context.Context, message *tgMessage) error {
	if message == nil || message.From == nil {
		return nil
	}

	seller, err := b.ensureSeller(ctx, *message.From)
	if err != nil {
		return err
	}

	text := strings.TrimSpace(message.Text)
	if strings.HasPrefix(text, "/") {
		return b.handleCommand(ctx, seller, message, strings.Fields(text)[0])
	}

	session := b.session(message.Chat.ID)
	switch session.Flow {
	case flowWalletAddress:
		return b.handleWalletAddressInput(ctx, seller, message, text)
	case flowInvoiceTitle:
		return b.handleInvoiceTitleInput(ctx, seller, message, text)
	case flowInvoiceAmount:
		return b.handleInvoiceAmountInput(ctx, seller, message, text)
	default:
		return nil
	}
}

func (b *BotWorker) handleCommand(ctx context.Context, seller store.Seller, message *tgMessage, command string) error {
	switch strings.ToLower(command) {
	case "/start", "/menu":
		b.resetSession(message.Chat.ID)
		return b.renderHome(ctx, seller, message.Chat.ID, 0)
	case "/login":
		msg := "🔑 Browser authentication works via Telegram verification code.\n\n" +
			"1. Open the reqst auth page in your browser.\n" +
			"2. Enter your @username.\n" +
			"3. Request the verification code.\n" +
			"4. Paste the code from this chat to sign in."
		_, err := b.sendMessage(ctx, message.Chat.ID, msg, b.reqstKeyboard(nil))
		return err
	case "/invoice":
		return b.renderInvoiceWalletPicker(ctx, seller, message.Chat.ID, 0)
	case "/wallets":
		return b.renderWallets(ctx, seller, message.Chat.ID, 0, "")
	case "/upgrade":
		return b.renderUpgrade(ctx, seller, message.Chat.ID, 0, "")
	default:
		msg := "Unknown command. Use /invoice to create a payment link, /wallets to manage your payout addresses, or /upgrade to unlock PRO features."
		_, err := b.sendMessage(ctx, message.Chat.ID, msg, b.reqstKeyboard(nil))
		return err
	}
}

func (b *BotWorker) handleCallback(ctx context.Context, query *tgCallbackQuery) error {
	if query == nil || query.Message == nil {
		return nil
	}

	seller, err := b.ensureSeller(ctx, query.From)
	if err != nil {
		return err
	}

	session := b.session(query.Message.Chat.ID)
	session.MenuMessageID = query.Message.MessageID
	data := strings.TrimSpace(query.Data)

	var callbackText string
	switch {
	case data == "nav:home":
		b.resetSession(query.Message.Chat.ID)
		err = b.renderHome(ctx, seller, query.Message.Chat.ID, query.Message.MessageID)
	case data == "screen:wallets":
		err = b.renderWallets(ctx, seller, query.Message.Chat.ID, query.Message.MessageID, "")
	case data == "screen:invoice":
		err = b.renderInvoiceWalletPicker(ctx, seller, query.Message.Chat.ID, query.Message.MessageID)
	case data == "screen:upgrade":
		err = b.renderUpgrade(ctx, seller, query.Message.Chat.ID, query.Message.MessageID, "")
	case strings.HasPrefix(data, "wallet:set:"):
		network := store.Network(strings.TrimPrefix(data, "wallet:set:"))
		session.Flow = flowWalletAddress
		session.WalletNetwork = network
		err = b.editMessage(ctx, query.Message.Chat.ID, query.Message.MessageID, b.walletAddressPrompt(network), b.reqstKeyboard([][]tgInlineKeyboardButton{
			{{Text: "Back", CallbackData: "screen:wallets"}},
		}))
	case strings.HasPrefix(data, "wallet:disable:"):
		walletID, parseErr := strconv.ParseInt(strings.TrimPrefix(data, "wallet:disable:"), 10, 64)
		if parseErr != nil {
			err = parseErr
			break
		}
		err = b.store.DeactivateWallet(ctx, seller.ID, walletID)
		if err == nil {
			err = b.renderWallets(ctx, seller, query.Message.Chat.ID, query.Message.MessageID, "Wallet disabled.")
			callbackText = "Wallet disabled"
		}
	case strings.HasPrefix(data, "invoice:new:"):
		walletID, parseErr := strconv.ParseInt(strings.TrimPrefix(data, "invoice:new:"), 10, 64)
		if parseErr != nil {
			err = parseErr
			break
		}
		wallet, getErr := b.store.GetWalletByID(ctx, seller.ID, walletID)
		if getErr != nil {
			err = getErr
			break
		}
		session.DraftInvoice = botInvoiceDraft{
			WalletID:      wallet.ID,
			WalletNetwork: wallet.Network,
			WalletLabel:   fmt.Sprintf("%s • %s", networkButtonLabel(wallet.Network), shortAddress(wallet.Address)),
		}
		rows := make([][]tgInlineKeyboardButton, 0, 5)
		for _, network := range payableNetworksForWallet(wallet.Network) {
			rows = append(rows, []tgInlineKeyboardButton{{
				Text:         networkButtonLabel(network),
				CallbackData: fmt.Sprintf("invoice:network:%d:%s", wallet.ID, network),
			}})
		}
		rows = append(rows, []tgInlineKeyboardButton{{Text: "Cancel", CallbackData: "invoice:cancel"}})
		err = b.editMessage(ctx, query.Message.Chat.ID, query.Message.MessageID, b.invoiceNetworkPrompt(session.DraftInvoice), b.reqstKeyboard(rows))
	case strings.HasPrefix(data, "invoice:network:"):
		parts := strings.Split(data, ":")
		if len(parts) != 4 {
			err = fmt.Errorf("invalid invoice network callback")
			break
		}
		walletID, parseErr := strconv.ParseInt(parts[2], 10, 64)
		if parseErr != nil {
			err = parseErr
			break
		}
		wallet, getErr := b.store.GetWalletByID(ctx, seller.ID, walletID)
		if getErr != nil {
			err = getErr
			break
		}
		network := store.Network(parts[3])
		if !network.IsSupportedPayableNetwork() || wallet.Network != network.WalletBucket() {
			err = fmt.Errorf("wallet does not support network %s", network)
			break
		}
		session.Flow = flowInvoiceTitle
		session.DraftInvoice = botInvoiceDraft{
			WalletID:       wallet.ID,
			WalletNetwork:  wallet.Network,
			PayableNetwork: network,
			WalletLabel:    fmt.Sprintf("%s • %s", networkButtonLabel(network), shortAddress(wallet.Address)),
		}
		err = b.editMessage(ctx, query.Message.Chat.ID, query.Message.MessageID, b.invoiceTitlePrompt(session.DraftInvoice), b.reqstKeyboard([][]tgInlineKeyboardButton{
			{{Text: "Cancel", CallbackData: "invoice:cancel"}},
		}))
	case strings.HasPrefix(data, "invoice:lifetime:"):
		minutes, parseErr := strconv.Atoi(strings.TrimPrefix(data, "invoice:lifetime:"))
		if parseErr != nil {
			err = parseErr
			break
		}
		err = b.finishInvoiceWizard(ctx, seller, query.Message.Chat.ID, query.Message.MessageID, minutes)
	case strings.HasPrefix(data, "upgrade:network:"):
		network := store.Network(strings.TrimPrefix(data, "upgrade:network:"))
		invoice, createErr := b.invoiceService.CreateSubscriptionInvoice(ctx, seller, network)
		if createErr != nil {
			err = createErr
			break
		}
		callbackText = "Upgrade checkout created"
		err = b.editMessage(ctx, query.Message.Chat.ID, query.Message.MessageID, fmt.Sprintf("Reqst PRO checkout created.\n\n%s\n%s %s\n30 days of unlimited invoices.", invoice.PublicID, invoice.PayableAmount.StringFixed(6), invoice.PayableNetwork), b.reqstKeyboard([][]tgInlineKeyboardButton{
			{{Text: "Open checkout", URL: b.appURL("/checkout/" + invoice.PublicID)}},
			{{Text: "Home", CallbackData: "nav:home"}},
		}))
	case data == "invoice:cancel":
		b.resetSession(query.Message.Chat.ID)
		err = b.renderHome(ctx, seller, query.Message.Chat.ID, query.Message.MessageID)
	case strings.HasPrefix(data, "invoice:mark_paid:"):
		invoiceID, parseErr := strconv.ParseInt(strings.TrimPrefix(data, "invoice:mark_paid:"), 10, 64)
		if parseErr != nil {
			err = parseErr
			break
		}
		invoice, markErr := b.store.MarkInvoicePaidManual(ctx, seller.ID, invoiceID)
		if markErr != nil {
			err = markErr
			break
		}
		callbackText = "Marked as paid"
		err = b.editMessage(ctx, query.Message.Chat.ID, query.Message.MessageID, fmt.Sprintf("Invoice %s marked as paid manually.", invoice.PublicID), b.reqstKeyboard(nil))
	case strings.HasPrefix(data, "invoice:keep_underpaid:"):
		invoiceID, parseErr := strconv.ParseInt(strings.TrimPrefix(data, "invoice:keep_underpaid:"), 10, 64)
		if parseErr != nil {
			err = parseErr
			break
		}
		invoice, getErr := b.store.GetInvoiceByID(ctx, seller.ID, invoiceID)
		if getErr != nil {
			err = getErr
			break
		}
		callbackText = "Waiting for top-up"
		err = b.editMessage(ctx, query.Message.Chat.ID, query.Message.MessageID, fmt.Sprintf("Invoice %s kept in underpaid state. Wait for a top-up or review it later in reqst.", invoice.PublicID), b.reqstKeyboard(nil))
	case strings.HasPrefix(data, "invoice:keep_review:"):
		invoiceID, parseErr := strconv.ParseInt(strings.TrimPrefix(data, "invoice:keep_review:"), 10, 64)
		if parseErr != nil {
			err = parseErr
			break
		}
		invoice, getErr := b.store.GetInvoiceByID(ctx, seller.ID, invoiceID)
		if getErr != nil {
			err = getErr
			break
		}
		callbackText = "Left on review"
		err = b.editMessage(ctx, query.Message.Chat.ID, query.Message.MessageID, fmt.Sprintf("Invoice %s stays on manual review.", invoice.PublicID), b.reqstKeyboard(nil))
	default:
		callbackText = "Unknown action"
	}

	if callbackText != "" {
		_ = b.answerCallbackQuery(ctx, query.ID, callbackText)
	}
	if err != nil {
		_ = b.answerCallbackQuery(ctx, query.ID, "Action failed")
	}
	return err
}

func (b *BotWorker) handleWalletAddressInput(ctx context.Context, seller store.Seller, message *tgMessage, text string) error {
	session := b.session(message.Chat.ID)
	address := strings.TrimSpace(text)
	if err := validateWallet(session.WalletNetwork, address); err != nil {
		return b.editMessage(ctx, message.Chat.ID, session.MenuMessageID, b.walletAddressPrompt(session.WalletNetwork)+"\n\n"+err.Error(), b.reqstKeyboard([][]tgInlineKeyboardButton{
			{{Text: "Back", CallbackData: "screen:wallets"}},
		}))
	}

	if _, err := b.store.CreateWallet(ctx, seller.ID, session.WalletNetwork, address); err != nil {
		return err
	}
	session.Flow = flowIdle
	session.WalletNetwork = ""
	return b.renderWallets(ctx, seller, message.Chat.ID, session.MenuMessageID, "Wallet saved.")
}

func (b *BotWorker) handleInvoiceTitleInput(ctx context.Context, seller store.Seller, message *tgMessage, text string) error {
	session := b.session(message.Chat.ID)
	title := strings.TrimSpace(text)
	if title == "" {
		return b.editMessage(ctx, message.Chat.ID, session.MenuMessageID, b.invoiceTitlePrompt(session.DraftInvoice)+"\n\nTitle cannot be empty.", b.reqstKeyboard([][]tgInlineKeyboardButton{
			{{Text: "Cancel", CallbackData: "invoice:cancel"}},
		}))
	}
	session.DraftInvoice.Title = title
	session.Flow = flowInvoiceAmount
	return b.editMessage(ctx, message.Chat.ID, session.MenuMessageID, b.invoiceAmountPrompt(session.DraftInvoice), b.reqstKeyboard([][]tgInlineKeyboardButton{
		{{Text: "Cancel", CallbackData: "invoice:cancel"}},
	}))
}

func (b *BotWorker) handleInvoiceAmountInput(ctx context.Context, seller store.Seller, message *tgMessage, text string) error {
	session := b.session(message.Chat.ID)
	amountText := strings.TrimSpace(strings.ReplaceAll(text, ",", "."))
	amount, err := decimal.NewFromString(amountText)
	if err != nil || !amount.IsPositive() {
		return b.editMessage(ctx, message.Chat.ID, session.MenuMessageID, b.invoiceAmountPrompt(session.DraftInvoice)+"\n\nSend a valid positive USD amount.", b.reqstKeyboard([][]tgInlineKeyboardButton{
			{{Text: "Cancel", CallbackData: "invoice:cancel"}},
		}))
	}
	session.DraftInvoice.Amount = amount.StringFixed(2)
	session.Flow = flowIdle
	return b.editMessage(ctx, message.Chat.ID, session.MenuMessageID, b.invoiceLifetimePrompt(session.DraftInvoice), b.reqstKeyboard([][]tgInlineKeyboardButton{
		{
			{Text: "15 min", CallbackData: "invoice:lifetime:15"},
			{Text: "30 min", CallbackData: "invoice:lifetime:30"},
			{Text: "60 min", CallbackData: "invoice:lifetime:60"},
		},
		{
			{Text: "Cancel", CallbackData: "invoice:cancel"},
		},
	}))
}

func (b *BotWorker) finishInvoiceWizard(ctx context.Context, seller store.Seller, chatID int64, messageID int64, minutes int) error {
	session := b.session(chatID)
	amount, err := decimal.NewFromString(session.DraftInvoice.Amount)
	if err != nil {
		return err
	}

	invoice, err := b.invoiceService.CreateInvoice(ctx, seller, service.CreateInvoiceInput{
		Title:            session.DraftInvoice.Title,
		BaseAmountUSD:    amount,
		WalletID:         session.DraftInvoice.WalletID,
		PayableNetwork:   session.DraftInvoice.PayableNetwork,
		ExpiresInMinutes: minutes,
	})
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "trial limit reached") {
			return b.renderUpgrade(ctx, seller, chatID, messageID, "Trial limit reached. Unlock PRO to keep generating links.")
		}
		return err
	}

	b.resetSession(chatID)
	checkoutURL := b.appURL("/checkout/" + invoice.PublicID)
	return b.editMessage(ctx, chatID, messageID, fmt.Sprintf("Invoice %s created.\n\n%s\n%s %s\nExpires in %d min", invoice.PublicID, invoice.Title, invoice.PayableAmount.StringFixed(6), invoice.PayableNetwork, minutes), b.reqstKeyboard([][]tgInlineKeyboardButton{
		{{Text: "Open checkout", URL: checkoutURL}},
		{{Text: "New invoice", CallbackData: "screen:invoice"}},
	}))
}

func (b *BotWorker) renderHome(ctx context.Context, seller store.Seller, chatID int64, messageID int64) error {
	wallets, err := b.store.ListWallets(ctx, seller.ID)
	if err != nil {
		return err
	}
	invoices, err := b.store.ListInvoices(ctx, seller.ID, 1, 0)
	if err != nil {
		return err
	}
	latest := "No invoices yet."
	if len(invoices) > 0 {
		latest = invoices[0].Title + " · " + invoices[0].PayableAmount.StringFixed(6) + " " + string(invoices[0].PayableNetwork)
	}

	text := fmt.Sprintf(
		"reqst seller bot\n\nSeller: @%s\nWallets: %d\nLatest: %s\n\nUse the buttons below, open reqst, or run /login to get browser sign-in instructions.",
		valueOrFallback(seller.Username, sellerTelegramLabel(seller.TelegramID)),
		len(wallets),
		latest,
	)
	return b.sendOrEdit(ctx, chatID, messageID, text, b.reqstKeyboard([][]tgInlineKeyboardButton{
		{
			{Text: "New invoice", CallbackData: "screen:invoice"},
			{Text: "Wallets", CallbackData: "screen:wallets"},
		},
		{
			{Text: "Unlock PRO", CallbackData: "screen:upgrade"},
		},
	}))
}

func sellerTelegramLabel(telegramID *int64) string {
	if telegramID == nil {
		return "unlinked"
	}
	return strconv.FormatInt(*telegramID, 10)
}

func (b *BotWorker) renderWallets(ctx context.Context, seller store.Seller, chatID int64, messageID int64, note string) error {
	wallets, err := b.store.ListWallets(ctx, seller.ID)
	if err != nil {
		return err
	}

	lines := []string{"Wallets"}
	if note != "" {
		lines = append(lines, "", note)
	}
	if len(wallets) == 0 {
		lines = append(lines, "", "No active wallets yet.")
	} else {
		for _, wallet := range wallets {
			lines = append(lines, "", fmt.Sprintf("%s\n%s", networkButtonLabel(wallet.Network), wallet.Address))
		}
	}

	rows := [][]tgInlineKeyboardButton{
		{
			{Text: "Set TON", CallbackData: "wallet:set:TON"},
			{Text: "Set TRON", CallbackData: "wallet:set:TRON"},
		},
		{
			{Text: "Set SOLANA", CallbackData: "wallet:set:SOLANA"},
			{Text: "Set EVM", CallbackData: "wallet:set:EVM"},
		},
	}
	for _, wallet := range wallets {
		rows = append(rows, []tgInlineKeyboardButton{
			{Text: "Disable " + networkButtonLabel(wallet.Network), CallbackData: fmt.Sprintf("wallet:disable:%d", wallet.ID)},
		})
	}
	rows = append(rows, []tgInlineKeyboardButton{{Text: "Home", CallbackData: "nav:home"}})
	return b.sendOrEdit(ctx, chatID, messageID, strings.Join(lines, "\n"), b.reqstKeyboard(rows))
}

func (b *BotWorker) renderInvoiceWalletPicker(ctx context.Context, seller store.Seller, chatID int64, messageID int64) error {
	wallets, err := b.store.ListWallets(ctx, seller.ID)
	if err != nil {
		return err
	}
	if len(wallets) == 0 {
		return b.renderWallets(ctx, seller, chatID, messageID, "Add a wallet first to create invoices.")
	}

	rows := make([][]tgInlineKeyboardButton, 0, len(wallets)+1)
	for _, wallet := range wallets {
		rows = append(rows, []tgInlineKeyboardButton{
			{Text: fmt.Sprintf("%s • %s", networkButtonLabel(wallet.Network), shortAddress(wallet.Address)), CallbackData: fmt.Sprintf("invoice:new:%d", wallet.ID)},
		})
	}
	rows = append(rows, []tgInlineKeyboardButton{{Text: "Home", CallbackData: "nav:home"}})
	text := "New invoice\n\nChoose which wallet should receive the payment."
	return b.sendOrEdit(ctx, chatID, messageID, text, b.reqstKeyboard(rows))
}

func (b *BotWorker) renderUpgrade(ctx context.Context, seller store.Seller, chatID int64, messageID int64, note string) error {
	lines := []string{
		"Unlock Reqst PRO",
		"",
		"Unlimited invoices for 30 days.",
		"Price: 39 USDT.",
	}
	if note != "" {
		lines = append(lines, "", note)
	}
	if seller.IsPRO(time.Now()) {
		lines = append(lines, "", "Your PRO subscription is already active. You can still extend it early.")
	}

	rows := make([][]tgInlineKeyboardButton, 0, 7)
	for _, network := range []store.Network{store.NetworkTRON, store.NetworkSOLANA, store.NetworkBASE, store.NetworkARBITRUM, store.NetworkBSC, store.NetworkTON} {
		rows = append(rows, []tgInlineKeyboardButton{{
			Text:         networkButtonLabel(network),
			CallbackData: "upgrade:network:" + string(network),
		}})
	}
	rows = append(rows, []tgInlineKeyboardButton{{Text: "Home", CallbackData: "nav:home"}})
	return b.sendOrEdit(ctx, chatID, messageID, strings.Join(lines, "\n"), b.reqstKeyboard(rows))
}

func (b *BotWorker) notificationKeyboard(raw json.RawMessage) *tgInlineKeyboardMarkup {
	if len(raw) == 0 {
		return b.reqstKeyboard(nil)
	}

	var payload notificationPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		return b.reqstKeyboard(nil)
	}

	rows := make([][]tgInlineKeyboardButton, 0, len(payload.InvoiceActions)+1)
	for _, action := range payload.InvoiceActions {
		switch action.Kind {
		case "callback":
			rows = append(rows, []tgInlineKeyboardButton{{Text: action.Text, CallbackData: action.Data}})
		case "url":
			rows = append(rows, []tgInlineKeyboardButton{{Text: action.Text, URL: action.URL}})
		}
	}
	if payload.PublicID != "" {
		rows = append(rows, []tgInlineKeyboardButton{{Text: "Open checkout", URL: b.appURL("/checkout/" + payload.PublicID)}})
	}
	return b.reqstKeyboard(rows)
}

func (b *BotWorker) reqstKeyboard(rows [][]tgInlineKeyboardButton) *tgInlineKeyboardMarkup {
	reqstRow := []tgInlineKeyboardButton{{Text: "reqst", URL: b.appURL("")}}
	rows = append(rows, reqstRow)
	return &tgInlineKeyboardMarkup{InlineKeyboard: rows}
}

func (b *BotWorker) walletAddressPrompt(network store.Network) string {
	switch network {
	case store.NetworkEVM:
		return "Set shared EVM wallet\n\nThis address is reused for Ethereum, Base, Arbitrum and BSC. Send the wallet address in your next message."
	case store.NetworkSOLANA:
		return "Set Solana wallet\n\nThis address will receive Solana stablecoin invoices. Send the wallet address in your next message."
	default:
		return fmt.Sprintf("Set %s wallet\n\nSend the wallet address in your next message.", network)
	}
}

func (b *BotWorker) invoiceNetworkPrompt(draft botInvoiceDraft) string {
	return fmt.Sprintf("New invoice\n\nWallet: %s\n\nChoose which network should be used for this invoice.", draft.WalletLabel)
}

func (b *BotWorker) invoiceTitlePrompt(draft botInvoiceDraft) string {
	return fmt.Sprintf("New invoice\n\nWallet: %s\n\nStep 1/3. Send the service title in your next message.", draft.WalletLabel)
}

func (b *BotWorker) invoiceAmountPrompt(draft botInvoiceDraft) string {
	return fmt.Sprintf("New invoice\n\nWallet: %s\nTitle: %s\n\nStep 2/3. Send the USD amount in your next message.", draft.WalletLabel, draft.Title)
}

func (b *BotWorker) invoiceLifetimePrompt(draft botInvoiceDraft) string {
	return fmt.Sprintf("New invoice\n\nWallet: %s\nTitle: %s\nAmount: %s USD\n\nStep 3/3. Choose invoice lifetime.", draft.WalletLabel, draft.Title, draft.Amount)
}

func (b *BotWorker) session(chatID int64) *botSession {
	session, ok := b.sessions[chatID]
	if !ok {
		session = &botSession{}
		b.sessions[chatID] = session
	}
	return session
}

func (b *BotWorker) resetSession(chatID int64) {
	b.sessions[chatID] = &botSession{}
}

func (b *BotWorker) ensureSeller(ctx context.Context, user tgUser) (store.Seller, error) {
	return b.store.UpsertSellerByTelegram(ctx, user.ID, user.Username)
}

func (b *BotWorker) getUpdates(ctx context.Context) ([]tgUpdate, error) {
	query := url.Values{}
	query.Set("timeout", "5")
	if b.offset > 0 {
		query.Set("offset", strconv.FormatInt(b.offset, 10))
	}
	endpoint := fmt.Sprintf("https://api.telegram.org/bot%s/getUpdates?%s", b.token, query.Encode())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("build telegram getUpdates request: %w", err)
	}

	startedAt := time.Now()
	resp, err := b.httpClient.Do(req)
	if err != nil {
		metrics.ObserveUpstream("telegram_bot_api", "get_updates", "failure", time.Since(startedAt))
		return nil, fmt.Errorf("telegram getUpdates: %w", err)
	}
	defer resp.Body.Close()

	var result tgAPIResponse[[]tgUpdate]
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		metrics.ObserveUpstream("telegram_bot_api", "get_updates", "failure", time.Since(startedAt))
		return nil, fmt.Errorf("decode telegram getUpdates: %w", err)
	}
	if !result.OK {
		metrics.ObserveUpstream("telegram_bot_api", "get_updates", "failure", time.Since(startedAt))
		return nil, fmt.Errorf("telegram getUpdates failed: %s", result.Description)
	}
	metrics.ObserveUpstream("telegram_bot_api", "get_updates", "success", time.Since(startedAt))
	return result.Result, nil
}

func (b *BotWorker) sendOrEdit(ctx context.Context, chatID int64, messageID int64, text string, keyboard *tgInlineKeyboardMarkup) error {
	if messageID > 0 {
		if err := b.editMessage(ctx, chatID, messageID, text, keyboard); err == nil {
			return nil
		}
	}
	newMessageID, err := b.sendMessage(ctx, chatID, text, keyboard)
	if err != nil {
		return err
	}
	b.session(chatID).MenuMessageID = newMessageID
	return nil
}

func (b *BotWorker) sendMessage(ctx context.Context, chatID int64, text string, keyboard *tgInlineKeyboardMarkup) (int64, error) {
	payload := map[string]any{
		"chat_id": chatID,
		"text":    text,
	}
	if keyboard != nil {
		payload["reply_markup"] = keyboard
	}

	var result tgMessage
	if err := b.callTelegram(ctx, "sendMessage", payload, &result); err != nil {
		return 0, err
	}
	return result.MessageID, nil
}

func (b *BotWorker) editMessage(ctx context.Context, chatID int64, messageID int64, text string, keyboard *tgInlineKeyboardMarkup) error {
	payload := map[string]any{
		"chat_id":    chatID,
		"message_id": messageID,
		"text":       text,
	}
	if keyboard != nil {
		payload["reply_markup"] = keyboard
	}

	var ignored json.RawMessage
	if err := b.callTelegram(ctx, "editMessageText", payload, &ignored); err != nil {
		if strings.Contains(err.Error(), "message is not modified") {
			return nil
		}
		return err
	}
	return nil
}

func (b *BotWorker) answerCallbackQuery(ctx context.Context, callbackID string, text string) error {
	payload := map[string]any{
		"callback_query_id": callbackID,
		"text":              text,
	}
	var ignored json.RawMessage
	return b.callTelegram(ctx, "answerCallbackQuery", payload, &ignored)
}

func (b *BotWorker) callTelegram(ctx context.Context, method string, payload any, out any) error {
	body, _ := json.Marshal(payload)
	endpoint := fmt.Sprintf("https://api.telegram.org/bot%s/%s", b.token, method)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("build telegram %s request: %w", method, err)
	}
	req.Header.Set("Content-Type", "application/json")

	startedAt := time.Now()
	resp, err := b.httpClient.Do(req)
	if err != nil {
		metrics.ObserveUpstream("telegram_bot_api", method, "failure", time.Since(startedAt))
		return fmt.Errorf("telegram %s: %w", method, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		metrics.ObserveUpstream("telegram_bot_api", method, "failure", time.Since(startedAt))
		return fmt.Errorf("telegram %s failed: %s", method, strings.TrimSpace(string(respBody)))
	}

	var result tgAPIResponse[json.RawMessage]
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		metrics.ObserveUpstream("telegram_bot_api", method, "failure", time.Since(startedAt))
		return fmt.Errorf("decode telegram %s: %w", method, err)
	}
	if !result.OK {
		metrics.ObserveUpstream("telegram_bot_api", method, "failure", time.Since(startedAt))
		return fmt.Errorf("telegram %s failed: %s", method, result.Description)
	}
	if out == nil {
		return nil
	}
	if len(result.Result) == 0 || string(result.Result) == "true" {
		return nil
	}
	if err := json.Unmarshal(result.Result, out); err != nil {
		metrics.ObserveUpstream("telegram_bot_api", method, "failure", time.Since(startedAt))
		return fmt.Errorf("unmarshal telegram %s result: %w", method, err)
	}
	metrics.ObserveUpstream("telegram_bot_api", method, "success", time.Since(startedAt))
	return nil
}

func (b *BotWorker) appURL(path string) string {
	base := strings.TrimRight(strings.TrimSpace(b.publicAppURL), "/")
	if base == "" {
		base = "http://localhost:5173"
	}
	if path == "" {
		return base
	}
	return base + "/" + strings.TrimLeft(path, "/")
}

func shortAddress(address string) string {
	if len(address) <= 14 {
		return address
	}
	return address[:6] + "..." + address[len(address)-6:]
}

func validateWallet(network store.Network, address string) error {
	return store.ValidateWalletAddress(network, address)
}

func valueOrFallback(value string, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return value
}

func payableNetworksForWallet(network store.Network) []store.Network {
	switch network {
	case store.NetworkEVM:
		return []store.Network{store.NetworkBASE, store.NetworkARBITRUM, store.NetworkBSC, store.NetworkEVM}
	case store.NetworkSOLANA:
		return []store.Network{store.NetworkSOLANA}
	default:
		return []store.Network{network}
	}
}

func networkButtonLabel(network store.Network) string {
	switch network {
	case store.NetworkTRON:
		return "TRON / USDT"
	case store.NetworkSOLANA:
		return "SOLANA / USDT"
	case store.NetworkEVM:
		return "EVM / USDT"
	case store.NetworkBASE:
		return "BASE / USDT"
	case store.NetworkARBITRUM:
		return "ARBITRUM / USDT"
	case store.NetworkBSC:
		return "BSC / USDT"
	default:
		return string(network)
	}
}
