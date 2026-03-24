package store

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/shopspring/decimal"
)

type Network string

const (
	NetworkTON      Network = "TON"
	NetworkTRON     Network = "TRON"
	NetworkSOLANA   Network = "SOLANA"
	NetworkEVM      Network = "EVM"
	NetworkBASE     Network = "BASE"
	NetworkARBITRUM Network = "ARBITRUM"
	NetworkBSC      Network = "BSC"
)

func (n Network) WalletBucket() Network {
	switch n {
	case NetworkBASE, NetworkARBITRUM, NetworkBSC, NetworkEVM:
		return NetworkEVM
	case NetworkSOLANA:
		return NetworkSOLANA
	default:
		return n
	}
}

func (n Network) IsSupportedWalletNetwork() bool {
	switch n {
	case NetworkTON, NetworkTRON, NetworkSOLANA, NetworkEVM:
		return true
	default:
		return false
	}
}

func (n Network) IsSupportedPayableNetwork() bool {
	switch n {
	case NetworkTON, NetworkTRON, NetworkSOLANA, NetworkEVM, NetworkBASE, NetworkARBITRUM, NetworkBSC:
		return true
	default:
		return false
	}
}

func ValidateWalletAddress(network Network, address string) error {
	address = strings.TrimSpace(address)
	switch network {
	case NetworkTON:
		if len(address) < 32 {
			return fmt.Errorf("TON address looks too short")
		}
	case NetworkTRON:
		if !strings.HasPrefix(address, "T") || len(address) < 20 {
			return fmt.Errorf("TRON address looks invalid")
		}
	case NetworkEVM:
		if !strings.HasPrefix(strings.ToLower(address), "0x") || len(address) != 42 {
			return fmt.Errorf("EVM address looks invalid")
		}
	case NetworkSOLANA:
		if len(address) < 32 || len(address) > 44 {
			return fmt.Errorf("Solana address looks invalid")
		}
		const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
		for _, char := range address {
			if !strings.ContainsRune(alphabet, char) {
				return fmt.Errorf("Solana address looks invalid")
			}
		}
	default:
		return fmt.Errorf("unsupported network")
	}
	return nil
}

type InvoiceStatus string

type InvoiceKind string

const (
	InvoiceStatusDraft           InvoiceStatus = "draft"
	InvoiceStatusAwaitingPayment InvoiceStatus = "awaiting_payment"
	InvoiceStatusPaid            InvoiceStatus = "paid"
	InvoiceStatusExpired         InvoiceStatus = "expired"
	InvoiceStatusUnderpaid       InvoiceStatus = "underpaid"
	InvoiceStatusManualReview    InvoiceStatus = "manual_review"
)

const (
	InvoiceKindMerchant     InvoiceKind = "merchant"
	InvoiceKindSubscription InvoiceKind = "subscription"
)

type Seller struct {
	ID                 int64      `json:"id"`
	TelegramID         *int64     `json:"telegram_id"`
	Username           string     `json:"username"`
	Email              string     `json:"email"`
	DefaultNetwork     Network    `json:"default_network"`
	SubscriptionEndsAt *time.Time `json:"subscription_ends_at"`
	FreeInvoicesUsed   int        `json:"free_invoices_used"`
	IsBlocked          bool       `json:"is_blocked"`
	EmailVerifiedAt    *time.Time `json:"email_verified_at"`
	TelegramLinkedAt   *time.Time `json:"telegram_linked_at"`
	HasPassword        bool       `json:"has_password"`
	PasswordHash       string     `json:"-"`
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
	Kind               InvoiceKind      `json:"kind"`
	SubscriptionDays   int              `json:"subscription_days"`
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
	PollNetwork    Network
	PayableNetwork Network
	Address        string
}

type NotificationJob struct {
	ID                  int64
	SellerID            int64
	RecipientTelegramID int64
	Message             string
	Payload             json.RawMessage
	Attempts            int
}
