import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ChevronDown, Home, LayoutDashboard, LogOut, User } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { NotificationBell } from "@/components/notification-bell";
import { useLang } from "@/hooks/useLang";
import { useMe, type Role } from "@/hooks/use-me";
import { getRoleHome } from "@/lib/role-routing";

const ROLE_LABELS: Record<Role, { ar: string; en: string }> = {
  admin: { ar: "مدير المنصة", en: "Administrator" },
  supervisor: { ar: "مشرف", en: "Supervisor" },
  trainer: { ar: "مدرب", en: "Trainer" },
  student: { ar: "طالب", en: "Learner" },
  sales: { ar: "فريق المبيعات", en: "Sales" },
  parent: { ar: "ولي أمر", en: "Parent" },
};

function getPlatformTitle(location: string, lang: "ar" | "en") {
  const ar = lang === "ar";
  if (location.startsWith("/admin")) return ar ? "لوحة الإدارة" : "Admin workspace";
  if (location.startsWith("/trainer")) return ar ? "مساحة المدرب" : "Trainer workspace";
  if (location.startsWith("/instructor")) return ar ? "مراجعة التسليمات" : "Submission reviews";
  if (location.startsWith("/parent")) return ar ? "مساحة الأسرة" : "Family workspace";
  if (/^\/courses\/[^/]+\/learn(?:\/|$)/.test(location)) return ar ? "مساحة التعلّم" : "Learning space";
  return ar ? "منصتي" : "My platform";
}

export function PlatformHeader() {
  const { lang, switchLang } = useLang();
  const { logout } = useAuth();
  const { user, role } = useMe();
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAr = lang === "ar";
  const roleHome = getRoleHome(role);
  const title = getPlatformTitle(location, lang);
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || (isAr ? "حسابي" : "My account");
  const initials = (user?.firstName?.[0] || user?.email?.[0] || "ب").toUpperCase();

  useEffect(() => setMenuOpen(false), [location]);

  const signOut = async () => {
    setMenuOpen(false);
    await logout();
    navigate(`/login?redirect=${encodeURIComponent(roleHome)}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-card/95 shadow-sm backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center gap-3 px-3 sm:px-4 md:h-18 md:px-6">
        <button
          type="button"
          onClick={() => navigate(roleHome)}
          className="logo-biklima shrink-0 text-2xl leading-none text-primary sm:text-3xl"
          aria-label={isAr ? "الذهاب إلى الصفحة الرئيسية للمنصة" : "Go to platform home"}
        >
          بكلمة
        </button>

        <div className="h-7 w-px bg-border" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground sm:text-base">{title}</p>
          {role && <p className="hidden truncate text-xs text-muted-foreground sm:block">{ROLE_LABELS[role][lang]}</p>}
        </div>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
        >
          <Home className="h-4 w-4" />
          {isAr ? "عرض الموقع" : "View site"}
        </button>

        <div className="hidden items-center rounded-full border border-border bg-background p-0.5 sm:flex" aria-label={isAr ? "اختيار اللغة" : "Choose language"}>
          <button
            type="button"
            onClick={() => switchLang("ar")}
            className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${lang === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            aria-pressed={lang === "ar"}
          >
            ع
          </button>
          <button
            type="button"
            onClick={() => switchLang("en")}
            className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            aria-pressed={lang === "en"}
          >
            EN
          </button>
        </div>

        <NotificationBell />

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-full border border-border bg-background p-1 pe-1.5 transition-colors hover:bg-muted sm:pe-2.5"
            aria-label={isAr ? "فتح قائمة الحساب" : "Open account menu"}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{initials}</span>
            <span className="hidden max-w-28 truncate text-sm font-semibold lg:block">{displayName}</span>
            <ChevronDown className={`hidden h-4 w-4 text-muted-foreground transition-transform sm:block ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <>
              <button className="fixed inset-0 z-30 cursor-default" onClick={() => setMenuOpen(false)} aria-label={isAr ? "إغلاق القائمة" : "Close menu"} />
              <div className="absolute end-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-card shadow-xl" role="menu">
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate text-sm font-bold">{displayName}</p>
                  {user?.email && <p className="mt-0.5 truncate text-xs text-muted-foreground" dir="ltr">{user.email}</p>}
                </div>
                <div className="p-1.5">
                  <button type="button" onClick={() => navigate(roleHome)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-start text-sm hover:bg-muted" role="menuitem">
                    <LayoutDashboard className="h-4 w-4 text-primary" />
                    {isAr ? "الرئيسية في المنصة" : "Platform home"}
                  </button>
                  <button type="button" onClick={() => navigate(roleHome)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-start text-sm hover:bg-muted" role="menuitem">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {isAr ? "الحساب الشخصي" : "My account"}
                  </button>
                  <button type="button" onClick={() => navigate("/")} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-start text-sm hover:bg-muted md:hidden" role="menuitem">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    {isAr ? "عرض الموقع" : "View site"}
                  </button>
                </div>
                <div className="border-t border-border p-1.5">
                  <div className="flex gap-1 px-2 py-1.5 sm:hidden">
                    <button type="button" onClick={() => switchLang("ar")} className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${lang === "ar" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>العربية</button>
                    <button type="button" onClick={() => switchLang("en")} className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${lang === "en" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>English</button>
                  </div>
                  <button type="button" onClick={() => void signOut()} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-start text-sm text-destructive hover:bg-destructive/10" role="menuitem">
                    <LogOut className="h-4 w-4" />
                    {isAr ? "تسجيل الخروج" : "Sign out"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
