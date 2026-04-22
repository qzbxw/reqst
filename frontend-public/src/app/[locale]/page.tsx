"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";

const BOT_URL = "https://t.me/reqstxyz_bot";

const COPY = {
  ru: {
    hero: {
      title: "Забирайте 100% своей прибыли. Без комиссий с оборота.",
      body:
        "Профессиональный крипто-процессинг с моментальной выплатой на ваши кошельки. Мы автоматизируем прием платежей, пока вы занимаетесь ростом бизнеса.",
      subcopy:
        "Non-custodial инфраструктура. Ваши деньги никогда не касаются наших счетов.",
      primary: "Запустить прием платежей",
      secondary: "Открыть в Telegram",
      badges: ["Direct-to-Wallet", "Telegram Native", "0% комиссии", "API Beta", "B2B решение"],
    },
    heroPanel: {
      eyebrow: "live demo",
      title: "Протестируйте оплату",
      body: "Почувствуйте, насколько легко вашим клиентам будет совершать платежи. Без задержек, ошибок и лишних действий.",
      amount: "149 USDT",
      invoice: "REQST-DEMO-149",
      status: "Ожидает оплату",
      primary: "Попробовать демо",
      secondary: "Личный кабинет",
      helper: "Никаких скрытых платежей. Только фиксированная подписка.",
      chips: ["TON", "TRON", "Base", "0% FEE"],
    },
    overview: {
      kicker: "АВТОМАТИЗАЦИЯ",
      title: "Ваше время стоит дороже.",
      body:
        "Перестаньте вручную проверять транзакции и ждать скриншоты в чатах. Reqst полностью берет на себя мониторинг блокчейна 24/7, подтверждая платежи за секунды.",
      cards: [
        {
          title: "Командный центр",
          body: "Управление проектами, инвойсами и аналитикой в одном интерфейсе.",
        },
        {
          title: "Доверие по умолчанию",
          body: "Чистый интерфейс оплаты, который исключает ошибки и сомнения клиентов.",
        },
        {
          title: "Полная автоматизация",
          body: "API и вебхуки для мгновенной выдачи доступа сразу после оплаты.",
        },
      ],
    },
    capabilities: {
      kicker: "ТЕХНОЛОГИИ",
      title: "Инфраструктура, которая экономит ваши деньги.",
      body: "Мы убрали всё лишнее, оставив только скорость, безопасность и прозрачность.",
      items: [
        {
          kicker: "01",
          title: "Direct-to-Wallet",
          body: "Средства поступают напрямую от клиента на ваш адрес. Мы не являемся кастодианом и не удерживаем ваши деньги ни на секунду.",
        },
        {
          kicker: "02",
          title: "Все ликвидные сети",
          body: "Полная поддержка TON, TRON (USDT), Solana и популярных L2-решений (Base, Arbitrum, BSC) в едином интерфейсе.",
        },
        {
          kicker: "03",
          title: "Смарт-трекинг",
          body: "Интеллектуальная система мониторинга автоматически распознает недоплаты и переплаты, уведомляя вас мгновенно.",
        },
        {
          kicker: "04",
          title: "Внутри Telegram",
          body: "Выставляйте счета, следите за уведомлениями и управляйте проектами через официального бота без перехода в браузер.",
        },
        {
          kicker: "05",
          title: "Flat Fee Model",
          body: "Забудьте о комиссиях с оборота. Вы платите только за использование платформы, сохраняя 100% прибыли при любых объемах.",
        },
        {
          kicker: "06",
          title: "Enterprise Ready",
          body: "Инструменты для командной работы, гибкое управление API-ключами и расширенные лимиты для масштабных задач.",
        },
      ],
    },
    compare: {
      kicker: "ЭВОЛЮЦИЯ",
      title: "Эффективность по умолчанию.",
      body: "Как Reqst оптимизирует процессы и сохраняет ваше время.",
      rows: [
        {
          legacy: "Ручная проверка транзакций и скриншотов.",
          reqst: "Мгновенное подтверждение и авто-уведомления.",
        },
        {
          legacy: "Ошибки в сетях и суммах платежей.",
          reqst: "QR-коды и автоматическая обработка ошибок.",
        },
        {
          legacy: "Комиссии шлюзов, съедающие прибыль.",
          reqst: "0% комиссии с оборота. 100% прибыли — ваши.",
        },
      ],
    },
    networks: {
      kicker: "СЕТИ",
      title: "Будьте там, где ваши деньги.",
      body: "Полная поддержка самых ликвидных протоколов для мгновенных расчетов и минимальных издержек.",
      rails: [
        {
          name: "TON",
          title: "The Open Network",
          body: "Нативный выбор для Telegram-бизнеса и быстрорастущей экосистемы TON.",
        },
        {
          name: "TRON",
          title: "TRON Network",
          body: "Глобальный стандарт для USDT-платежей с высокой пропускной способностью.",
        },
        {
          name: "SOL",
          title: "Solana",
          body: "Максимальная скорость и технологичность для тех, кто ценит каждую секунду.",
        },
        {
          name: "EVM",
          title: "EVM & L2",
          body: "Base, Arbitrum, BSC — принимайте ликвидность в любой популярной сети.",
        },
      ],
      soon: {
        title: "Скоро",
        api: "Public API 2.0 Beta",
        b2b: "Командный доступ",
        body: "Мы постоянно расширяем возможности для крупного бизнеса.",
      },
    },
    dogfooding: {
      kicker: "ПРОВЕРЕНО НА СЕБЕ",
      title: "Создано для себя. Масштабировано для вас.",
      cards: [
        {
          title: "100% Нагрузки",
          body: "Каждый цент, заработанный Reqst, проходит через этот же движок. Мы не используем сторонние шлюзы."
        },
        {
          title: "Главный мерчант",
          body: "Мы — свой самый требовательный клиент. Если функция не идеальна для нас, она не попадет к вам."
        },
        {
          title: "Инженерная точность",
          body: "Мы отшлифовали логику на тысячах собственных транзакций, предусмотрев любые аномалии в сетях еще до публичного запуска."
        }
      ]
    },
    pricing: {
      kicker: "ТАРИФЫ",
      title: "Гибкая подписка под любой масштаб.",
      pro: {
        name: "Reqst PRO",
        price: "39",
        trial: "Первые 15 чекаутов — бесплатно",
        features: ["Безлимитные продажи", "Ручное подтверждение недоплат", "0% комиссия (Direct-to-Wallet)", "Мгновенные уведомления"],
        cta: "Начать работу"
      },
      api: {
        name: "Reqst API Beta",
        price: "199",
        features: ["Полный REST API доступ", "Webhook уведомления", "Автоматизация оплат", "Интеграция в ваш бэкэнд"],
        cta: "Подробнее об API"
      },
      enterprise: {
        name: "Enterprise",
        price: "Custom",
        features: ["Индивидуальные RPM лимиты", "Персональная поддержка", "B2B контракты", "SLA гарантии"],
        cta: "Связаться с нами"
      }
    },
    faq: {
      kicker: "FAQ",
      title: "Детали протокола.",
      body: "Кратко о самом важном: безопасность активов, механика выплат и интеграция.",
      items: [
        {
          question: "Как Reqst обеспечивает безопасность моих средств?",
          answer: "Мы используем non-custodial архитектуру. Это значит, что ваши приватные ключи никогда не покидают ваше устройство, а средства поступают от клиента напрямую на ваш адрес. Reqst лишь мониторит блокчейн и уведомляет о транзакциях.",
        },
        {
          question: "Какие именно сети и активы поддерживаются?",
          answer: "В данный момент мы поддерживаем TON, TRON (USDT), Solana и основные EVM-сети (Base, BSC, Arbitrum). Мы постоянно добавляем новые ликвидные протоколы по запросам наших Enterprise-клиентов.",
        },
        {
          question: "Могу ли я автоматизировать выдачу цифровых товаров?",
          answer: "Да. Наша система Webhooks мгновенно уведомляет ваш сервер о подтверждении оплаты. Это позволяет автоматизировать выдачу доступов, подписок или товаров без ручного вмешательства.",
        },
        {
          question: "Как обрабатываются недоплаты или ошибки в сумме?",
          answer: "Reqst интеллектуально распознает любые отклонения от ожидаемой суммы. В случае недоплаты система пометит транзакцию как Underpaid, и вы сможете решить: запросить доплату или подтвердить заказ вручную.",
        },
      ],
    },
    final: {
      kicker: "СТАРТ",
      title: "Масштабируйте ваш бизнес с Reqst.",
      body: "Присоединяйтесь к лидерам рынка, которые уже автоматизировали прием крипто-платежей и забыли о ручных проверках транзакций.",
      primary: "Начать работу сейчас",
      secondary: "Документация",
    },
    footer: {
      title: "reqst",
      body: "Автоматизация крипто-платежей с прямыми выплатами на ваш кошелек. Честно, быстро, профессионально.",
      product: "Продукт",
      privacy: "Приватность",
      terms: "Условия",
      console: "Консоль",
      status: "Роадмап",
      api: "API",
      b2b: "B2B",
    },
  },
  en: {
    hero: {
      title: "Keep 100% of Your Profit. Zero Turnover Fees.",
      body:
        "Professional crypto processing with instant payouts directly to your wallets. We automate payment acceptance while you scale your business.",
      subcopy:
        "Non-custodial infrastructure. Your money never touches our accounts.",
      primary: "Start Accepting Payments",
      secondary: "Open in Telegram",
      badges: ["Direct-to-Wallet", "Telegram Native", "0% Fee", "API Beta", "B2B Scale"],
    },
    heroPanel: {
      eyebrow: "live demo",
      title: "Test the Experience",
      body: "Experience firsthand how seamless payments are for your customers. No delays, no friction, just results.",
      amount: "149 USDT",
      invoice: "REQST-DEMO-149",
      status: "Awaiting payment",
      primary: "Try Live Demo",
      secondary: "Merchant Dashboard",
      helper: "No hidden fees. Just a simple flat subscription.",
      chips: ["TON", "TRON", "Base", "0% FEE"],
    },
    overview: {
      kicker: "AUTOMATION",
      title: "Buy Your Time Back.",
      body:
        "Stop chasing manual verifications and waiting for screenshots. Reqst handles blockchain monitoring 24/7, confirming payments in seconds.",
      cards: [
        {
          title: "Command Center",
          body: "Manage projects, invoices, and analytics in one interface.",
        },
        {
          title: "Trust by Default",
          body: "A clean checkout UI that eliminates friction and builds trust.",
        },
        {
          title: "Full Automation",
          body: "API and webhooks for instant delivery right after payment.",
        },
      ],
    },
    capabilities: {
      kicker: "TECHNOLOGY",
      title: "Infrastructure That Saves You Money.",
      body: "We've removed the noise, leaving only speed, security, and transparency.",
      items: [
        {
          kicker: "01",
          title: "Direct-to-Wallet",
          body: "Funds go directly from the client to your address. We are non-custodial and never hold your money for a single second.",
        },
        {
          kicker: "02",
          title: "All Liquid Chains",
          body: "Full support for TON, TRON (USDT), Solana, and popular L2 solutions (Base, Arbitrum, BSC) in a single interface.",
        },
        {
          kicker: "03",
          title: "Smart Tracking",
          body: "An intelligent monitoring system automatically detects underpayments and overpayments, notifying you instantly.",
        },
        {
          kicker: "04",
          title: "Inside Telegram",
          body: "Issue invoices, track notifications, and manage projects through the official bot without switching to a browser.",
        },
        {
          kicker: "05",
          title: "Flat Fee Model",
          body: "Forget about turnover commissions. You only pay for platform usage, keeping 100% of your profit at any volume.",
        },
        {
          kicker: "06",
          title: "Enterprise Ready",
          body: "Tools for teamwork, flexible API key management, and expanded limits for large-scale tasks.",
        },
      ],
    },
    compare: {
      kicker: "EVOLUTION",
      title: "Efficiency by default.",
      body: "How Reqst optimizes your operations and saves your time.",
      rows: [
        {
          legacy: "Manual verification and chasing screenshots.",
          reqst: "Instant blockchain confirmation and automated alerts.",
        },
        {
          legacy: "Dealing with wrong amounts and network errors.",
          reqst: "Smart UI with QR codes and automatic edge-case handling.",
        },
        {
          legacy: "Gateway fees eating into your profit margin.",
          reqst: "Zero turnover fees. Flat subscription. 100% yours.",
        },
      ],
    },
    networks: {
      kicker: "NETWORKS",
      title: "Ubiquitous Connectivity.",
      body: "Native support for the most liquid protocols. Low fees, instant confirmation, maximum reach.",
      rails: [
        {
          name: "TON",
          title: "The Open Network",
          body: "The native choice for Telegram-based commerce and the growing TON ecosystem.",
        },
        {
          name: "TRON",
          title: "TRON Network",
          body: "The global standard for USDT settlement with high throughput and low costs.",
        },
        {
          name: "SOL",
          title: "Solana",
          body: "Unrivaled speed and efficiency for businesses that can't afford to wait.",
        },
        {
          name: "EVM",
          title: "EVM & L2",
          body: "Base, Arbitrum, BSC — capture liquidity across any popular blockchain.",
        },
      ],
      soon: {
        title: "Coming Soon",
        api: "Public API 2.0 Beta",
        b2b: "Team Access",
        body: "Constantly expanding features for enterprise businesses.",
      },
    },
    dogfooding: {
      kicker: "SKIN IN THE GAME",
      title: "Built for Us. Scaled for You.",
      cards: [
        {
          title: "100% Load",
          body: "Every cent earned by Reqst flows through this exact engine. We don’t use third-party gateways."
        },
        {
          title: "Anchor Merchant",
          body: "We are our own most demanding customer. If a feature isn’t perfect for us, it doesn't reach you."
        },
        {
          title: "Hardened Logic",
          body: "Optimized through thousands of internal transactions to handle every complex blockchain edge case with precision."
        }
      ]
    },
    pricing: {
      kicker: "PRICING",
      title: "Flexible scale. Zero commissions.",
      pro: {
        name: "Reqst PRO",
        price: "39",
        trial: "First 15 checkouts for free",
        features: ["Unlimited Invoice Sales", "Underpayment Manual Override", "0% Fees (Direct-to-Wallet)", "Instant Payout Alerts"],
        cta: "Get Started"
      },
      api: {
        name: "Reqst API Beta",
        price: "199",
        features: ["Full REST API Access", "Webhook Automation", "Backend Integration", "Automated Payments"],
        cta: "Explore API"
      },
      enterprise: {
        name: "Enterprise",
        price: "Custom",
        features: ["Custom RPM Rate Limits", "Priority B2B Support", "Enterprise Contracts", "SLA Guarantees"],
        cta: "Contact Sales"
      }
    },
    faq: {
      kicker: "FAQ",
      title: "Protocol Details.",
      body: "Essential insights on asset security, payment mechanics, and platform integration.",
      items: [
        {
          question: "How does Reqst ensure the security of my funds?",
          answer: "We utilize a non-custodial architecture. This means your private keys never leave your device, and funds are sent directly from the client to your address. Reqst only monitors the blockchain and provides transaction notifications.",
        },
        {
          question: "Which networks and assets are currently supported?",
          answer: "We currently support TON, TRON (USDT), Solana, and major EVM chains (Base, BSC, Arbitrum). We are continuously adding new liquid protocols based on enterprise-tier demands.",
        },
        {
          question: "Can I automate the delivery of digital goods?",
          answer: "Absolutely. Our Webhook system provides instantaneous notifications to your server upon payment confirmation, enabling full automation of access, subscriptions, or digital delivery.",
        },
        {
          question: "How are underpayments or incorrect amounts handled?",
          answer: "Reqst intelligently detects any deviations from the expected amount. If an underpayment occurs, the transaction is flagged as 'Underpaid,' allowing you to either request the balance or manually approve the order.",
        },
      ],
    },
    final: {
      kicker: "GET STARTED",
      title: "Scale Your Business with Reqst.",
      body:
        "Join industry leaders who have already automated their crypto processing and eliminated manual overhead.",
      primary: "Get Started Now",
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

export default function Page(props: { params: Promise<{ locale: string }> }) {
  const params = use(props.params);
  const language = params.locale as "ru" | "en";
  const copy = COPY[language];
  const [openFaq, setOpenFaq] = useState(0);
  const reveal = useReveal();

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

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
            <Link className="lend-brand" href={`/${language}`}>
              <strong>reqst</strong>
            </Link>

            <div className="lend-topbar-actions">
              <div className="lend-language" role="group" aria-label="language switcher">
                <Link href="/ru" className={language === "ru" ? "active" : ""}>RU</Link>
                <Link href="/en" className={language === "en" ? "active" : ""}>EN</Link>
              </div>
            </div>
          </div>
        </header>

        <section className="lend-hero" ref={reveal}>
          <div className="lend-hero-copy">
            <h1 className="lend-reveal--1">{copy.hero.title}</h1>
            <p className="lend-reveal--2">{copy.hero.body}</p>
            <p className="lend-hero-subcopy lend-reveal--2">{copy.hero.subcopy}</p>

            <div className="lend-cta-row lend-reveal--3">
              <Link className="lend-primary" href="/app/auth">
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
                <h2>{copy.heroPanel.title}</h2>
                <p>{copy.heroPanel.body}</p>
              </div>

              <div className="lend-panel-actions">
                <Link className="lend-primary" href="/app/checkout/demo">
                  {copy.heroPanel.primary}
                </Link>
                <Link className="lend-secondary" href="/app/auth">
                  {copy.heroPanel.secondary}
                </Link>
              </div>
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
              <article key={card.title} className="lend-card lend-card--overview lend-spotlight-card" onMouseMove={handleMouseMove}>
                <div className="lend-card-spotlight" />
                <div className="lend-dogfood-glow" />
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
              <article key={feature.title} className="lend-card lend-card--feature lend-spotlight-card" onMouseMove={handleMouseMove}>
                <div className="lend-card-spotlight" />
                <div className="lend-dogfood-glow" />
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
                <div className="lend-compare-separator" />
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
              <article key={rail.title} className="lend-network-card lend-spotlight-card" onMouseMove={handleMouseMove}>
                <div className="lend-card-spotlight" />
                <div className="lend-dogfood-glow" />
                <div className="lend-network-badge">{rail.name}</div>
                <h3>{rail.title}</h3>
                <p>{rail.body}</p>
              </article>
            ))}
          </div>
        </section>
<section className="lend-stacked-section lend-dogfood-section" ref={reveal}>
  <div className="lend-section-copy lend-reveal--1">
    <span className="lend-section-kicker">{copy.dogfooding.kicker}</span>
    <h2>{copy.dogfooding.title}</h2>
  </div>

  <div className="lend-dogfood-grid lend-reveal--2">
    {copy.dogfooding.cards.map((card, idx) => (
      <div 
        key={card.title} 
        className="lend-dogfood-item lend-spotlight-card" 
        onMouseMove={handleMouseMove}
      >
        <div className="lend-card-spotlight" />
        <div className="lend-dogfood-glow" />
        <div className="lend-dogfood-content">
          <span className="lend-section-kicker">0{idx + 1}</span>
          <h3>{card.title}</h3>
          <p>{card.body}</p>
        </div>
      </div>
    ))}
  </div>
      </section>

      <section id="pricing" className="lend-stacked-section" ref={reveal}>
        <div className="lend-section-copy lend-reveal--1">
          <span className="lend-section-kicker">{copy.pricing.kicker}</span>
          <h2>{copy.pricing.title}</h2>
        </div>

        <div className="lend-pricing-grid lend-reveal--2">
          <div className="lend-pricing-card lend-pricing-card--pro lend-spotlight-card" onMouseMove={handleMouseMove}>
            <div className="lend-card-spotlight" />
            <div className="lend-dogfood-glow" />
            <div className="lend-pricing-badge">{copy.pricing.pro.trial}</div>
            <h3>{copy.pricing.pro.name}</h3>
            <div className="lend-price">
              <span>$</span>
              {copy.pricing.pro.price}
              <span>/mo</span>
            </div>
            <ul>
              {copy.pricing.pro.features.map(f => <li key={f}>{f}</li>)}
            </ul>
            <Link className="lend-primary" href="/app/auth">{copy.pricing.pro.cta}</Link>
          </div>

          <div className="lend-pricing-card lend-spotlight-card" onMouseMove={handleMouseMove}>
            <div className="lend-card-spotlight" />
            <div className="lend-dogfood-glow" />
            <h3>{copy.pricing.api.name}</h3>
            <div className="lend-price">
              <span>$</span>{copy.pricing.api.price}<span>/mo</span>
            </div>
            <ul>
              {copy.pricing.api.features.map(f => <li key={f}>{f}</li>)}
            </ul>
            <Link className="lend-secondary" href={`/${language}/dev`}>{copy.pricing.api.cta}</Link>
          </div>

          <div className="lend-pricing-card lend-spotlight-card" onMouseMove={handleMouseMove}>
            <div className="lend-card-spotlight" />
            <div className="lend-dogfood-glow" />
            <h3>{copy.pricing.enterprise.name}</h3>
            <div className="lend-price">
              {copy.pricing.enterprise.price}
            </div>
            <ul style={{ marginTop: copy.pricing.enterprise.price === 'Custom' ? '2.5rem' : '0' }}>
              {copy.pricing.enterprise.features.map(f => <li key={f}>{f}</li>)}
            </ul>
            <Link className="lend-secondary" href={`/${language}/enterprise`}>{copy.pricing.enterprise.cta}</Link>
          </div>
        </div>
      </section>

      <section id="faq" className="lend-faq-section" ref={reveal}>
          <div className="lend-section-copy lend-faq-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.faq.kicker}</span>
            <h2>{copy.faq.title}</h2>
            <p>{copy.faq.body}</p>
          </div>

          <div className="lend-faq-stack lend-reveal--2">
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
                    <div className="lend-faq-trigger-copy">
                      <span className="lend-faq-kicker">Protocol Q&A</span>
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
              <Link className="lend-primary" href="/app/auth">
                {copy.final.primary}
              </Link>
              <div className="lend-inline-links">
                <Link className="lend-secondary" href={`/${language}/dev`}>
                  {copy.footer.api}
                </Link>
                <Link className="lend-secondary" href={`/${language}/enterprise`}>
                  {copy.footer.b2b}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="lend-footer">
          <div className="lend-footer-links">
            <Link href={`/${language}/privacy`}>{copy.footer.privacy}</Link>
            <Link href={`/${language}/terms`}>{copy.footer.terms}</Link>
            <Link href="/app/developers">Docs</Link>
            <Link href={`/${language}/dev`}>{copy.footer.api}</Link>
            <Link href={`/${language}/enterprise`}>{copy.footer.b2b}</Link>
            <Link href="/app/auth">{copy.footer.console}</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
