import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CustomSelect } from "../components/CustomSelect";
import {
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
  markInvoicePaid,
} from "../lib/api";
import { buildAuthHref } from "../lib/routing";
import type { Invoice, MeResponse, Network, Wallet } from "../lib/types";
import { useUI } from "../lib/ui";

const BOT_URL = "https://t.me/reqstxyz_bot";

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

type PanelKey = "overview" | "wallets" | "create" | "orders" | "settings";
type BillingPlanCode = "pro" | "dev" | "enterprise";

function LiveValue({ value }: { value: string | number }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timeout = window.setTimeout(() => setAnimate(false), 520);
    return () => window.clearTimeout(timeout);
  }, [value]);

  return <span className={animate ? "live-value is-updating" : "live-value"}>{value}</span>;
}

const COPY = {
  ru: {
    eyebrow: "Reqst",
    heroTitle: "Консоль",
    heroCopy: "Управление инвойсами и кошельками.",
    tabs: {
      overview: "Главная",
      wallets: "Реквизиты",
      create: "Принять платеж",
      orders: "Транзакции",
      settings: "Настройки",
    },
    authTitle: "Вход",
    authCopy: "Авторизуйтесь для доступа к продажам.",
    telegramId: "Telegram ID",
    username: "User",
    signIn: "Войти",
    signingIn: "Вход...",
    authAction: "Войти",
    authHint: "Запустите @reqstxyz_bot, нажмите Start и авторизуйтесь через Telegram-код на странице входа.",
    seller: "Аккаунт",
    plan: "Тариф",
    wallets: "Кошельки",
    invoices: "Счета",
    activeWallets: "Активные сети",
    totalInvoices: "Всего",
    trialLeft: "Осталось",
    unlockPro: "Тарифные планы",
    unlockCopy: "PRO для прямых продаж, Dev и Enterprise для работы через API.",
    unlockPrice: "Billing",
    billingPlan: "План",
    billingNetwork: "Сеть оплаты",
    unlockNow: "Оплатить",
    paywallTitle: "Требуется подписка",
    paywallBody: "Лимит бесплатных инвойсов исчерпан. Пожалуйста, выберите подходящий тариф для продолжения работы.",
    recentInvoice: "Последняя активность",
    noRecentInvoice: "История транзакций пуста.",
    freshLink: "Ссылка",
    open: "Открыть",
    copy: "Копировать",
    logout: "Выйти",
    theme: { light: "Светлая", dark: "Темная" },
    language: { ru: "РУ", en: "EN" },
    walletTitle: "Ваши реквизиты",
    walletCopy: "Добавьте по одному адресу для каждой поддерживаемой сети.",
    network: "Сеть",
    address: "Адрес",
    saveWallet: "Добавить кошелек",
    noWallets: "У вас еще нет добавленных кошельков.",
    disable: "Удалить",
    createTitle: "Новый инвойс",
    createCopy: "Создайте ссылку для быстрой оплаты клиентом.",
    serviceTitle: "Название услуги или товара",
    amountUsd: "Сумма к оплате (USD)",
    lifetime: "Срок жизни ссылки (мин)",
    generate: "Создать платежную ссылку",
    ordersTitle: "История транзакций",
    ordersCopy: "Полный список созданных инвойсов и их статусы.",
    emptyOrders: "Транзакций пока нет.",
    publicId: "ID",
    expires: "Истекает",
    exact: "Сумма",
    comment: "Комментарий",
    copyLink: "URL",
    cancel: "Отмена",
    markPaid: "Подтвердить",
    quickActions: "Управление",
    accountTitle: "Профиль",
    accountCopy: "Настройки аккаунта.",
    overviewTitle: "Обзор",
    overviewCopy: "Ключевые показатели и тариф.",
    invoicePulseTitle: "Активность",
    invoicePulseCopy: "Статистика за последние 24 часа.",
    walletCoverageTitle: "Доступные сети",
    walletCoverageCopy: "Проверьте готовность ваших кошельков к приему платежей.",
    activeWalletsSummary: "сетей подключено",
    totalInvoicesSummary: "инвойсов создано всего",
    plansTitle: "Ваш тариф",
    plansCopy: "Управление подпиской и выбор условий обслуживания.",
    plansAction: "Биллинг",
    developersTitle: "Developer Portal",
    developersCopy: "API keys и Webhooks.",
    developersAction: "Открыть",
    proSpotlightTitle: "Тариф PRO",
    proSpotlightBody: "Вам доступно ручное создание инвойсов и управление через Telegram-бота для быстрых продаж.",
    devSpotlightTitle: "Тариф Dev (API Active)",
    devSpotlightBody: "API и вебхуки активны. Используйте Developer Portal для настройки интеграций.",
    enterpriseSpotlightTitle: "B2B Infrastructure",
    enterpriseSpotlightBody: "Максимальные лимиты и приоритетная поддержка включены.",
    settingsTitle: "Настройки профиля",
    settingsCopy: "Язык, сессия и Telegram-авторизация.",
    interfaceTitle: "Интерфейс",
    interfaceCopy: "Язык и сессия.",
    consoleLanguage: "Язык",
    sessionActions: "Сессия",
    logoutHint: "Завершение текущей сессии.",
    sellerIdLabel: "ID",
    telegramAccessTitle: "Telegram-аккаунт",
    telegramAccessCopy: "Ваш основной и единственный способ авторизации в системе.",
    telegramLinked: "Привязан",
    telegramMissing: "Не привязан",
    telegramLinkHint: "Запустите @reqstxyz_bot, нажмите Start и авторизуйтесь через Telegram-код на странице входа.",
    telegramLinkAction: "Привязать",
    accessCodeSent: "Код отправлен.",
    defaultNetwork: "Сеть",
    walletReady: "Активен",
    walletMissing: "Нет",
    latestCheckout: "Последний заказ",
  },
  en: {
    eyebrow: "Reqst",
    heroTitle: "Console",
    heroCopy: "Your dashboard for payments and wallet management.",
    tabs: {
      overview: "Overview",
      wallets: "Payout Addresses",
      create: "Accept Payment",
      orders: "Transactions",
      settings: "Settings",
    },
    authTitle: "Sign-In",
    authCopy: "Authenticate to access dashboard.",
    telegramId: "Telegram ID",
    username: "User",
    signIn: "Enter",
    signingIn: "Wait...",
    authAction: "Login",
    authHint: "Open @reqstxyz_bot, press Start, then use the Telegram code flow on /auth.",
    seller: "Account",
    plan: "Plan",
    wallets: "Wallets",
    invoices: "Invoices",
    activeWallets: "Active Networks",
    totalInvoices: "Total",
    trialLeft: "Left",
    unlockPro: "Subscription Plans",
    unlockCopy: "PRO for direct sales, Dev & Enterprise for API integration.",
    unlockPrice: "Billing",
    billingPlan: "Plan",
    billingNetwork: "Network",
    unlockNow: "Pay",
    paywallTitle: "Subscription Required",
    paywallBody: "You've reached the free invoice limit. Please choose a plan to continue.",
    recentInvoice: "Activity",
    noRecentInvoice: "Transaction history is empty.",
    freshLink: "Link",
    open: "View",
    copy: "Copy",
    logout: "Logout",
    theme: { light: "Light", dark: "Dark" },
    language: { ru: "RU", en: "EN" },
    walletTitle: "Payout Addresses",
    walletCopy: "Add one destination address for each supported network.",
    network: "Network",
    address: "Address",
    saveWallet: "Add Wallet",
    noWallets: "No active payout addresses found.",
    disable: "Remove",
    createTitle: "New Invoice",
    createCopy: "Generate a payment link for your customer.",
    serviceTitle: "Item or Service Name",
    amountUsd: "Amount (USD)",
    lifetime: "Expiry Time (min)",
    generate: "Create Payment Link",
    ordersTitle: "Transaction History",
    ordersCopy: "A complete list of your invoices and their current statuses.",
    emptyOrders: "No transactions found.",
    publicId: "ID",
    expires: "Expires",
    exact: "Amount",
    comment: "Comment",
    copyLink: "URL",
    cancel: "Cancel",
    markPaid: "Confirm",
    quickActions: "Actions",
    accountTitle: "Profile",
    accountCopy: "Account settings.",
    overviewTitle: "Overview",
    overviewCopy: "Key metrics and plan.",
    invoicePulseTitle: "Activity",
    invoicePulseCopy: "Stats for the last 24 hours.",
    walletCoverageTitle: "Network Readiness",
    walletCoverageCopy: "Check which networks are ready to accept payments.",
    activeWalletsSummary: "networks connected",
    totalInvoicesSummary: "invoices created overall",
    plansTitle: "Plan",
    plansCopy: "Subscription and billing.",
    plansAction: "Billing",
    developersTitle: "Developer Portal",
    developersCopy: "API keys and Webhooks.",
    developersAction: "Open",
    proSpotlightTitle: "PRO Seller",
    proSpotlightBody: "Use manual invoices and Telegram bot for quick sales.",
    devSpotlightTitle: "API Active",
    devSpotlightBody: "Your API keys and webhooks are ready. Use Dev Portal for integration.",
    enterpriseSpotlightTitle: "B2B Infrastructure",
    enterpriseSpotlightBody: "Maximum limits and priority delivery are active.",
    settingsTitle: "Profile Settings",
    settingsCopy: "Language, session, and Telegram access.",
    interfaceTitle: "Interface",
    interfaceCopy: "Language and session.",
    consoleLanguage: "Language",
    sessionActions: "Session",
    logoutHint: "End current session.",
    sellerIdLabel: "ID",
    telegramAccessTitle: "Telegram Account",
    telegramAccessCopy: "Telegram is now the only sign-in method for Reqst.",
    telegramLinked: "Linked",
    telegramMissing: "Not linked",
    telegramLinkHint: "Open @reqstxyz_bot, press Start, then use /auth in the browser to confirm your identity.",
    telegramLinkAction: "Link",
    accessCodeSent: "Code sent.",
    defaultNetwork: "Network",
    walletReady: "Active",
    walletMissing: "No",
    latestCheckout: "Latest Order",
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

const PANEL_ORDER: PanelKey[] = ["overview", "wallets", "create", "orders", "settings"];

const WALLET_NETWORK_OPTIONS: Array<{ value: Network; label: string; hint?: string }> = [
  { value: "TON", label: "TON" },
  { value: "TRON", label: "TRON" },
  { value: "SOLANA", label: "SOLANA" },
  { value: "EVM", label: "ETHEREUM" },
];

const PAYABLE_NETWORK_OPTIONS: Array<{ value: Network; label: string; hint?: string }> = [
  { value: "TON", label: "TON" },
  { value: "TRON", label: "TRON" },
  { value: "SOLANA", label: "SOLANA" },
  { value: "BASE", label: "BASE" },
  { value: "ARBITRUM", label: "ARBITRUM" },
  { value: "BSC", label: "BSC" },
  { value: "EVM", label: "ETHEREUM" },
];

const BILLING_PLAN_OPTIONS: Array<{ value: BillingPlanCode; label: string }> = [
  { value: "pro", label: "Reqst PRO" },
  { value: "dev", label: "Reqst Dev" },
  { value: "enterprise", label: "Reqst Enterprise" },
];

function formatInvoiceStatus(language: keyof typeof STATUS_LABELS, status: string) {
  return STATUS_LABELS[language][status as keyof (typeof STATUS_LABELS)[typeof language]] ?? status.replaceAll("_", " ");
}

function formatNetworkLabel(network: Network) {
  return PAYABLE_NETWORK_OPTIONS.find((option) => option.value === network)?.label
    ?? WALLET_NETWORK_OPTIONS.find((option) => option.value === network)?.label
    ?? network;
}

function formatWalletNetworkLabel(network: Network) {
  return WALLET_NETWORK_OPTIONS.find((option) => option.value === network)?.label ?? formatNetworkLabel(network);
}

export function SellerConsolePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage } = useUI();
  const text = COPY[language];
  const [session, setSession] = useState<SessionState | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<PanelKey>("overview");
  const [freshLink, setFreshLink] = useState("");
  const [walletForm, setWalletForm] = useState<{ network: Network; address: string }>({ network: "TON", address: "" });
  const [invoiceForm, setInvoiceForm] = useState({
    title: "Digital service",
    baseAmountUSD: "150.00",
    payableNetwork: "TON" as Network,
    expiresInMinutes: 30,
  });
  const [billingNetwork, setBillingNetwork] = useState<Network>("TRON");
  const [billingPlan, setBillingPlan] = useState<BillingPlanCode>(() => {
    const selected = new URLSearchParams(window.location.search).get("plan");
    if (selected === "dev" || selected === "enterprise" || selected === "pro") {
      return selected;
    }
    return "pro";
  });
  const isTelegramMiniApp = Boolean(window.Telegram?.WebApp?.initData);

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

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadSession(session.token, { silent: true });
    }, 12000);

    return () => window.clearInterval(interval);
  }, [session?.token]);

  async function loadSession(token: string, options?: { silent?: boolean }) {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
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
      navigate(buildAuthHref(`${location.pathname}${location.search}${location.hash}`), { replace: true });
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }

  async function handleCreateWallet(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      return;
    }
    try {
      await createWallet(session.token, walletForm);
      setWalletForm((current) => ({ ...current, address: "" }));
      await loadSession(session.token, { silent: true });
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
      await loadSession(session.token, { silent: true });
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
        plan_code: billingPlan,
      });
      setFreshLink(`${window.location.origin}/checkout/${invoice.public_id}`);
      await loadSession(session.token, { silent: true });
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
      await loadSession(session.token, { silent: true });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleInvoiceAction(invoiceId: number, action: "cancel" | "mark_paid") {
    if (!session) {
      return;
    }
    try {
      if (action === "mark_paid") {
        await markInvoicePaid(session.token, invoiceId);
      } else {
        await cancelInvoice(session.token, invoiceId);
      }
      await loadSession(session.token, { silent: true });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function canManageSellerInvoice(invoice: Invoice) {
    return invoice.kind === "merchant" && (invoice.subscription_days ?? 0) <= 0;
  }

  function handleLogout() {
    clearStoredToken();
    setSession(null);
    setFreshLink("");
    setActivePanel("overview");
    navigate("/auth", { replace: true });
  }

  const checkoutOrigin = useMemo(() => window.location.origin, []);
  const latestInvoice = session?.invoices[0] ?? null;
  const trialEnded = Boolean(session && !session.me.plan.is_pro && session.me.plan.trial_remaining <= 0);
  const selectedBillingPlan = session?.me.plans.find((plan) => plan.code === billingPlan);
  const sellerHandle = session
    ? session.me.seller.username
      ? `@${session.me.seller.username}`
      : session.me.seller.telegram_id
        ? `#${session.me.seller.telegram_id}`
        : session.me.seller.email
    : "";
  const latestCheckoutUrl = freshLink || (latestInvoice ? `${checkoutOrigin}/checkout/${latestInvoice.public_id}` : "");
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
  const activeWalletCount = walletCoverage.filter((network) => network.ready).length;

  return (
    <main className="shell shell-console shell-console--redesigned">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar topbar--console">
        <div className="topbar-main">
          <div className="topbar-brand">
            <strong>reqst</strong>
          </div>
          {session && session.me.plan.has_api && (
            <div className="lend-network-badge" style={{ marginLeft: '1rem', background: session.me.plan.code === 'enterprise' ? 'rgba(79, 116, 255, 0.2)' : 'rgba(255, 148, 77, 0.2)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <b style={{ color: '#fff', fontSize: '0.75rem' }}>{session.me.plan.code === 'enterprise' ? 'B2B ACTIVE' : 'API ACTIVE'}</b>
            </div>
          )}
        </div>

        {session ? (
          <nav className="topbar-nav topbar-nav--console" aria-label="console sections">
            {PANEL_ORDER.map((panel) => (
              <button key={panel} type="button" className={activePanel === panel ? "switch-pill active" : "switch-pill"} onClick={() => setActivePanel(panel)}>
                {text.tabs[panel]}
              </button>
            ))}
          </nav>
        ) : null}
      </header>

      {error ? <div className="alert">{error}</div> : null}

      {!session ? (
        <section className="panel auth-panel elevated-panel">
          <div className="panel-header">
            <h2>{text.authTitle}</h2>
            <p>{text.authCopy}</p>
          </div>
          <div className="console-auth-cta">
            <Link className="lend-primary" to="/auth">
              {text.authAction}
            </Link>
            <p className="muted">{text.authHint}</p>
            <p className="muted">
              <a href={BOT_URL} target="_blank" rel="noreferrer">@reqstxyz_bot</a>
            </p>
          </div>
        </section>
      ) : (
        <>
          {activePanel === "overview" ? (
            <section className="console-layout console-layout--overview">
              <div className="console-stack">
                <article className="console-surface console-overview-card">
                  <div className="console-section-head">
                    <div>
                      <h2>{text.overviewTitle}</h2>
                      <p>{text.overviewCopy}</p>
                    </div>
                  </div>

                  {session.me.plan.code !== "trial" && (
                    <article className="console-paywall" style={{ 
                      marginBottom: '1.5rem',
                      background: session.me.plan.code === 'enterprise' 
                        ? 'linear-gradient(135deg, rgba(79, 116, 255, 0.1), rgba(0,0,0,0))'
                        : session.me.plan.code === 'dev'
                        ? 'linear-gradient(135deg, rgba(255, 148, 77, 0.1), rgba(0,0,0,0))'
                        : 'rgba(255, 255, 255, 0.03)',
                      borderColor: session.me.plan.code === 'enterprise' ? 'rgba(79, 116, 255, 0.2)' : 'rgba(255, 148, 77, 0.2)'
                    }}>
                      <h3>{
                        session.me.plan.code === 'enterprise' ? text.enterpriseSpotlightTitle :
                        session.me.plan.code === 'dev' ? text.devSpotlightTitle :
                        text.proSpotlightTitle
                      }</h3>
                      <p>{
                        session.me.plan.code === 'enterprise' ? text.enterpriseSpotlightBody :
                        session.me.plan.code === 'dev' ? text.devSpotlightBody :
                        text.proSpotlightBody
                      }</p>
                    </article>
                  )}

                  <div className="console-stat-grid console-stat-grid--profile">
                    <article className="console-stat-card">
                      <span>{text.seller}</span>
                      <strong><LiveValue value={sellerHandle} /></strong>
                      <p>{text.sellerIdLabel}: {session.me.seller.telegram_id ?? text.telegramMissing}</p>
                    </article>
                    <article className="console-stat-card">
                      <span>{text.plan}</span>
                      <strong><LiveValue value={session.me.plan.name} /></strong>
                      <p>{!session.me.plan.is_pro ? `${text.trialLeft}: ${session.me.plan.trial_remaining}` : `${session.me.plan.price_usd} USDT / ${session.me.plan.billing_days}d`}</p>
                    </article>
                    <article className="console-stat-card">
                      <span>{text.activeWallets}</span>
                      <strong><LiveValue value={activeWalletCount} /></strong>
                      <p>{activeWalletCount}/{walletCoverage.length} {text.activeWalletsSummary}</p>
                    </article>
                    <article className="console-stat-card">
                      <span>{text.totalInvoices}</span>
                      <strong><LiveValue value={session.invoices.length} /></strong>
                      <p>{text.totalInvoicesSummary}</p>
                    </article>
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
                      {latestCheckoutUrl ? (
                        <div className="console-link-actions">
                          <button type="button" className="ghost-button compact-button" onClick={() => navigator.clipboard.writeText(latestCheckoutUrl)}>
                            {text.copy}
                          </button>
                          <a className="inline-link" href={latestCheckoutUrl} target="_blank" rel="noreferrer">
                            {text.open}
                          </a>
                        </div>
                      ) : null}
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
                    <CustomSelect
                      value={walletForm.network}
                      options={WALLET_NETWORK_OPTIONS}
                      ariaLabel={text.network}
                      onChange={(value) => setWalletForm((current) => ({ ...current, network: value }))}
                    />
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
                        <span>{formatWalletNetworkLabel(wallet.network)}</span>
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
                      {text.billingPlan}
                      <CustomSelect
                        value={billingPlan}
                        options={BILLING_PLAN_OPTIONS}
                        ariaLabel={text.billingPlan}
                        onChange={(value) => setBillingPlan(value as BillingPlanCode)}
                      />
                    </label>
                    <label>
                      {text.billingNetwork}
                      <CustomSelect
                        value={billingNetwork}
                        options={PAYABLE_NETWORK_OPTIONS}
                        ariaLabel={text.billingNetwork}
                        onChange={(value) => setBillingNetwork(value)}
                      />
                    </label>
                    <button type="button" onClick={() => void handleCreateBilling()}>
                      {text.unlockNow} · {selectedBillingPlan ? `${selectedBillingPlan.price_usd} USDT / ${selectedBillingPlan.billing_days}d` : text.unlockPrice}
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
                      <CustomSelect
                        value={invoiceForm.payableNetwork}
                        options={PAYABLE_NETWORK_OPTIONS}
                        ariaLabel={text.network}
                        onChange={(value) => setInvoiceForm((current) => ({ ...current, payableNetwork: value }))}
                      />
                    </label>
                    <label>
                      {text.lifetime}
                      <input type="number" min={5} max={1440} value={invoiceForm.expiresInMinutes} onChange={(event) => setInvoiceForm((current) => ({ ...current, expiresInMinutes: Number(event.target.value) }))} />
                    </label>
                    <button type="submit">{text.generate}</button>
                  </form>
                )}
              </article>
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
                    const canManageInvoice = canManageSellerInvoice(invoice);
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
                          {canManageInvoice ? (
                            <>
                              <button
                                type="button"
                                className="ghost-button compact-button"
                                onClick={() => void handleInvoiceAction(invoice.id, "mark_paid")}
                                disabled={invoice.status === "paid"}
                              >
                                {text.markPaid}
                              </button>
                              <button
                                type="button"
                                className="ghost-button compact-button"
                                onClick={() => void handleInvoiceAction(invoice.id, "cancel")}
                                disabled={invoice.status === "paid"}
                              >
                                {text.cancel}
                              </button>
                            </>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                  {!session.invoices.length ? <p className="muted">{text.emptyOrders}</p> : null}
                </div>
              </article>
            </section>
          ) : null}

          {activePanel === "settings" ? (
            <section className="console-layout console-layout--overview">
              <div className="console-stack">
                <article className="console-surface console-overview-card">
                  <div className="console-section-head">
                    <div>
                      <h2>{text.settingsTitle}</h2>
                      <p>{text.settingsCopy}</p>
                    </div>
                  </div>

                  <div className="console-access-grid">
                    <article className="console-access-card">
                      <div className="console-access-head">
                        <h3>{text.telegramAccessTitle}</h3>
                        <p>{text.telegramAccessCopy}</p>
                      </div>

                      {session.me.seller.telegram_id ? (
                        <div className="console-access-status">
                          <strong>{text.telegramLinked}</strong>
                          <p>@{session.me.seller.username || session.me.seller.telegram_id}</p>
                        </div>
                      ) : (
                        <div className="console-access-status">
                          <strong>{text.telegramMissing}</strong>
                          <p>{text.telegramLinkHint}</p>
                          <p><a href={BOT_URL} target="_blank" rel="noreferrer">@reqstxyz_bot</a></p>
                        </div>
                      )}
                    </article>
                  </div>
                </article>
              </div>

              <aside className="console-rail">
                <article className="console-surface console-spotlight">
                  <div className="console-section-head">
                    <div>
                      <h2>{text.interfaceTitle}</h2>
                      <p>{text.interfaceCopy}</p>
                    </div>
                  </div>

                  <div className="console-settings-group">
                    <span>{text.consoleLanguage}</span>
                    <div className="lend-language console-language-picker" role="group" aria-label="language">
                      <button type="button" className={language === "ru" ? "active" : ""} onClick={() => setLanguage("ru")}>
                        RU
                      </button>
                      <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>
                        EN
                      </button>
                    </div>
                  </div>

                  {!isTelegramMiniApp ? (
                    <div className="console-settings-group">
                      <span>{text.sessionActions}</span>
                      <p>{text.logoutHint}</p>
                      <button type="button" className="ghost-button compact-button" onClick={handleLogout}>
                        {text.logout}
                      </button>
                    </div>
                  ) : null}
                </article>
              </aside>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
