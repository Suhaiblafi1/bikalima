import { useCallback, useEffect, useState } from "react";

/**
 * The currency table, the JOD precision and the money formatter now live in
 * @workspace/pricing, because the server needs exactly the same numbers: the
 * Stripe account cannot charge JOD, so the amount is converted before it is
 * charged, and a buyer must never be quoted from one copy of the rates and
 * charged from another. Re-exported here so the many existing importers of
 * "@/lib/site-config" keep working unchanged.
 */
export {
  CURRENCIES,
  JOD_DECIMALS,
  formatMoney,
  convertFromJod,
  currencyByCode,
  type CurrencyConfig,
} from "@workspace/pricing";
import { CURRENCIES, convertFromJod, formatMoney } from "@workspace/pricing";


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
    // convertFromJod, not a bare multiply: the server charges the result of
    // this exact function, so the quote and the charge round identically.
    (jodPrice: number) =>
      `${formatMoney(convertFromJod(jodPrice, currency), currency.decimals)} ${currency.symbol}`,
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
