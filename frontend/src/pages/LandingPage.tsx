import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useUI } from "../lib/ui";

const BOT_URL = "https://t.me/reqstxyz_bot";

const COPY = {
  ru: {
    nav: {
      caption: "crypto billing OS",
      overview: "Обзор",
      capabilities: "Фичи",
      networks: "Сети",
      faq: "FAQ",
      privacy: "Privacy",
      terms: "Terms",
      bot: "Telegram bot",
      console: "Открыть консоль",
    },
    hero: {
      kicker: "NON-CUSTODIAL • SUBSCRIPTION-FIRST • TELEGRAM-NATIVE",
      title: "reqst это полноценный лендинг-пойнт для приема крипты без кастодиального бреда.",
      body:
        "Сервис для solo sellers и маленьких digital-команд, которым нужен нормальный checkout, прямой прием оплаты в свой кошелек, понятные статусы инвойсов, seller notifications и фиксированная подписка вместо процента с оборота.",
      subcopy:
        "Reqst не забирает деньги на общий баланс, не хранит private keys и не живет на take rate. Покупатель платит продавцу напрямую, а reqst закрывает invoice flow, checkout UX и payment matching вокруг этой сделки.",
      primary: "Зайти в консоль",
      secondary: "Открыть Telegram bot",
      pills: [
        "0% с оборота",
        "39 USDT / 30 дней",
        "trial на 15 инвойсов",
        "public checkout links",
        "seller-owned wallets only",
        "late payment -> manual review",
      ],
      signals: [
        "Покупатель платит сразу на payout wallet продавца.",
        "Checkout, QR, таймер и статус уже собраны в публичной странице.",
        "Reqst сам продаёт свой PRO через этот же invoice backend.",
      ],
    },
    visual: {
      coreEyebrow: "reqst core",
      coreTitle: "pay direct",
      coreBody: "direct-to-wallet crypto billing layer",
      floaters: [
        {
          label: "routing",
          title: "seller-owned wallets",
          body: "Reqst не встаёт между продавцом и payout адресом как кастодиальная прослойка.",
        },
        {
          label: "matching",
          title: "TON comment / exact amount",
          body: "Матчинг строится на payload для TON и точной сумме с suffix для stablecoin flows.",
        },
        {
          label: "billing",
          title: "Reqst PRO через reqst",
          body: "Свою подписку сервис продаёт тем же checkout и тем же invoice lifecycle.",
        },
        {
          label: "status",
          title: "awaiting / paid / review",
          body: "Кривые и поздние оплаты не теряются, а попадают в понятные статусы.",
        },
      ],
    },
    marquee: [
      "non-custodial by default",
      "telegram mini app auth",
      "public invoice checkout",
      "seller notifications",
      "exact amount matching",
      "ton comment matching",
      "fixed subscription instead of take rate",
      "same backend for internal billing",
    ],
    overview: {
      kicker: "OVERVIEW",
      title: "Не просто генератор адресов, а цельный invoice-to-payment продукт.",
      body:
        "На лендинге важно показать не одну killer-фичу, а весь shape продукта. У reqst есть seller console, wallet buckets, invoice generation, public checkout, payment classification, seller notifications и собственный billing flow поверх того же движка.",
      cards: [
        {
          title: "Seller console",
          body: "Продавец управляет кошельками, инвойсами и статусами без хаоса в explorer-табах.",
        },
        {
          title: "Public checkout",
          body: "У покупателя есть понятная страница с адресом, QR, таймером, сетью и точной суммой.",
        },
        {
          title: "Payment state machine",
          body: "Exact, underpaid, expired и manual review уже встроены в модель, а не замазаны в поддержку.",
        },
      ],
    },
    capabilities: {
      kicker: "CAPABILITIES",
      title: "Что именно делает reqst как продукт.",
      body:
        "Обычный лендинг должен раскрывать систему, а не только слоган. Ниже ключевые возможности, на которых реально держится проект сейчас.",
      items: [
        {
          kicker: "01",
          title: "Non-custodial прием",
          body:
            "Buyer отправляет деньги прямо на seller wallet. Reqst не хранит private keys и не превращает payout в кастодиальный квест.",
        },
        {
          kicker: "02",
          title: "Подписка вместо комиссии",
          body:
            "Нет take rate за каждую оплату. Есть trial на 15 инвойсов и PRO за 39 USDT / 30 дней, поэтому рост продавца не превращается в налог в пользу платформы.",
        },
        {
          kicker: "03",
          title: "TON payload matching",
          body:
            "Для TON invoice создаёт comment вида REQST-... и backend матчится по payload плюс адресу продавца.",
        },
        {
          kicker: "04",
          title: "Stablecoin exact amount matching",
          body:
            "Для stablecoin flows используется точная сумма с уникальным suffix, чтобы invoice не приходилось сверять руками.",
        },
        {
          kicker: "05",
          title: "Консервативные статусы",
          body:
            "Поздние и underpaid кейсы не притворяются успешными. Они уходят в manual review или underpaid, чтобы продавец не жил в ложных подтверждениях.",
        },
        {
          kicker: "06",
          title: "Telegram-native experience",
          body:
            "Авторизация, seller notifications и операционный ритм сервиса завязаны на Telegram, а не на громоздкий backoffice ради backoffice.",
        },
      ],
    },
    compare: {
      kicker: "WHY IT HITS",
      title: "Чем reqst приятнее типичного crypto checkout stack.",
      body:
        "Нормальный лендинг должен быстро объяснить разницу между старым способом принимать оплату и тем, что даёт reqst в ежедневной работе.",
      rows: [
        {
          legacy: "Процент с каждого успешного платежа.",
          reqst: "Фиксированная подписка без штрафа за рост оборота.",
        },
        {
          legacy: "Деньги сначала попадают в баланс платформы.",
          reqst: "Оплата идёт сразу в wallet продавца.",
        },
        {
          legacy: "Explorer, чат, заметки и ручная сверка.",
          reqst: "Checkout, matching и invoice statuses уже связаны между собой.",
        },
        {
          legacy: "Внутренний billing живёт на отдельном костыле.",
          reqst: "Reqst продаёт свой PRO через тот же invoice flow.",
        },
      ],
    },
    networks: {
      kicker: "NETWORKS",
      title: "Рельсы оплаты и сетевые сценарии.",
      body:
        "В продукте уже заложены wallet buckets и payable rails под несколько сетей. Это не one-chain игрушка, а нормальная заготовка под multi-rail intake.",
      rails: [
        {
          name: "TON",
          title: "TON с payload matching",
          body: "Invoice создаёт comment и buyer платит в TON прямо на адрес продавца.",
          note: "Матчинг: seller address + comment.",
        },
        {
          name: "TRON",
          title: "TRON / USDT",
          body: "Стейбловый flow с exact amount matching и понятным checkout для buyer.",
          note: "Матчинг: unique payable amount.",
        },
        {
          name: "SOL",
          title: "Solana / USDC-USDT surface",
          body: "В product surface уже есть отдельный rail под Solana stablecoin intake.",
          note: "Подходит для seller, которому нужен отдельный Solana payout bucket.",
        },
        {
          name: "ETH",
          title: "EVM shared bucket",
          body: "Один seller wallet bucket обслуживает Ethereum, Base, Arbitrum и BSC сценарии.",
          note: "Это упрощает payout setup и не разносит продавца по куче отдельных адресов.",
        },
      ],
    },
    dogfood: {
      kicker: "DOGFOODING",
      title: "Reqst не просто обещает billing stack, он сидит на нём сам.",
      body:
        "Подписка PRO создаётся через тот же backend invoice service, уходит в тот же public checkout и проходит через тот же payment classification flow. Это важная часть доверия к продукту: если в механике есть слабое место, reqst ловит это на себе раньше клиента.",
      stack: [
        {
          label: "endpoint",
          title: "POST /api/billing/checkout",
          body: "Создаёт subscription invoice на 30 дней без расходования trial лимита продавца.",
        },
        {
          label: "invoice kind",
          title: "kind: subscription",
          body: "Billing intent уже зашит в модель invoice, а не живёт в отдельном ручном процессе.",
        },
        {
          label: "extension",
          title: "paid_exact -> PRO extended",
          body: "После наблюдаемой оплаты seller subscription продлевается тем же продуктовым пайплайном.",
        },
      ],
    },
    flow: {
      kicker: "FLOW",
      title: "Как продавец проходит путь от wallet setup до paid status.",
      body:
        "Это уже не короткий landing stub, поэтому здесь есть нормальный product flow: что именно делает seller, что видит buyer и что закрывает backend.",
      steps: [
        {
          title: "Подключи payout wallet",
          body: "TON, TRON, Solana или общий EVM bucket под Ethereum, Base, Arbitrum и BSC.",
        },
        {
          title: "Создай invoice",
          body: "Reqst рассчитывает payable amount, payload для TON или matching suffix для stablecoin сценария.",
        },
        {
          title: "Отправь checkout ссылку",
          body: "Buyer получает публичную страницу с точной суммой, сетью, адресом, QR и expiration timer.",
        },
        {
          title: "Backend классифицирует платеж",
          body: "Оплата проходит через invoice state machine: awaiting, paid, underpaid или manual review.",
        },
        {
          title: "Seller получает финальный operational signal",
          body: "Статус виден в консоли, а seller notifications помогают быстро закрывать заказ или разбирать edge cases.",
        },
      ],
    },
    fit: {
      kicker: "WHO IT FITS",
      title: "Кому такой продукт заходит сильнее всего.",
      body:
        "Reqst особенно хорошо садится туда, где важна скорость запуска, контроль над кошельком и отсутствие желания отдавать процент с каждой оплаты.",
      cases: [
        {
          title: "Фриланс и agency retainers",
          body: "Когда нужно быстро выставить invoice и не провалиться в ручную сверку каждой транзакции.",
        },
        {
          title: "Solo digital sellers",
          body: "Создатели, консультанты, дизайнеры, разработчики и маленькие команды, живущие в Telegram-ритме.",
        },
        {
          title: "Подписочные микропродукты",
          body: "Сервис уже сам продаёт свою подписку этим же потоком, так что recurring-thinking здесь естественный.",
        },
        {
          title: "Проекты, которые не хотят custody",
          body: "Если для тебя критично, чтобы деньги не лежали у чужой платформы, reqst попадает ровно в эту философию.",
        },
      ],
    },
    architecture: {
      kicker: "UNDER THE HOOD",
      title: "Из каких частей состоит продуктовый контур.",
      body:
        "На обычном лендинге хорошо работает блок, который показывает: это не магия и не один красивый экран, а рабочая система из нескольких связанных слоёв.",
      nodes: [
        {
          label: "auth",
          title: "Telegram sign-in",
          body: "Вход продавца строится вокруг Telegram Mini App auth и seller account model.",
        },
        {
          label: "wallets",
          title: "Wallet buckets",
          body: "Сервис хранит payout addresses и связывает payable networks с нужным seller bucket.",
        },
        {
          label: "invoices",
          title: "Invoice engine",
          body: "Invoice service создаёт public_id, сумму, suffix или comment и expiration window.",
        },
        {
          label: "checkout",
          title: "Public buyer page",
          body: "Checkout отдаёт адрес, QR, статус и payment context без обязательного buyer auth.",
        },
        {
          label: "watchers",
          title: "Observed transfers",
          body: "Watcher и internal ingestion paths матчат on-chain события и двигают invoice status.",
        },
        {
          label: "notify",
          title: "Seller notifications",
          body: "Telegram worker держит продавца в курсе и помогает не прозевать edge cases.",
        },
      ],
    },
    faq: {
      kicker: "FAQ",
      title: "Частые вопросы перед запуском.",
      body:
        "Эти вопросы обычно появляются у продавца раньше всего, поэтому в полноценном лендинге им нужен отдельный блок.",
      items: [
        {
          question: "Reqst кастодиальный сервис?",
          answer:
            "Нет. Buyer платит прямо на seller wallet. Reqst не хранит private keys и не выступает кошельком-хранителем средств.",
        },
        {
          question: "Вы берёте процент с каждой оплаты?",
          answer:
            "Нет. В продукте заложена модель fixed subscription: trial на 15 инвойсов, затем PRO за 39 USDT / 30 дней.",
        },
        {
          question: "Как происходит matching платежа?",
          answer:
            "Для TON используется comment плюс адрес продавца. Для stablecoin flows используется точная payable amount с уникальным suffix.",
        },
        {
          question: "Что будет с underpaid или late payment?",
          answer:
            "Такие кейсы не маскируются под success. Они уходят в underpaid или manual review и требуют осознанного решения.",
        },
        {
          question: "Правда ли, что свой PRO вы принимаете через этот же backend?",
          answer:
            "Да. Reqst сам использует свой invoice flow для продажи PRO, а значит dogfooding заложен прямо в продуктовую механику.",
        },
        {
          question: "Для кого это сейчас лучше всего подходит?",
          answer:
            "Для solo sellers, фрилансеров, агентств и небольших digital-команд, которым нужен Telegram-native, non-custodial crypto checkout.",
        },
      ],
    },
    final: {
      kicker: "REQST",
      title: "Полноценный crypto billing landing для сервиса, который хочет выглядеть как продукт, а не как заглушка.",
      body:
        "Если нужен не короткий splash screen, а обычный сильный лендинг с нормальной маркетинговой подачей, темной темой, анимациями и реальными опорами на архитектуру проекта, то `/lend` теперь именно такой.",
      primary: "Открыть консоль",
      secondary: "Посмотреть terms",
    },
    footer: {
      body: "Reqst делает checkout, invoice flow и payment matching, но не хранит средства пользователей и не выступает кастодианом.",
      privacy: "Privacy",
      terms: "Terms",
      console: "Console",
    },
  },
  en: {
    nav: {
      caption: "crypto billing OS",
      overview: "Overview",
      capabilities: "Features",
      networks: "Networks",
      faq: "FAQ",
      privacy: "Privacy",
      terms: "Terms",
      bot: "Telegram bot",
      console: "Open console",
    },
    hero: {
      kicker: "NON-CUSTODIAL • SUBSCRIPTION-FIRST • TELEGRAM-NATIVE",
      title: "reqst is a full landing-worthy crypto billing stack without the custodial nonsense.",
      body:
        "A product for solo sellers and small digital teams that want a real checkout, direct-to-wallet crypto intake, readable invoice states, seller notifications, and a fixed subscription instead of a fee on every payment.",
      subcopy:
        "Reqst does not pull funds into a shared balance, does not store private keys, and does not live on take rate. The buyer pays the seller directly while reqst handles the invoice flow, checkout UX, and payment matching around that transaction.",
      primary: "Open console",
      secondary: "Open Telegram bot",
      pills: [
        "0% take rate",
        "39 USDT / 30 days",
        "15-invoice trial",
        "public checkout links",
        "seller-owned wallets only",
        "late payment -> manual review",
      ],
      signals: [
        "The buyer pays straight into the seller payout wallet.",
        "Checkout, QR, countdown and status are already bundled into one public page.",
        "Reqst sells its own PRO plan through the same invoice backend.",
      ],
    },
    visual: {
      coreEyebrow: "reqst core",
      coreTitle: "pay direct",
      coreBody: "direct-to-wallet crypto billing layer",
      floaters: [
        {
          label: "routing",
          title: "seller-owned wallets",
          body: "Reqst does not insert itself as a custody layer between the seller and the payout wallet.",
        },
        {
          label: "matching",
          title: "TON comment / exact amount",
          body: "Matching is built around TON payloads and unique exact-amount suffixes for stablecoin flows.",
        },
        {
          label: "billing",
          title: "Reqst PRO through reqst",
          body: "The product sells its own plan through the same checkout and invoice lifecycle.",
        },
        {
          label: "status",
          title: "awaiting / paid / review",
          body: "Messy and late transfers do not disappear. They move into explicit states.",
        },
      ],
    },
    marquee: [
      "non-custodial by default",
      "telegram mini app auth",
      "public invoice checkout",
      "seller notifications",
      "exact amount matching",
      "ton comment matching",
      "fixed subscription instead of take rate",
      "same backend for internal billing",
    ],
    overview: {
      kicker: "OVERVIEW",
      title: "Not just an address generator, but a full invoice-to-payment product.",
      body:
        "A proper landing page should sell the full product shape, not one isolated feature. Reqst already includes a seller console, wallet buckets, invoice generation, public checkout, payment classification, seller notifications, and a billing flow running on the same engine.",
      cards: [
        {
          title: "Seller console",
          body: "Sellers manage wallets, invoices, and statuses without drowning in explorer tabs.",
        },
        {
          title: "Public checkout",
          body: "Buyers get a clear payment page with address, QR, countdown, network, and exact amount.",
        },
        {
          title: "Payment state machine",
          body: "Exact, underpaid, expired, and manual review are part of the model instead of being dumped into support.",
        },
      ],
    },
    capabilities: {
      kicker: "CAPABILITIES",
      title: "What reqst actually does as a product.",
      body:
        "A standard landing page should unpack the system, not just the slogan. These are the main capabilities that already define the project.",
      items: [
        {
          kicker: "01",
          title: "Non-custodial intake",
          body:
            "The buyer sends funds directly to the seller wallet. Reqst does not store private keys and does not turn payouts into a custody workflow.",
        },
        {
          kicker: "02",
          title: "Subscription instead of a revenue fee",
          body:
            "There is no take rate on every payment. The product uses a 15-invoice trial and then a 39 USDT / 30 day PRO plan.",
        },
        {
          kicker: "03",
          title: "TON payload matching",
          body:
            "For TON, the invoice creates a REQST-... comment and the backend matches by payload plus seller wallet address.",
        },
        {
          kicker: "04",
          title: "Stablecoin exact amount matching",
          body:
            "Stablecoin flows use an exact payable amount with a unique suffix so the seller does not need to reconcile manually.",
        },
        {
          kicker: "05",
          title: "Conservative status model",
          body:
            "Late and underpaid transfers are not disguised as success. They move into manual review or underpaid states on purpose.",
        },
        {
          kicker: "06",
          title: "Telegram-native experience",
          body:
            "Seller sign-in, notifications, and day-to-day operation are centered around Telegram instead of a bloated backoffice.",
        },
      ],
    },
    compare: {
      kicker: "WHY IT HITS",
      title: "Why reqst feels better than a typical crypto checkout stack.",
      body:
        "A regular landing page should quickly explain the before-and-after difference between old payment intake habits and the reqst workflow.",
      rows: [
        {
          legacy: "A percentage fee on every successful payment.",
          reqst: "A fixed subscription with no penalty for growth.",
        },
        {
          legacy: "Funds first land on the platform balance.",
          reqst: "Funds go straight into the seller wallet.",
        },
        {
          legacy: "Explorer tabs, chats, notes, and manual reconciliation.",
          reqst: "Checkout, matching, and invoice state are linked in one flow.",
        },
        {
          legacy: "Internal billing lives on a separate workaround.",
          reqst: "Reqst sells its own PRO plan through the same invoice flow.",
        },
      ],
    },
    networks: {
      kicker: "NETWORKS",
      title: "Payment rails and network scenarios.",
      body:
        "The product already has wallet buckets and payable rails for multiple network paths. This is not a one-chain toy, but a real multi-rail intake shape.",
      rails: [
        {
          name: "TON",
          title: "TON with payload matching",
          body: "The invoice creates a comment and the buyer pays TON directly to the seller address.",
          note: "Matching: seller address + comment.",
        },
        {
          name: "TRON",
          title: "TRON / USDT",
          body: "A stablecoin flow with exact amount matching and clear buyer checkout UX.",
          note: "Matching: unique payable amount.",
        },
        {
          name: "SOL",
          title: "Solana / USDC-USDT surface",
          body: "The product surface already includes a dedicated Solana rail for stablecoin intake.",
          note: "Useful when a seller wants a separate Solana payout bucket.",
        },
        {
          name: "ETH",
          title: "Shared EVM bucket",
          body: "One seller wallet bucket covers Ethereum, Base, Arbitrum, and BSC scenarios.",
          note: "This keeps payout setup simpler and avoids fragmented wallet management.",
        },
      ],
    },
    dogfood: {
      kicker: "DOGFOODING",
      title: "Reqst does not just talk about billing, it runs on it itself.",
      body:
        "The PRO subscription is created through the same backend invoice service, exposed through the same public checkout, and processed through the same payment classification flow. That matters because if the mechanics are weak, reqst feels it before the customer does.",
      stack: [
        {
          label: "endpoint",
          title: "POST /api/billing/checkout",
          body: "Creates a 30-day subscription invoice without spending the seller trial allowance.",
        },
        {
          label: "invoice kind",
          title: "kind: subscription",
          body: "The billing intent is part of the invoice model itself, not a manual side process.",
        },
        {
          label: "extension",
          title: "paid_exact -> PRO extended",
          body: "After an observed payment, seller subscription time is extended by the same product pipeline.",
        },
      ],
    },
    flow: {
      kicker: "FLOW",
      title: "How a seller moves from wallet setup to paid status.",
      body:
        "This is no longer a tiny landing stub, so the page now shows the actual product flow: what the seller does, what the buyer sees, and what the backend resolves.",
      steps: [
        {
          title: "Connect a payout wallet",
          body: "TON, TRON, Solana, or one shared EVM bucket for Ethereum, Base, Arbitrum, and BSC.",
        },
        {
          title: "Create an invoice",
          body: "Reqst calculates the payable amount, the TON payload, or the stablecoin matching suffix.",
        },
        {
          title: "Send the checkout link",
          body: "The buyer gets a public page with the exact amount, network, address, QR, and expiration timer.",
        },
        {
          title: "Backend classifies the payment",
          body: "The payment runs through the invoice state machine: awaiting, paid, underpaid, or manual review.",
        },
        {
          title: "Seller gets the operational signal",
          body: "The status appears in the console and seller notifications help close the order or handle edge cases.",
        },
      ],
    },
    fit: {
      kicker: "WHO IT FITS",
      title: "Who this product fits best right now.",
      body:
        "Reqst fits best where launch speed, wallet control, and zero appetite for per-payment platform tax matter most.",
      cases: [
        {
          title: "Freelance and agency retainers",
          body: "When you need to issue invoices fast and stop babysitting each transaction manually.",
        },
        {
          title: "Solo digital sellers",
          body: "Creators, consultants, designers, developers, and compact teams living in a Telegram rhythm.",
        },
        {
          title: "Micro subscription products",
          body: "The product already sells its own plan this way, so subscription thinking is natural here.",
        },
        {
          title: "Projects that reject custody",
          body: "If it matters that funds never sit on a third-party platform balance, reqst fits that philosophy directly.",
        },
      ],
    },
    architecture: {
      kicker: "UNDER THE HOOD",
      title: "What the product stack is made of.",
      body:
        "A regular landing page benefits from showing that the product is not magic and not just one polished screen, but a connected operating system with several layers.",
      nodes: [
        {
          label: "auth",
          title: "Telegram sign-in",
          body: "Seller access is built around Telegram Mini App auth and the seller account model.",
        },
        {
          label: "wallets",
          title: "Wallet buckets",
          body: "The service stores payout addresses and maps payable networks to the correct seller bucket.",
        },
        {
          label: "invoices",
          title: "Invoice engine",
          body: "The invoice service generates public ids, amounts, suffixes or comments, and expiration windows.",
        },
        {
          label: "checkout",
          title: "Public buyer page",
          body: "Checkout exposes address, QR, status, and payment context without forcing buyer auth.",
        },
        {
          label: "watchers",
          title: "Observed transfers",
          body: "Watcher and internal ingestion paths match on-chain events and move invoice state forward.",
        },
        {
          label: "notify",
          title: "Seller notifications",
          body: "A Telegram worker keeps the seller informed and makes edge-case handling faster.",
        },
      ],
    },
    faq: {
      kicker: "FAQ",
      title: "Common questions before going live.",
      body:
        "These are usually the first questions a seller asks, so a real landing page deserves a dedicated block for them.",
      items: [
        {
          question: "Is reqst a custodial service?",
          answer:
            "No. The buyer pays the seller wallet directly. Reqst does not store private keys and does not act as a custody wallet.",
        },
        {
          question: "Do you charge a fee on every payment?",
          answer:
            "No. The product is built around a fixed subscription model: 15 trial invoices, then PRO at 39 USDT for 30 days.",
        },
        {
          question: "How does payment matching work?",
          answer:
            "TON uses comment plus seller address. Stablecoin flows use the exact payable amount with a unique suffix.",
        },
        {
          question: "What happens to underpaid or late transfers?",
          answer:
            "Those cases are not disguised as success. They move into underpaid or manual review so the seller can make an explicit decision.",
        },
        {
          question: "Is it true that you use the same backend for your own PRO billing?",
          answer:
            "Yes. Reqst uses its own invoice flow to sell PRO, so dogfooding is part of the product mechanics.",
        },
        {
          question: "Who is this best for today?",
          answer:
            "Solo sellers, freelancers, agencies, and small digital teams who want a Telegram-native, non-custodial crypto checkout.",
        },
      ],
    },
    final: {
      kicker: "REQST",
      title: "A full crypto billing landing page for a product that should feel like a product, not a placeholder.",
      body:
        "If what you needed was not a tiny splash screen but a standard, strong landing page with a dark visual system, motion, and real references to the project architecture, `/lend` now behaves like that.",
      primary: "Open console",
      secondary: "Read terms",
    },
    footer: {
      body: "Reqst handles checkout, invoice flow, and payment matching, but does not custody user funds or act as a wallet provider.",
      privacy: "Privacy",
      terms: "Terms",
      console: "Console",
    },
  },
} as const;

export function LandingPage() {
  const { language, setLanguage, theme } = useUI();
  const copy = COPY[language];

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
    return () => {
      document.documentElement.dataset.theme = theme;
    };
  }, [theme]);

  return (
    <main className="lend-page">
      <div className="lend-backdrop lend-backdrop--grid" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--left" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--right" />

      <div className="lend-shell">
        <header className="lend-topbar">
          <Link className="lend-brand" to="/lend">
            <strong>reqst</strong>
          </Link>

          <nav className="lend-topnav" aria-label="landing sections">
            <a className="lend-nav-link" href="#overview">
              {copy.nav.overview}
            </a>
            <a className="lend-nav-link" href="#capabilities">
              {copy.nav.capabilities}
            </a>
            <a className="lend-nav-link" href="#networks">
              {copy.nav.networks}
            </a>
            <a className="lend-nav-link" href="#faq">
              {copy.nav.faq}
            </a>
          </nav>

          <div className="lend-topbar-actions">
            <div className="lend-language" role="group" aria-label="language switcher">
              <button type="button" className={language === "ru" ? "active" : ""} onClick={() => setLanguage("ru")}>
                РУ
              </button>
              <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>
                EN
              </button>
            </div>
            <Link className="lend-nav-link" to="/privacy">
              {copy.nav.privacy}
            </Link>
            <Link className="lend-nav-link" to="/terms">
              {copy.nav.terms}
            </Link>
            <a className="lend-nav-link" href={BOT_URL} target="_blank" rel="noreferrer">
              {copy.nav.bot}
            </a>
            <Link className="lend-primary" to="/">
              {copy.nav.console}
            </Link>
          </div>
        </header>

        <section className="lend-hero">
          <div className="lend-hero-copy lend-fade lend-fade--1">
            <span className="lend-kicker">{copy.hero.kicker}</span>
            <h1>{copy.hero.title}</h1>
            <p>{copy.hero.body}</p>
            <p className="lend-hero-subcopy">{copy.hero.subcopy}</p>

            <div className="lend-cta-row">
              <Link className="lend-primary" to="/">
                {copy.hero.primary}
              </Link>
              <a className="lend-secondary" href={BOT_URL} target="_blank" rel="noreferrer">
                {copy.hero.secondary}
              </a>
            </div>

            <div className="lend-chip-grid">
              {copy.hero.pills.map((pill) => (
                <span key={pill} className="lend-chip">
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="lend-hero-side lend-fade lend-fade--2">
            <div className="lend-signal-list">
              {copy.hero.signals.map((signal) => (
                <div key={signal} className="lend-signal-item">
                  {signal}
                </div>
              ))}
            </div>

            <div className="lend-hero-visual" aria-hidden="true">
              <div className="lend-orbit">
                <div className="lend-orbit-ring lend-orbit-ring--outer" />
                <div className="lend-orbit-ring lend-orbit-ring--mid" />
                <div className="lend-orbit-beam" />

                <div className="lend-core">
                  <span>{copy.visual.coreEyebrow}</span>
                  <strong>{copy.visual.coreTitle}</strong>
                  <p>{copy.visual.coreBody}</p>
                </div>

                {copy.visual.floaters.map((floater, index) => (
                  <article key={floater.title} className={`lend-floater lend-floater--${index + 1}`}>
                    <span>{floater.label}</span>
                    <strong>{floater.title}</strong>
                    <p>{floater.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="lend-marquee lend-fade lend-fade--3" aria-label="product highlights">
          <div className="lend-marquee-track">
            {[...copy.marquee, ...copy.marquee].map((item, index) => (
              <span key={`${item}-${index}`} className="lend-marquee-item">
                {item}
              </span>
            ))}
          </div>
        </section>

        <section id="overview" className="lend-split-section lend-fade lend-fade--2">
          <div className="lend-section-copy">
            <span className="lend-section-kicker">{copy.overview.kicker}</span>
            <h2>{copy.overview.title}</h2>
            <p>{copy.overview.body}</p>
          </div>

          <div className="lend-overview-grid">
            {copy.overview.cards.map((card) => (
              <article key={card.title} className="lend-card lend-card--overview">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="capabilities" className="lend-stacked-section lend-fade lend-fade--3">
          <div className="lend-section-copy">
            <span className="lend-section-kicker">{copy.capabilities.kicker}</span>
            <h2>{copy.capabilities.title}</h2>
            <p>{copy.capabilities.body}</p>
          </div>

          <div className="lend-feature-grid lend-feature-grid--expanded">
            {copy.capabilities.items.map((feature, index) => (
              <article key={feature.title} className={`lend-card lend-card--feature lend-fade lend-fade--${(index % 4) + 1}`}>
                <span>{feature.kicker}</span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lend-compare lend-fade lend-fade--2">
          <div className="lend-section-copy">
            <span className="lend-section-kicker">{copy.compare.kicker}</span>
            <h2>{copy.compare.title}</h2>
            <p>{copy.compare.body}</p>
          </div>

          <div className="lend-compare-board">
            {copy.compare.rows.map((row) => (
              <article key={row.legacy} className="lend-compare-row">
                <div className="lend-compare-legacy">
                  <span>old way</span>
                  <p>{row.legacy}</p>
                </div>
                <div className="lend-compare-reqst">
                  <span>reqst</span>
                  <p>{row.reqst}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="networks" className="lend-stacked-section lend-fade lend-fade--3">
          <div className="lend-section-copy">
            <span className="lend-section-kicker">{copy.networks.kicker}</span>
            <h2>{copy.networks.title}</h2>
            <p>{copy.networks.body}</p>
          </div>

          <div className="lend-network-grid">
            {copy.networks.rails.map((rail) => (
              <article key={rail.title} className="lend-network-card">
                <div className="lend-network-badge">{rail.name}</div>
                <h3>{rail.title}</h3>
                <p>{rail.body}</p>
                <strong>{rail.note}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="lend-dogfood lend-fade lend-fade--2">
          <div className="lend-section-copy">
            <span className="lend-section-kicker">{copy.dogfood.kicker}</span>
            <h2>{copy.dogfood.title}</h2>
            <p>{copy.dogfood.body}</p>
          </div>

          <div className="lend-code-stack">
            {copy.dogfood.stack.map((item) => (
              <article key={item.title} className="lend-stack-card">
                <span>{item.label}</span>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lend-flow lend-fade lend-fade--3">
          <div className="lend-section-copy">
            <span className="lend-section-kicker">{copy.flow.kicker}</span>
            <h2>{copy.flow.title}</h2>
            <p>{copy.flow.body}</p>
          </div>

          <div className="lend-timeline">
            {copy.flow.steps.map((step, index) => (
              <article key={step.title} className="lend-step">
                <strong>{String(index + 1).padStart(2, "0")}</strong>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lend-split-section lend-fade lend-fade--2">
          <div className="lend-section-copy">
            <span className="lend-section-kicker">{copy.fit.kicker}</span>
            <h2>{copy.fit.title}</h2>
            <p>{copy.fit.body}</p>
          </div>

          <div className="lend-case-grid">
            {copy.fit.cases.map((item) => (
              <article key={item.title} className="lend-case-card">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lend-stacked-section lend-fade lend-fade--3">
          <div className="lend-section-copy">
            <span className="lend-section-kicker">{copy.architecture.kicker}</span>
            <h2>{copy.architecture.title}</h2>
            <p>{copy.architecture.body}</p>
          </div>

          <div className="lend-architecture-grid">
            {copy.architecture.nodes.map((node) => (
              <article key={node.title} className="lend-architecture-card">
                <span>{node.label}</span>
                <h3>{node.title}</h3>
                <p>{node.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="lend-stacked-section lend-fade lend-fade--4">
          <div className="lend-section-copy">
            <span className="lend-section-kicker">{copy.faq.kicker}</span>
            <h2>{copy.faq.title}</h2>
            <p>{copy.faq.body}</p>
          </div>

          <div className="lend-faq-grid">
            {copy.faq.items.map((item) => (
              <details key={item.question} className="lend-faq-item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="lend-final lend-fade lend-fade--4">
          <span className="lend-section-kicker">{copy.final.kicker}</span>
          <h2>{copy.final.title}</h2>
          <p>{copy.final.body}</p>

          <div className="lend-cta-row">
            <Link className="lend-primary" to="/">
              {copy.final.primary}
            </Link>
            <Link className="lend-secondary" to="/terms">
              {copy.final.secondary}
            </Link>
          </div>
        </section>

        <footer className="lend-footer">
          <p>{copy.footer.body}</p>
          <div className="lend-footer-links">
            <Link to="/privacy">{copy.footer.privacy}</Link>
            <Link to="/terms">{copy.footer.terms}</Link>
            <Link to="/">{copy.footer.console}</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
