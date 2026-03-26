import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import { fetchPublicInvoice } from "../lib/api";
import type { Invoice } from "../lib/types";
import { useUI } from "../lib/ui";

const BOT_URL = "https://t.me/reqstxyz_bot";
const DEMO_PUBLIC_ID = "demo";

const COPY = {
  ru: {
    loading: "Загрузка...",
    waitingPayment: "Ожидаем транзакцию",
    expiresSoon: "Время почти вышло",
    expired: "Срок истек",
    wallet: "Адрес",
    amount: "Сумма",
    network: "Сеть",
    comment: "Комментарий",
    expires: "Осталось",
    invoiceId: "Инвойс",
    expiresAt: "До",
    copyAddress: "Копировать",
    copyComment: "Копировать",
    copyAmount: "Копировать",
    copied: "Скопировано",
    warning: "Отправьте точную сумму в выбранной сети. Платёж зачислится автоматически.",
    payloadTitle: "Важное примечание",
    payloadHint: "Без этого комментария мы не сможем распознать ваш перевод.",
    qrLoading: "QR-код...",
    paymentRequest: "Оплата",
    ru: "РУ",
    en: "EN",
    receiptLabel: "Reqst",
    service: "Услуга",
    status: "Статус",
    receiptOutroPaid: "Платёж успешно зачислен.",
    receiptOutroExpired: "Срок оплаты данного счета истек.",
    footerLink: "Reqst",
    networkOnly: "Только эта сеть",
    paidTitle: "Оплачено",
    paidBody: "Ваш платеж успешно подтвержден.",
    expiredTitle: "Срок оплаты истек",
    expiredBody: "Время на оплату вышло. Пожалуйста, не отправляйте средства по этим реквизитам.",
    paymentDetails: "Реквизиты",
    scanHint: "Отсканируйте QR-код для быстрой оплаты или скопируйте реквизиты.",
    receiptNo: "Квитанция",
    finalState: "Статус",
    docHintPaid: "Транзакция успешно завершена.",
    docHintExpired: "Пожалуйста, запросите новую ссылку для оплаты у продавца.",
    footerPoweredBy: "Работает на",
    footerCTA: "Принимайте платежи так же с Reqst",
  },
  en: {
    loading: "Loading...",
    waitingPayment: "Listening for transaction...",
    expiresSoon: "Time is running out",
    expired: "Expired",
    wallet: "Address",
    amount: "Amount",
    network: "Network",
    comment: "Comment",
    expires: "Time left",
    invoiceId: "Invoice",
    expiresAt: "Until",
    copyAddress: "Copy",
    copyComment: "Copy",
    copyAmount: "Copy",
    copied: "Copied",
    warning: "Send the exact amount in the specified network for instant confirmation.",
    payloadTitle: "Required Comment",
    payloadHint: "Don't forget this comment, otherwise we won't be able to match your payment.",
    qrLoading: "QR...",
    paymentRequest: "Payment",
    ru: "RU",
    en: "EN",
    receiptLabel: "Reqst",
    service: "Service",
    status: "Status",
    receiptOutroPaid: "Payment received successfully.",
    receiptOutroExpired: "This checkout session has expired.",
    footerLink: "Reqst",
    networkOnly: "Network only",
    paidTitle: "Paid",
    paidBody: "Your payment has been successfully confirmed.",
    expiredTitle: "Session Expired",
    expiredBody: "The payment window has closed. Please do not send any funds to this address.",
    paymentDetails: "Details",
    scanHint: "Scan the QR code or copy the details below.",
    receiptNo: "Invoice",
    finalState: "Status",
    docHintPaid: "The transaction was completed successfully.",
    docHintExpired: "Please request a new payment link from the seller if needed.",
    footerPoweredBy: "Powered by",
    footerCTA: "Accept crypto payments like this with Reqst",
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

function formatNetworkLabel(network: Invoice["payable_network"]) {
  switch (network) {
    case "TRON":
      return "TRON";
    case "SOLANA":
      return "SOLANA";
    case "EVM":
      return "ETHEREUM";
    case "BASE":
      return "BASE";
    case "ARBITRUM":
      return "ARBITRUM";
    case "BSC":
      return "BSC";
    default:
      return network;
  }
}

function formatAddressPreview(address: string) {
  if (address.length <= 22) {
    return address;
  }
  return `${address.slice(0, 10)}...${address.slice(-10)}`;
}

function formatDateTime(value: string, language: keyof typeof COPY) {
  return new Date(value).toLocaleString(language === "ru" ? "ru-RU" : "en-US");
}

function createDemoInvoice(): Invoice {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 17 * 60 * 1000).toISOString();
  return {
    id: 0,
    public_id: "REQST-DEMO-149",
    kind: "merchant",
    plan_code: "pro",
    checkout_badge: "Demo Checkout",
    title: "Reqst Product Demo",
    base_amount_usd: "149.00",
    payable_amount: "149 USDT",
    payable_network: "TON",
    destination_address: "UQDemo4A7m9f6jK2x8mP3sL0qW8rT2nV5yH1cD6pQ9zX4aB7",
    payment_comment: "REQST-DEMO-149",
    status: "awaiting_payment",
    expires_at: expiresAt,
    created_at: now.toISOString(),
    tx_hash: null,
    checkout_url: "/checkout/demo",
    payment_uri: "ton://transfer/UQDemo4A7m9f6jK2x8mP3sL0qW8rT2nV5yH1cD6pQ9zX4aB7?amount=149000000000&text=REQST-DEMO-149",
  };
}

const Icons = {
  Check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Copy: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  ),
  Alert: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

export function CheckoutPage() {
  const { publicId = "" } = useParams();
  const { language, setLanguage } = useUI();
  const text = COPY[language];
  const demoInvoice = useMemo(() => createDemoInvoice(), []);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [now, setNow] = useState(Date.now());
  const [copiedField, setCopiedField] = useState<"amount" | "address" | "comment" | "">("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (publicId === DEMO_PUBLIC_ID) {
        setInvoice(demoInvoice);
        setError("");
        return;
      }

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
    const poll = window.setInterval(load, 5000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      active = false;
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, [demoInvoice, publicId]);

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
        dark: "#f7f3ea",
        light: "#050505",
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
              dark: "#f7f3ea",
              light: "#050505",
            },
          });
          setQrDataUrl(fallback);
        } catch {
          setQrDataUrl("");
        }
      });
  }, [invoice]);

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

  useEffect(() => {
    document.title = invoice?.title?.trim()
      ? `Reqst | ${invoice.title.trim()}`
      : language === "ru"
        ? "Reqst | Оплата"
        : "Reqst | Checkout";
  }, [invoice?.title, language]);

  const title = invoice?.title?.trim() || text.paymentRequest;
  const checkoutBadge = invoice?.checkout_badge || (invoice?.kind === "subscription" ? "Reqst Billing" : text.paymentRequest);
  const checkoutVariant = invoice?.plan_code && invoice.plan_code !== "trial" ? invoice.plan_code : "merchant";
  const statusLabel = invoice ? formatStatus(language, invoice.status) : "";
  const expiresDiff = invoice ? new Date(invoice.expires_at).getTime() - now : 0;
  const isExpired = invoice ? expiresDiff <= 0 || invoice.status === "expired" : false;
  const isPaid = invoice?.status === "paid";
  const isExpiringSoon = !isExpired && !isPaid && expiresDiff > 0 && expiresDiff <= 5 * 60 * 1000;
  const paymentRows = invoice
    ? [
        {
          key: "amount" as const,
          label: text.amount,
          value: invoice.payable_amount,
          secondary: formatNetworkLabel(invoice.payable_network),
          copyLabel: text.copyAmount,
        },
        {
          key: "address" as const,
          label: text.wallet,
          value: invoice.destination_address,
          secondary: formatAddressPreview(invoice.destination_address),
          copyLabel: text.copyAddress,
        },
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
        </div>
        <div className="lend-language topbar-language" role="group" aria-label="language">
          <button type="button" className={language === "ru" ? "active" : ""} onClick={() => setLanguage("ru")}>
            RU
          </button>
          <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>
            EN
          </button>
        </div>
      </header>

      <section className={`checkout-card checkout-card--lux checkout-card--${checkoutVariant}`}>
        {error ? <div className="alert">{error}</div> : null}
        {!invoice ? <p className="muted">{text.loading}</p> : null}

        {invoice ? (
          <>
            <div className={`checkout-flow portal-animate-in ${isPaid ? "is-paid" : ""} ${isExpired ? "is-expired" : ""}`}>
              <section className="checkout-story">
                <div className="receipt-hero receipt-hero--streamlined">
                  <div className="receipt-copy">
                    <div className="receipt-heading">
                      <span className={`status-pill receipt-status status-${invoice.status}`}>
                        {isPaid && <Icons.Check />}
                        {isExpired && <Icons.Alert />}
                        {formatStatus(language, invoice.status)}
                      </span>
                    </div>
                    <h1>{title}</h1>
                    
                    {!isPaid && !isExpired && (
                      <div className={isExpiringSoon ? "receipt-timer receipt-timer--urgent" : "receipt-timer"}>
                        <strong>{timeLeft}</strong>
                        {isExpiringSoon ? <em>{text.expiresSoon}</em> : null}
                      </div>
                    )}

                    <div className={`receipt-warning-callout ${isPaid ? "is-success" : isExpired ? "is-error" : ""}`}>
                      {isPaid ? <Icons.Check /> : isExpired ? <Icons.Alert /> : <Icons.Alert />}
                      <p className="hero-copy">
                        {isPaid ? text.paidBody : isExpired ? text.expiredBody : text.warning}
                      </p>
                    </div>

                    <div className="receipt-docmeta">
                      <div>
                        <span>{text.invoiceId}</span>
                        <strong>{invoice.public_id}</strong>
                      </div>
                      <div>
                        <span>{isPaid ? text.status : text.expiresAt}</span>
                        <strong>{isPaid ? statusLabel : formatDateTime(invoice.expires_at, language)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <section className={`payment-sheet payment-sheet--receipt ${isPaid || isExpired ? "is-disabled" : ""}`}>
                  <div className="payment-sheet-header">
                    <span className="payment-sheet-kicker">{text.paymentDetails}</span>
                  </div>
                  <div className="payment-essentials">
                    {invoice.payment_comment ? (
                      <div className="payload-callout payload-callout--critical">
                        <div className="payload-head">
                          <div className="payload-info">
                            <div className="payload-title-row">
                              <Icons.Alert />
                              <span>{text.payloadTitle}</span>
                            </div>
                            <p>{text.payloadHint}</p>
                          </div>
                          {!isPaid && !isExpired && (
                            <button type="button" className={`field-copy field-copy--named ${copiedField === "comment" ? "is-copied" : ""}`} onClick={() => void copyValue("comment", invoice.payment_comment ?? "")} aria-label={text.copyComment}>
                              <Icons.Copy />
                              {copiedField === "comment" ? text.copied : text.copyComment}
                            </button>
                          )}
                        </div>
                        <div className="payment-field payment-field--alert">
                          <div>
                            <label>{text.comment}</label>
                            <code>{invoice.payment_comment}</code>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {paymentRows
                      .filter((row) => row.key !== "amount")
                      .map((row) => (
                        <div key={row.key} className={`payment-field ${!isPaid && !isExpired ? "payment-field--button" : ""}`} onClick={() => !isPaid && !isExpired && void copyValue(row.key, row.value)}>
                          <div>
                            <label>{row.label}</label>
                            <code>{row.value}</code>
                            <small>{row.secondary}</small>
                          </div>
                          {!isPaid && !isExpired && (
                            <span className="field-copy field-copy--named" aria-label={row.copyLabel}>
                              <Icons.Copy />
                              {copiedField === row.key ? text.copied : row.copyLabel}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </section>
              </section>

              <aside className="payment-rail">
                <div className={`amount-totem amount-totem--receipt amount-totem--rail ${isPaid ? "is-success" : isExpired ? "is-error" : ""}`}>
                  <span>{text.amount}</span>
                  <strong>{invoice.payable_amount}</strong>
                  <div className="network-badge">
                    <b>{formatNetworkLabel(invoice.payable_network)}</b>
                    <small>{text.networkOnly}</small>
                  </div>
                  {!isPaid && !isExpired && (
                    <button type="button" className={`ghost-button compact-button payment-rail-action ${copiedField === "amount" ? "is-copied" : ""}`} onClick={() => void copyValue("amount", invoice.payable_amount)}>
                      <Icons.Copy />
                      {copiedField === "amount" ? text.copied : text.copyAmount}
                    </button>
                  )}
                </div>

                <aside className="qr-stage qr-stage--receipt">
                  <div className="qr-shell qr-shell--receipt">
                    <div className={`qr-frame qr-frame--receipt ${isPaid ? "qr-frame--success" : isExpired ? "qr-frame--expired" : ""}`}>
                      {qrDataUrl ? <img className="qr-image qr-image--lux" src={qrDataUrl} alt="Invoice QR" /> : <p className="muted">{text.qrLoading}</p>}
                    </div>
                  </div>
                  {!isPaid && !isExpired && <p className="qr-caption">{text.scanHint}</p>}
                </aside>
              </aside>
            </div>

            <footer className="checkout-footer">
              <a className="checkout-footer-promo" href="/">
                <div className="promo-brand">
                  <span>{text.footerPoweredBy}</span>
                  <strong>reqst</strong>
                </div>
                <span className="promo-cta">{text.footerCTA}</span>
              </a>
            </footer>
          </>
        ) : null}
      </section>
    </main>
  );
}
