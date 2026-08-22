import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/useLang";
import { getAnalyticsConsent, setAnalyticsConsent } from "@/lib/analytics";

export function AnalyticsConsentBanner() {
  const { lang, dir } = useLang();
  const [visible, setVisible] = useState(() => getAnalyticsConsent() === null);
  if (!visible) return null;
  const decide = (value: "granted" | "denied") => { setAnalyticsConsent(value); setVisible(false); };
  return <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur" dir={dir} role="dialog" aria-label={lang === "ar" ? "إعدادات التحليلات" : "Analytics preferences"}>
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <BarChart3 className="w-6 h-6 text-primary shrink-0" />
      <p className="text-sm text-foreground flex-1">{lang === "ar" ? "نستخدم تحليلات أولية بلا بيانات شخصية لفهم الصفحات التي تساعد الزوار وتحسين رحلة التسجيل. يمكنك الرفض وسيعمل الموقع بصورة طبيعية." : "We use first-party analytics without personal data to improve browsing and registration. You can decline and the site will still work normally."}</p>
      <div className="flex gap-2 shrink-0"><Button size="sm" variant="outline" onClick={() => decide("denied")}>{lang === "ar" ? "رفض" : "Decline"}</Button><Button size="sm" onClick={() => decide("granted")}>{lang === "ar" ? "موافقة" : "Allow"}</Button></div>
    </div>
  </div>;
}
