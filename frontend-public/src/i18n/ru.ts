const ru = {
    hero: {
      title: "Протокол для цифрового дохода.",
      body:
        "Non-custodial инфраструктура для масштабирования. Выплаты direct-to-wallet, 0% комиссии с оборота и нативная поддержка мультичейна в едином ядре.",
      subcopy:
        "Создано для Telegram, SaaS и глобальной коммерции.",
      primary: "Запустить Консоль",
      secondary: "Документация",
      badges: ["Direct-to-Wallet", "0% комиссии", "Non-Custodial", "High-Throughput"],
    },
    heroPanel: {
      eyebrow: "Инфраструктура",
      title: "Производительность",
      body: "Испытайте чистую эффективность с нашим оптимизированным протоколом мониторинга блокчейна.",
      amount: "149.00 USDT",
      invoice: "REQST-INFRA-99",
      status: "Подтвержден",
      primary: "Демо Оплата",
      secondary: "Консоль",
      helper: "Фиксированная подписка. Безлимитный объем.",
      chips: ["TON", "TRON", "SOL", "BASE"],
    },
    bento: {
      kicker: "ИНФРАСТРУКТУРА",
      title: "Для следующего миллиарда транзакций.",
      items: [
        {
          id: "api",
          title: "Unified API v1",
          body: "Высокопроизводительный шлюз для всех ликвидных сетей. Одна интеграция — бесконечный охват.",
          kicker: "ИНТЕГРАЦИЯ",
          size: "large"
        },
        {
          id: "checkout",
          title: "Smart Checkout",
          body: "Чистый интерфейс оплаты с высокой конверсией, оптимизированный под любые платформы.",
          kicker: "UX",
          size: "medium"
        },
        {
          id: "direct",
          title: "Direct Payouts",
          body: "Доход идет напрямую на ваши кошельки. Мы никогда не касаемся и не удерживаем ваши средства.",
          kicker: "ДОВЕРИЕ",
          size: "small"
        },
        {
          id: "monitoring",
          title: "Real-time Watchers",
          body: "Мониторинг блокчейна с низкой задержкой и умным распознаванием недоплат.",
          kicker: "СТАБИЛЬНОСТЬ",
          size: "small"
        },
        {
          id: "tg",
          title: "Telegram Native",
          body: "Управляйте потоком доходов и инфраструктурой через нашего официального бота.",
          kicker: "NATIVE",
          size: "small"
        }
      ]
    },
    useCases: {
      kicker: "КЕЙСЫ",
      title: "Проверено в самых сложных условиях.",
      tabs: [
        { id: "tg-shops", title: "TG Магазины", body: "Автоматизируйте продажи товаров внутри Telegram с мгновенной выдачей доступов.", cta: "Исследовать TG Commerce" },
        { id: "saas", title: "SaaS Биллинг", body: "Надежная инфраструктура для софта. Плоские тарифы означают больше маржи для вашего бизнеса.", cta: "Оптимизировать Маржу" },
        { id: "digital", title: "Цифровые товары", body: "Мгновенная доставка ключей и аккаунтов сразу после подтверждения транзакции в сети.", cta: "Масштабировать Автоматику" },
        { id: "communities", title: "Сообщества", body: "Автоматизация доступа в приватные группы с логикой рекуррентных платежей.", cta: "Управлять Участниками" },
      ]
    },
    networks: {
      kicker: "СЕТИ",
      title: "Глобальная связность.",
      list: ["TON", "TRON", "SOLANA", "BASE", "ARBITRUM", "BSC", "ETHEREUM"],
      rails: [
        {
          name: "TON",
          body: "Нативный выбор для Telegram-бизнеса и быстрорастущей экосистемы TON.",
        },
        {
          name: "TRON",
          body: "Глобальный стандарт для USDT-платежей с высокой пропускной способностью.",
        },
        {
          name: "SOL",
          body: "Максимальная скорость и технологичность для тех, кто ценит каждую секунду.",
        },
        {
          name: "EVM",
          body: "Base, Arbitrum, BSC — принимайте ликвидность в любой популярной сети.",
        },
        {
          name: "BASE",
          body: "Оптимистичный L2 от Coinbase, предлагающий низкие комиссии и безопасность Ethereum.",
        },
        {
          name: "BSC",
          body: "Высокопроизводительная сеть с одной из крупнейших экосистем активных пользователей.",
        },
        {
          name: "ARBITRUM",
          body: "Ведущий Layer-2 для Ethereum, обеспечивающий масштабируемость профессионального уровня.",
        }
      ]
    },
    compare: {
      kicker: "ЭВОЛЮЦИЯ",
      title: "Преимущество Reqst.",
      rows: [
        {
          legacy: "Ручная проверка транзакций и скриншотов.",
          reqst: "Авто-вотчеры блокчейна и мгновенные алерты.",
        },
        {
          legacy: "Комиссии шлюзов (1-5%), съедающие прибыль.",
          reqst: "0% комиссии с оборота. 100% прибыли — ваши.",
        },
        {
          legacy: "Кастодиальные риски и задержки выплат.",
          reqst: "Non-custodial. Direct-to-wallet. Ликвидность сразу.",
        },
      ],
    },
    pricing: {
      kicker: "ДОСТУП",
      title: "Прозрачные цены. Без комиссий.",
      merchant: {
        name: "Merchant",
        price: "39",
        trial: "Бесплатно в тест-моде",
        features: ["Direct-to-Wallet выплаты", "Ручное управление счетами", "0% комиссия с оборота", "Стандартная аналитика"],
        cta: "Активировать Merchant"
      },
      developer: {
        name: "Developer",
        price: "199",
        features: ["Полный API & Webhooks", "50k запросов в месяц", "3 места / воркспейса", "Приоритетная поддержка"],
        cta: "Активировать Developer"
      },
      business: {
        name: "Business",
        price: "499",
        features: ["200k запросов в месяц", "10 мест / воркспейсов", "Продвинутая аналитика", "Выделенная поддержка"],
        cta: "Активировать Business"
      },
      enterprise: {
        name: "Enterprise",
        price: "Custom",
        features: ["Безлимитные запросы", "Неограниченно мест", "Custom SLA / B2B", "Прямой канал с Dev"],
        cta: "Связаться"
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
        {
          question: "Нужно ли проходить KYC для начала работы?",
          answer: "Нет. Так как мы работаем исключительно как non-custodial middleware и не касаемся фиатных средств, мы не требуем прохождения KYC от мерчантов. Вы можете начать принимать платежи сразу после регистрации.",
        },
        {
          question: "Есть ли лимит на количество создаваемых счетов?",
          answer: "Никаких лимитов на создание инвойсов нет. Вы можете генерировать миллионы ссылок на оплату. Наши тарифные планы ограничивают только количество API-запросов к нодам мониторинга.",
        },
        {
          question: "Что произойдет, если сеть (например, Solana) упадет?",
          answer: "Наши вотчеры распределены по множеству глобальных RPC-провайдеров. Если сеть останавливается, Reqst ставит задачи на мониторинг в очередь. Как только блокчейн возобновляет работу, все платежи будут автоматически подтверждены.",
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
      status: "Статус",
      api: "API",
      b2b: "B2B",
      company: "Компания",
      resources: "Ресурсы",
      solutions: "Решения",
      social: "Соцсети",
    },
    nav: {
      products: {
        title: "Продукты",
        checkout: { title: "Checkout", desc: "Конверсионная оплата" },
        api: { title: "API", desc: "Инфраструктура для разработчиков" },
        invoicing: { title: "Invoicing", desc: "Профессиональный биллинг" },
      },
      useCases: {
        title: "Кейсы",
        tgShops: "Telegram-магазины",
        saas: "SaaS биллинг",
        digital: "Цифровые товары",
        communities: "Закрытые сообщества",
      },
      networks: {
        title: "Сети",
        ton: "TON",
        tron: "TRON",
        solana: "Solana",
        base: "Base",
        bsc: "BSC",
        arbitrum: "Arbitrum",
      },
      pricing: {
        title: "Тарифы",
        merchant: "Merchant",
        developer: "Developer",
        business: "Business",
        enterprise: "Enterprise",
      },
      docs: "Docs",
      blog: "Blog",
      console: "Console",
    },
  marketing: {
    activate: "Активировать",
    activateVerb: "Активировать",
    seamlessFlow: "Бесшовный сценарий",
    useCases: "КЕЙСЫ",
    startIntegration: "Начать внедрение",
    docs: "Документация",
    networks: "СЕТИ",
    accept: "Запустить прием в",
    technicalDocs: "Техническая документация",
    tryDemo: "Попробовать демо",
    ogSubtitle: "Инфраструктура криптоплатежей нового поколения",
    checkoutProduct: {
      title: "Checkout: Бесшовная оплата для ваших клиентов",
      description: "Современный и быстрый интерфейс оплаты, который увеличивает конверсию и минимизирует ошибки.",
      kicker: "ПРОДУКТ",
      cards: [
        {
          title: "Адаптивность",
          body: "Идеально работает на мобильных устройствах, в браузерах и внутри Telegram WebApps.",
        },
        {
          title: "Умный мониторинг",
          body: "Автоматическое распознавание транзакций, обработка недоплат и переплат.",
        },
        {
          title: "Безопасность",
          body: "Non-custodial решение: средства идут напрямую на ваш кошелек.",
        },
      ],
    },
    invoicingProduct: {
      title: "Invoicing: Профессиональные счета для бизнеса",
      description: "Перестаньте использовать таблицы для выставления счетов. Reqst Invoicing предоставляет профессиональный способ выставления и контроля крипто-инвойсов.",
      kicker: "ПРОДУКТ",
      cards: [
        {
          title: "Персональные счета",
          body: "Создавайте брендированные ссылки на оплату на любую сумму с выбором сетей.",
        },
        {
          title: "Отслеживание статуса",
          body: "Обновления в реальном времени по каждому счету. Знайте точно, когда клиент оплатил.",
        },
        {
          title: "Управление клиентами",
          body: "Следите за историей платежей ваших клиентов в едином интерфейсе.",
        },
      ],
    },
    breadcrumbs: {
      home: "Главная",
      blog: "Блог",
      compare: "Сравнение",
      useCases: "Применение",
      networks: "Сети",
      products: "Продукты",
      invoicing: "Инвойсинг",
    },
    productsHub: {
      title: "Решения для любого масштаба бизнеса",
      description: "От простых ссылок на оплату до инфраструктуры корпоративного уровня. Выберите продукт, который подходит вашему бизнесу.",
      kicker: "ПРОДУКТЫ",
      checkout: {
        title: "Checkout",
        desc: "Готовый интерфейс оплаты с высокой конверсией и поддержкой всех основных сетей. Идеально для продажи цифровых товаров.",
        link: "Подробнее",
      },
      api: {
        title: "API и вебхуки",
        desc: "Полнофункциональная инфраструктура для разработчиков. Автоматизируйте платежи и масштабируйтесь уверенно.",
        link: "Подробнее",
      },
      invoicing: {
        title: "Инвойсинг",
        desc: "Профессиональные инструменты для B2B и фрилансеров. Выставляйте счета и управляйте клиентами в одном месте.",
        link: "Подробнее",
      }
    },
    networksHub: {
      title: "Универсальная связность блокчейнов",
      description: "Мы сокращаем разрыв между бизнесом и децентрализованной ликвидностью. Reqst поддерживает все основные протоколы.",
      kicker: "СЕТИ",
      explanation: "Все сети работают по принципу direct-to-wallet. Мы никогда не касаемся ваших средств, обеспечивая максимальную безопасность."
    },
    useCasesHub: {
      title: "Создано для реальной коммерции",
      description: "Узнайте, как различные индустрии используют Reqst для автоматизации своих крипто-операций.",
      kicker: "КЕЙСЫ",
    },
    compareHub: {
      title: "Умный способ приема крипты",
      description: "Посмотрите, как Reqst соотносится с ручной проверкой и традиционными кастодиальными шлюзами.",
      kicker: "СРАВНЕНИЕ",
    },
    statusHub: {
      title: "Статус систем",
      description: "Мониторинг инфраструктуры Reqst и доступности сетей в реальном времени.",
      kicker: "СТАТУС",
      allSystemsOperational: "Все системы работают штатно",
      operational: "Работает",
      services: "Основные сервисы",
      networks: "Доступность сетей",
      coreApi: "Core API",
      watchers: "Blockchain Watchers",
      checkout: "Checkout UI",
    },
  },
  plan: {
    back: "На главную",
    auth: "Консоль",
    discuss: "Обсудить условия",
    compareTitle: "Протокол",
    flowTitle: "Интеграция",
    priceTitle: "Доступ",
    priceSubtitle: "Неограниченный оборот. Фиксированная цена.",
    codeTitle: "Пример реализации",
    codeSubtitle: "Готов к продакшену за считанные минуты.",
    codeBody: "Бесшовная интеграция нашего протокола в ваш существующий рабочий процесс.",
    processingNote: "Мы используем non-custodial архитектуру. Все транзакции идут напрямую на ваши кошельки.",
    compareSectionTitle: "Архитектура прямого доступа",
    compareSectionBody: "Reqst работает как прозрачный программный слой (middleware). Транзакции идут напрямую от клиента к вам, минуя промежуточные счета. Мы лишь автоматизируем мониторинг через сеть высокопроизводительных нод.",
    merchant: {
      badge: "Reqst Merchant",
      title: "Принимайте криптоплатежи. 0% комиссии с оборота.",
      body: "Профессиональный дашборд для ручного и полуавтоматического приема платежей. Прямые выплаты на ваши кошельки и полный контроль над статусами инвойсов.",
      priceLabel: "39$",
      period: "в месяц",
      stats: [
        { value: "0%", label: "Fee" },
        { value: "100%", label: "Non-custodial" },
        { value: "Live", label: "Dashboard" },
        { value: "Basic", label: "Analytics" },
      ],
      features: [
        { title: "Unlimited Invoices", body: "Создавайте неограниченное количество счетов на любые суммы без дополнительных сборов." },
        { title: "Manual Override", body: "Возможность вручную подтвердить оплату в случае недоплаты или ошибки клиента." },
        { title: "Direct-to-Wallet", body: "Средства поступают напрямую от клиента на ваш адрес. Мы никогда не касаемся ваших денег." },
        { title: "Instant Alerts", body: "Мгновенные уведомления в Telegram о каждой новой транзакции." },
      ],
      flow: [
        { title: "Account Setup", body: "Быстрая регистрация через Telegram и добавление ваших реквизитов (TON, TRON, SOL, etc)." },
        { title: "Invoice Creation", body: "Генерация ссылки на оплату в пару кликов через удобный дашборд." },
        { title: "Real-time Tracking", body: "Отслеживание статуса платежа в блокчейне. Мы подтвердим транзакцию автоматически." },
      ],
      code: `// Manual Invoice Link
// https://reqst.xyz/app/checkout/demo
// No code required for Merchant plan.
// Just share the link and get paid.`
    },
    developer: {
      badge: "Reqst Developer",
      title: "Инфраструктура криптоплатежей. Контроль в ваших руках.",
      body: "Профессиональный API и Webhook-уведомления для автоматизации вашего бизнеса. Прямые выплаты и полная свобода от комиссий с оборота.",
      priceLabel: "199$",
      period: "в месяц",
      stats: [
        { value: "50k", label: "Requests/mo" },
        { value: "3", label: "Seats" },
        { value: "3", label: "Workspaces" },
        { value: "Standard", label: "Support" },
      ],
      features: [
        { title: "Webhook Delivery", body: "Гарантированная доставка уведомлений с автоматическими ретраями и HMAC подписью." },
        { title: "Real-time Monitoring", body: "Мониторинг транзакций в реальном времени. Обнаружение платежа происходит мгновенно." },
        { title: "Unified API v1", body: "Единый интерфейс для работы с 7+ сетями: TON, TRON, SOL, Base, Arbitrum и др." },
        { title: "Idempotency", body: "Встроенная защита от дублирования транзакций на уровне протокола API." },
      ],
      flow: [
        { title: "API Key Provisioning", body: "Генерация ключей rqst_live_. Управление правами доступа для интеграции в ваш бэкенд." },
        { title: "Webhook Config", body: "Настройка коллбэков с подписью HMAC-SHA256 для мгновенных уведомлений." },
        { title: "Automated Processing", body: "Наши вотчеры отслеживают транзакции 24/7, подтверждая платежи автоматически." },
      ],
      code: `// Create Invoice via Reqst API
const res = await fetch("https://api.reqst.xyz/v1/invoices", {
  method: "POST",
  headers: { "X-API-Key": "rqst_live_..." },
  body: JSON.stringify({
    title: "Order #99",
    base_amount_usd: "199.00",
    payable_network: "TON"
  })
});
const inv = await res.json();`
    },
    business: {
      badge: "Reqst Business",
      title: "Масштабируемый процессинг. Для растущих команд.",
      body: "Расширенные лимиты API, командный доступ и приоритетная поддержка для бизнеса с активным потоком платежей.",
      priceLabel: "499$",
      period: "в месяц",
      stats: [
        { value: "200k", label: "Requests/mo" },
        { value: "10", label: "Seats" },
        { value: "10", label: "Workspaces" },
        { value: "Priority", label: "Support" },
      ],
      features: [
        { title: "Advanced Analytics", body: "Глубокая аналитика платежей, конверсии и удержания клиентов по всем воркспейсам." },
        { title: "Team Collaboration", body: "Добавление до 10 участников в команду с гибким управлением ролями и правами." },
        { title: "Multi-Workspace", body: "Управление до 10 независимыми проектами в рамках одной подписки." },
        { title: "Extended Limits", body: "Повышенные квоты на запросы к API и количество активных вебхуков." },
      ],
      flow: [
        { title: "Team Onboarding", body: "Приглашение участников команды и распределение ролей для управления проектами." },
        { title: "Workspace Isolation", body: "Настройка независимых окружений для разных направлений вашего бизнеса." },
        { title: "Scale with Priority", body: "Работа с выделенными очередями мониторинга и приоритетной поддержкой 24/7." },
      ],
      code: `// Multi-Workspace Management
// Manage up to 10 workspaces
// Isolated API keys and team seats
// Advanced Analytics enabled`
    },
    enterprise: {
      badge: "Reqst Enterprise",
      title: "Корпоративный стандарт. Инфраструктура без границ.",
      body: "Индивидуальные лимиты, SLA гарантии и персональная поддержка для крупнейших игроков рынка.",
      priceLabel: "Custom",
      period: "индивидуально",
      stats: [
        { value: "1M+", label: "Requests/mo" },
        { value: "∞", label: "Seats" },
        { value: "SLA", label: "Guarantee" },
        { value: "Dedicated", label: "Support" },
      ],
      features: [
        { title: "Custom Rate Limits", body: "Индивидуальная настройка пропускной способности API под ваши пиковые нагрузки." },
        { title: "SLA & B2B Contracts", body: "Юридические гарантии доступности сервиса и работа по официальным контрактам." },
        { title: "Dedicated Engineering", body: "Прямой канал связи с core-разработчиками для консультаций и быстрой помощи." },
        { title: "Onboarding Assist", body: "Персональный менеджер для помощи в интеграции и миграции с других решений." },
      ],
      flow: [
        { title: "Infrastructure Audit", body: "Анализ ваших потоков платежей и проектирование оптимальной архитектуры мониторинга." },
        { title: "Dedicated Provisioning", body: "Развертывание изолированной инфраструктуры для максимальной надежности." },
        { title: "Hyper-scale Support", body: "Запуск с неограниченными лимитами под прямым присмотром нашей команды." },
      ],
      code: `// Enterprise SLA Integration
// 99.9% Uptime Guarantee
// Dedicated monitoring nodes
// 24/7 Incident Response
// Custom Webhook retry logic`
    },
  },
  legal: { privacy: {
      kicker: "PRIVACY POLICY",
      title: "PRIVACY POLICY AND DATA PROCESSING AGREEMENT",
      summary:
        "READ THIS DOCUMENT CAREFULLY. BY ACCESSING THE REQST SOFTWARE, DASHBOARD, API, OR PUBLIC CHECKOUT PAGES, YOU EXPLICITLY CONSENT TO THE DATA PRACTICES DESCRIBED HEREIN. IF YOU DO NOT AGREE, YOU MUST IMMEDIATELY CEASE ALL USE OF THE SERVICE.",
      updatedLabel: "Last Updated",
      operatorLabel: "Effective Date",
      metaItems: ["Last Updated: March 13, 2026", "Effective Date: March 13, 2026"],
      draftTitle: "Document Frame",
      draftBody:
        "This page preserves the provided Privacy text in English without translation.",
      draftItems: [
        "Scope: software, dashboard, API, Telegram bots, checkout pages",
        "Data reality: blockchain is public and immutable",
        "Storage: strictly necessary localStorage only",
        "Sharing: Telegram, RPC providers, cloud infrastructure, market oracles",
        "Retention: active account + disputes + technical logs",
      ],
      sections: [
        {
          title: "1. PREAMBLE AND SCOPE",
          paragraphs: [
            'This Privacy Policy (the "Policy") governs how reqst ("Company", "we", "us", "our") collects, processes, utilizes, and safeguards information when you ("Merchant", "User", "you") or your end-users ("Customers") interact with our software-as-a-service infrastructure, Telegram bots, API endpoints, and public checkout interfaces (collectively, the "Service").',
            "This Policy is designed to comply with global data protection principles while explicitly acknowledging the inherently public, immutable, and decentralized nature of cryptographic blockchain technology.",
          ],
        },
        {
          title: "2. THE FUNDAMENTAL REALITY OF BLOCKCHAIN DATA (CRITICAL NOTICE)",
          paragraphs: [
            "2.1. Public Ledgers: You and your Customers expressly acknowledge that blockchain networks (including but not limited to TON, TRON, Solana, Ethereum, Base, Arbitrum, and BSC) are decentralized, public ledgers.",
            '2.2. No Expectation of Privacy On-Chain: Wallet addresses, transaction hashes (TXIDs), timestamps, transfer amounts, and on-chain memos/comments are inherently public, permanently recorded, and accessible to anyone globally. The Company does not control these networks and cannot erase, obfuscate, or alter on-chain data. 2.3. Exemption from Deletion Requests: Requests to invoke the "Right to be Forgotten" or data erasure under the GDPR or CCPA cannot and will not apply to cryptographic data broadcasted to and confirmed on public blockchain networks.',
          ],
        },
        {
          title: "3. CATEGORIES OF DATA WE COLLECT",
          paragraphs: [
            'To operate the "Direct-to-Wallet" routing and notification architecture, we strictly minimize data collection to the following categories:',
            "3.1. Merchant Account Data: When a Merchant authenticates via the Telegram Mini App or Bot, we automatically collect and store:",
            "3.2. Operational Infrastructure Data (Merchant Provided): To facilitate the Service, the Merchant must configure and input:",
            "3.3. Customer and Transactional Metadata: When a Customer accesses a publicly generated checkout URL, we process:",
            "NOTE: We do NOT collect Customer names, Customer emails, Customer physical addresses, or any traditional KYC/AML documentation.",
          ],
          bullets: [
            "Telegram User ID (Primary unique identifier).",
            "Telegram Username.",
            "Email address (if voluntarily provided or required for specific billing tiers).",
            "Subscription plan status, activation dates, and suspension flags.",
            "Public blockchain wallet addresses (Destination Wallets).",
            "Preferred default networks.",
            "Webhook URL endpoints and associated cryptographic secrets (for HMAC-SHA256 signatures).",
            "Custom API key labels and generation metadata.",
            "Invoice metadata (e.g., Title, Base Amount in USD, Expiration Time).",
            "Ephemeral HTTP request data (IP addresses, User-Agent strings) strictly for DDoS mitigation, rate-limiting, and security routing.",
            "The matching algorithm parameters (e.g., Decimal Suffixes, TON Payment Comments).",
            "Captured on-chain events via our Watchers (TX Hash, Amount, Destination, Observed Timestamp).",
          ],
        },
        {
          title: "4. STRICT LIABILITY FOR INVOICE METADATA",
          paragraphs: [
            '4.1. Merchant Data Input: The Service allows Merchants to assign custom "Titles" to invoices. The Merchant expressly agrees NOT to input Personally Identifiable Information (PII) belonging to their Customers (e.g., "Invoice for John Doe\'s medical consultation") into the invoice title, payment comment, or webhook payloads.',
            "4.2. Public Checkout Exposure: Merchant acknowledges that the checkout URL is accessible to anyone holding the link. The public invoice ID, invoice title, payable amount, and destination address are visible on this page. The Company assumes zero liability for PII exposed due to the Merchant's failure to anonymize invoice metadata.",
          ],
        },
        {
          title: "5. LOCAL STORAGE, TOKENS, AND TRACKING",
          paragraphs: [
            "5.1. Explicit Rejection of Marketing Cookies: The Company does not utilize third-party advertising cookies, cross-site tracking pixels, or invasive analytics trackers.",
            "5.2. Functional Storage (localStorage): The frontend application utilizes browser localStorage strictly for technical and security necessities, including:",
            "By using the Service, you consent to the use of strictly necessary localStorage mechanisms. Disabling these will render the authenticated Merchant dashboard inoperable.",
          ],
          bullets: [
            "Storing JSON Web Tokens (JWT) for secure session persistence.",
            "Managing API authentication states.",
            "Storing minor UI/UX preferences.",
          ],
        },
        {
          title: "6. THIRD-PARTY SUB-PROCESSORS AND DATA SHARING",
          paragraphs: [
            "To monitor mempools and process transactions at scale, the Service inherently relies on third-party infrastructure. You consent to the transmission of necessary technical data (such as wallet addresses and block queries) to the following categories of Sub-processors:",
            "The Company is not responsible for the independent privacy practices of these third-party operators.",
          ],
          bullets: [
            "Telegram Messenger Inc.: For authentication, bot interactions, and Merchant notifications.",
            "RPC Node Providers: Third-party Remote Procedure Call infrastructure (e.g., TronGrid, TonCenter, and various EVM/Solana node providers) used to read the blockchain.",
            "Cloud Infrastructure: Secure database hosting (PostgreSQL) and server environments (e.g., AWS, DigitalOcean, or Cloudflare for edge routing).",
            "Market Oracles: Third-party APIs (e.g., CoinGecko) to fetch real-time USD to Digital Asset exchange rates.",
          ],
        },
        {
          title: "7. DATA RETENTION AND SECURITY",
          paragraphs: [
            "7.1. Retention Period: We retain Merchant Account Data and Invoice Metadata for as long as the Merchant's account is active, or as required to resolve disputes, enforce our Terms of Service, and fulfill technical logging requirements (e.g., webhook delivery logs).",
            '7.2. "As-Is" Security: While we implement industry-standard cryptographic hashing for API secrets and JWTs, no transmission over the internet or decentralized network is 100% secure. THE COMPANY DISCLAIMS ALL LIABILITY FOR UNAUTHORIZED ACCESS TO MERCHANT DASHBOARDS RESULTING FROM COMPROMISED TELEGRAM ACCOUNTS OR EXPOSED LOCAL STORAGE TOKENS ON THE MERCHANT\'S DEVICE.',
          ],
        },
        {
          title: "8. INTERNATIONAL AND CROSS-BORDER TRANSFERS",
          paragraphs: [
            "The Service operates on a globally distributed infrastructure. By utilizing the Service, you consent to the transfer, storage, and processing of your data in jurisdictions that may have different data protection regulations than your country of residence.",
          ],
        },
        {
          title: "9. EXEMPTION FROM REGULATORY REGIMES",
          paragraphs: [
            "Because the Company operates exclusively as non-custodial middleware and does not collect sensitive financial PII (such as bank account numbers, credit card details, or government-issued IDs), the Company operates outside the scope of traditional financial data privacy regulations like the Gramm-Leach-Bliley Act (GLBA) or the Payment Card Industry Data Security Standard (PCI-DSS).",
          ],
        },
        {
          title: "10. MODIFICATIONS TO THIS POLICY",
          paragraphs: [
            "We reserve the right to unilaterally update this Privacy Policy at any time to reflect changes in our technical infrastructure, API capabilities, or legal obligations. Your continued use of the Service following the posting of an updated Policy constitutes your irrevocable acceptance of the changes.",
          ],
        },
      ],
      footerNote: "The privacy document is rendered in English as provided, without translation.",
    }, terms: {
      kicker: "TERMS OF SERVICE",
      title: "TERMS OF SERVICE: COMPREHENSIVE END-USER LICENSE AND USAGE AGREEMENT",
      summary:
        "PLEASE READ THIS COMPREHENSIVE AGREEMENT CAREFULLY. IT CONTAINS A MANDATORY BINDING ARBITRATION CLAUSE, A CLASS ACTION WAIVER, AND EXTENSIVE DISCLAIMERS OF LIABILITY THAT MATERIALLY AFFECT YOUR LEGAL RIGHTS. BY ACCESSING, INTEGRATING, OR UTILIZING THE REQST SOFTWARE, API, OR WEBHOOKS, YOU EXPLICITLY AGREE TO BE BOUND BY THESE TERMS IN THEIR ENTIRETY.",
      updatedLabel: "Last Updated",
      operatorLabel: "Effective Date",
      metaItems: ["Last Updated: March 13, 2026", "Effective Date: March 13, 2026"],
      draftTitle: "Document Frame",
      draftBody:
        "This page preserves the provided Terms text in its original language mix and legal wording.",
      draftItems: [
        'Company: reqst',
        'Scope: software, API, webhooks, blockchain monitoring',
        'Model: non-custodial, direct-to-wallet',
        'Dispute flow: arbitration + class action waiver',
        'Liability cap: last three months of subscription fees',
      ],
      sections: [
        {
          title: "1. PREAMBLE AND ACCEPTANCE OF TERMS",
          paragraphs: [
            '1.1. Parties to the Agreement: This Terms of Service Agreement (the "Agreement") constitutes a legally binding contract between you (acting individually or on behalf of a corporate entity, hereinafter "Merchant", "Licensee", "User", "you", or "your") and reqst (hereinafter "Company", "we", "us", "our", or "Service Provider").',
            "1.2. Capacity to Contract: By utilizing the Service via Telegram authentication or our API, you represent and warrant that you are at least eighteen (18) years of age, possess the legal capacity to enter into this Agreement, and, if acting on behalf of a legal entity, possess the requisite authority to bind said entity.",
            "1.3. Modifications: We reserve the absolute, unilateral right to amend, modify, or append to this Agreement at any time. Continued use of the Service following the publication of any modifications constitutes your irrevocable acceptance of the amended terms.",
          ],
        },
        {
          title: '2. STRICT DEFINITION OF THE SERVICE (THE "MERE CONDUIT" DOCTRINE)',
          paragraphs: [
            '2.1. Software as a Service (SaaS): The "Service" refers exclusively to the proprietary, non-custodial software middleware provided by the Company. This includes the dashboard, checkout page generators, smart-matching algorithms, API endpoints, webhook delivery systems, and blockchain monitoring logic (the "Watchers").',
            "2.2. Non-Custodial Data Layer: You explicitly acknowledge that the Service operates strictly as an informational data layer and visual interface. The Service parses public, decentralized blockchain ledgers (e.g., TON, TRON, Solana, EVM-compatible chains) and visualizes this data.",
            "2.3. Zero Financial Intermediation: The Company is strictly not a payment processor, payment gateway, money transmitter, clearinghouse, custodian, fiduciary, or financial institution. At no point in the technical architecture does the Company receive, hold, control, or possess any fiat currency, digital assets, or cryptographic private keys belonging to the Merchant or the Merchant’s end-users (\"Customers\").",
            "2.4. Direct-to-Wallet Execution: All transfers of Digital Assets occur exclusively and directly on the public blockchain from the Customer's unhosted or custodial wallet directly to the Merchant's designated destination address.",
          ],
        },
        {
          title: "3. REGULATORY COMPLIANCE, KYC/AML, AND SANCTIONS",
          paragraphs: [
            "3.1. Exemption from Identity Verification: Because the Company does not process, transmit, or custody funds, the Company performs no Know Your Customer (KYC), Anti-Money Laundering (AML), or Counter-Terrorism Financing (CTF) verification on Merchants or Customers.",
            "3.2. Total Merchant Liability: The Merchant assumes 100% liability for conducting any required identity verification, regulatory compliance, and tax reporting concerning their Customers, as mandated by the Merchant's operating jurisdiction.",
            "3.3. Sanctions and OFAC Representations: The Merchant represents and warrants that they are not located in, under the control of, or a national or resident of any country or territory subject to comprehensive economic sanctions by the United Nations, European Union, or the U.S. Office of Foreign Assets Control (OFAC). The Company assumes no duty to monitor the geopolitical status of Merchants but reserves the right to terminate access immediately if a violation is suspected.",
            "3.4. Tax Indemnification: The Company shall not calculate, collect, remit, or report any sales, value-added (VAT), income, or other taxes arising from the Merchant's transactions. The Merchant bears sole responsibility for all tax liabilities.",
          ],
        },
        {
          title: "4. PROHIBITED CONDUCT AND ACCOUNT TERMINATION",
          paragraphs: [
            "4.1. Strictly Prohibited Uses: The Merchant explicitly agrees NOT to utilize the Service, checkout links, or API infrastructure to facilitate the sale, distribution, or promotion of:",
            "4.2. Unilateral Termination: The Company reserves the unappealable right to suspend, restrict, or permanently terminate any Merchant account, revoke API keys, and disable webhook functionality immediately, without prior notice or liability, if we, in our sole discretion, suspect a violation of Section 4.1 or determine that the Merchant's activities expose the Company to legal, regulatory, or reputational peril.",
          ],
          bullets: [
            "Illegal narcotics, controlled substances, or drug paraphernalia.",
            "Firearms, weapons, munitions, or explosive materials.",
            "Illicit or non-consensual adult content.",
            "Unlicensed or illegal gambling, lotteries, or betting platforms.",
            "Intellectual property infringement, counterfeit goods, or software piracy.",
            "Ponzi schemes, HYIPs, or fraudulent investment structures.",
          ],
        },
        {
          title: "5. TECHNICAL MECHANICS, PROTOCOLS, AND USER ERROR",
          paragraphs: [
            "5.1. Smart-Tracking and Exactness: To facilitate automated invoice status resolution, the Service employs a Smart-Tracking matching protocol. For TRON, Solana, and EVM networks, a unique decimal suffix (e.g., 0.000123) is appended to the payable amount. For the TON network, a mandatory unique payment comment (memo) is generated.",
            "5.2. Waiver of Liability for User Error: The Company bears absolutely ZERO liability for any financial loss, delayed access to digital goods, or unfulfilled invoices arising from:",
            "5.3. Irrevocability of Transactions: The Merchant acknowledges that blockchain transactions are mathematically immutable. The Company cannot reverse, refund, or alter any on-chain transfer. All dispute resolutions, underpayment negotiations, and refund processing are solely the responsibility of the Merchant.",
            "5.4. Third-Party RPC Reliance: The Service’s blockchain monitoring capabilities are wholly dependent on the stability, uptime, and accuracy of third-party Remote Procedure Call (RPC) node providers (e.g., TronGrid, TonCenter) and external oracle APIs (e.g., CoinGecko for fiat/crypto exchange rates). The Company is not liable for Service degradation, delayed webhooks, or failed mempool tracking caused by external RPC outages, rate-limiting, or public network congestion.",
          ],
          bullets: [
            "The Customer's failure to remit the exact mathematically generated payable amount (including the matching suffix).",
            "The Customer's failure to include the exact required payment comment/memo on the TON network.",
            "The Customer utilizing an incorrect or unsupported blockchain network (e.g., transmitting USDT via ERC-20 to a TRC-20 address, resulting in the permanent loss of assets).",
          ],
        },
        {
          title: "6. API, WEBHOOKS, AND INTEGRATION SLAs",
          paragraphs: [
            "6.1. API License: Subject to these Terms and active subscription status, the Company grants the Merchant a limited, non-exclusive, non-transferable, and revocable license to access the Reqst API (v1).",
            '6.2. Webhook Delivery and Idempotency: Webhook notifications are delivered on an "at-least-once" basis. Due to network conditions, duplicate webhooks may be transmitted. The Merchant is strictly required to implement Idempotency Safety on their servers to prevent duplicate order fulfillment.',
            "6.3. Cryptographic Verification: The Merchant must cryptographically verify all incoming webhooks using the X-Reqst-Signature header via HMAC-SHA256 algorithm. The Company disclaims any liability for unauthorized actions resulting from the Merchant's failure to validate webhook authenticity.",
          ],
        },
        {
          title: "7. SUBSCRIPTIONS, FEES, AND INTERNAL BILLING",
          paragraphs: [
            "7.1. Flat Fee Model: The Service operates on a flat-fee subscription basis (PRO, DEV, ENTERPRISE tiers) with a 0% turnover commission (Direct-to-Wallet).",
            "7.2. Internal Payment Processing: Subscription invoices issued by the Company to the Merchant are generated using the Service itself. Payments are routed directly to the Company's designated corporate wallets.",
            "7.3. No Refunds: All subscription payments made in Digital Assets are final and strictly NON-REFUNDABLE, regardless of the Merchant's actual usage of the Service, network conditions, or early termination of the account.",
          ],
        },
        {
          title: "8. INTELLECTUAL PROPERTY",
          paragraphs: [
            "8.1. Company Ownership: All rights, title, and interest in and to the Service, the Software, the API, the design, the architecture, and the codebase remain the exclusive intellectual property of the Company.",
            "8.2. No Transfer: This Agreement does not convey any ownership rights to the Merchant. You may not decompile, reverse engineer, disassemble, or attempt to derive the source code of the Service.",
          ],
        },
        {
          title: "9. DISCLAIMERS OF WARRANTY (ALL CAPS REQUIRED BY LAW)",
          paragraphs: [
            'THE SERVICE, API, AND ALL RELATED INFRASTRUCTURE ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. THE COMPANY EXPRESSLY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. THE COMPANY DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, ERROR-FREE, OR IMMUNE TO CYBERATTACKS, NOR DOES IT GUARANTEE THE CONTINUED EXISTENCE OR STABILITY OF ANY SPECIFIC BLOCKCHAIN NETWORK OR DIGITAL ASSET.',
          ],
        },
        {
          title: "10. ABSOLUTE LIMITATION OF LIABILITY",
          paragraphs: [
            "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE JURISPRUDENCE, IN NO EVENT SHALL THE COMPANY, ITS FOUNDERS, CORE DEVELOPERS, DIRECTORS, OR AFFILIATES BE LIABLE FOR ANY PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, LOSS OF REVENUE, LOSS OF DIGITAL ASSETS, LOSS OF GOODWILL, CORRUPTION OF DATA, OR BUSINESS INTERRUPTION, ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT OR THE USE OR INABILITY TO USE THE SERVICE.",
            'UNDER NO CIRCUMSTANCES SHALL THE COMPANY\'S TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY AND ALL CLAIMS EXCEED THE TOTAL AMOUNT OF SUBSCRIPTION FEES PAID BY YOU TO THE COMPANY IN THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM. IF YOU ARE ON A FREE "TRIAL" PLAN, THE COMPANY\'S AGGREGATE LIABILITY SHALL BE STRICTLY LIMITED TO ZERO DOLLARS ($0.00).',
          ],
        },
        {
          title: "11. INDEMNIFICATION",
          paragraphs: [
            "You agree to unconditionally defend, indemnify, and hold harmless the Company, its team, and affiliates from and against any claims, actions, demands, regulatory proceedings, liabilities, damages, and expenses (including reasonable legal and attorney fees) arising directly or indirectly from:",
          ],
          bullets: [
            "(a) Your breach of this Agreement.",
            "(b) Your violation of any applicable law or the rights of any third party.",
            "(c) The nature of the products, services, or content sold by you.",
            "(d) Any dispute between you and your Customers.",
          ],
        },
        {
          title: "12. FORCE MAJEURE AND BLOCKCHAIN ANOMALIES",
          paragraphs: [
            "The Company shall not be liable for any failure or delay in performance resulting from causes beyond our reasonable control, including but not limited to acts of God, war, terrorism, catastrophic cyberattacks, sweeping governmental bans on cryptocurrencies, ISP failures, or inherent blockchain anomalies (including 51% attacks, hard forks, catastrophic smart contract bugs on underlying networks like EVM or Solana).",
          ],
        },
        {
          title: "13. DISPUTE RESOLUTION, ARBITRATION, AND WAIVER OF CLASS ACTION",
          paragraphs: [
            "13.1. Binding Arbitration: Any dispute, controversy, or claim arising out of or relating to this Agreement, or the breach thereof, shall be settled by mandatory, binding, and confidential arbitration administered by [Insert Arbitration Association/Jurisdiction, e.g., the International Chamber of Commerce (ICC) or courts of Panama/BVI], rather than in court.",
            "13.2. Class Action Waiver: YOU AND THE COMPANY AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.",
          ],
        },
        {
          title: "14. SEVERABILITY AND ENTIRE AGREEMENT",
          paragraphs: [
            "If any provision of this Agreement is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that this Agreement shall otherwise remain in full force, effect, and enforceability. This Agreement constitutes the entire agreement between the parties relating to the subject matter hereof.",
          ],
        },
      ],
      footerNote: "The text above is rendered without translation and preserves the supplied wording structure for publication styling.",
    } },
} as const;

export default ru;
