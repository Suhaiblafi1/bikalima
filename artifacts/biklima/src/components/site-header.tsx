import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, User, LogOut, Shield, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import { useAuth } from "@workspace/replit-auth-web";
import { useLang } from "@/hooks/useLang";
import { useCurrency, CURRENCIES, CURRENCY_ORDER, getBaseUrl } from "@/lib/site-config";
import { T, type Lang } from "@/translations";
import { trackInterestFormSubmit } from "@/lib/analytics";

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

type NavTarget =
  | { kind: "section"; id: string; label: string }
  | { kind: "route"; path: string; label: string };

export function SiteHeader() {
  const { lang, switchLang } = useLang();
  const { currency, currencyKey, setCurrencyKey } = useCurrency();
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const t = T[lang];
  const isRtl = lang === "ar";
  const baseUrl = getBaseUrl();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [isRtl, lang]);

  useEffect(() => {
    if (!isAuthenticated) { setIsAdmin(false); return; }
    let cancelled = false;
    // The header "Admin Panel" link should appear for any non-student staff
    // role (admin, trainer, sales) so the role-aware page can take over.
    fetch(`${getApiBase()}/admin/check`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setIsAdmin(!!(d.canAccessAdminArea ?? d.isAdmin)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Lock scroll when mobile menu open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileOpen]);

  const navItems: NavTarget[] = [
    { kind: "section", id: "structure", label: t.nav.structure },
    { kind: "route",   path: "/workbooks", label: t.nav.workbooks },
    { kind: "route",   path: "/gallery",   label: t.nav.gallery },
    { kind: "section", id: "videos",      label: t.nav.videos },
    { kind: "section", id: "events",      label: t.nav.events },
    { kind: "route",   path: "/verify",    label: lang === "ar" ? "تحقق من شهادة" : "Verify certificate" },
  ];

  const isHome = location === "/" || location === "";

  const goToSection = (id: string) => {
    setMobileOpen(false);
    if (isHome) {
      const el = document.getElementById(id);
      if (el) {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
      } else {
        window.location.hash = id;
      }
    } else {
      window.location.assign(`${baseUrl}/#${id}`);
    }
  };

  const goToRoute = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  const goCta = () => {
    trackInterestFormSubmit({ source: "header_cta", action: "scroll_to_form" });
    goToSection("enroll");
  };

  const initials = (user?.firstName?.[0] || user?.email?.[0] || "U").toUpperCase();

  const langButtons: { key: Lang; label: string }[] = [
    { key: "ar", label: "ع" },
    { key: "en", label: "EN" },
  ];

  const isActiveRoute = (path: string) =>
    location === path || location.startsWith(path + "/");

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || !isHome
            ? "bg-background/95 backdrop-blur-md border-b border-border py-3 shadow-sm"
            : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate("/")}
            className="logo-biklima text-3xl md:text-4xl text-primary tracking-tight leading-none shrink-0"
            aria-label="بكلمة"
          >
            بكلمة
          </button>

          <nav className="hidden lg:flex items-center gap-5 font-medium">
            {navItems.map((item) =>
              item.kind === "section" ? (
                <button
                  key={`sec-${item.id}`}
                  onClick={() => goToSection(item.id)}
                  className="text-sm text-foreground/80 hover:text-primary transition-colors"
                >
                  {item.label}
                </button>
              ) : (
                <button
                  key={`route-${item.path}`}
                  onClick={() => goToRoute(item.path)}
                  className={`text-sm transition-colors ${
                    isActiveRoute(item.path)
                      ? "text-primary font-bold"
                      : "text-foreground/80 hover:text-primary"
                  }`}
                >
                  {item.label}
                </button>
              )
            )}
            <Button
              onClick={goCta}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 rounded-full"
            >
              {t.nav.cta}
            </Button>
          </nav>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            {/* Lang */}
            <div className="flex items-center gap-1 border border-border rounded-full overflow-hidden">
              {langButtons.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => switchLang(key)}
                  className={`px-2.5 py-1 text-xs font-bold transition-colors ${
                    lang === key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Currency */}
            <div className="relative">
              <button
                onClick={() => setCurrencyOpen((o) => !o)}
                onBlur={(e) => { if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) setCurrencyOpen(false); }}
                aria-haspopup="listbox"
                aria-expanded={currencyOpen}
                className="flex items-center gap-1 border border-border rounded-full px-2.5 py-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>{currency.symbol}</span>
                <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${currencyOpen ? "rotate-180" : ""}`} />
              </button>
              {currencyOpen && (
                <div className={`absolute top-full mt-1 w-40 bg-background border border-border rounded-xl shadow-lg z-50 py-1 ${isRtl ? "start-0" : "end-0"}`}>
                  {CURRENCY_ORDER.map((key) => (
                    <button
                      key={key}
                      onMouseDown={(e) => { e.preventDefault(); setCurrencyKey(key); setCurrencyOpen(false); }}
                      className={`w-full text-start px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary/50 ${
                        currencyKey === key ? "text-primary font-bold" : "text-foreground/80"
                      }`}
                    >
                      {CURRENCIES[key].code} {CURRENCIES[key].symbol}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            {!authLoading && isAuthenticated && <NotificationBell />}

            {/* Auth */}
            {!authLoading && (isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 px-1.5 py-1 rounded-full hover:bg-secondary/50 transition-colors"
                  aria-label={isRtl ? "قائمة المستخدم" : "User menu"}
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                    {initials}
                  </div>
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                    <div className={`absolute top-full mt-1 w-56 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-40 ${isRtl ? "start-0" : "end-0"}`}>
                      <div className="px-3 py-2 border-b border-border">
                        <p className="text-xs text-muted-foreground truncate" dir="ltr">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate("/dashboard"); }}
                        className="w-full text-start px-3 py-2 text-sm hover:bg-secondary/50 transition-colors flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4 text-primary" />
                        {isRtl ? "منصتي" : "My Platform"}
                      </button>
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate("/dashboard"); }}
                        className="w-full text-start px-3 py-2 text-sm hover:bg-secondary/50 transition-colors flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-muted-foreground" />
                        {isRtl ? "حسابي" : "My Account"}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => { setUserMenuOpen(false); navigate("/admin/overview"); }}
                          className="w-full text-start px-3 py-2 text-sm hover:bg-amber-50 transition-colors flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4 text-amber-600" />
                          {isRtl ? "لوحة الإدارة" : "Admin Panel"}
                        </button>
                      )}
                      <div className="border-t border-border" />
                      <button
                        onClick={() => { setUserMenuOpen(false); logout(); }}
                        className="w-full text-start px-3 py-2 text-sm hover:bg-secondary/50 text-destructive transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        {isRtl ? "تسجيل الخروج" : "Sign out"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate("/dashboard")}
                className="text-xs font-bold text-primary border border-primary/30 px-3 py-1.5 rounded-full hover:bg-primary/5 transition-colors whitespace-nowrap"
              >
                {isRtl ? "تسجيل الدخول" : "Log in"}
              </button>
            ))}
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden text-foreground p-1.5"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={isRtl ? "القائمة" : "Menu"}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-background overflow-y-auto"
          >
            <div className="container mx-auto px-6 py-6">
              <div className="flex items-center justify-between mb-8">
                <div className="logo-biklima text-3xl text-primary leading-none">بكلمة</div>
                <button onClick={() => setMobileOpen(false)} className="p-2 text-foreground" aria-label="Close">
                  <X size={26} />
                </button>
              </div>

              <nav className="flex flex-col">
                {navItems.map((item) =>
                  item.kind === "section" ? (
                    <button
                      key={`m-sec-${item.id}`}
                      onClick={() => goToSection(item.id)}
                      className="text-xl font-serif text-start text-foreground/90 border-b border-border py-4"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <button
                      key={`m-route-${item.path}`}
                      onClick={() => goToRoute(item.path)}
                      className={`text-xl font-serif text-start border-b border-border py-4 ${
                        isActiveRoute(item.path) ? "text-primary font-bold" : "text-foreground/90"
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                )}
              </nav>

              <Button
                size="lg"
                onClick={goCta}
                className="w-full mt-6 text-base bg-primary rounded-full font-bold"
              >
                {t.nav.mobileCta}
              </Button>

              {!authLoading && (
                <div className="mt-4 space-y-2">
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={() => { setMobileOpen(false); navigate("/dashboard"); }}
                        className="w-full text-center py-3 font-bold text-primary border border-primary/30 rounded-2xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        {isRtl ? "منصتي" : "My Platform"}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => { setMobileOpen(false); navigate("/admin/overview"); }}
                          className="w-full text-center py-3 font-bold text-amber-700 border border-amber-300 rounded-2xl hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Shield className="w-4 h-4" />
                          {isRtl ? "لوحة الإدارة" : "Admin Panel"}
                        </button>
                      )}
                      <button
                        onClick={() => { setMobileOpen(false); logout(); }}
                        className="w-full text-center py-2.5 text-sm text-muted-foreground hover:text-destructive border border-border rounded-2xl flex items-center justify-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        {isRtl ? "تسجيل الخروج" : "Sign out"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setMobileOpen(false); navigate("/dashboard"); }}
                      className="w-full text-center py-3 font-bold text-primary border border-primary/30 rounded-2xl hover:bg-primary/5 transition-colors"
                    >
                      {isRtl ? "تسجيل الدخول / إنشاء حساب" : "Log in / Sign up"}
                    </button>
                  )}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-center gap-2 mb-4">
                  {langButtons.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => switchLang(key)}
                      className={`px-5 py-2 text-sm font-bold rounded-full border transition-colors ${
                        lang === key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-muted-foreground text-center mb-2 font-medium">
                  {isRtl ? "العملة" : "Currency"}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {CURRENCY_ORDER.map((key) => (
                    <button
                      key={key}
                      onClick={() => { setCurrencyKey(key); }}
                      className={`py-2 px-1 text-[11px] font-bold rounded-lg border transition-colors text-center ${
                        currencyKey === key
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {CURRENCIES[key].code}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
