import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  User,
  BookOpen,
  ShoppingCart,
  Calendar,
  Video,
  LogOut,
  ChevronRight,
  Clock,
  Mail,
  Globe,
  Home,
} from "lucide-react";

type Lang = "ar" | "en" | "fr";

const dashT = {
  ar: {
    title: "لوحة التحكم",
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
    loginRequired: "يرجى تسجيل الدخول للوصول إلى لوحة التحكم",
    loginBtn: "تسجيل الدخول بحساب Google",
  },
  en: {
    title: "Dashboard",
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
    loginRequired: "Please log in to access your dashboard",
    loginBtn: "Sign in with Google",
  },
  fr: {
    title: "Tableau de Bord",
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
    loginRequired: "Veuillez vous connecter pour accéder à votre tableau de bord",
    loginBtn: "Se connecter avec Google",
  },
};

const tabIcons = {
  account: User,
  courses: BookOpen,
  orders: ShoppingCart,
  schedule: Calendar,
};

type Tab = "account" | "courses" | "orders" | "schedule";

export default function Dashboard() {
  const { user, isLoading: authLoading, isAuthenticated, login, logout } = useAuth();
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6" dir={isRtl ? "rtl" : "ltr"}>
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <User className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground">{t.loginRequired}</p>
            <Button onClick={login} className="w-full bg-primary text-white rounded-full h-12 text-lg font-bold">
              <Globe className="w-5 h-5 me-2" />
              {t.loginBtn}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="w-full">
              <Home className="w-4 h-4 me-2" />{t.backHome}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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
            {user?.profileImageUrl && (
              <img src={user.profileImageUrl} alt="" className="w-8 h-8 rounded-full border border-border object-cover" />
            )}
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
                      {user?.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-primary" />
                      )}
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
