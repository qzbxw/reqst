import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CustomSelect } from "../components/CustomSelect";
import {
  createAPIKey,
  createBillingCheckout,
  createWebhookEndpoint,
  deleteAPIKey,
  deleteWebhookEndpoint,
  fetchAPIKeys,
  fetchDeveloperUsage,
  fetchMe,
  fetchWebhookEndpoints,
  getApiBase,
  getStoredToken,
} from "../lib/api";
import type { APIKey, DeveloperUsageResponse, MeResponse, Network, WebhookEndpoint } from "../lib/types";
import { useUI } from "../lib/ui";

const PLAN_OPTIONS = [
  { value: "dev", label: "Reqst Dev" },
  { value: "enterprise", label: "Reqst Enterprise" },
] as const;

const NETWORK_OPTIONS: Array<{ value: Network; label: string }> = [
  { value: "TRON", label: "TRON" },
  { value: "SOLANA", label: "SOLANA" },
  { value: "BASE", label: "BASE" },
  { value: "ARBITRUM", label: "ARBITRUM" },
  { value: "BSC", label: "BSC" },
  { value: "EVM", label: "ETH" },
  { value: "TON", label: "TON" },
];

const DEFAULT_SCOPES = ["invoices:read", "invoices:write"];

const COPY = {
  ru: {
    title: "Разработчикам",
    body: "Инструменты интеграции: управление API-ключами и настройка вебхуков.",
    heroKicker: "Developer API",
    heroPanelTitle: "Панель управления",
    heroPanelBody: "Единое рабочее пространство для работы с документацией, ключами, лимитами и событиями.",
    portalNav: {
      docs: "Документация",
      access: "Доступ",
      security: "API-ключи",
      delivery: "Вебхуки",
      usage: "Лимиты",
    },
    authTitle: "Вход",
    authBody: "Авторизуйтесь в основном аккаунте для управления API-ключами.",
    authAction: "Войти",
    back: "На главную",
    console: "Консоль",
    upgradeTitle: "Активация API",
    upgradeBody: "Для работы с API необходимо выбрать один из доступных тарифов.",
    plan: "Тариф",
    network: "Сеть для оплаты",
    createCheckout: "Оплатить",
    usageTitle: "Использование квот",
    usageBody: "Мониторинг текущего потребления и лимитов API в реальном времени.",
    keysTitle: "API-ключи",
    keysBody: "Секретный ключ отображается только один раз при создании. Обязательно сохраните его в надежном месте.",
    hooksTitle: "Webhook-эндпоинты",
    hooksBody: "Все события подписываются заголовком X-Reqst-Signature для проверки подлинности на вашей стороне.",
    keyLabel: "Название ключа",
    keyPlaceholder: "Например: Production Backend",
    createKey: "Создать ключ",
    hookLabel: "Описание",
    hookLabelPlaceholder: "Обработчик платежей",
    hookUrl: "URL",
    hookUrlPlaceholder: "https://api.example.com/webhooks",
    createHook: "Добавить эндпоинт",
    remove: "Удалить",
    copy: "Копировать",
    copied: "Скопировано",
    latestSecret: "Ваш новый API-ключ",
    latestCheckout: "Ссылка на оплату тарифа",
    monthly: "Запросов в месяц",
    rpm: "Запросов в минуту (RPM)",
    keyCap: "Всего ключей",
    hookCap: "Активных вебхуков",
    emptyKeys: "У вас пока нет активных API-ключей.",
    emptyHooks: "Webhook-эндпоинты еще не настроены.",
    currentPlan: "Тариф",
    currentStatus: "Статус",
    accessEnabled: "Доступ разрешен",
    lockedTitle: "Портал",
    lockedBody: "Авторизуйтесь для управления ключами.",
    summaryTitle: "Текущий статус",
    summaryFallback: "API недоступно",
    plansTitle: "Тарифные планы",
    plansBody: "Тарифы Reqst Dev и Enterprise открывают доступ к API и доставке вебхуков.",
    plans: [
      {
        code: "dev",
        name: "Reqst Dev",
        badge: "Продукт",
        body: "Стандартный набор инструментов для интеграции.",
      },
      {
        code: "enterprise",
        name: "Reqst Enterprise",
        badge: "B2B",
        body: "Максимальная производительность и приоритетная очередь событий.",
      },
    ],
    billingTitle: "Биллинг",
    billingBody: "Сформируйте инвойс для активации или продления доступа к API.",
    securityTitle: "Безопасность",
    securityBody: "Управление ключами доступа к API.",
    deliveryTitle: "События",
    deliveryBody: "Настройка уведомлений о платежах через вебхуки.",
    sampleCardTitle: "Пример данных",
    sampleCardBody: "Пример JSON-ответа API.",
    docsTitle: "Reqst API",
    docsBody: "Руководство по работе с Reqst API, выпуску ключей и настройке вебхуков.",
    docsQuickstartTitle: "Быстрый старт",
    docsQuickstartBody: "Минимальный путь от создания аккаунта до первой автоматической оплаты.",
    docsReferenceTitle: "Справочник API",
    docsReferenceBody: "Описание всех публичных методов Reqst API v1, доступных по ключу.",
    docsVerificationTitle: "Проверка подписи",
    docsVerificationBody: "Reqst подписывает каждое событие через HMAC SHA-256 (timestamp.payload).",
    docsEventsTitle: "Типы событий",
    docsEventsBody: "Список событий, доступных для отправки на ваш эндпоинт.",
    docsChecklistTitle: "Чек-лист перед запуском",
    docsChecklistBody: "Краткая проверка готовности перед выходом в продакшн.",
    docsApiCardTitle: "Reqst API v1",
    docsApiCardBody: "Методы для работы с инвойсами: чтение, создание и отмена.",
    docsKeysCardTitle: "API-ключи",
    docsKeysCardBody: "Управление ключами и правами доступа доступно в секции ниже.",
    docsHooksCardTitle: "Webhooks",
    docsHooksCardBody: "Настройка эндпоинтов и секретов подписи находится в нижней части страницы.",
    docsStartColumnTitle: "Reqst API v1",
    docsStartColumnBody: "Текущая версия API: 5 основных методов для полной автоматизации платежей.",
    docsAsideColumnTitle: "Ключи и вебхуки",
    docsAsideColumnBody: "Управляйте доступом и уведомлениями прямо на этой странице — всё в одном месте.",
    docsAccessManagerTitle: "Управление доступом",
    docsAccessManagerBody: "Настройка API-ключей, вебхуков и лимитов в соответствующих разделах ниже.",
    docsAccessKeysCta: "Ключи",
    docsAccessHooksCta: "Вебхуки",
    docsAccessLimitsCta: "Лимиты",
    docsBaseUrl: "Base URL",
    docsAuthMode: "Авторизация",
    docsScopes: "Области доступа",
    docsResponseTitle: "Пример ответа",
    docsCodeLabel: "Пример запроса",
    docsOpenConsole: "Открыть консоль",
    docsSignIn: "Авторизоваться",
    docsBrowsePlans: "Посмотреть тарифы",
    docsManagerTitle: "Менеджер доступа",
    docsManagerBody: "Выпуск ключей, ротация, вебхуки и статистика доступны в едином интерфейсе.",
    workspaceTitle: "Рабочее пространство",
    workspaceBody: "Текущее состояние интеграции и настройки аккаунта.",
    sellerAccount: "Аккаунт продавца",
    baseNetwork: "Основная сеть",
    apiStatus: "Статус API",
    webhooksStatus: "Статус вебхуков",
    enabled: "Включено",
    disabled: "Выключено",
    signInRequiredTitle: "Нужна авторизация",
    signInRequiredBody: "Документация открыта для всех, но управление ключами доступно только после входа.",
    upgradeRequiredTitle: "Нужен API-тариф",
    upgradeRequiredBody: "Управление API-ключами, лимиты и вебхуки доступны на тарифах Dev и Enterprise.",
    webhooksUpgradeBody: "Вебхуки активируются вместе с планом, поддерживающим событийную доставку.",
    scopesTitle: "Права доступа",
    scopeReadTitle: "Чтение данных",
    scopeReadBody: "Доступ к методам GET /v1/me, /v1/invoices и /v1/invoices/:id.",
    scopeWriteTitle: "Управление инвойсами",
    scopeWriteBody: "Доступ к методам POST /v1/invoices и /v1/invoices/:id/cancel.",
    createdAt: "Создан",
    lastUsed: "Последнее использование",
    lastDelivery: "Последняя доставка",
    lastSuccess: "Успешно доставлено",
    signingSecret: "Секрет подписи",
    openCheckout: "Открыть оплату",
    limitsTitle: "Лимиты и квоты",
    limitsBody: "Статистика нагрузки и важные показатели перед запуском в продакшн.",
    retryPolicy: "Повторные попытки",
    monthWindow: "Месячное окно",
    monthWindowBody: "Квота обнуляется первого числа каждого месяца (UTC).",
    docsSteps: [
      "Авторизуйтесь в аккаунте продавца и активируйте тариф Dev или Enterprise.",
      "Создайте API-ключ и сохраните его в конфигурации вашего бэкенда.",
      "Создайте первый инвойс через POST /v1/invoices и сохраните его ID.",
      "Добавьте Webhook-эндпоинт и настройте проверку подписи уведомлений.",
    ],
    docsChecklist: [
      "Храните API-ключи только на сервере, никогда не передавайте их на фронтенд.",
      "Отвечайте на вебхуки статусом 2xx быстро, вынося обработку в очередь.",
      "Всегда проверяйте заголовки X-Reqst-Timestamp и X-Reqst-Signature.",
      "Следите за лимитами RPM и месячной квотой, особенно при массовых операциях.",
    ],
    docsEvents: [
      {
        name: "invoice.paid",
        body: "Инвойс полностью оплачен и подтвержден сетью.",
      },
      {
        name: "invoice.underpaid",
        body: "Сумма оплаты меньше ожидаемой. Требуется доплата или ручное вмешательство.",
      },
      {
        name: "invoice.manual_review",
        body: "Платеж требует ручного подтверждения оператором.",
      },
      {
        name: "invoice.expired",
        body: "Срок оплаты инвойса истек.",
      },
      {
        name: "subscription.activated",
        body: "Подписка успешно активирована после оплаты.",
      },
    ],
  },
  en: {
    title: "Developer Portal",
    body: "Integration toolkit: manage API keys and configure webhooks.",
    heroKicker: "Developer API",
    heroPanelTitle: "Control Surface",
    heroPanelBody: "A single workspace for docs, credentials, delivery settings, and live quota visibility.",
    portalNav: {
      docs: "Docs",
      access: "Access",
      security: "Keys",
      delivery: "Webhooks",
      usage: "Limits",
    },
    authTitle: "Sign in",
    authBody: "Use your seller account to issue keys.",
    authAction: "Login",
    back: "Home",
    console: "Console",
    upgradeTitle: "Enable API Access",
    upgradeBody: "Choose a plan to unlock programmatic access to Reqst.",
    plan: "Plan",
    network: "Network",
    createCheckout: "Upgrade",
    usageTitle: "API Usage",
    usageBody: "Real-time monitoring of your quotas and rate limits.",
    keysTitle: "API Keys",
    keysBody: "Your secret key is shown only once upon creation. Secure it immediately.",
    hooksTitle: "Webhooks",
    hooksBody: "Payloads are signed with an X-Reqst-Signature header for security.",
    keyLabel: "Key Label",
    keyPlaceholder: "Production",
    createKey: "Issue Key",
    hookLabel: "Label",
    hookLabelPlaceholder: "Payments hook",
    hookUrl: "URL",
    hookUrlPlaceholder: "https://app.example.com/webhooks",
    createHook: "Add hook",
    remove: "Remove",
    copy: "Copy",
    copied: "Copied",
    latestSecret: "Your New API Key",
    latestCheckout: "Billing Link",
    monthly: "Monthly Requests",
    rpm: "Requests Per Minute (RPM)",
    keyCap: "API Keys",
    hookCap: "Webhook Endpoints",
    emptyKeys: "No active API keys found.",
    emptyHooks: "No webhook endpoints configured.",
    currentPlan: "Plan",
    currentStatus: "Status",
    accessEnabled: "Active",
    lockedTitle: "Portal",
    lockedBody: "Sign in to manage credentials.",
    summaryTitle: "Access Status",
    summaryFallback: "API Disabled",
    plansTitle: "Plans",
    plansBody: "Reqst Dev and Enterprise unlock API keys and webhook delivery.",
    plans: [
      {
        code: "dev",
        name: "Reqst Dev",
        badge: "Product",
        body: "API keys and webhooks for teams.",
      },
      {
        code: "enterprise",
        name: "Reqst Enterprise",
        badge: "B2B",
        body: "High limits and priority delivery.",
      },
    ],
    billingTitle: "Billing",
    billingBody: "Activate your plan.",
    securityTitle: "Security",
    securityBody: "API access keys.",
    deliveryTitle: "Events",
    deliveryBody: "Webhook endpoint management.",
    sampleCardTitle: "Invoice Payload",
    sampleCardBody: "API request example.",
    docsTitle: "Reqst API",
    docsBody: "Reference for Reqst API, API key issuance, and webhook delivery setup.",
    docsQuickstartTitle: "Getting Started",
    docsQuickstartBody: "The shortest path from account access to the first automated payment.",
    docsReferenceTitle: "Endpoint Reference",
    docsReferenceBody: "All public Reqst API v1 methods available via API key.",
    docsVerificationTitle: "Signature Verification",
    docsVerificationBody: "Reqst signs webhook payloads with HMAC SHA-256 using the timestamp.payload format.",
    docsEventsTitle: "Webhook Events",
    docsEventsBody: "Event types currently available for delivery to your endpoint.",
    docsChecklistTitle: "Production Checklist",
    docsChecklistBody: "A short pre-launch checklist for real traffic.",
    docsApiCardTitle: "Reqst API v1",
    docsApiCardBody: "Five current public methods for reading, creating, and canceling invoices.",
    docsKeysCardTitle: "API Keys",
    docsKeysCardBody: "Issuance, scopes, and rotation are managed lower on this page.",
    docsHooksCardTitle: "Webhooks",
    docsHooksCardBody: "Endpoint setup, signing secret, and delivery status live in a dedicated section below.",
    docsStartColumnTitle: "Reqst API v1",
    docsStartColumnBody: "The current public API surface: 5 methods and the core invoice flow.",
    docsAsideColumnTitle: "Keys & Webhooks",
    docsAsideColumnBody: "Access management and webhook delivery are configured on this same page, without a separate back office.",
    docsAccessManagerTitle: "Access Manager",
    docsAccessManagerBody: "API keys, webhook endpoints, and quota controls are configured in the sections below.",
    docsAccessKeysCta: "Keys",
    docsAccessHooksCta: "Webhooks",
    docsAccessLimitsCta: "Limits",
    docsBaseUrl: "Base URL",
    docsAuthMode: "Authorization",
    docsScopes: "Scopes",
    docsResponseTitle: "Response Example",
    docsCodeLabel: "Request Example",
    docsOpenConsole: "Open Console",
    docsSignIn: "Sign in",
    docsBrowsePlans: "Browse Plans",
    docsManagerTitle: "Access Manager",
    docsManagerBody: "Key issuance, rotation, webhooks, and usage live together without a separate back office.",
    workspaceTitle: "Workspace",
    workspaceBody: "Live integration status and account configuration.",
    sellerAccount: "Account",
    baseNetwork: "Default Network",
    apiStatus: "API Status",
    webhooksStatus: "Webhooks Status",
    enabled: "Enabled",
    disabled: "Disabled",
    signInRequiredTitle: "Authentication required",
    signInRequiredBody: "Documentation is public, while key and webhook management unlock after signing into a seller account.",
    upgradeRequiredTitle: "API plan required",
    upgradeRequiredBody: "API key management, quotas, and webhooks are available on Reqst Dev and Reqst Enterprise.",
    webhooksUpgradeBody: "Webhooks become available with plans that include event delivery.",
    scopesTitle: "Permissions",
    scopeReadTitle: "Invoice reads",
    scopeReadBody: "GET /v1/me, GET /v1/invoices, and GET /v1/invoices/:id.",
    scopeWriteTitle: "Create and cancel",
    scopeWriteBody: "POST /v1/invoices and POST /v1/invoices/:id/cancel.",
    createdAt: "Created",
    lastUsed: "Last used",
    lastDelivery: "Last delivery",
    lastSuccess: "Last success",
    signingSecret: "Signing Secret",
    openCheckout: "Open checkout",
    limitsTitle: "Limits & Quotas",
    limitsBody: "Live account load, hard caps, and what to watch before a production rollout.",
    retryPolicy: "Webhook retries",
    monthWindow: "Monthly window",
    monthWindowBody: "Quota resets on the first day of each month in UTC.",
    docsSteps: [
      "Sign into your seller account and activate Reqst Dev or Reqst Enterprise.",
      "Issue a live API key and store the secret on your backend.",
      "Create an invoice through POST /v1/invoices and persist the id/public_id pair.",
      "Attach a webhook endpoint and verify the signature before processing the event.",
    ],
    docsChecklist: [
      "Keep live keys server-side only and never expose them to the browser.",
      "Return 2xx quickly and move heavy webhook processing into a queue.",
      "Verify X-Reqst-Timestamp and X-Reqst-Signature before parsing the JSON body.",
      "Monitor monthly cap and RPM carefully before batch operations.",
    ],
    docsEvents: [
      {
        name: "invoice.paid",
        body: "The invoice is confirmed and can be treated as a successful payment.",
      },
      {
        name: "invoice.underpaid",
        body: "Received amount is below the expected total and needs top-up or manual handling.",
      },
      {
        name: "invoice.manual_review",
        body: "The payment cannot be auto-classified and requires operator review.",
      },
      {
        name: "invoice.expired",
        body: "The invoice expired or was closed in the expired state.",
      },
      {
        name: "subscription.activated",
        body: "A subscription checkout successfully enabled a paid plan.",
      },
    ],
  },
} as const;

function formatDate(value: string | null | undefined, language: "ru" | "en") {
  if (!value) {
    return language === "ru" ? "Никогда" : "Never";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatQuota(current: number, limit: number, language: "ru" | "en") {
  if (limit <= 0) {
    return language === "ru" ? `${current} / без лимита` : `${current} / unlimited`;
  }
  return `${current} / ${limit}`;
}

function formatPlanMetric(value: number, language: "ru" | "en") {
  if (value <= 0) {
    return language === "ru" ? "Без лимита" : "Unlimited";
  }
  return String(value);
}

export function DeveloperPortalPage() {
  const { language } = useUI();
  const text = COPY[language];
  const [token] = useState(() => getStoredToken());
  const [me, setMe] = useState<MeResponse | null>(null);
  const [usage, setUsage] = useState<DeveloperUsageResponse | null>(null);
  const [apiKeys, setAPIKeys] = useState<APIKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(token));
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [latestSecret, setLatestSecret] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [billingPlan, setBillingPlan] = useState<"dev" | "enterprise">(() => {
    const selected = new URLSearchParams(window.location.search).get("plan");
    return selected === "enterprise" ? "enterprise" : "dev";
  });
  const [billingNetwork, setBillingNetwork] = useState<Network>("TRON");
  const [keyLabel, setKeyLabel] = useState("");
  const [keyScopes, setKeyScopes] = useState<string[]>(DEFAULT_SCOPES);
  const [hookForm, setHookForm] = useState({ label: "", url: "" });

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    void loadPortal(token);
  }, [token]);

  useEffect(() => {
    if (!copiedId) {
      return;
    }
    const timer = window.setTimeout(() => setCopiedId(""), 1400);
    return () => window.clearTimeout(timer);
  }, [copiedId]);

  async function loadPortal(sessionToken: string) {
    try {
      setLoading(true);
      const [meResult, usageResult, keyResult, webhookResult] = await Promise.all([
        fetchMe(sessionToken),
        fetchDeveloperUsage(sessionToken).catch(() => null),
        fetchAPIKeys(sessionToken).catch(() => ({ items: [] })),
        fetchWebhookEndpoints(sessionToken).catch(() => ({ items: [] })),
      ]);
      setMe(meResult);
      setUsage(usageResult);
      setAPIKeys(keyResult.items ?? []);
      setWebhooks(webhookResult.items ?? []);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCheckout() {
    if (!token) {
      return;
    }

    try {
      const invoice = await createBillingCheckout(token, {
        payable_network: billingNetwork,
        plan_code: billingPlan,
      });
      setCheckoutUrl(`${window.location.origin}/checkout/${invoice.public_id}`);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleCreateKey(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      return;
    }
    if (keyScopes.length === 0) {
      setError(language === "ru" ? "Выберите хотя бы один scope" : "Select at least one scope");
      return;
    }

    try {
      const result = await createAPIKey(token, { label: keyLabel.trim(), scopes: keyScopes });
      setLatestSecret(result.secret);
      setKeyLabel("");
      setKeyScopes(DEFAULT_SCOPES);
      await loadPortal(token);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDeleteKey(id: number) {
    if (!token) {
      return;
    }

    try {
      await deleteAPIKey(token, id);
      await loadPortal(token);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleCreateWebhook(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      return;
    }

    try {
      await createWebhookEndpoint(token, {
        label: hookForm.label.trim(),
        url: hookForm.url.trim(),
      });
      setHookForm({ label: "", url: "" });
      await loadPortal(token);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDeleteWebhook(id: number) {
    if (!token) {
      return;
    }

    try {
      await deleteWebhookEndpoint(token, id);
      await loadPortal(token);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleCopy(value: string, id: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function toggleScope(scope: string) {
    setKeyScopes((current) =>
      current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope],
    );
  }

  function handlePlanCardSelect(planCode: "dev" | "enterprise") {
    setBillingPlan(planCode);
    setCheckoutUrl("");
    document.getElementById("access")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const developerApiBase = useMemo(() => {
    const base = getApiBase();
    const origin = window.location.origin.replace(/\/+$/, "");
    return `${(base || origin).replace(/\/+$/, "")}/v1`;
  }, []);

  const selectedPlanCode = me?.plan.code === "enterprise" || me?.plan.code === "dev" ? me.plan.code : billingPlan;
  const monthlyRequests = usage?.usage.monthly_requests ?? 0;
  const monthlyLimit = usage?.usage.monthly_limit ?? me?.plan.monthly_cap ?? 0;
  const minuteRequests = usage?.usage.requests_this_min ?? 0;
  const minuteLimit = usage?.usage.minute_limit ?? me?.plan.rpm_limit ?? 0;
  const retryLimit = usage?.usage.webhook_retry_limit ?? me?.plan.webhook_retries ?? 0;
  const currentPlanName = me?.plan.name ?? text.summaryFallback;
  const currentPlanLabel = me?.plan.code?.toUpperCase() ?? "TRIAL";
  const canManageApi = Boolean(me?.plan.has_api);
  const canManageWebhooks = Boolean(me?.plan.has_webhooks);
  const availableApiPlans = (me?.plans ?? []).filter((plan) => plan.code === "dev" || plan.code === "enterprise");

  const scopeOptions = [
    {
      value: "invoices:read",
      title: text.scopeReadTitle,
      body: text.scopeReadBody,
    },
    {
      value: "invoices:write",
      title: text.scopeWriteTitle,
      body: text.scopeWriteBody,
    },
  ];

  const endpointDocs = language === "ru"
    ? [
        {
          method: "GET",
          path: "/v1/me",
          scope: "API key",
          title: "Проверка ключа",
          body: "Возвращает аккаунт, план, usage и scopes текущего API-ключа.",
        },
        {
          method: "GET",
          path: "/v1/invoices?page=1&page_size=20",
          scope: "invoices:read",
          title: "Список инвойсов",
          body: "Возвращает paginated-список инвойсов, созданных вашим аккаунтом.",
        },
        {
          method: "POST",
          path: "/v1/invoices",
          scope: "invoices:write",
          title: "Создать инвойс",
          body: "Создает новый checkout с title, base_amount_usd, payable_network и optional expires_in_minutes.",
        },
        {
          method: "GET",
          path: "/v1/invoices/:id",
          scope: "invoices:read",
          title: "Получить инвойс",
          body: "Возвращает полную карточку инвойса по внутреннему numeric id.",
        },
        {
          method: "POST",
          path: "/v1/invoices/:id/cancel",
          scope: "invoices:write",
          title: "Отменить инвойс",
          body: "Переводит созданный вами инвойс в статус expired.",
        },
      ]
    : [
        {
          method: "GET",
          path: "/v1/me",
          scope: "API key",
          title: "Validate key",
          body: "Returns the account, current plan, usage, and active key scopes.",
        },
        {
          method: "GET",
          path: "/v1/invoices?page=1&page_size=20",
          scope: "invoices:read",
          title: "List invoices",
          body: "Returns a paginated list of invoices created under your account.",
        },
        {
          method: "POST",
          path: "/v1/invoices",
          scope: "invoices:write",
          title: "Create invoice",
          body: "Creates a new checkout with title, base_amount_usd, payable_network, and optional expires_in_minutes.",
        },
        {
          method: "GET",
          path: "/v1/invoices/:id",
          scope: "invoices:read",
          title: "Get invoice",
          body: "Returns the full invoice payload by internal numeric id.",
        },
        {
          method: "POST",
          path: "/v1/invoices/:id/cancel",
          scope: "invoices:write",
          title: "Cancel invoice",
          body: "Transitions an invoice created by your account into the expired state.",
        },
      ];

  const sampleCurl = useMemo(() => {
    const secret = latestSecret || "rk_live_your_key";
    const network = me?.seller.default_network ?? "TRON";
    return [
      `curl -X POST ${developerApiBase}/invoices \\`,
      `  -H "Authorization: Bearer ${secret}" \\`,
      '  -H "Content-Type: application/json" \\',
      `  -d '{"title":"Product Subscription","base_amount_usd":"25.00","payable_network":"${network}","expires_in_minutes":30}'`,
    ].join("\n");
  }, [developerApiBase, latestSecret, me?.seller.default_network]);

  const sampleResponse = useMemo(
    () =>
      JSON.stringify(
        {
          id: 1842,
          public_id: "REQST-9N2QK7",
          title: "Product Subscription",
          base_amount_usd: "25.00",
          payable_amount: "25.000000",
          payable_network: me?.seller.default_network ?? "TRON",
          destination_address: "TXYZ...merchant",
          status: "awaiting_payment",
          checkout_url: `${window.location.origin}/checkout/REQST-9N2QK7`,
          payment_uri: "tron:TXYZ...merchant?amount=25.000000",
        },
        null,
        2,
      ),
    [me?.seller.default_network],
  );

  const verifyWebhookSnippet = useMemo(
    () =>
      [
        'import crypto from "node:crypto";',
        "",
        "function verifyReqstSignature(rawBody, timestamp, signature, secret) {",
        '  const signed = `${timestamp}.${rawBody}`;',
        '  const expected = "v1=" + crypto.createHmac("sha256", secret).update(signed).digest("hex");',
        "  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));",
        "}",
      ].join("\n"),
    [],
  );

  const planCards = availableApiPlans.length > 0
    ? availableApiPlans.map((plan) => ({
        code: plan.code,
        name: plan.name,
        badge: plan.code === "enterprise" ? "B2B" : "API",
        body: plan.code === "enterprise"
          ? `${formatPlanMetric(plan.requests_per_minute, language)} RPM · ${formatPlanMetric(plan.api_key_limit, language)} keys`
          : `${formatPlanMetric(plan.requests_per_minute, language)} RPM · ${formatPlanMetric(plan.api_key_limit, language)} keys`,
      }))
    : text.plans;

  function renderCopyLabel(id: string) {
    return copiedId === id ? text.copied : text.copy;
  }

  function renderAuthNotice(title: string, body: string) {
    return (
      <div className="dev-portal__locked-state">
        <div>
          <strong>{title}</strong>
          <p>{body}</p>
        </div>
        <div className="dev-portal__cta-row">
          <Link className="dev-portal__button" to="/auth">
            {text.authAction}
          </Link>
          <Link className="dev-portal__button dev-portal__button--ghost" to="/console">
            {text.docsOpenConsole}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="dev-portal">
      <div className="dev-portal__backdrop dev-portal__backdrop--grid" />
      <div className="dev-portal__backdrop dev-portal__backdrop--glow dev-portal__backdrop--left" />
      <div className="dev-portal__backdrop dev-portal__backdrop--glow dev-portal__backdrop--right" />

      <div className="dev-portal__shell">
        <header className="dev-portal__topbar">
          <Link className="dev-portal__brand" to="/">
            <strong>reqst</strong>
          </Link>
          <div className="dev-portal__topbar-actions">
            <Link className="dev-portal__button dev-portal__button--ghost" to="/">
              {text.back}
            </Link>
            <Link className="dev-portal__button" to="/console">
              {text.console}
            </Link>
          </div>
        </header>

        <section className="dev-portal__hero">
          <div className="dev-portal__hero-copy">
            <span className="dev-portal__kicker">{text.heroKicker}</span>
            <h1>{text.title}</h1>
            <p>{text.body}</p>

            <div className="dev-portal__anchor-row" aria-label="portal sections">
              <a className="dev-portal__anchor" href="#docs">{text.portalNav.docs}</a>
              <a className="dev-portal__anchor" href="#access">{text.portalNav.access}</a>
              <a className="dev-portal__anchor" href="#keys">{text.portalNav.security}</a>
              <a className="dev-portal__anchor" href="#webhooks">{text.portalNav.delivery}</a>
              <a className="dev-portal__anchor" href="#limits">{text.portalNav.usage}</a>
            </div>

            <div className="dev-portal__signal-grid">
              <article className="dev-portal__signal-card">
                <span>{text.docsBaseUrl}</span>
                <strong>{developerApiBase}</strong>
              </article>
              <article className="dev-portal__signal-card">
                <span>{text.docsAuthMode}</span>
                <strong>Bearer rk_live_...</strong>
              </article>
              <article className="dev-portal__signal-card">
                <span>{text.docsScopes}</span>
                <strong>{DEFAULT_SCOPES.join(" · ")}</strong>
              </article>
            </div>
          </div>

          <aside className="dev-portal__hero-side">
            <article className="dev-portal__panel dev-portal__panel--spotlight">
              <span className="dev-portal__kicker">{text.heroPanelTitle}</span>
              <h2>{text.workspaceTitle}</h2>
              <p>{text.heroPanelBody}</p>

              <div className="dev-portal__hero-metrics">
                <div className="dev-portal__hero-metric">
                  <span>{text.currentPlan}</span>
                  <strong>{currentPlanName}</strong>
                </div>
                <div className="dev-portal__hero-metric">
                  <span>{text.apiStatus}</span>
                  <strong>{me?.plan.has_api ? text.enabled : text.summaryFallback}</strong>
                </div>
                <div className="dev-portal__hero-metric">
                  <span>{text.webhooksStatus}</span>
                  <strong>{me?.plan.has_webhooks ? text.enabled : text.disabled}</strong>
                </div>
                <div className="dev-portal__hero-metric">
                  <span>{text.docsEventsTitle}</span>
                  <strong>{text.docsEvents.length}</strong>
                </div>
              </div>

              <div className="dev-portal__hero-actions">
                <Link className="dev-portal__button" to={token ? "/console" : "/auth"}>
                  {token ? text.docsOpenConsole : text.docsSignIn}
                </Link>
                <a className="dev-portal__button dev-portal__button--ghost" href="#docs">
                  {text.docsTitle}
                </a>
              </div>
            </article>
          </aside>
        </section>

        {error ? <div className="alert page-section-offset--compact">{error}</div> : null}
        {loading ? (
          <p className="muted page-section-offset--compact" style={{ textAlign: "center" }}>
            {language === "ru" ? "Загрузка..." : "Loading..."}
          </p>
        ) : null}

        <div className="dev-portal__layout">
          <aside className="dev-portal__sidebar">
            <article className="dev-portal__panel">
              <span className="dev-portal__kicker">{text.summaryTitle}</span>
              <h3>{text.workspaceTitle}</h3>
              <div className="dev-portal__sidebar-grid">
                <div className="dev-portal__sidebar-item">
                  <span>{text.sellerAccount}</span>
                  <strong>{me ? `@${me.seller.username}` : text.lockedTitle}</strong>
                </div>
                <div className="dev-portal__sidebar-item">
                  <span>{text.baseNetwork}</span>
                  <strong>{me?.seller.default_network ?? "TRON"}</strong>
                </div>
                <div className="dev-portal__sidebar-item">
                  <span>{text.currentPlan}</span>
                  <strong>{currentPlanLabel}</strong>
                </div>
                <div className="dev-portal__sidebar-item">
                  <span>{text.currentStatus}</span>
                  <strong>{me?.plan.has_api ? text.accessEnabled : text.summaryFallback}</strong>
                </div>
              </div>
            </article>

            <article className="dev-portal__panel">
              <span className="dev-portal__kicker">{text.docsManagerTitle}</span>
              <div className="dev-portal__sidebar-links">
                <a href="#docs">{text.docsTitle}</a>
                <a href="#access">{text.billingTitle}</a>
                <a href="#keys">{text.keysTitle}</a>
                <a href="#webhooks">{text.hooksTitle}</a>
                <a href="#limits">{text.limitsTitle}</a>
              </div>
            </article>
          </aside>

          <div className="dev-portal__content">
            <section className="dev-portal__panel" id="docs">
              <div className="dev-portal__section-head">
                <div>
                  <span className="dev-portal__kicker">{text.docsTitle}</span>
                  <h2>{text.docsTitle}</h2>
                </div>
                <div className="dev-portal__signal-grid" style={{ marginTop: "1rem" }}>
                  <article className="dev-portal__signal-card">
                    <span>{text.docsBaseUrl}</span>
                    <strong>{developerApiBase}</strong>
                  </article>
                  <article className="dev-portal__signal-card">
                    <span>{text.docsAuthMode}</span>
                    <strong>Bearer [API_KEY]</strong>
                  </article>
                </div>
              </div>

              <div className="dev-portal__docs-columns">
                <div className="dev-portal__docs-stack">
                  <article className="dev-portal__subpanel">
                    <span className="dev-portal__eyebrow">{text.docsReferenceTitle}</span>
                    <strong>{text.docsReferenceBody}</strong>
                    <div className="dev-portal__endpoint-grid">
                      {endpointDocs.map((endpoint) => (
                        <article key={`${endpoint.method}-${endpoint.path}`} className="dev-portal__endpoint-card">
                          <div className="dev-portal__endpoint-head">
                            <span className={`dev-portal__method dev-portal__method--${endpoint.method.toLowerCase()}`}>
                              {endpoint.method}
                            </span>
                            <code>{endpoint.path}</code>
                          </div>
                          <strong>{endpoint.title}</strong>
                          <p>{endpoint.body}</p>
                        </article>
                      ))}
                    </div>
                  </article>

                  <article className="dev-portal__subpanel dev-portal__subpanel--code">
                    <span className="dev-portal__eyebrow">{text.docsCodeLabel}</span>
                    <strong>POST /v1/invoices</strong>
                    <div className="dev-portal__code-wrap">
                      <pre className="dev-portal__code-block"><code>{sampleCurl}</code></pre>
                      <button type="button" className="dev-portal__small-button" onClick={() => void handleCopy(sampleCurl, "curl")}>
                        {renderCopyLabel("curl")}
                      </button>
                    </div>
                  </article>
                </div>

                <div className="dev-portal__docs-stack dev-portal__docs-stack--aside">
                  <article className="dev-portal__subpanel dev-portal__subpanel--code">
                    <span className="dev-portal__eyebrow">{text.docsVerificationTitle}</span>
                    <strong>HMAC SHA-256</strong>
                    <div className="dev-portal__code-wrap">
                      <pre className="dev-portal__code-block"><code>{verifyWebhookSnippet}</code></pre>
                      <button
                        type="button"
                        className="dev-portal__small-button"
                        onClick={() => void handleCopy(verifyWebhookSnippet, "verify")}
                      >
                        {renderCopyLabel("verify")}
                      </button>
                    </div>
                  </article>

                  <article className="dev-portal__subpanel">
                    <span className="dev-portal__eyebrow">{text.docsEventsTitle}</span>
                    <strong>{text.docsEventsBody}</strong>
                    <div className="dev-portal__event-list">
                      {text.docsEvents.map((eventItem) => (
                        <article key={eventItem.name} className="dev-portal__event-item">
                          <code>{eventItem.name}</code>
                          <p>{eventItem.body}</p>
                        </article>
                      ))}
                    </div>
                  </article>
                </div>
              </div>
            </section>

            <section className="dev-portal__panel" id="access">
              <div className="dev-portal__section-head">
                <div>
                  <span className="dev-portal__kicker">{text.summaryTitle}</span>
                  <h2>{text.billingTitle}</h2>
                </div>
                <p>{text.workspaceBody}</p>
              </div>

              {!token || !me ? (
                renderAuthNotice(text.signInRequiredTitle, text.signInRequiredBody)
              ) : (
                <>
                  <div className="dev-portal__metric-grid">
                    <article className="dev-portal__metric-card">
                      <span>{text.currentPlan}</span>
                      <strong>{me.plan.name}</strong>
                      <p>{text.upgradeBody}</p>
                    </article>
                    <article className="dev-portal__metric-card">
                      <span>{text.currentStatus}</span>
                      <strong>{me.plan.has_api ? text.accessEnabled : text.summaryFallback}</strong>
                      <p>{text.usageBody}</p>
                    </article>
                    <article className="dev-portal__metric-card">
                      <span>{text.monthly}</span>
                      <strong>{formatQuota(monthlyRequests, monthlyLimit, language)}</strong>
                      <p>{text.monthWindowBody}</p>
                    </article>
                    <article className="dev-portal__metric-card">
                      <span>{text.retryPolicy}</span>
                      <strong>{formatPlanMetric(retryLimit, language)}</strong>
                      <p>{text.hooksBody}</p>
                    </article>
                  </div>

                  {!me.plan.has_api ? (
                    <div className="dev-portal__billing-grid">
                      <article className="dev-portal__subpanel">
                        <span className="dev-portal__eyebrow">{text.upgradeTitle}</span>
                        <strong>{text.billingBody}</strong>
                        <div className="dev-portal__form-grid">
                          <label>
                            {text.plan}
                            <CustomSelect
                              value={billingPlan}
                              options={PLAN_OPTIONS.map((option) => ({ ...option }))}
                              ariaLabel={text.plan}
                              onChange={(value) => setBillingPlan(value as "dev" | "enterprise")}
                            />
                          </label>
                          <label>
                            {text.network}
                            <CustomSelect
                              value={billingNetwork}
                              options={NETWORK_OPTIONS}
                              ariaLabel={text.network}
                              onChange={(value) => setBillingNetwork(value)}
                            />
                          </label>
                        </div>
                        <button type="button" className="dev-portal__button dev-portal__button--full" onClick={() => void handleCreateCheckout()}>
                          {text.createCheckout}
                        </button>
                      </article>

                      <article className="dev-portal__subpanel">
                        <span className="dev-portal__eyebrow">{text.latestCheckout}</span>
                        <strong>{text.upgradeRequiredTitle}</strong>
                        <p className="page-copy-reset">{text.upgradeRequiredBody}</p>
                        {checkoutUrl ? (
                          <div className="dev-portal__inline-card">
                            <code>{checkoutUrl}</code>
                            <div className="dev-portal__inline-actions">
                              <button type="button" className="dev-portal__small-button" onClick={() => void handleCopy(checkoutUrl, "checkout")}>
                                {renderCopyLabel("checkout")}
                              </button>
                              <a className="dev-portal__small-link" href={checkoutUrl} target="_blank" rel="noreferrer">
                                {text.openCheckout}
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="dev-portal__inline-card">
                            <span>{text.upgradeBody}</span>
                          </div>
                        )}
                      </article>
                    </div>
                  ) : null}
                </>
              )}
            </section>

            <section className="dev-portal__panel" id="keys">
              <div className="dev-portal__section-head">
                <div>
                  <span className="dev-portal__kicker">{text.securityTitle}</span>
                  <h2>{text.keysTitle}</h2>
                </div>
                <p>{text.keysBody}</p>
              </div>

              {!token || !me ? (
                renderAuthNotice(text.signInRequiredTitle, text.signInRequiredBody)
              ) : !canManageApi ? (
                <div className="dev-portal__locked-state">
                  <div>
                    <strong>{text.upgradeRequiredTitle}</strong>
                    <p>{text.upgradeRequiredBody}</p>
                  </div>
                  <a className="dev-portal__button" href="#access">
                    {text.docsBrowsePlans}
                  </a>
                </div>
              ) : (
                <>
                  <form onSubmit={handleCreateKey} className="dev-portal__stack">
                    <div className="dev-portal__form-grid">
                      <label>
                        {text.keyLabel}
                        <input
                          value={keyLabel}
                          placeholder={text.keyPlaceholder}
                          onChange={(event) => setKeyLabel(event.target.value)}
                        />
                      </label>
                      <button type="submit" className="dev-portal__button dev-portal__button--full">
                        {text.createKey}
                      </button>
                    </div>

                    <div className="dev-portal__scope-grid">
                      {scopeOptions.map((scope) => (
                        <label key={scope.value} className={`dev-portal__scope-card ${keyScopes.includes(scope.value) ? "is-active" : ""}`}>
                          <input
                            type="checkbox"
                            checked={keyScopes.includes(scope.value)}
                            onChange={() => toggleScope(scope.value)}
                          />
                          <div>
                            <strong>{scope.title}</strong>
                            <p>{scope.body}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </form>

                  {latestSecret ? (
                    <div className="dev-portal__secret-card">
                      <div>
                        <span>{text.latestSecret}</span>
                        <code>{latestSecret}</code>
                      </div>
                      <button type="button" className="dev-portal__small-button" onClick={() => void handleCopy(latestSecret, "secret")}>
                        {renderCopyLabel("secret")}
                      </button>
                    </div>
                  ) : null}

                  <div className="dev-portal__resource-list">
                    {apiKeys.map((key) => (
                      <article key={key.id} className="dev-portal__resource-card">
                        <div className="dev-portal__resource-head">
                          <div>
                            <strong>{key.label}</strong>
                            <code>{key.prefix}***</code>
                          </div>
                          <button
                            type="button"
                            className="dev-portal__small-button dev-portal__small-button--danger"
                            onClick={() => void handleDeleteKey(key.id)}
                          >
                            {text.remove}
                          </button>
                        </div>
                        <div className="dev-portal__pill-row">
                          {key.scopes.map((scope) => (
                            <span key={scope} className="dev-portal__pill">{scope}</span>
                          ))}
                        </div>
                        <div className="dev-portal__resource-meta">
                          <span>{text.createdAt}: {formatDate(key.created_at, language)}</span>
                          <span>{text.lastUsed}: {formatDate(key.last_used_at, language)}</span>
                        </div>
                      </article>
                    ))}
                    {!apiKeys.length ? <p className="muted">{text.emptyKeys}</p> : null}
                  </div>
                </>
              )}
            </section>

            <section className="dev-portal__panel" id="webhooks">
              <div className="dev-portal__section-head">
                <div>
                  <span className="dev-portal__kicker">{text.deliveryTitle}</span>
                  <h2>{text.hooksTitle}</h2>
                </div>
                <p>{text.hooksBody}</p>
              </div>

              {!token || !me ? (
                renderAuthNotice(text.signInRequiredTitle, text.signInRequiredBody)
              ) : !canManageWebhooks ? (
                <div className="dev-portal__locked-state">
                  <div>
                    <strong>{text.upgradeRequiredTitle}</strong>
                    <p>{text.webhooksUpgradeBody}</p>
                  </div>
                  <a className="dev-portal__button" href="#access">
                    {text.docsBrowsePlans}
                  </a>
                </div>
              ) : (
                <>
                  <form onSubmit={handleCreateWebhook} className="dev-portal__form-grid dev-portal__form-grid--three">
                    <label>
                      {text.hookLabel}
                      <input
                        value={hookForm.label}
                        placeholder={text.hookLabelPlaceholder}
                        onChange={(event) => setHookForm((current) => ({ ...current, label: event.target.value }))}
                      />
                    </label>
                    <label>
                      {text.hookUrl}
                      <input
                        value={hookForm.url}
                        placeholder={text.hookUrlPlaceholder}
                        onChange={(event) => setHookForm((current) => ({ ...current, url: event.target.value }))}
                      />
                    </label>
                    <button type="submit" className="dev-portal__button dev-portal__button--full">
                      {text.createHook}
                    </button>
                  </form>

                  <div className="dev-portal__resource-list">
                    {webhooks.map((hook) => (
                      <article key={hook.id} className="dev-portal__resource-card">
                        <div className="dev-portal__resource-head">
                          <div>
                            <strong>{hook.label}</strong>
                            <code>{hook.url}</code>
                          </div>
                          <button
                            type="button"
                            className="dev-portal__small-button dev-portal__small-button--danger"
                            onClick={() => void handleDeleteWebhook(hook.id)}
                          >
                            {text.remove}
                          </button>
                        </div>
                        <div className="dev-portal__inline-card">
                          <span>{text.signingSecret}</span>
                          <div className="dev-portal__inline-actions">
                            <code>{hook.secret}</code>
                            <button type="button" className="dev-portal__small-button" onClick={() => void handleCopy(hook.secret, `hook-${hook.id}`)}>
                              {renderCopyLabel(`hook-${hook.id}`)}
                            </button>
                          </div>
                        </div>
                        <div className="dev-portal__resource-meta">
                          <span>{text.createdAt}: {formatDate(hook.created_at, language)}</span>
                          <span>{text.lastDelivery}: {formatDate(hook.last_delivery_at, language)}</span>
                          <span>{text.lastSuccess}: {formatDate(hook.last_success_at, language)}</span>
                        </div>
                      </article>
                    ))}
                    {!webhooks.length ? <p className="muted">{text.emptyHooks}</p> : null}
                  </div>
                </>
              )}
            </section>

            <section className="dev-portal__panel" id="limits">
              <div className="dev-portal__section-head">
                <div>
                  <span className="dev-portal__kicker">{text.usageTitle}</span>
                  <h2>{text.limitsTitle}</h2>
                </div>
                <p>{text.limitsBody}</p>
              </div>

              {!token || !me ? (
                renderAuthNotice(text.signInRequiredTitle, text.signInRequiredBody)
              ) : !canManageApi ? (
                <div className="dev-portal__locked-state">
                  <div>
                    <strong>{text.upgradeRequiredTitle}</strong>
                    <p>{text.upgradeRequiredBody}</p>
                  </div>
                  <a className="dev-portal__button" href="#access">
                    {text.docsBrowsePlans}
                  </a>
                </div>
              ) : (
                <>
                  <div className="dev-portal__metric-grid">
                    <article className="dev-portal__metric-card">
                      <span>{text.monthly}</span>
                      <strong>{formatQuota(monthlyRequests, monthlyLimit, language)}</strong>
                      <p>{text.monthWindowBody}</p>
                    </article>
                    <article className="dev-portal__metric-card">
                      <span>{text.rpm}</span>
                      <strong>{formatQuota(minuteRequests, minuteLimit, language)}</strong>
                      <p>{text.usageBody}</p>
                    </article>
                    <article className="dev-portal__metric-card">
                      <span>{text.keyCap}</span>
                      <strong>{formatQuota(apiKeys.length, me.plan.api_key_limit, language)}</strong>
                      <p>{text.securityBody}</p>
                    </article>
                    <article className="dev-portal__metric-card">
                      <span>{text.hookCap}</span>
                      <strong>{webhooks.length}</strong>
                      <p>{text.deliveryBody}</p>
                    </article>
                  </div>

                  <div className="dev-portal__docs-grid">
                    <article className="dev-portal__subpanel">
                      <span className="dev-portal__eyebrow">{text.monthWindow}</span>
                      <strong>{text.monthWindowBody}</strong>
                      <p className="page-copy-reset">{text.limitsBody}</p>
                    </article>
                    <article className="dev-portal__subpanel">
                      <span className="dev-portal__eyebrow">{text.retryPolicy}</span>
                      <strong>{formatPlanMetric(retryLimit, language)}</strong>
                      <p className="page-copy-reset">{text.hooksBody}</p>
                    </article>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
