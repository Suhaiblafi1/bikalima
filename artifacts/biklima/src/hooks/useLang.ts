import { useEffect, useState } from "react";
import type { Lang } from "../translations";

const ARABIC_TZ = new Set([
  "Asia/Amman","Asia/Riyadh","Asia/Dubai","Asia/Kuwait","Asia/Qatar",
  "Asia/Bahrain","Asia/Muscat","Africa/Cairo","Asia/Baghdad","Asia/Damascus",
  "Asia/Beirut","Asia/Gaza","Asia/Hebron","Asia/Aden","Africa/Tripoli",
  "Africa/Khartoum","Africa/Juba",
]);

const LANG_EVENT = "bikalima-lang-change";

function detectLang(): Lang {
  try {
    const stored = localStorage.getItem("biklima-lang") as Lang | null;
    if (stored && (["ar", "en"] as string[]).includes(stored)) return stored as Lang;
  } catch {}
  const tz = (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "") || "";
  if (ARABIC_TZ.has(tz)) return "ar";
  return "en";
}

export function useLang() {
  const [lang, setLang] = useState<Lang>(detectLang);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Lang>).detail;
      if (detail === "ar" || detail === "en") setLang(detail);
    };
    window.addEventListener(LANG_EVENT, handler);
    return () => window.removeEventListener(LANG_EVENT, handler);
  }, []);

  const switchLang = (l: Lang) => {
    setLang(l);
    try { localStorage.setItem("biklima-lang", l); } catch {}
    window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: l }));
  };

  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";
  return { lang, switchLang, dir };
}
