import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Shield, Home as HomeIcon, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "./states";

type Lang = "ar" | "en";

function getLangFromStorage(): Lang {
  try {
    const stored = localStorage.getItem("biklima-lang") || localStorage.getItem("bk_lang");
    if (stored === "en") return "en";
    return "ar";
  } catch {
    return "ar";
  }
}

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

function FullPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingState />
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [lang] = useState<Lang>(getLangFromStorage);
  const isRtl = lang === "ar";

  if (isLoading) return <FullPageLoading />;

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center p-6"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="max-w-md w-full text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            {isRtl ? "يلزم تسجيل الدخول" : "Sign in required"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isRtl
              ? "سجّل دخولك للوصول إلى دوراتك ومتابعة التعلّم."
              : "Sign in to access your courses and continue learning."}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-primary hover:bg-primary/90 text-white rounded-full"
            >
              {isRtl ? "تسجيل الدخول" : "Sign in"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/")} className="gap-2 rounded-full">
              <HomeIcon className="w-4 h-4" />
              {isRtl ? "العودة للرئيسية" : "Back home"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [lang] = useState<Lang>(getLangFromStorage);
  const isRtl = lang === "ar";

  useEffect(() => {
    if (isLoading) return;
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
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated]);

  if (isLoading || (isAuthenticated && isAdmin === null)) return <FullPageLoading />;

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center p-6"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="max-w-md w-full text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">
            {isRtl ? "يلزم تسجيل الدخول" : "Sign in required"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isRtl
              ? "هذه المنطقة مخصصة للمشرفين فقط."
              : "This area is restricted to admins."}
          </p>
          <Button
            onClick={() => navigate("/dashboard")}
            className="bg-primary hover:bg-primary/90 text-white rounded-full"
          >
            {isRtl ? "تسجيل الدخول" : "Sign in"}
          </Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center p-6"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="max-w-md w-full text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            {isRtl ? "غير مصرّح بالوصول" : "Access denied"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isRtl
              ? "هذه المنطقة مخصصة للمشرفين فقط."
              : "This area requires admin privileges."}
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="gap-2 rounded-full"
          >
            <HomeIcon className="w-4 h-4" />
            {isRtl ? "العودة للرئيسية" : "Back home"}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
