import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  authenticateTelegram,
  getStoredToken,
  loginWithTelegramCode,
  requestTelegramLoginCode,
  setStoredToken,
} from "../lib/api";
import { sanitizeNextPath } from "../lib/routing";
import { useUI } from "../lib/ui";

const BOT_URL = "https://t.me/reqstxyz_bot";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

const COPY = {
  ru: {
    browserTitle: "Вход по коду",
    browserBody: "Безопасный вход через Telegram-бота для браузеров и настольных устройств.",
    username: "Ваш @username",
    usernamePlaceholder: "@username",
    code: "Код подтверждения",
    codePlaceholder: "123456",
    sendCode: "Получить код",
    sendingCode: "Отправка...",
    loginAction: "Войти",
    signingIn: "Авторизация...",
    codeSent: "Код успешно отправлен в Telegram.",
    browserHint: "Пожалуйста, сначала запустите нашего бота, чтобы он мог отправить вам код.",
    telegramTitle: "Telegram Mini App",
    telegramBody: "Если вы открыли это окно внутри Telegram, авторизация произойдет автоматически.",
    openBot: "Открыть бота",
    continueTelegram: "Продолжить в Telegram",
    landing: "На главную",
  },
  en: {
    browserTitle: "Sign in via code",
    browserBody: "Secure Telegram-based authentication for browsers and desktop.",
    username: "Your @username",
    usernamePlaceholder: "@username",
    code: "Verification code",
    codePlaceholder: "123456",
    sendCode: "Get code",
    sendingCode: "Sending...",
    loginAction: "Login",
    signingIn: "Signing in...",
    codeSent: "Code has been sent to your Telegram.",
    browserHint: "Please start our bot first so we can send you the authentication code.",
    telegramTitle: "Telegram Mini App",
    telegramBody: "If you are using the Telegram Mini App, you will be signed in automatically.",
    openBot: "Open Bot",
    continueTelegram: "Login with Telegram",
    landing: "Home",
  },
} as const;

export function AuthPortalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useUI();
  const text = COPY[language];
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [form, setForm] = useState({
    username: "",
    code: "",
  });
  const hasSession = Boolean(getStoredToken());
  const [initData, setInitData] = useState(window.Telegram?.WebApp?.initData || "");
  const nextPath = sanitizeNextPath(new URLSearchParams(location.search).get("next")) || "/console";

  useEffect(() => {
    if (!initData) {
      const interval = window.setInterval(() => {
        const data = window.Telegram?.WebApp?.initData;
        if (data) {
          setInitData(data);
          window.clearInterval(interval);
        }
      }, 50);
      const timeout = window.setTimeout(() => window.clearInterval(interval), 2000);
      return () => {
        window.clearInterval(interval);
        window.clearTimeout(timeout);
      };
    }
    return undefined;
  }, [initData]);

  useEffect(() => {
    if (hasSession) {
      navigate(nextPath, { replace: true });
    }
  }, [hasSession, navigate, nextPath]);

  useEffect(() => {
    if (initData && !hasSession) {
      void performTelegramAuth(initData);
    }
  }, [initData, hasSession]);

  async function performTelegramAuth(manualInitData?: string) {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const sessionInitData = manualInitData || window.Telegram?.WebApp?.initData;
      if (!sessionInitData) {
        throw new Error("No Telegram session found");
      }
      const result = await authenticateTelegram({ init_data: sessionInitData });
      setStoredToken(result.token);
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  async function handleSendCode() {
    try {
      setSendingCode(true);
      setError("");
      setMessage("");
      await requestTelegramLoginCode({ username: form.username.trim() });
      setMessage(text.codeSent);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const result = await loginWithTelegramCode({
        username: form.username.trim(),
        code: form.code.trim(),
      });
      setStoredToken(result.token);
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <main className="shell checkout-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar topbar--checkout">
        <Link className="topbar-brand topbar-brand--minimal" to="/">
          <strong>reqst</strong>
        </Link>
        <div className="topbar-actions">
          <Link className="ghost-button compact-button" to="/">
            {text.landing}
          </Link>
        </div>
      </header>

      <section className="auth-portal__compact">
        <article className="checkout-card checkout-card--lux auth-card auth-card--email auth-card--primary">
          <div className="completion-paper-topline">
            <span className="receipt-brandline">Primary</span>
            <span className="completion-ticket-no">Browser</span>
          </div>
          <div className="auth-card__content">
            <h2>{text.browserTitle}</h2>
            <p className="hero-copy">{text.browserBody}</p>
            <p className="auth-portal__hint">{text.browserHint}</p>
            <p className="auth-portal__hint">
              <a href={BOT_URL} target="_blank" rel="noreferrer">@reqstxyz_bot</a>
            </p>
          </div>

          <form className="auth-card__form form-grid" onSubmit={handleSubmit}>
            <label>
              {text.username}
              <input
                type="text"
                placeholder={text.usernamePlaceholder}
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              />
            </label>

            <div className="auth-inline-action">
              <label>
                {text.code}
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={text.codePlaceholder}
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                />
              </label>
              <button type="button" className="ghost-button compact-button" disabled={sendingCode} onClick={() => void handleSendCode()}>
                {sendingCode ? text.sendingCode : text.sendCode}
              </button>
            </div>

            <button type="submit" className="lend-primary lend-primary--large" disabled={loading}>
              {loading ? text.signingIn : text.loginAction}
            </button>
          </form>

          <div className="auth-card__actions">
            <a className="lend-secondary" href={BOT_URL} target="_blank" rel="noreferrer">
              {text.openBot}
            </a>
          </div>

          {message ? <div className="auth-feedback auth-feedback--success">{message}</div> : null}
          {error ? <div className="alert">{error}</div> : null}
        </article>

        <article className="checkout-card checkout-card--lux auth-card auth-card--telegram auth-card--secondary">
          <div className="completion-paper-topline">
            <span className="receipt-brandline">Quick Access</span>
            <span className="completion-ticket-no">Telegram</span>
          </div>
          <div className="auth-card__content">
            <h2>{text.telegramTitle}</h2>
            <p className="hero-copy">{text.telegramBody}</p>
          </div>
          <div className="auth-card__actions">
            {initData ? (
              <button
                type="button"
                className="lend-secondary"
                disabled={loading}
                onClick={() => void performTelegramAuth()}
              >
                {loading ? text.signingIn : text.continueTelegram}
              </button>
            ) : (
              <a className="lend-secondary" href={BOT_URL} target="_blank" rel="noreferrer">
                {text.openBot}
              </a>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
