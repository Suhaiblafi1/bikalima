import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Plus, Save, Trash2, X } from "lucide-react";
import { useApiFetch } from "@/pages/admin/_shared";
import { toast } from "@/hooks/use-toast";

export type WorkbookPageRecord = {
  id: string;
  workbookId: string;
  pageNumber: number;
  sectionAr: string | null;
  sectionEn: string | null;
  titleAr: string | null;
  titleEn: string | null;
  bodyAr: string;
  bodyEn: string | null;
  exerciseAr: string | null;
  exerciseEn: string | null;
  isPublished: boolean;
};

type Form = {
  pageNumber: string;
  sectionAr: string;
  titleAr: string;
  bodyAr: string;
  exerciseAr: string;
  isPublished: boolean;
};

const emptyForm = (nextNumber: number): Form => ({
  pageNumber: String(nextNumber),
  sectionAr: "",
  titleAr: "",
  bodyAr: "",
  exerciseAr: "",
  isPublished: true,
});

function toForm(p: WorkbookPageRecord): Form {
  return {
    pageNumber: String(p.pageNumber),
    sectionAr: p.sectionAr ?? "",
    titleAr: p.titleAr ?? "",
    bodyAr: p.bodyAr,
    exerciseAr: p.exerciseAr ?? "",
    isPublished: p.isPublished,
  };
}

/** Optional text fields go up as undefined, not "", so they clear to NULL. */
function payload(f: Form) {
  const trimmed = (v: string) => (v.trim() ? v.trim() : undefined);
  return {
    pageNumber: Number(f.pageNumber),
    sectionAr: trimmed(f.sectionAr),
    titleAr: trimmed(f.titleAr),
    bodyAr: f.bodyAr.trim(),
    exerciseAr: trimmed(f.exerciseAr),
    isPublished: f.isPublished,
  };
}

export default function AdminWorkbookPages({
  workbookId,
  workbookTitle,
  onClose,
}: {
  workbookId: string;
  workbookTitle: string;
  onClose: () => void;
}) {
  const apiFetch = useApiFetch();
  const [pages, setPages] = useState<WorkbookPageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm(1));
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/workbooks/${workbookId}/pages`);
      if (!res.ok) throw new Error("load");
      const data = (await res.json()) as { pages: WorkbookPageRecord[] };
      setPages(data.pages ?? []);
    } catch {
      toast({ title: "تعذّر تحميل صفحات الكرّاسة", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [apiFetch, workbookId]);

  useEffect(() => { void load(); }, [load]);

  const nextNumber = pages.length ? Math.max(...pages.map((p) => p.pageNumber)) + 1 : 1;

  function startNew() {
    setEditingId(null);
    setForm(emptyForm(nextNumber));
  }

  function startEdit(p: WorkbookPageRecord) {
    setEditingId(p.id);
    setForm(toForm(p));
  }

  async function save() {
    if (!form.bodyAr.trim()) {
      toast({ title: "نص الصفحة مطلوب", variant: "destructive" });
      return;
    }
    const pageNumber = Number(form.pageNumber);
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      toast({ title: "رقم الصفحة غير صالح", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = editingId
        ? await apiFetch(`/admin/workbook-pages/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload(form)),
          })
        : await apiFetch(`/admin/workbooks/${workbookId}/pages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload(form)),
          });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast({ title: body.error ?? "تعذّر الحفظ", variant: "destructive" });
        return;
      }
      toast({ title: editingId ? "حُفظت الصفحة" : "أُضيفت الصفحة" });
      setEditingId(null);
      setForm(emptyForm(pages.length ? nextNumber + 1 : 2));
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: WorkbookPageRecord) {
    if (!window.confirm(`حذف الصفحة ${p.pageNumber}؟ لا يمكن التراجع.`)) return;
    const res = await apiFetch(`/admin/workbook-pages/${p.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast({ title: "تعذّر الحذف", variant: "destructive" });
      return;
    }
    toast({ title: "حُذفت الصفحة" });
    await load();
  }

  return (
    <Card data-testid="admin-workbook-pages">
      <CardContent className="p-4 sm:p-5 space-y-4" dir="rtl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold">صفحات: {workbookTitle}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              ما تكتبه هنا هو ما يقرأه الطالب داخل المنصة. افصل الفقرات بسطر فارغ.
            </p>
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose} aria-label="إغلاق">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">
                {loading ? "…" : `${pages.length} صفحة`}
              </span>
              <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={startNew}>
                <Plus className="w-3.5 h-3.5" /> صفحة جديدة
              </Button>
            </div>
            <div className="max-h-80 overflow-y-auto rounded-xl border border-border divide-y">
              {pages.length === 0 && !loading ? (
                <p className="p-4 text-xs text-muted-foreground">لا صفحات بعد.</p>
              ) : (
                pages.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 p-2.5 ${editingId === p.id ? "bg-primary/5" : ""}`}
                  >
                    <span className="w-8 shrink-0 text-center text-xs font-bold text-muted-foreground">
                      {p.pageNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="flex-1 min-w-0 text-start"
                      data-testid={`wbpage-edit-${p.id}`}
                    >
                      <span className="block truncate text-sm font-medium">
                        {p.titleAr || "(بلا عنوان)"}
                      </span>
                      {p.sectionAr && (
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {p.sectionAr}
                        </span>
                      )}
                    </button>
                    {p.isPublished ? (
                      <Eye className="w-3.5 h-3.5 shrink-0 text-muted-foreground" aria-label="منشورة" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 shrink-0 text-amber-600" aria-label="مسودة" />
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 text-red-600"
                      onClick={() => remove(p)}
                      aria-label="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[100px_minmax(0,1fr)]">
              <div className="space-y-1">
                <label className="text-xs font-bold" htmlFor="wbp-number">رقم الصفحة</label>
                <Input
                  id="wbp-number"
                  inputMode="numeric"
                  value={form.pageNumber}
                  onChange={(e) => setForm({ ...form, pageNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold" htmlFor="wbp-section">الفصل / القسم</label>
                <Input
                  id="wbp-section"
                  value={form.sectionAr}
                  onChange={(e) => setForm({ ...form, sectionAr: e.target.value })}
                  placeholder="الفصل الثاني · النطاق اللفظي"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold" htmlFor="wbp-title">عنوان الصفحة</label>
              <Input
                id="wbp-title"
                value={form.titleAr}
                onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold" htmlFor="wbp-body">نص الصفحة</label>
              <textarea
                id="wbp-body"
                rows={8}
                value={form.bodyAr}
                onChange={(e) => setForm({ ...form, bodyAr: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-3 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                data-testid="wbpage-body"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold" htmlFor="wbp-exercise">تمرين الصفحة (اختياري)</label>
              <textarea
                id="wbp-exercise"
                rows={2}
                value={form.exerciseAr}
                onChange={(e) => setForm({ ...form, exerciseAr: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-3 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                />
                منشورة للطلاب
              </label>
              <Button className="gap-1.5 font-bold" disabled={saving} onClick={save} data-testid="wbpage-save">
                <Save className="w-4 h-4" />
                {saving ? "جارٍ الحفظ…" : editingId ? "حفظ التعديل" : "أضف الصفحة"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
