import { useState, useEffect, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useLang } from "@/hooks/useLang";
import { usePageMeta } from "@/hooks/use-page-meta";
import { apiFetch } from "@/lib/api-fetch";
import { resolvePostAuthDestination } from "@/lib/role-routing";
import type { Role } from "@/hooks/use-me";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Home,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

type Lang = "ar" | "en";

const t = {
  ar: {
    pageTitle: "الدخول إلى منصّتك",
    pageSubLogin: "أدخل بياناتك للوصول إلى منصّتك.",
    pageSubRegister: "بريدك وكلمة مرور فقط — وتكمل ملفك بعد الدخول.",
    loginTitle: "تسجيل الدخول",
    registerTitle: "إنشاء حساب",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    loginBtn: "تسجيل الدخول",
    registerBtn: "إنشاء الحساب",
    switchToRegister: "ليس لديك حساب؟ ",
    switchToLogin: "لديك حساب بالفعل؟ ",
    signUp: "أنشئ حسابًا",
    signIn: "سجّل الدخول",
    backHome: "العودة إلى الصفحة الرئيسية",
    passwordMin: "كلمة المرور الجديدة يجب أن تكون 10 أحرف على الأقل.",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    showPwd: "إظهار كلمة المرور",
    hidePwd: "إخفاء كلمة المرور",
    secureNote: "اتصالك مؤمَّن. لن نشارك بياناتك مع أي طرف ثالث.",
    forgotPassword: "نسيت كلمة المرور؟",
    orDivider: "أو",
    googleBtn: "المتابعة عبر Google",
    oauthError: "تعذّر تسجيل الدخول عبر Google. حاول مرة أخرى أو استخدم بريدك.",
    googleUnavailable: "الدخول عبر Google غير مفعّل بعد. يمكن تفعيله فور إضافة بيانات Google إلى إعدادات المنصة.",
  },
  en: {
    pageTitle: "Sign in to your platform",
    pageSubLogin: "Enter your details to access your platform.",
    pageSubRegister: "Just your email and a password — complete your profile after signing in.",
    loginTitle: "Sign in",
    registerTitle: "Create account",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    loginBtn: "Sign in",
    registerBtn: "Create account",
    switchToRegister: "Don't have an account? ",
    switchToLogin: "Already have an account? ",
    signUp: "Sign up",
    signIn: "Sign in",
    backHome: "Back to home",
    passwordMin: "A new password must be at least 10 characters.",
    passwordMismatch: "Passwords do not match.",
    showPwd: "Show password",
    hidePwd: "Hide password",
    secureNote: "Your connection is secure. We never share your details.",
    forgotPassword: "Forgot your password?",
    orDivider: "or",
    googleBtn: "Continue with Google",
    oauthError: "Google sign-in failed. Try again or use your email.",
    googleUnavailable: "Google sign-in is not enabled yet. Add the Google credentials in platform settings to activate it.",
  },
} as const;

function getRequestedRedirect(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("redirect");
}

export default function LoginPage() {
  usePageMeta({ title: "تسجيل الدخول", noindex: true, canonicalPath: "/login" });
  const { lang } = useLang() as { lang: Lang };
  const tr = t[lang];
  const isAr = lang === "ar";
  const { login, register } = useAuth();
  const [, navigate] = useLocation();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    apiFetch("/auth/providers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { google?: boolean } | null) => setGoogleEnabled(Boolean(data?.google)))
      .catch(() => {});
    // Surface OAuth failures bounced back to /login?oauth_error=...
    if (new URLSearchParams(window.location.search).get("oauth_error")) {
      setError(tr.oauthError);
    }
  }, []);

  const isLogin = mode === "login";

  const switchMode = (next: "login" | "register") => {
    setMode(next);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isLogin && password.length < 10) {
      setError(tr.passwordMin);
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      setError(tr.passwordMismatch);
      return;
    }
    setLoading(true);
    const result =
      mode === "register"
        ? await register({ email, password })
        : await login(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    let role: Role = "student";
    if (mode === "login") {
      try {
        const meResponse = await apiFetch("/me");
        if (meResponse.ok) {
          const me = await meResponse.json() as { user?: { role?: Role } };
          role = me.user?.role ?? "student";
        }
      } catch {
        // The role guard on the destination remains authoritative.
      }
    }
    navigate(resolvePostAuthDestination(role, getRequestedRedirect()));
  };

  return (
    <AuthShell lang={lang}>
      <div className="w-full bg-card rounded-3xl shadow-xl border border-border/60 p-6 md:p-8">
        <div
          className="flex items-center bg-muted/40 rounded-full p-1 mb-6"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={isLogin}
            onClick={() => switchMode("login")}
            className={`flex-1 text-sm font-bold py-2 rounded-full transition-all ${
              isLogin
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="auth-tab-login"
          >
            {tr.loginTitle}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isLogin}
            onClick={() => switchMode("register")}
            className={`flex-1 text-sm font-bold py-2 rounded-full transition-all ${
              !isLogin
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="auth-tab-register"
          >
            {tr.registerTitle}
          </button>
        </div>

        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-1">
            {isLogin ? tr.loginTitle : tr.registerTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? tr.pageSubLogin : tr.pageSubRegister}
          </p>
        </div>

        {error && (
          <div
            className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-2xl px-4 py-3 mb-5 text-center"
            role="alert"
            data-testid="auth-error"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="auth-email"
              className="text-sm font-medium flex items-center gap-1.5 text-foreground"
            >
              <Mail className="w-4 h-4 text-muted-foreground" />
              {tr.email}
            </label>
            <Input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl h-11"
              dir="ltr"
              placeholder="name@example.com"
              autoComplete="email"
              data-testid="auth-input-email"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="auth-password"
              className="text-sm font-medium flex items-center gap-1.5 text-foreground"
            >
              <Lock className="w-4 h-4 text-muted-foreground" />
              {tr.password}
            </label>
            <div className="relative">
              <Input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl pe-10 h-11"
                dir="ltr"
                minLength={isLogin ? 1 : 10}
                autoComplete={isLogin ? "current-password" : "new-password"}
                data-testid="auth-input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? tr.hidePwd : tr.showPwd}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1.5">
              <label
                htmlFor="auth-confirm-password"
                className="text-sm font-medium flex items-center gap-1.5 text-foreground"
              >
                <Lock className="w-4 h-4 text-muted-foreground" />
                {tr.confirmPassword}
              </label>
              <Input
                id="auth-confirm-password"
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl h-11"
                dir="ltr"
                minLength={10}
                autoComplete="new-password"
                data-testid="auth-input-confirm-password"
              />
            </div>
          )}

          {isLogin && (
            <div className="text-end -mt-1">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs text-primary font-medium hover:underline"
                data-testid="auth-forgot-password"
              >
                {tr.forgotPassword}
              </button>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-full h-12 text-base font-bold mt-2 shadow-lg shadow-primary/20"
            data-testid="auth-btn-submit"
          >
            {loading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                {isLogin ? tr.loginBtn : tr.registerBtn}
                {isAr ? (
                  <ArrowLeft className="w-4 h-4 ms-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 ms-2" />
                )}
              </>
            )}
          </Button>
        </form>

        <>
            <div className="flex items-center gap-3 my-5" aria-hidden>
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{tr.orDivider}</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            {googleEnabled ? (
              <a
                href={`${(import.meta.env.BASE_URL ?? "/").replace(/\/$/, "")}/api/auth/google`}
                className="w-full h-12 rounded-full border border-border bg-card hover:bg-muted/40 transition-colors flex items-center justify-center gap-2.5 text-sm font-bold text-foreground"
                data-testid="auth-google-btn"
              >
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
                <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
              </svg>
                {tr.googleBtn}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setError(tr.googleUnavailable)}
                className="w-full h-12 rounded-full border border-border bg-card hover:bg-muted/40 transition-colors flex items-center justify-center gap-2.5 text-sm font-bold text-foreground"
                data-testid="auth-google-btn-unavailable"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
                  <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
                </svg>
                {tr.googleBtn}
              </button>
            )}
          </>

        <p className="flex items-start gap-2 text-xs text-muted-foreground mt-5 leading-relaxed">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-primary/70" />
          <span>{tr.secureNote}</span>
        </p>

        <div className="text-center mt-5 text-sm text-muted-foreground">
          {isLogin ? tr.switchToRegister : tr.switchToLogin}
          <button
            type="button"
            onClick={() => switchMode(isLogin ? "register" : "login")}
            className="text-primary font-bold hover:underline"
            data-testid="auth-switch-mode"
          >
            {isLogin ? tr.signUp : tr.signIn}
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mx-auto"
          data-testid="auth-back-home"
        >
          <Home className="w-3.5 h-3.5" />
          {tr.backHome}
        </button>
      </div>
    </AuthShell>
  );
}
