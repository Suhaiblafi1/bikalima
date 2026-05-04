import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useLang } from "@/hooks/useLang";
import { usePageMeta } from "@/hooks/use-page-meta";
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
    pageSubRegister: "بضع لحظات لتجهيز حسابك.",
    loginTitle: "تسجيل الدخول",
    registerTitle: "إنشاء حساب",
    firstName: "الاسم الأول",
    lastName: "الاسم الأخير",
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
    passwordMin: "كلمة المرور يجب أن تكون 6 أحرف على الأقل.",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    showPwd: "إظهار كلمة المرور",
    hidePwd: "إخفاء كلمة المرور",
    secureNote: "اتصالك مؤمَّن. لن نشارك بياناتك مع أي طرف ثالث.",
    placeholderFirst: "أحمد",
    placeholderLast: "علي",
  },
  en: {
    pageTitle: "Sign in to your platform",
    pageSubLogin: "Enter your details to access your platform.",
    pageSubRegister: "Just a few moments to set up your account.",
    loginTitle: "Sign in",
    registerTitle: "Create account",
    firstName: "First name",
    lastName: "Last name",
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
    passwordMin: "Password must be at least 6 characters.",
    passwordMismatch: "Passwords do not match.",
    showPwd: "Show password",
    hidePwd: "Hide password",
    secureNote: "Your connection is secure. We never share your details.",
    placeholderFirst: "John",
    placeholderLast: "Doe",
  },
} as const;

function getRedirectTarget(): string {
  if (typeof window === "undefined") return "/dashboard";
  const r = new URLSearchParams(window.location.search).get("redirect");
  if (!r) return "/dashboard";
  // Reject:
  //  - protocol-relative URLs ("//evil.com") — these escape origin
  //  - absolute URLs ("http://...", "https://...", "javascript:")
  //  - non-page internal prefixes (/api, /auth, /webhooks) — never
  //    a useful destination for a browser navigation after login
  if (!r.startsWith("/") || r.startsWith("//")) return "/dashboard";
  const lower = r.toLowerCase();
  const denied = ["/api/", "/api?", "/auth/", "/webhooks/"];
  if (denied.some((p) => lower === p.replace(/[/?]$/, "") || lower.startsWith(p))) {
    return "/dashboard";
  }
  return r;
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  const switchMode = (next: "login" | "register") => {
    setMode(next);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError(tr.passwordMin);
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setError(tr.passwordMismatch);
      return;
    }
    setLoading(true);
    const result =
      mode === "register"
        ? await register({
            email,
            password,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
          })
        : await login(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    navigate(getRedirectTarget());
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen bg-gradient-to-br from-secondary/15 via-background to-secondary/30 flex items-center justify-center p-4 md:p-8"
    >
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl border border-border/60 p-6 md:p-8">
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
          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="auth-firstName"
                  className="text-sm font-medium text-foreground"
                >
                  {tr.firstName}
                </label>
                <Input
                  id="auth-firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-xl h-11"
                  placeholder={tr.placeholderFirst}
                  autoComplete="given-name"
                  data-testid="auth-input-firstName"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="auth-lastName"
                  className="text-sm font-medium text-foreground"
                >
                  {tr.lastName}
                </label>
                <Input
                  id="auth-lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-xl h-11"
                  placeholder={tr.placeholderLast}
                  autoComplete="family-name"
                  data-testid="auth-input-lastName"
                />
              </div>
            </div>
          )}

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
                minLength={6}
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
                htmlFor="auth-confirmPassword"
                className="text-sm font-medium flex items-center gap-1.5 text-foreground"
              >
                <Lock className="w-4 h-4 text-muted-foreground" />
                {tr.confirmPassword}
              </label>
              <Input
                id="auth-confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl h-11"
                dir="ltr"
                minLength={6}
                autoComplete="new-password"
                data-testid="auth-input-confirmPassword"
              />
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
    </div>
  );
}
