import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { useUI } from "../lib/ui";

const BOT_URL = "https://t.me/reqstxyz_bot";
const BOT_NAME = "reqstxyz_bot";

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
    onTelegramAuth?: (user: Record<string, string | number>) => Promise<void>;
  }
}

const COPY = {
  ru: {
    title: "Вход в reqst",
    body: "Войдите через Telegram или через email и пароль. Оба способа могут жить в одном аккаунте, если вы потом свяжете их в профиле.",
    telegramTitle: "Telegram",
    telegramBody: "Если вы уже в Telegram Mini App, вход выполнится автоматически. С сайта можно зайти через виджет или открыть бота.",
    openBot: "Открыть бота",
    continueTelegram: "Войти через Telegram",
    signingIn: "Входим...",
    landing: "На главную",
    console: "В консоль",
    emailTitle: "Email + пароль",
    emailBody: "Создайте аккаунт по коду из письма, входите с паролем и восстанавливайте доступ без привязки только к Telegram.",
    emailModes: {
      login: "Вход",
      register: "Регистрация",
      reset: "Сброс",
    },
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Пароль",
    passwordPlaceholder: "Минимум 8 символов",
    newPassword: "Новый пароль",
    code: "Код из письма",
    codePlaceholder: "123456",
    sendCode: "Отправить код",
    sendingCode: "Отправляем...",
    loginAction: "Войти",
    registerAction: "Создать аккаунт",
    resetAction: "Сбросить пароль",
    codeSent: "Код отправлен. Проверьте почту и затем завершите действие в этой форме.",
  },
  en: {
    title: "Sign in to reqst",
    body: "Use Telegram or email/password. Both methods can belong to the same account once you link them in the profile.",
    telegramTitle: "Telegram",
    telegramBody: "Inside Telegram Mini App the session signs in automatically. On the website you can use the widget or open the bot directly.",
    openBot: "Open Bot",
    continueTelegram: "Login with Telegram",
    signingIn: "Signing in...",
    landing: "Back to Home",
    console: "Open Console",
    emailTitle: "Email + password",
    emailBody: "Create an account with a code from email, sign in with a password, and recover access even if Telegram is not your only entry point.",
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
  },
} as const;

export function AuthPortalPage() {
  const navigate = useNavigate();
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
      navigate("/console", { replace: true });
    }
  }, [hasSession, navigate]);

  useEffect(() => {
    if (initData && !hasSession) {
      void performTelegramAuth(initData);
    }
  }, [initData, hasSession]);

  useEffect(() => {
    if (initData || hasSession) {
      return undefined;
    }

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", BOT_NAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;

    const container = document.getElementById("telegram-login-container");
    if (container) {
      container.appendChild(script);
    }

    window.onTelegramAuth = async (user) => {
      const params = new URLSearchParams();
      Object.entries(user).forEach(([key, value]) => params.append(key, String(value)));
      await performTelegramWidgetAuth(params.toString());
    };

    return () => {
      if (container) {
        container.innerHTML = "";
      }
      delete window.onTelegramAuth;
    };
  }, [hasSession, initData]);

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
      navigate("/console");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  async function performTelegramWidgetAuth(widgetData: string) {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const result = await authenticateTelegram({ widget_data: widgetData });
      setStoredToken(result.token);
      navigate("/console");
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
        navigate("/console");
        return;
      }

      if (emailMode === "register") {
        const result = await registerWithEmail({
          email: form.email.trim(),
          code: form.code.trim(),
          password: form.password,
        });
        setStoredToken(result.token);
        navigate("/console");
        return;
      }

      const result = await resetPassword({
        email: form.email.trim(),
        code: form.code.trim(),
        new_password: form.newPassword,
      });
      setStoredToken(result.token);
      navigate("/console");
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
    <main className="auth-portal">
      <div className="auth-portal__glow auth-portal__glow--left" />
      <div className="auth-portal__glow auth-portal__glow--right" />

      <div className="auth-portal__shell">
        <header className="auth-portal__topbar">
          <Link className="lend-brand" to="/">
            <strong>reqst</strong>
          </Link>
          <div className="auth-portal__links">
            <Link className="lend-nav-link" to="/">
              {text.landing}
            </Link>
            {hasSession ? (
              <Link className="lend-primary" to="/console">
                {text.console}
              </Link>
            ) : null}
          </div>
        </header>

        <section className="auth-portal__hero">
          <div className="auth-portal__copy">
            <h1>{text.title}</h1>
            <p>{text.body}</p>
          </div>

          <div className="auth-portal__grid">
            <article className="auth-card auth-card--telegram">
              <div className="auth-card__content">
                <h2>{text.telegramTitle}</h2>
                <p>{text.telegramBody}</p>
              </div>
              <div className="auth-card__actions">
                {initData ? (
                  <button
                    type="button"
                    className="lend-primary lend-primary--large"
                    disabled={loading}
                    onClick={() => void performTelegramAuth()}
                  >
                    {loading ? text.signingIn : text.continueTelegram}
                  </button>
                ) : (
                  <div id="telegram-login-container" className="auth-widget-wrapper" />
                )}
                <a className="lend-secondary" href={BOT_URL} target="_blank" rel="noreferrer">
                  {text.openBot}
                </a>
              </div>
            </article>

            <article className="auth-card auth-card--email">
              <div className="auth-card__content">
                <h2>{text.emailTitle}</h2>
                <p>{text.emailBody}</p>
              </div>

              <div className="auth-mode-switch" role="tablist" aria-label="email auth mode">
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

              <form className="auth-card__form auth-card__form--stacked" onSubmit={handleEmailSubmit}>
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
                      <button type="button" className="ghost-button" disabled={sendingCode} onClick={() => void handleSendCode()}>
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
            </article>
          </div>

          {message ? <div className="auth-feedback auth-feedback--success">{message}</div> : null}
          {error ? <div className="alert">{error}</div> : null}
        </section>
      </div>
    </main>
  );
}
