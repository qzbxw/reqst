import { Link } from "react-router-dom";

const sections = [
  {
    title: "Quickstart",
    body: "Create an rk_test_ key, add a payout wallet, create a test invoice, simulate a payment, then switch the same integration to rk_live_ when your webhook verification is passing.",
    code: `curl -X POST https://api.reqst.xyz/v1/invoices \\
  -H "Authorization: Bearer rk_test_..." \\
  -H "Idempotency-Key: order-1001" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Order #1001","base_amount_usd":"49.00","payable_network":"TRON"}'`,
  },
  {
    title: "API Auth",
    body: "Use Authorization: Bearer <API_KEY> or X-API-Key. Live keys start with rk_live_. Test keys start with rk_test_ and create test-mode invoices that are ignored by live blockchain watchers.",
  },
  {
    title: "Invoices",
    body: "Use POST /v1/invoices, GET /v1/invoices, GET /v1/invoices/{id}, and POST /v1/invoices/{id}/cancel. Every invoice response includes checkout_url, payable_amount, payable_network, destination_address, status, and mode.",
  },
  {
    title: "Idempotency",
    body: "Send Idempotency-Key on POST /v1/invoices. Repeating the same key with the same JSON body returns the original response. Reusing the key with a different body returns 409 Conflict.",
  },
  {
    title: "Webhook Verification",
    body: "Each webhook has a stable event_id in the JSON payload. Verify X-Reqst-Signature with HMAC-SHA256 over the exact request body and timestamp before mutating your order state.",
    code: `const expected = "v1=" + crypto
  .createHmac("sha256", webhookSecret)
  .update(timestamp + "." + rawBody)
  .digest("hex");`,
  },
  {
    title: "Test Mode",
    body: "Use POST /v1/test/invoices/{id}/simulate-payment with an rk_test_ key to mark a test invoice as paid and exercise webhook delivery without sending funds.",
  },
  {
    title: "Blockchain Edge Cases",
    body: "Payments after expiration move to manual_review. Exact payments become paid. Small shortfalls become underpaid. Overpayments move to manual_review. For memo/comment networks, the required comment must be included or the transfer may not match automatically.",
  },
  {
    title: "Error Codes",
    body: "400 invalid request, 401 invalid API key, 403 missing plan/scope, 404 missing resource, 409 idempotency conflict, 429 rate or monthly quota exceeded, 500 internal error.",
  },
];

export function DeveloperDocsPage() {
  return (
    <main className="lend-page docs-page">
      <div className="lend-shell">
        <header className="lend-topbar">
          <Link to="/" className="topbar-brand topbar-brand--minimal">
            <strong>reqst</strong>
          </Link>
          <nav className="lend-nav">
            <Link to="/dev">Dev</Link>
            <Link to="/enterprise">Enterprise</Link>
            <Link to="/console">Console</Link>
          </nav>
        </header>

        <section className="docs-hero">
          <span className="section-kicker">API v1</span>
          <h1>Developer Docs</h1>
          <p>Production integration guide for invoices, idempotent retries, test mode, webhook verification, and blockchain payment edge cases.</p>
        </section>

        <section className="docs-grid" aria-label="Developer documentation">
          {sections.map((section) => (
            <article className="docs-card" key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
              {section.code ? <pre><code>{section.code}</code></pre> : null}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
