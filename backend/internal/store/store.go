package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"reqst/backend/internal/db"
	"reqst/backend/internal/metrics"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

var ErrNotFound = errors.New("not found")

type Store struct {
	pool *pgxpool.Pool
}

const sellerSelectColumns = `
	id,
	telegram_id,
	COALESCE(username, ''),
	COALESCE(email, ''),
	default_network,
	plan_code,
	subscription_ends_at,
	free_invoices_used,
	is_blocked,
	telegram_linked_at,
	created_at
`

func New(ctx context.Context, databaseURL string) (*Store, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("connect postgres: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping postgres: %w", err)
	}

	if err := db.RunMigrations(ctx, pool); err != nil {
		pool.Close()
		return nil, fmt.Errorf("run migrations: %w", err)
	}

	return &Store{pool: pool}, nil
}

func (s *Store) Close() {
	s.pool.Close()
}

func (s *Store) UpsertSellerByTelegram(ctx context.Context, telegramID int64, username string) (Seller, error) {
	row := s.pool.QueryRow(ctx, `
		INSERT INTO sellers (telegram_id, username, telegram_linked_at)
		VALUES ($1, NULLIF($2, ''), NOW())
		ON CONFLICT (telegram_id)
		DO UPDATE SET
			username = COALESCE(NULLIF(EXCLUDED.username, ''), sellers.username),
			telegram_linked_at = COALESCE(sellers.telegram_linked_at, NOW())
		RETURNING `+sellerSelectColumns+`
	`, telegramID, username)

	return scanSeller(row)
}

func (s *Store) GetSellerByID(ctx context.Context, sellerID int64) (Seller, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT `+sellerSelectColumns+`
		FROM sellers
		WHERE id = $1
	`, sellerID)
	return scanSeller(row)
}

func (s *Store) GetSellerByTelegramID(ctx context.Context, telegramID int64) (Seller, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT `+sellerSelectColumns+`
		FROM sellers
		WHERE telegram_id = $1
	`, telegramID)
	return scanSeller(row)
}

func (s *Store) GetSellerByUsername(ctx context.Context, username string) (Seller, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT `+sellerSelectColumns+`
		FROM sellers
		WHERE LOWER(username) = LOWER($1)
	`, username)
	return scanSeller(row)
}

func (s *Store) GrantPRO(ctx context.Context, sellerID int64, days int) (Seller, error) {
	if days <= 0 {
		days = 30
	}

	row := s.pool.QueryRow(ctx, `
		UPDATE sellers
		SET plan_code = 'pro',
		    subscription_ends_at = GREATEST(COALESCE(subscription_ends_at, NOW()), NOW()) + make_interval(days => $2)
		WHERE id = $1
		RETURNING `+sellerSelectColumns+`
	`, sellerID, days)
	seller, err := scanSeller(row)
	if err != nil {
		return Seller{}, err
	}
	metrics.IncResourceOperation("seller_subscription", "grant_pro", "success")
	return seller, nil
}

func (s *Store) SetSellerBlocked(ctx context.Context, sellerID int64, blocked bool) (Seller, error) {
	row := s.pool.QueryRow(ctx, `
		UPDATE sellers
		SET is_blocked = $2
		WHERE id = $1
		RETURNING `+sellerSelectColumns+`
	`, sellerID, blocked)
	seller, err := scanSeller(row)
	if err != nil {
		return Seller{}, err
	}
	metrics.IncResourceOperation("seller", "set_blocked", "success")
	return seller, nil
}

func (s *Store) UpdateSellerEmail(ctx context.Context, sellerID int64, email string) (Seller, error) {
	row := s.pool.QueryRow(ctx, `
		UPDATE sellers
		SET email = NULLIF($2, '')
		WHERE id = $1
		RETURNING `+sellerSelectColumns+`
	`, sellerID, email)
	seller, err := scanSeller(row)
	if err != nil {
		metrics.IncResourceOperation("seller_email", "update", "failure")
		return Seller{}, err
	}
	metrics.IncResourceOperation("seller_email", "update", "success")
	return seller, nil
}

func (s *Store) StoreTelegramAuthCode(ctx context.Context, sellerID int64, codeHash string, expiresAt time.Time) error {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin store telegram auth code tx: %w", err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
		UPDATE telegram_auth_codes
		SET consumed_at = NOW()
		WHERE seller_id = $1
		  AND consumed_at IS NULL
	`, sellerID); err != nil {
		return fmt.Errorf("expire active telegram auth codes: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO telegram_auth_codes (seller_id, code_hash, expires_at)
		VALUES ($1, $2, $3)
	`, sellerID, codeHash, expiresAt); err != nil {
		return fmt.Errorf("insert telegram auth code: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit telegram auth code: %w", err)
	}
	return nil
}

func (s *Store) ConsumeTelegramAuthCode(ctx context.Context, sellerID int64, codeHash string) error {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin consume telegram auth code tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var id int64
	row := tx.QueryRow(ctx, `
		UPDATE telegram_auth_codes
		SET consumed_at = NOW()
		WHERE id = (
			SELECT id
			FROM telegram_auth_codes
			WHERE seller_id = $1
			  AND code_hash = $2
			  AND consumed_at IS NULL
			  AND expires_at > NOW()
			ORDER BY created_at DESC
			LIMIT 1
			FOR UPDATE
		)
		RETURNING id
	`, sellerID, codeHash)
	if err := row.Scan(&id); errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	} else if err != nil {
		return fmt.Errorf("consume telegram auth code: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit consume telegram auth code: %w", err)
	}
	return nil
}

func (s *Store) ListWallets(ctx context.Context, sellerID int64) ([]Wallet, error) {
	wallets := make([]Wallet, 0)
	rows, err := s.pool.Query(ctx, `
		SELECT id, seller_id, network, address, is_active, created_at
		FROM wallets
		WHERE seller_id = $1 AND is_active = TRUE
		ORDER BY created_at DESC
	`, sellerID)
	if err != nil {
		return nil, fmt.Errorf("list wallets: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		wallet, err := scanWallet(rows)
		if err != nil {
			return nil, err
		}
		wallets = append(wallets, wallet)
	}
	return wallets, rows.Err()
}

func (s *Store) CreateWallet(ctx context.Context, sellerID int64, network Network, address string) (Wallet, error) {
	row := s.pool.QueryRow(ctx, `
		INSERT INTO wallets (seller_id, network, address, is_active)
		VALUES ($1, $2, $3, TRUE)
		ON CONFLICT (seller_id, network, address)
		DO UPDATE SET is_active = TRUE
		RETURNING id, seller_id, network, address, is_active, created_at
	`, sellerID, network, address)
	wallet, err := scanWallet(row)
	if err != nil {
		metrics.IncResourceOperation("wallet", "create", "failure")
		return Wallet{}, err
	}
	metrics.IncResourceOperation("wallet", "create", "success")
	return wallet, nil
}

func (s *Store) DeactivateWallet(ctx context.Context, sellerID int64, walletID int64) error {
	tag, err := s.pool.Exec(ctx, `
		UPDATE wallets
		SET is_active = FALSE
		WHERE id = $1 AND seller_id = $2
	`, walletID, sellerID)
	if err != nil {
		metrics.IncResourceOperation("wallet", "deactivate", "failure")
		return fmt.Errorf("deactivate wallet: %w", err)
	}
	if tag.RowsAffected() == 0 {
		metrics.IncResourceOperation("wallet", "deactivate", "not_found")
		return ErrNotFound
	}
	metrics.IncResourceOperation("wallet", "deactivate", "success")
	return nil
}

func (s *Store) GetActiveWalletForNetwork(ctx context.Context, sellerID int64, network Network) (Wallet, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, seller_id, network, address, is_active, created_at
		FROM wallets
		WHERE seller_id = $1 AND network = $2 AND is_active = TRUE
		ORDER BY created_at DESC
		LIMIT 1
	`, sellerID, network)
	return scanWallet(row)
}

func (s *Store) GetWalletByID(ctx context.Context, sellerID int64, walletID int64) (Wallet, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, seller_id, network, address, is_active, created_at
		FROM wallets
		WHERE id = $1 AND seller_id = $2 AND is_active = TRUE
	`, walletID, sellerID)
	return scanWallet(row)
}

func (s *Store) CountInvoicesCreated(ctx context.Context, sellerID int64) (int, error) {
	var count int
	err := s.pool.QueryRow(ctx, `SELECT COUNT(1) FROM invoices WHERE seller_id = $1`, sellerID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count invoices: %w", err)
	}
	return count, nil
}

func (s *Store) InvoicePublicIDExists(ctx context.Context, publicID string) (bool, error) {
	var exists bool
	err := s.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM invoices WHERE public_id = $1)`, publicID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check public id: %w", err)
	}
	return exists, nil
}

func (s *Store) TONCommentExists(ctx context.Context, comment string) (bool, error) {
	var exists bool
	err := s.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM invoices WHERE payment_comment = $1)`, comment).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check payment comment: %w", err)
	}
	return exists, nil
}

func (s *Store) SuffixRecentlyUsed(ctx context.Context, address string, network Network, suffix decimal.Decimal) (bool, error) {
	var exists bool
	err := s.pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1
			FROM invoices
			WHERE destination_address = $1
			  AND payable_network = $2
			  AND matching_suffix = $3
			  AND created_at >= NOW() - INTERVAL '48 hours'
		)
	`, address, network, suffix).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check suffix collision: %w", err)
	}
	return exists, nil
}

type CreateInvoiceParams struct {
	PublicID           string
	SellerID           int64
	Kind               InvoiceKind
	SubscriptionDays   int
	PlanCode           PlanCode
	CountTowardsTrial  bool
	Title              string
	BaseAmountUSD      decimal.Decimal
	PayableAmount      decimal.Decimal
	PayableNetwork     Network
	DestinationAddress string
	PaymentComment     *string
	MatchingSuffix     *decimal.Decimal
	ExpiresAt          time.Time
	Mode               string
}

func (s *Store) CreateInvoice(ctx context.Context, params CreateInvoiceParams) (Invoice, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Invoice{}, fmt.Errorf("begin create invoice tx: %w", err)
	}
	defer tx.Rollback(ctx)
	if params.Mode == "" {
		params.Mode = "live"
	}

	var invoice Invoice
	row := tx.QueryRow(ctx, `
		INSERT INTO invoices (
			public_id,
			seller_id,
			kind,
			subscription_days,
			plan_code,
			title,
			base_amount_usd,
			payable_amount,
			payable_network,
			destination_address,
			payment_comment,
			matching_suffix,
			status,
			expires_at,
			mode
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'awaiting_payment', $13, $14)
		RETURNING id, public_id, seller_id, kind, subscription_days, plan_code, title, base_amount_usd, payable_amount, payable_network, destination_address,
		          payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, mode, created_at
	`, params.PublicID, params.SellerID, params.Kind, params.SubscriptionDays, params.PlanCode, params.Title, params.BaseAmountUSD, params.PayableAmount, params.PayableNetwork,
		params.DestinationAddress, params.PaymentComment, params.MatchingSuffix, params.ExpiresAt, params.Mode)
	invoice, err = scanInvoice(row)
	if err != nil {
		return Invoice{}, err
	}

	if params.CountTowardsTrial {
		if _, err := tx.Exec(ctx, `
			UPDATE sellers
			SET free_invoices_used = free_invoices_used + 1
			WHERE id = $1
		`, params.SellerID); err != nil {
			return Invoice{}, fmt.Errorf("increment free_invoices_used: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Invoice{}, fmt.Errorf("commit create invoice tx: %w", err)
	}
	metrics.IncInvoiceTransition(metrics.SourceFromContext(ctx), string(invoice.Kind), "new", string(invoice.Status), "created")
	return invoice, nil
}

func (s *Store) ListInvoices(ctx context.Context, sellerID int64, limit int, offset int) ([]Invoice, error) {
	invoices := make([]Invoice, 0)
	rows, err := s.pool.Query(ctx, `
		SELECT id, public_id, seller_id, kind, subscription_days, plan_code, title, base_amount_usd, payable_amount, payable_network, destination_address,
		       payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, mode, created_at
		FROM invoices
		WHERE seller_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, sellerID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("list invoices: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		invoice, err := scanInvoice(rows)
		if err != nil {
			return nil, err
		}
		invoices = append(invoices, invoice)
	}
	return invoices, rows.Err()
}

func (s *Store) GetInvoiceByID(ctx context.Context, sellerID int64, invoiceID int64) (Invoice, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, public_id, seller_id, kind, subscription_days, plan_code, title, base_amount_usd, payable_amount, payable_network, destination_address,
		       payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, mode, created_at
		FROM invoices
		WHERE id = $1 AND seller_id = $2
	`, invoiceID, sellerID)
	return scanInvoice(row)
}

func (s *Store) GetInvoiceByPublicID(ctx context.Context, publicID string) (Invoice, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, public_id, seller_id, kind, subscription_days, plan_code, title, base_amount_usd, payable_amount, payable_network, destination_address,
		       payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, mode, created_at
		FROM invoices
		WHERE public_id = $1
	`, publicID)
	return scanInvoice(row)
}

func (s *Store) SetInvoiceStatus(ctx context.Context, sellerID int64, invoiceID int64, status InvoiceStatus) (Invoice, error) {
	row := s.pool.QueryRow(ctx, `
		UPDATE invoices
		SET status = $1
		WHERE id = $2 AND seller_id = $3
		RETURNING id, public_id, seller_id, kind, subscription_days, plan_code, title, base_amount_usd, payable_amount, payable_network, destination_address,
		          payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, mode, created_at
	`, status, invoiceID, sellerID)
	invoice, err := scanInvoice(row)
	if err != nil {
		return Invoice{}, err
	}
	metrics.IncInvoiceTransition(metrics.SourceFromContext(ctx), string(invoice.Kind), "unknown", string(status), "manual_status_update")
	return invoice, nil
}

func (s *Store) MarkInvoicePaidManual(ctx context.Context, sellerID int64, invoiceID int64) (Invoice, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Invoice{}, fmt.Errorf("begin manual mark paid tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var previousStatus InvoiceStatus
	if err := tx.QueryRow(ctx, `
		SELECT status
		FROM invoices
		WHERE id = $1 AND seller_id = $2
		FOR UPDATE
	`, invoiceID, sellerID).Scan(&previousStatus); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Invoice{}, ErrNotFound
		}
		return Invoice{}, fmt.Errorf("load invoice before manual mark paid: %w", err)
	}

	row := tx.QueryRow(ctx, `
		UPDATE invoices
		SET status = 'paid', paid_at = NOW()
		WHERE id = $1 AND seller_id = $2
		RETURNING id, public_id, seller_id, kind, subscription_days, plan_code, title, base_amount_usd, payable_amount, payable_network, destination_address,
		          payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, mode, created_at
	`, invoiceID, sellerID)
	invoice, err := scanInvoice(row)
	if err != nil {
		return Invoice{}, err
	}
	if err := applyInvoicePostPaymentEffects(ctx, tx, invoice); err != nil {
		return Invoice{}, err
	}
	if err := enqueueWebhookEventsTx(ctx, tx, invoice, "manual_mark_paid", invoice.PayableAmount); err != nil {
		return Invoice{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return Invoice{}, fmt.Errorf("commit manual mark paid tx: %w", err)
	}
	source := metrics.SourceFromContext(ctx)
	metrics.IncInvoiceTransition(source, string(invoice.Kind), string(previousStatus), string(invoice.Status), "manual_mark_paid")
	if invoice.Kind == InvoiceKindSubscription {
		metrics.IncInvoiceOperation("activate_subscription", source, string(invoice.Kind), string(invoice.PayableNetwork), string(invoice.PlanCode), "success", "manual_mark_paid")
	}
	return invoice, nil
}

func (s *Store) ExpireOverdueInvoices(ctx context.Context) (int64, error) {
	tag, err := s.pool.Exec(ctx, `
		UPDATE invoices
		SET status = 'expired'
		WHERE status = 'awaiting_payment'
		  AND expires_at < NOW()
	`)
	if err != nil {
		return 0, fmt.Errorf("expire overdue invoices: %w", err)
	}
	metrics.ObserveBatch("expired_invoices", metrics.SourceFromContext(ctx), int(tag.RowsAffected()))
	return tag.RowsAffected(), nil
}

func (s *Store) RecordObservedTransfer(ctx context.Context, transfer ObservedTransfer) (bool, error) {
	comment := any(nil)
	if transfer.PaymentComment != "" {
		comment = transfer.PaymentComment
	}

	tag, err := s.pool.Exec(ctx, `
		INSERT INTO payment_events (tx_hash, network, destination_address, amount, payment_comment, observed_at, raw_payload)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (tx_hash) DO NOTHING
	`, transfer.TxHash, transfer.Network, transfer.DestinationAddress, transfer.Amount, comment, transfer.ObservedAt, transfer.RawPayload)
	if err != nil {
		return false, fmt.Errorf("record observed transfer: %w", err)
	}
	return tag.RowsAffected() > 0, nil
}

func (s *Store) FindInvoiceByTONComment(ctx context.Context, address string, comment string) (Invoice, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, public_id, seller_id, kind, subscription_days, plan_code, title, base_amount_usd, payable_amount, payable_network, destination_address,
		       payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, mode, created_at
		FROM invoices
		WHERE payable_network = 'TON'
		  AND destination_address = $1
		  AND payment_comment = $2
		  AND mode = 'live'
		  AND status IN ('awaiting_payment', 'expired')
		ORDER BY created_at DESC
		LIMIT 1
	`, address, comment)
	return scanInvoice(row)
}

func (s *Store) FindInvoiceByExactAmount(ctx context.Context, address string, network Network, amount decimal.Decimal) (Invoice, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, public_id, seller_id, kind, subscription_days, plan_code, title, base_amount_usd, payable_amount, payable_network, destination_address,
		       payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, mode, created_at
		FROM invoices
		WHERE destination_address = $1
		  AND payable_network = $2
		  AND payable_amount = $3
		  AND mode = 'live'
		  AND status IN ('awaiting_payment', 'expired')
		ORDER BY created_at DESC
		LIMIT 1
	`, address, network, amount)
	return scanInvoice(row)
}

func (s *Store) FindPotentialUnderpaidInvoice(ctx context.Context, address string, network Network, amount decimal.Decimal) (Invoice, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, public_id, seller_id, kind, subscription_days, plan_code, title, base_amount_usd, payable_amount, payable_network, destination_address,
		       payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, mode, created_at
		FROM invoices
		WHERE destination_address = $1
		  AND payable_network = $2
		  AND mode = 'live'
		  AND status IN ('awaiting_payment', 'expired')
		  AND payable_amount > $3
		  AND payable_amount - $3 <= 2.500000
		  AND ROUND(payable_amount - TRUNC(payable_amount), 6) = ROUND($3 - TRUNC($3), 6)
		ORDER BY payable_amount - $3 ASC, created_at DESC
		LIMIT 1
	`, address, network, amount)
	return scanInvoice(row)
}

func (s *Store) CompleteInvoicePayment(ctx context.Context, invoiceID int64, previousStatus InvoiceStatus, txHash string, status InvoiceStatus, classification string, observedAmount decimal.Decimal, paidAt time.Time) (Invoice, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Invoice{}, fmt.Errorf("begin payment completion tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var invoice Invoice
	row := tx.QueryRow(ctx, `
		UPDATE invoices
		SET status = $1::invoice_status,
		    tx_hash = COALESCE(tx_hash, $2),
		    paid_at = CASE WHEN $1::invoice_status = 'paid'::invoice_status THEN $3 ELSE paid_at END
		WHERE id = $4
		RETURNING id, public_id, seller_id, kind, subscription_days, plan_code, title, base_amount_usd, payable_amount, payable_network, destination_address,
		          payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, mode, created_at
	`, status, txHash, paidAt, invoiceID)
	invoice, err = scanInvoice(row)
	if err != nil {
		return Invoice{}, err
	}
	if status == InvoiceStatusPaid {
		if err := applyInvoicePostPaymentEffects(ctx, tx, invoice); err != nil {
			return Invoice{}, err
		}
	}

	if _, err := tx.Exec(ctx, `
		UPDATE payment_events
		SET matched_invoice_id = $1, classification = $2
		WHERE tx_hash = $3
	`, invoiceID, classification, txHash); err != nil {
		return Invoice{}, fmt.Errorf("update payment event match: %w", err)
	}

	var telegramID sql.NullInt64
	if err := tx.QueryRow(ctx, `SELECT telegram_id FROM sellers WHERE id = $1`, invoice.SellerID).Scan(&telegramID); err != nil {
		return Invoice{}, fmt.Errorf("load seller telegram id: %w", err)
	}

	if telegramID.Valid {
		message := buildInvoiceNotificationMessage(invoice, classification, observedAmount)
		payload := buildInvoiceNotificationPayload(invoice, classification)
		if _, err := tx.Exec(ctx, `
			INSERT INTO notification_outbox (seller_id, recipient_telegram_id, message, payload)
			VALUES ($1, $2, $3, $4)
		`, invoice.SellerID, telegramID.Int64, message, payload); err != nil {
			return Invoice{}, fmt.Errorf("queue seller notification: %w", err)
		}
	}

	if status == InvoiceStatusPaid || status == InvoiceStatusUnderpaid || status == InvoiceStatusManualReview {
		if err := enqueueWebhookEventsTx(ctx, tx, invoice, classification, observedAmount); err != nil {
			return Invoice{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Invoice{}, fmt.Errorf("commit payment completion: %w", err)
	}
	source := metrics.SourceFromContext(ctx)
	metrics.IncInvoiceTransition(source, string(invoice.Kind), string(previousStatus), string(invoice.Status), classification)
	if invoice.Kind == InvoiceKindSubscription && invoice.Status == InvoiceStatusPaid {
		metrics.IncInvoiceOperation("activate_subscription", source, string(invoice.Kind), string(invoice.PayableNetwork), string(invoice.PlanCode), "success", classification)
	}
	return invoice, nil
}

func (s *Store) GetWatchedWallets(ctx context.Context) ([]WatchedWallet, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT DISTINCT
			CASE
				WHEN i.payable_network IN ('EVM', 'BASE', 'ARBITRUM', 'BSC') THEN 'EVM'
				WHEN i.payable_network::text = 'TON_USDT' THEN 'TON_USDT'
				ELSE i.payable_network::text
			END AS poll_network,
			i.payable_network,
			i.destination_address
		FROM invoices i
		WHERE i.mode = 'live'
		  AND i.status IN ('awaiting_payment', 'expired')
		  AND i.expires_at >= NOW() - INTERVAL '24 hours'
	`)
	if err != nil {
		return nil, fmt.Errorf("get watched wallets: %w", err)
	}
	defer rows.Close()

	var wallets []WatchedWallet
	for rows.Next() {
		var wallet WatchedWallet
		if err := rows.Scan(&wallet.PollNetwork, &wallet.PayableNetwork, &wallet.Address); err != nil {
			return nil, fmt.Errorf("scan watched wallet: %w", err)
		}
		wallets = append(wallets, wallet)
	}
	return wallets, rows.Err()
}

func (s *Store) ClaimNotificationJobs(ctx context.Context, limit int) ([]NotificationJob, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("begin notification claim tx: %w", err)
	}
	defer tx.Rollback(ctx)

	rows, err := tx.Query(ctx, `
		SELECT id, seller_id, recipient_telegram_id, message, payload, attempts
		FROM notification_outbox
		WHERE status IN ('pending', 'failed')
		  AND recipient_telegram_id IS NOT NULL
		  AND available_at <= NOW()
		ORDER BY created_at ASC
		FOR UPDATE SKIP LOCKED
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, fmt.Errorf("select notification jobs: %w", err)
	}
	defer rows.Close()

	var jobs []NotificationJob
	for rows.Next() {
		var job NotificationJob
		if err := rows.Scan(&job.ID, &job.SellerID, &job.RecipientTelegramID, &job.Message, &job.Payload, &job.Attempts); err != nil {
			return nil, fmt.Errorf("scan notification job: %w", err)
		}
		jobs = append(jobs, job)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	for _, job := range jobs {
		if _, err := tx.Exec(ctx, `
			UPDATE notification_outbox
			SET status = 'processing', attempts = attempts + 1
			WHERE id = $1
		`, job.ID); err != nil {
			return nil, fmt.Errorf("mark notification processing: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit notification claim: %w", err)
	}
	metrics.ObserveBatch("notification_claim", metrics.SourceFromContext(ctx), len(jobs))
	if len(jobs) > 0 {
		metrics.IncDeliveryEvent("telegram", "claim", "success")
	}
	return jobs, nil
}

func (s *Store) MarkNotificationSent(ctx context.Context, id int64) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE notification_outbox
		SET status = 'sent', sent_at = NOW(), last_error = NULL
		WHERE id = $1
	`, id)
	if err != nil {
		return fmt.Errorf("mark notification sent: %w", err)
	}
	metrics.IncDeliveryEvent("telegram", "send", "success")
	return nil
}

func (s *Store) MarkNotificationFailed(ctx context.Context, id int64, message string) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE notification_outbox
		SET status = 'failed',
		    last_error = $2,
		    available_at = NOW() + INTERVAL '2 minutes'
		WHERE id = $1
	`, id, message)
	if err != nil {
		return fmt.Errorf("mark notification failed: %w", err)
	}
	metrics.IncDeliveryEvent("telegram", "send", "failed")
	return nil
}

func scanSeller(row pgx.Row) (Seller, error) {
	var seller Seller
	var telegramID sql.NullInt64
	err := row.Scan(
		&seller.ID,
		&telegramID,
		&seller.Username,
		&seller.Email,
		&seller.DefaultNetwork,
		&seller.PlanCode,
		&seller.SubscriptionEndsAt,
		&seller.FreeInvoicesUsed,
		&seller.IsBlocked,
		&seller.TelegramLinkedAt,
		&seller.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return Seller{}, ErrNotFound
	}
	if err != nil {
		return Seller{}, fmt.Errorf("scan seller: %w", err)
	}
	if telegramID.Valid {
		value := telegramID.Int64
		seller.TelegramID = &value
	}
	return seller, nil
}

func scanWallet(row interface{ Scan(dest ...any) error }) (Wallet, error) {
	var wallet Wallet
	err := row.Scan(&wallet.ID, &wallet.SellerID, &wallet.Network, &wallet.Address, &wallet.IsActive, &wallet.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Wallet{}, ErrNotFound
	}
	if err != nil {
		return Wallet{}, fmt.Errorf("scan wallet: %w", err)
	}
	return wallet, nil
}

func scanInvoice(row interface{ Scan(dest ...any) error }) (Invoice, error) {
	var invoice Invoice
	err := row.Scan(
		&invoice.ID,
		&invoice.PublicID,
		&invoice.SellerID,
		&invoice.Kind,
		&invoice.SubscriptionDays,
		&invoice.PlanCode,
		&invoice.Title,
		&invoice.BaseAmountUSD,
		&invoice.PayableAmount,
		&invoice.PayableNetwork,
		&invoice.DestinationAddress,
		&invoice.PaymentComment,
		&invoice.MatchingSuffix,
		&invoice.Status,
		&invoice.ExpiresAt,
		&invoice.TxHash,
		&invoice.PaidAt,
		&invoice.Mode,
		&invoice.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return Invoice{}, ErrNotFound
	}
	if err != nil {
		return Invoice{}, fmt.Errorf("scan invoice: %w", err)
	}
	return invoice, nil
}

func applyInvoicePostPaymentEffects(ctx context.Context, tx pgx.Tx, invoice Invoice) error {
	if invoice.Kind != InvoiceKindSubscription || invoice.SubscriptionDays <= 0 {
		return nil
	}
	planCode := NormalizePlanCode(string(invoice.PlanCode))
	if planCode == PlanCodeTrial {
		planCode = PlanCodePro
	}
	if _, err := tx.Exec(ctx, `
		UPDATE sellers
		SET plan_code = $2,
		    subscription_ends_at = GREATEST(COALESCE(subscription_ends_at, NOW()), NOW()) + make_interval(days => $3)
		WHERE id = $1
	`, invoice.SellerID, planCode, invoice.SubscriptionDays); err != nil {
		return fmt.Errorf("extend seller subscription: %w", err)
	}
	return nil
}

func buildInvoiceNotificationMessage(invoice Invoice, classification string, observedAmount decimal.Decimal) string {
	received := observedAmount.StringFixed(payableScale(invoice.PayableNetwork))
	expected := invoice.PayableAmount.StringFixed(payableScale(invoice.PayableNetwork))

	if invoice.Kind == InvoiceKindSubscription && invoice.Status == InvoiceStatusPaid {
		planCode := NormalizePlanCode(string(invoice.PlanCode))
		if planCode == PlanCodeTrial {
			planCode = PlanCodePro
		}
		plan := ResolvePlan(planCode)
		return fmt.Sprintf("✅ Subscription activated: %s. Received %s %s. Valid for %d days.", plan.MarketingLabel, received, invoice.PayableNetwork, invoice.SubscriptionDays)
	}

	switch invoice.Status {
	case InvoiceStatusPaid:
		return fmt.Sprintf("✅ Payment confirmed for invoice %s. Received %s %s.", invoice.PublicID, received, invoice.PayableNetwork)
	case InvoiceStatusUnderpaid:
		if classification == "underpaid_fee_window" {
			return fmt.Sprintf("⚠️ Partial payment (likely fee-related): invoice %s received %s %s, expected %s %s. Please review and decide whether to accept.", invoice.PublicID, received, invoice.PayableNetwork, expected, invoice.PayableNetwork)
		}
		return fmt.Sprintf("⚠️ Underpayment detected: invoice %s received %s %s (expected %s %s). Manual review required.", invoice.PublicID, received, invoice.PayableNetwork, expected, invoice.PayableNetwork)
	case InvoiceStatusManualReview:
		if classification == "overpaid" {
			return fmt.Sprintf("⚠️ Overpayment detected: invoice %s received %s %s, expected %s %s. Status set to Manual Review.", invoice.PublicID, received, invoice.PayableNetwork, expected, invoice.PayableNetwork)
		}
		return fmt.Sprintf("⏳ Late payment: invoice %s received %s %s after expiration. Status set to Manual Review.", invoice.PublicID, received, invoice.PayableNetwork)
	default:
		return fmt.Sprintf("🔔 Invoice %s status updated to %s.", invoice.PublicID, invoice.Status)
	}
}

func buildInvoiceNotificationPayload(invoice Invoice, classification string) json.RawMessage {
	actions := make([]map[string]string, 0, 2)
	switch invoice.Status {
	case InvoiceStatusUnderpaid:
		actions = append(actions,
			map[string]string{"kind": "callback", "text": "Count as paid", "data": fmt.Sprintf("invoice:mark_paid:%d", invoice.ID)},
			map[string]string{"kind": "callback", "text": "Wait for top-up", "data": fmt.Sprintf("invoice:keep_underpaid:%d", invoice.ID)},
		)
	case InvoiceStatusManualReview:
		actions = append(actions,
			map[string]string{"kind": "callback", "text": "Count as paid", "data": fmt.Sprintf("invoice:mark_paid:%d", invoice.ID)},
			map[string]string{"kind": "callback", "text": "Keep review", "data": fmt.Sprintf("invoice:keep_review:%d", invoice.ID)},
		)
	}
	if len(actions) == 0 {
		return MustJSON(map[string]any{
			"invoice_id": invoice.ID,
			"public_id":  invoice.PublicID,
			"plan_code":  invoice.PlanCode,
		})
	}
	return MustJSON(map[string]any{
		"invoice_id":      invoice.ID,
		"public_id":       invoice.PublicID,
		"plan_code":       invoice.PlanCode,
		"classification":  classification,
		"invoice_actions": actions,
	})
}

func enqueueWebhookEventsTx(ctx context.Context, tx pgx.Tx, invoice Invoice, classification string, observedAmount decimal.Decimal) error {
	var seller Seller
	row := tx.QueryRow(ctx, `
		SELECT `+sellerSelectColumns+`
		FROM sellers
		WHERE id = $1
	`, invoice.SellerID)
	seller, err := scanSeller(row)
	if err != nil {
		return fmt.Errorf("load seller for webhook enqueue: %w", err)
	}

	plan := seller.EffectivePlan(time.Now())
	if plan.WebhookRetries <= 0 {
		return nil
	}

	eventType := invoiceWebhookEventType(invoice)
	payload := MustJSON(map[string]any{
		"event":           eventType,
		"classification":  classification,
		"observed_amount": observedAmount.StringFixed(payableScale(invoice.PayableNetwork)),
		"invoice": map[string]any{
			"id":                  invoice.ID,
			"public_id":           invoice.PublicID,
			"kind":                invoice.Kind,
			"plan_code":           invoice.PlanCode,
			"title":               invoice.Title,
			"status":              invoice.Status,
			"payable_amount":      invoice.PayableAmount.StringFixed(payableScale(invoice.PayableNetwork)),
			"payable_network":     invoice.PayableNetwork,
			"destination_address": invoice.DestinationAddress,
			"payment_comment":     valueOrEmpty(invoice.PaymentComment),
			"tx_hash":             valueOrEmpty(invoice.TxHash),
			"paid_at":             invoice.PaidAt,
		},
		"sent_at": time.Now().UTC(),
	})
	if err := enqueueWebhookDeliveriesTx(ctx, tx, invoice.SellerID, eventType, payload, plan.WebhookRetries); err != nil {
		return fmt.Errorf("enqueue invoice webhook deliveries: %w", err)
	}

	if invoice.Kind == InvoiceKindSubscription && invoice.Status == InvoiceStatusPaid {
		subscriptionPayload := MustJSON(map[string]any{
			"event": "subscription.activated",
			"plan": map[string]any{
				"code":         invoice.PlanCode,
				"name":         ResolvePlan(invoice.PlanCode).Name,
				"billing_days": invoice.SubscriptionDays,
			},
			"invoice_public_id": invoice.PublicID,
			"sent_at":           time.Now().UTC(),
		})
		if err := enqueueWebhookDeliveriesTx(ctx, tx, invoice.SellerID, "subscription.activated", subscriptionPayload, plan.WebhookRetries); err != nil {
			return fmt.Errorf("enqueue subscription webhook deliveries: %w", err)
		}
	}
	return nil
}

func invoiceWebhookEventType(invoice Invoice) string {
	switch invoice.Status {
	case InvoiceStatusPaid:
		return "invoice.paid"
	case InvoiceStatusUnderpaid:
		return "invoice.underpaid"
	case InvoiceStatusManualReview:
		return "invoice.manual_review"
	case InvoiceStatusExpired:
		return "invoice.expired"
	default:
		return "invoice.updated"
	}
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func payableScale(network Network) int32 {
	switch network {
	case NetworkTON:
		return 6
	case NetworkTRON, NetworkSOLANA, NetworkEVM, NetworkBASE, NetworkARBITRUM, NetworkBSC:
		return 6
	default:
		return 6
	}
}

func (s *Store) RawPool() *pgxpool.Pool {
	return s.pool
}

func MustJSON(value any) json.RawMessage {
	raw, _ := json.Marshal(value)
	return raw
}
