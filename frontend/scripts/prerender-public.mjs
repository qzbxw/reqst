import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const dist = new URL("../dist/", import.meta.url);
const template = readFileSync(new URL("index.html", dist), "utf8");

const routes = {
  "/": {
    title: "Reqst | Crypto Payment Links and API",
    description: "Create crypto checkout links, use an invoice API, verify signed webhooks, and test payment flows before going live.",
    content: `<header><strong>reqst</strong></header><main><section><h1>Crypto payment links and API</h1><p>Create invoices, accept direct-to-wallet payments, verify signed webhooks, and test integrations safely.</p></section><section><h2>Checkout, API, Webhooks</h2><p>Reqst supports merchant checkout links, API keys, idempotent invoice creation, webhook delivery logs, and test payment simulation.</p></section></main>`,
  },
  "/dev": {
    title: "Reqst Dev | API and Webhooks",
    description: "Reqst Dev adds API access, idempotent invoice creation, webhook retries, and production integration controls.",
    content: `<main><section><h1>Reqst Dev</h1><p>API access, test mode, idempotent invoice creation, webhook verification, and delivery retries for production integrations.</p></section><section><h2>Developer controls</h2><p>Create rk_test_ and rk_live_ keys, verify webhook signatures, and inspect invoice status changes.</p></section></main>`,
  },
  "/enterprise": {
    title: "Reqst Enterprise | Custom Payment Infrastructure",
    description: "Custom Reqst API limits, webhook retries, and priority engineering support for larger payment operations.",
    content: `<main><section><h1>Reqst Enterprise</h1><p>Custom payment infrastructure, expanded API limits, webhook delivery controls, and priority engineering support.</p></section><section><h2>Custom plan</h2><p>Designed for teams that need higher throughput, more keys, and stronger operational visibility.</p></section></main>`,
  },
  "/privacy": {
    title: "Reqst | Privacy Policy",
    description: "Reqst privacy policy for merchant accounts, payment metadata, webhook data, and authentication.",
    content: `<main><article><h1>Privacy Policy</h1><p>How Reqst handles merchant account data, invoice metadata, authentication, webhook payloads, and operational logs.</p><h2>Data use</h2><p>Data is used to provide checkout, API, webhook, billing, and account security features.</p></article></main>`,
  },
  "/terms": {
    title: "Reqst | Terms of Service",
    description: "Reqst terms for merchant payment links, API use, webhooks, and non-custodial blockchain payment flows.",
    content: `<main><article><h1>Terms of Service</h1><p>Terms for using Reqst checkout links, the invoice API, webhook delivery, and non-custodial payment monitoring.</p><h2>Merchant responsibilities</h2><p>Merchants remain responsible for compliance, destination addresses, and payment instructions shown to customers.</p></article></main>`,
  },
  "/developers": {
    title: "Reqst | API Documentation",
    description: "Reqst API quickstart covering auth, invoices, idempotency, webhooks, test mode, blockchain edge cases, and errors.",
    content: `<main><section><h1>Developer Docs</h1><p>Production integration guide for API auth, create/list/get/cancel invoice, idempotency, webhook verification, test mode, blockchain edge cases, and error codes.</p></section><section><h2>Quickstart</h2><p>Create a test key, create an invoice, simulate a test payment, and verify the webhook before switching to live mode.</p></section></main>`,
  },
};

function setTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html.replace("</head>", `${replacement}\n  </head>`);
}

function render(path, page) {
  let html = template.replace(/<div id="root"><\/div>/, `<div id="root">${page.content}</div>`);
  html = html.replace(/<title>.*?<\/title>/, `<title>${page.title}</title>`);
  html = setTag(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${page.description}" />`);
  html = setTag(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="https://reqst.xyz${path}" />`);
  html = setTag(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${page.title}" />`);
  html = setTag(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${page.description}" />`);
  const target = path === "/" ? new URL("index.html", dist) : new URL(`${path.slice(1)}/index.html`, dist);
  mkdirSync(dirname(target.pathname), { recursive: true });
  writeFileSync(target, html);
}

for (const [path, page] of Object.entries(routes)) {
  render(path, page);
}
