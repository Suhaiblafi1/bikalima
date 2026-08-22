import { useCallback, useEffect, useState } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import { AdminLayout } from "./_layout";
import { useApiFetch } from "./_shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Summary = { days: number; uniqueVisitors: number; byEvent: Array<{ eventName: string; count: number }>; byPath: Array<{ path: string; count: number }> };

export default function AdminAnalyticsPage() {
  const apiFetch = useApiFetch();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    const response = await apiFetch("/admin/analytics/summary?days=30");
    if (response.ok) setSummary(await response.json()); else setError("تعذّر تحميل التحليلات.");
    setLoading(false);
  }, [apiFetch]);
  useEffect(() => { load(); }, [load]);
  return <AdminLayout activeKey="analytics"><div><h1 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> التحليلات المحترمة للخصوصية</h1><p className="text-sm text-muted-foreground mt-1">بيانات أولية مجهولة للزوار الذين وافقوا فقط — آخر 30 يوماً.</p></div>
    {loading ? <div className="py-16 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div> : error ? <div role="alert" className="rounded-xl border p-4 text-destructive">{error}<Button variant="outline" size="sm" className="ms-3" onClick={load}>إعادة المحاولة</Button></div> : summary && <>
      <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">زوار مجهولون وافقوا على القياس</p><p className="text-4xl font-black text-primary mt-2">{summary.uniqueVisitors}</p></CardContent></Card>
      <div className="grid md:grid-cols-2 gap-4"><Card><CardContent className="p-5"><h2 className="font-bold mb-4">الأحداث</h2><div className="space-y-2">{summary.byEvent.length ? summary.byEvent.map((row) => <div key={row.eventName} className="flex justify-between text-sm border-b pb-2"><span dir="ltr">{row.eventName}</span><strong>{row.count}</strong></div>) : <p className="text-sm text-muted-foreground">لا توجد بيانات بعد.</p>}</div></CardContent></Card><Card><CardContent className="p-5"><h2 className="font-bold mb-4">الصفحات</h2><div className="space-y-2">{summary.byPath.length ? summary.byPath.map((row) => <div key={row.path} className="flex justify-between gap-3 text-sm border-b pb-2"><span dir="ltr" className="truncate">{row.path}</span><strong>{row.count}</strong></div>) : <p className="text-sm text-muted-foreground">لا توجد بيانات بعد.</p>}</div></CardContent></Card></div>
    </>}
  </AdminLayout>;
}
