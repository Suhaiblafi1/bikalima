import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Ticket, MessageSquare } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { trackWhatsappClick, trackReserveSeatClick } from "@/lib/analytics";
import { OPEN_CHAT_EVENT } from "@/components/live-chat-widget";
import { PROGRAM_SLUGS } from "@/lib/site-config";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useFeatureFlag } from "@/hooks/use-feature-flag";

const FALLBACK_WHATSAPP = "97455377065";

const TEXT = {
  ar: {
    reserve: "احجز مقعدك",
    chat: "محادثة",
  },
  en: {
    reserve: "Reserve seat",
    chat: "Chat",
  },
} as const;

export function MobileStickyCta() {
  const { lang } = useLang();
  const t = TEXT[lang];
  const [location, navigate] = useLocation();
  const [visible, setVisible] = useState(false);
  const liveChatEnabled = useFeatureFlag("live_chat");
  const { data: settingsResp } = useSiteSettings();
  const whatsappRaw = settingsResp?.settings?.whatsappNumber ?? null;
  const whatsappDigits = (whatsappRaw ?? FALLBACK_WHATSAPP).replace(/[^\d]/g, "");

  // Show after the user has scrolled past the hero (~400px) so it doesn't
  // compete with first impressions. Hide on admin / dashboard routes.
  useEffect(() => {
    const isHidden =
      location.startsWith("/admin") ||
      location.startsWith("/dashboard") ||
      location.startsWith("/checkout") ||
      location.startsWith("/learn") ||
      location.startsWith("/programs/") ||
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

  // Site-wide reserve flow goes to checkout for the foundational program.
  // Per-program pages own their own sticky CTA via /programs/* (this bar
  // is hidden there) and route to the program-specific course slug.
  const goReserve = () => {
    trackReserveSeatClick("core", "mobile_sticky_cta");
    navigate(`/checkout?slug=${PROGRAM_SLUGS.core}`);
  };

  const goChat = () => {
    trackWhatsappClick("mobile_sticky_cta");
    // Try the in-page chat widget first, but only if it's actually mounted.
    // Otherwise fall back to WhatsApp so the user always reaches us.
    if (liveChatEnabled && typeof document !== "undefined" &&
        document.querySelector('[data-testid="live-chat-widget"]')) {
      window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT));
      return;
    }
    if (whatsappDigits) {
      const msg = lang === "ar"
        ? "السلام عليكم، أودّ الاستفسار عن برامج بكلمة."
        : "Hello, I'd like to ask about Bikalima's programs.";
      window.open(
        `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(msg)}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  };

  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-[55] bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_-6px_rgba(0,0,0,0.12)] print:hidden"
      data-testid="mobile-sticky-cta"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      <div className="grid grid-cols-2 gap-2 px-2 py-2">
        <button
          type="button"
          onClick={goChat}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary text-secondary-foreground py-2.5 font-bold text-xs active:scale-95 transition-transform"
          data-testid="mobile-sticky-whatsapp"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{t.chat}</span>
        </button>
        <button
          type="button"
          onClick={goReserve}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground py-2.5 font-bold text-xs active:scale-95 transition-transform"
          data-testid="mobile-sticky-register"
        >
          <Ticket className="w-4 h-4" />
          <span>{t.reserve}</span>
        </button>
      </div>
    </div>
  );
}
