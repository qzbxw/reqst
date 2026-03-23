package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"reqst/backend/internal/store"

	"github.com/shopspring/decimal"
)

type PaymentService struct {
	store *store.Store
}

type PaymentResult struct {
	Invoice        *store.Invoice `json:"invoice,omitempty"`
	Classification string         `json:"classification"`
}

func NewPaymentService(st *store.Store) *PaymentService {
	return &PaymentService{store: st}
}

func (s *PaymentService) ProcessObservedTransfer(ctx context.Context, transfer store.ObservedTransfer) (PaymentResult, error) {
	inserted, err := s.store.RecordObservedTransfer(ctx, transfer)
	if err != nil {
		return PaymentResult{}, err
	}
	if !inserted {
		return PaymentResult{Classification: "duplicate"}, nil
	}

	invoice, classification, status, err := s.matchTransfer(ctx, transfer)
	if err != nil {
		return PaymentResult{}, err
	}
	if invoice == nil {
		return PaymentResult{Classification: classification}, nil
	}

	updated, err := s.store.CompleteInvoicePayment(ctx, invoice.ID, transfer.TxHash, status, classification, transfer.ObservedAt)
	if err != nil {
		return PaymentResult{}, err
	}
	return PaymentResult{
		Invoice:        &updated,
		Classification: classification,
	}, nil
}

func (s *PaymentService) matchTransfer(ctx context.Context, transfer store.ObservedTransfer) (*store.Invoice, string, store.InvoiceStatus, error) {
	switch transfer.Network {
	case store.NetworkTON:
		if transfer.PaymentComment == "" {
			return nil, "unmatched", store.InvoiceStatusDraft, nil
		}
		invoice, err := s.store.FindInvoiceByTONComment(ctx, transfer.DestinationAddress, transfer.PaymentComment)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				return nil, "unmatched", store.InvoiceStatusDraft, nil
			}
			return nil, "", store.InvoiceStatusDraft, err
		}
		matched, classification, status := classifyInvoiceTransfer(invoice, transfer.Amount, transfer.ObservedAt)
		return matched, classification, status, nil
	default:
		invoice, err := s.store.FindInvoiceByExactAmount(ctx, transfer.DestinationAddress, transfer.Network, transfer.Amount)
		if err == nil {
			matched, classification, status := classifyInvoiceTransfer(invoice, transfer.Amount, transfer.ObservedAt)
			return matched, classification, status, nil
		}
		if err != nil && !errors.Is(err, store.ErrNotFound) {
			return nil, "", store.InvoiceStatusDraft, err
		}

		invoice, err = s.store.FindPotentialUnderpaidInvoice(ctx, transfer.DestinationAddress, transfer.Network, transfer.Amount)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				return nil, "unmatched", store.InvoiceStatusDraft, nil
			}
			return nil, "", store.InvoiceStatusDraft, err
		}
		matched, classification, status := classifyInvoiceTransfer(invoice, transfer.Amount, transfer.ObservedAt)
		return matched, classification, status, nil
	}
}

func classifyInvoiceTransfer(invoice store.Invoice, amount decimal.Decimal, observedAt time.Time) (*store.Invoice, string, store.InvoiceStatus) {
	if invoice.Status == store.InvoiceStatusExpired || observedAt.After(invoice.ExpiresAt) {
		return &invoice, "late_payment", store.InvoiceStatusManualReview
	}
	if amount.LessThan(invoice.PayableAmount) {
		return &invoice, "underpaid", store.InvoiceStatusUnderpaid
	}
	return &invoice, "paid_exact", store.InvoiceStatusPaid
}

func normalizeObservedTransfer(transfer *store.ObservedTransfer) error {
	if transfer.TxHash == "" {
		return errors.New("tx_hash is required")
	}
	if transfer.DestinationAddress == "" {
		return errors.New("destination_address is required")
	}
	if transfer.Network == "" {
		return errors.New("network is required")
	}
	if !transfer.Amount.IsPositive() {
		return errors.New("amount must be positive")
	}
	if transfer.ObservedAt.IsZero() {
		transfer.ObservedAt = time.Now().UTC()
	}
	return nil
}

func NormalizeObservedTransfer(transfer *store.ObservedTransfer) error {
	if err := normalizeObservedTransfer(transfer); err != nil {
		return fmt.Errorf("normalize observed transfer: %w", err)
	}
	return nil
}
