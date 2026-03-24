import { Link } from "react-router-dom";
import { useUI } from "../lib/ui";

type Variant = "dev" | "enterprise";

const COPY = {
  ru: {
    back: "Назад",
    auth: "Войти",
    console: "Консоль",
    billing: "Оплатить",
    compareTitle: "В комплекте",
    flowTitle: "Запуск",
    fitTitle: "Кому",
    faqTitle: "FAQ",
    dev: {
      badge: "Reqst Dev",
      title: "API-интеграция для продуктов.",
      body: "Self-serve доступ к API, выпуск ключей и настройка вебхуков без участия sales-отдела.",
      price: "149 USDT / 30 дней",
      bullets: ["3 ключа", "50k запросов/мес", "90 RPM/ключ"],
      stats: [
        { value: "3", label: "ключа" },
        { value: "50k", label: "запросов/мес" },
        { value: "90 rpm", label: "лимит" },
      ],
      sections: [
        {
          title: "Интеграция",
          body: "Для SaaS-платформ и внутренних сервисов.",
        },
        {
          title: "Мгновенно",
          body: "Активация сразу после оплаты.",
        },
        {
          title: "Контроль",
          body: "Ключи и квоты в одной панели.",
        },
      ],
      flow: [
        "Создание инвойса на оплату плана.",
        "Автоматическое открытие доступа.",
        "Выпуск ключей и настройка вебхуков.",
      ],
      fit: [],
      faq: [],
      tone: "Эффективный запуск.",
    },
    enterprise: {
      badge: "Reqst Enterprise",
      title: "B2B инфраструктура.",
      body: "Решение для высокой нагрузки. Расширенные лимиты и приоритетная доставка уведомлений.",
      price: "499 USDT / 30 дней",
      bullets: ["20 ключей", "500k запросов/мес", "600 RPM/ключ"],
      stats: [
        { value: "20", label: "ключей" },
        { value: "500k", label: "запросов/мес" },
        { value: "600 rpm", label: "лимит" },
      ],
      sections: [
        {
          title: "Нагрузка",
          body: "Для систем с большим объемом транзакций.",
        },
        {
          title: "Команды",
          body: "Разделение продакшн и стейджинг окружений.",
        },
        {
          title: "Стабильность",
          body: "Приоритетная обработка и поддержка.",
        },
      ],
      flow: [
        "Оплата Enterprise плана.",
        "Мгновенное обновление лимитов.",
        "Распределение ключей по сервисам.",
      ],
      fit: [],
      faq: [],
      tone: "Критическая инфраструктура.",
    },
  },
  en: {
    back: "Back",
    auth: "Login",
    console: "Console",
    billing: "Upgrade",
    compareTitle: "Included",
    flowTitle: "Setup",
    fitTitle: "Fit",
    faqTitle: "FAQ",
    dev: {
      badge: "Reqst Dev",
      title: "API for product teams.",
      body: "Self-serve API access, key management, and webhooks without sales friction.",
      price: "149 USDT / 30 days",
      bullets: ["3 keys", "50k req/mo", "90 RPM/key"],
      stats: [
        { value: "3", label: "keys" },
        { value: "50k", label: "req/mo" },
        { value: "90 rpm", label: "limit" },
      ],
      sections: [
        {
          title: "Product",
          body: "For SaaS and internal tools.",
        },
        {
          title: "Instant",
          body: "Access enabled after payment.",
        },
        {
          title: "One UI",
          body: "Keys and quotas in one place.",
        },
      ],
      flow: [
        "Create billing checkout.",
        "Access unlocks automatically.",
        "Issue keys and connect webhooks.",
      ],
      fit: [],
      faq: [],
      tone: "Fast integration.",
    },
    enterprise: {
      badge: "Reqst Enterprise",
      title: "B2B Infrastructure.",
      body: "Built for high load and multi-team setups. Expanded limits and priority delivery.",
      price: "499 USDT / 30 days",
      bullets: ["20 keys", "500k req/mo", "600 RPM/key"],
      stats: [
        { value: "20", label: "keys" },
        { value: "500k", label: "req/mo" },
        { value: "600 rpm", label: "limit" },
      ],
      sections: [
        {
          title: "High Load",
          body: "For high-volume transaction systems.",
        },
        {
          title: "Multi-team",
          body: "Isolate prod, staging, and services.",
        },
        {
          title: "Reliability",
          body: "Priority delivery and processing.",
        },
      ],
      flow: [
        "Pay Enterprise checkout.",
        "Limits update immediately.",
        "Distribute keys across services.",
      ],
      fit: [],
      faq: [],
      tone: "Critical ops.",
    },
  },
} as const;

export function PlanPage({ variant }: { variant: Variant }) {
  const { language } = useUI();
  const text = COPY[language];
  const product = text[variant];

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
          <Link className="lend-primary" to="/auth">
            {text.auth}
          </Link>
        </div>
      </header>

      <div className="checkout-flow page-section-offset">
        <section className="checkout-story">
          <article className="checkout-card checkout-card--lux plan-page__hero-card">
            <div className="receipt-hero receipt-hero--plan">
              <div className="receipt-copy receipt-copy--plan">
                <h1>{product.title}</h1>
                <p className="hero-copy">{product.body}</p>
              </div>
            </div>

            <div className="plan-page__stats plan-page__stats--plan">
              {product.stats.map((item) => (
                <div key={item.label} className="metric-card">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="plan-page__actions plan-page__actions--stacked">
              <Link className="lend-primary lend-primary--large plan-page__action-link" to={`/console?plan=${variant}`}>
                {text.billing}
              </Link>
              <Link className="lend-secondary plan-page__action-link" to="/console">
                {text.console}
              </Link>
            </div>
          </article>

          <section className="payment-sheet payment-sheet--receipt">
            <div className="payment-sheet-header">
              <span className="payment-sheet-kicker">{text.compareTitle}</span>
            </div>
            <div className="payment-essentials">
              {product.sections.map((section) => (
                <div key={section.title} className="payment-field">
                  <div>
                    <label>{section.title}</label>
                    <p className="page-muted-copy">{section.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>

        <aside className="payment-rail">
          <div className="amount-totem amount-totem--receipt amount-totem--rail">
            <span>{language === "ru" ? "Стоимость" : "Price"}</span>
            <strong className="plan-page__price-strong">{product.price.split(" / ")[0]}</strong>
            <div className="network-badge">
              <b>{product.price.split(" / ")[1]}</b>
              <small>{language === "ru" ? "период" : "period"}</small>
            </div>
          </div>

          <article className="checkout-card checkout-card--lux plan-page__side-card">
            <span className="receipt-brandline plan-page__section-label">{text.flowTitle}</span>
            <div className="plan-page__stack">
              {product.flow.map((item, index) => (
                <div key={item} className="detail-row plan-page__detail-row">
                  <div className="plan-page__timeline-item">
                    <strong className="plan-page__timeline-index">{String(index + 1).padStart(2, "0")}</strong>
                    <p className="page-copy-reset">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>

    </main>
  );
}
