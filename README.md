# reqst

Lean invoicing OS for solo digital sellers in Telegram. `reqst` generates quote-to-pay links, monitors incoming on-chain payments to seller-owned wallets, and updates invoice state without ever storing private keys.

## What is included

- Go API with Telegram Mini App auth, wallets, invoices, public checkout, and internal payment ingestion.
- PostgreSQL schema with seller, wallet, template, invoice, outbox, and payment event tables.
- React + Vite frontend with a seller console and buyer checkout flow.
- Background workers:
  - `blockchain_watcher` for expiring invoices and polling blockchain providers.
  - `telegram_bot_worker` for Telegram notifications to sellers.
- `docker-compose.yml` for single-VPS MVP deployment.

## Product notes

- Non-custodial only: the buyer always sends funds directly to the seller wallet.
- Single tenant: one Telegram account maps to one seller account.
- Trial vs PRO: trial sellers can create 15 invoices total; PRO is unlimited.
- P0 networks in the codebase: `TON`, `TRON` for USDT TRC20, and `EVM` as an optional USDT ERC20-compatible path.

## Quick start

1. Copy `.env.example` to `.env`.
2. Adjust secrets and optional provider credentials.
3. Run `docker compose up --build`.
4. Open the frontend at `http://localhost:5173`.

The frontend supports a development fallback auth flow when `ALLOW_INSECURE_DEV_AUTH=true`. In production, use Telegram Mini App `initData`.

## Important implementation choices

- `TON` invoice matching uses destination wallet plus an invoice-specific comment.
- `TRON` and `EVM` invoice matching use an exact payable amount with a unique suffix.
- `TON_USD_RATE` is optional. If empty, the backend fetches TON/USD from CoinGecko during invoice creation.
- All observed transactions are written to `payment_events` with a unique `tx_hash` for idempotency.
- Invoice status transitions are conservative:
  - exact and on-time payment -> `paid`
  - partial payment -> `underpaid`
  - correct transfer after expiry -> `manual_review`
  - expired unpaid invoice -> `expired`

## Runtime services

- `api`: HTTP API and embedded SQL migrations.
- `blockchain_watcher`: background polling for TRON and TON providers plus invoice expiry sweep.
- `telegram_bot_worker`: reads `notification_outbox` and sends Telegram messages via Bot API.
- Internal admin actions are exposed behind `INTERNAL_TOKEN`:
  - `POST /internal/admin/sellers/:id/grant-pro`
  - `POST /internal/admin/sellers/:id/block`

## Known MVP limits

- Buyer-side Telegram push is not automatic because the buyer flow is intentionally auth-free; seller-side notifications are implemented.
- TON/TRON provider polling is functional but still provider-shape-dependent and may need field mapping tweaks per chosen upstream.
- Templates are persisted in the schema, but the initial UI focuses on wallets and invoices first.
