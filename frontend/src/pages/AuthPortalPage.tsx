import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  authenticateTelegram,
  getStoredToken,
  loginWithEmail,
  registerWithEmail,
  requestEmailRegistrationCode,
  requestPasswordResetCode,
  resetPassword,
  setStoredToken,
} from "../lib/api";
import { sanitizeNextPath } from "../lib/routing";
import { useUI } from "../lib/ui";

const BOT_URL = "https://t.me/reqstxyz_bot";

type EmailMode = "login" | "register" | "reset";

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
    title: "Вход в Reqst",
    body: "Почта и пароль для обычной работы в браузере. Telegram оставили как быстрый вход из Mini App.",
    telegramTitle: "Telegram",
    telegramBody: "Если вы внутри Telegram, можно открыть Mini App и войти без лишних шагов.",
    openBot: "Открыть бота",
    continueTelegram: "Войти через Telegram",
    signingIn: "Авторизация...",
    landing: "На главную",
    console: "В панель управления",
    emailTitle: "Почта и пароль",
    emailBody: "Основной способ входа для ежедневной работы с консолью и оплатами.",
    emailModes: {
      login: "Вход",
      register: "Регистрация",
      reset: "Сброс пароля",
    },
    email: "Email",
    emailPlaceholder: "name@example.com",
    password: "Пароль",
    passwordPlaceholder: "Минимум 8 символов",
    newPassword: "Новый пароль",
    code: "Код подтверждения",
    codePlaceholder: "123456",
    sendCode: "Получить код",
    sendingCode: "Отправка...",
    loginAction: "Войти",
    registerAction: "Зарегистрироваться",
    resetAction: "Обновить пароль",
    codeSent: "Код подтвержден и отправлен. Проверьте почту (включая папку Спам).",
    browserHint: "В браузере лучше использовать email, а Telegram оставить для входа из Mini App.",
    redirectHint: "После входа вы вернётесь туда, откуда пришли.",
  },
  en: {
    title: "Sign in to reqst",
    body: "Use email and password for regular browser access. Telegram stays available as a faster Mini App shortcut.",
    telegramTitle: "Telegram",
    telegramBody: "If you are already inside Telegram, open the Mini App and continue without the usual browser flow.",
    openBot: "Open Bot",
    continueTelegram: "Login with Telegram",
    signingIn: "Signing in...",
    landing: "Back to Home",
    console: "Open Console",
    emailTitle: "Email + password",
    emailBody: "Regular email sign-in without relying only on Telegram.",
    emailModes: {
      login: "Login",
      register: "Sign up",
      reset: "Reset",
    },
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "At least 8 characters",
    newPassword: "New password",
    code: "Email code",
    codePlaceholder: "123456",
    sendCode: "Send code",
    sendingCode: "Sending...",
    loginAction: "Login",
    registerAction: "Create account",
    resetAction: "Reset password",
    codeSent: "Code sent. Check your inbox and finish the flow in this form.",
    browserHint: "In a browser, email is the main path. Telegram works best from the Mini App.",
    redirectHint: "After sign-in, you will be returned to the page you originally opened.",
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
  const [emailMode, setEmailMode] = useState<EmailMode>("login");
  const [form, setForm] = useState({
    email: "",
    password: "",
    code: "",
    newPassword: "",
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

  async function handleEmailSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      setMessage("");

      if (emailMode === "login") {
        const result = await loginWithEmail({
          email: form.email.trim(),
          password: form.password,
        });
        setStoredToken(result.token);
        navigate(nextPath, { replace: true });
        return;
      }

      if (emailMode === "register") {
        const result = await registerWithEmail({
          email: form.email.trim(),
          code: form.code.trim(),
          password: form.password,
        });
        setStoredToken(result.token);
        navigate(nextPath, { replace: true });
        return;
      }

      const result = await resetPassword({
        email: form.email.trim(),
        code: form.code.trim(),
        new_password: form.newPassword,
      });
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

      if (emailMode === "register") {
        await requestEmailRegistrationCode({ email: form.email.trim() });
      } else {
        await requestPasswordResetCode({ email: form.email.trim() });
      }

      setMessage(text.codeSent);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSendingCode(false);
    }
  }

  function setMode(mode: EmailMode) {
    setEmailMode(mode);
    setError("");
    setMessage("");
  }

  const emailActionLabel = emailMode === "login"
    ? text.loginAction
    : emailMode === "register"
      ? text.registerAction
      : text.resetAction;

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
        <div className="auth-portal__copy auth-portal__copy--compact">
          <span className="eyebrow">Reqst Access</span>
          <h1>{text.title}</h1>
          <p>{text.body}</p>
          {nextPath !== "/console" ? <p className="auth-portal__hint">{text.redirectHint}</p> : null}
        </div>

        <article className="checkout-card checkout-card--lux auth-card auth-card--email auth-card--primary">
          <div className="completion-paper-topline">
            <span className="receipt-brandline">Primary Access</span>
            <span className="completion-ticket-no">Email</span>
          </div>
          <div className="auth-card__content">
            <h2>{text.emailTitle}</h2>
            <p className="hero-copy">{text.emailBody}</p>
          </div>

          <div className="auth-mode-switch" role="tablist">
                {(["login", "register", "reset"] as EmailMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={emailMode === mode ? "switch-pill active" : "switch-pill"}
                    onClick={() => setMode(mode)}
                  >
                    {text.emailModes[mode]}
                  </button>
                ))}
          </div>

          <form className="auth-card__form form-grid" onSubmit={handleEmailSubmit}>
            <label>
              {text.email}
              <input
                type="email"
                placeholder={text.emailPlaceholder}
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </label>

            {emailMode === "login" ? (
              <label>
                {text.password}
                <input
                  type="password"
                  placeholder={text.passwordPlaceholder}
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                />
              </label>
            ) : (
              <>
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

                {emailMode === "register" ? (
                  <label>
                    {text.password}
                    <input
                      type="password"
                      placeholder={text.passwordPlaceholder}
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    />
                  </label>
                ) : (
                  <label>
                    {text.newPassword}
                    <input
                      type="password"
                      placeholder={text.passwordPlaceholder}
                      value={form.newPassword}
                      onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
                    />
                  </label>
                )}
              </>
            )}

            <button type="submit" className="lend-primary lend-primary--large" disabled={loading}>
              {loading ? text.signingIn : emailActionLabel}
            </button>
          </form>

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
            <p className="auth-portal__hint">{text.browserHint}</p>
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
