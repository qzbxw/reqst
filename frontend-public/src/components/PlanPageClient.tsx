"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUI } from "./UIProvider";

type Variant = "dev" | "enterprise";

const COPY = {
  ru: {
    back: "На главную",
    auth: "Консоль",
    billing: "Связаться",
    discuss: "Обсудить условия",
    compareTitle: "Протокол",
    flowTitle: "Интеграция",
    priceTitle: "Доступ",
    priceSubtitle: "Неограниченный оборот. Фиксированная цена.",
    codeTitle: "Пример реализации",
    codeSubtitle: "Готов к продакшену за считанные минуты.",
    codeBody: "Бесшовная интеграция нашего протокола в ваш существующий рабочий процесс с помощью высокопроизводительного API Beta.",
    processingNote: "We use a proprietary non-custodial architecture. All transactions go through your nodes or our high-performance clusters directly to the blockchain.",
    compareSectionTitle: "Архитектура прямого доступа",
    compareSectionBody: "Reqst работает как прозрачный программный слой (middleware). Транзакции идут напрямую от клиента к вам, минуя промежуточные счета. Мы лишь автоматизируем мониторинг через сеть высокопроизводительных нод, исключая любые риски блокировки средств.",
    dev: {
      badge: "Reqst Developer",
      title: "Инфраструктура криптоплатежей. Контроль в ваших руках.",
      body: "Профессиональный API v1 Beta и Webhook-уведомления для high-load систем. Прямые выплаты Direct-to-Wallet и полная свобода от комиссий с оборота в non-custodial среде.",
      priceLabel: "199$",
      period: "в месяц",
      stats: [
        { value: "0ms", label: "Латентность" },
        { value: "100%", label: "Direct-to-Wallet" },
        { value: "Full", label: "Real-time Access" },
        { value: "∞", label: "Webhook Endpoints" },
      ],
      features: [
        {
          title: "Webhook Delivery",
          body: "Гарантированная доставка (at-least-once) with автоматическими ретраями и проверкой подлинности через HMAC-SHA256.",
        },
        {
          title: "Real-time Monitoring",
          body: "Мониторинг транзакций в реальном времени. Обнаружение платежа происходит мгновенно, еще до подтверждения блоком.",
        },
        {
          title: "Unified API v1 Beta",
          body: "Единый интерфейс для работы с 7+ сетями: TON, TRON, SOL, Base, Arbitrum, BSC и Ethereum (EVM).",
        },
        {
          title: "Idempotency Safety",
          body: "Встроенная защита от дублирования транзакций и повторных списаний на уровне протокола API.",
        },
      ],
      flow: [
        { title: "API Key Provisioning", body: "Мгновенная генерация ключей rk_live_. Гибкое управление правами (Scopes) для безопасной интеграции в ваш бэкенд." },
        { title: "Webhook Configuration", body: "Настройка коллбэков с подписью HMAC-SHA256. Получайте уведомления в реальном времени с автоматическими ретраями." },
        { title: "Blockchain Monitoring", body: "Запуск автоматического процессинга. Наши вотчеры отслеживают транзакции и подтверждают платежи 24/7 без вашего участия." },
      ],
      code: `// Create Invoice via Reqst API v1 Beta
const response = await fetch("https://api.reqst.xyz/v1/invoices", {
  method: "POST",
  headers: {
    "X-API-Key": "rk_live_...",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    title: "Order #9921",
    base_amount_usd: "149.00",
    payable_network: "TRON", // TON, SOL, BASE, etc.
    expires_in_minutes: 60
  })
});

const invoice = await response.json();
console.log("Checkout URL:", invoice.checkout_url);`
    },
    enterprise: {
      badge: "Reqst Enterprise",
      title: "Корпоративный стандарт. Инфраструктура без границ.",
      body: "Высокая пропускная способность, расширенные лимиты API и приоритетная поддержка для масштабных систем с оборотом от 1M$.",
      priceLabel: "Custom",
      period: "индивидуальный расчет",
      stats: [
        { value: "0ms", label: "Латентность" },
        { value: "Full", label: "Real-time Access" },
        { value: "∞", label: "Webhook Endpoints" },
        { value: "24/7", label: "Support" },
      ],
      features: [
        {
          title: "High-Performance Quota",
          body: "Расширенные лимиты для крупных систем: до 600 запросов в минуту и 500,000 запросов к API ежемесячно.",
        },
        {
          title: "Mission-Critical Webhooks",
          body: "Повышенная надежность доставки уведомлений: до 8 автоматических попыток отправки (Retries) при сбоях вашего сервера.",
        },
        {
          title: "Enhanced Key Management",
          body: "Возможность выпуска до 20 активных API-ключей для разных отделов, сервисов или инфраструктурных задач.",
        },
        {
          title: "Priority Engineering",
          body: "Прямой канал связи с командой разработки Reqst. Приоритетное решение технических вопросов и консультации 24/7.",
        },
      ],
      flow: [
        { title: "Infrastructure Audit", body: "Анализ текущих потоков платежей и проектирование топологии узлов под ваши пиковые нагрузки." },
        { title: "Dedicated Provisioning", body: "Развертывание изолированных инстансов мониторинга и настройка высокоприоритетных очередей уведомлений." },
        { title: "Hyper-scale Launch", body: "Запуск процессинга с лимитами 600+ RPM и прямой поддержкой от команды Core-разработчиков." },
      ],
      code: `// Enterprise Webhook Verification (HMAC-SHA256)
const crypto = require('crypto');

function verify(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return \`v1=\${hmac.digest('hex')}\` === signature;
}

// 100% authenticity for mission-critical payments`
    },
  },
  en: {
    back: "Back to Home",
    auth: "Console",
    billing: "Contact",
    discuss: "Discuss Terms",
    compareTitle: "Protocol",
    flowTitle: "Integration",
    priceTitle: "Access",
    priceSubtitle: "Unlimited volume. Flat monthly fee.",
    codeTitle: "Code Implementation",
    codeSubtitle: "Ready for production in minutes.",
    codeBody: "Seamlessly integrate our protocol into your existing workflow using our high-performance API Beta.",
    processingNote: "We use a proprietary non-custodial architecture. All transactions go through your nodes or our high-performance clusters directly to the blockchain.",
    compareSectionTitle: "Direct Access Architecture",
    compareSectionBody: "Reqst operates as a transparent software layer (middleware). Transactions flow directly from client to merchant, bypassing intermediary accounts. We automate monitoring via high-performance nodes, eliminating any third-party risks.",
    dev: {
      badge: "Reqst Developer",
      title: "Crypto Payments Infrastructure. Total Control.",
      body: "Professional API v1 Beta and Webhook notifications for high-load projects. Direct-to-wallet payouts and zero turnover fees in a pure non-custodial environment.",
      priceLabel: "$199",
      period: "per month",
      stats: [
        { value: "0ms", label: "Latency" },
        { value: "100%", label: "Direct-to-Wallet" },
        { value: "Full", label: "Real-time Access" },
        { value: "∞", label: "Webhook Endpoints" },
      ],
      features: [
        {
          title: "Webhook Delivery",
          body: "Guaranteed delivery (at-least-once) with automatic retries and HMAC-SHA256 signature verification.",
        },
        {
          title: "Real-time Monitoring",
          body: "Real-time transaction monitoring. Detect incoming payments instantly, even before block confirmation.",
        },
        {
          title: "Unified API v1 Beta",
          body: "A single interface for 7+ networks including TON, TRON, SOL, Base, Arbitrum, BSC, and Ethereum.",
        },
        {
          title: "Idempotency Safety",
          body: "Built-in protection against duplicate transactions and double-spending at the API protocol level.",
        },
      ],
      flow: [
        { title: "API Key Provisioning", body: "Instant rk_live_ key generation. Granular scope management for secure backend integration." },
        { title: "Webhook Configuration", body: "Secure HMAC-SHA256 signed callbacks. Receive real-time transaction updates with automated retry logic." },
        { title: "Blockchain Monitoring", body: "Automated payment processing. Our watchers track transactions and confirm payments 24/7 autonomously." },
      ],
      code: `// Create Invoice via Reqst API v1 Beta
const response = await fetch("https://api.reqst.xyz/v1/invoices", {
  method: "POST",
  headers: {
    "X-API-Key": "rk_live_...",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    title: "Order #9921",
    base_amount_usd: "149.00",
    payable_network: "TRON", // TON, SOL, BASE, etc.
    expires_in_minutes: 60
  })
});

const invoice = await response.json();
console.log("Checkout URL:", invoice.checkout_url);`
    },
    enterprise: {
      badge: "Reqst Enterprise",
      title: "Corporate Standard. Infrastructure Without Limits.",
      body: "High throughput, expanded API limits, and priority support for large-scale systems with $1M+ turnover.",
      priceLabel: "Custom",
      period: "individual pricing",
      stats: [
        { value: "0ms", label: "Latency" },
        { value: "Full", label: "Real-time Access" },
        { value: "∞", label: "Webhook Endpoints" },
        { value: "24/7", label: "Support" },
      ],
      features: [
        {
          title: "High-Performance Quota",
          body: "Expanded limits for large-scale systems: up to 600 requests per minute and 500,000 monthly API requests.",
        },
        {
          title: "Mission-Critical Webhooks",
          body: "Enhanced notification reliability with up to 8 automatic retries if your server experiences downtime.",
        },
        {
          title: "Enhanced Key Management",
          body: "Issue up to 20 active API keys for different departments, services, or infrastructure requirements.",
        },
        {
          title: "Priority Engineering",
          body: "Direct communication channel with the Reqst core team. Priority technical support and 24/7 integration consulting.",
        },
      ],
      flow: [
        { title: "Infrastructure Audit", body: "Analyzing current payment flows and designing node topology for your specific peak loads." },
        { title: "Dedicated Provisioning", body: "Deploying isolated monitoring instances and configuring high-priority notification queues." },
        { title: "Hyper-scale Launch", body: "Launching processing with 600+ RPM limits and direct support from the Core team." },
      ],
      code: `// Enterprise Webhook Verification (HMAC-SHA256)
const crypto = require('crypto');

function verify(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return \`v1=\${hmac.digest('hex')}\` === signature;
}

// 100% authenticity for mission-critical payments`
    },
  },
} as const;


function useReveal() {
  const refs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
          }
        });
      },
      { threshold: 0.1 }
    );
    refs.current.forEach((ref) => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, []);
  return (el: HTMLElement | null) => {
    if (el && !refs.current.includes(el)) refs.current.push(el);
  };
}

export function PlanPage({ variant }: { variant: Variant }) {
  const { language } = useUI();
  const pathname = usePathname();
  const text = COPY[language];
  const product = text[variant];
  const reveal = useReveal();

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
    window.scrollTo(0, 0);
  }, [variant]);

  return (
    <main className="lend-page">
      <div className="lend-backdrop lend-backdrop--grid" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--left" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--right" />

      <div className="lend-shell">
        <header className="lend-topbar">
          <div className="lend-topbar-main">
            <Link className="lend-brand" href={`/${language}`}>
              <strong>reqst</strong>
            </Link>

            <div className="lend-topbar-actions">
              <div className="lend-language" role="group" aria-label="language switcher">
                <Link 
                  href={pathname.startsWith("/ru") ? pathname.replace("/ru", "/en") : pathname.replace("/en", "/ru")}
                  className="inactive"
                >
                  {language === "ru" ? "EN" : "RU"}
                </Link>
              </div>
              <Link className="lend-primary" href="/app/auth">{text.auth}</Link>
            </div>
          </div>
        </header>

        <section className={`lend-hero ${variant === "dev" || variant === "enterprise" ? "lend-hero--centered" : ""}`} ref={reveal}>
          <div className="lend-hero-copy">
            <span className="lend-section-kicker lend-reveal--1">{product.badge}</span>
            <h1 className="lend-reveal--2">{product.title}</h1>
            <p className="lend-reveal--3">{product.body}</p>

            <div className="lend-cta-row lend-reveal--4">
              {variant === "dev" ? (
                <>
                  <Link className="lend-primary" href="/app/auth">
                    {language === "ru" ? "Активировать" : "Activate"}
                  </Link>
                  <Link className="lend-secondary" href="/app/auth">
                    {language === "ru" ? "Консоль" : "Console"}
                  </Link>
                </>
              ) : variant === "enterprise" ? (
                <>
                  <a className="lend-primary" href="https://t.me/kynexq" target="_blank" rel="noopener noreferrer">
                    {language === "ru" ? "Обсудить условия" : "Discuss Terms"}
                  </a>
                  <Link className="lend-secondary" href="/app/auth">
                    {language === "ru" ? "Консоль" : "Console"}
                  </Link>
                </>
              ) : (
                <>
                  <a className="lend-primary" href="https://t.me/kynexq" target="_blank" rel="noopener noreferrer">
                    {text.discuss}
                  </a>
                  <Link className="lend-secondary" href="/app/auth">
                    {text.auth}
                  </Link>
                </>
              )}
            </div>
          </div>

          {variant !== "dev" && variant !== "enterprise" && (
            <aside className="lend-hero-side lend-reveal--3">
              <div className="lend-stats-grid">
                {product.stats.map((stat, i) => (
                  <article key={i} className={`lend-card lend-stat-card lend-reveal--${4 + i}`}>
                    <span className="lend-stat-label">{stat.label}</span>
                    <h3 className="lend-stat-value">{stat.value}</h3>
                  </article>
                ))}
              </div>
            </aside>
          )}
        </section>

        <section className="lend-split-section lend-plan-features" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{text.compareTitle}</span>
            <h2>{text.compareSectionTitle}</h2>
            <p>{text.compareSectionBody}</p>
          </div>

          <div className="lend-overview-grid lend-reveal--2">
            {product.features.map((feat, i) => (
              <article key={i} className={`lend-card lend-plan-feature-card lend-reveal--${2 + i}`}>
                <h3>{feat.title}</h3>
                <p>{feat.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lend-stacked-section lend-code-section" ref={reveal}>
           <div className="lend-card lend-code-card lend-reveal--1">
              <div className="lend-code-grid">
                <div className="lend-reveal--2">
                  <span className="lend-section-kicker">{text.codeTitle}</span>
                  <h2>{text.codeSubtitle}</h2>
                  <p>
                    {text.codeBody}
                  </p>
                </div>
                <div className="lend-reveal--3 lend-code-block">
                  <pre>
                    <code>{product.code}</code>
                  </pre>
                </div>
              </div>
           </div>
        </section>

        <section className="lend-stacked-section lend-flow-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{text.flowTitle}</span>
            <h2>Seamless Integration Flow</h2>
          </div>

          <div className="lend-flow-container">
            {product.flow.map((step, i) => (
              <article key={i} className={`lend-card lend-flow-card lend-reveal--${2 + i}`}>
                <div className="lend-flow-step-number">
                  {i + 1}
                </div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                
                {i < 2 && (
                  <div className="lend-flow-arrow">
                    →
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="lend-final lend-plan-final" ref={reveal}>
          <div className="lend-reveal--1">
            <span className="lend-section-kicker">{text.priceTitle}</span>
          </div>
          
          <div className="lend-reveal--2">
            <h2 className="lend-price-value">
              {product.priceLabel}
            </h2>
          </div>
          
          <div className="lend-reveal--3">
            <p className="lend-price-period">
              {product.period}
            </p>
            <p className="lend-price-subtitle">
              {text.priceSubtitle}
            </p>
          </div>

          <div className="lend-cta-row lend-reveal--4">
            {variant === "dev" ? (
              <Link className="lend-primary lend-price-btn" href="/app/auth">
                {language === "ru" ? "Активировать Reqst Dev" : "Activate Reqst Dev"}
              </Link>
            ) : (
              <a className="lend-primary lend-price-btn" href="https://t.me/kynexq" target="_blank" rel="noopener noreferrer">
                {text.discuss}
              </a>
            )}
          </div>
        </section>

        <footer className="lend-footer">
          <div className="lend-footer-links">
            <Link href={`/${language}/privacy`}>Privacy</Link>
            <Link href={`/${language}/terms`}>Terms</Link>
            <Link href="/app/developers">Docs</Link>
            <Link href={`/${language}/dev`}>API</Link>
            <Link href={`/${language}/enterprise`}>B2B</Link>
            <Link href="/app/auth">Console</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
