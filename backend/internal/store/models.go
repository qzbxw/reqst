package store

import (
	"encoding/json"
	"time"

	"github.com/shopspring/decimal"
)

type Network string

const (
	NetworkTON  Network = "TON"
	NetworkTRON Network = "TRON"
	NetworkEVM  Network = "EVM"
)

type InvoiceStatus string

const (
	InvoiceStatusDraft           InvoiceStatus = "draft"
	InvoiceStatusAwaitingPayment InvoiceStatus = "awaiting_payment"
	InvoiceStatusPaid            InvoiceStatus = "paid"
	InvoiceStatusExpired         InvoiceStatus = "expired"
	InvoiceStatusUnderpaid       InvoiceStatus = "underpaid"
	InvoiceStatusManualReview    InvoiceStatus = "manual_review"
)

type Seller struct {
	ID                 int64      `json:"id"`
	TelegramID         int64      `json:"telegram_id"`
	Username           string     `json:"username"`
	DefaultNetwork     Network    `json:"default_network"`
	SubscriptionEndsAt *time.Time `json:"subscription_ends_at"`
	FreeInvoicesUsed   int        `json:"free_invoices_used"`
	IsBlocked          bool       `json:"is_blocked"`
	CreatedAt          time.Time  `json:"created_at"`
}

func (s Seller) IsPRO(now time.Time) bool {
	return s.SubscriptionEndsAt != nil && s.SubscriptionEndsAt.After(now)
}

type Wallet struct {
	ID        int64     `json:"id"`
	SellerID  int64     `json:"seller_id"`
	Network   Network   `json:"network"`
	Address   string    `json:"address"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}

type Invoice struct {
	ID                 int64            `json:"id"`
	PublicID           string           `json:"public_id"`
	SellerID           int64            `json:"seller_id"`
	Title              string           `json:"title"`
	BaseAmountUSD      decimal.Decimal  `json:"base_amount_usd"`
	PayableAmount      decimal.Decimal  `json:"payable_amount"`
	PayableNetwork     Network          `json:"payable_network"`
	DestinationAddress string           `json:"destination_address"`
	PaymentComment     *string          `json:"payment_comment"`
	MatchingSuffix     *decimal.Decimal `json:"matching_suffix"`
	Status             InvoiceStatus    `json:"status"`
	ExpiresAt          time.Time        `json:"expires_at"`
	TxHash             *string          `json:"tx_hash"`
	PaidAt             *time.Time       `json:"paid_at"`
	CreatedAt          time.Time        `json:"created_at"`
}

func (i Invoice) IsExpired(now time.Time) bool {
	return now.After(i.ExpiresAt) && i.Status == InvoiceStatusAwaitingPayment
}

type PaymentEvent struct {
	ID                 int64           `json:"id"`
	TxHash             string          `json:"tx_hash"`
	Network            Network         `json:"network"`
	DestinationAddress string          `json:"destination_address"`
	Amount             decimal.Decimal `json:"amount"`
	PaymentComment     *string         `json:"payment_comment"`
	ObservedAt         time.Time       `json:"observed_at"`
	RawPayload         json.RawMessage `json:"raw_payload"`
	MatchedInvoiceID   *int64          `json:"matched_invoice_id"`
	Classification     string          `json:"classification"`
	CreatedAt          time.Time       `json:"created_at"`
}

type ObservedTransfer struct {
	TxHash             string
	Network            Network
	DestinationAddress string
	Amount             decimal.Decimal
	PaymentComment     string
	ObservedAt         time.Time
	RawPayload         json.RawMessage
}

type WatchedWallet struct {
	Network Network
	Address string
}

type NotificationJob struct {
	ID                  int64
	SellerID            int64
	RecipientTelegramID int64
	Message             string
	Attempts            int
}
