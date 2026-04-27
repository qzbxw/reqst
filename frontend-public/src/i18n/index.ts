import en from "./en";
import ru from "./ru";

export type Locale = "en" | "ru";

export const LOCALES = ["en", "ru"] as const;
export const DEFAULT_LOCALE: Locale = "en";

export const copyByLocale = { en, ru } as const;
export type PublicCopy = (typeof copyByLocale)[Locale];

export function normalizeLocale(locale: string | undefined): Locale {
  return locale === "ru" ? "ru" : "en";
}

export function getCopy(locale: string | undefined): PublicCopy {
  return copyByLocale[normalizeLocale(locale)];
}
export const PUBLIC_PLAN_COPY = { en: en.plan, ru: ru.plan } as const;
export const PUBLIC_MARKETING_COPY = { 
  en: { ...en.marketing, final: en.final, nav: en.nav, networks: en.networks }, 
  ru: { ...ru.marketing, final: ru.final, nav: ru.nav, networks: ru.networks } 
} as const;
export const PUBLIC_LEGAL_COPY = { privacy: { en: en.legal.privacy, ru: ru.legal.privacy }, terms: { en: en.legal.terms, ru: ru.legal.terms } } as const;
