import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users, BookOpen, GraduationCap, FileText, ShoppingCart, DollarSign,
  Activity, TrendingUp,
} from "lucide-react";
import { AdminLayout } from "./_layout";
import {
  useApiFetch, RevenueTab,
  type Stats, type RevenueData, type AdminActivityRecord, type TopProgramRecord,
} from "./_shared";

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
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [activities, setActivities] = useState<AdminActivityRecord[]>([]);
  const [topPrograms, setTopPrograms] = useState<TopProgramRecord[]>([]);

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

  useEffect(() => {
    fetchStats();
    fetchRevenue();
    fetchActivities();
    fetchTopPrograms();
  }, [fetchStats, fetchRevenue, fetchActivities, fetchTopPrograms]);

  return (
    <AdminLayout activeKey="overview">
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
    </AdminLayout>
  );
}
