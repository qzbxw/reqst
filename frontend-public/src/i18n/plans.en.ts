export const planSEOEn = {
  merchant: {
    hero: {
      badge: "Reqst Merchant",
      title: "Non-Custodial Crypto Payment Gateway",
      body: "Accept cryptocurrency directly to your wallet with zero turnover fees. The ultimate Telegram crypto billing bot and automated payment dashboard. Process USDT, TON, and Solana payments instantly without KYC or middleman limits.",
    },
    idealFor: {
      title: "Who Needs the Merchant Protocol?",
      description: "Designed for independent creators, Telegram channel administrators, and e-commerce entrepreneurs who demand full ownership of their revenue streams via a decentralized crypto checkout.",
      points: [
        "Telegram community managers monetizing premium groups via crypto subscriptions.",
        "Freelancers invoicing international clients for direct USDT or USDC payouts.",
        "Independent e-commerce merchants looking to bypass 2-5% traditional payment gateway fees.",
        "Digital goods sellers requiring instant, automated delivery upon blockchain confirmation."
      ]
    },
    deepDive: {
      title: "Direct-to-Wallet Architecture Explained",
      cards: [
        { title: "Absolutely Zero KYC", body: "Because we operate strictly as a non-custodial middleware, there are no compliance roadblocks. Start accepting crypto payments instantly, anonymously, and globally." },
        { title: "0% Turnover Commission", body: "Unlike traditional fiat processors or custodial crypto gateways that drain your margins, we charge a flat monthly fee. Keep 100% of your transaction volume." },
        { title: "Instant Telegram Alerts", body: "Connect our official Telegram bot to your account and receive real-time notifications the millisecond a blockchain transaction is validated by our high-throughput watchers." },
        { title: "Smart Underpayment Handling", body: "Our checkout interface automatically detects if a user sends less than the required amount, prompting them to send the remaining balance seamlessly." }
      ]
    },
    technicalSpecs: {
      title: "Merchant Technical Specifications",
      description: "A robust, no-code environment for processing decentralized payments.",
      specs: [
        { label: "Supported Networks", value: "TON, TRON (TRC20), Solana, Base, BSC, Arbitrum, Ethereum" },
        { label: "Settlement Speed", value: "Near-instant (subject to native blockchain block times)" },
        { label: "Integration Type", value: "No-code payment links, Telegram Bot, Dashboard UI" },
        { label: "Custody Model", value: "100% Non-custodial (Direct P2P transfer)" }
      ]
    },
    securityArchitecture: {
      title: "Uncompromising Security",
      body: "Your private keys never touch our servers. Customers send funds from their personal unhosted wallets (like Tonkeeper, Trust Wallet, or Phantom) or exchange accounts directly to your designated destination address. We only monitor public ledger data to verify the transaction status, ensuring zero counterparty risk for your business."
    },
    faq: [
      { q: "What is a non-custodial crypto gateway and how does it benefit me?", a: "A non-custodial gateway means that the payment processor never holds, touches, or routes your funds through intermediary accounts. When a customer pays, the cryptocurrency goes straight from their wallet to yours. This eliminates the risk of frozen accounts, withdrawal delays, or platform bankruptcies." },
      { q: "How do I create a crypto invoice without programming knowledge?", a: "The Merchant plan provides an intuitive web dashboard and a Telegram bot. You simply enter the required amount (in fiat or crypto) and a description. The system instantly generates a secure checkout link with QR codes that you can share with your customer via chat, email, or social media." },
      { q: "Is it really true that there are no transaction fees?", a: "Yes. Reqst Merchant operates on a flat monthly subscription model ($39/mo). Whether you process $100 or $100,000 in a month, you pay exactly zero percentage-based turnover fees. Your customers only pay the standard network gas fee." },
      { q: "Which cryptocurrencies and networks are currently supported?", a: "We focus on liquid, low-fee networks. We currently support stablecoins (USDT, USDC) and native assets on TON, TRON (TRC20), Solana, Base, Binance Smart Chain (BSC), Arbitrum, and Ethereum mainnet." },
      { q: "What happens if a customer sends the wrong amount?", a: "Our Smart Checkout UI constantly monitors the mempool. If an underpayment is detected, the invoice remains in a 'Partial' state, and the customer is prompted to send the remaining balance. If they overpay, the invoice is marked as 'Overpaid', and you receive an alert to manually resolve the excess." },
      { q: "Do my customers need to pass KYC to pay me?", a: "No. Since the transaction is a direct peer-to-peer blockchain transfer, neither you nor your customers are subjected to Know Your Customer (KYC) checks by Reqst. However, you remain responsible for any local tax or compliance laws in your jurisdiction." },
      { q: "How does the Telegram crypto billing bot work?", a: "By linking your Telegram account to Reqst, the bot becomes your mobile command center. It instantly pushes notifications for new invoices, confirmed payments, and potential underpayments, allowing you to manage your revenue stream entirely from your phone." },
      { q: "Can I use Reqst Merchant for physical retail stores?", a: "Absolutely. You can generate static QR codes for your products or generate dynamic invoices on a tablet at the point of sale. Customers simply scan the code with their mobile crypto wallet to complete the purchase instantly." }
    ]
  },
  developer: {
    hero: {
      badge: "Reqst Developer",
      title: "Idempotent Web3 Payment API",
      body: "The ultimate REST API for automated cryptocurrency billing. Integrate real-time webhook notifications, unified multi-chain monitoring, and bulletproof idempotency into your SaaS, game, or automation backend.",
    },
    idealFor: {
      title: "Built for Automation Engineers",
      description: "Engineered specifically for backend developers building the next generation of decentralized applications, SaaS billing engines, and automated digital fulfillment systems.",
      points: [
        "SaaS founders implementing automated recurring crypto billing without fiat processors.",
        "Web3 game developers needing instant, reliable in-game currency top-ups via Solana or TON.",
        "Discord and Telegram bot creators building paid, automated community access layers.",
        "High-frequency digital goods distributors requiring sub-second webhook delivery."
      ]
    },
    deepDive: {
      title: "API Capabilities & Architecture",
      cards: [
        { title: "Unified Multi-Chain Gateway", body: "Stop maintaining custom RPC nodes and fragile blockchain listeners. One standard REST API integration gives your platform immediate read/write capabilities across 7+ major networks." },
        { title: "Cryptographic Webhooks", body: "Every payment confirmation triggers a highly reliable POST webhook to your server. All payloads are secured using HMAC-SHA256 signatures, guaranteeing authenticity and preventing replay attacks." },
        { title: "Native Idempotency", body: "Never credit a user twice for the same blockchain transaction. Our core protocol enforces strict idempotency, protecting your database from duplicate processing during network congestion or micro-forks." },
        { title: "Testnet & Sandbox Mode", body: "Develop and test your integration safely using our Sandbox environment. Generate mock invoices and simulate blockchain confirmations without risking real capital." }
      ]
    },
    technicalSpecs: {
      title: "Developer Technical Specifications",
      description: "High-performance primitives for backend integration.",
      specs: [
        { label: "API Protocol", value: "RESTful JSON over HTTPS" },
        { label: "Authentication", value: "Bearer Token (API Keys)" },
        { label: "Webhook Security", value: "HMAC-SHA256 Signatures" },
        { label: "Rate Limits", value: "Up to 50,000 requests per month" }
      ]
    },
    securityArchitecture: {
      title: "API Security & Reliability",
      body: "Security is implemented at the transport and application layers. We utilize TLS 1.3 for all data in transit. Your API keys are hashed securely in our databases. Our webhook delivery system features exponential backoff algorithms; if your server experiences downtime, Reqst will queue and retry delivering the payment confirmation, ensuring no lost transactions."
    },
    faq: [
      { q: "How exactly do the crypto webhooks function?", a: "When a customer initiates a transfer, our decentralized Watchers monitor the respective blockchain. Once the transaction reaches the required block confirmations (e.g., 1 block for Solana, 20 blocks for BSC), Reqst fires a JSON payload via an HTTP POST request to your pre-configured endpoint, containing the invoice ID, amount, and TX hash." },
      { q: "How does the API handle network congestion on chains like Solana or Ethereum?", a: "Reqst utilizes a globally distributed array of RPC nodes. If a public node drops, we automatically failover to backup nodes. During heavy network congestion, our watchers maintain state and queue mempool transactions, ensuring your webhook is delivered the moment the block is finalized on-chain." },
      { q: "What is idempotency and why is it critical for crypto payments?", a: "Idempotency ensures that no matter how many times a specific API request or webhook is retried (due to network drops or client errors), the end result is the same. In crypto, this is vital to prevent 'double-spending' or granting a user a premium subscription twice for a single blockchain transaction." },
      { q: "Can I generate unique deposit addresses for every single user?", a: "Reqst API utilizes a smart-matching protocol rather than generating unique wallet addresses per invoice (which is expensive and difficult to sweep). We use mathematically unique decimal suffixes (e.g., 100.000123 USDT) or network-native memos (on TON) to map a single incoming transaction on your master wallet to a specific user invoice instantly." },
      { q: "Is there an SDK available for Node.js or Python?", a: "Currently, we provide a heavily documented, language-agnostic RESTful API that can be consumed by any modern HTTP client (Axios, Fetch, Requests). Official SDKs for TypeScript/Node.js and Go are actively in development." },
      { q: "How do I verify that a webhook actually came from Reqst?", a: "Every webhook includes an 'X-Reqst-Signature' header. You must use your secret Webhook Key to compute an HMAC-SHA256 hash of the raw request body. If your computed hash matches our header, the payload is authentic and untampered." },
      { q: "What happens if I exceed my 50,000 monthly API requests limit?", a: "We do not hard-block your API if you hit a spike. You will receive an automated alert via email and Telegram as you approach the limit (80% and 100%). Overages may be billed at a nominal rate, or you can seamlessly upgrade to the Business plan." },
      { q: "Do you offer technical support for API integration?", a: "Yes. Developer plan subscribers have access to prioritized email support and a dedicated developer community channel where our core engineers actively assist with architecture design and debugging." }
    ]
  },
  business: {
    hero: {
      badge: "Reqst Business",
      title: "B2B Cryptocurrency Billing Infrastructure",
      body: "Scale your corporate crypto revenue operations. Deploy multi-workspace environments, leverage high-volume blockchain processing, and manage team access controls through a professional B2B crypto invoicing suite.",
    },
    idealFor: {
      title: "Engineered for Scaling Organizations",
      description: "The definitive solution for agencies, mid-market SaaS platforms, and multi-brand conglomerates requiring strict financial separation, deep analytics, and robust team management.",
      points: [
        "Web development agencies managing decentralized billing for multiple distinct client accounts.",
        "High-traffic SaaS applications processing thousands of recurring crypto payments daily.",
        "Global platforms with disparate teams needing specialized 'Finance' vs 'Developer' access roles.",
        "Marketplaces requiring advanced CSV exports and reconciliation tools for crypto accounting."
      ]
    },
    deepDive: {
      title: "Corporate Workflow & Analytics",
      cards: [
        { title: "Multi-Workspace Isolation", body: "Operate up to 10 entirely independent projects from a single subscription. Each workspace features completely isolated API keys, webhook endpoints, and transaction histories." },
        { title: "Granular Team Roles", body: "Invite up to 10 colleagues to your organization. Assign fine-grained permissions: allow developers to manage API keys while restricting them from viewing financial analytics, or grant accountants export-only access." },
        { title: "Advanced Financial Analytics", body: "Unlock deep insights into your cash flow. Track conversion rates by blockchain, visualize volume trends over time, and identify your most profitable networks through interactive dashboard charts." },
        { title: "Extended Processing Quotas", body: "Process up to 200,000 API requests monthly. Built to handle massive spikes in checkout volume during product launches or NFT minting events." }
      ]
    },
    technicalSpecs: {
      title: "Business Technical Specifications",
      description: "High-capacity architecture for corporate deployment.",
      specs: [
        { label: "Request Quota", value: "200,000 requests / month" },
        { label: "Workspace Limit", value: "Up to 10 isolated environments" },
        { label: "Team Seats", value: "Up to 10 active members" },
        { label: "Data Export", value: "Automated CSV and JSON reconciliation" }
      ]
    },
    securityArchitecture: {
      title: "Corporate Compliance & Separation",
      body: "Workspace isolation is enforced at the database level. An API key from Workspace A cannot query data from Workspace B. Furthermore, all significant actions (e.g., manually confirming an invoice or rotating webhook secrets) are logged with audit trails, providing transparency and accountability for distributed teams."
    },
    faq: [
      { q: "How exactly do Workspaces function?", a: "Think of Workspaces as separate companies under a holding group. If you run a SaaS product and a separate e-commerce store, you create two Workspaces. They share your Business plan limits, but they have completely separate invoice histories, different receiving wallet addresses, and independent API keys." },
      { q: "Can I assign different receiving wallets for different projects?", a: "Yes. Because Workspaces are fully isolated, you can configure Workspace A to payout to a multi-sig corporate treasury wallet, while Workspace B pays out to a fast-moving operational hot wallet." },
      { q: "What analytics are provided in the Business dashboard?", a: "The Business dashboard provides detailed time-series charts showing revenue by day/week/month, breakdown of volume by specific blockchain network (e.g., 60% TRON, 40% Solana), and invoice conversion rates (how many generated checkouts resulted in a successful payment)." },
      { q: "How do I export data for my accountants?", a: "You can filter your transaction history by date, network, or status, and export the exact dataset as a standardized CSV. This makes it incredibly simple to import your crypto revenue data into traditional accounting software like Xero or QuickBooks." },
      { q: "What happens when I hit the 200k API request limit?", a: "Unlike restrictive web2 services, we do not sever your checkout flow. If you exceed 200,000 requests, your infrastructure remains fully operational. You will be contacted by an account manager to discuss a custom Enterprise plan or standard overage billing." },
      { q: "Is Priority Support included?", a: "Yes. Business plan members jump the queue. Your support tickets are routed directly to our senior support engineers, ensuring that any API questions or network anomalies are resolved with the highest urgency." },
      { q: "Can I restrict my developer from seeing our total revenue?", a: "Absolutely. Our Role-Based Access Control (RBAC) allows you to invite a user as a 'Developer'. They will have access to API keys, webhooks, and the sandbox, but the dashboard will block access to gross revenue metrics and accounting exports." },
      { q: "Are there any hidden setup fees?", a: "None. The Business plan is a flat $499 per month. There are no setup fees, no percentage cuts taken from your volume, and no hidden integration costs." }
    ]
  },
  enterprise: {
    hero: {
      badge: "Reqst Enterprise",
      title: "Custom SLA Crypto Payment Processor",
      body: "Unrestricted, sovereign payment infrastructure. Deploy dedicated high-throughput blockchain watchers, negotiate custom SLA contracts, and harness limitless processing power designed for industry titans.",
    },
    idealFor: {
      title: "Reserved for Industry Titans",
      description: "The absolute pinnacle of decentralized payment processing, crafted for cryptocurrency exchanges, tier-1 gaming networks, and multi-national corporations moving staggering volumes of digital assets.",
      points: [
        "Major cryptocurrency exchanges seeking robust fiat-offramp and B2B billing alternatives.",
        "Global high-frequency trading platforms requiring millisecond-latency blockchain data execution.",
        "Enterprise software conglomerates migrating massive, legacy user bases to decentralized rails.",
        "High-risk, high-volume merchants demanding legally binding uptime guarantees and direct engineering support."
      ]
    },
    deepDive: {
      title: "Sovereign Infrastructure",
      cards: [
        { title: "Dedicated Blockchain Nodes", body: "We physically isolate your traffic. By deploying dedicated, private RPC nodes across multiple geographic zones, we guarantee that your webhook latency is completely unaffected by other Reqst clients or public network spam." },
        { title: "Legally Binding SLAs", body: "Move from best-effort to guaranteed. We sign formal B2B Service Level Agreements (SLAs) ensuring 99.99% API uptime, specified incident response times, and financial penalties for degradation." },
        { title: "Custom Rate Limits & Quotas", body: "Eradicate artificial bottlenecks. Whether you process 1 million or 50 million API requests a month, we provision server capacity specifically mapped to your peak load requirements." },
        { title: "White-Glove Architecture Consultation", body: "You are assigned a dedicated Solution Architect. We collaborate directly with your CTO to design custom retry logic, failover mechanisms, and database synchronization specific to your stack." }
      ]
    },
    technicalSpecs: {
      title: "Enterprise Technical Specifications",
      description: "Bare-metal performance for mission-critical operations.",
      specs: [
        { label: "Infrastructure", value: "Dedicated VPCs and Isolated RPC Nodes" },
        { label: "Uptime Guarantee", value: "99.99% via Legal SLA" },
        { label: "API Rate Limits", value: "Fully Custom / Unlimited" },
        { label: "Support Channel", value: "Direct Slack/Telegram to Core Devs" }
      ]
    },
    securityArchitecture: {
      title: "Enterprise-Grade Resilience",
      body: "Our enterprise architecture features geo-redundant database replication and auto-scaling Kubernetes clusters. We utilize strict IP-whitelisting for your webhook endpoints and API access. In the event of a catastrophic global outage of a major blockchain (e.g., Solana halting), our dedicated infrastructure maintains an encrypted local mempool, executing the backlog the millisecond the network resumes block production."
    },
    faq: [
      { q: "What does the 99.99% Uptime SLA actually guarantee?", a: "The SLA legally guarantees that our core API endpoints for invoice creation and our webhook delivery infrastructure will be operational 99.99% of the time. If uptime drops below this threshold, you are entitled to service credits as stipulated in the B2B contract. Note: We cannot guarantee the uptime of the underlying blockchain itself (e.g., if the TRON network goes down)." },
      { q: "How does Reqst provision dedicated RPC nodes?", a: "Instead of routing your blockchain queries through our shared, public node pool, we spin up private node instances (via AWS or bare-metal providers) specifically for your API keys. This drastically reduces read latency and ensures your transaction monitoring is never throttled by public rate limits." },
      { q: "Can we request integration for a custom or niche blockchain?", a: "Yes. If your enterprise requires support for a specific L2 rollup, an enterprise consortium chain, or an emerging altcoin, our core development team will scope, build, and maintain a custom watcher integration exclusively for your deployment." },
      { q: "How is pricing determined for the Enterprise tier?", a: "Enterprise pricing is entirely bespoke. It is calculated based on your sustained and peak API request volume, the number of dedicated RPC nodes required across different networks, and the severity of the SLA response times. Contact our sales team for a precise technical audit and quote." },
      { q: "Do you offer direct communication channels with your developers?", a: "Yes. We set up a shared Slack or Telegram channel connecting your engineering team directly with the Reqst core developers. This bypasses standard support ticketing, providing instant communication during integration, migrations, or live incidents." },
      { q: "Can we sign standard B2B corporate contracts?", a: "Absolutely. We understand the procurement processes of large corporations. We provide comprehensive invoicing, NDA execution, data processing agreements (DPA), and standard B2B contracting to satisfy your legal and compliance departments." },
      { q: "Is it possible to white-label the checkout experience?", a: "Yes. Enterprise clients have access to advanced UI customization options, allowing you to completely strip Reqst branding from the checkout flow, mapping it to your own custom domain (e.g., pay.yourcompany.com) for a totally seamless brand experience." },
      { q: "How long does enterprise deployment take?", a: "The timeline depends on the complexity of your custom requirements. Standard dedicated node provisioning takes 48-72 hours. Complex architectural integrations with custom retry logic and white-labeling generally take 1-2 weeks, overseen entirely by your dedicated Solution Architect." }
    ]
  }
};