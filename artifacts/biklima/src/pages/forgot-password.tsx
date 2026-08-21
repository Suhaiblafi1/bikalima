import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/hooks/useLang";
import { usePageMeta } from "@/hooks/use-page-meta";
import { apiFetch } from "@/lib/api-fetch";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, ArrowLeft, MailCheck } from "lucide-react";

type Lang = "ar" | "en";

const t = {
  ar: {
    title: "استعادة كلمة المرور",
    sub: "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.",
    email: "البريد الإلكتروني",
    submit: "أرسل رابط الاستعادة",
    sentTitle: "تحقق من بريدك",
    sentBody:
      "إذا كان هذا البريد مسجلاً لدينا، فقد أرسلنا إليه رابط إعادة تعيين كلمة المرور. الرابط صالح لمدة ساعة واحدة.",
    backToLogin: "العودة لتسجيل الدخول",
    genericError: "تعذّر إرسال الطلب الآن. حاول مرة أخرى بعد قليل.",
  },
  en: {
    title: "Reset your password",
    sub: "Enter your email and we'll send you a reset link.",
    email: "Email",
    submit: "Send reset link",
    sentTitle: "Check your inbox",
    sentBody:
      "If this email is registered, we've sent a password reset link to it. The link is valid for 1 hour.",
    backToLogin: "Back to sign in",
    genericError: "Could not send the request right now. Please try again shortly.",
  },
} as const;

export default function ForgotPasswordPage() {
  usePageMeta({ title: "استعادة كلمة المرور", noindex: true, canonicalPath: "/forgot-password" });
  const { lang } = useLang() as { lang: Lang };
  const tr = t[lang];
  const isAr = lang === "ar";
  const [, navigate] = useLocation();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setError((res as Response & { userMessage?: string }).userMessage ?? tr.genericError);
        return;
      }
      setSent(true);
    } catch {
      setError(tr.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell lang={lang}>
      <div className="bg-card rounded-3xl shadow-xl border border-border/60 p-6 md:p-8">
        {sent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <MailCheck className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground mb-2">{tr.sentTitle}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{tr.sentBody}</p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-full h-12 font-bold"
              data-testid="forgot-back-login"
            >
              {tr.backToLogin}
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-1">
                {tr.title}
              </h1>
              <p className="text-sm text-muted-foreground">{tr.sub}</p>
            </div>

            {error && (
              <div
                className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-2xl px-4 py-3 mb-5 text-center"
                role="alert"
                data-testid="forgot-error"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="forgot-email"
                  className="text-sm font-medium flex items-center gap-1.5 text-foreground"
                >
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {tr.email}
                </label>
                <Input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl h-11"
                  dir="ltr"
                  placeholder="name@example.com"
                  autoComplete="email"
                  data-testid="forgot-input-email"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full h-12 text-base font-bold shadow-lg shadow-primary/20"
                data-testid="forgot-btn-submit"
              >
                {loading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    {tr.submit}
                    {isAr ? (
                      <ArrowLeft className="w-4 h-4 ms-2" />
                    ) : (
                      <ArrowRight className="w-4 h-4 ms-2" />
                    )}
                  </>
                )}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mx-auto"
              data-testid="forgot-back-login-link"
            >
              {tr.backToLogin}
            </button>
          </>
        )}
      </div>
    </AuthShell>
  );
}
