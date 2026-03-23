import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  authenticate,
  cancelInvoice,
  clearStoredToken,
  createInvoice,
  createWallet,
  deleteWallet,
  fetchInvoices,
  fetchMe,
  fetchWallets,
  getStoredToken,
  markInvoicePaid,
  setStoredToken,
} from "../lib/api";
import type { Invoice, MeResponse, Network, Wallet } from "../lib/types";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

type SessionState = {
  token: string;
  me: MeResponse;
  wallets: Wallet[];
  invoices: Invoice[];
};

const emptySession: SessionState | null = null;

export function SellerConsolePage() {
  const [session, setSession] = useState<SessionState | null>(emptySession);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [authForm, setAuthForm] = useState({ telegramId: "1001001", username: "reqst_dev" });
  const [walletForm, setWalletForm] = useState<{ network: Network; address: string }>({ network: "TON", address: "" });
  const [invoiceForm, setInvoiceForm] = useState({
    title: "Website audit",
    baseAmountUSD: "150.00",
    payableNetwork: "TON" as Network,
    expiresInMinutes: 30,
  });

  useEffect(() => {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    void loadSession(token);
  }, []);

  async function loadSession(token: string) {
    try {
      setLoading(true);
      const [me, wallets, invoices] = await Promise.all([
        fetchMe(token),
        fetchWallets(token),
        fetchInvoices(token),
      ]);
      setSession({
        token,
        me,
        wallets: wallets.items,
        invoices: invoices.items,
      });
      setError("");
    } catch (err) {
      clearStoredToken();
      setSession(null);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      const initData = window.Telegram?.WebApp?.initData;
      const payload = initData
        ? { init_data: initData }
        : { telegram_id: Number(authForm.telegramId), username: authForm.username };
      const result = await authenticate(payload);
      setStoredToken(result.token);
      await loadSession(result.token);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  async function refresh() {
    if (!session) {
      return;
    }
    await loadSession(session.token);
  }

  async function handleCreateWallet(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      return;
    }
    try {
      await createWallet(session.token, {
        network: walletForm.network,
        address: walletForm.address,
      });
      setWalletForm((current) => ({ ...current, address: "" }));
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleCreateInvoice(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      return;
    }
    try {
      await createInvoice(session.token, {
        title: invoiceForm.title,
        base_amount_usd: invoiceForm.baseAmountUSD,
        payable_network: invoiceForm.payableNetwork,
        expires_in_minutes: invoiceForm.expiresInMinutes,
      });
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDeleteWallet(walletId: number) {
    if (!session) {
      return;
    }
    try {
      await deleteWallet(session.token, walletId);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleInvoiceAction(invoiceId: number, action: "cancel" | "mark-paid") {
    if (!session) {
      return;
    }
    try {
      if (action === "cancel") {
        await cancelInvoice(session.token, invoiceId);
      } else {
        await markInvoicePaid(session.token, invoiceId);
      }
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const checkoutOrigin = useMemo(() => window.location.origin, []);

  return (
    <main className="shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <section className="hero-card">
        <div>
          <span className="eyebrow">Telegram Quote-to-Pay OS</span>
          <h1>reqst</h1>
          <p className="hero-copy">
            Non-custodial invoicing for solo Telegram sellers. Generate exact-pay checkout links,
            monitor TON or USDT wallets, and keep order status readable for both sides.
          </p>
        </div>
        <div className="hero-chip-stack">
          <div className="chip">P0: TON</div>
          <div className="chip">P0: USDT TRC20</div>
          <div className="chip">Single tenant</div>
          <div className="chip">Trial / PRO</div>
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}

      {!session ? (
        <section className="panel auth-panel">
          <div className="panel-header">
            <h2>Seller Sign-In</h2>
            <p>Use Telegram Mini App `initData` in production or the local fallback in development.</p>
          </div>
          <form onSubmit={handleAuth} className="form-grid">
            <label>
              Telegram ID
              <input
                value={authForm.telegramId}
                onChange={(event) => setAuthForm((current) => ({ ...current, telegramId: event.target.value }))}
              />
            </label>
            <label>
              Username
              <input
                value={authForm.username}
                onChange={(event) => setAuthForm((current) => ({ ...current, username: event.target.value }))}
              />
            </label>
            <button disabled={loading} type="submit">
              {loading ? "Signing in..." : "Enter Console"}
            </button>
          </form>
        </section>
      ) : (
        <>
          <section className="panel overview-grid">
            <article className="metric-card">
              <span>Seller</span>
              <strong>@{session.me.seller.username || session.me.seller.telegram_id}</strong>
              <p>ID: {session.me.seller.telegram_id}</p>
            </article>
            <article className="metric-card">
              <span>Plan</span>
              <strong>{session.me.plan.name}</strong>
              <p>Remaining trial invoices: {session.me.plan.trial_remaining}</p>
            </article>
            <article className="metric-card">
              <span>Wallets</span>
              <strong>{session.wallets.length}</strong>
              <p>Active receiving addresses</p>
            </article>
            <article className="metric-card">
              <span>Invoices</span>
              <strong>{session.invoices.length}</strong>
              <p>Total created in this account</p>
            </article>
          </section>

          <section className="grid-two">
            <div className="panel">
              <div className="panel-header">
                <h2>Wallets</h2>
                <p>Add one active public address per payment network.</p>
              </div>
              <form onSubmit={handleCreateWallet} className="form-grid compact">
                <label>
                  Network
                  <select
                    value={walletForm.network}
                    onChange={(event) =>
                      setWalletForm((current) => ({ ...current, network: event.target.value as Network }))
                    }
                  >
                    <option value="TON">TON</option>
                    <option value="TRON">TRON / USDT</option>
                    <option value="EVM">EVM / USDT</option>
                  </select>
                </label>
                <label>
                  Address
                  <input
                    placeholder="Wallet address"
                    value={walletForm.address}
                    onChange={(event) => setWalletForm((current) => ({ ...current, address: event.target.value }))}
                  />
                </label>
                <button type="submit">Save Wallet</button>
              </form>

              <div className="stack-list">
                {session.wallets.map((wallet) => (
                  <div key={wallet.id} className="stack-item">
                    <div>
                      <strong>{wallet.network}</strong>
                      <p>{wallet.address}</p>
                    </div>
                    <button className="ghost-button" onClick={() => handleDeleteWallet(wallet.id)}>
                      Disable
                    </button>
                  </div>
                ))}
                {!session.wallets.length ? <p className="muted">No active wallets yet.</p> : null}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h2>New Invoice</h2>
                <p>Create an exact-pay request with timeout, address, and matching metadata.</p>
              </div>
              <form onSubmit={handleCreateInvoice} className="form-grid compact">
                <label>
                  Title
                  <input
                    value={invoiceForm.title}
                    onChange={(event) => setInvoiceForm((current) => ({ ...current, title: event.target.value }))}
                  />
                </label>
                <label>
                  Amount (USD)
                  <input
                    value={invoiceForm.baseAmountUSD}
                    onChange={(event) =>
                      setInvoiceForm((current) => ({ ...current, baseAmountUSD: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Network
                  <select
                    value={invoiceForm.payableNetwork}
                    onChange={(event) =>
                      setInvoiceForm((current) => ({
                        ...current,
                        payableNetwork: event.target.value as Network,
                      }))
                    }
                  >
                    <option value="TON">TON</option>
                    <option value="TRON">TRON / USDT</option>
                    <option value="EVM">EVM / USDT</option>
                  </select>
                </label>
                <label>
                  Lifetime (minutes)
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={invoiceForm.expiresInMinutes}
                    onChange={(event) =>
                      setInvoiceForm((current) => ({
                        ...current,
                        expiresInMinutes: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <button type="submit">Generate Checkout Link</button>
              </form>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Invoices</h2>
              <p>Copy links, monitor status, or manually resolve exceptions.</p>
            </div>
            <div className="stack-list">
              {session.invoices.map((invoice) => (
                <article key={invoice.id} className="invoice-card">
                  <div className="invoice-topline">
                    <div>
                      <strong>{invoice.title}</strong>
                      <p>
                        {invoice.payable_amount} {invoice.payable_network} to {invoice.destination_address}
                      </p>
                    </div>
                    <span className={`status-pill status-${invoice.status}`}>{invoice.status}</span>
                  </div>

                  <div className="invoice-meta">
                    <span>Public ID: {invoice.public_id}</span>
                    <span>Expires: {new Date(invoice.expires_at).toLocaleString()}</span>
                    {invoice.payment_comment ? <span>Comment: {invoice.payment_comment}</span> : null}
                  </div>

                  <div className="invoice-actions">
                    <button
                      className="ghost-button"
                      onClick={() => navigator.clipboard.writeText(`${checkoutOrigin}/checkout/${invoice.public_id}`)}
                    >
                      Copy Link
                    </button>
                    <button
                      className="ghost-button"
                      onClick={() => handleInvoiceAction(invoice.id, "cancel")}
                      disabled={invoice.status === "paid"}
                    >
                      Cancel
                    </button>
                    <button
                      className="ghost-button"
                      onClick={() => handleInvoiceAction(invoice.id, "mark-paid")}
                      disabled={invoice.status === "paid"}
                    >
                      Mark Paid
                    </button>
                  </div>
                </article>
              ))}
              {!session.invoices.length ? <p className="muted">No invoices yet.</p> : null}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
