import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/phone-input";
import { useMe } from "@/hooks/use-me";
import { AppShell } from "@/components/app-shell";
import StudentAssignmentsTab from "@/components/student-assignments-tab";
import { useLang } from "@/hooks/useLang";
import { upcomingEvents, programs, getLocalizedProgram } from "@/programsData";
import { ExternalLinkDialog } from "@/components/external-link-dialog";
import { Wifi, MapPin, UserCheck, Phone, Save, KeyRound } from "lucide-react";
import {
  User,
  BookOpen,
  ShoppingCart,
  Calendar,
  ChevronRight,
  Clock,
  Mail,
  Home,
  Eye,
  EyeOff,
  Lock,
  Play,
  Shield,
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Video,
  ClipboardList,
  Youtube,
  Star,
  Send,
  ExternalLink,
  ShieldCheck,
  Copy,
  Sparkles,
  Award,
  Mic,
  Users,
} from "lucide-react";

type Lang = "ar" | "en";

const dashT = {
  ar: {
    title: "منصتي — بكلمة",
    welcome: "مرحباً",
    tabs: {
      account: "حسابي",
      courses: "دوراتي",
      orders: "طلباتي",
      schedule: "الجدول الزمني",
      assignments: "الواجبات",
      certificates: "شهاداتي واعتماداتي",
    },
    account: {
      heading: "معلومات الحساب",
      name: "الاسم",
      email: "البريد الإلكتروني",
      memberSince: "عضو منذ",
      editProfile: "تعديل الملف الشخصي",
      firstName: "الاسم الأول",
      lastName: "الاسم الأخير",
      phone: "رقم الهاتف",
      bio: "نبذة شخصية",
      bioPlaceholder: "اكتب نبذة قصيرة عنك (اختياري)…",
      profileImageUrl: "رابط الصورة الشخصية",
      profileImagePlaceholder: "https://...",
      saveChanges: "حفظ التغييرات",
      saved: "تم الحفظ ✓",
      saveError: "تعذّر الحفظ",
      emailReadonly: "لا يمكن تغيير البريد الإلكتروني",
      passwordHeading: "تغيير كلمة المرور",
      currentPassword: "كلمة المرور الحالية",
      newPassword: "كلمة المرور الجديدة",
      confirmNewPassword: "تأكيد كلمة المرور الجديدة",
      changePassword: "تغيير كلمة المرور",
      passwordChanged: "تم تغيير كلمة المرور ✓",
      passwordError: "كلمة المرور الحالية غير صحيحة",
      passwordMismatch: "كلمتا المرور غير متطابقتين",
      passwordMinLen: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
    },
    courses: {
      heading: "الدورات المسجلة",
      noCourses: "لم تسجّل في أي دورة بعد",
      enrollNow: "سجّل الآن",
      progress: "التقدم",
      accessMaterials: "الوصول للمواد",
      viewRecordings: "مشاهدة التسجيلات",
    },
    orders: {
      heading: "سجل الطلبات",
      noOrders: "لا توجد طلبات بعد",
      shopNow: "تصفح الكراسات",
      orderNum: "طلب رقم",
      date: "التاريخ",
      status: "الحالة",
      total: "المجموع",
      statuses: { pending: "قيد المراجعة", confirmed: "مؤكد", shipped: "تم الشحن", delivered: "تم التوصيل" },
    },
    schedule: {
      heading: "الجدول الزمني",
      noSchedule: "لا توجد جلسات مجدولة حالياً",
      upcoming: "الجلسات القادمة",
      yourProgram: "برنامجك",
      joinZoom: "انضم عبر Zoom",
      date: "التاريخ",
      time: "الوقت",
      type: "النوع",
      online: "عن بعد",
      inPerson: "وجاهي",
      location: "الموقع",
    },
    backHome: "العودة للرئيسية",
    logout: "تسجيل الخروج",
    auth: {
      loginTitle: "تسجيل الدخول",
      registerTitle: "إنشاء حساب",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      confirmPassword: "تأكيد كلمة المرور",
      firstName: "الاسم الأول",
      lastName: "الاسم الأخير",
      loginBtn: "تسجيل الدخول",
      registerBtn: "إنشاء الحساب",
      passwordMin: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
      passwordMismatch: "كلمتا المرور غير متطابقتين",
      switchToRegister: "ليس لديك حساب؟ أنشئ حسابًا",
      switchToLogin: "لديك حساب بالفعل؟ سجّل الدخول",
    },
  },
  en: {
    title: "My Platform — Bikalima",
    welcome: "Welcome",
    tabs: {
      account: "My Account",
      courses: "My Courses",
      orders: "My Orders",
      schedule: "Schedule",
      assignments: "Assignments",
      certificates: "My Certificates",
    },
    account: {
      heading: "Account Information",
      name: "Name",
      email: "Email",
      memberSince: "Member since",
      editProfile: "Edit Profile",
      firstName: "First Name",
      lastName: "Last Name",
      phone: "Phone Number",
      bio: "Short Bio",
      bioPlaceholder: "Write a short bio about yourself (optional)…",
      profileImageUrl: "Profile Image URL",
      profileImagePlaceholder: "https://...",
      saveChanges: "Save Changes",
      saved: "Saved ✓",
      saveError: "Save failed",
      emailReadonly: "Email cannot be changed",
      passwordHeading: "Change Password",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmNewPassword: "Confirm New Password",
      changePassword: "Change Password",
      passwordChanged: "Password changed ✓",
      passwordError: "Current password is incorrect",
      passwordMismatch: "Passwords do not match",
      passwordMinLen: "Password must be at least 6 characters",
    },
    courses: {
      heading: "Enrolled Courses",
      noCourses: "You haven't enrolled in any course yet",
      enrollNow: "Enroll Now",
      progress: "Progress",
      accessMaterials: "Access Materials",
      viewRecordings: "View Recordings",
    },
    orders: {
      heading: "Order History",
      noOrders: "No orders yet",
      shopNow: "Browse Workbooks",
      orderNum: "Order #",
      date: "Date",
      status: "Status",
      total: "Total",
      statuses: { pending: "Pending", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered" },
    },
    schedule: {
      heading: "Schedule",
      noSchedule: "No sessions currently scheduled",
      upcoming: "Upcoming Sessions",
      yourProgram: "Your program",
      joinZoom: "Join via Zoom",
      date: "Date",
      time: "Time",
      type: "Type",
      online: "Online",
      inPerson: "In-Person",
      location: "Location",
    },
    backHome: "Back to Home",
    logout: "Log Out",
    auth: {
      loginTitle: "Sign In",
      registerTitle: "Create Account",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      firstName: "First Name",
      lastName: "Last Name",
      loginBtn: "Sign In",
      registerBtn: "Create Account",
      passwordMin: "Password must be at least 6 characters",
      passwordMismatch: "Passwords do not match",
      switchToRegister: "Don't have an account? Sign up",
      switchToLogin: "Already have an account? Sign in",
    },
  },
};

const tabIcons = {
  account: User,
  courses: BookOpen,
  orders: ShoppingCart,
  schedule: Calendar,
  assignments: ClipboardList,
  certificates: ShieldCheck,
};

type Tab = "account" | "courses" | "orders" | "schedule" | "assignments" | "certificates";

type MyCert = {
  id: string;
  code: string;
  fullName: string;
  certType: string;
  programName: string | null;
  issueDate: string;
  expiryDate: string | null;
  status: string;
  certificateFileUrl: string | null;
};

const CERT_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  "trainee": { ar: "متدرب مجتاز", en: "Graduated Trainee" },
  "trainer": { ar: "مدرب معتمد", en: "Certified Trainer" },
  "teacher": { ar: "معلم معتمد", en: "Certified Teacher" },
  "child-facilitator": { ar: "ميسر برنامج الأطفال", en: "Children's Program Facilitator" },
  "ambassador": { ar: "سفير بكلمة", en: "Bikalima Ambassador" },
  "partner-institution": { ar: "مؤسسة شريكة معتمدة", en: "Accredited Partner Institution" },
};
const CERT_STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  active: { ar: "فعالة", en: "Active" },
  expired: { ar: "منتهية", en: "Expired" },
  "under-review": { ar: "قيد المراجعة", en: "Under review" },
  suspended: { ar: "موقوفة", en: "Suspended" },
  revoked: { ar: "ملغاة", en: "Revoked" },
};
const CERT_STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  expired: "bg-amber-100 text-amber-800",
  "under-review": "bg-sky-100 text-sky-800",
  suspended: "bg-orange-100 text-orange-800",
  revoked: "bg-rose-100 text-rose-800",
};

function StudentCertificatesTab({ apiBase, lang }: { apiBase: string; lang: Lang }) {
  const [, navigate] = useLocation();
  const [items, setItems] = useState<MyCert[]>([]);
  const [loading, setLoading] = useState(true);
  const isAr = lang === "ar";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${apiBase}/me/certificates`, { credentials: "include" })
      .then(async (r) => (r.ok ? (await r.json()).certificates ?? [] : []))
      .then((d: MyCert[]) => { if (!cancelled) { setItems(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [apiBase]);

  const copyLink = async (code: string) => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/certificates/${encodeURIComponent(code)}`;
    try {
      await navigator.clipboard.writeText(url);
      alert(isAr ? "تم نسخ رابط التحقق" : "Verification link copied");
    } catch {
      prompt(isAr ? "انسخ الرابط:" : "Copy the link:", url);
    }
  };

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 md:p-8 space-y-4">
        <h3 className="font-bold text-xl flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          {isAr ? "شهاداتي واعتماداتي" : "My Certificates"}
        </h3>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-10 h-10 text-primary/50" />
            </div>
            <p className="text-muted-foreground">
              {isAr ? "لا توجد شهادات بعد." : "No certificates yet."}
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {isAr
                ? "تظهر هنا شهاداتك واعتماداتك الصادرة من بكلمة بمجرد إصدارها."
                : "Your Bikalima certificates and accreditations will appear here once issued."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((c) => (
              <div key={c.id} className="border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-0.5 rounded" dir="ltr">{c.code}</code>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${CERT_STATUS_COLORS[c.status] || "bg-gray-100 text-gray-700"}`}>
                      {CERT_STATUS_LABELS[c.status]?.[lang] ?? c.status}
                    </span>
                  </div>
                  <p className="font-bold mt-1">
                    {(CERT_TYPE_LABELS[c.certType]?.[lang]) ?? c.certType}
                    {c.programName ? <span className="text-muted-foreground font-normal"> · {c.programName}</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isAr ? "صدرت في: " : "Issued: "}
                    {(() => { try { return new Date(c.issueDate).toLocaleDateString(isAr ? "ar-EG" : "en-US"); } catch { return c.issueDate; } })()}
                    {c.expiryDate && (
                      <>
                        {isAr ? " · تنتهي في: " : " · Expires: "}
                        {(() => { try { return new Date(c.expiryDate!).toLocaleDateString(isAr ? "ar-EG" : "en-US"); } catch { return c.expiryDate; } })()}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.certificateFileUrl && (
                    <a
                      href={c.certificateFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-border hover:bg-muted transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {isAr ? "تحميل" : "Download"}
                    </a>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyLink(c.code)}
                    className="rounded-full gap-1.5 h-9"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {isAr ? "نسخ رابط التحقق" : "Copy verify link"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/certificates/${encodeURIComponent(c.code)}`)}
                    className="rounded-full gap-1.5 h-9 bg-primary hover:bg-primary/90 text-white"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isAr ? "صفحة التحقق" : "Verify page"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AuthForm({ lang, t, onAuthenticated }: { lang: Lang; t: typeof dashT.ar; onAuthenticated: () => void }) {
  const { login, register } = useAuth();
  const [, navigate] = useLocation();
  const redirectTarget = (() => {
    if (typeof window === "undefined") return "/dashboard";
    const r = new URLSearchParams(window.location.search).get("redirect");
    if (r && r.startsWith("/") && !r.startsWith("//")) return r;
    return "/dashboard";
  })();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (next: "login" | "register") => {
    setMode(next);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
  };

  const getRedirectTarget = (): string => {
    if (typeof window === "undefined") return "/dashboard";
    const r = new URLSearchParams(window.location.search).get("redirect");
    if (r && r.startsWith("/") && !r.startsWith("//")) return r;
    return "/dashboard";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError(t.auth.passwordMin);
      return;
    }
    if (mode === "register") {
      if (password !== confirmPassword) {
        setError(t.auth.passwordMismatch);
        return;
      }
      setLoading(true);
      const result = await register({ email, password, firstName: firstName || undefined, lastName: lastName || undefined });
      setLoading(false);
      if (result.error) {
        setError(result.error);
      } else {
        onAuthenticated();
        navigate(getRedirectTarget());
      }
    } else {
      setLoading(true);
      const result = await login(email, password);
      setLoading(false);
      if (result.error) {
        setError(result.error);
      } else {
        onAuthenticated();
        navigate(getRedirectTarget());
      }
    }
  };

  const isAr = lang === "ar";
  const isLogin = mode === "login";

  const tagline = isAr
    ? "كلمتك قادرة على تغيير الغرفة."
    : "Your word can change the room.";
  const heroHeadAuthed = isAr ? "أهلاً بعودتك" : "Welcome back";
  const heroHeadGuest = isAr ? "ابدأ رحلتك معنا" : "Begin your journey with us";
  const heroSubAuthed = isAr
    ? "ادخل إلى منصّتك واستأنف تدريبك."
    : "Sign in to your platform and continue your training.";
  const heroSubGuest = isAr
    ? "أنشئ حسابك للوصول إلى دوراتك ومسارك التدريبي."
    : "Create your account to access your courses and learning path.";

  const trustItems = [
    {
      icon: <Mic className="w-4 h-4" />,
      label: isAr ? "تدريب احترافي مباشر" : "Live professional coaching",
    },
    {
      icon: <Award className="w-4 h-4" />,
      label: isAr ? "شهادة معتمدة عند الإتمام" : "Certified upon completion",
    },
    {
      icon: <Users className="w-4 h-4" />,
      label: isAr ? "مجتمع متحدّثين عرب" : "Community of Arab speakers",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-secondary/15 via-background to-secondary/30 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-5 gap-0 bg-card rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden border border-border/60">
        {/* ── BRANDED PANEL ── */}
        <div className="lg:col-span-2 relative bg-primary text-primary-foreground p-8 md:p-10 flex flex-col justify-between overflow-hidden order-2 lg:order-1 min-h-[260px] lg:min-h-[600px]">
          {/* Decorative orbs */}
          <div
            className="absolute -top-24 -end-24 w-72 h-72 rounded-full blur-[100px] opacity-30"
            style={{ backgroundColor: "hsl(var(--gold))" }}
            aria-hidden
          />
          <div className="absolute -bottom-24 -start-24 w-64 h-64 rounded-full blur-[90px] opacity-20 bg-primary-foreground/30" aria-hidden />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="logo-biklima text-4xl leading-none">بكلمة</div>
              <span
                className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full text-primary"
                style={{ backgroundColor: "hsl(var(--gold))" }}
              >
                {isAr ? "منصّتي" : "Platform"}
              </span>
            </div>

            <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight mb-3">
              {isLogin ? heroHeadAuthed : heroHeadGuest}
            </h2>
            <p className="text-primary-foreground/80 text-sm leading-relaxed mb-8 max-w-sm">
              {isLogin ? heroSubAuthed : heroSubGuest}
            </p>

            <ul className="space-y-3 max-w-sm">
              {trustItems.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-primary-foreground/90">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "hsl(var(--gold) / 0.15)", color: "hsl(var(--gold))" }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <blockquote className="relative z-10 mt-8 hidden lg:block">
            <Sparkles
              className="w-5 h-5 mb-2"
              style={{ color: "hsl(var(--gold))" }}
              aria-hidden
            />
            <p className="font-serif italic text-base leading-relaxed text-primary-foreground/95">
              "{tagline}"
            </p>
            <p className="text-xs text-primary-foreground/60 mt-2">— {isAr ? "بكلمة" : "Bikalima"}</p>
          </blockquote>
        </div>

        {/* ── FORM PANEL ── */}
        <div className="lg:col-span-3 p-6 md:p-10 lg:p-12 flex flex-col justify-center order-1 lg:order-2">
          {/* Mode tabs */}
          <div className="flex items-center gap-2 p-1 rounded-full bg-muted/40 border border-border/60 mb-6 w-full max-w-sm mx-auto" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={isLogin}
              onClick={() => switchMode("login")}
              className={`flex-1 text-sm font-bold py-2 rounded-full transition-all ${
                isLogin ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="auth-tab-login"
            >
              {t.auth.loginTitle}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isLogin}
              onClick={() => switchMode("register")}
              className={`flex-1 text-sm font-bold py-2 rounded-full transition-all ${
                !isLogin ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="auth-tab-register"
            >
              {t.auth.registerTitle}
            </button>
          </div>

          <div className="text-center mb-6">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-1">
              {isLogin ? t.auth.loginTitle : t.auth.registerTitle}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLogin
                ? (isAr ? "أدخل بياناتك للوصول إلى منصّتك." : "Enter your details to access your platform.")
                : (isAr ? "بضع لحظات لتجهيز حسابك." : "Just a few moments to set up your account.")}
            </p>
          </div>

          {isLogin && (
            <div
              className="flex items-start gap-3 rounded-2xl border px-4 py-3 text-xs leading-relaxed mb-5"
              style={{
                backgroundColor: "hsl(var(--gold-soft) / 0.5)",
                borderColor: "hsl(var(--gold) / 0.3)",
              }}
              data-testid="auth-credentials-note"
            >
              <ShieldCheck
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: "hsl(var(--gold))" }}
                aria-hidden
              />
            </div>
          )}

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
                  <label htmlFor="auth-firstName" className="text-sm font-medium text-foreground">{t.auth.firstName}</label>
                  <Input
                    id="auth-firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-xl h-11"
                    placeholder={isAr ? "أحمد" : "John"}
                    autoComplete="given-name"
                    data-testid="auth-input-firstName"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="auth-lastName" className="text-sm font-medium text-foreground">{t.auth.lastName}</label>
                  <Input
                    id="auth-lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-xl h-11"
                    placeholder={isAr ? "علي" : "Doe"}
                    autoComplete="family-name"
                    data-testid="auth-input-lastName"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {t.auth.email}
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
              <label htmlFor="auth-password" className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                <Lock className="w-4 h-4 text-muted-foreground" />
                {t.auth.password}
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
                  aria-label={showPassword ? (isAr ? "إخفاء كلمة المرور" : "Hide password") : (isAr ? "إظهار كلمة المرور" : "Show password")}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <label htmlFor="auth-confirmPassword" className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  {t.auth.confirmPassword}
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
                  {isLogin ? t.auth.loginBtn : t.auth.registerBtn}
                  {isAr ? <ArrowLeft className="w-4 h-4 ms-2" /> : <ArrowRight className="w-4 h-4 ms-2" />}
                </>
              )}
            </Button>
          </form>

          <div className="text-center mt-5 text-sm text-muted-foreground">
            {isLogin
              ? (isAr ? "ليس لديك حساب؟ " : "Don't have an account? ")
              : (isAr ? "لديك حساب بالفعل؟ " : "Already have an account? ")}
            <button
              type="button"
              onClick={() => switchMode(isLogin ? "register" : "login")}
              className="text-primary font-bold hover:underline"
              data-testid="auth-switch-mode"
            >
              {isLogin
                ? (isAr ? "أنشئ حسابًا" : "Sign up")
                : (isAr ? "سجّل الدخول" : "Sign in")}
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-5 inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mx-auto"
            data-testid="auth-back-home"
          >
            <Home className="w-3.5 h-3.5" />
            {t.backHome}
          </button>
        </div>
      </div>
    </div>
  );
}

function getApiBase() {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

function AccountTab({ apiBase, lang, t, user }: { apiBase: string; lang: Lang; t: typeof dashT.ar; user: { firstName?: string | null; lastName?: string | null; email?: string | null; profileImageUrl?: string | null } | null | undefined }) {
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl ?? "");
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    fetch(`${apiBase}/me/profile`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.user) return;
        setFirstName(d.user.firstName ?? "");
        setLastName(d.user.lastName ?? "");
        setPhone(d.user.phone ?? "");
        setBio(d.user.bio ?? "");
        setProfileImageUrl(d.user.profileImageUrl ?? "");
      })
      .catch(() => {});
  }, [apiBase]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch(`${apiBase}/auth/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone, bio, profileImageUrl }),
      });
      if (res.ok) setProfileMsg({ type: "ok", text: t.account.saved });
      else setProfileMsg({ type: "err", text: t.account.saveError });
    } catch {
      setProfileMsg({ type: "err", text: t.account.saveError });
    }
    setProfileSaving(false);
    setTimeout(() => setProfileMsg(null), 3500);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword.length < 6) {
      setPwMsg({ type: "err", text: t.account.passwordMinLen });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwMsg({ type: "err", text: t.account.passwordMismatch });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch(`${apiBase}/auth/change-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setPwMsg({ type: "ok", text: t.account.passwordChanged });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else if (res.status === 401) {
        setPwMsg({ type: "err", text: t.account.passwordError });
      } else {
        const j = await res.json().catch(() => ({}));
        setPwMsg({ type: "err", text: j.error || t.account.saveError });
      }
    } catch {
      setPwMsg({ type: "err", text: t.account.saveError });
    }
    setPwSaving(false);
    setTimeout(() => setPwMsg(null), 4500);
  };

  const initials = `${(firstName || "").charAt(0)}${(lastName || "").charAt(0)}`.toUpperCase() || (user?.email?.charAt(0).toUpperCase() ?? "?");

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardContent className="p-6 md:p-8">
          <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {t.account.heading}
          </h3>
          <form onSubmit={saveProfile} className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 border border-primary/20">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <span className="text-2xl font-bold text-primary">{initials}</span>
                )}
              </div>
              <div className="flex-1 w-full space-y-1">
                <label htmlFor="profile-image-url" className="text-xs text-muted-foreground font-medium">{t.account.profileImageUrl}</label>
                <Input id="profile-image-url" type="url" dir="ltr" placeholder={t.account.profileImagePlaceholder} value={profileImageUrl} onChange={(e) => setProfileImageUrl(e.target.value)} className="rounded-xl" data-testid="input-profile-image-url" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="first-name" className="text-xs text-muted-foreground font-medium">{t.account.firstName}</label>
                <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded-xl" data-testid="input-first-name" />
              </div>
              <div className="space-y-1">
                <label htmlFor="last-name" className="text-xs text-muted-foreground font-medium">{t.account.lastName}</label>
                <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded-xl" data-testid="input-last-name" />
              </div>
              <div className="space-y-1">
                <label htmlFor="account-email" className="text-xs text-muted-foreground font-medium flex items-center gap-1"><Mail className="w-3 h-3" />{t.account.email}</label>
                <Input id="account-email" type="email" dir="ltr" value={user?.email ?? ""} readOnly disabled className="rounded-xl bg-muted/40" />
                <p className="text-[10px] text-muted-foreground">{t.account.emailReadonly}</p>
              </div>
              <div className="space-y-1">
                <label htmlFor="phone" className="text-xs text-muted-foreground font-medium flex items-center gap-1"><Phone className="w-3 h-3" />{t.account.phone}</label>
                <PhoneInput id="phone" lang={lang} value={phone} onChange={setPhone} testId="input-phone" />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="bio" className="text-xs text-muted-foreground font-medium">{t.account.bio}</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 500))}
                placeholder={t.account.bioPlaceholder}
                rows={3}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 resize-none"
                data-testid="textarea-bio"
              />
              <p className="text-[10px] text-muted-foreground text-end">{bio.length}/500</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={profileSaving} className="rounded-full bg-primary text-white gap-2" data-testid="button-save-profile">
                <Save className="w-4 h-4" />
                {profileSaving ? "…" : t.account.saveChanges}
              </Button>
              {profileMsg && (
                <span className={`text-sm font-medium ${profileMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>{profileMsg.text}</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-6 md:p-8">
          <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            {t.account.passwordHeading}
          </h3>
          <form onSubmit={changePassword} className="space-y-4 max-w-md">
            <div className="space-y-1">
              <label htmlFor="current-password" className="text-xs text-muted-foreground font-medium">{t.account.currentPassword}</label>
              <Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="rounded-xl" required data-testid="input-current-password" />
            </div>
            <div className="space-y-1">
              <label htmlFor="new-password" className="text-xs text-muted-foreground font-medium">{t.account.newPassword}</label>
              <Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-xl" required minLength={6} data-testid="input-new-password" />
            </div>
            <div className="space-y-1">
              <label htmlFor="confirm-new-password" className="text-xs text-muted-foreground font-medium">{t.account.confirmNewPassword}</label>
              <Input id="confirm-new-password" type="password" autoComplete="new-password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="rounded-xl" required minLength={6} data-testid="input-confirm-new-password" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" disabled={pwSaving || !currentPassword || !newPassword} className="rounded-full bg-primary text-white gap-2" data-testid="button-change-password">
                <KeyRound className="w-4 h-4" />
                {pwSaving ? "…" : t.account.changePassword}
              </Button>
              {pwMsg && (
                <span className={`text-sm font-medium ${pwMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>{pwMsg.text}</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ScheduleTab({ lang, t, courses }: { lang: Lang; t: typeof dashT.ar; courses: Array<{ programId: string | null }> }) {
  const isRtl = lang === "ar";
  const l = (lang === "ar" ? "ar" : "en") as "ar" | "en";
  const enrolledProgramIds = new Set(courses.map(c => c.programId).filter((x): x is string => !!x));

  const sorted = [...upcomingEvents].sort((a, b) => {
    const aMine = enrolledProgramIds.has(a.programId) ? 0 : 1;
    const bMine = enrolledProgramIds.has(b.programId) ? 0 : 1;
    if (aMine !== bMine) return aMine - bMine;
    const parse = (d: string) => {
      const [dd, mm, yyyy] = d.split("/").map(Number);
      return new Date(yyyy, (mm || 1) - 1, dd || 1).getTime();
    };
    return parse(a.startDate) - parse(b.startDate);
  });

  if (sorted.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-6 md:p-8">
          <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {t.schedule.heading}
          </h3>
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 text-primary/50" />
            </div>
            <p className="text-muted-foreground text-lg">{t.schedule.noSchedule}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 md:p-8">
        <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          {t.schedule.heading}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">{t.schedule.upcoming}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {sorted.map(ev => {
            const prog = programs.find(p => p.id === ev.programId);
            const lp = prog ? getLocalizedProgram(prog, lang) : null;
            const isOnline = ev.type === "online";
            const isMine = enrolledProgramIds.has(ev.programId);
            return (
              <div key={ev.id} className={`relative border-2 rounded-2xl p-4 transition-all hover:shadow-md ${isOnline ? "border-blue-200 bg-blue-50/30" : "border-amber-200 bg-amber-50/30"} ${isMine ? "ring-2 ring-primary/30" : ""}`} data-testid={`schedule-event-${ev.id}`}>
                {isMine && (
                  <span className="absolute -top-2 start-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow">
                    <Star className="w-3 h-3" />
                    {t.schedule.yourProgram}
                  </span>
                )}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {lp && <span className="text-xs font-bold text-primary uppercase tracking-wide truncate">{lp.shortTitle}</span>}
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isOnline ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-amber-100 text-amber-700 border border-amber-200"}`}>
                    {isOnline ? <Wifi className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    {isOnline ? t.schedule.online : t.schedule.inPerson}
                  </span>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{ev.trainer[l] || ev.trainer.ar}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{ev.days[l] || ev.days.ar} · {ev.timeSlot[l] || ev.timeSlot.ar}</span>
                  </div>
                  <div className="flex items-center gap-2" dir="ltr">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">{ev.startDate} → {ev.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{ev.location[l] || ev.location.ar}</span>
                  </div>
                </div>
                {!isMine && (
                  <ExternalLinkDialog href={ev.registrationLink}>
                    <Button size="sm" className="mt-3 w-full bg-primary hover:bg-primary/90 text-white rounded-full text-xs gap-1" data-testid={`schedule-register-${ev.id}`}>
                      <ExternalLink className="w-3 h-3" />
                      {isRtl ? "سجّل عبر الموقع الرسمي" : "Register at Official Site"}
                    </Button>
                  </ExternalLinkDialog>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function VideoEmbed({ url }: { url: string }) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return <iframe src={`https://www.youtube.com/embed/${ytId}?rel=0`} className="w-full aspect-video rounded-xl" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
  }
  const vimeoId = getVimeoId(url);
  if (vimeoId) {
    return <iframe src={`https://player.vimeo.com/video/${vimeoId}`} className="w-full aspect-video rounded-xl" allow="autoplay; fullscreen" allowFullScreen />;
  }
  return <div className="w-full aspect-video rounded-xl bg-muted flex items-center justify-center text-muted-foreground"><Video className="w-10 h-10" /></div>;
}

type CourseData = {
  enrollmentId: string;
  courseId: string;
  programId: string | null;
  slug: string | null;
  status: string;
  titleAr: string;
  titleEn: string;
  titleFr: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  descriptionFr: string | null;
  imageUrl: string | null;
  lessons: { id: string; titleAr: string; titleEn: string; titleFr: string; videoUrl: string | null; videoType: string; durationMinutes: number | null; sortOrder: number }[];
  progress: { lessonId: string; completed: boolean }[];
};

type OrderData = {
  id: string;
  workbookId: string;
  quantity: number;
  format: string;
  buyerName: string;
  buyerEmail: string;
  totalPrice: number | null;
  status: string;
  createdAt: string;
};

type LmsOrderData = {
  id: string;
  courseId: string | null;
  courseTitleAr: string | null;
  courseTitleEn: string | null;
  amount: number | null;
  currency: string;
  status: string;
  paymentNotes: string | null;
  createdAt: string;
};

type RequestData = {
  id: string;
  applicantType: string;
  fullName: string;
  programId: string;
  status: string;
  createdAt: string;
};

export default function Dashboard() {
  const { user, isLoading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const { user: meUser, refresh: refreshMe } = useMe();
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const handleResendVerification = async () => {
    setResendState("sending");
    try {
      const r = await fetch(`${apiBase}/auth/resend-verification`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!r.ok) throw new Error("failed");
      setResendState("sent");
      setTimeout(() => { setResendState("idle"); refreshMe(); }, 5000);
    } catch {
      setResendState("error");
      setTimeout(() => setResendState("idle"), 4000);
    }
  };
  const [location, navigate] = useLocation();
  const { lang } = useLang();
  const readTabFromUrl = (): Tab => {
    if (typeof window === "undefined") return "account";
    const t = new URLSearchParams(window.location.search).get("tab");
    const allowed: Tab[] = ["account", "courses", "orders", "assignments", "certificates", "schedule"];
    return (allowed as string[]).includes(t ?? "") ? (t as Tab) : "account";
  };
  const [activeTab, setActiveTab] = useState<Tab>(readTabFromUrl());
  useEffect(() => {
    const handler = () => setActiveTab(readTabFromUrl());
    window.addEventListener("popstate", handler);
    setActiveTab(readTabFromUrl());
    return () => window.removeEventListener("popstate", handler);
  }, [location]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [lmsOrders, setLmsOrders] = useState<LmsOrderData[]>([]);
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [viewingCourse, setViewingCourse] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const apiBase = getApiBase();

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [cRes, oRes, rRes, lmsRes] = await Promise.all([
        fetch(`${apiBase}/my/courses`, { credentials: "include" }),
        fetch(`${apiBase}/my/workbook-orders`, { credentials: "include" }),
        fetch(`${apiBase}/my/enrollment-requests`, { credentials: "include" }),
        fetch(`${apiBase}/my/orders`, { credentials: "include" }),
      ]);
      if (cRes.ok) { const d = await cRes.json(); setCourses(d.courses || []); }
      if (oRes.ok) { const d = await oRes.json(); setOrders(d.orders || []); }
      if (rRes.ok) { const d = await rRes.json(); setRequests(d.requests || []); }
      if (lmsRes.ok) { const d = await lmsRes.json(); setLmsOrders(d.orders || []); }
    } catch {}
    setDataLoading(false);
  }, [apiBase]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      fetch(`${apiBase}/admin/check`, { credentials: "include" })
        .then(r => r.json())
        .then(d => setIsAdmin(!!d.isAdmin))
        .catch(() => setIsAdmin(false));
    }
  }, [isAuthenticated, fetchData, apiBase]);

  const markComplete = async (lessonId: string) => {
    await fetch(`${apiBase}/my/lessons/${lessonId}/complete`, { method: "POST", credentials: "include" });
    fetchData();
  };

  const t = dashT[lang];
  const isRtl = lang === "ar";
  const getTitle = (item: { titleAr: string; titleEn: string; titleFr?: string }) =>
    lang === "ar" ? item.titleAr : (item.titleEn || item.titleAr);
  const getDesc = (item: { descriptionAr?: string | null; descriptionEn?: string | null; descriptionFr?: string | null }) =>
    lang === "ar" ? item.descriptionAr : (item.descriptionEn || item.descriptionAr);

  if (authLoading) {
    return (
      <AppShell containerClassName="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </AppShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <AppShell containerClassName="">
        <AuthForm lang={lang} t={t} onAuthenticated={refreshUser} />
      </AppShell>
    );
  }

  const tabs: Tab[] = ["account", "courses", "assignments", "certificates", "orders", "schedule"];

  const currentCourse = viewingCourse ? courses.find(c => c.courseId === viewingCourse) : null;
  const currentLesson = currentCourse && activeLesson ? currentCourse.lessons.find(l => l.id === activeLesson) : null;

  const statusLabel = (s: string) => {
    const labels: Record<string, Record<string, string>> = {
      ar: { pending: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض", confirmed: "مؤكد", shipped: "تم الشحن", delivered: "تم التوصيل", paid: "مدفوع", cancelled: "ملغى" },
      en: { pending: "Pending", approved: "Approved", rejected: "Rejected", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", paid: "Paid", cancelled: "Cancelled" },
    };
    return labels[lang]?.[s] || s;
  };

  const statusColor = (s: string) => {
    const c: Record<string, string> = { pending: "bg-amber-100 text-amber-800", approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800", confirmed: "bg-blue-100 text-blue-800", shipped: "bg-purple-100 text-purple-800", delivered: "bg-green-100 text-green-800", paid: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800" };
    return c[s] || "bg-gray-100 text-gray-800";
  };

  if (currentCourse && currentLesson) {
    const lessonIdx = currentCourse.lessons.findIndex(l => l.id === currentLesson.id);
    const isCompleted = currentCourse.progress.some(p => p.lessonId === currentLesson.id && p.completed);
    const prevLesson = lessonIdx > 0 ? currentCourse.lessons[lessonIdx - 1] : null;
    const nextLesson = lessonIdx < currentCourse.lessons.length - 1 ? currentCourse.lessons[lessonIdx + 1] : null;

    return (
      <AppShell
        containerClassName=""
        breadcrumb={[
          { label: isRtl ? "منصتي" : "My Platform", href: "/dashboard" },
          { label: getTitle(currentCourse) },
          { label: getTitle(currentLesson) },
        ]}
      >
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-3 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setActiveLesson(null)} className="gap-1">
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {isRtl ? "العودة" : "Back"}
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{getTitle(currentCourse)}</p>
              <p className="font-bold truncate">{getTitle(currentLesson)}</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              {currentLesson.videoUrl ? (
                <VideoEmbed url={currentLesson.videoUrl} />
              ) : (
                <div className="w-full aspect-video rounded-xl bg-muted flex items-center justify-center">
                  <Video className="w-12 h-12 text-muted-foreground" />
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {!isCompleted ? (
                    <Button onClick={() => markComplete(currentLesson.id)} className="bg-primary text-white rounded-full gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {isRtl ? "تمت المشاهدة" : "Mark Complete"}
                    </Button>
                  ) : (
                    <span className="flex items-center gap-1 text-green-600 font-medium text-sm">
                      <CheckCircle className="w-4 h-4" />
                      {isRtl ? "مكتمل" : "Completed"}
                    </span>
                  )}
                  {currentLesson.durationMinutes && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {currentLesson.durationMinutes} {isRtl ? "دقيقة" : "min"}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {prevLesson && <Button variant="outline" size="sm" onClick={() => setActiveLesson(prevLesson.id)} className="gap-1">{isRtl ? <ArrowRight className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />} {isRtl ? "السابق" : "Prev"}</Button>}
                  {nextLesson && <Button variant="outline" size="sm" onClick={() => setActiveLesson(nextLesson.id)} className="gap-1">{isRtl ? "التالي" : "Next"} {isRtl ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}</Button>}
                </div>
              </div>
            </div>

            <div className="lg:w-80 shrink-0">
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <h4 className="font-bold mb-3 text-sm">{isRtl ? "قائمة الدروس" : "Lesson List"}</h4>
                  <div className="space-y-1">
                    {currentCourse.lessons.map((l, idx) => {
                      const done = currentCourse.progress.some(p => p.lessonId === l.id && p.completed);
                      const isCurrent = l.id === currentLesson.id;
                      return (
                        <button key={l.id} onClick={() => setActiveLesson(l.id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-start text-sm transition-colors ${isCurrent ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted"}`}>
                          {done ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> : isCurrent ? <Play className="w-4 h-4 text-primary shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                          <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                          <span className="truncate">{getTitle(l)}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (currentCourse) {
    const completedCount = currentCourse.progress.filter(p => p.completed).length;
    const totalLessons = currentCourse.lessons.length;
    const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    return (
      <AppShell
        containerClassName=""
        breadcrumb={[
          { label: isRtl ? "منصتي" : "My Platform", href: "/dashboard" },
          { label: isRtl ? "دوراتي" : "My Courses" },
          { label: getTitle(currentCourse) },
        ]}
      >
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-3 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setViewingCourse(null)} className="gap-1">
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {isRtl ? "دوراتي" : "My Courses"}
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{getTitle(currentCourse)}</h2>
            {getDesc(currentCourse) && <p className="text-muted-foreground mt-1">{getDesc(currentCourse)}</p>}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-sm font-bold text-primary">{progressPct}%</span>
            <span className="text-xs text-muted-foreground">{completedCount}/{totalLessons}</span>
          </div>

          <div className="space-y-2">
            {currentCourse.lessons.map((lesson, idx) => {
              const done = currentCourse.progress.some(p => p.lessonId === lesson.id && p.completed);
              return (
                <button key={lesson.id} onClick={() => setActiveLesson(lesson.id)} className="w-full flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors text-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-green-100" : "bg-primary/10"}`}>
                    {done ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Play className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{getTitle(lesson)}</p>
                    <p className="text-xs text-muted-foreground">{isRtl ? `الدرس ${idx + 1}` : `Lesson ${idx + 1}`}{lesson.durationMinutes ? ` • ${lesson.durationMinutes} ${isRtl ? "دقيقة" : "min"}` : ""}</p>
                  </div>
                  {lesson.videoUrl && <Video className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>
              );
            })}
            {currentCourse.lessons.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>{isRtl ? "لم تُضَف دروس بعد" : "No lessons added yet"}</p>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      containerClassName=""
      breadcrumb={[{ label: lang === "ar" ? "منصتي" : "My Platform" }]}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">{t.welcome}، {user?.firstName || user?.email} 👋</h2>
        </div>

        {meUser && meUser.emailVerified === false && (
          <div
            className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
            data-testid="email-verify-banner"
          >
            <div className="flex items-start gap-3 flex-1">
              <Mail className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-900 text-sm md:text-base">
                  {lang === "ar" ? "أكّد بريدك الإلكتروني" : "Verify your email"}
                </p>
                <p className="text-sm text-amber-800 leading-relaxed">
                  {lang === "ar"
                    ? `أرسلنا رابط التأكيد إلى ${meUser.email}. رجاءً افتح الرسالة وانقر الرابط لتفعيل حسابك بالكامل.`
                    : `We sent a verification link to ${meUser.email}. Please open it and click the link to fully activate your account.`}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResendVerification}
              disabled={resendState === "sending" || resendState === "sent"}
              className="rounded-full border-amber-400 text-amber-900 hover:bg-amber-100 shrink-0"
              data-testid="resend-verification-btn"
            >
              {resendState === "sending"
                ? (lang === "ar" ? "جارٍ الإرسال..." : "Sending...")
                : resendState === "sent"
                ? (lang === "ar" ? "تم الإرسال ✓" : "Sent ✓")
                : resendState === "error"
                ? (lang === "ar" ? "تعذّر الإرسال" : "Failed")
                : (lang === "ar" ? "إعادة إرسال الرابط" : "Resend link")}
            </Button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          <nav className="md:w-64 shrink-0">
            <div className="bg-card rounded-2xl border border-border p-2 space-y-1 sticky top-24">
              {tabs.map((tab) => {
                const Icon = tabIcons[tab];
                return (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setViewingCourse(null); setActiveLesson(null); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-start ${
                      activeTab === tab
                        ? "bg-primary text-white font-bold shadow-md"
                        : "hover:bg-secondary text-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{t.tabs[tab]}</span>
                    <ChevronRight className={`w-4 h-4 ms-auto ${isRtl ? "rotate-180" : ""} ${activeTab === tab ? "opacity-100" : "opacity-30"}`} />
                  </button>
                );
              })}
              <hr className="border-border my-2" />
              {isAdmin && (
                <button onClick={() => navigate("/admin")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-amber-50 text-amber-700 text-start font-medium">
                  <Shield className="w-5 h-5" />
                  <span>{lang === "ar" ? "لوحة الإدارة" : "Admin Panel"}</span>
                </button>
              )}
              <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary text-muted-foreground text-start">
                <Home className="w-5 h-5" />
                <span>{t.backHome}</span>
              </button>
            </div>
          </nav>

          <main className="flex-1 min-w-0">
            {activeTab === "account" && (
              <AccountTab apiBase={apiBase} lang={lang} t={t} user={user} />
            )}

            {activeTab === "courses" && (
              <Card className="rounded-2xl">
                <CardContent className="p-6 md:p-8">
                  <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    {t.courses.heading}
                  </h3>
                  {dataLoading ? (
                    <div className="py-12 text-center"><div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full mx-auto" /></div>
                  ) : courses.length > 0 ? (
                    <div className="space-y-3">
                      {courses.map(course => {
                        const completedCount = course.progress.filter(p => p.completed).length;
                        const totalLessons = course.lessons.length;
                        const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
                        return (
                          <div key={course.courseId} className={`w-full flex items-center gap-4 bg-background border rounded-xl p-4 transition-colors ${pct === 100 ? "border-green-500/40" : "border-border hover:border-primary/40"}`}>
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${pct === 100 ? "bg-green-100" : "bg-primary/10"}`}>
                              {pct === 100 ? <CheckCircle className="w-7 h-7 text-green-600" /> : <BookOpen className="w-7 h-7 text-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-start">{getTitle(course)}</p>
                                {pct === 100 && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                                    <CheckCircle className="w-3 h-3" />
                                    {isRtl ? "مكتمل" : "Completed"}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground text-start">{totalLessons} {isRtl ? "درس" : "lessons"} • {pct}% {t.courses.progress.toLowerCase()}</p>
                              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-green-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              {course.slug && (
                                <button
                                  onClick={() => navigate(`/courses/${course.slug}/learn`)}
                                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-bold flex items-center gap-1.5 whitespace-nowrap ${pct === 100 ? "bg-green-600 text-white hover:bg-green-700" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                                >
                                  {pct === 100 ? <CheckCircle className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                  {pct === 0
                                    ? (isRtl ? "ابدأ التعلّم" : "Start Learning")
                                    : pct === 100
                                      ? (isRtl ? "عرض الشهادة" : "View Certificate")
                                      : (isRtl ? "متابعة التعلّم" : "Continue Learning")}
                                </button>
                              )}
                              <button
                                onClick={() => setViewingCourse(course.courseId)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
                              >
                                {isRtl ? "تفاصيل" : "Details"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 space-y-4">
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <BookOpen className="w-10 h-10 text-primary/50" />
                      </div>
                      <p className="text-muted-foreground text-lg">{t.courses.noCourses}</p>
                      <Button onClick={() => navigate("/")} className="rounded-full bg-primary text-white">
                        {t.courses.enrollNow}
                      </Button>
                    </div>
                  )}

                  {requests.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-border">
                      <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        {isRtl ? "طلبات التسجيل" : "Enrollment Requests"}
                      </h4>
                      <div className="space-y-2">
                        {requests.map(r => (
                          <div key={r.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3 text-sm">
                            <div>
                              <p className="font-medium">{r.programId}</p>
                              <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString(isRtl ? "ar-SA" : undefined)}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(r.status)}`}>{statusLabel(r.status)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "orders" && (
              <div className="space-y-6">
                {/* LMS Course Orders */}
                <Card className="rounded-2xl">
                  <CardContent className="p-6 md:p-8">
                    <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      {isRtl ? "طلبات الدورات" : "Course Orders"}
                    </h3>
                    {dataLoading ? (
                      <div className="py-8 text-center"><div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full mx-auto" /></div>
                    ) : lmsOrders.length > 0 ? (
                      <div className="space-y-3">
                        {lmsOrders.map((o) => (
                          <div key={o.id} className="flex items-center justify-between bg-muted/30 border border-border/40 rounded-xl p-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{isRtl ? (o.courseTitleAr || "—") : (o.courseTitleEn || o.courseTitleAr || "—")}</p>
                              <p className="text-xs text-muted-foreground mt-1">{new Date(o.createdAt).toLocaleDateString(isRtl ? "ar-SA" : undefined)}</p>
                              {o.paymentNotes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{o.paymentNotes}</p>}
                            </div>
                            <div className="flex items-center gap-3 ms-4 shrink-0">
                              {o.amount && <span className="font-bold text-primary text-sm">{o.amount} JOD</span>}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(o.status)}`}>{statusLabel(o.status)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 space-y-3">
                        <BookOpen className="w-10 h-10 text-primary/30 mx-auto" />
                        <p className="text-muted-foreground">{isRtl ? "لم تُقدّم أي طلب للدورات بعد" : "No course orders yet"}</p>
                        <Button onClick={() => navigate("/courses")} className="rounded-full bg-primary text-white text-sm">
                          {isRtl ? "تصفح الدورات" : "Browse Courses"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Workbook Orders */}
                <Card className="rounded-2xl">
                  <CardContent className="p-6 md:p-8">
                    <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                      {isRtl ? "طلبات الكراسات" : "Workbook Orders"}
                    </h3>
                    {dataLoading ? (
                      <div className="py-8 text-center"><div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full mx-auto" /></div>
                    ) : orders.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b text-muted-foreground">
                            <th className="text-start py-2 px-3 font-medium">{t.orders.orderNum}</th>
                            <th className="text-start py-2 px-3 font-medium">{isRtl ? "الكراسة" : "Workbook"}</th>
                            <th className="text-start py-2 px-3 font-medium">{isRtl ? "الصيغة" : "Format"}</th>
                            <th className="text-start py-2 px-3 font-medium">{t.orders.total}</th>
                            <th className="text-start py-2 px-3 font-medium">{t.orders.status}</th>
                            <th className="text-start py-2 px-3 font-medium">{t.orders.date}</th>
                          </tr></thead>
                          <tbody>
                            {orders.map((o, idx) => (
                              <tr key={o.id} className="border-b border-border/30">
                                <td className="py-3 px-3 font-medium">#{idx + 1}</td>
                                <td className="py-3 px-3">{o.workbookId}</td>
                                <td className="py-3 px-3">{o.format === "pdf" ? (isRtl ? "رقمية" : "PDF") : (isRtl ? "مطبوعة" : "Print")}</td>
                                <td className="py-3 px-3 font-bold">{o.totalPrice} JOD</td>
                                <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(o.status)}`}>{statusLabel(o.status)}</span></td>
                                <td className="py-3 px-3 text-muted-foreground text-xs">{new Date(o.createdAt).toLocaleDateString(isRtl ? "ar-SA" : undefined)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-10 space-y-3">
                        <ShoppingCart className="w-10 h-10 text-primary/30 mx-auto" />
                        <p className="text-muted-foreground">{t.orders.noOrders}</p>
                        <Button onClick={() => navigate("/")} className="rounded-full bg-primary text-white text-sm">
                          {t.orders.shopNow}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "assignments" && (
              <StudentAssignmentsTab apiBase={apiBase} lang={lang} />
            )}

            {activeTab === "certificates" && (
              <StudentCertificatesTab apiBase={apiBase} lang={lang} />
            )}

            {activeTab === "schedule" && (
              <ScheduleTab lang={lang} t={t} courses={courses} />
            )}
          </main>
        </div>
      </div>
    </AppShell>
  );
}
