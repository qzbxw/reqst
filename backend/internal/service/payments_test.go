package service

import (
	"testing"
	"time"

	"reqst/backend/internal/store"

	"github.com/shopspring/decimal"
)

func TestClassifyInvoiceTransfer(t *testing.T) {
	now := time.Now().UTC()
	baseInvoice := store.Invoice{
		ID:            1,
		PublicID:      "INV123",
		PayableAmount: decimal.RequireFromString("150.013742"),
		Status:        store.InvoiceStatusAwaitingPayment,
		ExpiresAt:     now.Add(30 * time.Minute),
	}

	t.Run("paid exact", func(t *testing.T) {
		_, classification, status := classifyInvoiceTransfer(baseInvoice, decimal.RequireFromString("150.013742"), now)
		if classification != "paid_exact" {
			t.Fatalf("expected paid_exact, got %s", classification)
		}
		if status != store.InvoiceStatusPaid {
			t.Fatalf("expected paid status, got %s", status)
		}
	})

	t.Run("underpaid", func(t *testing.T) {
		_, classification, status := classifyInvoiceTransfer(baseInvoice, decimal.RequireFromString("150.000000"), now)
		if classification != "underpaid" {
			t.Fatalf("expected underpaid, got %s", classification)
		}
		if status != store.InvoiceStatusUnderpaid {
			t.Fatalf("expected underpaid status, got %s", status)
		}
	})

	t.Run("late payment", func(t *testing.T) {
		_, classification, status := classifyInvoiceTransfer(baseInvoice, decimal.RequireFromString("150.013742"), now.Add(31*time.Minute))
		if classification != "late_payment" {
			t.Fatalf("expected late_payment, got %s", classification)
		}
		if status != store.InvoiceStatusManualReview {
			t.Fatalf("expected manual_review status, got %s", status)
		}
	})

	t.Run("already expired invoice", func(t *testing.T) {
		invoice := baseInvoice
		invoice.Status = store.InvoiceStatusExpired
		_, classification, status := classifyInvoiceTransfer(invoice, decimal.RequireFromString("150.013742"), now)
		if classification != "late_payment" {
			t.Fatalf("expected late_payment, got %s", classification)
		}
		if status != store.InvoiceStatusManualReview {
			t.Fatalf("expected manual_review status, got %s", status)
		}
	})
}
