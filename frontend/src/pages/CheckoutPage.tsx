import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import { fetchPublicInvoice } from "../lib/api";
import type { Invoice } from "../lib/types";
import { useUI } from "../lib/ui";

const BOT_URL = "https://t.me/reqstxyz_bot";

const COPY = {
  ru: {
    loading: "Загружаем инвойс...",
    waitingPayment: "Ожидание оплаты",
    expiresSoon: "Скоро истечёт",
    expired: "Истёк",
    wallet: "Адрес кошелька",
    amount: "Точная сумма",
    network: "Сеть",
    comment: "Комментарий к платежу",
    expires: "Истекает",
    invoiceId: "Инвойс",
    expiresAt: "Действителен до",
    copyAddress: "Копировать адрес",
    copyComment: "Копировать payload",
    copyAmount: "Копировать сумму",
    copied: "Скопировано",
    warning: "Отправляйте точную сумму и только в указанной сети.",
    payloadTitle: "Payload обязателен",
    payloadHint: "Без этого комментария платеж не будет зачислен автоматически. Для TON скопируйте его без изменений.",
    qrLoading: "Готовим QR...",
    paymentRequest: "Платёжный запрос",
    ru: "РУ",
    en: "EN",
    receiptLabel: "Reqst",
    service: "Услуга",
    status: "Статус",
    receiptOutroPaid: "Сохраните этот чек как подтверждение оплаты.",
    receiptOutroExpired: "Для повторной оплаты запросите новую ссылку.",
    footerLink: "Powered by Reqst",
    networkOnly: "Только эта сеть",
    paidTitle: "Оплата получена",
    paidBody: "Платёж подтверждён и записан в Reqst.",
    expiredTitle: "Инвойс просрочен",
    expiredBody: "Срок действия ссылки истек. Не отправляйте средства по этим реквизитам.",
    paymentDetails: "Реквизиты для оплаты",
    scanHint: "Отсканируйте QR-код или скопируйте реквизиты ниже.",
    receiptNo: "Чек",
    finalState: "Финальный статус",
    docHintPaid: "Вы можете сохранить этот чек для подтверждения оплаты.",
    docHintExpired: "Если оплата все еще требуется, запросите новую ссылку.",
  },
  en: {
    loading: "Loading invoice...",
    waitingPayment: "Awaiting payment",
    expiresSoon: "Expires soon",
    expired: "Expired",
    wallet: "Wallet address",
    amount: "Exact amount",
    network: "Network",
    comment: "Payment comment",
    expires: "Expires",
    invoiceId: "Invoice",
    expiresAt: "Until",
    copyAddress: "Copy address",
    copyComment: "Copy payload",
    copyAmount: "Copy amount",
    copied: "Copied",
    warning: "Send the exact amount using the specified network only.",
    payloadTitle: "Payload required",
    payloadHint: "Without this comment, the payment might not be processed automatically. For TON, ensure it's copied exactly.",
    qrLoading: "Preparing QR...",
    paymentRequest: "Payment request",
    ru: "RU",
    en: "EN",
    receiptLabel: "Reqst",
    service: "Service",
    status: "Status",
    receiptOutroPaid: "Keep this receipt as proof of payment.",
    receiptOutroExpired: "Request a new checkout link if you still need to make a payment.",
    footerLink: "Powered by Reqst",
    networkOnly: "Only this network",
    paidTitle: "Payment received",
    paidBody: "The payment is confirmed and recorded in Reqst.",
    expiredTitle: "Invoice expired",
    expiredBody: "This checkout has expired. Please do not send funds to these addresses.",
    paymentDetails: "Payment details",
    scanHint: "Scan the QR or copy the fields below.",
    receiptNo: "Receipt",
    finalState: "Final state",
    docHintPaid: "You can keep this receipt as proof of payment.",
    docHintExpired: "Request a new checkout link from the seller if the payment is still required.",
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
      return "TRON / USDT";
    case "SOLANA":
      return "SOLANA / USDC-USDT";
    case "EVM":
      return "ETHEREUM / ERC20";
    case "BASE":
      return "BASE / USDT";
    case "ARBITRUM":
      return "ARBITRUM / USDT";
    case "BSC":
      return "BSC / USDT";
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
            {isPaid || isExpired ? (
              <section className={isPaid ? "completion-receipt completion-receipt--paid" : "completion-receipt completion-receipt--expired"}>
                <div className="completion-paper">
                  <div className="completion-paper-topline">
                    <div className="receipt-brandline completion-brandline">
                      <span>{text.receiptLabel}</span>
                    </div>
                    <span className="completion-ticket-no">
                      {text.receiptNo} #{invoice.public_id}
                    </span>
                  </div>

                  <div className="completion-head">
                    <div>
                      <h1>{isPaid ? text.paidTitle : text.expiredTitle}</h1>
                      <p className="hero-copy">{isPaid ? text.paidBody : text.expiredBody}</p>
                      <p className="completion-doc-hint">{isPaid ? text.docHintPaid : text.docHintExpired}</p>
                    </div>
                  </div>

                  <div className="completion-summary-wrap">
                    <div className="completion-summary">
                      <span>{text.amount}</span>
                      <strong>{invoice.payable_amount}</strong>
                      <div className="network-badge">
                        <b>{formatNetworkLabel(invoice.payable_network)}</b>
                        <small>{text.networkOnly}</small>
                      </div>
                    </div>
                    <aside className="completion-sidecar">
                      <span>{text.finalState}</span>
                      <strong>{statusLabel}</strong>
                      <p>{isPaid ? text.receiptOutroPaid : text.receiptOutroExpired}</p>
                    </aside>
                  </div>

                  <div className="completion-ledger completion-ledger--hero">
                    <div>
                      <span>{text.service}</span>
                      <strong>{title}</strong>
                    </div>
                    <div>
                      <span>{text.network}</span>
                      <strong>{formatNetworkLabel(invoice.payable_network)}</strong>
                    </div>
                  </div>

                  <div className="completion-ledger">
                    <div>
                      <span>{text.invoiceId}</span>
                      <strong>{invoice.public_id}</strong>
                    </div>
                    <div>
                      <span>{text.wallet}</span>
                      <strong>{invoice.destination_address}</strong>
                    </div>
                    <div>
                      <span>{text.expiresAt}</span>
                      <strong>{formatDateTime(invoice.expires_at, language)}</strong>
                    </div>
                    <div>
                      <span>{text.status}</span>
                      <strong>{statusLabel}</strong>
                    </div>
                  </div>

                  {invoice.payment_comment ? (
                    <div className="completion-note">
                      <small>{text.comment}: {invoice.payment_comment}</small>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : (
              <>
                <div className="checkout-flow">
                  <section className="checkout-story">
                    <div className="receipt-hero receipt-hero--streamlined">
                      <div className="receipt-copy">
                        <div className="receipt-brandline">
                          <span>{text.receiptLabel}</span>
                        </div>
                        <div className="receipt-heading">
                          <span className={`status-pill receipt-status status-${invoice.status}`}>{statusLabel}</span>
                        </div>
                        <h1>{title}</h1>
                        <div className={isExpiringSoon ? "receipt-timer receipt-timer--urgent" : "receipt-timer"}>
                          <span>{text.waitingPayment}</span>
                          <strong>{timeLeft}</strong>
                          {isExpiringSoon ? <em>{text.expiresSoon}</em> : null}
                        </div>
                        <p className="hero-copy">{text.warning}</p>
                        <div className="receipt-docmeta">
                          <div>
                            <span>{text.invoiceId}</span>
                            <strong>{invoice.public_id}</strong>
                          </div>
                          <div>
                            <span>{text.expiresAt}</span>
                            <strong>{formatDateTime(invoice.expires_at, language)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <section className="payment-sheet payment-sheet--receipt">
                      <div className="payment-sheet-header">
                        <span className="payment-sheet-kicker">{text.paymentDetails}</span>
                      </div>
                      <div className="payment-essentials">
                        {invoice.payment_comment ? (
                          <div className="payload-callout payload-callout--critical">
                            <div className="payload-head">
                              <div>
                                <span>{text.payloadTitle}</span>
                                <p>{text.payloadHint}</p>
                              </div>
                              <button type="button" className="field-copy field-copy--named" onClick={() => void copyValue("comment", invoice.payment_comment ?? "")} aria-label={text.copyComment}>
                                {copiedField === "comment" ? text.copied : text.copyComment}
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

                        {paymentRows
                          .filter((row) => row.key !== "amount")
                          .map((row) => (
                            <button key={row.key} type="button" className="payment-field payment-field--button" onClick={() => void copyValue(row.key, row.value)}>
                              <div>
                                <label>{row.label}</label>
                                <code>{row.value}</code>
                                <small>{row.secondary}</small>
                              </div>
                              <span className="field-copy field-copy--named" aria-label={row.copyLabel}>
                                {copiedField === row.key ? text.copied : row.copyLabel}
                              </span>
                            </button>
                          ))}
                      </div>
                    </section>
                  </section>

                  <aside className="payment-rail">
                    <div className="amount-totem amount-totem--receipt amount-totem--rail">
                      <span>{text.amount}</span>
                      <strong>{invoice.payable_amount}</strong>
                      <div className="network-badge">
                        <b>{formatNetworkLabel(invoice.payable_network)}</b>
                        <small>{text.networkOnly}</small>
                      </div>
                      <button type="button" className="ghost-button compact-button payment-rail-action" onClick={() => void copyValue("amount", invoice.payable_amount)}>
                        {copiedField === "amount" ? text.copied : text.copyAmount}
                      </button>
                    </div>

                    <aside className="qr-stage qr-stage--receipt">
                      <div className="qr-shell qr-shell--receipt">
                        <div className="qr-frame qr-frame--receipt">
                          {qrDataUrl ? <img className="qr-image qr-image--lux" src={qrDataUrl} alt="Invoice QR" /> : <p className="muted">{text.qrLoading}</p>}
                        </div>
                      </div>
                      <p className="qr-caption">{text.scanHint}</p>
                    </aside>
                  </aside>
                </div>
              </>
            )}

            <footer className="checkout-footer">
              <a className="checkout-footer-link" href={BOT_URL} target="_blank" rel="noreferrer">
                {text.footerLink}
              </a>
            </footer>
          </>
        ) : null}
      </section>
    </main>
  );
}
