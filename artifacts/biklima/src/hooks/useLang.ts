import { useEffect, useState } from "react";
import type { Lang } from "../translations";

const LANG_EVENT = "bikalima-lang-change";

// Arabic is the site's default language: visitors who have never picked one
// get Arabic regardless of where they are browsing from. English is only ever
// reached through an explicit choice in the language switcher.
function detectLang(): Lang {
  try {
    const stored = localStorage.getItem("biklima-lang") as Lang | null;
    if (stored && (["ar", "en"] as string[]).includes(stored)) return stored as Lang;
  } catch {}
  return "ar";
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

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const switchLang = (l: Lang) => {
    setLang(l);
    try { localStorage.setItem("biklima-lang", l); } catch {}
    window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: l }));
  };

  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";
  return { lang, switchLang, dir };
}
