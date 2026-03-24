import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CustomSelect } from "../components/CustomSelect";
import {
  cancelInvoice,
  clearStoredToken,
  confirmEmailLink,
  createBillingCheckout,
  createInvoice,
  createWallet,
  deleteWallet,
  fetchInvoices,
  fetchMe,
  fetchWallets,
  getStoredToken,
  linkTelegram,
  markInvoicePaid,
  requestEmailLinkCode,
} from "../lib/api";
import { buildAuthHref } from "../lib/routing";
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
    onTelegramLinkAuth?: (user: Record<string, string | number>) => Promise<void>;
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
      overview: "Обзор",
      wallets: "Кошельки",
      create: "Создать",
      orders: "Заказы",
      settings: "Настройки",
    },
    authTitle: "Вход",
    authCopy: "Авторизуйтесь для доступа к продажам.",
    telegramId: "Telegram ID",
    username: "User",
    signIn: "Войти",
    signingIn: "Вход...",
    authAction: "Войти",
    authHint: "Email можно привязать в настройках.",
    seller: "Аккаунт",
    plan: "Тариф",
    wallets: "Кошельки",
    invoices: "Счета",
    activeWallets: "Сети",
    totalInvoices: "Всего",
    trialLeft: "Осталось",
    unlockPro: "Планы Reqst",
    unlockCopy: "PRO для продаж, Dev и Enterprise для API и B2B.",
    unlockPrice: "Billing",
    billingPlan: "План",
    billingNetwork: "Сеть оплаты",
    unlockNow: "Оплатить",
    paywallTitle: "Лимит исчерпан",
    paywallBody: "Создание инвойсов приостановлено. Выберите тариф.",
    recentInvoice: "Активность",
    noRecentInvoice: "Нет заказов.",
    freshLink: "Ссылка",
    open: "Открыть",
    copy: "Копировать",
    logout: "Выйти",
    theme: { light: "Светлая", dark: "Темная" },
    language: { ru: "РУ", en: "EN" },
    walletTitle: "Кошельки",
    walletCopy: "Один адрес на каждую сеть.",
    network: "Сеть",
    address: "Адрес",
    saveWallet: "Добавить",
    noWallets: "Нет активных адресов.",
    disable: "Удалить",
    createTitle: "Новый инвойс",
    createCopy: "Создание платежной ссылки.",
    serviceTitle: "Услуга",
    amountUsd: "Сумма (USD)",
    lifetime: "Срок (мин)",
    generate: "Создать ссылку",
    ordersTitle: "Заказы",
    ordersCopy: "История транзакций.",
    emptyOrders: "Список пуст.",
    publicId: "ID",
    expires: "Истекает",
    exact: "Сумма",
    comment: "Комментарий",
    copyLink: "URL",
    cancel: "Отмена",
    markPaid: "Подтвердить",
    quickActions: "Действия",
    accountTitle: "Профиль",
    accountCopy: "Настройки аккаунта.",
    overviewTitle: "Обзор",
    overviewCopy: "Ключевые показатели и тариф.",
    invoicePulseTitle: "Статистика",
    invoicePulseCopy: "Транзакции за 24ч.",
    walletCoverageTitle: "Сети",
    walletCoverageCopy: "Готовность к приему.",
    plansTitle: "План",
    plansCopy: "Управление подпиской и биллинг.",
    plansAction: "Биллинг",
    developersTitle: "Developer Portal",
    developersCopy: "API keys и Webhooks.",
    developersAction: "Открыть",
    settingsTitle: "Настройки",
    settingsCopy: "Аккаунт и интерфейс.",
    interfaceTitle: "Интерфейс",
    interfaceCopy: "Язык и сессия.",
    consoleLanguage: "Язык",
    sessionActions: "Сессия",
    logoutHint: "Завершение текущей сессии.",
    sellerIdLabel: "ID",
    emailLabel: "Email",
    emailPlaceholder: "vlad@example.com",
    passwordLabel: "Пароль",
    passwordPlaceholder: "8+ символов",
    codeLabel: "Код",
    codePlaceholder: "123456",
    saveEmail: "Привязать Email",
    savingEmail: "...",
    sendCode: "Код",
    sendingCode: "...",
    emailLinked: "Email привязан.",
    emailAccessTitle: "Email",
    emailAccessCopy: "Вход по почте и паролю.",
    emailAccessReady: "Email активен.",
    telegramAccessTitle: "Telegram",
    telegramAccessCopy: "Привязка Telegram аккаунта.",
    telegramLinked: "Привязан",
    telegramMissing: "Не привязан",
    telegramLinkHint: "Привяжите аккаунт через виджет.",
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
    heroCopy: "Manage invoices and wallets.",
    tabs: {
      overview: "Overview",
      wallets: "Wallets",
      create: "Create",
      orders: "Orders",
      settings: "Settings",
    },
    authTitle: "Sign-In",
    authCopy: "Authenticate to access dashboard.",
    telegramId: "Telegram ID",
    username: "User",
    signIn: "Enter",
    signingIn: "Wait...",
    authAction: "Login",
    authHint: "Email can be linked in settings.",
    seller: "Account",
    plan: "Plan",
    wallets: "Wallets",
    invoices: "Invoices",
    activeWallets: "Networks",
    totalInvoices: "Total",
    trialLeft: "Left",
    unlockPro: "Plans",
    unlockCopy: "PRO for sales, Dev/Enterprise for API.",
    unlockPrice: "Billing",
    billingPlan: "Plan",
    billingNetwork: "Network",
    unlockNow: "Pay",
    paywallTitle: "Limit Reached",
    paywallBody: "Invoice creation paused. Pick a plan.",
    recentInvoice: "Activity",
    noRecentInvoice: "No orders.",
    freshLink: "Link",
    open: "View",
    copy: "Copy",
    logout: "Logout",
    theme: { light: "Light", dark: "Dark" },
    language: { ru: "RU", en: "EN" },
    walletTitle: "Wallets",
    walletCopy: "One address per network.",
    network: "Network",
    address: "Address",
    saveWallet: "Add",
    noWallets: "No active wallets.",
    disable: "Remove",
    createTitle: "New Invoice",
    createCopy: "Generate payment link.",
    serviceTitle: "Service",
    amountUsd: "Amount (USD)",
    lifetime: "Expires (min)",
    generate: "Create Link",
    ordersTitle: "Orders",
    ordersCopy: "Transaction history.",
    emptyOrders: "List is empty.",
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
    invoicePulseTitle: "Stats",
    invoicePulseCopy: "24h activity.",
    walletCoverageTitle: "Networks",
    walletCoverageCopy: "Ready for payments.",
    plansTitle: "Plan",
    plansCopy: "Subscription and billing.",
    plansAction: "Billing",
    developersTitle: "Developer Portal",
    developersCopy: "API keys and Webhooks.",
    developersAction: "Open",
    settingsTitle: "Settings",
    settingsCopy: "Identity and preferences.",
    interfaceTitle: "Interface",
    interfaceCopy: "Language and session.",
    consoleLanguage: "Language",
    sessionActions: "Session",
    logoutHint: "End current session.",
    sellerIdLabel: "ID",
    emailLabel: "Email",
    emailPlaceholder: "name@company.com",
    passwordLabel: "Password",
    passwordPlaceholder: "8+ characters",
    codeLabel: "Code",
    codePlaceholder: "123456",
    saveEmail: "Link Email",
    savingEmail: "...",
    sendCode: "Code",
    sendingCode: "...",
    emailLinked: "Email linked.",
    emailAccessTitle: "Email",
    emailAccessCopy: "Login with email/password.",
    emailAccessReady: "Email active.",
    telegramAccessTitle: "Telegram",
    telegramAccessCopy: "Connect Telegram account.",
    telegramLinked: "Linked",
    telegramMissing: "Not linked",
    telegramLinkHint: "Link account via widget.",
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
  const [accountMessage, setAccountMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingEmail, setSavingEmail] = useState(false);
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [linkingTelegram, setLinkingTelegram] = useState(false);
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
  const [emailForm, setEmailForm] = useState({
    email: "",
    code: "",
    password: "",
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
      setEmailForm({
        email: me.seller.email ?? "",
        code: "",
        password: "",
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
    setEmailForm({ email: "", code: "", password: "" });
    setFreshLink("");
      setActivePanel("overview");
      setAccountMessage("");
      navigate("/auth", { replace: true });
  }

  async function handleEmailCodeRequest() {
    if (!session) {
      return;
    }
    try {
      setSendingEmailCode(true);
      await requestEmailLinkCode(session.token, { email: emailForm.email.trim() });
      setError("");
      setAccountMessage(text.accessCodeSent);
    } catch (err) {
      setError((err as Error).message);
      setAccountMessage("");
    } finally {
      setSendingEmailCode(false);
    }
  }

  async function handleEmailSave(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      return;
    }
    try {
      setSavingEmail(true);
      const result = await confirmEmailLink(session.token, {
        email: emailForm.email.trim(),
        code: emailForm.code.trim(),
        password: emailForm.password,
      });
      setSession((current) => current ? {
        ...current,
        me: {
          ...current.me,
          seller: result.seller,
        },
      } : current);
      setEmailForm((current) => ({
        ...current,
        email: result.seller.email ?? current.email,
        code: "",
        password: "",
      }));
      setError("");
      setAccountMessage(text.emailLinked);
    } catch (err) {
      setError((err as Error).message);
      setAccountMessage("");
    } finally {
      setSavingEmail(false);
    }
  }

  useEffect(() => {
    if (!session || session.me.seller.telegram_id) {
      const existing = document.getElementById("console-telegram-link-container");
      if (existing) {
        existing.innerHTML = "";
      }
      delete window.onTelegramLinkAuth;
      return;
    }

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", "reqstxyz_bot");
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-onauth", "onTelegramLinkAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;

    const container = document.getElementById("console-telegram-link-container");
    if (container) {
      container.innerHTML = "";
      container.appendChild(script);
    }

    window.onTelegramLinkAuth = async (user) => {
      const params = new URLSearchParams();
      Object.entries(user).forEach(([key, value]) => params.append(key, String(value)));
      await handleTelegramLink(params.toString());
    };

    return () => {
      if (container) {
        container.innerHTML = "";
      }
      delete window.onTelegramLinkAuth;
    };
  }, [session?.token, session?.me.seller.telegram_id]);

  async function handleTelegramLink(widgetData?: string) {
    if (!session) {
      return;
    }
    try {
      setLinkingTelegram(true);
      const initData = widgetData ? undefined : window.Telegram?.WebApp?.initData;
      const result = await linkTelegram(session.token, widgetData
        ? { widget_data: widgetData }
        : { init_data: initData });
      setSession((current) => current ? {
        ...current,
        me: {
          ...current.me,
          seller: result.seller,
        },
      } : current);
      setError("");
      setAccountMessage(text.telegramLinked);
    } catch (err) {
      setError((err as Error).message);
      setAccountMessage("");
    } finally {
      setLinkingTelegram(false);
    }
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

  return (
    <main className="shell shell-console shell-console--redesigned">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar topbar--console">
        <div className="topbar-main">
          <div className="topbar-brand">
            <strong>reqst</strong>
          </div>
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

      {accountMessage ? <div className="auth-feedback auth-feedback--success">{accountMessage}</div> : null}
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
                      <span>{text.defaultNetwork}</span>
                      <strong><LiveValue value={formatNetworkLabel(session.me.seller.default_network)} /></strong>
                      <p>{text.activeWallets}</p>
                    </article>
                    <article className="console-stat-card">
                      <span>{text.invoices}</span>
                      <strong><LiveValue value={session.invoices.length} /></strong>
                      <p>{text.totalInvoices}</p>
                    </article>
                  </div>

                  <div className="console-overview-tiles">
                    <article className="console-link-card console-link-card--billing">
                      <span>{text.plansTitle}</span>
                      <strong>{selectedBillingPlan ? selectedBillingPlan.name : text.unlockPro}</strong>
                      <p>{text.plansCopy}</p>
                      <div className="console-link-actions">
                        <Link className="inline-link" to={`/developers?plan=${billingPlan}`}>
                          {text.plansAction}
                        </Link>
                        <Link className="inline-link" to={billingPlan === "enterprise" ? "/enterprise" : "/dev"}>
                          {billingPlan === "enterprise" ? "Enterprise" : "Dev"}
                        </Link>
                      </div>
                    </article>

                    <article className="console-link-card">
                      <span>{text.developersTitle}</span>
                      <strong>{text.developersAction}</strong>
                      <p>{text.developersCopy}</p>
                      <div className="console-link-actions">
                        <Link className="inline-link" to={`/developers?plan=${billingPlan}`}>
                          {text.developersAction}
                        </Link>
                        <button type="button" className="ghost-button compact-button" onClick={() => setActivePanel("settings")}>
                          {text.tabs.settings}
                        </button>
                      </div>
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
                  </div>

                  <div className="console-access-grid">
                    <article className="console-access-card">
                      <div className="console-access-head">
                        <h3>{text.emailAccessTitle}</h3>
                        <p>{text.emailAccessCopy}</p>
                      </div>

                      {session.me.seller.has_password && session.me.seller.email_verified_at ? (
                        <div className="console-access-status">
                          <strong>{session.me.seller.email}</strong>
                          <p>{text.emailAccessReady}</p>
                        </div>
                      ) : (
                        <form onSubmit={handleEmailSave} className="console-email-form console-email-form--credentials">
                          <label>
                            {text.emailLabel}
                            <input
                              type="email"
                              placeholder={text.emailPlaceholder}
                              value={emailForm.email}
                              onChange={(event) => setEmailForm((current) => ({ ...current, email: event.target.value }))}
                            />
                          </label>
                          <div className="console-email-form__row">
                            <label>
                              {text.codeLabel}
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder={text.codePlaceholder}
                                value={emailForm.code}
                                onChange={(event) => setEmailForm((current) => ({ ...current, code: event.target.value }))}
                              />
                            </label>
                            <button type="button" className="ghost-button" disabled={sendingEmailCode} onClick={() => void handleEmailCodeRequest()}>
                              {sendingEmailCode ? text.sendingCode : text.sendCode}
                            </button>
                          </div>
                          <label>
                            {text.passwordLabel}
                            <input
                              type="password"
                              placeholder={text.passwordPlaceholder}
                              value={emailForm.password}
                              onChange={(event) => setEmailForm((current) => ({ ...current, password: event.target.value }))}
                            />
                          </label>
                          <button type="submit" disabled={savingEmail}>
                            {savingEmail ? text.savingEmail : text.saveEmail}
                          </button>
                        </form>
                      )}
                    </article>

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
                        <div className="console-telegram-link">
                          <p className="muted">{text.telegramLinkHint}</p>
                          {window.Telegram?.WebApp?.initData ? (
                            <button type="button" disabled={linkingTelegram} onClick={() => void handleTelegramLink()}>
                              {linkingTelegram ? text.signingIn : text.telegramLinkAction}
                            </button>
                          ) : (
                            <div id="console-telegram-link-container" className="auth-widget-wrapper" />
                          )}
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
