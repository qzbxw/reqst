ALTER TABLE sellers
  ALTER COLUMN telegram_id DROP NOT NULL;

ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ;

UPDATE sellers
SET telegram_linked_at = COALESCE(telegram_linked_at, created_at)
WHERE telegram_id IS NOT NULL;

ALTER TABLE notification_outbox
  ALTER COLUMN recipient_telegram_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS email_auth_codes (
  id BIGSERIAL PRIMARY KEY,
  seller_id BIGINT REFERENCES sellers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_auth_codes_active
ON email_auth_codes (LOWER(email), purpose, created_at DESC)
WHERE consumed_at IS NULL;
