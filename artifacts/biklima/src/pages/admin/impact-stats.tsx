import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, AlertCircle, CheckCircle2, Plus, Trash2, Edit3, X, Eye, EyeOff } from "lucide-react";
import { AdminLayout } from "./_layout";
import { useApiFetch } from "./_shared";

type StatRow = {
  key: string;
  labelAr: string;
  labelEn: string;
  overrideValue: string | null;
  realValue: string;
  displayOrder: number;
};

type StoryRow = {
  id: string;
  name: string;
  roleAr: string | null;
  roleEn: string | null;
  quoteAr: string;
  quoteEn: string | null;
  photoUrl: string | null;
  displayOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type Toast = { type: "success" | "error"; text: string } | null;

const EMPTY_STORY: Omit<StoryRow, "id" | "createdAt" | "updatedAt"> = {
  name: "",
  roleAr: "",
  roleEn: "",
  quoteAr: "",
  quoteEn: "",
  photoUrl: "",
  displayOrder: 0,
  isPublished: false,
};

export default function AdminImpactStatsPage() {
  const apiFetch = useApiFetch();
  const [stats, setStats] = useState<StatRow[]>([]);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [overrideDraft, setOverrideDraft] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<Toast>(null);

  const [editingStory, setEditingStory] = useState<StoryRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<typeof EMPTY_STORY>(EMPTY_STORY);
  const [storySaving, setStorySaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        apiFetch("/admin/impact-stats"),
        apiFetch("/admin/impact-stories"),
      ]);
      if (r1.ok) {
        const d = (await r1.json()) as { stats: StatRow[] };
        setStats(d.stats ?? []);
        const draft: Record<string, string> = {};
        for (const s of d.stats ?? []) draft[s.key] = s.overrideValue ?? "";
        setOverrideDraft(draft);
      }
      if (r2.ok) {
        const d = (await r2.json()) as { stories: StoryRow[] };
        setStories(d.stories ?? []);
      }
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

  const saveOverride = async (key: string) => {
    setSavingKey(key);
    const raw = (overrideDraft[key] ?? "").trim();
    try {
      const r = await apiFetch(`/admin/impact-stats/${encodeURIComponent(key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrideValue: raw === "" ? null : raw }),
      });
      if (!r.ok) {
        setToast({ type: "error", text: "فشل الحفظ" });
        return;
      }
      const updated = (await r.json()) as StatRow;
      setStats((cur) => cur.map((s) => s.key === key ? updated : s));
      setOverrideDraft((cur) => ({ ...cur, [key]: updated.overrideValue ?? "" }));
      setToast({ type: "success", text: "تم الحفظ" });
    } catch {
      setToast({ type: "error", text: "خطأ في الاتصال" });
    } finally {
      setSavingKey(null);
    }
  };

  const startCreate = () => {
    setDraft({ ...EMPTY_STORY, displayOrder: stories.length });
    setEditingStory(null);
    setCreating(true);
  };
  const startEdit = (s: StoryRow) => {
    setDraft({
      name: s.name,
      roleAr: s.roleAr ?? "",
      roleEn: s.roleEn ?? "",
      quoteAr: s.quoteAr,
      quoteEn: s.quoteEn ?? "",
      photoUrl: s.photoUrl ?? "",
      displayOrder: s.displayOrder,
      isPublished: s.isPublished,
    });
    setEditingStory(s);
    setCreating(false);
  };
  const cancelEdit = () => { setCreating(false); setEditingStory(null); };

  const saveStory = async () => {
    if (!draft.name.trim() || !draft.quoteAr.trim()) {
      setToast({ type: "error", text: "الاسم والاقتباس بالعربية مطلوبان" });
      return;
    }
    setStorySaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: draft.name.trim(),
        quoteAr: draft.quoteAr.trim(),
        roleAr: draft.roleAr?.trim() || null,
        roleEn: draft.roleEn?.trim() || null,
        quoteEn: draft.quoteEn?.trim() || null,
        photoUrl: draft.photoUrl?.trim() || null,
        displayOrder: Number(draft.displayOrder) || 0,
        isPublished: !!draft.isPublished,
      };
      const path = editingStory
        ? `/admin/impact-stories/${editingStory.id}`
        : "/admin/impact-stories";
      const method = editingStory ? "PATCH" : "POST";
      const r = await apiFetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        const msg = err?.issues?.[0]?.message || "فشل الحفظ";
        setToast({ type: "error", text: msg });
        return;
      }
      await load();
      cancelEdit();
      setToast({ type: "success", text: editingStory ? "تم تحديث القصة" : "تمت إضافة القصة" });
    } catch {
      setToast({ type: "error", text: "خطأ في الاتصال" });
    } finally {
      setStorySaving(false);
    }
  };

  const deleteStory = async (id: string) => {
    if (!window.confirm("حذف هذه القصة؟")) return;
    try {
      const r = await apiFetch(`/admin/impact-stories/${id}`, { method: "DELETE" });
      if (!r.ok) { setToast({ type: "error", text: "فشل الحذف" }); return; }
      setStories((cur) => cur.filter((s) => s.id !== id));
      setToast({ type: "success", text: "تم الحذف" });
    } catch {
      setToast({ type: "error", text: "خطأ في الاتصال" });
    }
  };

  const togglePublish = async (s: StoryRow) => {
    try {
      const r = await apiFetch(`/admin/impact-stories/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !s.isPublished }),
      });
      if (!r.ok) { setToast({ type: "error", text: "فشل الحفظ" }); return; }
      const d = (await r.json()) as { story: StoryRow };
      setStories((cur) => cur.map((row) => row.id === s.id ? d.story : row));
    } catch {
      setToast({ type: "error", text: "خطأ في الاتصال" });
    }
  };

  return (
    <AdminLayout activeKey="impact-stats">
      {toast && (
        <div
          className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
          data-testid="impact-toast"
        >
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      <Card className="rounded-2xl">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="font-bold text-lg">الأرقام التي تظهر في صفحة الأثر</h1>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            القيمة الفعلية تُحسب تلقائياً من قاعدة البيانات. اترك القيمة المعدّلة فارغة لاستخدام القيمة الفعلية،
            أو أدخل قيمة تسويقية (مثل «+1500») لعرضها بدلاً منها.
          </p>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">جاري التحميل…</div>
          ) : stats.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">لا توجد إحصائيات</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start text-muted-foreground border-b">
                    <th className="py-2 px-2 text-start font-semibold">المفتاح</th>
                    <th className="py-2 px-2 text-start font-semibold">العنوان</th>
                    <th className="py-2 px-2 text-start font-semibold">القيمة الفعلية</th>
                    <th className="py-2 px-2 text-start font-semibold">القيمة المعدّلة</th>
                    <th className="py-2 px-2 text-start font-semibold">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => (
                    <tr key={s.key} className="border-b" data-testid={`impact-stat-row-${s.key}`}>
                      <td className="py-2 px-2 font-mono text-xs" dir="ltr">{s.key}</td>
                      <td className="py-2 px-2">{s.labelAr}</td>
                      <td className="py-2 px-2 font-bold text-primary tabular-nums" data-testid={`impact-stat-real-${s.key}`}>{s.realValue}</td>
                      <td className="py-2 px-2">
                        <Input
                          value={overrideDraft[s.key] ?? ""}
                          onChange={(e) => setOverrideDraft((cur) => ({ ...cur, [s.key]: e.target.value }))}
                          placeholder="مثال: +1500"
                          className="h-8 w-32"
                          dir="ltr"
                          data-testid={`impact-stat-override-input-${s.key}`}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Button
                          size="sm"
                          onClick={() => saveOverride(s.key)}
                          disabled={savingKey === s.key}
                          className="h-8 px-3 text-xs"
                          data-testid={`impact-stat-save-${s.key}`}
                        >
                          {savingKey === s.key ? "…" : "حفظ"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">قصص التحوّل</h2>
            <span className="text-xs text-muted-foreground">{stories.length}</span>
            <div className="ms-auto">
              {!creating && !editingStory && (
                <Button size="sm" onClick={startCreate} className="h-8" data-testid="impact-story-new">
                  <Plus className="w-4 h-4 me-1" /> قصة جديدة
                </Button>
              )}
            </div>
          </div>

          {(creating || editingStory) && (
            <div className="border border-border rounded-xl p-4 bg-muted/40 space-y-3" data-testid="impact-story-editor">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">الاسم *</label>
                  <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} data-testid="impact-story-name" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">صورة (URL)</label>
                  <Input value={draft.photoUrl ?? ""} onChange={(e) => setDraft({ ...draft, photoUrl: e.target.value })} dir="ltr" placeholder="https://…" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">الدور (عربي)</label>
                  <Input value={draft.roleAr ?? ""} onChange={(e) => setDraft({ ...draft, roleAr: e.target.value })} placeholder="خرّيج برنامج المدرّبين" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Role (English)</label>
                  <Input value={draft.roleEn ?? ""} onChange={(e) => setDraft({ ...draft, roleEn: e.target.value })} dir="ltr" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">الاقتباس (عربي) *</label>
                <textarea
                  className="w-full border rounded-lg p-2 text-sm bg-background min-h-[90px]"
                  value={draft.quoteAr}
                  onChange={(e) => setDraft({ ...draft, quoteAr: e.target.value })}
                  data-testid="impact-story-quote-ar"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Quote (English)</label>
                <textarea
                  className="w-full border rounded-lg p-2 text-sm bg-background min-h-[80px]"
                  dir="ltr"
                  value={draft.quoteEn ?? ""}
                  onChange={(e) => setDraft({ ...draft, quoteEn: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
                <div>
                  <label className="text-xs text-muted-foreground">الترتيب</label>
                  <Input
                    type="number"
                    value={String(draft.displayOrder)}
                    onChange={(e) => setDraft({ ...draft, displayOrder: Number(e.target.value) || 0 })}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer mt-5">
                  <input
                    type="checkbox"
                    checked={draft.isPublished}
                    onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })}
                    data-testid="impact-story-published"
                  />
                  منشور للعموم
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={cancelEdit}>
                  <X className="w-4 h-4 me-1" /> إلغاء
                </Button>
                <Button size="sm" onClick={saveStory} disabled={storySaving} data-testid="impact-story-save">
                  {storySaving ? "جاري الحفظ…" : "حفظ"}
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">جاري التحميل…</div>
          ) : stories.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
              لا توجد قصص بعد. أضف قصة لتظهر في صفحة الأثر العامة.
            </div>
          ) : (
            <ul className="divide-y divide-border border border-border rounded-xl">
              {stories.map((s) => (
                <li key={s.id} className="flex items-start gap-3 p-3" data-testid={`impact-story-row-${s.id}`}>
                  {s.photoUrl ? (
                    <img src={s.photoUrl} alt={s.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold shrink-0">
                      {s.name.slice(0, 1)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm">{s.name}</p>
                      {s.roleAr && <p className="text-xs text-muted-foreground">— {s.roleAr}</p>}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                        {s.isPublished ? "منشور" : "مسودّة"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">ترتيب: {s.displayOrder}</span>
                    </div>
                    <p className="text-xs text-foreground/80 mt-1 line-clamp-2">{s.quoteAr}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => togglePublish(s)}
                      className="p-1.5 hover:bg-muted rounded"
                      title={s.isPublished ? "إخفاء" : "نشر"}
                      data-testid={`impact-story-toggle-${s.id}`}
                    >
                      {s.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => startEdit(s)} className="p-1.5 hover:bg-muted rounded" title="تعديل">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteStory(s.id)} className="p-1.5 hover:bg-red-50 text-destructive rounded" title="حذف">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
