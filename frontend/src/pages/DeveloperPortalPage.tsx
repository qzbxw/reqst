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
    title: "Интеграция",
    body: "Управление API-ключами и Webhooks.",
    portalNav: {
      access: "Доступ",
      security: "Ключи",
      delivery: "Вебхуки",
      usage: "Лимиты",
    },
    authTitle: "Вход",
    authBody: "Используйте основной аккаунт для выпуска ключей.",
    authAction: "Войти",
    back: "Главная",
    console: "Консоль",
    upgradeTitle: "Активация API",
    upgradeBody: "Выберите план для открытия лимитов.",
    plan: "План",
    network: "Сеть оплаты",
    createCheckout: "Оплатить",
    usageTitle: "Лимиты",
    usageBody: "Текущее состояние квот.",
    keysTitle: "API Ключи",
    keysBody: "Секрет отображается только один раз.",
    hooksTitle: "Webhooks",
    hooksBody: "Reqst подписывает события заголовком X-Reqst-Signature.",
    keyLabel: "Название",
    keyPlaceholder: "Backend",
    createKey: "Создать ключ",
    hookLabel: "Название",
    hookLabelPlaceholder: "Webhooks Handler",
    hookUrl: "URL",
    hookUrlPlaceholder: "https://api.example.com/webhooks",
    createHook: "Добавить",
    remove: "Удалить",
    copy: "Копировать",
    latestSecret: "Новый ключ",
    latestCheckout: "Инвойс за план",
    sampleTitle: "Пример запроса",
    sampleBody: "Создание инвойса через API.",
    monthly: "Месяц",
    rpm: "RPM",
    keyCap: "Ключи",
    hookCap: "Эндпоинты",
    emptyKeys: "Ключи отсутствуют.",
    emptyHooks: "Webhooks не настроены.",
    heroCards: [],
    railTitle: "Возможности",
    currentPlan: "План",
    currentStatus: "Статус",
    accessEnabled: "Доступ открыт",
    rails: [
      "Активация планов через платеж.",
      "Выпуск API-ключей.",
      "Настройка Webhooks.",
      "Мониторинг квот.",
    ],
    lockedTitle: "Портал",
    lockedBody: "Авторизуйтесь для управления ключами.",
    summaryTitle: "Состояние",
    summaryFallback: "Не активен",
    plansTitle: "Планы",
    plansBody: "Выберите подходящий уровень доступа.",
    plans: [
      {
        name: "Reqst Dev",
        badge: "Продукт",
        body: "API-ключи и Webhooks для команд.",
      },
      {
        name: "Reqst Enterprise",
        badge: "B2B",
        body: "Высокие лимиты и приоритетная доставка.",
      },
    ],
    billingTitle: "Биллинг",
    billingBody: "Создание инвойса на оплату.",
    securityTitle: "Безопасность",
    securityBody: "Ключи доступа к API.",
    deliveryTitle: "Доставка событий",
    deliveryBody: "Настройка Webhook-эндпоинтов.",
    sampleCardTitle: "Quick Start",
    sampleCardBody: "Пример POST-запроса.",
  },
  en: {
    title: "Integration",
    body: "Manage API keys and Webhooks.",
    portalNav: {
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
    upgradeTitle: "Enable API",
    upgradeBody: "Pick a plan to unlock limits.",
    plan: "Plan",
    network: "Network",
    createCheckout: "Upgrade",
    usageTitle: "Limits",
    usageBody: "Current quotas and load.",
    keysTitle: "API Keys",
    keysBody: "Secret is shown once.",
    hooksTitle: "Webhooks",
    hooksBody: "Deliveries are signed with X-Reqst-Signature.",
    keyLabel: "Label",
    keyPlaceholder: "Production",
    createKey: "Create key",
    hookLabel: "Label",
    hookLabelPlaceholder: "Payments hook",
    hookUrl: "URL",
    hookUrlPlaceholder: "https://app.example.com/webhooks",
    createHook: "Add hook",
    remove: "Remove",
    copy: "Copy",
    latestSecret: "New key",
    latestCheckout: "Billing link",
    sampleTitle: "Request sample",
    sampleBody: "Create an invoice via API.",
    monthly: "Monthly",
    rpm: "RPM",
    keyCap: "Keys",
    hookCap: "Endpoints",
    emptyKeys: "No active keys.",
    emptyHooks: "No webhooks.",
    heroCards: [],
    railTitle: "Features",
    currentPlan: "Plan",
    currentStatus: "Status",
    accessEnabled: "Active",
    rails: [
      "Self-serve plan activation.",
      "API key issuance.",
      "Webhook delivery.",
      "Real-time usage tracking.",
    ],
    lockedTitle: "Portal",
    lockedBody: "Sign in to manage credentials.",
    summaryTitle: "State",
    summaryFallback: "Inactive",
    plansTitle: "Plans",
    plansBody: "Select your integration layer.",
    plans: [
      {
        name: "Reqst Dev",
        badge: "Product",
        body: "API keys and webhooks for teams.",
      },
      {
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
    sampleCardTitle: "Quick Start",
    sampleCardBody: "API request example.",
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
      "curl -X POST https://api.reqst.xyz/v1/invoices \",
      `  -H "Authorization: Bearer ${secret}" \`,
      '  -H "Content-Type: application/json" \',
      '  -d \'{"title":"Product Subscription","base_amount_usd":"25.00","payable_network":"TRON"}\'',
    ].join("\n");
  }, [latestSecret]);
  const selectedPlanMeta = text.plans.find((plan) => plan.name.toLowerCase().includes(billingPlan));

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
          <span className="eyebrow">Integration</span>
          <h1>{text.title}</h1>
          <p className="hero-copy">{text.body}</p>

          <div className="developer-portal__nav-pills" aria-label="portal sections">
            <span>{text.portalNav.access}</span>
            <span>{text.portalNav.security}</span>
            <span>{text.portalNav.delivery}</span>
            <span>{text.portalNav.usage}</span>
          </div>

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
          <article className="developer-card developer-card--plans">
            <span className="developer-card__eyebrow">{text.plansTitle}</span>
            <h2>{text.plansBody}</h2>
            <div className="developer-card__tile-grid">
              {text.plans.map((plan) => (
                <article key={plan.name} className={`developer-card__tile${selectedPlanMeta?.name === plan.name ? " is-active" : ""}`}>
                  <strong>{plan.name}</strong>
                  <span className="developer-card__tile-badge">{plan.badge}</span>
                  <p>{plan.body}</p>
                </article>
              ))}
            </div>
          </article>
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
              <span className="payment-sheet-kicker">Portal</span>
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
                <h2 className="developer-portal__section-title">{text.billingTitle}</h2>
                <p className="hero-copy">{text.billingBody}</p>
                <div className="developer-portal__plan-grid page-section-offset--compact">
                  {text.plans.map((plan) => (
                    <article key={plan.name} className={`developer-portal__plan-card${selectedPlanMeta?.name === plan.name ? " is-selected" : ""}`}>
                      <span>{plan.badge}</span>
                      <strong>{plan.name}</strong>
                      <p>{plan.body}</p>
                    </article>
                  ))}
                </div>
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
                    <span className="receipt-brandline">Usage</span>
                    <span className="completion-ticket-no">Live</span>
                  </div>
                  <h2 className="developer-portal__section-title">{text.usageTitle}</h2>
                  <p className="hero-copy">{text.usageBody}</p>
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
                  <h2 className="developer-portal__section-title">{text.securityTitle}</h2>
                  <p className="hero-copy">{text.securityBody}</p>
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
              <article className="checkout-card checkout-card--lux developer-portal__card">
                <div className="completion-paper-topline">
                  <span className="receipt-brandline">Events</span>
                  <span className="completion-ticket-no">{text.hooksTitle}</span>
                </div>
                <h2 className="developer-portal__section-title">{text.deliveryTitle}</h2>
                <p className="hero-copy">{text.deliveryBody}</p>
                <form onSubmit={handleCreateWebhook} className="form-grid page-section-offset--compact">
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
                <div className="stack-list page-section-offset--compact">
                  {webhooks.map((hook) => (
                    <div key={hook.id} className="payment-field developer-portal__webhook-row">
                      <div className="developer-portal__webhook-head">
                        <div className="developer-portal__webhook-copy">
                          <label>{hook.label}</label>
                          <code>{hook.url}</code>
                        </div>
                        <button type="button" className="ghost-button compact-button" onClick={() => void handleDeleteWebhook(hook.id)}>
                          {text.remove}
                        </button>
                      </div>
                      <div className="payload-callout developer-portal__webhook-secret">
                        <span>Signing Secret</span>
                        <code>{hook.secret}</code>
                      </div>
                    </div>
                  ))}
                  {!webhooks.length ? <p className="muted">{text.emptyHooks}</p> : null}
                </div>
              </article>
            ) : null}

            <article className="checkout-card checkout-card--lux developer-portal__card">
              <div className="completion-paper-topline">
                <span className="receipt-brandline">Implementation</span>
                <span className="completion-ticket-no">SDK</span>
              </div>
              <h2 className="developer-portal__section-title">{text.sampleCardTitle}</h2>
              <p className="hero-copy">{text.sampleCardBody}</p>
              <pre className="completion-ledger developer-portal__code-block">
                <code>{sampleCurl}</code>
              </pre>
            </article>
          </section>
        </div>
      )}
    </main>
  );
}
