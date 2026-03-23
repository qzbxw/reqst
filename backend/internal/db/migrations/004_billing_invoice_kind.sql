ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'merchant';

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS subscription_days INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_invoices_kind_status ON invoices (kind, status, created_at DESC);
