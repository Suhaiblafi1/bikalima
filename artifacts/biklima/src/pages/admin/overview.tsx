import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users, BookOpen, GraduationCap, FileText, ShoppingCart, DollarSign,
} from "lucide-react";
import { AdminLayout } from "./_layout";
import { useApiFetch, RevenueTab, type Stats, type RevenueData } from "./_shared";

export default function AdminOverviewPage() {
  const apiFetch = useApiFetch();
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);

  const fetchStats = useCallback(async () => {
    const res = await apiFetch("/admin/stats");
    if (res.ok) setStats(await res.json());
  }, [apiFetch]);

  const fetchRevenue = useCallback(async () => {
    const res = await apiFetch("/admin/revenue");
    if (res.ok) setRevenue(await res.json());
  }, [apiFetch]);

  useEffect(() => {
    fetchStats();
    fetchRevenue();
  }, [fetchStats, fetchRevenue]);

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

      <RevenueTab revenue={revenue} onRefresh={fetchRevenue} />
    </AdminLayout>
  );
}
