import { type ReactNode, useState } from "react";
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
  ScrollText, ToggleRight, Sparkles, BadgePercent, CalendarDays, ChevronDown,
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
      { key: "analytics", label: "التحليلات", href: "/admin/analytics", icon: <BarChart3 className="w-4 h-4" /> },
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
      { key: "in-person-courses",  label: "الدورات الوجاهية",   href: "/admin/in-person-courses",  icon: <CalendarDays className="w-4 h-4" /> },
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
      { key: "discount-codes", label: "أكواد الخصم",    href: "/admin/discount-codes", icon: <BadgePercent className="w-4 h-4" /> },
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
  const activeGroupLabel = visibleGroups.find((group) => group.items.some((item) => item.key === activeKey))?.label;
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(activeGroupLabel ? [activeGroupLabel] : visibleGroups[0]?.label ? [visibleGroups[0].label] : []),
  );

  const toggleGroup = (label: string) => {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

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
      <div className="lg:hidden sticky top-16 z-30 -mx-3 -mt-4 mb-4 border-b border-border bg-background/95 px-3 py-3 shadow-sm backdrop-blur-xl sm:-mx-4 sm:px-4">
        <label htmlFor="admin-mobile-navigation" className="mb-1.5 block text-sm font-bold">
          الانتقال داخل لوحة الإدارة
        </label>
        <select
          id="admin-mobile-navigation"
          value={activeKey}
          onChange={(event) => {
            const target = allVisible.find((item) => item.key === event.target.value);
            if (target) navigate(target.href);
          }}
          className="min-h-11 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {visibleGroups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.items.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block lg:w-60 shrink-0">
          <nav className="bg-card border border-border rounded-2xl p-2 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-3 pt-2 pb-1">
              لوحة الإدارة
            </p>
            {visibleGroups.map((group, gi) => (
              <div key={group.label} className={gi === 0 ? "" : "mt-3 pt-2 border-t border-border/50"}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-[11px] font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-expanded={openGroups.has(group.label)}
                >
                  <span>{group.label}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openGroups.has(group.label) ? "rotate-180" : ""}`} />
                </button>
                <div className={`grid transition-[grid-template-rows,opacity] duration-200 ${openGroups.has(group.label) ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-60"}`}>
                  <ul className="min-h-0 space-y-0.5 overflow-hidden">
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
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <section className="flex-1 min-w-0 space-y-4" data-admin-workspace aria-label="محتوى لوحة الإدارة">{children}</section>
      </div>
    </AppShell>
  );
}
