import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  User,
  BookOpen,
  ShoppingCart,
  Calendar,
  LogOut,
  ChevronRight,
  Clock,
  Mail,
  Home,
  Eye,
  EyeOff,
  Lock,
  Play,
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Video,
} from "lucide-react";

type Lang = "ar" | "en" | "fr";

const dashT = {
  ar: {
    title: "منصتي — بكلمة",
    welcome: "مرحباً",
    tabs: {
      account: "حسابي",
      courses: "دوراتي",
      orders: "طلباتي",
      schedule: "الجدول الزمني",
    },
    account: {
      heading: "معلومات الحساب",
      name: "الاسم",
      email: "البريد الإلكتروني",
      memberSince: "عضو منذ",
      editProfile: "تعديل الملف الشخصي",
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
      registerTitle: "إنشاء حساب جديد",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      firstName: "الاسم الأول",
      lastName: "اسم العائلة",
      loginBtn: "تسجيل الدخول",
      registerBtn: "إنشاء حساب",
      switchToRegister: "ليس لديك حساب؟ أنشئ حساباً",
      switchToLogin: "لديك حساب؟ سجّل الدخول",
      passwordMin: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
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
    },
    account: {
      heading: "Account Information",
      name: "Name",
      email: "Email",
      memberSince: "Member since",
      editProfile: "Edit Profile",
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
      firstName: "First Name",
      lastName: "Last Name",
      loginBtn: "Sign In",
      registerBtn: "Create Account",
      switchToRegister: "Don't have an account? Sign up",
      switchToLogin: "Already have an account? Sign in",
      passwordMin: "Password must be at least 6 characters",
    },
  },
  fr: {
    title: "Ma Plateforme — Bikalima",
    welcome: "Bienvenue",
    tabs: {
      account: "Mon Compte",
      courses: "Mes Cours",
      orders: "Mes Commandes",
      schedule: "Calendrier",
    },
    account: {
      heading: "Informations du Compte",
      name: "Nom",
      email: "E-mail",
      memberSince: "Membre depuis",
      editProfile: "Modifier le Profil",
    },
    courses: {
      heading: "Cours Inscrits",
      noCourses: "Vous n'êtes inscrit à aucun cours",
      enrollNow: "S'inscrire",
      progress: "Progression",
      accessMaterials: "Accéder aux Matériaux",
      viewRecordings: "Voir les Enregistrements",
    },
    orders: {
      heading: "Historique des Commandes",
      noOrders: "Aucune commande",
      shopNow: "Parcourir les Cahiers",
      orderNum: "Commande #",
      date: "Date",
      status: "Statut",
      total: "Total",
      statuses: { pending: "En attente", confirmed: "Confirmée", shipped: "Expédiée", delivered: "Livrée" },
    },
    schedule: {
      heading: "Calendrier",
      noSchedule: "Aucune session programmée",
      upcoming: "Sessions à Venir",
      joinZoom: "Rejoindre via Zoom",
      date: "Date",
      time: "Heure",
      type: "Type",
      online: "En ligne",
      inPerson: "En présentiel",
      location: "Lieu",
    },
    backHome: "Retour à l'Accueil",
    logout: "Déconnexion",
    auth: {
      loginTitle: "Connexion",
      registerTitle: "Créer un Compte",
      email: "E-mail",
      password: "Mot de passe",
      firstName: "Prénom",
      lastName: "Nom de famille",
      loginBtn: "Se connecter",
      registerBtn: "Créer un compte",
      switchToRegister: "Pas de compte ? Inscrivez-vous",
      switchToLogin: "Déjà un compte ? Connectez-vous",
      passwordMin: "Le mot de passe doit contenir au moins 6 caractères",
    },
  },
};

const tabIcons = {
  account: User,
  courses: BookOpen,
  orders: ShoppingCart,
  schedule: Calendar,
};

type Tab = "account" | "courses" | "orders" | "schedule";

function AuthForm({ lang, t }: { lang: Lang; t: typeof dashT.ar }) {
  const { login, register } = useAuth();
  const [, navigate] = useLocation();
  const isRtl = lang === "ar";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t.auth.passwordMin);
      return;
    }

    setLoading(true);
    let result: { error?: string };

    if (mode === "login") {
      result = await login(email, password);
    } else {
      result = await register({ email, password, firstName: firstName || undefined, lastName: lastName || undefined });
    }

    setLoading(false);
    if (result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6" dir={isRtl ? "rtl" : "ltr"}>
      <Card className="max-w-md w-full">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="logo-biklima text-5xl text-primary">بكلمة</div>
            <h1 className="text-2xl font-bold">
              {mode === "login" ? t.auth.loginTitle : t.auth.registerTitle}
            </h1>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-4 py-3 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t.auth.firstName}</label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-xl"
                    dir={isRtl ? "rtl" : "ltr"}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t.auth.lastName}</label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-xl"
                    dir={isRtl ? "rtl" : "ltr"}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                {t.auth.email}
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl"
                dir="ltr"
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                {t.auth.password}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl pe-10"
                  dir="ltr"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-full h-12 text-lg font-bold"
            >
              {loading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                mode === "login" ? t.auth.loginBtn : t.auth.registerBtn
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="text-sm text-primary hover:underline font-medium"
            >
              {mode === "login" ? t.auth.switchToRegister : t.auth.switchToLogin}
            </button>
          </div>

          <Button variant="ghost" onClick={() => navigate("/")} className="w-full">
            <Home className="w-4 h-4 me-2" />{t.backHome}
          </Button>
        </CardContent>
      </Card>
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

type RequestData = {
  id: string;
  applicantType: string;
  fullName: string;
  programId: string;
  status: string;
  createdAt: string;
};

export default function Dashboard() {
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [lang, setLang] = useState<Lang>("ar");
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [viewingCourse, setViewingCourse] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const apiBase = getApiBase();

  useEffect(() => {
    const saved = localStorage.getItem("biklima-lang");
    if (saved === "ar" || saved === "en" || saved === "fr") setLang(saved);
  }, []);

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [cRes, oRes, rRes] = await Promise.all([
        fetch(`${apiBase}/my/courses`, { credentials: "include" }),
        fetch(`${apiBase}/my/orders`, { credentials: "include" }),
        fetch(`${apiBase}/my/enrollment-requests`, { credentials: "include" }),
      ]);
      if (cRes.ok) { const d = await cRes.json(); setCourses(d.courses || []); }
      if (oRes.ok) { const d = await oRes.json(); setOrders(d.orders || []); }
      if (rRes.ok) { const d = await rRes.json(); setRequests(d.requests || []); }
    } catch {}
    setDataLoading(false);
  }, [apiBase]);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, fetchData]);

  const markComplete = async (lessonId: string) => {
    await fetch(`${apiBase}/my/lessons/${lessonId}/complete`, { method: "POST", credentials: "include" });
    fetchData();
  };

  const t = dashT[lang];
  const isRtl = lang === "ar";
  const getTitle = (item: { titleAr: string; titleEn: string; titleFr: string }) =>
    lang === "en" ? (item.titleEn || item.titleAr) : lang === "fr" ? (item.titleFr || item.titleAr) : item.titleAr;
  const getDesc = (item: { descriptionAr?: string | null; descriptionEn?: string | null; descriptionFr?: string | null }) =>
    lang === "en" ? (item.descriptionEn || item.descriptionAr) : lang === "fr" ? (item.descriptionFr || item.descriptionAr) : item.descriptionAr;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir={isRtl ? "rtl" : "ltr"}>
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm lang={lang} t={t} />;
  }

  const tabs: Tab[] = ["account", "courses", "orders", "schedule"];

  const currentCourse = viewingCourse ? courses.find(c => c.courseId === viewingCourse) : null;
  const currentLesson = currentCourse && activeLesson ? currentCourse.lessons.find(l => l.id === activeLesson) : null;

  const statusLabel = (s: string) => {
    const labels: Record<string, Record<string, string>> = {
      ar: { pending: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض", confirmed: "مؤكد", shipped: "تم الشحن", delivered: "تم التوصيل" },
      en: { pending: "Pending", approved: "Approved", rejected: "Rejected", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered" },
      fr: { pending: "En attente", approved: "Approuvé", rejected: "Rejeté", confirmed: "Confirmé", shipped: "Expédié", delivered: "Livré" },
    };
    return labels[lang]?.[s] || s;
  };

  const statusColor = (s: string) => {
    const c: Record<string, string> = { pending: "bg-amber-100 text-amber-800", approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800", confirmed: "bg-blue-100 text-blue-800", shipped: "bg-purple-100 text-purple-800", delivered: "bg-green-100 text-green-800" };
    return c[s] || "bg-gray-100 text-gray-800";
  };

  if (currentCourse && currentLesson) {
    const lessonIdx = currentCourse.lessons.findIndex(l => l.id === currentLesson.id);
    const isCompleted = currentCourse.progress.some(p => p.lessonId === currentLesson.id && p.completed);
    const prevLesson = lessonIdx > 0 ? currentCourse.lessons[lessonIdx - 1] : null;
    const nextLesson = lessonIdx < currentCourse.lessons.length - 1 ? currentCourse.lessons[lessonIdx + 1] : null;

    return (
      <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
        <header className="bg-card border-b border-border sticky top-0 z-50">
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
        </header>

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
                      {isRtl ? "تمت المشاهدة" : lang === "fr" ? "Marquer terminé" : "Mark Complete"}
                    </Button>
                  ) : (
                    <span className="flex items-center gap-1 text-green-600 font-medium text-sm">
                      <CheckCircle className="w-4 h-4" />
                      {isRtl ? "مكتمل" : lang === "fr" ? "Terminé" : "Completed"}
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
                  <h4 className="font-bold mb-3 text-sm">{isRtl ? "قائمة الدروس" : lang === "fr" ? "Liste des leçons" : "Lesson List"}</h4>
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
      </div>
    );
  }

  if (currentCourse) {
    const completedCount = currentCourse.progress.filter(p => p.completed).length;
    const totalLessons = currentCourse.lessons.length;
    const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    return (
      <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
        <header className="bg-card border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setViewingCourse(null)} className="gap-1">
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {isRtl ? "دوراتي" : lang === "fr" ? "Mes cours" : "My Courses"}
            </Button>
          </div>
        </header>

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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? "rtl" : "ltr"}>
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="logo-biklima text-3xl text-primary">بكلمة</button>
            <span className="text-muted-foreground hidden sm:inline">|</span>
            <h1 className="font-bold text-lg hidden sm:inline">{t.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium hidden sm:inline">{user?.firstName || user?.email}</span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">{t.welcome}، {user?.firstName || user?.email} 👋</h2>
        </div>

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
              <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary text-muted-foreground text-start">
                <Home className="w-5 h-5" />
                <span>{t.backHome}</span>
              </button>
            </div>
          </nav>

          <main className="flex-1 min-w-0">
            {activeTab === "account" && (
              <Card className="rounded-2xl">
                <CardContent className="p-6 md:p-8">
                  <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    {t.account.heading}
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                      <User className="w-12 h-12 text-primary" />
                    </div>
                    <div className="space-y-4 flex-1">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">{t.account.name}</label>
                          <p className="font-medium">{user?.firstName} {user?.lastName || ""}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium flex items-center gap-1"><Mail className="w-3 h-3" />{t.account.email}</label>
                          <p className="font-medium" dir="ltr">{user?.email || "—"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                          <button key={course.courseId} onClick={() => setViewingCourse(course.courseId)} className="w-full flex items-center gap-4 bg-background border border-border rounded-xl p-4 hover:border-primary/40 transition-colors text-start">
                            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <BookOpen className="w-7 h-7 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold">{getTitle(course)}</p>
                              <p className="text-xs text-muted-foreground">{totalLessons} {isRtl ? "درس" : "lessons"} • {pct}% {t.courses.progress.toLowerCase()}</p>
                              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 text-muted-foreground shrink-0 ${isRtl ? "rotate-180" : ""}`} />
                          </button>
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
                        {isRtl ? "طلبات التسجيل" : lang === "fr" ? "Demandes d'inscription" : "Enrollment Requests"}
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
              <Card className="rounded-2xl">
                <CardContent className="p-6 md:p-8">
                  <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    {t.orders.heading}
                  </h3>
                  {dataLoading ? (
                    <div className="py-12 text-center"><div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full mx-auto" /></div>
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
                    <div className="text-center py-16 space-y-4">
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <ShoppingCart className="w-10 h-10 text-primary/50" />
                      </div>
                      <p className="text-muted-foreground text-lg">{t.orders.noOrders}</p>
                      <Button onClick={() => navigate("/")} className="rounded-full bg-primary text-white">
                        {t.orders.shopNow}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "schedule" && (
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
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
