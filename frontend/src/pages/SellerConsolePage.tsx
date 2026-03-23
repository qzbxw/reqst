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
import { useUI } from "../lib/ui";

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

type PanelKey = "overview" | "wallets" | "create" | "orders";

const COPY = {
  ru: {
    eyebrow: "Telegram Quote-to-Pay OS",
    heroTitle: "reqst",
    heroCopy:
      "Аккуратная консоль для выставления крипто-инвойсов, трекинга статусов и buyer checkout без custody и без Stars.",
    tabs: {
      overview: "Обзор",
      wallets: "Кошельки",
      create: "Новый инвойс",
      orders: "Инвойсы",
    },
    authTitle: "Вход продавца",
    authCopy: "В проде вход идёт через Telegram Mini App initData. Для локалки оставлен dev fallback.",
    telegramId: "Telegram ID",
    username: "Username",
    signIn: "Войти",
    signingIn: "Входим...",
    seller: "Продавец",
    plan: "План",
    wallets: "Кошельки",
    invoices: "Инвойсы",
    activeWallets: "Активные receiving addresses",
    totalInvoices: "Всего создано",
    trialLeft: "Осталось trial-инвойсов",
    recentInvoice: "Последний инвойс",
    noRecentInvoice: "Пока ещё нет ни одного инвойса.",
    freshLink: "Свежая ссылка",
    open: "Открыть",
    copy: "Скопировать",
    refresh: "Обновить",
    logout: "Выйти",
    theme: { light: "Свет", dark: "Тьма" },
    language: { ru: "РУ", en: "EN" },
    walletTitle: "Кошельки",
    walletCopy: "Один активный адрес на сеть. Ниже можно быстро переключаться и отключать адреса.",
    network: "Сеть",
    address: "Адрес",
    saveWallet: "Сохранить кошелёк",
    noWallets: "Пока нет активных кошельков.",
    disable: "Отключить",
    createTitle: "Новый инвойс",
    createCopy: "Система сама рассчитает payable amount, суффикс или TON comment и соберёт buyer checkout.",
    serviceTitle: "Название услуги",
    amountUsd: "Сумма, USD",
    lifetime: "Время жизни, минут",
    generate: "Сгенерировать инвойс",
    matchingTitle: "Как матчим оплату",
    matchingTon: "TON: comment + адрес продавца",
    matchingUsdt: "USDT: точная сумма с уникальным suffix",
    matchingLate: "Опоздавшая оплата уходит в manual review",
    ordersTitle: "Инвойсы",
    ordersCopy: "Здесь можно быстро копировать checkout-ссылки и закрывать исключения вручную.",
    emptyOrders: "Инвойсов пока нет.",
    publicId: "Public ID",
    expires: "Истекает",
    exact: "Точная сумма",
    comment: "Comment",
    copyLink: "Ссылка",
    cancel: "Отменить",
    markPaid: "Подтвердить",
  },
  en: {
    eyebrow: "Telegram Quote-to-Pay OS",
    heroTitle: "reqst",
    heroCopy:
      "A cleaner solo-seller console for crypto invoices, status tracking and buyer checkout without custody or Telegram Stars.",
    tabs: {
      overview: "Overview",
      wallets: "Wallets",
      create: "New invoice",
      orders: "Invoices",
    },
    authTitle: "Seller Sign-In",
    authCopy: "Production uses Telegram Mini App initData. Local development keeps a fallback auth form.",
    telegramId: "Telegram ID",
    username: "Username",
    signIn: "Enter console",
    signingIn: "Signing in...",
    seller: "Seller",
    plan: "Plan",
    wallets: "Wallets",
    invoices: "Invoices",
    activeWallets: "Active receiving addresses",
    totalInvoices: "Total created",
    trialLeft: "Trial invoices left",
    recentInvoice: "Latest invoice",
    noRecentInvoice: "No invoices yet.",
    freshLink: "Fresh link",
    open: "Open",
    copy: "Copy",
    refresh: "Refresh",
    logout: "Logout",
    theme: { light: "Light", dark: "Dark" },
    language: { ru: "RU", en: "EN" },
    walletTitle: "Wallets",
    walletCopy: "One active public address per network. Manage them here without scrolling through the whole page.",
    network: "Network",
    address: "Address",
    saveWallet: "Save wallet",
    noWallets: "No active wallets yet.",
    disable: "Disable",
    createTitle: "New invoice",
    createCopy: "The system calculates the payable amount, suffix or TON comment and assembles the checkout page.",
    serviceTitle: "Service title",
    amountUsd: "Amount, USD",
    lifetime: "Lifetime, minutes",
    generate: "Generate invoice",
    matchingTitle: "Matching logic",
    matchingTon: "TON: seller address + comment",
    matchingUsdt: "USDT: exact payable amount with a unique suffix",
    matchingLate: "Late payments move into manual review",
    ordersTitle: "Invoices",
    ordersCopy: "Copy checkout links fast and resolve exceptions without hunting through the page.",
    emptyOrders: "No invoices yet.",
    publicId: "Public ID",
    expires: "Expires",
    exact: "Exact amount",
    comment: "Comment",
    copyLink: "Link",
    cancel: "Cancel",
    markPaid: "Mark paid",
  },
} as const;

const PANEL_ORDER: PanelKey[] = ["overview", "wallets", "create", "orders"];

export function SellerConsolePage() {
  const { language, theme, setLanguage, setTheme } = useUI();
  const text = COPY[language];
  const [session, setSession] = useState<SessionState | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<PanelKey>("overview");
  const [freshLink, setFreshLink] = useState("");
  const [authForm, setAuthForm] = useState({ telegramId: "1001001", username: "reqst_dev" });
  const [walletForm, setWalletForm] = useState<{ network: Network; address: string }>({ network: "TON", address: "" });
  const [invoiceForm, setInvoiceForm] = useState({
    title: "Digital service",
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
      const [me, wallets, invoices] = await Promise.all([fetchMe(token), fetchWallets(token), fetchInvoices(token)]);
      setSession({
        token,
        me,
        wallets: wallets.items ?? [],
        invoices: invoices.items ?? [],
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
      const payload = initData ? { init_data: initData } : { telegram_id: Number(authForm.telegramId), username: authForm.username };
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
      await createWallet(session.token, walletForm);
      setWalletForm((current) => ({ ...current, address: "" }));
      await refresh();
      setActivePanel("wallets");
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
      const invoice = await createInvoice(session.token, {
        title: invoiceForm.title,
        base_amount_usd: invoiceForm.baseAmountUSD,
        payable_network: invoiceForm.payableNetwork,
        expires_in_minutes: invoiceForm.expiresInMinutes,
      });
      setFreshLink(`${window.location.origin}/checkout/${invoice.public_id}`);
      await refresh();
      setActivePanel("orders");
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

  function handleLogout() {
    clearStoredToken();
    setSession(null);
    setFreshLink("");
    setActivePanel("overview");
  }

  const checkoutOrigin = useMemo(() => window.location.origin, []);
  const latestInvoice = session?.invoices[0] ?? null;

  return (
    <main className="shell shell-console">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar">
        <div className="topbar-brand">
          <span className="eyebrow">{text.eyebrow}</span>
          <strong>{text.heroTitle}</strong>
        </div>

        <div className="topbar-actions">
          <div className="micro-actions">
            <div className="micro-action-group" role="group" aria-label="language">
              <button type="button" className={language === "ru" ? "micro-action active" : "micro-action"} onClick={() => setLanguage("ru")}>
                {text.language.ru}
              </button>
              <span className="micro-divider">|</span>
              <button type="button" className={language === "en" ? "micro-action active" : "micro-action"} onClick={() => setLanguage("en")}>
                {text.language.en}
              </button>
            </div>
            <button
              type="button"
              className="micro-action micro-action--icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            >
              {theme === "light" ? "☀" : "☾"}
            </button>
          </div>
          {session ? (
            <>
              <button type="button" className="ghost-button compact-button" onClick={() => void refresh()}>
                {text.refresh}
              </button>
              <button type="button" className="ghost-button compact-button" onClick={handleLogout}>
                {text.logout}
              </button>
            </>
          ) : null}
        </div>
      </header>

      <section className="hero-card hero-card--console">
        <div className="hero-copywrap">
          <h1>{text.heroTitle}</h1>
          <p className="hero-copy">{text.heroCopy}</p>
        </div>

        <div className="hero-side-stack">
          {freshLink ? (
            <div className="hero-callout">
              <span>{text.freshLink}</span>
              <strong>{freshLink.replace(checkoutOrigin, "")}</strong>
              <div className="inline-actions">
                <button type="button" className="ghost-button compact-button" onClick={() => navigator.clipboard.writeText(freshLink)}>
                  {text.copy}
                </button>
                <a className="inline-link" href={freshLink} target="_blank" rel="noreferrer">
                  {text.open}
                </a>
              </div>
            </div>
          ) : (
            <div className="hero-chip-stack">
              <div className="chip">P0 / TON</div>
              <div className="chip">P0 / USDT TRC20</div>
              <div className="chip">RU / EN</div>
              <div className="chip">{theme === "light" ? text.theme.light : text.theme.dark}</div>
            </div>
          )}
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}

      {!session ? (
        <section className="panel auth-panel elevated-panel">
          <div className="panel-header">
            <h2>{text.authTitle}</h2>
            <p>{text.authCopy}</p>
          </div>
          <form onSubmit={handleAuth} className="form-grid">
            <label>
              {text.telegramId}
              <input value={authForm.telegramId} onChange={(event) => setAuthForm((current) => ({ ...current, telegramId: event.target.value }))} />
            </label>
            <label>
              {text.username}
              <input value={authForm.username} onChange={(event) => setAuthForm((current) => ({ ...current, username: event.target.value }))} />
            </label>
            <button disabled={loading} type="submit">
              {loading ? text.signingIn : text.signIn}
            </button>
          </form>
        </section>
      ) : (
        <>
          <nav className="panel-switcher" aria-label="console sections">
            {PANEL_ORDER.map((panel) => (
              <button key={panel} type="button" className={activePanel === panel ? "switch-pill active" : "switch-pill"} onClick={() => setActivePanel(panel)}>
                {text.tabs[panel]}
              </button>
            ))}
          </nav>

          {activePanel === "overview" ? (
            <section className="console-grid">
              <div className="overview-grid">
                <article className="metric-card">
                  <span>{text.seller}</span>
                  <strong>@{session.me.seller.username || String(session.me.seller.telegram_id)}</strong>
                  <p>ID: {session.me.seller.telegram_id}</p>
                </article>
                <article className="metric-card">
                  <span>{text.plan}</span>
                  <strong>{session.me.plan.name}</strong>
                  <p>{text.trialLeft}: {session.me.plan.trial_remaining}</p>
                </article>
                <article className="metric-card">
                  <span>{text.wallets}</span>
                  <strong>{session.wallets.length}</strong>
                  <p>{text.activeWallets}</p>
                </article>
                <article className="metric-card">
                  <span>{text.invoices}</span>
                  <strong>{session.invoices.length}</strong>
                  <p>{text.totalInvoices}</p>
                </article>
              </div>

              <article className="panel elevated-panel">
                <div className="panel-header">
                  <h2>{text.recentInvoice}</h2>
                  <p>{latestInvoice ? latestInvoice.title : text.noRecentInvoice}</p>
                </div>
                {latestInvoice ? (
                  <div className="invoice-hero-card">
                    <div>
                      <span className={`status-pill status-${latestInvoice.status}`}>{latestInvoice.status}</span>
                      <h3>{latestInvoice.title}</h3>
                      <p>{text.exact}: {latestInvoice.payable_amount} {latestInvoice.payable_network}</p>
                      <p>{text.expires}: {new Date(latestInvoice.expires_at).toLocaleString()}</p>
                    </div>
                    <div className="invoice-hero-actions">
                      <button type="button" className="ghost-button" onClick={() => navigator.clipboard.writeText(`${checkoutOrigin}/checkout/${latestInvoice.public_id}`)}>
                        {text.copy}
                      </button>
                      <a className="inline-link" href={`${checkoutOrigin}/checkout/${latestInvoice.public_id}`} target="_blank" rel="noreferrer">
                        {text.open}
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="muted">{text.noRecentInvoice}</p>
                )}
              </article>
            </section>
          ) : null}

          {activePanel === "wallets" ? (
            <section className="panel elevated-panel">
              <div className="panel-header">
                <h2>{text.walletTitle}</h2>
                <p>{text.walletCopy}</p>
              </div>

              <form onSubmit={handleCreateWallet} className="form-grid form-grid--wallets">
                <label>
                  {text.network}
                  <select value={walletForm.network} onChange={(event) => setWalletForm((current) => ({ ...current, network: event.target.value as Network }))}>
                    <option value="TON">TON</option>
                    <option value="TRON">TRON / USDT</option>
                    <option value="EVM">EVM / USDT</option>
                  </select>
                </label>
                <label>
                  {text.address}
                  <input placeholder="Wallet address" value={walletForm.address} onChange={(event) => setWalletForm((current) => ({ ...current, address: event.target.value }))} />
                </label>
                <button type="submit">{text.saveWallet}</button>
              </form>

              <div className="stack-list">
                {session.wallets.map((wallet) => (
                  <div key={wallet.id} className="stack-item">
                    <div>
                      <strong>{wallet.network}</strong>
                      <p>{wallet.address}</p>
                    </div>
                    <button type="button" className="ghost-button compact-button" onClick={() => void handleDeleteWallet(wallet.id)}>
                      {text.disable}
                    </button>
                  </div>
                ))}
                {!session.wallets.length ? <p className="muted">{text.noWallets}</p> : null}
              </div>
            </section>
          ) : null}

          {activePanel === "create" ? (
            <section className="console-grid console-grid--create">
              <article className="panel elevated-panel">
                <div className="panel-header">
                  <h2>{text.createTitle}</h2>
                  <p>{text.createCopy}</p>
                </div>
                <form onSubmit={handleCreateInvoice} className="form-grid">
                  <label>
                    {text.serviceTitle}
                    <input placeholder={language === "ru" ? "Например, Design sprint" : "For example, Design sprint"} value={invoiceForm.title} onChange={(event) => setInvoiceForm((current) => ({ ...current, title: event.target.value }))} />
                  </label>
                  <label>
                    {text.amountUsd}
                    <input value={invoiceForm.baseAmountUSD} onChange={(event) => setInvoiceForm((current) => ({ ...current, baseAmountUSD: event.target.value }))} />
                  </label>
                  <label>
                    {text.network}
                    <select value={invoiceForm.payableNetwork} onChange={(event) => setInvoiceForm((current) => ({ ...current, payableNetwork: event.target.value as Network }))}>
                      <option value="TON">TON</option>
                      <option value="TRON">TRON / USDT</option>
                      <option value="EVM">EVM / USDT</option>
                    </select>
                  </label>
                  <label>
                    {text.lifetime}
                    <input type="number" min={5} max={1440} value={invoiceForm.expiresInMinutes} onChange={(event) => setInvoiceForm((current) => ({ ...current, expiresInMinutes: Number(event.target.value) }))} />
                  </label>
                  <button type="submit">{text.generate}</button>
                </form>
              </article>

              <aside className="panel glass-note">
                <div className="panel-header">
                  <h2>{text.matchingTitle}</h2>
                </div>
                <ul className="note-list">
                  <li>{text.matchingTon}</li>
                  <li>{text.matchingUsdt}</li>
                  <li>{text.matchingLate}</li>
                </ul>
              </aside>
            </section>
          ) : null}

          {activePanel === "orders" ? (
            <section className="panel elevated-panel">
              <div className="panel-header">
                <h2>{text.ordersTitle}</h2>
                <p>{text.ordersCopy}</p>
              </div>

              <div className="stack-list">
                {session.invoices.map((invoice) => {
                  const checkoutUrl = `${checkoutOrigin}/checkout/${invoice.public_id}`;
                  return (
                    <article key={invoice.id} className="invoice-card invoice-card--rich">
                      <div className="invoice-topline">
                        <div>
                          <span className={`status-pill status-${invoice.status}`}>{invoice.status}</span>
                          <h3>{invoice.title}</h3>
                        </div>
                        <div className="invoice-amount">
                          <strong>{invoice.payable_amount}</strong>
                          <span>{invoice.payable_network}</span>
                        </div>
                      </div>

                      <div className="invoice-meta-grid">
                        <div>
                          <span>{text.publicId}</span>
                          <p>{invoice.public_id}</p>
                        </div>
                        <div>
                          <span>{text.expires}</span>
                          <p>{new Date(invoice.expires_at).toLocaleString()}</p>
                        </div>
                        <div>
                          <span>{text.address}</span>
                          <p>{invoice.destination_address}</p>
                        </div>
                        {invoice.payment_comment ? (
                          <div>
                            <span>{text.comment}</span>
                            <p>{invoice.payment_comment}</p>
                          </div>
                        ) : null}
                      </div>

                      <div className="invoice-actions">
                        <button type="button" className="ghost-button compact-button" onClick={() => navigator.clipboard.writeText(checkoutUrl)}>
                          {text.copyLink}
                        </button>
                        <a className="inline-link" href={checkoutUrl} target="_blank" rel="noreferrer">
                          {text.open}
                        </a>
                        <button type="button" className="ghost-button compact-button" onClick={() => void handleInvoiceAction(invoice.id, "cancel")} disabled={invoice.status === "paid"}>
                          {text.cancel}
                        </button>
                        <button type="button" className="ghost-button compact-button" onClick={() => void handleInvoiceAction(invoice.id, "mark-paid")} disabled={invoice.status === "paid"}>
                          {text.markPaid}
                        </button>
                      </div>
                    </article>
                  );
                })}
                {!session.invoices.length ? <p className="muted">{text.emptyOrders}</p> : null}
              </div>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
