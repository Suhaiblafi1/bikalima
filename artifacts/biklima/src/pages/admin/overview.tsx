import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users, BookOpen, GraduationCap, FileText, ShoppingCart, DollarSign,
  Activity, TrendingUp, UserPlus, ListTodo, Zap, KanbanSquare, CalendarCheck,
  Database,
} from "lucide-react";
import { AdminLayout } from "./_layout";
import {
  useApiFetch, RevenueTab, leadStatusLabel, leadStatusColor, LEAD_SOURCE_LABELS,
  type Stats, type RevenueData, type AdminActivityRecord, type TopProgramRecord,
} from "./_shared";

type Growth = {
  totals: { leads: number; consultations: number; speechEvaluations: number; workbookOrders: number; enrollments: number; openChats: number };
  pipeline: { byStatus: Record<string, number>; bySource: Record<string, number>; newLeads7d: number; newLeads30d: number; converted30d: number; conversionRate: number };
  tasks: { open: number; overdue: number; dueToday: number };
  activities: { last7d: number; recent: Array<{ id: string; leadId: string; type: string; summaryAr: string | null; createdAt: string }> };
};

const PROGRAM_LABELS: Record<string, string> = {
  core: "البرنامج الأساسي",
  tot: "تدريب المدرّبين",
  teachers: "المعلمون وأولياء الأمور",
  children: "الخطيب الصغير",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  return `منذ ${d} يوم`;
}

const ACTION_LABELS: Record<string, string> = {
  create: "إنشاء", update: "تحديث", delete: "حذف", publish: "نشر",
};
const ENTITY_LABELS: Record<string, string> = {
  workbook: "كراسة",
  "home-section": "قسم رئيسي",
  "field-media": "مادة ميدانية",
  "media-analysis": "تحليل تدريبي",
};

export default function AdminOverviewPage() {
  const apiFetch = useApiFetch();
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [activities, setActivities] = useState<AdminActivityRecord[]>([]);
  const [topPrograms, setTopPrograms] = useState<TopProgramRecord[]>([]);
  const [growth, setGrowth] = useState<Growth | null>(null);
  const [platformHealth, setPlatformHealth] = useState<{
    badge_definitions: number; user_badges: number; feature_flags: number;
    audit_log_entries: number; impact_stats_overrides: number; transformation_stories: number;
    lesson_session_attendance: number;
  } | null>(null);

  const fetchGrowth = useCallback(async () => {
    const r = await apiFetch("/admin/growth/overview");
    if (r.ok) setGrowth(await r.json());
  }, [apiFetch]);

  const fetchStats = useCallback(async () => {
    const res = await apiFetch("/admin/stats");
    if (res.ok) setStats(await res.json());
  }, [apiFetch]);

  const fetchRevenue = useCallback(async () => {
    const res = await apiFetch("/admin/revenue");
    if (res.ok) setRevenue(await res.json());
  }, [apiFetch]);

  const fetchActivities = useCallback(async () => {
    const res = await apiFetch("/admin/activities");
    if (res.ok) {
      const data = await res.json();
      setActivities(data.activities ?? []);
    }
  }, [apiFetch]);

  const fetchTopPrograms = useCallback(async () => {
    const res = await apiFetch("/admin/top-programs");
    if (res.ok) {
      const data = await res.json();
      setTopPrograms(data.topPrograms ?? []);
    }
  }, [apiFetch]);

  const fetchPlatformHealth = useCallback(async () => {
    const r = await apiFetch("/admin/platform-health");
    if (r.ok) {
      const d = await r.json();
      setPlatformHealth(d.counts ?? null);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchStats();
    fetchRevenue();
    fetchActivities();
    fetchTopPrograms();
    fetchGrowth();
    fetchPlatformHealth();
  }, [fetchStats, fetchRevenue, fetchActivities, fetchTopPrograms, fetchGrowth, fetchPlatformHealth]);

  return (
    <AdminLayout activeKey="overview">
      {/* ─── Growth Center KPIs ─────────────────────────────────────── */}
      {growth && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> مركز النمو
            </h2>
            <button onClick={() => navigate("/admin/leads")} className="text-[11px] text-primary hover:underline">عرض الكل ←</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "العملاء المحتملون", value: growth.totals.leads, icon: <UserPlus className="w-5 h-5 text-cyan-700" />, bg: "bg-cyan-100", href: "/admin/leads" },
              { label: "جدد آخر 7 أيام", value: growth.pipeline.newLeads7d, icon: <TrendingUp className="w-5 h-5 text-emerald-700" />, bg: "bg-emerald-100", href: "/admin/leads" },
              { label: "محوّلون (30 يوم)", value: `${growth.pipeline.converted30d} (${growth.pipeline.conversionRate}%)`, icon: <GraduationCap className="w-5 h-5 text-green-700" />, bg: "bg-green-100", href: "/admin/funnels" },
              { label: "مهام مفتوحة", value: growth.tasks.open, icon: <ListTodo className="w-5 h-5 text-blue-700" />, bg: "bg-blue-100", href: "/admin/tasks?filter=open" },
              { label: "متأخرة", value: growth.tasks.overdue, icon: <ListTodo className="w-5 h-5 text-red-700" />, bg: "bg-red-100", href: "/admin/tasks?filter=overdue" },
              { label: "حجوزات استشارة", value: growth.totals.consultations, icon: <CalendarCheck className="w-5 h-5 text-indigo-700" />, bg: "bg-indigo-100", href: "/admin/leads?source=consultation" },
            ].map((s, i) => (
              <Card key={i} className="cursor-pointer hover:shadow-md transition" onClick={() => navigate(s.href)}>
                <CardContent className="p-3 flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
                  <div>
                    <p className="text-base font-bold leading-none">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Card className="lg:col-span-2">
              <CardContent className="p-4">
                <h3 className="font-bold text-sm flex items-center gap-2 mb-3"><KanbanSquare className="w-4 h-4 text-primary" /> توزيع العملاء حسب الحالة</h3>
                {Object.keys(growth.pipeline.byStatus).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">لا يوجد عملاء محتملون بعد.</p>
                ) : (
                  <div className="space-y-1.5">
                    {Object.entries(growth.pipeline.byStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                      const max = Math.max(...Object.values(growth.pipeline.byStatus));
                      const pct = (count / max) * 100;
                      return (
                        <div key={status} className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold w-24 text-center ${leadStatusColor(status)}`}>{leadStatusLabel(status)}</span>
                          <div className="flex-1 h-5 bg-muted rounded relative overflow-hidden">
                            <div className="absolute inset-y-0 right-0 bg-primary/30 transition-all" style={{ width: `${pct}%` }} />
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-bold text-sm flex items-center gap-2 mb-3"><Zap className="w-4 h-4 text-primary" /> آخر النشاطات</h3>
                {growth.activities.recent.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">لا نشاطات بعد.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-56 overflow-y-auto">
                    {growth.activities.recent.slice(0, 8).map((a) => (
                      <li key={a.id} className="text-[11px] border-b last:border-0 pb-1 cursor-pointer hover:bg-muted/30 -mx-1 px-1 rounded"
                        onClick={() => navigate(`/admin/leads/${a.leadId}`)}>
                        <p className="truncate">{a.summaryAr ?? a.type}</p>
                        <p className="text-[9px] text-muted-foreground">{new Date(a.createdAt).toLocaleString("ar", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">{growth.activities.last7d} نشاط في آخر 7 أيام · المصادر: {Object.entries(growth.pipeline.bySource).slice(0, 3).map(([k, v]) => `${LEAD_SOURCE_LABELS[k] ?? k}: ${v}`).join(" · ") || "—"}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "المستخدمون", value: stats.totalUsers, icon: <Users className="w-5 h-5 text-primary" />, bg: "bg-primary/10" },
            { label: "الدورات", value: stats.totalCourses, icon: <BookOpen className="w-5 h-5 text-blue-600" />, bg: "bg-blue-100" },
            { label: "التسجيلات", value: stats.totalEnrollments, icon: <GraduationCap className="w-5 h-5 text-teal-600" />, bg: "bg-teal-100" },
            { label: "طلبات التسجيل", value: stats.totalRequests, icon: <FileText className="w-5 h-5 text-amber-600" />, bg: "bg-amber-100" },
            { label: "طلبات الكراسات", value: stats.totalOrders, icon: <ShoppingCart className="w-5 h-5 text-purple-600" />, bg: "bg-purple-100" },
            { label: "طلبات الدورات", value: stats.totalLmsOrders ?? 0, icon: <DollarSign className="w-5 h-5 text-green-600" />, bg: "bg-green-100" },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
                <div>
                  <p className="text-lg font-bold leading-none">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Top programs */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" /> أكثر البرامج طلبًا
            </h3>
            {topPrograms.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">لا توجد طلبات تسجيل بعد.</p>
            ) : (
              <div className="space-y-2">
                {topPrograms.map((p, i) => {
                  const label = PROGRAM_LABELS[p.programId] ?? p.programId;
                  const max = Math.max(...topPrograms.map((x) => x.requestCount));
                  const pct = (p.requestCount / max) * 100;
                  return (
                    <div key={p.programId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{i + 1}. {label}</span>
                        <span className="text-muted-foreground">{p.requestCount} طلب</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary" /> أحدث النشاطات
            </h3>
            {activities.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">لم يُسجَّل أي نشاط بعد. ستظهر إجراءاتك على المحتوى هنا.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {activities.slice(0, 12).map((a) => (
                  <li key={a.id} className="flex items-start gap-2 text-xs border-b last:border-0 pb-1.5 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        <span className="text-primary">{ACTION_LABELS[a.action] ?? a.action}</span>
                        {" — "}
                        <span className="text-muted-foreground">{ENTITY_LABELS[a.entityType] ?? a.entityType}</span>
                      </p>
                      {a.description && <p className="text-[11px] text-muted-foreground truncate">{a.description}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {a.actorEmail ?? "—"} · {timeAgo(a.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <RevenueTab revenue={revenue} onRefresh={fetchRevenue} />

      {/* ─── Platform foundations health ─────────────────────────────── */}
      {platformHealth && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-primary" /> النظام الأساسي
              <span className="text-[10px] text-muted-foreground font-normal mr-auto">
                صحة الجداول الجديدة (شارات، حضور، سجل تدقيق، أعلام، أثر)
              </span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 text-xs">
              {[
                { label: "تعريفات الشارات", value: platformHealth.badge_definitions },
                { label: "شارات الطلاب",   value: platformHealth.user_badges },
                { label: "أعلام الميزات",  value: platformHealth.feature_flags },
                { label: "سجل التدقيق",    value: platformHealth.audit_log_entries },
                { label: "أرقام الأثر",    value: platformHealth.impact_stats_overrides },
                { label: "قصص التحول",    value: platformHealth.transformation_stories },
                { label: "حضور الجلسات",  value: platformHealth.lesson_session_attendance },
              ].map((s, i) => (
                <div key={i} className="rounded-lg border bg-muted/20 p-2">
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  <p className="text-base font-bold leading-none mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
