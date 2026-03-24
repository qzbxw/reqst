import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useUI } from "../lib/ui";

const BOT_URL = "https://t.me/reqstxyz_bot";

const COPY = {
  ru: {
    nav: {
      overview: "Продукт",
      capabilities: "Возможности",
      networks: "Сети",
      faq: "FAQ",
      bot: "Telegram бот",
      console: "Вход",
    },
    hero: {
      title: "Ваш бизнес на крипто-автопилоте.",
      body:
        "Принимайте платежи напрямую на свои кошельки. Reqst автоматизирует чекаут, подтверждение транзакций и уведомления, пока вы фокусируетесь на росте.",
      subcopy:
        "Non-custodial. Без посредников. Без скрытых комиссий с оборота. Только порядок и полный контроль.",
      primary: "Запустить сейчас",
      secondary: "Открыть в Telegram",
      badges: ["Direct-to-Wallet", "Telegram Native", "0% Transaction Fee", "API Ready", "B2B Scale"],
    },
    heroPanel: {
      eyebrow: "live demo",
      title: "Откройте mock checkout",
      body: "Покажите клиентский флоу вживую: таймер, QR, реквизиты и аккуратный статус оплаты на отдельной странице.",
      amount: "149 USDT",
      invoice: "REQST-DEMO-149",
      status: "Ожидает оплату",
      primary: "Посмотреть checkout",
      secondary: "Войти в консоль",
      helper: "Идеально для презентации продукта, onboarding и первого wow-эффекта.",
      chips: ["TON", "TRON", "Base", "Live status"],
    },
    overview: {
      kicker: "OVERVIEW",
      title: "Порядок в финансах начинается здесь.",
      body:
        "Reqst превращает хаотичные переводы по адресу в прозрачный бизнес-процесс. Больше никакой ручной сверки и бесконечных скриншотов от клиентов.",
      cards: [
        {
          title: "Для бизнеса",
          body: "Единый хаб для управления инвойсами, аналитикой и доступом команды.",
        },
        {
          title: "Для клиентов",
          body: "Бесшовный процесс оплаты в пару кликов с мгновенным подтверждением.",
        },
        {
          title: "Для разработчиков",
          body: "Чистый API и вебхуки для глубокой интеграции в любой ваш продукт.",
        },
      ],
    },
    capabilities: {
      kicker: "FEATURES",
      title: "Всё, что нужно для масштабирования.",
      body: "Инструменты, созданные для экономии времени и исключения ошибок.",
      items: [
        {
          kicker: "01",
          title: "Прямые выплаты",
          body: "Средства никогда не задерживаются у нас. Они летят сразу на ваш адрес.",
        },
        {
          kicker: "02",
          title: "Мульти-сети",
          body: "Поддержка TON, TRON, Solana и всех популярных EVM-сетей из коробки.",
        },
        {
          kicker: "03",
          title: "Обработка ошибок",
          body: "Система автоматически распознает недоплаты и переплаты, уведомляя вас.",
        },
        {
          kicker: "04",
          title: "Telegram Native",
          body: "Выставляйте счета и следите за продажами прямо в любимом мессенджере.",
        },
        {
          kicker: "05",
          title: "Фикс вместо процента",
          body: "Никаких комиссий с вашего оборота. Только прозрачная подписка за сервис.",
        },
        {
          kicker: "06",
          title: "B2B Решения",
          body: "Готовность к высоким нагрузкам и командной работе над проектами.",
        },
      ],
    },
    compare: {
      kicker: "THE DIFFERENCE",
      title: "Забудьте про ручной поиск транзакций.",
      body: "Как меняется ваша жизнь с переходом на Reqst.",
      rows: [
        {
          legacy: "Ожидание скриншотов и ручная проверка эксплорера.",
          reqst: "Автоматическое подтверждение и мгновенный вебхук.",
        },
        {
          legacy: "Бесконечные споры о суммах и сетях перевода.",
          reqst: "Клиент видит точные инструкции и QR на одной странице.",
        },
        {
          legacy: "Скрытые комиссии платежных шлюзов (до 5-10%).",
          reqst: "Честная модель подписки без поборов с каждой продажи.",
        },
      ],
    },
    networks: {
      kicker: "NETWORKS",
      title: "Работайте там, где ваши клиенты.",
      body: "Мы поддерживаем самые ликвидные и удобные сети для ваших платежей.",
      rails: [
        {
          name: "TON",
          title: "The Open Network",
          body: "Лучший выбор для интеграции с Telegram и работы с TON-кошельками.",
        },
        {
          name: "TRON",
          title: "TRON",
          body: "Классика стейблкоинов с низкими комиссиями и высокой скоростью.",
        },
        {
          name: "SOL",
          title: "Solana",
          body: "Ультра-быстрые транзакции для тех, кто ценит скорость и минимальные издержки.",
        },
        {
          name: "EVM",
          title: "L2 & Ethereum",
          body: "Base, Arbitrum, BSC и другие сети — принимайте платежи как удобно.",
        },
      ],
      soon: {
        title: "В разработке",
        api: "Public API 2.0",
        b2b: "Team Access",
        body: "Мы постоянно расширяем возможности для крупного бизнеса и командной работы.",
      },
    },
    faq: {
      kicker: "FAQ",
      title: "Ответы на частые вопросы.",
      body: "Коротко о том, как устроены продажи, биллинг и API внутри Reqst.",
      items: [
        {
          question: "Reqst хранит мои деньги или приватные ключи?",
          answer: "Нет. Reqst работает в non-custodial модели: покупатель платит сразу на ваш адрес, а сервис только строит checkout, отслеживает входящий перевод и обновляет статус инвойса.",
        },
        {
          question: "Какие тарифы теперь есть?",
          answer: "Базовый seller-flow живет в Reqst PRO. Для команд, которым нужны API keys, webhooks и интеграции, есть Reqst Dev. Для более высоких лимитов, большего числа ключей и усиленного B2B-сценария есть Reqst Enterprise.",
        },
        {
          question: "Как покупаются PRO, Dev и Enterprise?",
          answer: "Через обычные Reqst checkout links. Вы создаете billing checkout внутри сервиса, оплачиваете его переводом в нужной сети, и после подтверждения план активируется автоматически.",
        },
        {
          question: "Есть ли уже API и webhooks для разработчиков?",
          answer: "Да. В Reqst Dev и Reqst Enterprise доступны API keys, seller API для создания и чтения инвойсов, usage limits, rate limiting и webhook endpoints для событий оплаты и активации подписки.",
        },
        {
          question: "Какие сети реально мониторятся автоматически?",
          answer: "Сейчас Reqst автоматически отслеживает TON, TRON, Solana и EVM-family сети вроде Ethereum, Base, Arbitrum и BSC. Для разных сетей используется подходящий upstream: где удобно RPC, где удобнее специализированный индексирующий API.",
        },
        {
          question: "Что если клиент отправил не ту сумму или не в ту сеть?",
          answer: "Точный happy path система подтверждает автоматически, а спорные сценарии вроде underpaid, late payment или manual review помечаются отдельно в консоли, чтобы вы могли принять решение вручную без потери контекста.",
        },
      ],
    },
    final: {
      kicker: "GET STARTED",
      title: "Готовы автоматизировать свои продажи?",
      body:
        "Присоединяйтесь к сотням продавцов, которые уже перевели свой прием крипты на профессиональный уровень.",
      primary: "Создать первый инвойс",
      secondary: "Документация",
    },
    footer: {
      title: "reqst",
      body: "Автоматизация крипто-платежей с прямыми выплатами на ваш кошелек. Честно, быстро, профессионально.",
      product: "Продукт",
      privacy: "Конфиденциальность",
      terms: "Условия",
      console: "Консоль",
      status: "Роадмап",
      api: "API",
      b2b: "B2B",
    },
  },
  en: {
    nav: {
      overview: "Product",
      capabilities: "Features",
      networks: "Networks",
      faq: "FAQ",
      bot: "Bot",
      console: "Login",
    },
    hero: {
      title: "Your business on crypto autopilot.",
      body:
        "Accept payments directly to your wallets. Reqst automates checkout, transaction tracking, and notifications while you focus on growth.",
      subcopy:
        "Non-custodial by design. No middlemen. No hidden fees on your turnover. Just order and total control.",
      primary: "Launch Now",
      secondary: "Open in Telegram",
      badges: ["Direct-to-Wallet", "Telegram Native", "0% Transaction Fee", "API Ready", "B2B Scale"],
    },
    heroPanel: {
      eyebrow: "live demo",
      title: "Open the mock checkout",
      body: "Show the buyer flow live: countdown, QR, payment details, and a polished payment status on a dedicated page.",
      amount: "149 USDT",
      invoice: "REQST-DEMO-149",
      status: "Awaiting payment",
      primary: "View checkout",
      secondary: "Open console",
      helper: "Perfect for demos, onboarding, and a strong first product impression.",
      chips: ["TON", "TRON", "Base", "Live status"],
    },
    overview: {
      kicker: "OVERVIEW",
      title: "Financial order starts here.",
      body:
        "Reqst turns chaotic wallet transfers into a transparent business process. No more manual verification or endless screenshots from clients.",
      cards: [
        {
          title: "For Business",
          body: "A unified hub for managing invoices, analytics, and team access.",
        },
        {
          title: "For Clients",
          body: "A seamless payment flow in just a few clicks with instant confirmation.",
        },
        {
          title: "For Developers",
          body: "Clean API and webhooks for deep integration into any product.",
        },
      ],
    },
    capabilities: {
      kicker: "FEATURES",
      title: "Everything you need to scale.",
      body: "Tools designed to save time and eliminate human errors.",
      items: [
        {
          kicker: "01",
          title: "Direct Payouts",
          body: "Funds never sit with us. They go straight from the customer to your wallet.",
        },
        {
          kicker: "02",
          title: "Multi-Network",
          body: "Support for TON, TRON, Solana, and all major EVM chains out of the box.",
        },
        {
          kicker: "03",
          title: "Error Handling",
          body: "Automated detection of underpayments and overpayments with instant alerts.",
        },
        {
          kicker: "04",
          title: "Telegram Native",
          body: "Issue invoices and track sales directly in your favorite messenger.",
        },
        {
          kicker: "05",
          title: "Flat Pricing",
          body: "No transaction fees. Just a transparent subscription for the service.",
        },
        {
          kicker: "06",
          title: "B2B Ready",
          body: "Built for high loads and collaborative team workflows.",
        },
      ],
    },
    compare: {
      kicker: "THE DIFFERENCE",
      title: "Stop chasing transactions manually.",
      body: "How your life changes after switching to Reqst.",
      rows: [
        {
          legacy: "Waiting for screenshots and manual explorer checks.",
          reqst: "Automated confirmation and instant webhooks.",
        },
        {
          legacy: "Endless disputes over amounts and network details.",
          reqst: "Client sees precise instructions and QR on one page.",
        },
        {
          legacy: "Hidden gateway fees (up to 5-10% per sale).",
          reqst: "Fair subscription model with no transaction taxes.",
        },
      ],
    },
    networks: {
      kicker: "NETWORKS",
      title: "Be where your customers are.",
      body: "We support the most liquid and convenient networks for your payments.",
      rails: [
        {
          name: "TON",
          title: "The Open Network",
          body: "Best choice for Telegram integration and TON ecosystem users.",
        },
        {
          name: "TRON",
          title: "TRON",
          body: "The stablecoin classic with low fees and high reliability.",
        },
        {
          name: "SOL",
          title: "Solana",
          body: "Ultra-fast transactions for those who value speed and minimal costs.",
        },
        {
          name: "EVM",
          title: "L2 & Ethereum",
          body: "Base, Arbitrum, BSC, and more — accept payments your way.",
        },
      ],
      soon: {
        title: "In Progress",
        api: "Public API 2.0",
        b2b: "Team Access",
        body: "We are constantly expanding features for enterprise and team collaboration.",
      },
    },
    faq: {
      kicker: "FAQ",
      title: "Frequently Asked Questions.",
      body: "A quick overview of how billing, payouts, and the Dev API work inside Reqst.",
      items: [
        {
          question: "Does Reqst custody funds or private keys?",
          answer: "No. Reqst is non-custodial: the buyer pays directly to your payout wallet, while the service handles checkout UX, incoming transfer monitoring, and invoice status updates.",
        },
        {
          question: "What plans are available now?",
          answer: "Reqst PRO covers the core seller flow. Reqst Dev adds API keys, webhooks, and developer-facing integration tools. Reqst Enterprise pushes the same model further with higher limits, more keys, and a stronger B2B operating setup.",
        },
        {
          question: "How do I buy PRO, Dev, or Enterprise?",
          answer: "Through normal Reqst checkout links. You generate a billing checkout inside the product, pay it with a blockchain transfer in the selected network, and the plan is activated automatically after confirmation.",
        },
        {
          question: "Is there already an API and webhook layer for developers?",
          answer: "Yes. Reqst Dev and Reqst Enterprise include API keys, a seller API for invoice creation and retrieval, usage caps, rate limits, and webhook endpoints for payment and subscription events.",
        },
        {
          question: "Which networks are monitored automatically today?",
          answer: "Reqst currently auto-monitors TON, TRON, Solana, and the EVM family including Ethereum, Base, Arbitrum, and BSC. The service uses the most practical upstream per network, whether that means direct RPC or a higher-level indexed API.",
        },
        {
          question: "What if the buyer sends the wrong amount or uses the wrong route?",
          answer: "Clean matches are confirmed automatically, while edge cases like underpaid transfers, late payments, or manual-review scenarios are clearly flagged in the console so your team can resolve them with context.",
        },
      ],
    },
    final: {
      kicker: "GET STARTED",
      title: "Ready to automate your sales?",
      body:
        "Join hundreds of sellers who have already professionalized their crypto intake.",
      primary: "Create First Invoice",
      secondary: "Documentation",
    },
    footer: {
      title: "reqst",
      body: "Automated crypto payments with direct-to-wallet payouts. Fair, fast, professional.",
      product: "Product",
      privacy: "Privacy",
      terms: "Terms",
      console: "Console",
      status: "Roadmap",
      api: "API",
      b2b: "B2B",
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

export function LandingPage() {
  const { language, setLanguage } = useUI();
  const copy = COPY[language];
  const [openFaq, setOpenFaq] = useState(0);
  const reveal = useReveal();

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
  }, []);

  return (
    <main className="lend-page">
      <div className="lend-backdrop lend-backdrop--grid" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--left" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--right" />

      <div className="lend-shell">
        <header className="lend-topbar">
          <div className="lend-topbar-main">
            <Link className="lend-brand" to="/">
              <strong>reqst</strong>
            </Link>

            <div className="lend-topbar-actions">
              <div className="lend-language" role="group" aria-label="language switcher">
                <button type="button" className={language === "ru" ? "active" : ""} onClick={() => setLanguage("ru")}>RU</button>
                <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button>
              </div>
              <Link className="lend-primary" to="/auth">{copy.nav.console}</Link>
            </div>
          </div>

          <nav className="lend-topnav">
            <a className="lend-nav-link" href="#overview">{copy.nav.overview}</a>
            <a className="lend-nav-link" href="#capabilities">{copy.nav.capabilities}</a>
            <a className="lend-nav-link" href="#networks">{copy.nav.networks}</a>
          </nav>
        </header>

        <section className="lend-hero" ref={reveal}>
          <div className="lend-hero-copy">
            <h1 className="lend-reveal--1">{copy.hero.title}</h1>
            <p className="lend-reveal--2">{copy.hero.body}</p>
            <p className="lend-hero-subcopy lend-reveal--2">{copy.hero.subcopy}</p>

            <div className="lend-cta-row lend-reveal--3">
              <Link className="lend-primary" to="/auth">
                {copy.hero.primary}
              </Link>
              <a className="lend-secondary" href={BOT_URL} target="_blank" rel="noreferrer">
                {copy.hero.secondary}
              </a>
            </div>

          </div>

          <aside className="lend-hero-side lend-reveal--3" aria-label={copy.heroPanel.title}>
            <div className="lend-hero-panel">
              <div className="lend-panel-heading">
                <span className="lend-kicker">{copy.heroPanel.eyebrow}</span>
                <h2>{copy.heroPanel.title}</h2>
                <p>{copy.heroPanel.body}</p>
              </div>

              <div className="lend-demo-card">
                <div className="lend-demo-browser">
                  <span />
                  <span />
                  <span />
                  <b>reqst.app/checkout/demo</b>
                </div>

                <div className="lend-demo-stage">
                  <div className="lend-demo-receipt">
                    <div className="lend-demo-receipt-top">
                      <span className="lend-demo-badge">Reqst Checkout</span>
                      <span className="lend-demo-status">{copy.heroPanel.status}</span>
                    </div>
                    <strong>{copy.heroPanel.amount}</strong>
                    <p>{copy.heroPanel.invoice}</p>

                    <div className="lend-demo-chip-row">
                      {copy.heroPanel.chips.map((chip) => (
                        <span key={chip} className="lend-demo-chip">
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="lend-demo-qr" aria-hidden="true">
                    <div className="lend-demo-qr-grid" />
                  </div>
                </div>
              </div>

              <div className="lend-panel-actions">
                <Link className="lend-primary" to="/checkout/demo">
                  {copy.heroPanel.primary}
                </Link>
                <Link className="lend-secondary" to="/auth">
                  {copy.heroPanel.secondary}
                </Link>
              </div>

              <p className="lend-panel-helper">{copy.heroPanel.helper}</p>
            </div>
          </aside>
        </section>

        <section id="overview" className="lend-split-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.overview.kicker}</span>
            <h2>{copy.overview.title}</h2>
            <p>{copy.overview.body}</p>
          </div>

          <div className="lend-overview-grid lend-reveal--2">
            {copy.overview.cards.map((card) => (
              <article key={card.title} className="lend-card lend-card--overview">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="capabilities" className="lend-stacked-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.capabilities.kicker}</span>
            <h2>{copy.capabilities.title}</h2>
            <p>{copy.capabilities.body}</p>
          </div>

          <div className="lend-feature-grid lend-feature-grid--expanded lend-reveal--2">
            {copy.capabilities.items.map((feature, index) => (
              <article key={feature.title} className="lend-card lend-card--feature">
                <span>{feature.kicker}</span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lend-compare" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.compare.kicker}</span>
            <h2>{copy.compare.title}</h2>
            <p>{copy.compare.body}</p>
          </div>

          <div className="lend-compare-board lend-reveal--2">
            {copy.compare.rows.map((row) => (
              <article key={row.legacy} className="lend-compare-row">
                <div className="lend-compare-legacy">
                  <span>BEFORE REQST</span>
                  <p>{row.legacy}</p>
                </div>
                <div className="lend-compare-reqst">
                  <span>WITH REQST</span>
                  <p>{row.reqst}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="networks" className="lend-stacked-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.networks.kicker}</span>
            <h2>{copy.networks.title}</h2>
            <p>{copy.networks.body}</p>
          </div>

          <div className="lend-network-grid lend-reveal--2">
            {copy.networks.rails.map((rail) => (
              <article key={rail.title} className="lend-network-card">
                <div className="lend-network-badge">{rail.name}</div>
                <h3>{rail.title}</h3>
                <p>{rail.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="lend-split-section lend-reveal--1" ref={reveal}>
          <div className="lend-section-copy" style={{ position: "sticky", top: "6.5rem", height: "fit-content" }}>
            <span className="lend-section-kicker">{copy.faq.kicker}</span>
            <h2>{copy.faq.title}</h2>
            <p>{copy.faq.body}</p>
          </div>

          <div className="lend-faq-stack">
            {copy.faq.items.map((item, index) => {
              const isOpen = index === openFaq;
              const answerId = `landing-faq-answer-${index}`;
              return (
                <article key={item.question} className={`lend-faq-item${isOpen ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="lend-faq-trigger"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  >
                    <div style={{ display: "grid", gap: "0.4rem" }}>
                      <span className="receipt-brandline" style={{ fontSize: "0.7rem" }}>PROTOCOL Q&A</span>
                      <span className="lend-faq-question-text">{item.question}</span>
                    </div>
                    <div className="lend-faq-icon">
                      <div className="lend-faq-icon-line" />
                      <div className="lend-faq-icon-line" />
                    </div>
                  </button>
                  <div
                    id={answerId}
                    className={`lend-faq-answer-wrapper${isOpen ? " is-open" : ""}`}
                    aria-hidden={!isOpen}
                  >
                    <div className="lend-faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="lend-final" ref={reveal}>
          <div className="lend-reveal--1">
            <span className="lend-section-kicker">{copy.final.kicker}</span>
            <h2>{copy.final.title}</h2>
            <p>{copy.final.body}</p>

            <div className="lend-cta-row">
              <Link className="lend-primary" to="/auth">
                {copy.final.primary}
              </Link>
              <div className="lend-inline-links">
                <Link className="lend-secondary" to="/dev">
                  {copy.footer.api}
                </Link>
                <Link className="lend-secondary" to="/enterprise">
                  {copy.footer.b2b}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="lend-footer">
          <div className="lend-footer-links">
            <Link to="/privacy">{copy.footer.privacy}</Link>
            <Link to="/terms">{copy.footer.terms}</Link>
            <Link to="/dev">{copy.footer.api}</Link>
            <Link to="/enterprise">{copy.footer.b2b}</Link>
            <Link to="/auth">{copy.footer.console}</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
