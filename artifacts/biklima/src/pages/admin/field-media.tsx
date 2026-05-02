import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Film, Plus, Save, Trash2, Edit3, X, Sparkles, CheckCircle,
} from "lucide-react";
import { AdminLayout } from "./_layout";
import {
  useApiFetch, type FieldMediaRecord, StatusBadge,
  FIELD_MEDIA_CATEGORIES, FIELD_MEDIA_PLACEMENTS,
} from "./_shared";

type Form = {
  mediaType: FieldMediaRecord["mediaType"];
  mediaUrl: string; thumbnailUrl: string;
  titleAr: string; titleEn: string;
  speakerName: string; category: string; targetSkill: string;
  descriptionAr: string; descriptionEn: string;
  linkedProgramId: string; linkedWorkbookId: string;
  placement: string[];
  status: "draft" | "published" | "hidden";
  orderIndex: string;
  // analysis
  analysisSkill: string;
  analysisObserveAr: string; analysisWhyAr: string;
  analysisLearnAr: string; analysisMistakesAr: string;
  analysisExerciseAr: string;
  analysisDifficulty: "" | "beginner" | "intermediate" | "advanced";
  analysisLinkedTopic: string;
};

function toForm(m: FieldMediaRecord | null): Form {
  return {
    mediaType: m?.mediaType ?? "youtube",
    mediaUrl: m?.mediaUrl ?? "",
    thumbnailUrl: m?.thumbnailUrl ?? "",
    titleAr: m?.titleAr ?? "",
    titleEn: m?.titleEn ?? "",
    speakerName: m?.speakerName ?? "",
    category: m?.category ?? "",
    targetSkill: m?.targetSkill ?? "",
    descriptionAr: m?.descriptionAr ?? "",
    descriptionEn: m?.descriptionEn ?? "",
    linkedProgramId: m?.linkedProgramId ?? "",
    linkedWorkbookId: m?.linkedWorkbookId ?? "",
    placement: m?.placement ?? [],
    status: m?.status ?? "draft",
    orderIndex: m?.orderIndex != null ? String(m.orderIndex) : "0",
    analysisSkill: m?.analysisSkill ?? "",
    analysisObserveAr: m?.analysisObserveAr ?? "",
    analysisWhyAr: m?.analysisWhyAr ?? "",
    analysisLearnAr: m?.analysisLearnAr ?? "",
    analysisMistakesAr: m?.analysisMistakesAr ?? "",
    analysisExerciseAr: m?.analysisExerciseAr ?? "",
    analysisDifficulty: m?.analysisDifficulty ?? "",
    analysisLinkedTopic: m?.analysisLinkedTopic ?? "",
  };
}

function fromForm(f: Form) {
  return {
    mediaType: f.mediaType,
    mediaUrl: f.mediaUrl.trim(),
    thumbnailUrl: f.thumbnailUrl.trim() || null,
    titleAr: f.titleAr.trim(),
    titleEn: f.titleEn.trim() || null,
    speakerName: f.speakerName.trim() || null,
    category: f.category || null,
    targetSkill: f.targetSkill.trim() || null,
    descriptionAr: f.descriptionAr || null,
    descriptionEn: f.descriptionEn || null,
    linkedProgramId: f.linkedProgramId.trim() || null,
    linkedWorkbookId: f.linkedWorkbookId.trim() || null,
    placement: f.placement.length ? f.placement : null,
    status: f.status,
    orderIndex: parseInt(f.orderIndex, 10) || 0,
    analysisSkill: f.analysisSkill.trim() || null,
    analysisObserveAr: f.analysisObserveAr || null,
    analysisWhyAr: f.analysisWhyAr || null,
    analysisLearnAr: f.analysisLearnAr || null,
    analysisMistakesAr: f.analysisMistakesAr || null,
    analysisExerciseAr: f.analysisExerciseAr || null,
    analysisDifficulty: f.analysisDifficulty || null,
    analysisLinkedTopic: f.analysisLinkedTopic.trim() || null,
  };
}

export default function AdminFieldMediaPage() {
  const apiFetch = useApiFetch();
  const [items, setItems] = useState<FieldMediaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FieldMediaRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Form>(toForm(null));
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"meta" | "analysis">("meta");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/field-media");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } finally { setLoading(false); }
  }, [apiFetch]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const startCreate = () => {
    setEditing(null); setCreating(true); setForm(toForm(null));
    setError(null); setTab("meta");
  };
  const startEdit = (m: FieldMediaRecord) => {
    setCreating(false); setEditing(m); setForm(toForm(m));
    setError(null); setTab("meta");
  };
  const cancel = () => { setEditing(null); setCreating(false); setError(null); };

  const togglePlacement = (value: string) => {
    setForm((f) => ({
      ...f,
      placement: f.placement.includes(value)
        ? f.placement.filter((p) => p !== value)
        : [...f.placement, value],
    }));
  };

  const save = async () => {
    if (!form.mediaUrl || !form.titleAr) {
      setError("الحقول المطلوبة: رابط الوسائط + العنوان (عربي)");
      return;
    }
    setSaving(true); setError(null);
    try {
      const payload = fromForm(form);
      const res = editing
        ? await apiFetch(`/admin/field-media/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await apiFetch("/admin/field-media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (res.ok) {
        await fetchItems();
        cancel();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || data.error || "تعذّر الحفظ");
      }
    } finally { setSaving(false); }
  };

  const remove = async (m: FieldMediaRecord) => {
    if (!confirm(`هل أنت متأكد من حذف "${m.titleAr}"؟`)) return;
    const res = await apiFetch(`/admin/field-media/${m.id}`, { method: "DELETE" });
    if (res.ok) fetchItems();
    else alert("تعذّر الحذف");
  };

  const generateAnalysis = async (force = false) => {
    if (!editing) return;
    setGenerating(true);
    try {
      const url = `/admin/field-media/${editing.id}/generate-analysis${force ? "?force=true" : ""}`;
      const res = await apiFetch(url, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setForm(toForm(data.item));
        setTab("analysis");
      } else if (res.status === 409 && !force) {
        const data = await res.json().catch(() => ({}));
        if (confirm(`${data.message || "يوجد تحليل مسبق."}\n\nهل تريد استبداله بقالب جديد؟`)) {
          await generateAnalysis(true);
          return;
        }
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || data.error || "تعذّر إنشاء التحليل");
      }
    } finally { setGenerating(false); }
  };

  return (
    <AdminLayout activeKey="field-media">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-bold flex items-center gap-2 text-lg">
            <Film className="w-5 h-5 text-primary" /> من الميدان — مكتبة المواد التدريبية
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            أضف فيديوهات وصور من تدريباتك أو من شخصيات ملهمة، صنّفها، وأرفق تحليلًا تدريبيًا قابلًا للتعديل.
          </p>
        </div>
        <Button onClick={startCreate} className="bg-primary text-white gap-1" data-testid="fm-new">
          <Plus className="w-4 h-4" /> إضافة مادة جديدة
        </Button>
      </div>

      {(creating || editing) && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                {creating ? "مادة جديدة" : `تعديل: ${editing?.titleAr}`}
              </h3>
              <Button size="icon" variant="ghost" onClick={cancel} aria-label="إغلاق" data-testid="fm-cancel">
                <X className="w-4 h-4" />
              </Button>
            </div>
            {error && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}

            <div className="flex gap-1 border-b">
              <button
                onClick={() => setTab("meta")}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === "meta" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
                data-testid="fm-tab-meta"
              >المادة والعرض</button>
              <button
                onClick={() => setTab("analysis")}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === "analysis" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
                data-testid="fm-tab-analysis"
              >التحليل التدريبي</button>
            </div>

            {tab === "meta" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">نوع الوسائط</label>
                  <select
                    value={form.mediaType}
                    onChange={(e) => setForm({ ...form, mediaType: e.target.value as Form["mediaType"] })}
                    className="w-full border rounded-lg p-2 text-sm bg-background"
                  >
                    <option value="youtube">يوتيوب</option>
                    <option value="upload">فيديو مرفوع</option>
                    <option value="image">صورة</option>
                    <option value="instagram">إنستغرام</option>
                    <option value="tiktok">تيك توك</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">رابط الوسائط *</label>
                  <Input value={form.mediaUrl} onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })} dir="ltr" placeholder="https://..." data-testid="fm-mediaUrl" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">رابط الصورة المصغرة</label>
                  <Input value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} dir="ltr" placeholder="https://..." />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">العنوان (عربي) *</label>
                  <Input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} data-testid="fm-titleAr" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Title (English)</label>
                  <Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} dir="ltr" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">اسم المتحدث</label>
                  <Input value={form.speakerName} onChange={(e) => setForm({ ...form, speakerName: e.target.value })} />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">التصنيف</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm bg-background"
                    data-testid="fm-category"
                  >
                    <option value="">— اختر —</option>
                    {FIELD_MEDIA_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.labelAr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">المهارة المستهدفة</label>
                  <Input value={form.targetSkill} onChange={(e) => setForm({ ...form, targetSkill: e.target.value })} placeholder="مثلاً: ضبط الإيقاع" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-muted-foreground mb-1 block">الوصف (عربي)</label>
                  <textarea className="w-full border rounded-lg p-2 text-sm bg-background min-h-[80px]" value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-muted-foreground mb-1 block">Description (EN)</label>
                  <textarea className="w-full border rounded-lg p-2 text-sm bg-background min-h-[80px]" value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} dir="ltr" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">رمز البرنامج المرتبط</label>
                  <Input value={form.linkedProgramId} onChange={(e) => setForm({ ...form, linkedProgramId: e.target.value })} dir="ltr" placeholder="core / tot / teachers / children" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">معرّف الكراسة المرتبطة</label>
                  <Input value={form.linkedWorkbookId} onChange={(e) => setForm({ ...form, linkedWorkbookId: e.target.value })} dir="ltr" placeholder="UUID" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-muted-foreground mb-1 block">مكان الظهور</label>
                  <div className="flex flex-wrap gap-2">
                    {FIELD_MEDIA_PLACEMENTS.map((p) => {
                      const active = form.placement.includes(p.value);
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => togglePlacement(p.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            active
                              ? "bg-primary text-white border-primary"
                              : "bg-background border-border text-muted-foreground hover:bg-muted"
                          }`}
                          data-testid={`fm-placement-${p.value}`}
                        >
                          {p.labelAr}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">الحالة</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Form["status"] })}
                    className="w-full border rounded-lg p-2 text-sm bg-background"
                    data-testid="fm-status"
                  >
                    <option value="draft">مسودة</option>
                    <option value="published">منشور</option>
                    <option value="hidden">مخفي</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">الترتيب</label>
                  <Input type="number" value={form.orderIndex} onChange={(e) => setForm({ ...form, orderIndex: e.target.value })} dir="ltr" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {editing && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm" variant="outline" onClick={() => generateAnalysis(false)}
                      disabled={generating}
                      className="gap-1" data-testid="fm-generate-analysis"
                    >
                      <Sparkles className="w-4 h-4" /> {generating ? "جارٍ الإنشاء..." : "إنشاء تحليل أولي"}
                    </Button>
                    {form.analysisObserveAr && (
                      <span className="text-[11px] text-green-700 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> يحتوي تحليلًا
                      </span>
                    )}
                  </div>
                )}
                {!editing && (
                  <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                    احفظ المادة أولًا، ثم يمكنك إنشاء تحليل أولي تلقائي قابل للتعديل.
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">المهارة الأساسية</label>
                    <Input value={form.analysisSkill} onChange={(e) => setForm({ ...form, analysisSkill: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">مستوى الصعوبة</label>
                    <select
                      value={form.analysisDifficulty}
                      onChange={(e) => setForm({ ...form, analysisDifficulty: e.target.value as Form["analysisDifficulty"] })}
                      className="w-full border rounded-lg p-2 text-sm bg-background"
                    >
                      <option value="">—</option>
                      <option value="beginner">مبتدئ</option>
                      <option value="intermediate">متوسط</option>
                      <option value="advanced">متقدم</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">ماذا نلاحظ في هذا المقطع؟</label>
                  <textarea className="w-full border rounded-lg p-2 text-sm bg-background min-h-[80px]" value={form.analysisObserveAr} onChange={(e) => setForm({ ...form, analysisObserveAr: e.target.value })} />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">لماذا هذا مؤثر؟</label>
                  <textarea className="w-full border rounded-lg p-2 text-sm bg-background min-h-[80px]" value={form.analysisWhyAr} onChange={(e) => setForm({ ...form, analysisWhyAr: e.target.value })} />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">ماذا يتعلم الطالب؟</label>
                  <textarea className="w-full border rounded-lg p-2 text-sm bg-background min-h-[80px]" value={form.analysisLearnAr} onChange={(e) => setForm({ ...form, analysisLearnAr: e.target.value })} />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">أخطاء يجب تجنبها</label>
                  <textarea className="w-full border rounded-lg p-2 text-sm bg-background min-h-[80px]" value={form.analysisMistakesAr} onChange={(e) => setForm({ ...form, analysisMistakesAr: e.target.value })} />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">تمرين تطبيقي</label>
                  <textarea className="w-full border rounded-lg p-2 text-sm bg-background min-h-[80px]" value={form.analysisExerciseAr} onChange={(e) => setForm({ ...form, analysisExerciseAr: e.target.value })} />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">المحور التدريبي / الجلسة المرتبطة</label>
                  <Input value={form.analysisLinkedTopic} onChange={(e) => setForm({ ...form, analysisLinkedTopic: e.target.value })} />
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="outline" onClick={cancel}>إلغاء</Button>
              <Button onClick={save} disabled={saving} className="bg-primary text-white gap-1" data-testid="fm-save">
                <Save className="w-4 h-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">لا توجد مواد بعد. اضغط "إضافة مادة جديدة" للبدء.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[12px] text-muted-foreground">
                  <tr>
                    <th className="text-start px-3 py-2">العنوان</th>
                    <th className="text-start px-3 py-2">النوع</th>
                    <th className="text-start px-3 py-2">التصنيف</th>
                    <th className="text-start px-3 py-2">الظهور</th>
                    <th className="text-start px-3 py-2">تحليل</th>
                    <th className="text-start px-3 py-2">الحالة</th>
                    <th className="text-end px-3 py-2">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((m) => {
                    const cat = FIELD_MEDIA_CATEGORIES.find((c) => c.value === m.category);
                    return (
                      <tr key={m.id} className="border-t hover:bg-muted/20">
                        <td className="px-3 py-2 font-medium">{m.titleAr}{m.speakerName && <span className="block text-[11px] text-muted-foreground">— {m.speakerName}</span>}</td>
                        <td className="px-3 py-2 text-[12px]">{m.mediaType}</td>
                        <td className="px-3 py-2 text-[12px]">{cat?.labelAr ?? "—"}</td>
                        <td className="px-3 py-2 text-[11px]">{m.placement?.join(", ") ?? "—"}</td>
                        <td className="px-3 py-2">{m.hasAnalysis ? <CheckCircle className="w-4 h-4 text-green-600" /> : "—"}</td>
                        <td className="px-3 py-2"><StatusBadge status={m.status === "published" ? "active" : m.status === "draft" ? "pending" : "suspended"} /></td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(m)} aria-label="تعديل" data-testid={`fm-edit-${m.id}`}>
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => remove(m)} aria-label="حذف" data-testid={`fm-delete-${m.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
