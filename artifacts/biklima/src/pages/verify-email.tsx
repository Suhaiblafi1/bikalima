import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2, Mail } from "lucide-react";
import { useLang } from "@/hooks/useLang";

type Status = "verifying" | "success" | "error" | "idle";

export default function VerifyEmailPage() {
  const [, navigate] = useLocation();
  const { lang } = useLang();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const t = {
    ar: {
      title: "تأكيد البريد الإلكتروني",
      verifying: "جارٍ تأكيد بريدك...",
      successTitle: "تم تأكيد بريدك بنجاح ✓",
      successMsg: "أصبح حسابك مفعّلاً. يمكنك الآن تصفح برامج بكلمة والتسجيل فيها.",
      errorTitle: "تعذّر تأكيد البريد",
      errorGeneric: "الرابط غير صالح أو منتهي الصلاحية. يمكنك طلب رابط جديد من لوحة التحكم.",
      noToken: "الرابط ناقص — تأكّد من النقر على الرابط الكامل في رسالة التأكيد.",
      goHome: "الانتقال إلى الرئيسية",
      goDashboard: "الذهاب إلى لوحة التحكم",
    },
    en: {
      title: "Email Verification",
      verifying: "Verifying your email...",
      successTitle: "Email verified successfully ✓",
      successMsg: "Your account is now active. You can browse Bikalima programs and enroll.",
      errorTitle: "Verification failed",
      errorGeneric: "This link is invalid or has expired. You can request a new one from your dashboard.",
      noToken: "Link is incomplete — make sure you clicked the full link from the verification email.",
      goHome: "Go to Home",
      goDashboard: "Go to Dashboard",
    },
  }[lang];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage(t.noToken);
      return;
    }
    setStatus("verifying");
    const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
    fetch(`${base}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          throw new Error(data.error || "verification_failed");
        }
        return r.json();
      })
      .then(() => {
        setStatus("success");
        setMessage(t.successMsg);
      })
      .catch(() => {
        setStatus("error");
        setMessage(t.errorGeneric);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell
      containerClassName="flex-1 flex items-center justify-center p-6"
      breadcrumb={[{ label: t.title }]}
    >
      <div className="max-w-lg w-full text-center space-y-6" data-testid="verify-email-page">
        {status === "verifying" && (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold">{t.verifying}</h1>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">{t.successTitle}</h1>
              <p className="text-muted-foreground leading-relaxed">{message}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate("/dashboard")} className="rounded-full">{t.goDashboard}</Button>
              <Button variant="outline" onClick={() => navigate("/")} className="rounded-full">{t.goHome}</Button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">{t.errorTitle}</h1>
              <p className="text-muted-foreground leading-relaxed">{message}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate("/dashboard")} className="rounded-full gap-2">
                <Mail className="w-4 h-4" />{t.goDashboard}
              </Button>
              <Button variant="outline" onClick={() => navigate("/")} className="rounded-full">{t.goHome}</Button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
