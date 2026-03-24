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

const COPY = {
  ru: {
    title: "Центр управления интеграцией",
    body: "Единое рабочее пространство для управления API-ключами, точками доставки уведомлений и мониторинга текущей нагрузки.",
    authTitle: "Требуется авторизация",
    authBody: "Используйте основной аккаунт продавца для выпуска ключей и активации планов интеграции.",
    authAction: "Войти",
    back: "Главная",
    console: "Панель управления",
    upgradeTitle: "Активация доступа к API",
    upgradeBody: "Интеграционный доступ не активен. Выберите и оплатите подходящий план для автоматического открытия лимитов.",
    plan: "План",
    network: "Сеть оплаты",
    createCheckout: "Сформировать инвойс",
    usageTitle: "Нагрузка и квоты",
    usageBody: "Текущее состояние лимитов, количество активных подключений и минутная нагрузка.",
    keysTitle: "API Ключи",
    keysBody: "Секретный ключ отображается только один раз при выпуске. Храните его в безопасном месте.",
    hooksTitle: "Webhook-эндпоинты",
    hooksBody: "Reqst подписывает каждое событие заголовком X-Reqst-Signature для верификации источника.",
    keyLabel: "Название ключа",
    keyPlaceholder: "Production Backend",
    createKey: "Создать ключ",
    hookLabel: "Описание эндпоинта",
    hookLabelPlaceholder: "Webhooks Handler",
    hookUrl: "URL эндпоинта",
    hookUrlPlaceholder: "https://api.example.com/webhooks/reqst",
    createHook: "Добавить эндпоинт",
    remove: "Удалить",
    copy: "Копировать",
    latestSecret: "Новый API-ключ",
    latestCheckout: "Инвойс на оплату плана",
    sampleTitle: "Пример интеграции",
    sampleBody: "Базовый POST-запрос для создания инвойса через API.",
    monthly: "Запросов в месяц",
    rpm: "Нагрузка в минуту (RPM)",
    keyCap: "Активные ключи",
    hookCap: "Эндпоинты",
    emptyKeys: "Активные API-ключи отсутствуют.",
    emptyHooks: "Эндпоинты не настроены.",
    heroCards: [
      {
        title: "Консолидированный интерфейс",
        body: "Управление биллингом, ключами и точками доставки уведомлений в рамках одного рабочего пространства.",
      },
      {
        title: "Self-serve активация",
        body: "План активируется мгновенно после подтверждения оплаты. Без участия sales-отдела и ожидания.",
      },
      {
        title: "Техническая прозрачность",
        body: "Полная видимость текущего потребления ресурсов и лимитов для каждого окружения.",
      },
    ],
    railTitle: "Функциональные возможности",
    currentPlan: "Текущий план",
    currentStatus: "Статус доступа",
    accessEnabled: "Доступ открыт",
    rails: [
      "Активация Dev или Enterprise планов через прямой платеж.",
      "Выпуск изолированных ключей для различных сервисов.",
      "Настройка Webhook-эндпоинтов для событий оплаты.",
      "Мониторинг квот и нагрузки в реальном времени.",
    ],
    lockedTitle: "Структура портала",
    lockedBody: "Авторизация открывает доступ к инструментам управления ключами, доставкой событий и лимитами.",
    summaryTitle: "Состояние интеграции",
    summaryFallback: "Доступ не активирован",
  },
  en: {
    title: "Reqst Integration Portal",
    body: "This page combines plan activation, API keys, delivery endpoints, and usage visibility in one working surface.",
    authTitle: "Sign in to access the integration portal",
    authBody: "Use the same seller account to issue keys, connect delivery endpoints, and buy Dev or Enterprise without a separate sales flow.",
    authAction: "Sign in to Reqst",
    back: "Home",
    console: "Seller Console",
    upgradeTitle: "Enable Dev or Enterprise",
    upgradeBody: "This account does not have integration access yet. Buy a plan through a normal Reqst billing link and access will unlock automatically after payment.",
    plan: "Plan",
    network: "Payment network",
    createCheckout: "Create billing link",
    usageTitle: "Usage and limits",
    usageBody: "Current quotas, minute load, and active integrations.",
    keysTitle: "Access keys",
    keysBody: "A full secret is shown only once after creation.",
    hooksTitle: "Delivery endpoints",
    hooksBody: "Reqst signs webhook deliveries with the X-Reqst-Signature header.",
    keyLabel: "Key label",
    keyPlaceholder: "Production backend",
    createKey: "Create API key",
    hookLabel: "Endpoint label",
    hookLabelPlaceholder: "Payments webhook",
    hookUrl: "Webhook URL",
    hookUrlPlaceholder: "https://app.example.com/webhooks/reqst",
    createHook: "Add webhook",
    remove: "Remove",
    copy: "Copy",
    latestSecret: "Newest API key",
    latestCheckout: "Latest billing checkout",
    sampleTitle: "Request sample",
    sampleBody: "Create an invoice through the Reqst Dev API.",
    monthly: "Monthly usage",
    rpm: "Current minute usage",
    keyCap: "Active keys",
    hookCap: "Webhook endpoints",
    emptyKeys: "No active API keys yet.",
    emptyHooks: "No webhook endpoints yet.",
    heroCards: [
      {
        title: "One operating surface",
        body: "Billing activation, key issuance, quotas, and delivery endpoints live in one place.",
      },
      {
        title: "Self-serve plan activation",
        body: "Buy the plan through a normal Reqst payment flow and unlock access automatically after confirmation.",
      },
      {
        title: "Clear operational visibility",
        body: "Track current usage and split credentials across services without guessing where the limit is.",
      },
    ],
    railTitle: "What you can do here",
    currentPlan: "Plan",
    currentStatus: "Status",
    accessEnabled: "Access enabled",
    rails: [
      "Activate Dev or Enterprise through a normal payment flow.",
      "Issue separate keys for services and environments.",
      "Connect delivery endpoints for payment events.",
      "Watch current load and quota usage in one panel.",
    ],
    lockedTitle: "What the portal covers",
    lockedBody: "Sign-in comes first, but the structure is straightforward: billing, credentials, delivery endpoints, and usage state.",
    summaryTitle: "Portal state",
    summaryFallback: "Integration access is not active yet",
  },
} as const;

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
  const [billingPlan, setBillingPlan] = useState<"dev" | "enterprise">(() => {
    const selected = new URLSearchParams(window.location.search).get("plan");
    return selected === "enterprise" ? "enterprise" : "dev";
  });
  const [billingNetwork, setBillingNetwork] = useState<Network>("TRON");
  const [keyLabel, setKeyLabel] = useState("");
  const [hookForm, setHookForm] = useState({ label: "", url: "" });

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    void loadPortal(token);
  }, [token]);

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
    try {
      const result = await createAPIKey(token, { label: keyLabel.trim() });
      setLatestSecret(result.secret);
      setKeyLabel("");
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

  const sampleCurl = useMemo(() => {
    const secret = latestSecret || "rk_live_your_key";
    return [
      "curl -X POST https://api.reqst.xyz/v1/invoices \\",
      `  -H "Authorization: Bearer ${secret}" \\`,
      '  -H "Content-Type: application/json" \\',
      '  -d \'{"title":"Product Subscription","base_amount_usd":"25.00","payable_network":"TRON"}\'',
    ].join("\n");
  }, [latestSecret]);

  return (
    <main className="shell checkout-shell checkout-shell--wide">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar topbar--checkout">
        <Link className="topbar-brand topbar-brand--minimal" to="/">
          <strong>reqst</strong>
        </Link>
        <div className="topbar-actions">
          <Link className="ghost-button compact-button" to="/">
            {text.back}
          </Link>
          <Link className="lend-secondary" to="/console">
            {text.console}
          </Link>
        </div>
      </header>

      <section className="developer-portal__hero page-section-offset">
        <div className="developer-portal__hero-copy">
          <span className="eyebrow">Integration Command Center</span>
          <h1>{text.title}</h1>
          <p className="hero-copy">{text.body}</p>

          <div className="developer-portal__rail developer-portal__rail--spaced">
            <span className="receipt-brandline">{text.railTitle}</span>
            <div className="developer-portal__rail-list developer-portal__rail-list--spaced">
              {text.rails.map((item) => (
                <div key={item} className="detail-row developer-portal__rail-row">
                  <div className="developer-portal__rail-item-copy">
                    <span />
                    <p className="page-copy-reset">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="developer-portal__hero-stack">
          {text.heroCards.map((card) => (
            <article key={card.title} className="console-link-card">
              <span>Operational Layer</span>
              <strong>{card.title}</strong>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      {error ? <div className="alert page-section-offset--compact">{error}</div> : null}
      {loading ? <p className="muted page-section-offset--compact">{language === "ru" ? "Загрузка..." : "Loading..."}</p> : null}

      {!token || !me ? (
        <div className="developer-portal__locked page-section-offset">
          <section className="checkout-card checkout-card--lux">
            <div className="completion-paper-topline">
              <span className="receipt-brandline">Access Required</span>
              <span className="completion-ticket-no">Locked</span>
            </div>
            <div className="developer-portal__locked-copy">
              <h2>{text.authTitle}</h2>
              <p className="hero-copy">{text.authBody}</p>
              <Link className="lend-primary lend-primary--large developer-portal__cta" to="/auth">
                {text.authAction}
              </Link>
            </div>
          </section>

          <section className="payment-sheet payment-sheet--receipt developer-portal__locked-sheet">
            <div className="payment-sheet-header">
              <span className="payment-sheet-kicker">{text.lockedTitle}</span>
            </div>
            <div className="payment-essentials">
              <div className="payment-field">
                <div>
                  <label>Portal Structure</label>
                  <p className="page-muted-copy">{text.lockedBody}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="console-grid page-section-offset">
          <section className="console-stack">
            <article className="checkout-card checkout-card--lux developer-portal__card">
              <div className="completion-paper-topline">
                <span className="receipt-brandline">{text.summaryTitle}</span>
                <span className="completion-ticket-no">{me.plan.code.toUpperCase()}</span>
              </div>
              <div className="console-summary-strip console-summary-strip--two developer-portal__summary-strip">
                <div className="metric-card">
                  <span>{text.currentPlan}</span>
                  <strong>{me.plan.code.toUpperCase()}</strong>
                </div>
                <div className="metric-card">
                  <span>{text.currentStatus}</span>
                  <strong style={{ color: me.plan.has_api ? "var(--ok)" : "var(--warn)" }}>
                    {me.plan.has_api ? text.accessEnabled : text.summaryFallback}
                  </strong>
                </div>
              </div>
            </article>

            {!me.plan.has_api ? (
              <article className="checkout-card checkout-card--lux developer-portal__card">
                <div className="completion-paper-topline">
                  <span className="receipt-brandline">Billing</span>
                  <span className="completion-ticket-no">Upgrade</span>
                </div>
                <h2 className="developer-portal__section-title">{text.upgradeTitle}</h2>
                <p className="hero-copy">{text.upgradeBody}</p>
                <div className="form-grid page-section-offset--compact">
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
                <button type="button" className="lend-primary lend-primary--large developer-portal__cta page-section-offset--compact" onClick={() => void handleCreateCheckout()}>
                  {text.createCheckout}
                </button>
                {checkoutUrl ? (
                  <div className="payload-callout page-section-offset--tight">
                    <span>{text.latestCheckout}</span>
                    <div className="developer-portal__inline-copy">
                      <code className="developer-portal__inline-code developer-portal__inline-code--small">{checkoutUrl}</code>
                      <button type="button" className="ghost-button compact-button" onClick={() => navigator.clipboard.writeText(checkoutUrl)}>
                        {text.copy}
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            ) : (
              <>
                <article className="checkout-card checkout-card--lux developer-portal__card">
                  <div className="completion-paper-topline">
                    <span className="receipt-brandline">Usage Quotas</span>
                    <span className="completion-ticket-no">Live</span>
                  </div>
                  <div className="console-pulse-grid console-pulse-grid--two developer-portal__pulse-grid">
                    <div className="console-pulse-card">
                      <span>{text.monthly}</span>
                      <strong>{usage?.usage.monthly_requests ?? 0} / {usage?.usage.monthly_limit ?? me.plan.monthly_cap}</strong>
                    </div>
                    <div className="console-pulse-card">
                      <span>{text.rpm}</span>
                      <strong>{usage?.usage.requests_this_min ?? 0} / {usage?.usage.minute_limit ?? me.plan.rpm_limit}</strong>
                    </div>
                    <div className="console-pulse-card">
                      <span>{text.keyCap}</span>
                      <strong>{apiKeys.length} / {me.plan.api_key_limit}</strong>
                    </div>
                    <div className="console-pulse-card">
                      <span>{text.hookCap}</span>
                      <strong>{webhooks.length}</strong>
                    </div>
                  </div>
                </article>

                <article className="checkout-card checkout-card--lux developer-portal__card">
                  <div className="completion-paper-topline">
                    <span className="receipt-brandline">Security</span>
                    <span className="completion-ticket-no">{text.keysTitle}</span>
                  </div>
                  <form onSubmit={handleCreateKey} className="form-grid page-section-offset--compact">
                    <label>
                      {text.keyLabel}
                      <input value={keyLabel} placeholder={text.keyPlaceholder} onChange={(event) => setKeyLabel(event.target.value)} />
                    </label>
                    <button type="submit" className="lend-primary">{text.createKey}</button>
                  </form>
                  {latestSecret ? (
                    <div className="payload-callout page-section-offset--tight">
                      <span>{text.latestSecret}</span>
                      <div className="developer-portal__inline-copy">
                        <code className="developer-portal__inline-code">{latestSecret}</code>
                        <button type="button" className="ghost-button compact-button" onClick={() => navigator.clipboard.writeText(latestSecret)}>
                          {text.copy}
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="stack-list page-section-offset--compact">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="payment-field">
                        <div>
                          <label>{key.label}</label>
                          <code>{key.prefix}***</code>
                          <small>{key.scopes.join(", ")}</small>
                        </div>
                        <button type="button" className="ghost-button compact-button" onClick={() => void handleDeleteKey(key.id)}>
                          {text.remove}
                        </button>
                      </div>
                    ))}
                    {!apiKeys.length ? <p className="muted">{text.emptyKeys}</p> : null}
                  </div>
                </article>
              </>
            )}
          </section>

          <section className="console-stack">
            {me.plan.has_webhooks ? (
              <article className="checkout-card checkout-card--lux" style={{ padding: "1.5rem" }}>
                <div className="completion-paper-topline">
                  <span className="receipt-brandline">Events</span>
                  <span className="completion-ticket-no">{text.hooksTitle}</span>
                </div>
                <form onSubmit={handleCreateWebhook} className="form-grid" style={{ marginTop: "1.5rem" }}>
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
                  <button type="submit" className="lend-primary">{text.createHook}</button>
                </form>
                <div className="stack-list" style={{ marginTop: "1.5rem" }}>
                  {webhooks.map((hook) => (
                    <div key={hook.id} className="payment-field" style={{ gridTemplateColumns: "1fr" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ minWidth: 0 }}>
                          <label>{hook.label}</label>
                          <code style={{ fontSize: "0.85rem" }}>{hook.url}</code>
                        </div>
                        <button type="button" className="ghost-button compact-button" onClick={() => void handleDeleteWebhook(hook.id)}>
                          {text.remove}
                        </button>
                      </div>
                      <div className="payload-callout" style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem" }}>
                        <span>Signing Secret</span>
                        <code style={{ fontSize: "0.75rem" }}>{hook.secret}</code>
                      </div>
                    </div>
                  ))}
                  {!webhooks.length ? <p className="muted">{text.emptyHooks}</p> : null}
                </div>
              </article>
            ) : null}

            <article className="checkout-card checkout-card--lux" style={{ padding: "1.5rem" }}>
              <div className="completion-paper-topline">
                <span className="receipt-brandline">Implementation</span>
                <span className="completion-ticket-no">SDK</span>
              </div>
              <h2 style={{ marginTop: "1.5rem" }}>{text.sampleTitle}</h2>
              <p className="hero-copy" style={{ marginBottom: "1rem" }}>{text.sampleBody}</p>
              <pre className="completion-ledger" style={{ background: "var(--paper-strong)", padding: "1rem", borderRadius: "18px", overflowX: "auto", display: "block" }}>
                <code style={{ fontSize: "0.85rem", whiteSpace: "pre" }}>{sampleCurl}</code>
              </pre>
            </article>
          </section>
        </div>
      )}
    </main>
  );
}
