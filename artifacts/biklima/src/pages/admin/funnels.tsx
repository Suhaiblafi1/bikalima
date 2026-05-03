import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Filter, ArrowDown } from "lucide-react";
import { AdminLayout } from "./_layout";
import { useApiFetch } from "./_shared";

type FunnelStep = {
  id: string;
  labelAr: string;
  kind: string;
  value: string;
  count: number;
};
type Funnel = {
  id: string;
  key: string;
  nameAr: string;
  descriptionAr: string | null;
  sourceFilter: string | null;
  steps: FunnelStep[];
  isActive: boolean;
  conversionRate: number;
};

export default function AdminFunnelsPage() {
  const apiFetch = useApiFetch();
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch("/admin/funnels");
    if (r.ok) { const d = await r.json(); setFunnels(d.funnels ?? []); }
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <AdminLayout activeKey="funnels">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><Filter className="w-5 h-5 text-primary" /> قمع التحويل</h1>
        <p className="text-xs text-muted-foreground mt-0.5">تتبع رحلة العميل من أول تواصل حتى التحويل، مع نسب التحويل في كل مرحلة</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {funnels.map((f) => {
            const top = f.steps[0]?.count ?? 0;
            return (
              <Card key={f.id} className={f.isActive ? "" : "opacity-60"}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm">{f.nameAr}</h3>
                      {f.descriptionAr && <p className="text-[11px] text-muted-foreground mt-0.5">{f.descriptionAr}</p>}
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-lg font-bold text-primary">{f.conversionRate}%</p>
                      <p className="text-[10px] text-muted-foreground">معدّل التحويل</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {f.steps.map((s, i) => {
                      const widthPct = top > 0 ? Math.max(10, (s.count / top) * 100) : 10;
                      const stepConv = i > 0 && f.steps[i - 1].count > 0 ? Math.round((s.count / f.steps[i - 1].count) * 100) : null;
                      return (
                        <div key={s.id}>
                          {i > 0 && (
                            <div className="flex items-center justify-center -my-0.5">
                              <ArrowDown className="w-3 h-3 text-muted-foreground" />
                              {stepConv !== null && <span className="text-[9px] text-muted-foreground mr-1">{stepConv}%</span>}
                            </div>
                          )}
                          <div className="relative bg-muted/30 rounded-md overflow-hidden">
                            <div
                              className="absolute inset-y-0 right-0 bg-primary/20 transition-all"
                              style={{ width: `${widthPct}%` }}
                            />
                            <div className="relative flex items-center justify-between px-3 py-1.5 text-xs">
                              <span className="font-medium">{i + 1}. {s.labelAr}</span>
                              <span className="font-bold text-primary">{s.count}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {funnels.length === 0 && <p className="text-center text-sm text-muted-foreground py-12 col-span-full">لا توجد قمع محدّدة بعد.</p>}
        </div>
      )}
    </AdminLayout>
  );
}
