ALTER TABLE api_keys
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'live';

UPDATE api_keys
SET mode = CASE WHEN prefix LIKE 'rk_test_%' THEN 'test' ELSE 'live' END
WHERE mode = '';

CREATE INDEX IF NOT EXISTS idx_api_keys_mode
ON api_keys (seller_id, mode)
WHERE revoked_at IS NULL;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'live';

CREATE INDEX IF NOT EXISTS idx_invoices_mode_status
ON invoices (mode, status, expires_at);

CREATE TABLE IF NOT EXISTS watcher_checkpoints (
  id BIGSERIAL PRIMARY KEY,
  poll_network TEXT NOT NULL,
  payable_network TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  last_block BIGINT NOT NULL DEFAULT 0,
  last_observed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (poll_network, payable_network, destination_address)
);

CREATE TABLE IF NOT EXISTS api_idempotency_records (
  id BIGSERIAL PRIMARY KEY,
  seller_id BIGINT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  api_key_id BIGINT NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status_code INT,
  response_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (seller_id, api_key_id, method, path, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_api_idempotency_records_lookup
ON api_idempotency_records (seller_id, api_key_id, method, path, idempotency_key);

ALTER TABLE webhook_deliveries
  ADD COLUMN IF NOT EXISTS event_id TEXT,
  ADD COLUMN IF NOT EXISTS resend_of BIGINT REFERENCES webhook_deliveries(id) ON DELETE SET NULL;

UPDATE webhook_deliveries
SET event_id = 'evt_' || id::text
WHERE event_id IS NULL OR event_id = '';

ALTER TABLE webhook_deliveries
  ALTER COLUMN event_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_deliveries_event_id
ON webhook_deliveries (event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_seller_created
ON webhook_deliveries (seller_id, created_at DESC);
