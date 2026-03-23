import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  authenticate,
  cancelInvoice,
  clearStoredToken,
  createBillingCheckout,
  createInvoice,
  createWallet,
  deleteWallet,
  fetchInvoices,
  fetchMe,
  fetchWallets,
  getStoredToken,
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
    eyebrow: "Reqst",
    heroTitle: "Консоль продавца",
    heroCopy:
      "Инвойсы, статусы и оплата в одном месте. Без ручной сверки, лишних вкладок и хаоса в блокчейн-эксплорерах.",
    tabs: {
      overview: "Обзор",
      wallets: "Кошельки",
      create: "Новый инвойс",
      orders: "Инвойсы",
    },
    authTitle: "Вход продавца",
    authCopy: "Вход в консоль продавца.",
    telegramId: "Telegram ID",
    username: "Username",
    signIn: "Войти",
    signingIn: "Входим...",
    seller: "Продавец",
    plan: "План",
    wallets: "Кошельки",
    invoices: "Инвойсы",
    activeWallets: "Активные адреса",
    totalInvoices: "Всего создано",
    trialLeft: "Осталось инвойсов",
    unlockPro: "Reqst PRO",
    unlockCopy: "Когда бесплатные инвойсы закончатся, новые ссылки остановятся. Без комиссии с оборота, только фиксированный доступ.",
    unlockPrice: "39 USDT / 30 дней",
    billingNetwork: "Сеть оплаты",
    unlockNow: "Оплатить PRO",
    paywallTitle: "Триал закончился",
    paywallBody: "Новые инвойсы остановлены. Оплати PRO и сразу верни безлимит на 30 дней.",
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
    walletCopy: "Один активный адрес на каждую платёжную группу. Общий EVM-адрес используется для Ethereum, Base, Arbitrum и BSC.",
    network: "Сеть",
    address: "Адрес",
    saveWallet: "Сохранить кошелёк",
    noWallets: "Пока нет активных кошельков.",
    disable: "Отключить",
    createTitle: "Новый инвойс",
    createCopy: "Reqst сам рассчитает сумму к оплате, комментарий для TON или уникальный хвост для стейблов.",
    serviceTitle: "Название услуги",
    amountUsd: "Сумма, USD",
    lifetime: "Время жизни, минут",
    generate: "Сгенерировать инвойс",
    matchingTitle: "Как находится платёж",
    matchingTon: "TON: комментарий плюс адрес продавца",
    matchingUsdt: "USDT / USDC: точная сумма с уникальным хвостом",
    matchingLate: "Опоздавшая оплата уходит на ручную проверку",
    ordersTitle: "Инвойсы",
    ordersCopy: "Здесь можно быстро открыть ссылку, скопировать её и следить за статусами без ручного самоаппрува.",
    emptyOrders: "Инвойсов пока нет.",
    publicId: "Public ID",
    expires: "Истекает",
    exact: "Точная сумма",
    comment: "Comment",
    copyLink: "Ссылка",
    cancel: "Отменить",
    markPaid: "Подтвердить",
    quickActions: "Быстрые действия",
    accountTitle: "Профиль",
    accountCopy: "Кто принимает оплату и сколько ещё доступно в плане.",
    invoicePulseTitle: "Пульс инвойсов",
    invoicePulseCopy: "Какие статусы требуют внимания прямо сейчас.",
    walletCoverageTitle: "Покрытие сетей",
    walletCoverageCopy: "Сразу видно, какие направления уже готовы к оплате.",
    sellerIdLabel: "Seller ID",
    defaultNetwork: "Сеть по умолчанию",
    walletReady: "Готово",
    walletMissing: "Нужно добавить",
    latestCheckout: "Последний чекаут",
  },
  en: {
    eyebrow: "Reqst",
    heroTitle: "Seller console",
    heroCopy:
      "Invoices, payment status and checkout in one place. No manual matching, no extra tabs, no explorer chaos.",
    tabs: {
      overview: "Overview",
      wallets: "Wallets",
      create: "New invoice",
      orders: "Invoices",
    },
    authTitle: "Seller Sign-In",
    authCopy: "Sign in to the seller console.",
    telegramId: "Telegram ID",
    username: "Username",
    signIn: "Enter console",
    signingIn: "Signing in...",
    seller: "Seller",
    plan: "Plan",
    wallets: "Wallets",
    invoices: "Invoices",
    activeWallets: "Active addresses",
    totalInvoices: "Total created",
    trialLeft: "Invoices left",
    unlockPro: "Reqst PRO",
    unlockCopy: "When the free invoices run out, new links stop. No revenue fee, just a fixed plan.",
    unlockPrice: "39 USDT / 30 days",
    billingNetwork: "Payment network",
    unlockNow: "Pay for PRO",
    paywallTitle: "Trial is over",
    paywallBody: "New invoices are paused. Pay for PRO and restore unlimited access for 30 days.",
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
    walletCopy: "One active address per payout group. The shared EVM address is reused for Ethereum, Base, Arbitrum and BSC.",
    network: "Network",
    address: "Address",
    saveWallet: "Save wallet",
    noWallets: "No active wallets yet.",
    disable: "Disable",
    createTitle: "New invoice",
    createCopy: "Reqst calculates the payable amount, the TON comment, or the unique stablecoin suffix for you.",
    serviceTitle: "Service title",
    amountUsd: "Amount, USD",
    lifetime: "Lifetime, minutes",
    generate: "Generate invoice",
    matchingTitle: "How payment matching works",
    matchingTon: "TON: seller address plus comment",
    matchingUsdt: "USDT / USDC: exact amount with a unique suffix",
    matchingLate: "Late payments move to manual review",
    ordersTitle: "Invoices",
    ordersCopy: "Open links quickly, copy them, and track statuses without self-confirming payments from the same console.",
    emptyOrders: "No invoices yet.",
    publicId: "Public ID",
    expires: "Expires",
    exact: "Exact amount",
    comment: "Comment",
    copyLink: "Link",
    cancel: "Cancel",
    markPaid: "Mark paid",
    quickActions: "Quick actions",
    accountTitle: "Profile",
    accountCopy: "Who receives payments and how much room is left in the plan.",
    invoicePulseTitle: "Invoice pulse",
    invoicePulseCopy: "The states that need attention right now.",
    walletCoverageTitle: "Network coverage",
    walletCoverageCopy: "See at a glance which payout lanes are ready to receive funds.",
    sellerIdLabel: "Seller ID",
    defaultNetwork: "Default network",
    walletReady: "Ready",
    walletMissing: "Needs wallet",
    latestCheckout: "Latest checkout",
  },
} as const;

const STATUS_LABELS = {
  ru: {
    awaiting_payment: "Ждёт оплату",
    paid: "Оплачен",
    expired: "Истёк",
    underpaid: "Недоплата",
    manual_review: "Ручная проверка",
    draft: "Черновик",
  },
  en: {
    awaiting_payment: "Awaiting payment",
    paid: "Paid",
    expired: "Expired",
    underpaid: "Underpaid",
    manual_review: "Manual review",
    draft: "Draft",
  },
} as const;

const PANEL_ORDER: PanelKey[] = ["overview", "wallets", "create", "orders"];

const WALLET_NETWORK_OPTIONS: Array<{ value: Network; label: string }> = [
  { value: "TON", label: "TON" },
  { value: "TRON", label: "TRON / USDT" },
  { value: "SOLANA", label: "SOLANA / USDC-USDT" },
  { value: "EVM", label: "EVM shared / ETH-Base-Arbitrum-BSC" },
];

const PAYABLE_NETWORK_OPTIONS: Array<{ value: Network; label: string }> = [
  { value: "TON", label: "TON" },
  { value: "TRON", label: "TRON / USDT" },
  { value: "SOLANA", label: "SOLANA / USDC-USDT" },
  { value: "BASE", label: "BASE / USDT" },
  { value: "ARBITRUM", label: "ARBITRUM / USDT" },
  { value: "BSC", label: "BSC / USDT" },
  { value: "EVM", label: "ETHEREUM / ERC20" },
];

function formatInvoiceStatus(language: keyof typeof STATUS_LABELS, status: string) {
  return STATUS_LABELS[language][status as keyof (typeof STATUS_LABELS)[typeof language]] ?? status.replaceAll("_", " ");
}

function formatNetworkLabel(network: Network) {
  return PAYABLE_NETWORK_OPTIONS.find((option) => option.value === network)?.label
    ?? WALLET_NETWORK_OPTIONS.find((option) => option.value === network)?.label
    ?? network;
}

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
  const [billingNetwork, setBillingNetwork] = useState<Network>("TRON");

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
      const message = (err as Error).message;
      setError(message);
      if (message.toLowerCase().includes("trial limit reached")) {
        setActivePanel("create");
      }
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

  async function handleCreateBilling(network = billingNetwork) {
    if (!session) {
      return;
    }
    try {
      const invoice = await createBillingCheckout(session.token, {
        payable_network: network,
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

  async function handleInvoiceAction(invoiceId: number, action: "cancel") {
    if (!session) {
      return;
    }
    try {
      await cancelInvoice(session.token, invoiceId);
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
  const trialEnded = Boolean(session && !session.me.plan.is_pro && session.me.plan.trial_remaining <= 0);
  const sellerHandle = session ? `@${session.me.seller.username || String(session.me.seller.telegram_id)}` : "";
  const heroLink = freshLink || (latestInvoice ? `${checkoutOrigin}/checkout/${latestInvoice.public_id}` : "");
  const heroLinkLabel = freshLink ? text.freshLink : text.recentInvoice;
  const invoicePulse = useMemo(() => {
    if (!session) {
      return [];
    }

    return [
      { key: "awaiting_payment", label: formatInvoiceStatus(language, "awaiting_payment"), value: session.invoices.filter((invoice) => invoice.status === "awaiting_payment").length },
      { key: "manual_review", label: formatInvoiceStatus(language, "manual_review"), value: session.invoices.filter((invoice) => invoice.status === "manual_review").length },
      { key: "paid", label: formatInvoiceStatus(language, "paid"), value: session.invoices.filter((invoice) => invoice.status === "paid").length },
    ];
  }, [language, session]);
  const walletCoverage = useMemo(() => {
    if (!session) {
      return [];
    }

    const activeNetworks = new Set(session.wallets.map((wallet) => wallet.network));
    return WALLET_NETWORK_OPTIONS.map((option) => ({
      ...option,
      ready: activeNetworks.has(option.value),
    }));
  }, [session]);

  return (
    <main className="shell shell-console shell-console--redesigned">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar topbar--console">
        <div className="topbar-brand">
          <strong>reqst</strong>
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
          <section className="console-command console-surface">
            <div className="console-command-main">
              <div className="console-command-headline">
                <div className="console-title-row">
                  <h1>{text.heroTitle}</h1>
                  <div className="console-title-badges">
                    <span className="console-chip">{sellerHandle}</span>
                    <span className="console-chip console-chip--accent">{session.me.plan.name}</span>
                    {!session.me.plan.is_pro ? <span className="console-chip">{text.trialLeft}: {session.me.plan.trial_remaining}</span> : null}
                  </div>
                </div>
              </div>

              <p className="hero-copy">{text.heroCopy}</p>

              <div className="console-command-actions">
                <button type="button" onClick={() => setActivePanel("create")}>
                  {text.generate}
                </button>
                <button type="button" className="ghost-button compact-button" onClick={() => setActivePanel("orders")}>
                  {text.ordersTitle}
                </button>
                <button type="button" className="ghost-button compact-button" onClick={() => setActivePanel("wallets")}>
                  {text.walletTitle}
                </button>
              </div>

              <div className="console-summary-strip">
                <article className="console-summary-pill">
                  <span>{text.wallets}</span>
                  <strong>{session.wallets.length}</strong>
                </article>
                <article className="console-summary-pill">
                  <span>{text.invoices}</span>
                  <strong>{session.invoices.length}</strong>
                </article>
                <article className="console-summary-pill">
                  <span>{text.recentInvoice}</span>
                  <strong>{latestInvoice ? latestInvoice.payable_amount : "0"}</strong>
                </article>
              </div>
            </div>

            <div className="console-command-side">
              <div className="console-link-card console-link-card--spotlight">
                <span>{heroLinkLabel}</span>
                <strong>{heroLink ? heroLink.replace(checkoutOrigin, "") : text.noRecentInvoice}</strong>
                {latestInvoice ? (
                  <div className="console-inline-meta">
                    <span className={`status-pill status-${latestInvoice.status}`}>{formatInvoiceStatus(language, latestInvoice.status)}</span>
                    <p>{latestInvoice.title}</p>
                  </div>
                ) : null}
                {heroLink ? (
                  <div className="console-link-actions">
                    <button type="button" className="ghost-button compact-button" onClick={() => navigator.clipboard.writeText(heroLink)}>
                      {text.copy}
                    </button>
                    <a className="inline-link" href={heroLink} target="_blank" rel="noreferrer">
                      {text.open}
                    </a>
                  </div>
                ) : null}
              </div>

              {!session.me.plan.is_pro ? (
                <div className="console-link-card console-link-card--billing">
                  <span>{text.unlockPro}</span>
                  <strong>{text.unlockPrice}</strong>
                  <p>{trialEnded ? text.paywallBody : text.unlockCopy}</p>
                  <div className="console-link-actions console-link-actions--billing">
                    <select value={billingNetwork} onChange={(event) => setBillingNetwork(event.target.value as Network)} aria-label={text.billingNetwork}>
                      {PAYABLE_NETWORK_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="ghost-button compact-button" onClick={() => void handleCreateBilling()}>
                      {text.unlockNow}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <nav className="panel-switcher panel-switcher--console" aria-label="console sections">
            {PANEL_ORDER.map((panel) => (
              <button key={panel} type="button" className={activePanel === panel ? "switch-pill active" : "switch-pill"} onClick={() => setActivePanel(panel)}>
                {text.tabs[panel]}
              </button>
            ))}
          </nav>

          {activePanel === "overview" ? (
            <section className="console-layout console-layout--overview">
              <div className="console-stack">
                <article className="console-surface console-overview-card">
                  <div className="console-section-head">
                    <div>
                      <h2>{text.accountTitle}</h2>
                      <p>{text.accountCopy}</p>
                    </div>
                  </div>

                  <div className="console-stat-grid console-stat-grid--profile">
                    <article className="console-stat-card">
                      <span>{text.seller}</span>
                      <strong>{sellerHandle}</strong>
                      <p>{text.sellerIdLabel}: {session.me.seller.telegram_id}</p>
                    </article>
                    <article className="console-stat-card">
                      <span>{text.plan}</span>
                      <strong>{session.me.plan.name}</strong>
                      <p>{!session.me.plan.is_pro ? `${text.trialLeft}: ${session.me.plan.trial_remaining}` : text.unlockPrice}</p>
                    </article>
                    <article className="console-stat-card">
                      <span>{text.defaultNetwork}</span>
                      <strong>{formatNetworkLabel(session.me.seller.default_network)}</strong>
                      <p>{text.activeWallets}</p>
                    </article>
                    <article className="console-stat-card">
                      <span>{text.invoices}</span>
                      <strong>{session.invoices.length}</strong>
                      <p>{text.totalInvoices}</p>
                    </article>
                  </div>
                </article>

                <article className="console-surface console-section-card">
                  <div className="console-section-head">
                    <div>
                      <h2>{text.invoicePulseTitle}</h2>
                      <p>{text.invoicePulseCopy}</p>
                    </div>
                  </div>

                  <div className="console-pulse-grid">
                    {invoicePulse.map((item) => (
                      <article key={item.key} className={`console-pulse-card status-${item.key}`}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </article>
                    ))}
                  </div>
                </article>
              </div>

              <aside className="console-rail">
                <article className="console-surface console-spotlight">
                  <div className="console-section-head">
                    <div>
                      <h2>{text.walletCoverageTitle}</h2>
                      <p>{text.walletCoverageCopy}</p>
                    </div>
                  </div>
                  <div className="console-coverage-list">
                    {walletCoverage.map((network) => (
                      <div key={network.value} className={network.ready ? "console-coverage-row is-ready" : "console-coverage-row"}>
                        <div>
                          <span>{network.label}</span>
                          <strong>{network.ready ? text.walletReady : text.walletMissing}</strong>
                        </div>
                        <span className={network.ready ? "console-coverage-dot is-ready" : "console-coverage-dot"} aria-hidden="true" />
                      </div>
                    ))}
                  </div>

                  {latestInvoice ? (
                    <div className="console-invoice-spotlight">
                      <div className="console-invoice-topline">
                        <span>{text.latestCheckout}</span>
                        <span className={`status-pill status-${latestInvoice.status}`}>{formatInvoiceStatus(language, latestInvoice.status)}</span>
                      </div>
                      <h3>{latestInvoice.title}</h3>
                      <div className="console-meta-pairs">
                        <div>
                          <span>{text.publicId}</span>
                          <p>{latestInvoice.public_id}</p>
                        </div>
                        <div>
                          <span>{text.expires}</span>
                          <p>{new Date(latestInvoice.expires_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </article>
              </aside>
            </section>
          ) : null}

          {activePanel === "wallets" ? (
            <section className="console-stack">
              <article className="console-surface console-section-card">
                <div className="console-section-head">
                  <div>
                    <h2>{text.walletTitle}</h2>
                    <p>{text.walletCopy}</p>
                  </div>
                </div>

                <form onSubmit={handleCreateWallet} className="form-grid form-grid--wallets console-form-grid">
                  <label>
                    {text.network}
                    <select value={walletForm.network} onChange={(event) => setWalletForm((current) => ({ ...current, network: event.target.value as Network }))}>
                      {WALLET_NETWORK_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {text.address}
                    <input placeholder="Wallet address" value={walletForm.address} onChange={(event) => setWalletForm((current) => ({ ...current, address: event.target.value }))} />
                  </label>
                  <button type="submit">{text.saveWallet}</button>
                </form>

                <div className="stack-list stack-list--console">
                  {session.wallets.map((wallet) => (
                    <div key={wallet.id} className="stack-item stack-item--console">
                      <div className="console-wallet-copy">
                        <span>{formatNetworkLabel(wallet.network)}</span>
                        <strong>{wallet.address}</strong>
                      </div>
                      <button type="button" className="ghost-button compact-button" onClick={() => void handleDeleteWallet(wallet.id)}>
                        {text.disable}
                      </button>
                    </div>
                  ))}
                  {!session.wallets.length ? <p className="muted">{text.noWallets}</p> : null}
                </div>
              </article>
            </section>
          ) : null}

          {activePanel === "create" ? (
            <section className="console-layout console-layout--create">
              <article className="console-surface console-section-card">
                <div className="console-section-head">
                  <div>
                    <h2>{text.createTitle}</h2>
                    <p>{text.createCopy}</p>
                  </div>
                </div>
                {trialEnded ? (
                  <div className="console-paywall">
                    <h3>{text.paywallTitle}</h3>
                    <p>{text.paywallBody}</p>
                    <label>
                      {text.billingNetwork}
                      <select value={billingNetwork} onChange={(event) => setBillingNetwork(event.target.value as Network)}>
                        {PAYABLE_NETWORK_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="button" onClick={() => void handleCreateBilling()}>
                      {text.unlockNow} · {text.unlockPrice}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateInvoice} className="form-grid console-form-grid">
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
                        {PAYABLE_NETWORK_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {text.lifetime}
                      <input type="number" min={5} max={1440} value={invoiceForm.expiresInMinutes} onChange={(event) => setInvoiceForm((current) => ({ ...current, expiresInMinutes: Number(event.target.value) }))} />
                    </label>
                    <button type="submit">{text.generate}</button>
                  </form>
                )}
              </article>

              <aside className="console-surface console-note-card">
                <div className="console-section-head">
                  <div>
                    <h2>{text.matchingTitle}</h2>
                  </div>
                </div>
                <ul className="note-list note-list--console">
                  <li>{text.matchingTon}</li>
                  <li>{text.matchingUsdt}</li>
                  <li>{text.matchingLate}</li>
                </ul>
              </aside>
            </section>
          ) : null}

          {activePanel === "orders" ? (
            <section className="console-stack">
              <article className="console-surface console-section-card">
                <div className="console-section-head">
                  <div>
                    <h2>{text.ordersTitle}</h2>
                    <p>{text.ordersCopy}</p>
                  </div>
                </div>

                <div className="stack-list stack-list--console">
                  {session.invoices.map((invoice) => {
                    const checkoutUrl = `${checkoutOrigin}/checkout/${invoice.public_id}`;
                    return (
                      <article key={invoice.id} className="invoice-card invoice-card--console">
                        <div className="console-invoice-topline">
                          <div>
                            <span className={`status-pill status-${invoice.status}`}>{formatInvoiceStatus(language, invoice.status)}</span>
                            <h3>{invoice.title}</h3>
                          </div>
                          <div className="invoice-amount">
                            <strong>{invoice.payable_amount}</strong>
                            <span>{formatNetworkLabel(invoice.payable_network)}</span>
                          </div>
                        </div>

                        <div className="console-meta-pairs console-meta-pairs--wide">
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

                        <div className="invoice-actions invoice-actions--console">
                          <button type="button" className="ghost-button compact-button" onClick={() => navigator.clipboard.writeText(checkoutUrl)}>
                            {text.copyLink}
                          </button>
                          <a className="inline-link" href={checkoutUrl} target="_blank" rel="noreferrer">
                            {text.open}
                          </a>
                          <button type="button" className="ghost-button compact-button" onClick={() => void handleInvoiceAction(invoice.id, "cancel")} disabled={invoice.status === "paid"}>
                            {text.cancel}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                  {!session.invoices.length ? <p className="muted">{text.emptyOrders}</p> : null}
                </div>
              </article>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
