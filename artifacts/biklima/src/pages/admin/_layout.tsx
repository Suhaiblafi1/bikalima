import { type ReactNode } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/app-shell";
import { useMe, type Role } from "@/hooks/use-me";
import { usePageMeta } from "@/hooks/use-page-meta";
import { PAGE_VISIBILITY, type AdminPageKey } from "./_shared";
import {
  BarChart3, Users, BookOpen, GraduationCap, ShoppingCart,
  ClipboardList, Star, Mic2, Settings as SettingsIcon,
  Layout as LayoutIcon, FileText, Film, ShieldCheck, MessageCircle,
  UserPlus, KanbanSquare, ListTodo, Zap, MessageSquareText, Filter,
  ScrollText, ToggleRight, Sparkles,
} from "lucide-react";

type NavItem = {
  key: AdminPageKey;
  label: string;
  href: string;
  icon: ReactNode;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "نظرة عامة",
    items: [
      { key: "overview", label: "نظرة عامة", href: "/admin/overview", icon: <BarChart3 className="w-4 h-4" /> },
    ],
  },
  {
    label: "مركز النمو (CRM)",
    items: [
      { key: "leads",             label: "العملاء المحتملون", href: "/admin/leads",             icon: <UserPlus className="w-4 h-4" /> },
      { key: "pipeline",          label: "خط الإنتاج",        href: "/admin/pipeline",          icon: <KanbanSquare className="w-4 h-4" /> },
      { key: "tasks",             label: "المهام",            href: "/admin/tasks",             icon: <ListTodo className="w-4 h-4" /> },
      { key: "automations",       label: "الأتمتة",           href: "/admin/automations",       icon: <Zap className="w-4 h-4" /> },
      { key: "message-templates", label: "قوالب الرسائل",     href: "/admin/message-templates", icon: <MessageSquareText className="w-4 h-4" /> },
      { key: "funnels",           label: "قمع التحويل",       href: "/admin/funnels",           icon: <Filter className="w-4 h-4" /> },
      { key: "chat",              label: "الشات المباشر",     href: "/admin/chat",              icon: <MessageCircle className="w-4 h-4" /> },
    ],
  },
  {
    label: "نظام التعلّم (LMS)",
    items: [
      { key: "courses",            label: "الدورات",            href: "/admin/courses",            icon: <BookOpen className="w-4 h-4" /> },
      { key: "enrollments",        label: "التسجيلات",          href: "/admin/enrollments",        icon: <GraduationCap className="w-4 h-4" /> },
      { key: "workbook-orders",    label: "طلبات الكراسات",     href: "/admin/workbook-orders",    icon: <ShoppingCart className="w-4 h-4" /> },
      { key: "speech-evaluations", label: "طلبات تقييم الخطاب", href: "/admin/speech-evaluations", icon: <Mic2 className="w-4 h-4" /> },
      { key: "assignments",        label: "الواجبات والتقييم",  href: "/admin/assignments",        icon: <ClipboardList className="w-4 h-4" /> },
      { key: "reviews",            label: "آراء الطلاب",        href: "/admin/reviews",            icon: <Star className="w-4 h-4" /> },
      { key: "certificates",       label: "شهادات الطلاب",       href: "/admin/certificates",     icon: <ShieldCheck className="w-4 h-4" /> },
      { key: "accreditations",     label: "اعتمادات المنصة",     href: "/admin/accreditations",   icon: <ShieldCheck className="w-4 h-4" /> },
    ],
  },
  {
    label: "المحتوى",
    items: [
      { key: "home-page",   label: "الصفحة الرئيسية", href: "/admin/home-page",   icon: <LayoutIcon className="w-4 h-4" /> },
      { key: "workbooks",   label: "الكراسات",        href: "/admin/workbooks",   icon: <FileText className="w-4 h-4" /> },
      { key: "field-media", label: "من الميدان",       href: "/admin/field-media", icon: <Film className="w-4 h-4" /> },
      { key: "impact-stats", label: "الأثر والقصص",    href: "/admin/impact-stats", icon: <Sparkles className="w-4 h-4" /> },
    ],
  },
  {
    label: "الإعدادات",
    items: [
      { key: "users",          label: "المستخدمون",     href: "/admin/users",          icon: <Users className="w-4 h-4" /> },
      { key: "settings",       label: "إعدادات الموقع", href: "/admin/settings",       icon: <SettingsIcon className="w-4 h-4" /> },
      { key: "policies",       label: "الشروط والسياسات", href: "/admin/policies",     icon: <ScrollText className="w-4 h-4" /> },
      { key: "feature-flags",  label: "تفعيل الميزات",  href: "/admin/feature-flags",  icon: <ToggleRight className="w-4 h-4" /> },
      { key: "audit-log",      label: "سجل العمليات",   href: "/admin/audit-log",      icon: <ScrollText className="w-4 h-4" /> },
    ],
  },
];

function canSee(role: Role | null, key: AdminPageKey) {
  if (!role) return false;
  if (role === "admin") return true;
  return PAGE_VISIBILITY[key]?.includes(role) ?? false;
}

export function AdminLayout({
  activeKey,
  children,
}: {
  activeKey: AdminPageKey;
  children: ReactNode;
}) {
  usePageMeta({ title: "لوحة الإدارة", noindex: true });
  const { role } = useMe();
  const [, navigate] = useLocation();

  const visibleGroups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => canSee(role, i.key)) }))
    .filter((g) => g.items.length > 0);
  const allVisible = visibleGroups.flatMap((g) => g.items);

  // Trainers always land on /trainer, not the global admin overview.
  if (role === "trainer" && activeKey === "overview") {
    navigate("/trainer", { replace: true });
    return (
      <AppShell containerClassName="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </AppShell>
    );
  }

  // If the role can't see the active page, redirect to first allowed.
  if (role && !canSee(role, activeKey)) {
    if (role === "trainer") {
      navigate("/trainer", { replace: true });
    } else if (allVisible.length > 0) {
      navigate(allVisible[0].href, { replace: true });
    }
    return (
      <AppShell containerClassName="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </AppShell>
    );
  }

  return (
    <AppShell containerClassName="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Sidebar */}
        <aside className="lg:w-60 shrink-0">
          <nav className="bg-card border border-border rounded-2xl p-2 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-3 pt-2 pb-1">
              لوحة الإدارة
            </p>
            {visibleGroups.map((group, gi) => (
              <div key={group.label} className={gi === 0 ? "" : "mt-3 pt-2 border-t border-border/50"}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-3 py-1.5">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = item.key === activeKey;
                    return (
                      <li key={item.key}>
                        <button
                          onClick={() => navigate(item.href)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-start ${
                            isActive
                              ? "bg-primary text-white shadow-sm"
                              : "text-foreground/80 hover:bg-muted/60 hover:text-foreground"
                          }`}
                        >
                          <span className={isActive ? "text-white" : "text-primary"}>{item.icon}</span>
                          <span className="flex-1 truncate">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-4">{children}</main>
      </div>
    </AppShell>
  );
}
