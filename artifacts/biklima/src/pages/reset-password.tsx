import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useLang } from "@/hooks/useLang";
import { usePageMeta } from "@/hooks/use-page-meta";
import { apiFetch } from "@/lib/api-fetch";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

type Lang = "ar" | "en";

const t = {
  ar: {
    title: "كلمة مرور جديدة",
    sub: "اختر كلمة مرور قوية لحسابك.",
    password: "كلمة المرور الجديدة",
    confirm: "تأكيد كلمة المرور",
    submit: "حفظ كلمة المرور",
    passwordMin: "كلمة المرور يجب أن تكون 6 أحرف على الأقل.",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    invalidToken: "هذا الرابط غير صالح أو انتهت صلاحيته. اطلب رابطاً جديداً.",
    missingToken: "الرابط ناقص. استخدم الرابط الكامل من رسالة البريد.",
    successTitle: "تم تغيير كلمة المرور",
    successBody: "يمكنك الآن تسجيل الدخول بكلمة مرورك الجديدة.",
    goLogin: "تسجيل الدخول",
    requestNew: "طلب رابط جديد",
    genericError: "تعذّر حفظ كلمة المرور. حاول مرة أخرى.",
    showPwd: "إظهار كلمة المرور",
    hidePwd: "إخفاء كلمة المرور",
  },
  en: {
    title: "New password",
    sub: "Choose a strong password for your account.",
    password: "New password",
    confirm: "Confirm password",
    submit: "Save password",
    passwordMin: "Password must be at least 6 characters.",
    passwordMismatch: "Passwords do not match.",
    invalidToken: "This link is invalid or has expired. Please request a new one.",
    missingToken: "The link is incomplete. Use the full link from the email.",
    successTitle: "Password updated",
    successBody: "You can now sign in with your new password.",
    goLogin: "Sign in",
    requestNew: "Request a new link",
    genericError: "Could not save the password. Please try again.",
    showPwd: "Show password",
    hidePwd: "Hide password",
  },
} as const;

function getToken(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("token") ?? "";
}

export default function ResetPasswordPage() {
  usePageMeta({ title: "إعادة تعيين كلمة المرور", noindex: true, canonicalPath: "/reset-password" });
  const { lang } = useLang() as { lang: Lang };
  const tr = t[lang];
  const isAr = lang === "ar";
  const [, navigate] = useLocation();

  const [token] = useState(getToken);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError(tr.passwordMin);
      return;
    }
    if (password !== confirm) {
      setError(tr.passwordMismatch);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(
          body?.error === "Invalid or expired token"
            ? tr.invalidToken
            : ((res as Response & { userMessage?: string }).userMessage ?? tr.genericError),
        );
        return;
      }
      setDone(true);
    } catch {
      setError(tr.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell lang={lang}>
      <div className="bg-card rounded-3xl shadow-xl border border-border/60 p-6 md:p-8">
        {done ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground mb-2">{tr.successTitle}</h1>
            <p className="text-sm text-muted-foreground mb-6">{tr.successBody}</p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-full h-12 font-bold"
              data-testid="reset-goto-login"
            >
              {tr.goLogin}
            </Button>
          </div>
        ) : !token ? (
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-6" role="alert">{tr.missingToken}</p>
            <Button
              onClick={() => navigate("/forgot-password")}
              variant="outline"
              className="w-full rounded-full h-12 font-bold"
              data-testid="reset-request-new"
            >
              {tr.requestNew}
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
                data-testid="reset-error"
              >
                {error}
                {error === tr.invalidToken && (
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="block mx-auto mt-2 text-primary font-bold hover:underline"
                  >
                    {tr.requestNew}
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="reset-password"
                  className="text-sm font-medium flex items-center gap-1.5 text-foreground"
                >
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  {tr.password}
                </label>
                <div className="relative">
                  <Input
                    id="reset-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl pe-10 h-11"
                    dir="ltr"
                    minLength={6}
                    autoComplete="new-password"
                    data-testid="reset-input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? tr.hidePwd : tr.showPwd}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="reset-confirm"
                  className="text-sm font-medium flex items-center gap-1.5 text-foreground"
                >
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  {tr.confirm}
                </label>
                <Input
                  id="reset-confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="rounded-xl h-11"
                  dir="ltr"
                  minLength={6}
                  autoComplete="new-password"
                  data-testid="reset-input-confirm"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full h-12 text-base font-bold mt-2 shadow-lg shadow-primary/20"
                data-testid="reset-btn-submit"
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
          </>
        )}
      </div>
    </AuthShell>
  );
}
