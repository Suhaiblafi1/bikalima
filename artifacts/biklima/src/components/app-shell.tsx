import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { User, Shield, LogOut, BookOpen, Home as HomeIcon, Menu, X } from "lucide-react";

type Lang = "ar" | "en";

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

type NavItem = { label: string; path: string; icon?: ReactNode };

export function AppShell({
  lang,
  onLangChange,
  children,
  containerClassName = "container mx-auto px-4 py-6",
}: {
  lang: Lang;
  onLangChange?: (l: Lang) => void;
  children: ReactNode;
  containerClassName?: string;
}) {
  const { isAuthenticated, user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isRtl = lang === "ar";

  useEffect(() => {
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang, isRtl]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    fetch(`${getApiBase()}/admin/check`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setIsAdmin(!!d.isAdmin);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const navItems: NavItem[] = [
    { label: isRtl ? "الرئيسية" : "Home", path: "/", icon: <HomeIcon className="w-4 h-4" /> },
    ...(isAuthenticated
      ? [
          {
            label: isRtl ? "دوراتي" : "My Courses",
            path: "/dashboard",
            icon: <BookOpen className="w-4 h-4" />,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            label: isRtl ? "لوحة الإدارة" : "Admin",
            path: "/admin",
            icon: <Shield className="w-4 h-4" />,
          },
        ]
      : []),
  ];

  const isActive = (path: string) =>
    path === "/" ? location === "/" : location.startsWith(path);

  const switchLang = () => onLangChange?.(lang === "ar" ? "en" : "ar");
  const initials = user?.firstName?.[0] || user?.email?.[0] || "U";

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="logo-biklima text-2xl text-primary shrink-0 leading-none"
            aria-label="بكلمة"
          >
            بكلمة
          </button>

          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive(item.path)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 md:hidden" />

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={switchLang}
              className="text-xs px-2.5 py-1 rounded border border-border text-muted-foreground hover:bg-muted transition-colors font-medium"
              aria-label={lang === "ar" ? "Switch to English" : "التبديل للعربية"}
            >
              {lang === "ar" ? "EN" : "AR"}
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors"
                  aria-label={isRtl ? "قائمة المستخدم" : "User menu"}
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold uppercase">
                    {initials}
                  </div>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                    <div
                      className={`absolute top-full mt-1 w-56 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-40 ${
                        isRtl ? "left-0" : "right-0"
                      }`}
                    >
                      <div className="px-3 py-2 border-b border-border">
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/dashboard");
                        }}
                        className="w-full text-start px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-muted-foreground" />
                        {isRtl ? "حسابي" : "My Account"}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            navigate("/admin");
                          }}
                          className="w-full text-start px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4 text-amber-600" />
                          {isRtl ? "لوحة الإدارة" : "Admin Panel"}
                        </button>
                      )}
                      <div className="border-t border-border" />
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-start px-3 py-2 text-sm hover:bg-muted text-destructive transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        {isRtl ? "تسجيل الخروج" : "Sign out"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="rounded-full bg-primary text-white h-8 px-4 text-xs font-bold"
              >
                {isRtl ? "تسجيل الدخول" : "Sign In"}
              </Button>
            )}

            <button
              className="md:hidden p-1.5 rounded hover:bg-muted transition-colors"
              onClick={() => setMobileNavOpen((o) => !o)}
              aria-label={isRtl ? "القائمة" : "Menu"}
            >
              {mobileNavOpen ? (
                <X className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <nav className="md:hidden border-t border-border bg-card">
            <div className="container mx-auto px-4 py-2 flex flex-col">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    setMobileNavOpen(false);
                    navigate(item.path);
                  }}
                  className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 text-start ${
                    isActive(item.path)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className={`flex-1 ${containerClassName}`}>{children}</main>
    </div>
  );
}
