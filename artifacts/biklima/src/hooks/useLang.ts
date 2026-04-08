import { useState } from "react";
import type { Lang } from "../translations";

const ARABIC_TZ = new Set([
  "Asia/Amman","Asia/Riyadh","Asia/Dubai","Asia/Kuwait","Asia/Qatar",
  "Asia/Bahrain","Asia/Muscat","Africa/Cairo","Asia/Baghdad","Asia/Damascus",
  "Asia/Beirut","Asia/Gaza","Asia/Hebron","Asia/Aden","Africa/Tripoli",
  "Africa/Khartoum","Africa/Juba",
]);

export function useLang() {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem("biklima-lang") as Lang | null;
      if (stored && (["ar", "en", "fr"] as string[]).includes(stored)) return stored as Lang;
    } catch {}
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (ARABIC_TZ.has(tz)) return "ar";
    return "en";
  });

  const switchLang = (l: Lang) => {
    setLang(l);
    try { localStorage.setItem("biklima-lang", l); } catch {}
  };

  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";
  return { lang, switchLang, dir };
}
