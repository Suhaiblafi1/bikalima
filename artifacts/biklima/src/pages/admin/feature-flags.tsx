import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { AdminLayout } from "./_layout";
import { useApiFetch } from "./_shared";
import { refreshFeatureFlags } from "@/hooks/use-feature-flag";

type FeatureFlag = {
  key: string;
  enabled: boolean;
  descriptionAr: string | null;
  descriptionEn: string | null;
  updatedAt: string;
  updatedById: string | null;
};

type Toast = { type: "success" | "error"; text: string } | null;

export default function AdminFeatureFlagsPage() {
  const apiFetch = useApiFetch();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch("/admin/feature-flags");
      if (!r.ok) {
        setToast({ type: "error", text: "تعذّر تحميل الميزات" });
        setFlags([]);
        return;
      }
      const d = (await r.json()) as { flags: FeatureFlag[] };
      setFlags(d.flags ?? []);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const toggle = async (key: string, next: boolean) => {
    setSavingKey(key);
    const prev = flags;
    setFlags((cur) => cur.map((f) => f.key === key ? { ...f, enabled: next } : f));
    try {
      const r = await apiFetch(`/admin/feature-flags/${encodeURIComponent(key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!r.ok) {
        setFlags(prev);
        setToast({ type: "error", text: "فشل الحفظ" });
        return;
      }
      const updated = (await r.json()) as FeatureFlag;
      setFlags((cur) => cur.map((f) => f.key === key ? updated : f));
      setToast({ type: "success", text: `تم تحديث «${key}»` });
      // Bust the public flag cache so consumer hooks pick up the change.
      refreshFeatureFlags().catch(() => {});
    } catch {
      setFlags(prev);
      setToast({ type: "error", text: "خطأ في الاتصال" });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <AdminLayout activeKey="feature-flags">
      <Card className="rounded-2xl">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ToggleRight className="w-5 h-5 text-primary" />
            <h1 className="font-bold text-lg">تفعيل الميزات</h1>
            <span className="text-xs text-muted-foreground ms-auto">
              {flags.length} ميزة
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            التحكم بتشغيل أو إيقاف الميزات الرئيسية في الموقع. التغيير يُسجَّل في سجل العمليات
            ويُطبَّق على الواجهة خلال ثوانٍ.
          </p>

          {toast && (
            <div
              className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border ${
                toast.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
              data-testid="feature-flags-toast"
            >
              {toast.type === "success"
                ? <CheckCircle2 className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
              {toast.text}
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">جاري التحميل…</div>
          ) : flags.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">لا توجد ميزات</div>
          ) : (
            <ul className="divide-y divide-border border border-border rounded-xl">
              {flags.map((f) => (
                <li key={f.key} className="flex items-start gap-4 p-4" data-testid={`feature-flag-row-${f.key}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-bold text-foreground/90" dir="ltr">{f.key}</p>
                    {f.descriptionAr && (
                      <p className="text-sm mt-1">{f.descriptionAr}</p>
                    )}
                    {f.descriptionEn && (
                      <p className="text-[11px] text-muted-foreground mt-0.5" dir="ltr">{f.descriptionEn}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(f.key, !f.enabled)}
                    disabled={savingKey === f.key}
                    role="switch"
                    aria-checked={f.enabled}
                    aria-label={`Toggle ${f.key}`}
                    data-testid={`feature-flag-toggle-${f.key}`}
                    className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      f.enabled ? "bg-primary" : "bg-muted-foreground/30"
                    } ${savingKey === f.key ? "opacity-60" : ""}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        f.enabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
