import React, { useState, useEffect } from "react";
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

export default function Dashboard() {
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [lang, setLang] = useState<Lang>("ar");
  const [activeTab, setActiveTab] = useState<Tab>("account");

  useEffect(() => {
    const saved = localStorage.getItem("biklima-lang");
    if (saved === "ar" || saved === "en" || saved === "fr") setLang(saved);
  }, []);

  const t = dashT[lang];
  const isRtl = lang === "ar";

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
                    onClick={() => setActiveTab(tab)}
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
                  <div className="text-center py-16 space-y-4">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <BookOpen className="w-10 h-10 text-primary/50" />
                    </div>
                    <p className="text-muted-foreground text-lg">{t.courses.noCourses}</p>
                    <Button onClick={() => navigate("/")} className="rounded-full bg-primary text-white">
                      {t.courses.enrollNow}
                    </Button>
                  </div>
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
                  <div className="text-center py-16 space-y-4">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <ShoppingCart className="w-10 h-10 text-primary/50" />
                    </div>
                    <p className="text-muted-foreground text-lg">{t.orders.noOrders}</p>
                    <Button onClick={() => navigate("/")} className="rounded-full bg-primary text-white">
                      {t.orders.shopNow}
                    </Button>
                  </div>
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
