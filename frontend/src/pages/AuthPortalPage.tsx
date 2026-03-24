import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authenticate, getStoredToken, setStoredToken } from "../lib/api";
import { useUI } from "../lib/ui";

const BOT_URL = "https://t.me/reqstxyz_bot";
const BOT_NAME = "reqstxyz_bot";

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
    title: "Вход в reqst",
    body: "Используйте ваш аккаунт Telegram для безопасного входа в панель управления продавца.",
    telegramTitle: "Авторизация через Telegram",
    telegramBody: "Если вы заходите с сайта, используйте кнопку ниже. Внутри Telegram-приложения вход произойдет автоматически.",
    openBot: "Открыть бота",
    continueTelegram: "Войти через Telegram",
    signingIn: "Входим...",
    landing: "На главную",
    console: "В консоль",
  },
  en: {
    title: "Sign in to reqst",
    body: "Use your Telegram account to securely access your seller dashboard.",
    telegramTitle: "Telegram Authentication",
    telegramBody: "If you are browsing the website, use the button below. Inside the Telegram app, login is automatic.",
    openBot: "Open Bot",
    continueTelegram: "Login with Telegram",
    signingIn: "Signing in...",
    landing: "Back to Home",
    console: "Open Console",
  },
} as const;

export function AuthPortalPage() {
  const navigate = useNavigate();
  const { language } = useUI();
  const text = COPY[language];
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const hasTelegramInitData = useMemo(() => Boolean(window.Telegram?.WebApp?.initData), []);
  const hasSession = Boolean(getStoredToken());

  // 1. If we already have a session, go to console immediately
  useEffect(() => {
    if (hasSession) {
      navigate("/console", { replace: true });
    }
  }, [hasSession, navigate]);

  // 2. If we are inside Telegram WebApp, try auto-login once
  useEffect(() => {
    if (hasTelegramInitData && !hasSession) {
      void performAuth();
    }
  }, [hasTelegramInitData, hasSession]);

  useEffect(() => {
    // We only need the widget if we are NOT in the WebApp and NO session
    if (hasTelegramInitData || hasSession) return;

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

    (window as any).onTelegramAuth = async (user: any) => {
      const params = new URLSearchParams();
      Object.entries(user).forEach(([k, v]) => params.append(k, String(v)));
      
      try {
        setLoading(true);
        const result = await authenticate({ widget_data: params.toString() });
        setStoredToken(result.token);
        navigate("/console");
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
      }
    };

    return () => {
      if (container) container.innerHTML = "";
      delete (window as any).onTelegramAuth;
    };
  }, [navigate, hasTelegramInitData, hasSession]);

  async function performAuth() {
    try {
      setLoading(true);
      setError("");
      const initData = window.Telegram?.WebApp?.initData;
      if (!initData) {
        throw new Error("No Telegram session found");
      }
      const result = await authenticate({ init_data: initData });
      setStoredToken(result.token);
      navigate("/console");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

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

        <section className="auth-portal__hero auth-portal__hero--centered">
          <div className="auth-portal__copy">
            <h1>{text.title}</h1>
            <p>{text.body}</p>
          </div>

          <div className="auth-portal__main-action">
            <article className="auth-card auth-card--hero">
              <div className="auth-card__content">
                <h2>{text.telegramTitle}</h2>
                <p>{text.telegramBody}</p>
              </div>
              <div className="auth-card__actions">
                {hasTelegramInitData ? (
                  <button 
                    type="button" 
                    className="lend-primary lend-primary--large"
                    disabled={loading} 
                    onClick={() => void performAuth()}
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
              {error ? <div className="alert">{error}</div> : null}
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
