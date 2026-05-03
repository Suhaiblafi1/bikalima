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

export const PROGRAM_SLUGS: Record<string, string> = {
  core: "influential-speaker",
  tot: "certified-trainer",
  teachers: "educators-program",
  children: "young-speaker",
};

// Legacy /programs/:slug URLs map to program IDs via this table so we can
// redirect old shared/bookmarked links to the unified /courses/:slug page.
export const SLUG_TO_PROGRAM_ID: Record<string, string> = {
  "influential-speaker": "core",
  "trainer-certification": "tot",
  "teachers": "teachers",
  "kids": "children",
  // Also accept the new /courses slugs so the redirect handler can no-op safely.
  "certified-trainer": "tot",
  "educators-program": "teachers",
  "young-speaker": "children",
};

export function getBaseUrl(): string {
  return import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
}
