DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'network') THEN
    CREATE TYPE network AS ENUM ('TON', 'TRON', 'EVM');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE invoice_status AS ENUM ('draft', 'awaiting_payment', 'paid', 'expired', 'underpaid', 'manual_review');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS sellers (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL UNIQUE,
  username TEXT,
  default_network network NOT NULL DEFAULT 'TON',
  subscription_ends_at TIMESTAMPTZ,
  free_invoices_used INT NOT NULL DEFAULT 0,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  id BIGSERIAL PRIMARY KEY,
  seller_id BIGINT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  network network NOT NULL,
  address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (seller_id, network, address)
);

CREATE INDEX IF NOT EXISTS idx_wallets_seller_active ON wallets (seller_id, is_active);
CREATE INDEX IF NOT EXISTS idx_wallets_network_address ON wallets (network, address) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS templates (
  id BIGSERIAL PRIMARY KEY,
  seller_id BIGINT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  default_amount_usd NUMERIC(18, 6) NOT NULL,
  default_network network NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  public_id VARCHAR(16) NOT NULL UNIQUE,
  seller_id BIGINT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  base_amount_usd NUMERIC(18, 6) NOT NULL,
  payable_amount NUMERIC(24, 9) NOT NULL,
  payable_network network NOT NULL,
  destination_address TEXT NOT NULL,
  payment_comment TEXT,
  matching_suffix NUMERIC(12, 6),
  status invoice_status NOT NULL DEFAULT 'awaiting_payment',
  expires_at TIMESTAMPTZ NOT NULL,
  tx_hash TEXT UNIQUE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_seller_created ON invoices (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_public_id ON invoices (public_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status_destination ON invoices (status, destination_address, payable_network);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_comment ON invoices (payment_comment) WHERE payment_comment IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_suffix_window ON invoices (destination_address, payable_network, matching_suffix, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_events (
  id BIGSERIAL PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  network network NOT NULL,
  destination_address TEXT NOT NULL,
  amount NUMERIC(24, 9) NOT NULL,
  payment_comment TEXT,
  observed_at TIMESTAMPTZ NOT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  matched_invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL,
  classification TEXT NOT NULL DEFAULT 'unmatched',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_lookup ON payment_events (network, destination_address, observed_at DESC);

CREATE TABLE IF NOT EXISTS notification_outbox (
  id BIGSERIAL PRIMARY KEY,
  seller_id BIGINT NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  recipient_telegram_id BIGINT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_pending ON notification_outbox (status, available_at);
