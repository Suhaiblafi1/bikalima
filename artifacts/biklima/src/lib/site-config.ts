import { useCallback, useEffect, useState } from "react";

export type CurrencyConfig = { code: string; symbol: string; name: string; nameEn: string; rate: number };

export const CURRENCIES: Record<string, CurrencyConfig> = {
  DEFAULT: { code: "USD", symbol: "$",   name: "دولار أمريكي", nameEn: "USD $", rate: 1.41 },
  JO:      { code: "JOD", symbol: "د.أ", name: "دينار أردني",  nameEn: "JOD د.أ", rate: 1 },
  SA:      { code: "SAR", symbol: "ر.س", name: "ريال سعودي",  nameEn: "SAR ر.س", rate: 7.92 },
  AE:      { code: "AED", symbol: "د.إ", name: "درهم إماراتي", nameEn: "AED د.إ", rate: 7.77 },
  KW:      { code: "KWD", symbol: "د.ك", name: "دينار كويتي", nameEn: "KWD د.ك", rate: 0.69 },
  QA:      { code: "QAR", symbol: "ر.ق", name: "ريال قطري",  nameEn: "QAR ر.ق", rate: 7.73 },
  BH:      { code: "BHD", symbol: "د.ب", name: "دينار بحريني", nameEn: "BHD د.ب", rate: 0.80 },
  OM:      { code: "OMR", symbol: "ر.ع", name: "ريال عُماني", nameEn: "OMR ر.ع", rate: 0.81 },
  EG:      { code: "EGP", symbol: "ج.م", name: "جنيه مصري",  nameEn: "EGP ج.م", rate: 47.0 },
  MA:      { code: "MAD", symbol: "د.م", name: "درهم مغربي",  nameEn: "MAD د.م", rate: 10.2 },
  TN:      { code: "TND", symbol: "د.ت", name: "دينار تونسي", nameEn: "TND د.ت", rate: 4.5 },
  DZ:      { code: "DZD", symbol: "د.ج", name: "دينار جزائري", nameEn: "DZD د.ج", rate: 190 },
};

export const CURRENCY_ORDER = ["DEFAULT","JO","SA","AE","KW","QA","BH","OM","EG","MA","TN","DZ"];

export function detectCurrencyKey(): string {
  try {
    const stored = localStorage.getItem("biklima-currency");
    if (stored && CURRENCIES[stored]) return stored;
  } catch {}
  const tz = (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "") || "";
  const tzMap: Record<string, string> = {
    "Asia/Amman": "JO", "Asia/Riyadh": "SA", "Asia/Dubai": "AE",
    "Asia/Kuwait": "KW", "Asia/Qatar": "QA", "Asia/Bahrain": "BH",
    "Asia/Muscat": "OM", "Africa/Cairo": "EG",
    "Africa/Casablanca": "MA", "Africa/Tunis": "TN", "Africa/Algiers": "DZ",
  };
  return tzMap[tz] || "DEFAULT";
}

const CURRENCY_EVENT = "bikalima-currency-change";

export function useCurrency() {
  const [currencyKey, setCurrencyKeyState] = useState<string>(detectCurrencyKey);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail && CURRENCIES[detail]) setCurrencyKeyState(detail);
    };
    window.addEventListener(CURRENCY_EVENT, handler);
    return () => window.removeEventListener(CURRENCY_EVENT, handler);
  }, []);

  const currency = CURRENCIES[currencyKey] ?? CURRENCIES.DEFAULT;

  const setCurrencyKey = useCallback((key: string) => {
    if (!CURRENCIES[key]) return;
    try { localStorage.setItem("biklima-currency", key); } catch {}
    setCurrencyKeyState(key);
    window.dispatchEvent(new CustomEvent(CURRENCY_EVENT, { detail: key }));
  }, []);

  const format = useCallback(
    (jodPrice: number) => {
      const converted = Math.round(jodPrice * currency.rate);
      return `${converted} ${currency.symbol}`;
    },
    [currency],
  );

  return { currency, currencyKey, setCurrencyKey, format };
}

// Single source of truth: program id → public web address (slug used in
// /courses/:slug URLs). Every other map below is derived from this one so
// renaming a slug here updates the whole site automatically.
export const PROGRAM_SLUGS: Record<string, string> = {
  core: "influential-speaker",
  tot: "certified-trainer",
  teachers: "educators-program",
  children: "young-speaker",
};

// Inverse of PROGRAM_SLUGS: legacy /courses/:slug → program id (kept so old
// shared/bookmarked /courses/... links can redirect to the canonical
// /programs/:slug page).
export const COURSE_SLUG_TO_PROGRAM_ID: Record<string, string> = Object.fromEntries(
  Object.entries(PROGRAM_SLUGS).map(([id, slug]) => [slug, id]),
);

// Canonical /programs/:slug URLs (this is the public detail page now).
export const PROGRAM_PAGE_SLUGS: Record<string, string> = {
  core: "influential-speaker",
  tot: "trainer-certification",
  teachers: "teachers",
  children: "kids",
};

// Maps any /programs/:slug — current or historical — to its program id so
// the program page can resolve both forms and old links keep working.
export const SLUG_TO_PROGRAM_ID: Record<string, string> = {
  ...COURSE_SLUG_TO_PROGRAM_ID,
  ...Object.fromEntries(Object.entries(PROGRAM_PAGE_SLUGS).map(([id, slug]) => [slug, id])),
};

// Helper: given a /courses/:slug, return the matching /programs/:slug page slug.
export function programPageSlugFromCourseSlug(courseSlug: string): string | null {
  const id = COURSE_SLUG_TO_PROGRAM_ID[courseSlug];
  return id ? PROGRAM_PAGE_SLUGS[id] ?? null : null;
}

export function getBaseUrl(): string {
  return import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
}
