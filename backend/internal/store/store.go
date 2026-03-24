package store

import (
	"context"
	"database/sql"
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

const sellerSelectColumns = `
	id,
	telegram_id,
	COALESCE(username, ''),
	COALESCE(email, ''),
	default_network,
	subscription_ends_at,
	free_invoices_used,
	is_blocked,
	email_verified_at,
	telegram_linked_at,
	COALESCE(password_hash, ''),
	(password_hash IS NOT NULL AND BTRIM(password_hash) <> ''),
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

func (s *Store) CreateSellerWithEmail(ctx context.Context, email string, passwordHash string, verifiedAt time.Time) (Seller, error) {
	row := s.pool.QueryRow(ctx, `
		INSERT INTO sellers (email, password_hash, email_verified_at)
		VALUES (NULLIF($1, ''), $2, $3)
		RETURNING `+sellerSelectColumns+`
	`, email, passwordHash, verifiedAt)

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

func (s *Store) GetSellerByEmail(ctx context.Context, email string) (Seller, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT `+sellerSelectColumns+`
		FROM sellers
		WHERE LOWER(email) = LOWER($1)
	`, email)
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
		RETURNING `+sellerSelectColumns+`
	`, sellerID, days)
	return scanSeller(row)
}

func (s *Store) SetSellerBlocked(ctx context.Context, sellerID int64, blocked bool) (Seller, error) {
	row := s.pool.QueryRow(ctx, `
		UPDATE sellers
		SET is_blocked = $2
		WHERE id = $1
		RETURNING `+sellerSelectColumns+`
	`, sellerID, blocked)
	return scanSeller(row)
}

func (s *Store) UpdateSellerEmail(ctx context.Context, sellerID int64, email string) (Seller, error) {
	row := s.pool.QueryRow(ctx, `
		UPDATE sellers
		SET email = NULLIF($2, '')
		WHERE id = $1
		RETURNING `+sellerSelectColumns+`
	`, sellerID, email)
	return scanSeller(row)
}

func (s *Store) SetSellerEmailCredentials(ctx context.Context, sellerID int64, email string, passwordHash string, verifiedAt time.Time) (Seller, error) {
	row := s.pool.QueryRow(ctx, `
		UPDATE sellers
		SET email = NULLIF($2, ''),
		    password_hash = $3,
		    email_verified_at = $4
		WHERE id = $1
		RETURNING `+sellerSelectColumns+`
	`, sellerID, email, passwordHash, verifiedAt)
	return scanSeller(row)
}

func (s *Store) ResetSellerPassword(ctx context.Context, sellerID int64, passwordHash string) (Seller, error) {
	row := s.pool.QueryRow(ctx, `
		UPDATE sellers
		SET password_hash = $2
		WHERE id = $1
		RETURNING `+sellerSelectColumns+`
	`, sellerID, passwordHash)
	return scanSeller(row)
}

func (s *Store) LinkTelegramToSeller(ctx context.Context, sellerID int64, telegramID int64, username string) (Seller, error) {
	row := s.pool.QueryRow(ctx, `
		UPDATE sellers
		SET telegram_id = $2,
		    username = COALESCE(NULLIF($3, ''), username),
		    telegram_linked_at = COALESCE(telegram_linked_at, NOW())
		WHERE id = $1
		RETURNING `+sellerSelectColumns+`
	`, sellerID, telegramID, username)
	return scanSeller(row)
}

func (s *Store) StoreEmailAuthCode(ctx context.Context, sellerID *int64, email string, purpose string, codeHash string, expiresAt time.Time) error {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin store email auth code tx: %w", err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
		UPDATE email_auth_codes
		SET consumed_at = NOW()
		WHERE LOWER(email) = LOWER($1)
		  AND purpose = $2
		  AND consumed_at IS NULL
	`, email, purpose); err != nil {
		return fmt.Errorf("expire active email auth codes: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO email_auth_codes (seller_id, email, purpose, code_hash, expires_at)
		VALUES ($1, $2, $3, $4, $5)
	`, sellerID, email, purpose, codeHash, expiresAt); err != nil {
		return fmt.Errorf("insert email auth code: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit email auth code: %w", err)
	}
	return nil
}

func (s *Store) ConsumeEmailAuthCode(ctx context.Context, email string, purpose string, codeHash string) (*int64, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("begin consume email auth code tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var sellerID sql.NullInt64
	row := tx.QueryRow(ctx, `
		UPDATE email_auth_codes
		SET consumed_at = NOW()
		WHERE id = (
			SELECT id
			FROM email_auth_codes
			WHERE LOWER(email) = LOWER($1)
			  AND purpose = $2
			  AND code_hash = $3
			  AND consumed_at IS NULL
			  AND expires_at > NOW()
			ORDER BY created_at DESC
			LIMIT 1
			FOR UPDATE
		)
		RETURNING seller_id
	`, email, purpose, codeHash)
	if err := row.Scan(&sellerID); errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	} else if err != nil {
		return nil, fmt.Errorf("consume email auth code: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit consume email auth code: %w", err)
	}
	if sellerID.Valid {
		value := sellerID.Int64
		return &value, nil
	}
	return nil, nil
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
	CountTowardsTrial  bool
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
			kind,
			subscription_days,
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
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'awaiting_payment', $12)
		RETURNING id, public_id, seller_id, kind, subscription_days, title, base_amount_usd, payable_amount, payable_network, destination_address,
		          payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, created_at
	`, params.PublicID, params.SellerID, params.Kind, params.SubscriptionDays, params.Title, params.BaseAmountUSD, params.PayableAmount, params.PayableNetwork,
		params.DestinationAddress, params.PaymentComment, params.MatchingSuffix, params.ExpiresAt)
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
	return invoice, nil
}

func (s *Store) ListInvoices(ctx context.Context, sellerID int64, limit int, offset int) ([]Invoice, error) {
	invoices := make([]Invoice, 0)
	rows, err := s.pool.Query(ctx, `
		SELECT id, public_id, seller_id, kind, subscription_days, title, base_amount_usd, payable_amount, payable_network, destination_address,
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
		SELECT id, public_id, seller_id, kind, subscription_days, title, base_amount_usd, payable_amount, payable_network, destination_address,
		       payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, created_at
		FROM invoices
		WHERE id = $1 AND seller_id = $2
	`, invoiceID, sellerID)
	return scanInvoice(row)
}

func (s *Store) GetInvoiceByPublicID(ctx context.Context, publicID string) (Invoice, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, public_id, seller_id, kind, subscription_days, title, base_amount_usd, payable_amount, payable_network, destination_address,
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
		RETURNING id, public_id, seller_id, kind, subscription_days, title, base_amount_usd, payable_amount, payable_network, destination_address,
		          payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, created_at
	`, status, invoiceID, sellerID)
	return scanInvoice(row)
}

func (s *Store) MarkInvoicePaidManual(ctx context.Context, sellerID int64, invoiceID int64) (Invoice, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Invoice{}, fmt.Errorf("begin manual mark paid tx: %w", err)
	}
	defer tx.Rollback(ctx)

	row := tx.QueryRow(ctx, `
		UPDATE invoices
		SET status = 'paid', paid_at = NOW()
		WHERE id = $1 AND seller_id = $2
		RETURNING id, public_id, seller_id, kind, subscription_days, title, base_amount_usd, payable_amount, payable_network, destination_address,
		          payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, created_at
	`, invoiceID, sellerID)
	invoice, err := scanInvoice(row)
	if err != nil {
		return Invoice{}, err
	}
	if err := applyInvoicePostPaymentEffects(ctx, tx, invoice); err != nil {
		return Invoice{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return Invoice{}, fmt.Errorf("commit manual mark paid tx: %w", err)
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
		SELECT id, public_id, seller_id, kind, subscription_days, title, base_amount_usd, payable_amount, payable_network, destination_address,
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
		SELECT id, public_id, seller_id, kind, subscription_days, title, base_amount_usd, payable_amount, payable_network, destination_address,
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
		SELECT id, public_id, seller_id, kind, subscription_days, title, base_amount_usd, payable_amount, payable_network, destination_address,
		       payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, created_at
		FROM invoices
		WHERE destination_address = $1
		  AND payable_network = $2
		  AND status IN ('awaiting_payment', 'expired')
		  AND payable_amount > $3
		  AND payable_amount - $3 <= 2.500000
		  AND ROUND(payable_amount - TRUNC(payable_amount), 6) = ROUND($3 - TRUNC($3), 6)
		ORDER BY payable_amount - $3 ASC, created_at DESC
		LIMIT 1
	`, address, network, amount)
	return scanInvoice(row)
}

func (s *Store) CompleteInvoicePayment(ctx context.Context, invoiceID int64, txHash string, status InvoiceStatus, classification string, observedAmount decimal.Decimal, paidAt time.Time) (Invoice, error) {
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
		RETURNING id, public_id, seller_id, kind, subscription_days, title, base_amount_usd, payable_amount, payable_network, destination_address,
		          payment_comment, matching_suffix, status, expires_at, tx_hash, paid_at, created_at
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

	if err := tx.Commit(ctx); err != nil {
		return Invoice{}, fmt.Errorf("commit payment completion: %w", err)
	}
	return invoice, nil
}

func (s *Store) GetWatchedWallets(ctx context.Context) ([]WatchedWallet, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT DISTINCT
			CASE
				WHEN i.payable_network IN ('EVM', 'BASE', 'ARBITRUM', 'BSC') THEN 'EVM'::network
				ELSE i.payable_network
			END AS poll_network,
			i.payable_network,
			i.destination_address
		FROM invoices i
		WHERE i.status = 'awaiting_payment'
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
	var telegramID sql.NullInt64
	err := row.Scan(
		&seller.ID,
		&telegramID,
		&seller.Username,
		&seller.Email,
		&seller.DefaultNetwork,
		&seller.SubscriptionEndsAt,
		&seller.FreeInvoicesUsed,
		&seller.IsBlocked,
		&seller.EmailVerifiedAt,
		&seller.TelegramLinkedAt,
		&seller.PasswordHash,
		&seller.HasPassword,
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

func applyInvoicePostPaymentEffects(ctx context.Context, tx pgx.Tx, invoice Invoice) error {
	if invoice.Kind != InvoiceKindSubscription || invoice.SubscriptionDays <= 0 {
		return nil
	}
	if _, err := tx.Exec(ctx, `
		UPDATE sellers
		SET subscription_ends_at = GREATEST(COALESCE(subscription_ends_at, NOW()), NOW()) + ($2 || ' days')::interval
		WHERE id = $1
	`, invoice.SellerID, invoice.SubscriptionDays); err != nil {
		return fmt.Errorf("extend seller subscription: %w", err)
	}
	return nil
}

func buildInvoiceNotificationMessage(invoice Invoice, classification string, observedAmount decimal.Decimal) string {
	received := observedAmount.StringFixed(payableScale(invoice.PayableNetwork))
	expected := invoice.PayableAmount.StringFixed(payableScale(invoice.PayableNetwork))
	if invoice.Kind == InvoiceKindSubscription && invoice.Status == InvoiceStatusPaid {
		return fmt.Sprintf("Reqst PRO unlocked. Received %s %s. Your unlimited plan is active for %d days.", received, invoice.PayableNetwork, invoice.SubscriptionDays)
	}
	switch invoice.Status {
	case InvoiceStatusPaid:
		return fmt.Sprintf("Invoice %s is paid. Received %s %s. Tx: %s", invoice.PublicID, received, invoice.PayableNetwork, valueOrEmpty(invoice.TxHash))
	case InvoiceStatusUnderpaid:
		if classification == "underpaid_fee_window" {
			return fmt.Sprintf("Invoice %s was likely affected by an exchange fee. Received %s %s, expected %s %s. Choose whether to accept the payment or wait for the remaining balance.", invoice.PublicID, received, invoice.PayableNetwork, expected, invoice.PayableNetwork)
		}
		return fmt.Sprintf("Invoice %s received %s %s instead of %s %s. Manual action required.", invoice.PublicID, received, invoice.PayableNetwork, expected, invoice.PayableNetwork)
	case InvoiceStatusManualReview:
		return fmt.Sprintf("Invoice %s received %s %s after expiration. Status set to Manual Review.", invoice.PublicID, received, invoice.PayableNetwork)
	default:
		return fmt.Sprintf("Invoice %s changed status to %s.", invoice.PublicID, invoice.Status)
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
		})
	}
	return MustJSON(map[string]any{
		"invoice_id":      invoice.ID,
		"public_id":       invoice.PublicID,
		"classification":  classification,
		"invoice_actions": actions,
	})
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
