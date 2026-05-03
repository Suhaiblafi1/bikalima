import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "./_layout";
import { useApiFetch } from "./_shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Edit3, Trash2, X, Save, Loader2, ScrollText, FileStack, Eye, EyeOff,
} from "lucide-react";

interface Policy {
  id: string;
  slug: string;
  version: number;
  titleAr: string; titleEn: string | null;
  summaryAr: string | null; summaryEn: string | null;
  bodyAr: string; bodyEn: string | null;
  effectiveDate: string;
  requiresAcceptance: boolean;
  displayOrder: number;
  isPublished: boolean;
  icon: string;
}

const empty: Partial<Policy> = {
  slug: "", titleAr: "", titleEn: "", summaryAr: "", summaryEn: "",
  bodyAr: "", bodyEn: "", effectiveDate: new Date().toISOString().slice(0, 10),
  requiresAcceptance: false, displayOrder: 0, isPublished: true, icon: "scroll-text",
};

export default function AdminPoliciesPage() {
  const apiFetch = useApiFetch();
  const [items, setItems] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Policy> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiFetch("/admin/policies");
      if (r.ok) {
        const d = await r.json();
        setItems(d.policies ?? []);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  // Group rows by slug — show latest version on top, older as collapsed history.
  const grouped = useMemo(() => {
    const m = new Map<string, Policy[]>();
    for (const p of items) {
      const arr = m.get(p.slug) ?? [];
      arr.push(p);
      m.set(p.slug, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => b.version - a.version);
    return Array.from(m.entries());
  }, [items]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const isNew = !editing.id;
      const r = await apiFetch(isNew ? "/admin/policies" : `/admin/policies/${editing.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      if (r.ok) { setEditing(null); await load(); }
      else { const d = await r.json().catch(() => ({})); alert(d.error ?? "فشل الحفظ"); }
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذه النسخة من السياسة؟ (لن يتم حذف موافقات المستخدمين)")) return;
    const r = await apiFetch(`/admin/policies/${id}`, { method: "DELETE" });
    if (r.ok) await load();
  };

  return (
    <AdminLayout activeKey="policies">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-primary" />
            الشروط والسياسات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة المستندات القانونية ونسخها. كل تعديل = نسخة جديدة.
          </p>
        </div>
        <Button onClick={() => setEditing({ ...empty })}>
          <Plus className="w-4 h-4 me-1" /> إضافة سياسة
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : grouped.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          لا يوجد سياسات. ستُنشأ السياسات الافتراضية تلقائياً عند أول عرض عام.
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {grouped.map(([slug, versions]) => {
            const latest = versions[0];
            const olderCount = versions.length - 1;
            return (
              <Card key={slug}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <ScrollText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold">{latest.titleAr}</h3>
                        <Badge variant="outline">v{latest.version}</Badge>
                        {latest.isPublished
                          ? <Badge className="bg-emerald-500"><Eye className="w-3 h-3 me-1" />منشور</Badge>
                          : <Badge variant="outline"><EyeOff className="w-3 h-3 me-1" />مسوّدة</Badge>}
                        {latest.requiresAcceptance && <Badge className="bg-amber-500">يتطلب موافقة</Badge>}
                        {olderCount > 0 && <Badge variant="outline"><FileStack className="w-3 h-3 me-1" />{olderCount} نسخة سابقة</Badge>}
                      </div>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">/{latest.slug}</p>
                      {latest.summaryAr && <p className="text-sm text-muted-foreground mt-1">{latest.summaryAr}</p>}
                      <p className="text-xs text-muted-foreground mt-1">نافذ من: {latest.effectiveDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(latest)}>
                      <Edit3 className="w-3.5 h-3.5 me-1" />تعديل النسخة
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing({
                      ...latest, id: undefined, version: undefined as unknown as number,
                    })}>
                      <Plus className="w-3.5 h-3.5 me-1" />نسخة جديدة
                    </Button>
                    <a href={`/policies/${slug}`} target="_blank" rel="noreferrer"
                       className="text-xs text-muted-foreground hover:text-primary ms-auto">معاينة عامة ↗</a>
                    <Button size="sm" variant="outline" className="text-rose-600" onClick={() => remove(latest.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setEditing(null)}>
          <Card className="w-full max-w-3xl my-8" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{editing.id ? "تعديل سياسة" : "سياسة / نسخة جديدة"}</h2>
                <Button variant="ghost" size="sm" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="المعرّف (slug) — لاتيني فقط *">
                  <Input value={editing.slug ?? ""} disabled={!!editing.id}
                    onChange={e => setEditing({ ...editing, slug: e.target.value.replace(/[^a-z0-9-]/g, "") })}
                    placeholder="terms / privacy / refund" />
                </Field>
                <Field label="تاريخ النفاذ *">
                  <Input type="date" value={editing.effectiveDate ?? ""} onChange={e => setEditing({ ...editing, effectiveDate: e.target.value })} />
                </Field>
                <Field label="العنوان (عربي) *">
                  <Input value={editing.titleAr ?? ""} onChange={e => setEditing({ ...editing, titleAr: e.target.value })} />
                </Field>
                <Field label="العنوان (English)">
                  <Input value={editing.titleEn ?? ""} onChange={e => setEditing({ ...editing, titleEn: e.target.value })} />
                </Field>
                <Field label="ملخص قصير (عربي)">
                  <Input value={editing.summaryAr ?? ""} onChange={e => setEditing({ ...editing, summaryAr: e.target.value })} />
                </Field>
                <Field label="ملخص قصير (English)">
                  <Input value={editing.summaryEn ?? ""} onChange={e => setEditing({ ...editing, summaryEn: e.target.value })} />
                </Field>
                <Field label="الأيقونة">
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={editing.icon ?? "scroll-text"}
                    onChange={e => setEditing({ ...editing, icon: e.target.value })}>
                    {["scroll-text","shield","wallet","users","heart-handshake","copyright"].map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </Field>
                <Field label="ترتيب العرض">
                  <Input type="number" value={editing.displayOrder ?? 0} onChange={e => setEditing({ ...editing, displayOrder: Number(e.target.value) })} />
                </Field>
              </div>
              <Field label="نص السياسة بالعربية (يدعم Markdown: # عناوين، - قوائم، **عريض**) *">
                <Textarea rows={12} className="font-mono text-sm"
                  value={editing.bodyAr ?? ""} onChange={e => setEditing({ ...editing, bodyAr: e.target.value })} />
              </Field>
              <Field label="نص السياسة بالإنجليزية (اختياري)">
                <Textarea rows={6} className="font-mono text-sm"
                  value={editing.bodyEn ?? ""} onChange={e => setEditing({ ...editing, bodyEn: e.target.value })} />
              </Field>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={editing.isPublished ?? true}
                    onChange={e => setEditing({ ...editing, isPublished: e.target.checked })} />
                  منشور
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={editing.requiresAcceptance ?? false}
                    onChange={e => setEditing({ ...editing, requiresAcceptance: e.target.checked })} />
                  يتطلب موافقة المستخدم
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setEditing(null)}>إلغاء</Button>
                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 me-1 animate-spin" /> : <Save className="w-4 h-4 me-1" />}
                  حفظ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
