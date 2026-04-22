package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"reqst/backend/internal/metrics"

	"github.com/jackc/pgx/v5"
)

type APIKey struct {
	ID         int64      `json:"id"`
	SellerID   int64      `json:"seller_id"`
	Label      string     `json:"label"`
	Prefix     string     `json:"prefix"`
	Mode       string     `json:"mode"`
	Scopes     []string   `json:"scopes"`
	LastUsedAt *time.Time `json:"last_used_at"`
	RevokedAt  *time.Time `json:"revoked_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

type APIKeyRecord struct {
	APIKey
	TokenHash string
}

type WebhookEndpoint struct {
	ID             int64      `json:"id"`
	SellerID       int64      `json:"seller_id"`
	Label          string     `json:"label"`
	URL            string     `json:"url"`
	Secret         string     `json:"secret,omitempty"`
	IsActive       bool       `json:"is_active"`
	LastDeliveryAt *time.Time `json:"last_delivery_at"`
	LastSuccessAt  *time.Time `json:"last_success_at"`
	CreatedAt      time.Time  `json:"created_at"`
}

type WebhookDelivery struct {
	ID             int64           `json:"id"`
	EventID        string          `json:"event_id"`
	EndpointID     int64           `json:"endpoint_id"`
	SellerID       int64           `json:"seller_id"`
	TargetURL      string          `json:"target_url,omitempty"`
	Secret         string          `json:"-"`
	EventType      string          `json:"event_type"`
	Payload        json.RawMessage `json:"payload"`
	Status         string          `json:"status,omitempty"`
	Attempts       int             `json:"attempts"`
	MaxAttempts    int             `json:"max_attempts"`
	AvailableAt    time.Time       `json:"available_at,omitempty"`
	LastHTTPStatus *int            `json:"last_http_status,omitempty"`
	LastError      *string         `json:"last_error,omitempty"`
	CreatedAt      time.Time       `json:"created_at,omitempty"`
	SentAt         *time.Time      `json:"sent_at,omitempty"`
}

type IdempotencyRecord struct {
	ID             int64
	SellerID       int64
	APIKeyID       int64
	Method         string
	Path           string
	IdempotencyKey string
	RequestHash    string
	StatusCode     *int
	ResponseBody   json.RawMessage
}

type WatcherCheckpoint struct {
	PollNetwork        Network
	PayableNetwork     Network
	DestinationAddress string
	LastBlock          int64
	LastObservedAt     *time.Time
}

func (s *Store) CountActiveAPIKeys(ctx context.Context, sellerID int64) (int, error) {
	var count int
	if err := s.pool.QueryRow(ctx, `
		SELECT COUNT(1)
		FROM api_keys
		WHERE seller_id = $1
		  AND revoked_at IS NULL
	`, sellerID).Scan(&count); err != nil {
		return 0, fmt.Errorf("count active api keys: %w", err)
	}
	return count, nil
}

func (s *Store) ListAPIKeys(ctx context.Context, sellerID int64) ([]APIKey, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, seller_id, label, prefix, mode, scopes, last_used_at, revoked_at, created_at
		FROM api_keys
		WHERE seller_id = $1
		  AND revoked_at IS NULL
		ORDER BY created_at DESC
	`, sellerID)
	if err != nil {
		return nil, fmt.Errorf("list api keys: %w", err)
	}
	defer rows.Close()

	var items []APIKey
	for rows.Next() {
		item, err := scanAPIKey(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) CreateAPIKey(ctx context.Context, sellerID int64, label string, prefix string, tokenHash string, scopes []string, mode string) (APIKey, error) {
	row := s.pool.QueryRow(ctx, `
		INSERT INTO api_keys (seller_id, label, prefix, token_hash, scopes, mode)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, seller_id, label, prefix, mode, scopes, last_used_at, revoked_at, created_at
	`, sellerID, label, prefix, tokenHash, scopes, mode)
	item, err := scanAPIKey(row)
	if err != nil {
		metrics.IncResourceOperation("api_key", "create", "failure")
		return APIKey{}, err
	}
	metrics.IncResourceOperation("api_key", "create", "success")
	return item, nil
}

func (s *Store) RevokeAPIKey(ctx context.Context, sellerID int64, keyID int64) error {
	tag, err := s.pool.Exec(ctx, `
		UPDATE api_keys
		SET revoked_at = NOW()
		WHERE id = $1
		  AND seller_id = $2
		  AND revoked_at IS NULL
	`, keyID, sellerID)
	if err != nil {
		metrics.IncResourceOperation("api_key", "revoke", "failure")
		return fmt.Errorf("revoke api key: %w", err)
	}
	if tag.RowsAffected() == 0 {
		metrics.IncResourceOperation("api_key", "revoke", "not_found")
		return ErrNotFound
	}
	metrics.IncResourceOperation("api_key", "revoke", "success")
	return nil
}

func (s *Store) GetAPIKeyByTokenHash(ctx context.Context, tokenHash string) (APIKeyRecord, error) {
	var record APIKeyRecord
	var lastUsedAt sql.NullTime
	var revokedAt sql.NullTime
	row := s.pool.QueryRow(ctx, `
		SELECT id, seller_id, label, prefix, mode, token_hash, scopes, last_used_at, revoked_at, created_at
		FROM api_keys
		WHERE token_hash = $1
		  AND revoked_at IS NULL
	`, tokenHash)
	err := row.Scan(
		&record.ID,
		&record.SellerID,
		&record.Label,
		&record.Prefix,
		&record.Mode,
		&record.TokenHash,
		&record.Scopes,
		&lastUsedAt,
		&revokedAt,
		&record.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return APIKeyRecord{}, ErrNotFound
	}
	if err != nil {
		return APIKeyRecord{}, fmt.Errorf("get api key by token hash: %w", err)
	}
	if lastUsedAt.Valid {
		record.LastUsedAt = &lastUsedAt.Time
	}
	if revokedAt.Valid {
		record.RevokedAt = &revokedAt.Time
	}
	return record, nil
}

func (s *Store) TouchAPIKeyLastUsed(ctx context.Context, keyID int64) error {
	if _, err := s.pool.Exec(ctx, `
		UPDATE api_keys
		SET last_used_at = NOW()
		WHERE id = $1
	`, keyID); err != nil {
		return fmt.Errorf("touch api key last used: %w", err)
	}
	return nil
}

func (s *Store) CountAPIRequestsSince(ctx context.Context, sellerID int64, keyID *int64, since time.Time) (int, error) {
	var count int
	if keyID != nil {
		if err := s.pool.QueryRow(ctx, `
			SELECT COUNT(1)
			FROM api_request_logs
			WHERE seller_id = $1
			  AND api_key_id = $2
			  AND created_at >= $3
		`, sellerID, *keyID, since).Scan(&count); err != nil {
			return 0, fmt.Errorf("count api requests since: %w", err)
		}
		return count, nil
	}

	if err := s.pool.QueryRow(ctx, `
		SELECT COUNT(1)
		FROM api_request_logs
		WHERE seller_id = $1
		  AND created_at >= $2
	`, sellerID, since).Scan(&count); err != nil {
		return 0, fmt.Errorf("count api requests since: %w", err)
	}
	return count, nil
}

func (s *Store) RecordAPIRequest(ctx context.Context, sellerID int64, keyID int64, method string, path string, statusCode int) error {
	if _, err := s.pool.Exec(ctx, `
		INSERT INTO api_request_logs (seller_id, api_key_id, method, path, status_code)
		VALUES ($1, $2, $3, $4, $5)
	`, sellerID, keyID, method, path, statusCode); err != nil {
		return fmt.Errorf("record api request: %w", err)
	}
	return nil
}

func (s *Store) ListWebhookEndpoints(ctx context.Context, sellerID int64) ([]WebhookEndpoint, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, seller_id, label, url, secret, is_active, last_delivery_at, last_success_at, created_at
		FROM webhook_endpoints
		WHERE seller_id = $1
		  AND is_active = TRUE
		ORDER BY created_at DESC
	`, sellerID)
	if err != nil {
		return nil, fmt.Errorf("list webhook endpoints: %w", err)
	}
	defer rows.Close()

	var items []WebhookEndpoint
	for rows.Next() {
		item, err := scanWebhookEndpoint(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) PublicWebhookEndpoint(endpoint WebhookEndpoint) WebhookEndpoint {
	endpoint.Secret = ""
	return endpoint
}

func (s *Store) CreateWebhookEndpoint(ctx context.Context, sellerID int64, label string, endpointURL string, secret string) (WebhookEndpoint, error) {
	row := s.pool.QueryRow(ctx, `
		INSERT INTO webhook_endpoints (seller_id, label, url, secret)
		VALUES ($1, $2, $3, $4)
		RETURNING id, seller_id, label, url, secret, is_active, last_delivery_at, last_success_at, created_at
	`, sellerID, label, endpointURL, secret)
	item, err := scanWebhookEndpoint(row)
	if err != nil {
		metrics.IncResourceOperation("webhook_endpoint", "create", "failure")
		return WebhookEndpoint{}, err
	}
	metrics.IncResourceOperation("webhook_endpoint", "create", "success")
	return item, nil
}

func (s *Store) RotateWebhookEndpointSecret(ctx context.Context, sellerID int64, endpointID int64, secret string) (WebhookEndpoint, error) {
	row := s.pool.QueryRow(ctx, `
		UPDATE webhook_endpoints
		SET secret = $3
		WHERE id = $1
		  AND seller_id = $2
		  AND is_active = TRUE
		RETURNING id, seller_id, label, url, secret, is_active, last_delivery_at, last_success_at, created_at
	`, endpointID, sellerID, secret)
	item, err := scanWebhookEndpoint(row)
	if err != nil {
		return WebhookEndpoint{}, err
	}
	metrics.IncResourceOperation("webhook_endpoint", "rotate_secret", "success")
	return item, nil
}

func (s *Store) DeactivateWebhookEndpoint(ctx context.Context, sellerID int64, endpointID int64) error {
	tag, err := s.pool.Exec(ctx, `
		UPDATE webhook_endpoints
		SET is_active = FALSE
		WHERE id = $1
		  AND seller_id = $2
		  AND is_active = TRUE
	`, endpointID, sellerID)
	if err != nil {
		metrics.IncResourceOperation("webhook_endpoint", "deactivate", "failure")
		return fmt.Errorf("deactivate webhook endpoint: %w", err)
	}
	if tag.RowsAffected() == 0 {
		metrics.IncResourceOperation("webhook_endpoint", "deactivate", "not_found")
		return ErrNotFound
	}
	metrics.IncResourceOperation("webhook_endpoint", "deactivate", "success")
	return nil
}

func (s *Store) ClaimWebhookDeliveries(ctx context.Context, limit int) ([]WebhookDelivery, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("begin webhook claim tx: %w", err)
	}
	defer tx.Rollback(ctx)

	rows, err := tx.Query(ctx, `
		SELECT d.id, d.event_id, d.endpoint_id, d.seller_id, e.url, e.secret, d.event_type, d.payload, d.attempts, d.max_attempts
		FROM webhook_deliveries d
		JOIN webhook_endpoints e ON e.id = d.endpoint_id
		WHERE d.status IN ('pending', 'failed')
		  AND d.available_at <= NOW()
		  AND e.is_active = TRUE
		ORDER BY d.created_at ASC
		FOR UPDATE SKIP LOCKED
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, fmt.Errorf("select webhook deliveries: %w", err)
	}
	defer rows.Close()

	var items []WebhookDelivery
	for rows.Next() {
		var item WebhookDelivery
		if err := rows.Scan(
			&item.ID,
			&item.EventID,
			&item.EndpointID,
			&item.SellerID,
			&item.TargetURL,
			&item.Secret,
			&item.EventType,
			&item.Payload,
			&item.Attempts,
			&item.MaxAttempts,
		); err != nil {
			return nil, fmt.Errorf("scan webhook delivery: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	for _, item := range items {
		if _, err := tx.Exec(ctx, `
			UPDATE webhook_deliveries
			SET status = 'processing',
			    attempts = attempts + 1
			WHERE id = $1
		`, item.ID); err != nil {
			return nil, fmt.Errorf("mark webhook delivery processing: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit webhook claim: %w", err)
	}

	for index := range items {
		items[index].Attempts++
	}
	metrics.ObserveBatch("webhook_claim", metrics.SourceFromContext(ctx), len(items))
	if len(items) > 0 {
		metrics.IncDeliveryEvent("webhook", "claim", "success")
	}
	return items, nil
}

func (s *Store) MarkWebhookDeliverySent(ctx context.Context, deliveryID int64, endpointID int64) error {
	if _, err := s.pool.Exec(ctx, `
		UPDATE webhook_deliveries
		SET status = 'sent',
		    sent_at = NOW(),
		    last_error = NULL
		WHERE id = $1
	`, deliveryID); err != nil {
		return fmt.Errorf("mark webhook sent: %w", err)
	}
	if _, err := s.pool.Exec(ctx, `
		UPDATE webhook_endpoints
		SET last_delivery_at = NOW(),
		    last_success_at = NOW()
		WHERE id = $1
	`, endpointID); err != nil {
		return fmt.Errorf("touch webhook endpoint success: %w", err)
	}
	metrics.IncDeliveryEvent("webhook", "send", "success")
	return nil
}

func (s *Store) MarkWebhookDeliveryFailed(ctx context.Context, deliveryID int64, endpointID int64, attempts int, maxAttempts int, statusCode int, message string) error {
	state := "failed"
	availableAt := time.Now().UTC().Add(2 * time.Minute)
	if attempts >= maxAttempts {
		state = "dead"
		availableAt = time.Now().UTC()
	}
	if _, err := s.pool.Exec(ctx, `
		UPDATE webhook_deliveries
		SET status = $2,
		    available_at = $3,
		    last_http_status = $4,
		    last_error = $5
		WHERE id = $1
	`, deliveryID, state, availableAt, statusCode, message); err != nil {
		return fmt.Errorf("mark webhook delivery failed: %w", err)
	}
	if _, err := s.pool.Exec(ctx, `
		UPDATE webhook_endpoints
		SET last_delivery_at = NOW()
		WHERE id = $1
	`, endpointID); err != nil {
		return fmt.Errorf("touch webhook endpoint last delivery: %w", err)
	}
	metrics.IncDeliveryEvent("webhook", "send", state)
	return nil
}

func enqueueWebhookDeliveriesTx(ctx context.Context, tx pgx.Tx, sellerID int64, eventType string, payload json.RawMessage, maxAttempts int) error {
	rows, err := tx.Query(ctx, `
		SELECT id
		FROM webhook_endpoints
		WHERE seller_id = $1
		  AND is_active = TRUE
	`, sellerID)
	if err != nil {
		return fmt.Errorf("select webhook endpoints for enqueue: %w", err)
	}
	defer rows.Close()

	var endpointIDs []int64
	for rows.Next() {
		var endpointID int64
		if err := rows.Scan(&endpointID); err != nil {
			return fmt.Errorf("scan webhook endpoint id: %w", err)
		}
		endpointIDs = append(endpointIDs, endpointID)
	}
	if err := rows.Err(); err != nil {
		return err
	}

	for _, endpointID := range endpointIDs {
		eventID := fmt.Sprintf("evt_%d_%d", time.Now().UTC().UnixNano(), endpointID)
		if _, err := tx.Exec(ctx, `
			INSERT INTO webhook_deliveries (endpoint_id, seller_id, event_type, payload, max_attempts, event_id)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, endpointID, sellerID, eventType, payloadWithEventID(payload, eventID), maxAttempts, eventID); err != nil {
			return fmt.Errorf("insert webhook delivery: %w", err)
		}
		metrics.IncDeliveryEvent("webhook", "enqueue", "success")
	}
	return nil
}

func payloadWithEventID(payload json.RawMessage, eventID string) json.RawMessage {
	var body map[string]any
	if err := json.Unmarshal(payload, &body); err != nil {
		return payload
	}
	body["event_id"] = eventID
	return MustJSON(body)
}

func (s *Store) ListWebhookDeliveries(ctx context.Context, sellerID int64, limit int) ([]WebhookDelivery, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, event_id, endpoint_id, seller_id, event_type, payload, status, attempts, max_attempts, available_at, last_http_status, last_error, created_at, sent_at
		FROM webhook_deliveries
		WHERE seller_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`, sellerID, limit)
	if err != nil {
		return nil, fmt.Errorf("list webhook deliveries: %w", err)
	}
	defer rows.Close()

	var items []WebhookDelivery
	for rows.Next() {
		var item WebhookDelivery
		if err := rows.Scan(&item.ID, &item.EventID, &item.EndpointID, &item.SellerID, &item.EventType, &item.Payload, &item.Status, &item.Attempts, &item.MaxAttempts, &item.AvailableAt, &item.LastHTTPStatus, &item.LastError, &item.CreatedAt, &item.SentAt); err != nil {
			return nil, fmt.Errorf("scan webhook delivery list item: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) ResendWebhookDelivery(ctx context.Context, sellerID int64, deliveryID int64) (WebhookDelivery, error) {
	var source WebhookDelivery
	row := s.pool.QueryRow(ctx, `
		SELECT id, event_id, endpoint_id, seller_id, event_type, payload, max_attempts
		FROM webhook_deliveries
		WHERE id = $1 AND seller_id = $2
	`, deliveryID, sellerID)
	if err := row.Scan(&source.ID, &source.EventID, &source.EndpointID, &source.SellerID, &source.EventType, &source.Payload, &source.MaxAttempts); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return WebhookDelivery{}, ErrNotFound
		}
		return WebhookDelivery{}, fmt.Errorf("load webhook delivery for resend: %w", err)
	}

	eventID := fmt.Sprintf("evt_%d_resend_%d", time.Now().UTC().UnixNano(), deliveryID)
	row = s.pool.QueryRow(ctx, `
		INSERT INTO webhook_deliveries (endpoint_id, seller_id, event_type, payload, max_attempts, event_id, resend_of)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, event_id, endpoint_id, seller_id, event_type, payload, status, attempts, max_attempts, available_at, last_http_status, last_error, created_at, sent_at
	`, source.EndpointID, sellerID, source.EventType, payloadWithEventID(source.Payload, eventID), source.MaxAttempts, eventID, source.ID)
	var item WebhookDelivery
	if err := row.Scan(&item.ID, &item.EventID, &item.EndpointID, &item.SellerID, &item.EventType, &item.Payload, &item.Status, &item.Attempts, &item.MaxAttempts, &item.AvailableAt, &item.LastHTTPStatus, &item.LastError, &item.CreatedAt, &item.SentAt); err != nil {
		return WebhookDelivery{}, fmt.Errorf("insert webhook resend: %w", err)
	}
	return item, nil
}

func (s *Store) GetIdempotencyRecord(ctx context.Context, sellerID int64, apiKeyID int64, method string, path string, key string) (IdempotencyRecord, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, seller_id, api_key_id, method, path, idempotency_key, request_hash, status_code, response_body
		FROM api_idempotency_records
		WHERE seller_id = $1 AND api_key_id = $2 AND method = $3 AND path = $4 AND idempotency_key = $5
	`, sellerID, apiKeyID, method, path, key)
	var item IdempotencyRecord
	if err := row.Scan(&item.ID, &item.SellerID, &item.APIKeyID, &item.Method, &item.Path, &item.IdempotencyKey, &item.RequestHash, &item.StatusCode, &item.ResponseBody); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return IdempotencyRecord{}, ErrNotFound
		}
		return IdempotencyRecord{}, fmt.Errorf("get idempotency record: %w", err)
	}
	return item, nil
}

func (s *Store) CreateIdempotencyRecord(ctx context.Context, sellerID int64, apiKeyID int64, method string, path string, key string, requestHash string) (IdempotencyRecord, error) {
	row := s.pool.QueryRow(ctx, `
		INSERT INTO api_idempotency_records (seller_id, api_key_id, method, path, idempotency_key, request_hash)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, seller_id, api_key_id, method, path, idempotency_key, request_hash, status_code, response_body
	`, sellerID, apiKeyID, method, path, key, requestHash)
	var item IdempotencyRecord
	if err := row.Scan(&item.ID, &item.SellerID, &item.APIKeyID, &item.Method, &item.Path, &item.IdempotencyKey, &item.RequestHash, &item.StatusCode, &item.ResponseBody); err != nil {
		return IdempotencyRecord{}, fmt.Errorf("create idempotency record: %w", err)
	}
	return item, nil
}

func (s *Store) CompleteIdempotencyRecord(ctx context.Context, id int64, statusCode int, response json.RawMessage) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE api_idempotency_records
		SET status_code = $2, response_body = $3, updated_at = NOW()
		WHERE id = $1
	`, id, statusCode, response)
	if err != nil {
		return fmt.Errorf("complete idempotency record: %w", err)
	}
	return nil
}

func (s *Store) GetWatcherCheckpoint(ctx context.Context, pollNetwork Network, payableNetwork Network, address string) (WatcherCheckpoint, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT poll_network, payable_network, destination_address, last_block, last_observed_at
		FROM watcher_checkpoints
		WHERE poll_network = $1 AND payable_network = $2 AND destination_address = $3
	`, pollNetwork, payableNetwork, address)
	var item WatcherCheckpoint
	if err := row.Scan(&item.PollNetwork, &item.PayableNetwork, &item.DestinationAddress, &item.LastBlock, &item.LastObservedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return WatcherCheckpoint{PollNetwork: pollNetwork, PayableNetwork: payableNetwork, DestinationAddress: address}, ErrNotFound
		}
		return WatcherCheckpoint{}, fmt.Errorf("get watcher checkpoint: %w", err)
	}
	return item, nil
}

func (s *Store) SaveWatcherCheckpoint(ctx context.Context, checkpoint WatcherCheckpoint) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO watcher_checkpoints (poll_network, payable_network, destination_address, last_block, last_observed_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		ON CONFLICT (poll_network, payable_network, destination_address)
		DO UPDATE SET
			last_block = GREATEST(watcher_checkpoints.last_block, EXCLUDED.last_block),
			last_observed_at = GREATEST(COALESCE(watcher_checkpoints.last_observed_at, EXCLUDED.last_observed_at), COALESCE(EXCLUDED.last_observed_at, watcher_checkpoints.last_observed_at)),
			updated_at = NOW()
	`, checkpoint.PollNetwork, checkpoint.PayableNetwork, checkpoint.DestinationAddress, checkpoint.LastBlock, checkpoint.LastObservedAt)
	if err != nil {
		return fmt.Errorf("save watcher checkpoint: %w", err)
	}
	return nil
}

func scanAPIKey(row interface{ Scan(dest ...any) error }) (APIKey, error) {
	var item APIKey
	var lastUsedAt sql.NullTime
	var revokedAt sql.NullTime
	err := row.Scan(
		&item.ID,
		&item.SellerID,
		&item.Label,
		&item.Prefix,
		&item.Mode,
		&item.Scopes,
		&lastUsedAt,
		&revokedAt,
		&item.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return APIKey{}, ErrNotFound
	}
	if err != nil {
		return APIKey{}, fmt.Errorf("scan api key: %w", err)
	}
	if lastUsedAt.Valid {
		item.LastUsedAt = &lastUsedAt.Time
	}
	if revokedAt.Valid {
		item.RevokedAt = &revokedAt.Time
	}
	return item, nil
}

func scanWebhookEndpoint(row interface{ Scan(dest ...any) error }) (WebhookEndpoint, error) {
	var item WebhookEndpoint
	var lastDeliveryAt sql.NullTime
	var lastSuccessAt sql.NullTime
	err := row.Scan(
		&item.ID,
		&item.SellerID,
		&item.Label,
		&item.URL,
		&item.Secret,
		&item.IsActive,
		&lastDeliveryAt,
		&lastSuccessAt,
		&item.CreatedAt,
	)
	if err == pgx.ErrNoRows {
		return WebhookEndpoint{}, ErrNotFound
	}
	if err != nil {
		return WebhookEndpoint{}, fmt.Errorf("scan webhook endpoint: %w", err)
	}
	if lastDeliveryAt.Valid {
		item.LastDeliveryAt = &lastDeliveryAt.Time
	}
	if lastSuccessAt.Valid {
		item.LastSuccessAt = &lastSuccessAt.Time
	}
	return item, nil
}
