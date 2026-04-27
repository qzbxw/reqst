const en = {
    hero: {
      title: "The Protocol for Digital Revenue.",
      body:
        "Non-custodial infrastructure for scale. Direct-to-wallet payouts, 0% turnover fees, and native multi-chain support in one unified engine.",
      subcopy:
        "Engineered for Telegram, SaaS, and Global Commerce.",
      primary: "Launch Console",
      secondary: "View Docs",
      badges: ["Direct-to-Wallet", "0% Fees", "Non-Custodial", "High-Throughput"],
    },
    heroPanel: {
      eyebrow: "Infrastructure",
      title: "Performance First",
      body: "Experience raw efficiency with our optimized blockchain monitoring protocol.",
      amount: "149.00 USDT",
      invoice: "REQST-INFRA-99",
      status: "Confirmed",
      primary: "Demo Checkout",
      secondary: "Console",
      helper: "Flat subscription. Unlimited volume.",
      chips: ["TON", "TRON", "SOL", "BASE"],
    },
    bento: {
      kicker: "INFRASTRUCTURE",
      title: "Built for the next billion transactions.",
      items: [
        {
          id: "api",
          title: "Unified API v1",
          body: "A high-performance gateway for all liquid networks. One integration, infinite reach.",
          kicker: "INTEGRATION",
          size: "large"
        },
        {
          id: "checkout",
          title: "Smart Checkout",
          body: "A clean, high-conversion payment interface optimized for every device and platform.",
          kicker: "UX",
          size: "medium"
        },
        {
          id: "direct",
          title: "Direct Payouts",
          body: "Revenue flows directly to your wallets. We never touch, hold, or middle-man your funds.",
          kicker: "TRUST",
          size: "small"
        },
        {
          id: "monitoring",
          title: "Real-time Watchers",
          body: "Low-latency blockchain monitoring with intelligent underpayment detection.",
          kicker: "STABILITY",
          size: "small"
        },
        {
          id: "tg",
          title: "Telegram Native",
          body: "Manage your revenue flow and infrastructure via our official Telegram bot.",
          kicker: "NATIVE",
          size: "small"
        }
      ]
    },
    useCases: {
      kicker: "USE CASES",
      title: "Proven in the most demanding environments.",
      tabs: [
        { id: "tg-shops", title: "TG Shops", body: "Automate physical and digital goods sales inside Telegram with instant delivery.", cta: "Explore TG Commerce" },
        { id: "saas", title: "SaaS Billing", body: "Reliable infrastructure for software platforms. Flat fees mean higher margins for your business.", cta: "Optimize Margins" },
        { id: "digital", title: "Digital Goods", body: "Instant fulfillment for keys and accounts immediately after blockchain confirmation.", cta: "Scale Automation" },
        { id: "communities", title: "Communities", body: "Automated access management for private channels and groups with recurring logic.", cta: "Manage Members" },
      ]
    },
    networks: {
      kicker: "NETWORKS",
      title: "Global Connectivity.",
      list: ["TON", "TRON", "SOLANA", "BASE", "ARBITRUM", "BSC", "ETHEREUM"],
      rails: [
        {
          name: "TON",
          body: "The native choice for Telegram-based commerce and the growing TON ecosystem.",
        },
        {
          name: "TRON",
          body: "The global standard for USDT settlement with high throughput and low costs.",
        },
        {
          name: "SOL",
          body: "Fast, confirmation-aware monitoring for businesses that need predictable payment operations.",
        },
        {
          name: "EVM",
          body: "Base, Arbitrum, BSC — support the EVM networks available in the current checkout flow.",
        },
        {
          name: "BASE",
          body: "Optimistic L2 by Coinbase, offering low fees and Ethereum security.",
        },
        {
          name: "BSC",
          body: "High-performance network with one of the largest ecosystem of active users.",
        },
        {
          name: "ARBITRUM",
          body: "The leading layer-2 for Ethereum, providing professional-grade scalability.",
        }
      ]
    },
    compare: {
      kicker: "EVOLUTION",
      title: "The Reqst Advantage.",
      rows: [
        {
          legacy: "Manual verification and screenshot chasing.",
          reqst: "Automated blockchain watchers & instant alerts.",
        },
        {
          legacy: "Gateway fees (1-5%) eating your profit.",
          reqst: "0% turnover fees. Keep 100% of what you earn.",
        },
        {
          legacy: "Custodial risk & withdrawal delays.",
          reqst: "Non-custodial. Direct-to-wallet. Instant liquidity.",
        },
      ],
    },
    pricing: {
      kicker: "ACCESS",
      title: "Transparent pricing. No fees.",
      merchant: {
        name: "Merchant",
        price: "39",
        trial: "Free in Test Mode",
        features: ["Direct-to-Wallet Payouts", "Manual Invoice Management", "0% Turnover Fees", "Standard Analytics"],
        cta: "Activate Merchant"
      },
      developer: {
        name: "Developer",
        price: "199",
        features: ["Full API & Webhooks", "50k Monthly Requests", "3 Seats / Workspaces", "Priority Support"],
        cta: "Activate Developer"
      },
      business: {
        name: "Business",
        price: "499",
        features: ["200k Monthly Requests", "10 Seats / Workspaces", "Advanced Reporting", "Dedicated Support"],
        cta: "Activate Business"
      },
      enterprise: {
        name: "Enterprise",
        price: "Custom",
        features: ["Unlimited Requests", "Unlimited Seats", "Custom SLA / B2B", "Direct Dev Channel"],
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
        {
          question: "Do I need to pass KYC to start using Reqst?",
          answer: "No. Since we operate strictly as non-custodial middleware and do not hold or process fiat currency, we do not require KYC verification from merchants. You can start accepting crypto immediately.",
        },
        {
          question: "Is there a limit on how many invoices I can create?",
          answer: "There are absolutely no limits on invoice creation. You can generate millions of payment links. Our subscription tiers only restrict the number of API requests to our monitoring nodes.",
        },
        {
          question: "What happens if a network (e.g., Solana) goes down?",
          answer: "Our watchers are distributed across multiple global RPC providers. If a network halts, Reqst queues the monitoring tasks. Once the blockchain resumes block production, all pending transactions will be automatically verified and webhooks fired.",
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
      status: "Status",
      api: "API",
      b2b: "B2B",
      company: "Company",
      resources: "Resources",
      solutions: "Solutions",
      social: "Social",
    },
    nav: {
      products: {
        title: "Products",
        checkout: { title: "Checkout", desc: "High-converting payment UI" },
        api: { title: "API", desc: "Infrastructure for developers" },
        invoicing: { title: "Invoicing", desc: "Professional billing tools" },
      },
      useCases: {
        title: "Use Cases",
        tgShops: "Telegram Shops",
        saas: "SaaS Billing",
        digital: "Digital Goods",
        communities: "Paid Communities",
      },
      networks: {
        title: "Networks",
        ton: "TON",
        tron: "TRON",
        solana: "Solana",
        base: "Base",
        bsc: "BSC",
        arbitrum: "Arbitrum",
      },
      pricing: {
        title: "Pricing",
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
    activate: "Get Started",
    activateVerb: "Activate",
    seamlessFlow: "Seamless Flow",
    useCases: "USE CASES",
    startIntegration: "Start Integration",
    docs: "Documentation",
    networks: "NETWORKS",
    accept: "Accept",
    technicalDocs: "Technical Docs",
    tryDemo: "Try Demo",
    ogSubtitle: "Next-generation crypto payments infrastructure",
    checkoutProduct: {
      title: "Checkout: Seamless Payment Experience",
      description: "Modern, high-converting checkout UI designed to minimize friction and eliminate payment errors.",
      kicker: "PRODUCT",
      cards: [
        {
          title: "Responsive Design",
          body: "Works perfectly on mobile, web browsers, and within Telegram WebApps.",
        },
        {
          title: "Smart Monitoring",
          body: "Automatic transaction detection, underpayment and overpayment handling.",
        },
        {
          title: "Security First",
          body: "Non-custodial solution: funds flow directly to your wallet.",
        },
      ],
    },
    invoicingProduct: {
      title: "Invoicing: Professional Billing for Modern Business",
      description: "Stop using spreadsheets for billing. Reqst Invoicing provides a professional way to issue, track, and manage crypto invoices.",
      kicker: "PRODUCT",
      cards: [
        {
          title: "Custom Invoices",
          body: "Create branded payment links for any amount with flexible network options.",
        },
        {
          title: "Status Tracking",
          body: "Real-time updates on every invoice. Know exactly when your client pays.",
        },
        {
          title: "Client Management",
          body: "Keep track of your clients and their payment history in a unified dashboard.",
        },
      ],
    },
    breadcrumbs: {
      home: "Home",
      blog: "Blog",
      compare: "Compare",
      useCases: "Use Cases",
      networks: "Networks",
      products: "Products",
      invoicing: "Invoicing",
    },
    productsHub: {
      title: "Solutions for Every Business Scale",
      description: "From simple payment links to enterprise-grade infrastructure. Choose the product that fits your current growth stage.",
      kicker: "PRODUCTS",
      checkout: {
        title: "Checkout",
        desc: "A ready-to-use, high-converting payment UI that supports all major networks. Perfect for selling digital goods and services.",
        link: "Learn more",
      },
      api: {
        title: "API & Webhooks",
        desc: "Full-featured infrastructure for developers. Automate payments, track transactions in real-time, and scale with confidence.",
        link: "Learn more",
      },
      invoicing: {
        title: "Invoicing",
        desc: "Professional billing tools for B2B and freelancers. Issue invoices, track status, and manage your clients in one place.",
        link: "Learn more",
      }
    },
    networksHub: {
      title: "Universal Blockchain Connectivity",
      description: "We bridge the gap between businesses and decentralized liquidity. Reqst supports all major protocols with a single integration.",
      kicker: "NETWORKS",
      explanation: "All networks operate on a direct-to-wallet basis. We never touch your funds, ensuring maximum security and zero counterparty risk."
    },
    useCasesHub: {
      title: "Built for Real-World Commerce",
      description: "Explore how different industries use Reqst to automate their crypto operations and eliminate manual overhead.",
      kicker: "USE CASES",
    },
    compareHub: {
      title: "The Smarter Way to Process Crypto",
      description: "See how Reqst compares to manual verification and traditional custodial gateways. Transparency and efficiency in every transaction.",
      kicker: "COMPARE",
    },
    statusHub: {
      title: "System Status",
      description: "Real-time monitoring of Reqst infrastructure and network connectivity.",
      kicker: "STATUS",
      allSystemsOperational: "All Systems Operational",
      operational: "Operational",
      services: "Core Services",
      networks: "Network Connectivity",
      coreApi: "Core API",
      watchers: "Blockchain Watchers",
      checkout: "Checkout UI",
    },
  },
  plan: {
    back: "Back Home",
    auth: "Console",
    discuss: "Discuss Terms",
    compareTitle: "Protocol",
    flowTitle: "Integration",
    priceTitle: "Access",
    priceSubtitle: "Unlimited volume. Flat monthly fee.",
    codeTitle: "Implementation",
    codeSubtitle: "Ready for production in minutes.",
    codeBody: "Seamlessly integrate our protocol into your existing workflow.",
    processingNote: "Non-custodial architecture. All transactions go directly to your wallets.",
    compareSectionTitle: "Direct Access Architecture",
    compareSectionBody: "Reqst operates as a transparent middleware. Transactions flow directly from client to merchant, bypassing intermediary accounts.",
    merchant: {
      badge: "Reqst Merchant",
      title: "Accept Crypto. 0% Turnover Fees.",
      body: "Professional dashboard for manual and semi-automated payment acceptance. Direct payouts to your wallets and full control.",
      priceLabel: "$39",
      period: "per month",
      stats: [
        { value: "0%", label: "Fee" },
        { value: "100%", label: "Non-custodial" },
        { value: "Live", label: "Dashboard" },
        { value: "Basic", label: "Analytics" },
      ],
      features: [
        { title: "Unlimited Invoices", body: "Create unlimited payment links for any amount with no extra fees." },
        { title: "Manual Override", body: "Manually confirm payments in case of underpayments or client errors." },
        { title: "Direct-to-Wallet", body: "Funds go directly from client to your address. We never touch your money." },
        { title: "Instant Alerts", body: "Real-time Telegram notifications for every single transaction." },
      ],
      flow: [
        { title: "Account Setup", body: "Quick Telegram registration and adding your payout details." },
        { title: "Invoice Creation", body: "Generate payment links in a few clicks via our intuitive dashboard." },
        { title: "Real-time Tracking", body: "Live blockchain monitoring. We confirm transactions automatically." },
      ],
      code: `// Manual Invoice Link
// https://reqst.xyz/app/checkout/demo
// No code required for Merchant plan.
// Just share the link and get paid.`
    },
    developer: {
      badge: "Reqst Developer",
      title: "Payments Infrastructure. Control in Your Hands.",
      body: "Professional API and Webhooks for full business automation. Direct payouts and zero turnover commissions.",
      priceLabel: "$199",
      period: "per month",
      stats: [
        { value: "50k", label: "Requests/mo" },
        { value: "3", label: "Seats" },
        { value: "3", label: "Workspaces" },
        { value: "Standard", label: "Support" },
      ],
      features: [
        { title: "Webhook Delivery", body: "Guaranteed delivery with automated retries and HMAC signatures." },
        { title: "Real-time Monitoring", body: "Real-time transaction monitoring. Detect payments instantly." },
        { title: "Unified API v1", body: "A single interface for 7+ networks: TON, TRON, SOL, Base, and more." },
        { title: "Idempotency", body: "Built-in protection against duplicate transactions at the API level." },
      ],
      flow: [
        { title: "API Key Provisioning", body: "Generate rqst_live_ keys. Manage scopes for secure backend integration." },
        { title: "Webhook Config", body: "Set up HMAC-SHA256 signed callbacks for instant notifications." },
        { title: "Automated Processing", body: "Our watchers track transactions 24/7, confirming payments autonomously." },
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
      title: "Scalable Processing. For Growing Teams.",
      body: "Extended API limits, team access, and priority support for businesses with high payment volume.",
      priceLabel: "$499",
      period: "per month",
      stats: [
        { value: "200k", label: "Requests/mo" },
        { value: "10", label: "Seats" },
        { value: "10", label: "Workspaces" },
        { value: "Priority", label: "Support" },
      ],
      features: [
        { title: "Advanced Analytics", body: "In-depth insights into payments, conversion, and retention across workspaces." },
        { title: "Team Collaboration", body: "Add up to 10 members to your team with granular role management." },
        { title: "Multi-Workspace", body: "Manage up to 10 independent projects under a single subscription." },
        { title: "Extended Limits", body: "Higher API quotas and increased active webhook limits." },
      ],
      flow: [
        { title: "Team Onboarding", body: "Invite team members and assign roles to manage your projects." },
        { title: "Workspace Isolation", body: "Set up independent environments for different business lines." },
        { title: "Scale with Priority", body: "Work with dedicated monitoring queues and 24/7 priority support." },
      ],
      code: `// Multi-Workspace Management
// Manage up to 10 workspaces
// Isolated API keys and team seats
// Advanced Analytics enabled`
    },
    enterprise: {
      badge: "Reqst Enterprise",
      title: "Corporate Standard. Infrastructure Without Limits.",
      body: "Custom limits, SLA guarantees, and dedicated support for major market players.",
      priceLabel: "Custom",
      period: "individual pricing",
      stats: [
        { value: "1M+", label: "Requests/mo" },
        { value: "∞", label: "Seats" },
        { value: "SLA", label: "Guarantee" },
        { value: "Dedicated", label: "Support" },
      ],
      features: [
        { title: "Custom Rate Limits", body: "Individually tailored API throughput for your peak loads." },
        { title: "SLA & B2B Contracts", body: "Legal uptime guarantees and official corporate contracting." },
        { title: "Dedicated Engineering", body: "Direct communication with core developers for consultation." },
        { title: "Onboarding Assist", body: "Personal manager for integration and migration assistance." },
      ],
      flow: [
        { title: "Infrastructure Audit", body: "Analyzing your payment flows to design the optimal monitoring architecture." },
        { title: "Dedicated Provisioning", body: "Deploying isolated infrastructure for maximum reliability." },
        { title: "Hyper-scale Support", body: "Launch with unlimited quotas under direct supervision of our team." },
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
        "READ THIS DOCUMENT CAREFULLY. BY ACCESSING THE REQST SOFTWARE, DASHBOARD, API, OR PUBLIC CHECKOUT PAGES, YOU EXPLICITLY CONSENT TO THE DATA PRACTICES HEREIN. IF YOU DO NOT AGREE, YOU MUST IMMEDIATELY CEASE ALL USE OF THE SERVICE.",
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
      sections: [],
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
      sections: [],
      footerNote: "The text above is rendered without translation and preserves the supplied wording structure for publication styling.",
    } },
} as const;

export default en;
