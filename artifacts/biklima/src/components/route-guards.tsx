import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Shield, Home as HomeIcon, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "./states";
import { useMe, type Role } from "@/hooks/use-me";
import { getRoleHome, STAFF_ROLES } from "@/lib/role-routing";

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
  return <RoleRoute allowedRoles={STAFF_ROLES} area="admin">{children}</RoleRoute>;
}

type RoleArea = "student" | "trainer" | "parent" | "admin";

const AREA_COPY: Record<RoleArea, { ar: string; en: string }> = {
  student: { ar: "هذه المساحة مخصصة للمتعلمين.", en: "This workspace is for learners." },
  trainer: { ar: "هذه المساحة مخصصة للمدربين.", en: "This workspace is for trainers." },
  parent: { ar: "هذه المساحة مخصصة لأولياء الأمور.", en: "This workspace is for parents." },
  admin: { ar: "هذه المساحة مخصصة لفريق الإدارة.", en: "This workspace is for the administration team." },
};

export function RoleRoute({
  children,
  allowedRoles,
  area,
}: {
  children: ReactNode;
  allowedRoles: readonly Role[];
  area: RoleArea;
}) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { role, isLoading: meLoading } = useMe();
  const [location] = useLocation();
  const [lang] = useState<Lang>(getLangFromStorage);
  const isRtl = lang === "ar";

  if (authLoading || (isAuthenticated && meLoading)) return <FullPageLoading />;

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location || getRoleHome(allowedRoles[0]));
    return <RedirectTo href={`/login?redirect=${redirect}`} />;
  }

  if (role && allowedRoles.includes(role)) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-md w-full text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">{isRtl ? "سننقلك إلى منصتك" : "Taking you to your workspace"}</h2>
        <p className="text-sm text-muted-foreground mb-6">{AREA_COPY[area][lang]}</p>
        <RedirectTo href={getRoleHome(role)} />
      </div>
    </div>
  );
}

function RedirectTo({ href }: { href: string }) {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate(href, { replace: true });
  }, [href, navigate]);
  return <FullPageLoading />;
}

export function StudentRoute({ children }: { children: ReactNode }) {
  return <RoleRoute allowedRoles={["student"]} area="student">{children}</RoleRoute>;
}

export function TrainerRoute({ children }: { children: ReactNode }) {
  return <RoleRoute allowedRoles={["trainer"]} area="trainer">{children}</RoleRoute>;
}

export function ParentRoute({ children }: { children: ReactNode }) {
  return <RoleRoute allowedRoles={["parent"]} area="parent">{children}</RoleRoute>;
}

export function RoleHomeRoute() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { role, isLoading: meLoading } = useMe();
  if (authLoading || (isAuthenticated && meLoading)) return <FullPageLoading />;
  if (!isAuthenticated) return <RedirectTo href="/login" />;
  return <RedirectTo href={getRoleHome(role)} />;
}
