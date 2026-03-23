import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import { fetchPublicInvoice } from "../lib/api";
import type { Invoice } from "../lib/types";
import { useUI } from "../lib/ui";

const BOT_URL = "https://t.me/reqstxyzbot";

const COPY = {
  ru: {
    loading: "Загружаем инвойс...",
    waitingPayment: "Ожидание оплаты",
    expired: "Истёк",
    wallet: "Адрес кошелька",
    amount: "Точная сумма",
    comment: "Comment / payload",
    expires: "Истекает",
    expiresAt: "До",
    copyAddress: "Копировать адрес",
    copyComment: "Копировать payload",
    copyAmount: "Копировать сумму",
    copied: "Скопировано",
    qrLabel: "QR для быстрого открытия платежа",
    warning: "Переводи только точную сумму в нужной сети. Если таймер истёк, запроси новый инвойс.",
    payloadTitle: "Payload обязателен",
    payloadHint: "Для TON вставь comment без единого изменения, иначе автоподтверждение может не сработать.",
    qrLoading: "Готовим QR...",
    qrFallback: "Если QR не открылся, используй адрес и payload.",
    paymentRequest: "Платёжный запрос",
    ru: "РУ",
    en: "EN",
    receiptLabel: "Инвойс",
    footerLink: "Открыть бота",
  },
  en: {
    loading: "Loading invoice...",
    waitingPayment: "Awaiting payment",
    expired: "Expired",
    wallet: "Wallet address",
    amount: "Exact amount",
    comment: "Comment / payload",
    expires: "Expires",
    expiresAt: "Until",
    copyAddress: "Copy address",
    copyComment: "Copy payload",
    copyAmount: "Copy amount",
    copied: "Copied",
    qrLabel: "QR for opening the payment flow",
    warning: "Send only the exact amount on the correct network. If the timer is over, ask for a fresh invoice.",
    payloadTitle: "Payload required",
    payloadHint: "For TON, paste the comment exactly as shown or automatic matching may fail.",
    qrLoading: "Preparing QR...",
    qrFallback: "If the QR does not open, use the address and payload.",
    paymentRequest: "Payment request",
    ru: "RU",
    en: "EN",
    receiptLabel: "Invoice",
    footerLink: "Open bot",
  },
} as const;

const STATUS_LABELS = {
  ru: {
    awaiting_payment: "Ждёт оплату",
    paid: "Оплачен",
    expired: "Истёк",
    underpaid: "Недоплата",
    manual_review: "Ручная проверка",
    draft: "Черновик",
  },
  en: {
    awaiting_payment: "Awaiting payment",
    paid: "Paid",
    expired: "Expired",
    underpaid: "Underpaid",
    manual_review: "Manual review",
    draft: "Draft",
  },
} as const;

function fallbackPaymentURI(invoice: Invoice) {
  if (invoice.payable_network === "TON") {
    const amount = Math.round(Number(invoice.payable_amount) * 1_000_000_000);
    const comment = invoice.payment_comment ? `&text=${encodeURIComponent(invoice.payment_comment)}` : "";
    return `ton://transfer/${invoice.destination_address}?amount=${amount}${comment}`;
  }
  return [invoice.destination_address, invoice.payment_comment, `${invoice.payable_amount} ${invoice.payable_network}`].filter(Boolean).join("\n");
}

function formatStatus(language: keyof typeof STATUS_LABELS, status: string) {
  return STATUS_LABELS[language][status as keyof (typeof STATUS_LABELS)[typeof language]] ?? status.replaceAll("_", " ");
}

export function CheckoutPage() {
  const { publicId = "" } = useParams();
  const { language, theme, setLanguage, setTheme } = useUI();
  const text = COPY[language];
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [now, setNow] = useState(Date.now());
  const [copiedField, setCopiedField] = useState<"amount" | "address" | "comment" | "">("");

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
    if (!invoice) {
      setQrDataUrl("");
      return;
    }

    const source = invoice.payment_uri || fallbackPaymentURI(invoice);

    void QRCode.toDataURL(source, {
      width: 288,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: theme === "dark" ? "#f7f3ea" : "#14181b",
        light: theme === "dark" ? "#050505" : "#fffaf4",
      },
    })
      .then(setQrDataUrl)
      .catch(async () => {
        try {
          const fallback = await QRCode.toDataURL(fallbackPaymentURI(invoice), {
            width: 288,
            margin: 1,
            errorCorrectionLevel: "M",
            color: {
              dark: theme === "dark" ? "#f7f3ea" : "#14181b",
              light: theme === "dark" ? "#050505" : "#fffaf4",
            },
          });
          setQrDataUrl(fallback);
        } catch {
          setQrDataUrl("");
        }
      });
  }, [invoice, theme]);

  useEffect(() => {
    if (!copiedField) {
      return;
    }
    const timeout = window.setTimeout(() => setCopiedField(""), 1400);
    return () => window.clearTimeout(timeout);
  }, [copiedField]);

  const timeLeft = useMemo(() => {
    if (!invoice) {
      return "00:00";
    }
    const diff = new Date(invoice.expires_at).getTime() - now;
    if (diff <= 0) {
      return text.expired;
    }
    const totalSeconds = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [invoice, now, text.expired]);

  const title = invoice?.title?.trim() || text.paymentRequest;
  const statusLabel = invoice ? formatStatus(language, invoice.status) : "";
  const paymentRows = invoice
    ? [
        { key: "amount" as const, label: text.amount, value: `${invoice.payable_amount} ${invoice.payable_network}`, copyLabel: text.copyAmount },
        { key: "address" as const, label: text.wallet, value: invoice.destination_address, copyLabel: text.copyAddress },
      ]
    : [];

  async function copyValue(key: "amount" | "address" | "comment", value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedField(key);
  }

  return (
    <main className="shell checkout-shell checkout-shell--wide">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar topbar--checkout">
        <div className="topbar-brand topbar-brand--minimal">
          <strong>reqst</strong>
          <span>{text.receiptLabel}</span>
        </div>
        <div className="micro-actions">
          <div className="micro-action-group" role="group" aria-label="language">
            <button type="button" className={language === "ru" ? "micro-action active" : "micro-action"} onClick={() => setLanguage("ru")}>
              {text.ru}
            </button>
            <span className="micro-divider">|</span>
            <button type="button" className={language === "en" ? "micro-action active" : "micro-action"} onClick={() => setLanguage("en")}>
              {text.en}
            </button>
          </div>
          <button
            type="button"
            className="micro-action micro-action--icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          >
            {theme === "light" ? "☀" : "☾"}
          </button>
        </div>
      </header>

      <section className="checkout-card checkout-card--lux">
        {error ? <div className="alert">{error}</div> : null}
        {!invoice ? <p className="muted">{text.loading}</p> : null}

        {invoice ? (
          <>
            <div className="receipt-hero">
              <div className="receipt-copy">
                <div className="receipt-heading">
                  <span className={`status-dot status-${invoice.status}`} aria-hidden="true" />
                  <span className={`status-pill receipt-status status-${invoice.status}`}>{statusLabel}</span>
                </div>
                <h1>{title}</h1>
                <div className="receipt-timer">
                  <span>{text.waitingPayment}</span>
                  <strong>{timeLeft}</strong>
                </div>
                <p className="hero-copy">{text.warning}</p>
              </div>

              <div className="amount-totem amount-totem--receipt">
                <span>{text.amount}</span>
                <strong>{invoice.payable_amount}</strong>
                <p>{invoice.payable_network}</p>
                <small>
                  {text.expiresAt}: {new Date(invoice.expires_at).toLocaleString()}
                </small>
              </div>
            </div>

            <div className="checkout-grid checkout-grid--receipt">
              <aside className="qr-stage qr-stage--receipt">
                <div className="qr-shell qr-shell--receipt">
                  <div className="qr-frame qr-frame--receipt">
                    {qrDataUrl ? <img className="qr-image qr-image--lux" src={qrDataUrl} alt="Invoice QR" /> : <p className="muted">{text.qrLoading}</p>}
                  </div>
                </div>

                <div className="payment-sheet">
                  {invoice.payment_comment ? (
                    <div className="payload-callout payload-callout--critical">
                      <div className="payload-head">
                        <div>
                          <span>{text.payloadTitle}</span>
                          <p>{text.payloadHint}</p>
                        </div>
                        <button type="button" className="field-copy" onClick={() => void copyValue("comment", invoice.payment_comment ?? "")} aria-label={text.copyComment}>
                          {copiedField === "comment" ? text.copied : "⧉"}
                        </button>
                      </div>
                      <div className="payment-field payment-field--alert">
                        <div>
                          <label>{text.comment}</label>
                          <code>{invoice.payment_comment}</code>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {paymentRows.map((row) => (
                    <div key={row.key} className="payment-field">
                      <div>
                        <label>{row.label}</label>
                        <code>{row.value}</code>
                      </div>
                      <button type="button" className="field-copy" onClick={() => void copyValue(row.key, row.value)} aria-label={row.copyLabel}>
                        {copiedField === row.key ? text.copied : "⧉"}
                      </button>
                    </div>
                  ))}

                  <div className="receipt-meta">
                    <span>{text.expires}</span>
                    <strong>{new Date(invoice.expires_at).toLocaleString()}</strong>
                  </div>
                </div>

                <p className="muted">{text.qrLabel}</p>
                <p className="muted">{text.qrFallback}</p>
              </aside>
            </div>

            <footer className="checkout-footer">
              <a className="checkout-footer-link" href={BOT_URL} target="_blank" rel="noreferrer">
                reqst · {text.footerLink}
              </a>
            </footer>
          </>
        ) : null}
      </section>
    </main>
  );
}
