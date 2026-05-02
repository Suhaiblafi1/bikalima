import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { trackWhatsappClick } from "@/lib/analytics";

const DEFAULT_WHATSAPP = "97455377065";
const STORAGE_KEY = "biklima_fab_dismissed_at";

const TEXT = {
  ar: {
    bubble: "تواصل معنا عبر واتساب",
    teaser: "تحتاج مساعدة؟ نحن هنا.",
    open: "افتح المحادثة",
    close: "إغلاق",
    defaultMsg: "السلام عليكم، أودّ الاستفسار عن برامج بكلمة.",
  },
  en: {
    bubble: "Chat with us on WhatsApp",
    teaser: "Need help? We're here.",
    open: "Open chat",
    close: "Close",
    defaultMsg: "Hello, I'd like to know more about Bikalima programs.",
  },
} as const;

function shouldShowTeaser(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const dismissed = window.localStorage.getItem(STORAGE_KEY);
    if (!dismissed) return true;
    const ms = Number(dismissed);
    if (!Number.isFinite(ms)) return true;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    return Date.now() - ms > ONE_DAY;
  } catch {
    return true;
  }
}

export function FloatingWhatsapp() {
  const { lang } = useLang();
  const t = TEXT[lang];
  const { data } = useSiteSettings();

  const number = (data?.settings?.whatsappNumber || DEFAULT_WHATSAPP).replace(/\D/g, "");
  const href = `https://wa.me/${number}?text=${encodeURIComponent(t.defaultMsg)}`;

  const [showTeaser, setShowTeaser] = useState(false);

  useEffect(() => {
    if (!shouldShowTeaser()) return;
    const timer = window.setTimeout(() => setShowTeaser(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  const dismissTeaser = () => {
    setShowTeaser(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="hidden md:flex fixed bottom-5 end-5 z-[60] flex-col items-end gap-2 print:hidden" data-testid="floating-whatsapp">
      <AnimatePresence>
        {showTeaser && (
          <motion.div
            key="teaser"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="relative bg-white dark:bg-card border border-border shadow-xl rounded-2xl px-4 py-3 max-w-[240px]"
          >
            <button
              type="button"
              onClick={dismissTeaser}
              aria-label={t.close}
              className="absolute -top-2 -end-2 w-6 h-6 rounded-full bg-foreground/80 text-background flex items-center justify-center hover:bg-foreground"
              data-testid="floating-whatsapp-dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <p className="text-xs text-foreground leading-relaxed font-medium pe-2">{t.teaser}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.bubble}
        title={t.bubble}
        onClick={() => { dismissTeaser(); trackWhatsappClick("floating_fab"); }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 1 }}
        className="relative bg-[#25D366] hover:bg-[#1ebe5c] text-white rounded-full shadow-2xl w-14 h-14 flex items-center justify-center"
        data-testid="floating-whatsapp-button"
      >
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping" aria-hidden />
        <MessageCircle className="w-7 h-7 relative" strokeWidth={2.2} />
      </motion.a>
    </div>
  );
}
