import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/useLang";
import { getAnalyticsConsent, setAnalyticsConsent } from "@/lib/analytics";

/**
 * Ask about analytics without taking over a first visit.
 *
 * Measured on a 390×844 phone, this used to be 186px tall — a fifth of the
 * screen — and it appeared on first paint at `bottom-3`, where it covered the
 * mobile sticky call-to-action entirely (that bar sits at bottom-0 and is 61px
 * high) along with most of the chat launcher. The first thing a new visitor
 * saw was a consent box sitting on top of the button meant to convert them.
 *
 * Three changes, none of them to what it asks or what declining does: it waits
 * a few seconds so the page lands first, it sits above the sticky bar instead
 * of on it, and it is tighter on small screens.
 */

/** Long enough for the hero to land and be read, short enough to still be seen. */
const APPEAR_AFTER_MS = 2500;

export function AnalyticsConsentBanner() {
  const { lang, dir } = useLang();
  const [undecided] = useState(() => getAnalyticsConsent() === null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!undecided) return;
    const timer = window.setTimeout(() => setVisible(true), APPEAR_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [undecided]);

  if (!undecided || !visible) return null;

  const decide = (value: "granted" | "denied") => {
    setAnalyticsConsent(value);
    setVisible(false);
  };

  return (
    <div
      // bottom-[4.5rem] clears the 61px mobile sticky bar; from md up that bar
      // is hidden, so the banner can sit low again.
      className="fixed inset-x-3 bottom-[4.5rem] z-[100] mx-auto max-w-2xl rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur md:bottom-3 md:p-4"
      dir={dir}
      role="dialog"
      aria-label={lang === "ar" ? "إعدادات التحليلات" : "Analytics preferences"}
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
        <BarChart3 className="h-5 w-5 shrink-0 text-primary md:h-6 md:w-6" />
        <p className="flex-1 text-xs leading-relaxed text-foreground md:text-sm">
          {lang === "ar"
            ? "نستخدم تحليلات أولية بلا بيانات شخصية لفهم الصفحات التي تساعد الزوار وتحسين رحلة التسجيل. يمكنك الرفض وسيعمل الموقع بصورة طبيعية."
            : "We use first-party analytics without personal data to improve browsing and registration. You can decline and the site will still work normally."}
        </p>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={() => decide("denied")}>
            {lang === "ar" ? "رفض" : "Decline"}
          </Button>
          <Button size="sm" onClick={() => decide("granted")}>
            {lang === "ar" ? "موافقة" : "Allow"}
          </Button>
        </div>
      </div>
    </div>
  );
}
