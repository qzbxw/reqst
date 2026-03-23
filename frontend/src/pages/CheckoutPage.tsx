import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import { fetchPublicInvoice } from "../lib/api";
import type { Invoice } from "../lib/types";

export function CheckoutPage() {
  const { publicId = "" } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await fetchPublicInvoice(publicId);
        if (!active) {
          return;
        }
        setInvoice(result);
        setError("");
      } catch (err) {
        if (!active) {
          return;
        }
        setError((err as Error).message);
      }
    }

    void load();
    const poll = window.setInterval(load, 10000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      active = false;
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, [publicId]);

  useEffect(() => {
    if (!invoice?.payment_uri) {
      setQrDataUrl("");
      return;
    }
    void QRCode.toDataURL(invoice.payment_uri, {
      width: 240,
      margin: 1,
      color: {
        dark: "#0b1115",
        light: "#f7f0dc",
      },
    }).then(setQrDataUrl);
  }, [invoice?.payment_uri]);

  const timeLeft = useMemo(() => {
    if (!invoice) {
      return "00:00";
    }
    const diff = new Date(invoice.expires_at).getTime() - now;
    if (diff <= 0) {
      return "Expired";
    }
    const totalSeconds = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [invoice, now]);

  return (
    <main className="checkout-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      <section className="checkout-card">
        <span className="eyebrow">Buyer Checkout</span>
        <h1>{invoice?.title || "Invoice"}</h1>

        {error ? <div className="alert">{error}</div> : null}
        {!invoice ? <p className="muted">Loading invoice...</p> : null}

        {invoice ? (
          <>
            <div className="checkout-hero">
              <div className="price-ring">
                <strong>{invoice.payable_amount}</strong>
                <span>{invoice.payable_network}</span>
              </div>
              <div className="countdown-card">
                <span>Status</span>
                <strong className={`status-${invoice.status}`}>{invoice.status}</strong>
                <p>Time left: {timeLeft}</p>
              </div>
            </div>

            <div className="checkout-grid">
              <div className="panel sand-panel">
                <h2>Transfer Details</h2>
                <div className="detail-row">
                  <span>Address</span>
                  <code>{invoice.destination_address}</code>
                </div>
                <div className="detail-row">
                  <span>Exact amount</span>
                  <code>
                    {invoice.payable_amount} {invoice.payable_network}
                  </code>
                </div>
                {invoice.payment_comment ? (
                  <div className="detail-row">
                    <span>Comment</span>
                    <code>{invoice.payment_comment}</code>
                  </div>
                ) : null}
                <div className="detail-row">
                  <span>Expires</span>
                  <code>{new Date(invoice.expires_at).toLocaleString()}</code>
                </div>
                <button className="wide-button" onClick={() => navigator.clipboard.writeText(invoice.destination_address)}>
                  Copy Address
                </button>
              </div>

              <div className="panel sand-panel qr-panel">
                <h2>Scan QR</h2>
                {qrDataUrl ? <img className="qr-image" src={qrDataUrl} alt="Invoice QR" /> : <p className="muted">Generating QR...</p>}
                <p className="muted">
                  Send the exact amount shown here. If the timer has expired, do not transfer and ask the seller for a fresh link.
                </p>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
