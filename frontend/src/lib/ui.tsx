import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark";
type Language = "ru" | "en";

type UIContextValue = {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  toggleTheme: () => void;
  toggleLanguage: () => void;
};

const UIContext = createContext<UIContextValue | null>(null);

const themeKey = "reqst_theme";
const languageKey = "reqst_language";

export function UIProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  const [language, setLanguage] = useState<Language>(() => {
    const stored = window.localStorage.getItem(languageKey);
    if (stored === "ru" || stored === "en") {
      return stored;
    }
    return navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(themeKey, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(languageKey, language);
  }, [language]);

  const value = useMemo<UIContextValue>(() => ({
    theme,
    language,
    setTheme: () => setTheme("dark"),
    setLanguage,
    toggleTheme: () => setTheme("dark"),
    toggleLanguage: () => setLanguage((current) => (current === "ru" ? "en" : "ru")),
  }), [theme, language]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const value = useContext(UIContext);
  if (!value) {
    throw new Error("useUI must be used inside UIProvider");
  }
  return value;
}
