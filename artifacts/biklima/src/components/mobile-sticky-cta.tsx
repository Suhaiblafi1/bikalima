import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { MessageCircle, Sparkles, CalendarClock } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { trackWhatsappClick, trackZoomBookingClick } from "@/lib/analytics";
import { OPEN_CHAT_EVENT } from "@/components/live-chat-widget";

const TEXT = {
  ar: {
    register: "سجّل اهتمامك",
    consult: "احجز جلسة",
    chat: "محادثة",
  },
  en: {
    register: "Register interest",
    consult: "Book a call",
    chat: "Chat",
  },
} as const;

export function MobileStickyCta() {
  const { lang } = useLang();
  const t = TEXT[lang];
  const [location, navigate] = useLocation();
  const [visible, setVisible] = useState(false);

  // Show after the user has scrolled past the hero (~400px) so it doesn't
  // compete with first impressions. Hide on admin / dashboard routes.
  useEffect(() => {
    const isHidden =
      location.startsWith("/admin") ||
      location.startsWith("/dashboard") ||
      location.startsWith("/checkout") ||
      location.startsWith("/learn") ||
      location.startsWith("/courses/") && location.includes("/learn");
    if (isHidden) {
      setVisible(false);
      return;
    }
    const onScroll = () => setVisible(window.scrollY > 380);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location]);

  if (!visible) return null;

  const goEnroll = () => {
    const isHome = location === "/" || location === "";
    if (isHome) {
      const el = document.getElementById("enroll");
      if (el) {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
        return;
      }
    }
    navigate("/#enroll");
  };

  const goConsult = () => {
    trackZoomBookingClick("mobile_sticky_cta");
    const isHome = location === "/" || location === "";
    if (isHome) {
      const el = document.getElementById("speech-evaluation") || document.getElementById("enroll");
      if (el) {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
        return;
      }
    }
    navigate("/#enroll");
  };

  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-[55] bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_-6px_rgba(0,0,0,0.12)] print:hidden"
      data-testid="mobile-sticky-cta"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      <div className="grid grid-cols-3 gap-1.5 px-2 py-2">
        <button
          type="button"
          onClick={() => {
            trackWhatsappClick("mobile_sticky_cta");
            window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT));
          }}
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-[#25D366] text-white py-2 font-bold text-[11px] active:scale-95 transition-transform"
          data-testid="mobile-sticky-whatsapp"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{t.chat}</span>
        </button>
        <button
          type="button"
          onClick={goEnroll}
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-primary text-primary-foreground py-2 font-bold text-[11px] active:scale-95 transition-transform"
          data-testid="mobile-sticky-register"
        >
          <Sparkles className="w-4 h-4" />
          <span>{t.register}</span>
        </button>
        <button
          type="button"
          onClick={goConsult}
          className="flex flex-col items-center justify-center gap-0.5 rounded-xl bg-accent text-accent-foreground py-2 font-bold text-[11px] active:scale-95 transition-transform"
          data-testid="mobile-sticky-consult"
        >
          <CalendarClock className="w-4 h-4" />
          <span>{t.consult}</span>
        </button>
      </div>
    </div>
  );
}
