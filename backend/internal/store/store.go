package store

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"reqst/backend/internal/db"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

var ErrNotFound = errors.New("not found")

type Store struct {
	pool *pgxpool.Pool
}

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
		INSERT INTO sellers (telegram_id, username)
		VALUES ($1, NULLIF($2, ''))
		ON CONFLICT (telegram_id)
		DO UPDATE SET username = COALESCE(NULLIF(EXCLUDED.username, ''), sellers.username)
		RETURNING id, telegram_id, COALESCE(username, ''), default_network, subscription_ends_at, free_invoices_used, is_blocked, created_at
	`, telegramID, username)

	return scanSeller(row)
}

func (s *Store) GetSellerByID(ctx context.Context, sellerID int64) (Seller, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, telegram_id, COALESCE(username, ''), default_network, subscription_ends_at, free_invoices_used, is_blocked, created_at
		FROM sellers
		WHERE id = $1
	`, sellerID)
	return scanSeller(row)
}

func (s *Store) GetSellerByTelegramID(ctx context.Context, telegramID int64) (Seller, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, telegram_id, COALESCE(username, ''), default_network, subscription_ends_at, free_invoices_used, is_blocked, created_at
		FROM sellers
		WHERE telegram_id = $1
	`, telegramID)
	return scanSeller(row)
}

func (s *Store) GrantPRO(ctx context.Context, sellerID int64, days int) (Seller, error) {
	if days <= 0 {
		days = 30
	}

	row := s.pool.QueryRow(ctx, `
		UPDATE sellers
		SET subscription_ends_at = GREATEST(COALESCE(subscription_ends_at, NOW()), NOW()) + ($2 || ' days')::interval
		WHERE id = $1
		RETURNING id, telegram_id, COALESCE(username, ''), default_network, subscription_ends_at, free_invoices_used, is_blocked, created_at
	`, sellerID, days)
	return scanSeller(row)
}

func (s *Store) SetSellerBlocked(ctx context.Context, sellerID int64, blocked bool) (Seller, error) {
	row := s.pool.QueryRow(ctx, `
		UPDATE sellers
		SET is_blocked = $2
		WHERE id = $1
		RETURNING id, telegram_id, COALESCE(username, ''), default_network, subscription_ends_at, free_invoices_used, is_blocked, created_at
	`, sellerID, blocked)
	return scanSeller(row)
}

func (s *Store) ListWallets(ctx context.Context, sellerID int64) ([]Wallet, error) {
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

	var wallets []Wallet
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
	return scanWallet(row)
}

func (s *Store) DeactivateWallet(ctx context.Context, sellerID int64, walletID int64) error {
	tag, err := s.pool.Exec(ctx, `
		UPDATE wallets
		SET is_active = FALSE
		WHERE id = $1 AND seller_id = $2
	`, walletID, sellerID)
	if err != nil {
		return fmt.Errorf("deactivate wallet: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
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
	Title              string
	BaseAmountUSD      decimal.Decimal
	PayableAmount      decimal.Decimal
	PayableNetwork     Network
	DestinationAddress string
	PaymentComment     *string
	MatchingSuffix     *decimal.Decimal
	ExpiresAt          time.Time
}

func (s *Store) CreateInvoice(ctx context.Context, params CreateInvoiceParams) (Invoice, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Invoice{}, fmt.Errorf("begin create invoice tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var invoice Invoice
	row := tx.QueryRow(ctx, `
		INSERT INTO invoices (
			public_id,
			seller_id,
			title,
			base_amount_usd,
			payable_amount,
			payable_network,
			destination_address,
			payment_comment,
			matching_suffix,
			status,
			expires_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'awaiting_payment', $10)
		RETURNING id, public_id, seller_id, title, base_amount_usd, payable_amount, payable_network, destination_address,
		          payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, created_at
	`, params.PublicID, params.SellerID, params.Title, params.BaseAmountUSD, params.PayableAmount, params.PayableNetwork,
		params.DestinationAddress, params.PaymentComment, params.MatchingSuffix, params.ExpiresAt)
	invoice, err = scanInvoice(row)
	if err != nil {
		return Invoice{}, err
	}

	if _, err := tx.Exec(ctx, `
		UPDATE sellers
		SET free_invoices_used = free_invoices_used + 1
		WHERE id = $1
	`, params.SellerID); err != nil {
		return Invoice{}, fmt.Errorf("increment free_invoices_used: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return Invoice{}, fmt.Errorf("commit create invoice tx: %w", err)
	}
	return invoice, nil
}

func (s *Store) ListInvoices(ctx context.Context, sellerID int64, limit int, offset int) ([]Invoice, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, public_id, seller_id, title, base_amount_usd, payable_amount, payable_network, destination_address,
		       payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, created_at
		FROM invoices
		WHERE seller_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, sellerID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("list invoices: %w", err)
	}
	defer rows.Close()

	var invoices []Invoice
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
		SELECT id, public_id, seller_id, title, base_amount_usd, payable_amount, payable_network, destination_address,
		       payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, created_at
		FROM invoices
		WHERE id = $1 AND seller_id = $2
	`, invoiceID, sellerID)
	return scanInvoice(row)
}

func (s *Store) GetInvoiceByPublicID(ctx context.Context, publicID string) (Invoice, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, public_id, seller_id, title, base_amount_usd, payable_amount, payable_network, destination_address,
		       payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, created_at
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
		RETURNING id, public_id, seller_id, title, base_amount_usd, payable_amount, payable_network, destination_address,
		          payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, created_at
	`, status, invoiceID, sellerID)
	return scanInvoice(row)
}

func (s *Store) MarkInvoicePaidManual(ctx context.Context, sellerID int64, invoiceID int64) (Invoice, error) {
	row := s.pool.QueryRow(ctx, `
		UPDATE invoices
		SET status = 'paid', paid_at = NOW()
		WHERE id = $1 AND seller_id = $2
		RETURNING id, public_id, seller_id, title, base_amount_usd, payable_amount, payable_network, destination_address,
		          payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, created_at
	`, invoiceID, sellerID)
	return scanInvoice(row)
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
		SELECT id, public_id, seller_id, title, base_amount_usd, payable_amount, payable_network, destination_address,
		       payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, created_at
		FROM invoices
		WHERE payable_network = 'TON'
		  AND destination_address = $1
		  AND payment_comment = $2
		  AND status IN ('awaiting_payment', 'expired')
		ORDER BY created_at DESC
		LIMIT 1
	`, address, comment)
	return scanInvoice(row)
}

func (s *Store) FindInvoiceByExactAmount(ctx context.Context, address string, network Network, amount decimal.Decimal) (Invoice, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, public_id, seller_id, title, base_amount_usd, payable_amount, payable_network, destination_address,
		       payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, created_at
		FROM invoices
		WHERE destination_address = $1
		  AND payable_network = $2
		  AND payable_amount = $3
		  AND status IN ('awaiting_payment', 'expired')
		ORDER BY created_at DESC
		LIMIT 1
	`, address, network, amount)
	return scanInvoice(row)
}

func (s *Store) FindPotentialUnderpaidInvoice(ctx context.Context, address string, network Network, amount decimal.Decimal) (Invoice, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, public_id, seller_id, title, base_amount_usd, payable_amount, payable_network, destination_address,
		       payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, created_at
		FROM invoices
		WHERE destination_address = $1
		  AND payable_network = $2
		  AND status IN ('awaiting_payment', 'expired')
		  AND base_amount_usd <= $3
		  AND payable_amount > $3
		ORDER BY created_at DESC
		LIMIT 1
	`, address, network, amount)
	return scanInvoice(row)
}

func (s *Store) CompleteInvoicePayment(ctx context.Context, invoiceID int64, txHash string, status InvoiceStatus, classification string, paidAt time.Time) (Invoice, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Invoice{}, fmt.Errorf("begin payment completion tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var invoice Invoice
	row := tx.QueryRow(ctx, `
		UPDATE invoices
		SET status = $1,
		    tx_hash = COALESCE(tx_hash, $2),
		    paid_at = CASE WHEN $1 = 'paid' THEN $3 ELSE paid_at END
		WHERE id = $4
		RETURNING id, public_id, seller_id, title, base_amount_usd, payable_amount, payable_network, destination_address,
		          payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, created_at
	`, status, txHash, paidAt, invoiceID)
	invoice, err = scanInvoice(row)
	if err != nil {
		return Invoice{}, err
	}

	if _, err := tx.Exec(ctx, `
		UPDATE payment_events
		SET matched_invoice_id = $1, classification = $2
		WHERE tx_hash = $3
	`, invoiceID, classification, txHash); err != nil {
		return Invoice{}, fmt.Errorf("update payment event match: %w", err)
	}

	var telegramID int64
	if err := tx.QueryRow(ctx, `SELECT telegram_id FROM sellers WHERE id = $1`, invoice.SellerID).Scan(&telegramID); err != nil {
		return Invoice{}, fmt.Errorf("load seller telegram id: %w", err)
	}

	message := buildInvoiceNotificationMessage(invoice)
	if _, err := tx.Exec(ctx, `
		INSERT INTO notification_outbox (seller_id, recipient_telegram_id, message)
		VALUES ($1, $2, $3)
	`, invoice.SellerID, telegramID, message); err != nil {
		return Invoice{}, fmt.Errorf("queue seller notification: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return Invoice{}, fmt.Errorf("commit payment completion: %w", err)
	}
	return invoice, nil
}

func (s *Store) GetWatchedWallets(ctx context.Context) ([]WatchedWallet, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT DISTINCT w.network, w.address
		FROM wallets w
		INNER JOIN invoices i
		  ON i.seller_id = w.seller_id
		 AND i.destination_address = w.address
		 AND i.payable_network = w.network
		WHERE w.is_active = TRUE
		  AND i.status = 'awaiting_payment'
	`)
	if err != nil {
		return nil, fmt.Errorf("get watched wallets: %w", err)
	}
	defer rows.Close()

	var wallets []WatchedWallet
	for rows.Next() {
		var wallet WatchedWallet
		if err := rows.Scan(&wallet.Network, &wallet.Address); err != nil {
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
		SELECT id, seller_id, recipient_telegram_id, message, attempts
		FROM notification_outbox
		WHERE status IN ('pending', 'failed')
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
		if err := rows.Scan(&job.ID, &job.SellerID, &job.RecipientTelegramID, &job.Message, &job.Attempts); err != nil {
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
	return nil
}

func scanSeller(row pgx.Row) (Seller, error) {
	var seller Seller
	err := row.Scan(
		&seller.ID,
		&seller.TelegramID,
		&seller.Username,
		&seller.DefaultNetwork,
		&seller.SubscriptionEndsAt,
		&seller.FreeInvoicesUsed,
		&seller.IsBlocked,
		&seller.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return Seller{}, ErrNotFound
	}
	if err != nil {
		return Seller{}, fmt.Errorf("scan seller: %w", err)
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

func buildInvoiceNotificationMessage(invoice Invoice) string {
	switch invoice.Status {
	case InvoiceStatusPaid:
		return fmt.Sprintf("Invoice %s is paid. Tx: %s", invoice.PublicID, valueOrEmpty(invoice.TxHash))
	case InvoiceStatusUnderpaid:
		return fmt.Sprintf("Invoice %s received an underpayment and needs manual action.", invoice.PublicID)
	case InvoiceStatusManualReview:
		return fmt.Sprintf("Invoice %s received a late payment and moved to manual review.", invoice.PublicID)
	default:
		return fmt.Sprintf("Invoice %s changed status to %s.", invoice.PublicID, invoice.Status)
	}
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func (s *Store) RawPool() *pgxpool.Pool {
	return s.pool
}

func MustJSON(value any) json.RawMessage {
	raw, _ := json.Marshal(value)
	return raw
}
