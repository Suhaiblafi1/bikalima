import { useCallback, useEffect, useState } from "react";
import { BadgePercent, CalendarClock, Loader2, Plus, Power, Ticket } from "lucide-react";
import { AdminLayout } from "./_layout";
import { useApiFetch, type CourseRecord } from "./_shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DiscountCodeRecord = {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  courseId: string | null;
  courseTitleAr: string | null;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  createdAt: string;
};

const EMPTY_FORM = {
  code: "",
  discountType: "percent" as "percent" | "fixed",
  discountValue: "",
  courseId: "",
  startsAt: "",
  expiresAt: "",
  maxUses: "",
};

function displayDate(value: string | null): string {
  if (!value) return "غير محدد";
  return new Date(value).toLocaleString("ar-JO", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminDiscountCodesPage() {
  const apiFetch = useApiFetch();
  const [codes, setCodes] = useState<DiscountCodeRecord[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [codesResponse, coursesResponse] = await Promise.all([
        apiFetch("/admin/discount-codes"),
        apiFetch("/admin/courses"),
      ]);
      if (codesResponse.ok) setCodes((await codesResponse.json()).codes ?? []);
      if (coursesResponse.ok) setCourses((await coursesResponse.json()).courses ?? []);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { load(); }, [load]);

  const createCode = async () => {
    setError("");
    if (!form.code.trim() || !form.discountValue) {
      setError("أدخل الكود وقيمة الخصم.");
      return;
    }
    setSaving(true);
    try {
      const response = await apiFetch("/admin/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          courseId: form.courseId || null,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          isActive: true,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "تعذّر إنشاء الكود.");
        return;
      }
      setForm(EMPTY_FORM);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: DiscountCodeRecord) => {
    const response = await apiFetch(`/admin/discount-codes/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    if (response.ok) await load();
  };

  return (
    <AdminLayout activeKey="discount-codes">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><BadgePercent className="w-5 h-5 text-primary" /> أكواد الخصم</h1>
        <p className="text-sm text-muted-foreground mt-1">أنشئ كوداً للدورات كلها أو لدورة محددة، وحدد قيمته وصلاحيته وعدد مرات استخدامه.</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-bold flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> إنشاء كود جديد</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">الكود</label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })} placeholder="WELCOME20" dir="ltr" maxLength={32} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">نوع الخصم</label>
              <select className="w-full h-10 border rounded-md bg-background px-3 text-sm" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as "percent" | "fixed" })}>
                <option value="percent">نسبة مئوية %</option>
                <option value="fixed">مبلغ ثابت (د.أ)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">القيمة</label>
              <Input type="number" min="1" max={form.discountType === "percent" ? 100 : undefined} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">الدورة</label>
              <select className="w-full h-10 border rounded-md bg-background px-3 text-sm" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                <option value="">كل الدورات</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.titleAr}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">يبدأ في (اختياري)</label>
              <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">ينتهي في (اختياري)</label>
              <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">حد الاستخدام (اختياري)</label>
              <Input type="number" min="1" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} placeholder="بلا حد" />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={createCode} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Plus className="w-4 h-4 me-2" />}
                إنشاء وتفعيل
              </Button>
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : codes.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">لم تنشئ أي كود خصم بعد.</CardContent></Card>
        ) : codes.map((item) => (
          <Card key={item.id} className={!item.isActive ? "opacity-65" : ""}>
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Ticket className="w-5 h-5" /></div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="font-black text-lg tracking-wider" dir="ltr">{item.code}</code>
                    <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${item.isActive ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>{item.isActive ? "فعّال" : "متوقف"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.discountType === "percent" ? `${item.discountValue}%` : `${item.discountValue} د.أ`} · {item.courseTitleAr ?? "كل الدورات"} · استُخدم {item.usedCount}{item.maxUses ? ` من ${item.maxUses}` : " مرة"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" /> {displayDate(item.startsAt)} — {displayDate(item.expiresAt)}</p>
                </div>
              </div>
              <Button variant={item.isActive ? "outline" : "default"} size="sm" onClick={() => toggleActive(item)} className="shrink-0">
                <Power className="w-4 h-4 me-2" /> {item.isActive ? "إيقاف الكود" : "تفعيل الكود"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
