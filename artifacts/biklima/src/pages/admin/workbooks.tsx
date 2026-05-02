import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText, Plus, Save, Trash2, Edit3, X, BookOpen, Eye, EyeOff,
} from "lucide-react";
import { AdminLayout } from "./_layout";
import {
  useApiFetch, type WorkbookRecord, StatusBadge,
} from "./_shared";

type Form = {
  slug: string; titleAr: string; titleEn: string;
  descriptionAr: string; descriptionEn: string;
  priceJod: string; coverImageUrl: string; samplePdfUrl: string;
  topicsArText: string; topicsEnText: string;
  format: "digital" | "printed" | "both";
  linkedCourseId: string; linkedProgramId: string;
  status: "draft" | "published" | "hidden";
  orderIndex: string;
};

function toForm(w: WorkbookRecord | null): Form {
  return {
    slug: w?.slug ?? "",
    titleAr: w?.titleAr ?? "",
    titleEn: w?.titleEn ?? "",
    descriptionAr: w?.descriptionAr ?? "",
    descriptionEn: w?.descriptionEn ?? "",
    priceJod: w?.priceJod != null ? String(w.priceJod) : "",
    coverImageUrl: w?.coverImageUrl ?? "",
    samplePdfUrl: w?.samplePdfUrl ?? "",
    topicsArText: w?.topicsAr ? w.topicsAr.join("\n") : "",
    topicsEnText: w?.topicsEn ? w.topicsEn.join("\n") : "",
    format: w?.format ?? "both",
    linkedCourseId: w?.linkedCourseId ?? "",
    linkedProgramId: w?.linkedProgramId ?? "",
    status: w?.status ?? "draft",
    orderIndex: w?.orderIndex != null ? String(w.orderIndex) : "0",
  };
}

function fromForm(f: Form) {
  const splitLines = (text: string) =>
    text.split("\n").map((s) => s.trim()).filter(Boolean);
  return {
    slug: f.slug.trim(),
    titleAr: f.titleAr.trim(),
    titleEn: f.titleEn.trim() || null,
    descriptionAr: f.descriptionAr || null,
    descriptionEn: f.descriptionEn || null,
    priceJod: f.priceJod ? parseInt(f.priceJod, 10) || null : null,
    coverImageUrl: f.coverImageUrl.trim() || null,
    samplePdfUrl: f.samplePdfUrl.trim() || null,
    topicsAr: splitLines(f.topicsArText).length ? splitLines(f.topicsArText) : null,
    topicsEn: splitLines(f.topicsEnText).length ? splitLines(f.topicsEnText) : null,
    format: f.format,
    linkedCourseId: f.linkedCourseId.trim() || null,
    linkedProgramId: f.linkedProgramId.trim() || null,
    status: f.status,
    orderIndex: parseInt(f.orderIndex, 10) || 0,
  };
}

export default function AdminWorkbooksPage() {
  const apiFetch = useApiFetch();
  const [items, setItems] = useState<WorkbookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<WorkbookRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Form>(toForm(null));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/workbooks");
      if (res.ok) {
        const data = await res.json();
        setItems(data.workbooks);
      }
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const startCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm(toForm(null));
    setError(null);
  };
  const startEdit = (w: WorkbookRecord) => {
    setCreating(false);
    setEditing(w);
    setForm(toForm(w));
    setError(null);
  };
  const cancel = () => { setEditing(null); setCreating(false); setError(null); };

  const save = async () => {
    if (!form.slug || !form.titleAr) {
      setError("الحقول المطلوبة: slug + العنوان (عربي)");
      return;
    }
    setSaving(true); setError(null);
    try {
      const payload = fromForm(form);
      const res = editing
        ? await apiFetch(`/admin/workbooks/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await apiFetch("/admin/workbooks", {
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
    } finally {
      setSaving(false);
    }
  };

  const remove = async (w: WorkbookRecord) => {
    if (!confirm(`هل أنت متأكد من حذف الكراسة "${w.titleAr}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
    const res = await apiFetch(`/admin/workbooks/${w.id}`, { method: "DELETE" });
    if (res.ok) fetchItems();
    else alert("تعذّر الحذف");
  };

  const filtered = items.filter((w) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      w.slug.toLowerCase().includes(q) ||
      w.titleAr.toLowerCase().includes(q) ||
      (w.titleEn ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout activeKey="workbooks">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-bold flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" /> إدارة الكراسات
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            أضف كراسات بكلمة، حدّد سعرها، صورة الغلاف، عينة PDF، والمحاور، وحدّد حالة النشر.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="بحث..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
            data-testid="wb-search"
          />
          <Button
            onClick={startCreate}
            className="bg-primary text-white gap-1"
            data-testid="wb-new"
          >
            <Plus className="w-4 h-4" /> إضافة كراسة
          </Button>
        </div>
      </div>

      {(creating || editing) && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                {creating ? "كراسة جديدة" : `تعديل: ${editing?.titleAr}`}
              </h3>
              <Button size="icon" variant="ghost" onClick={cancel} aria-label="إغلاق" data-testid="wb-cancel">
                <X className="w-4 h-4" />
              </Button>
            </div>
            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">slug *</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" data-testid="wb-slug" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">العنوان (عربي) *</label>
                <Input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} data-testid="wb-titleAr" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Title (English)</label>
                <Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} dir="ltr" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">السعر (دينار أردني)</label>
                <Input type="number" value={form.priceJod} onChange={(e) => setForm({ ...form, priceJod: e.target.value })} dir="ltr" data-testid="wb-price" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">رابط الغلاف</label>
                <Input value={form.coverImageUrl} onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })} dir="ltr" placeholder="https://..." />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">رابط عينة PDF</label>
                <Input value={form.samplePdfUrl} onChange={(e) => setForm({ ...form, samplePdfUrl: e.target.value })} dir="ltr" placeholder="https://..." />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">الصيغة</label>
                <select
                  value={form.format}
                  onChange={(e) => setForm({ ...form, format: e.target.value as Form["format"] })}
                  className="w-full border rounded-lg p-2 text-sm bg-background"
                  data-testid="wb-format"
                >
                  <option value="digital">رقمية</option>
                  <option value="printed">مطبوعة</option>
                  <option value="both">كلاهما</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">الحالة</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Form["status"] })}
                  className="w-full border rounded-lg p-2 text-sm bg-background"
                  data-testid="wb-status"
                >
                  <option value="draft">مسودة</option>
                  <option value="published">منشورة</option>
                  <option value="hidden">مخفية</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">الترتيب</label>
                <Input type="number" value={form.orderIndex} onChange={(e) => setForm({ ...form, orderIndex: e.target.value })} dir="ltr" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">رمز البرنامج المرتبط</label>
                <Input value={form.linkedProgramId} onChange={(e) => setForm({ ...form, linkedProgramId: e.target.value })} dir="ltr" placeholder="core / tot / teachers / children" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] text-muted-foreground mb-1 block">معرّف الدورة المرتبطة</label>
                <Input value={form.linkedCourseId} onChange={(e) => setForm({ ...form, linkedCourseId: e.target.value })} dir="ltr" placeholder="UUID للدورة" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">المحاور (عربي) — سطر لكل محور</label>
                <textarea className="w-full border rounded-lg p-2 text-sm bg-background min-h-[100px]" value={form.topicsArText} onChange={(e) => setForm({ ...form, topicsArText: e.target.value })} />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Topics (EN)</label>
                <textarea className="w-full border rounded-lg p-2 text-sm bg-background min-h-[100px]" value={form.topicsEnText} onChange={(e) => setForm({ ...form, topicsEnText: e.target.value })} dir="ltr" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] text-muted-foreground mb-1 block">الوصف (عربي)</label>
                <textarea className="w-full border rounded-lg p-2 text-sm bg-background min-h-[80px]" value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] text-muted-foreground mb-1 block">Description (EN)</label>
                <textarea className="w-full border rounded-lg p-2 text-sm bg-background min-h-[80px]" value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} dir="ltr" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="outline" onClick={cancel}>إلغاء</Button>
              <Button onClick={save} disabled={saving} className="bg-primary text-white gap-1" data-testid="wb-save">
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
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">لا توجد كراسات بعد. اضغط "إضافة كراسة" للبدء.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[12px] text-muted-foreground">
                  <tr>
                    <th className="text-start px-3 py-2">العنوان</th>
                    <th className="text-start px-3 py-2">slug</th>
                    <th className="text-start px-3 py-2">السعر</th>
                    <th className="text-start px-3 py-2">الصيغة</th>
                    <th className="text-start px-3 py-2">الحالة</th>
                    <th className="text-start px-3 py-2">الترتيب</th>
                    <th className="text-end px-3 py-2">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((w) => (
                    <tr key={w.id} className="border-t hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium">{w.titleAr}{w.titleEn && <span className="text-[11px] text-muted-foreground ms-1.5" dir="ltr">({w.titleEn})</span>}</td>
                      <td className="px-3 py-2 font-mono text-[11px]" dir="ltr">{w.slug}</td>
                      <td className="px-3 py-2">{w.priceJod ?? "—"}</td>
                      <td className="px-3 py-2">{w.format === "digital" ? "رقمية" : w.format === "printed" ? "مطبوعة" : "كلاهما"}</td>
                      <td className="px-3 py-2"><StatusBadge status={w.status === "published" ? "active" : w.status === "draft" ? "pending" : "suspended"} /></td>
                      <td className="px-3 py-2">{w.orderIndex}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(w)} aria-label="تعديل" data-testid={`wb-edit-${w.id}`}>
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => remove(w)} aria-label="حذف" data-testid={`wb-delete-${w.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
