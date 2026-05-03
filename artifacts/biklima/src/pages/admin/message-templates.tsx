import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquareText, Plus, X, Trash2, Edit3, Eye } from "lucide-react";
import { AdminLayout } from "./_layout";
import { useApiFetch } from "./_shared";

type Template = {
  id: string; key: string;
  titleAr: string; titleEn: string | null;
  bodyAr: string; bodyEn: string | null;
  placeholders: string[] | null;
  channel: "whatsapp" | "email" | "sms";
  isActive: boolean;
  createdAt: string;
};

const SAMPLE: Record<string, string> = {
  name: "محمد أحمد",
  programTitle: "البرنامج الأساسي",
  paymentLink: "https://bikalima.com/pay/abc123",
  date: "2026-05-10",
  time: "18:00",
  whatsappNumber: "+962790000000",
};

function render(body: string, vars: Record<string, string>): string {
  return body.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

export default function AdminMessageTemplatesPage() {
  const apiFetch = useApiFetch();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [previewing, setPreviewing] = useState<Template | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch("/admin/message-templates");
    if (r.ok) { const d = await r.json(); setTemplates(d.templates ?? []); }
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggle = async (t: Template) => {
    await apiFetch(`/admin/message-templates/${t.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    fetchAll();
  };
  const remove = async (id: string) => {
    if (!confirm("حذف القالب؟")) return;
    await apiFetch(`/admin/message-templates/${id}`, { method: "DELETE" });
    fetchAll();
  };

  return (
    <AdminLayout activeKey="message-templates">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><MessageSquareText className="w-5 h-5 text-primary" /> قوالب الرسائل</h1>
          <p className="text-xs text-muted-foreground mt-0.5">قوالب واتساب وبريد قابلة للاستخدام في الأتمتة والمتابعة اليدوية</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="bg-primary text-white"><Plus className="w-4 h-4 ml-1" /> قالب جديد</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((t) => (
            <Card key={t.id} className={t.isActive ? "" : "opacity-60"}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm">{t.titleAr}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">{t.key}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${t.channel === "whatsapp" ? "bg-green-100 text-green-800" : t.channel === "email" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-800"}`}>
                    {t.channel === "whatsapp" ? "واتساب" : t.channel === "email" ? "بريد" : "SMS"}
                  </span>
                </div>
                <div className="bg-muted/40 rounded-md p-2 text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">{t.bodyAr}</div>
                {(t.placeholders ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {t.placeholders!.map((p) => <span key={p} className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono" dir="ltr">{`{${p}}`}</span>)}
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                    <input type="checkbox" checked={t.isActive} onChange={() => toggle(t)} className="w-3.5 h-3.5" />
                    {t.isActive ? "نشط" : "متوقف"}
                  </label>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPreviewing(t)} className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditing(t)} className="p-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(t.id)} className="p-1.5 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(showNew || editing) && (
        <TemplateModal
          initial={editing}
          onClose={() => { setShowNew(false); setEditing(null); }}
          onSaved={() => { setShowNew(false); setEditing(null); fetchAll(); }}
        />
      )}
      {previewing && <PreviewModal template={previewing} onClose={() => setPreviewing(null)} />}
    </AdminLayout>
  );
}

function TemplateModal({ initial, onClose, onSaved }: { initial: Template | null; onClose: () => void; onSaved: () => void }) {
  const apiFetch = useApiFetch();
  const [key, setKey] = useState(initial?.key ?? "");
  const [titleAr, setTitleAr] = useState(initial?.titleAr ?? "");
  const [bodyAr, setBodyAr] = useState(initial?.bodyAr ?? "");
  const [channel, setChannel] = useState<Template["channel"]>(initial?.channel ?? "whatsapp");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const placeholders = useMemo(() => Array.from(new Set(Array.from(bodyAr.matchAll(/\{(\w+)\}/g)).map((m) => m[1]))), [bodyAr]);
  const preview = useMemo(() => render(bodyAr, SAMPLE), [bodyAr]);

  const submit = async () => {
    if (!titleAr.trim() || !bodyAr.trim()) return;
    setSaving(true);
    const url = initial ? `/admin/message-templates/${initial.id}` : "/admin/message-templates";
    const r = await apiFetch(url, {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: key || undefined, titleAr, bodyAr, channel, isActive }),
    });
    setSaving(false);
    if (r.ok) onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl p-5 w-full max-w-2xl space-y-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{initial ? "تعديل القالب" : "قالب جديد"}</h2>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} placeholder="عنوان القالب *" className="h-9" />
          <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="معرّف فريد (اختياري)" className="h-9" dir="ltr" />
        </div>
        <select value={channel} onChange={(e) => setChannel(e.target.value as Template["channel"])} className="border rounded-md p-2 text-xs bg-background w-full h-9">
          <option value="whatsapp">واتساب</option>
          <option value="email">بريد إلكتروني</option>
          <option value="sms">SMS</option>
        </select>
        <div>
          <label className="text-[11px] font-bold text-muted-foreground">نص الرسالة (يدعم {`{name}`} {`{programTitle}`} {`{paymentLink}`} وغيرها)</label>
          <textarea value={bodyAr} onChange={(e) => setBodyAr(e.target.value)} rows={6}
            className="w-full border rounded-md p-2 text-xs bg-background resize-none mt-1"
            placeholder="مرحباً {name}، شكراً لاهتمامك بـ {programTitle}..." />
        </div>
        {placeholders.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-muted-foreground">المتغيّرات المكتشفة:</span>
            {placeholders.map((p) => <span key={p} className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono" dir="ltr">{`{${p}}`}</span>)}
          </div>
        )}
        <div className="bg-muted/40 rounded-md p-2">
          <p className="text-[10px] font-bold text-muted-foreground mb-1">معاينة:</p>
          <p className="text-xs whitespace-pre-wrap">{preview || "—"}</p>
        </div>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4" /> نشط
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>إلغاء</Button>
          <Button size="sm" onClick={submit} disabled={saving || !titleAr.trim() || !bodyAr.trim()} className="bg-primary text-white">{saving ? "..." : "حفظ"}</Button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ template, onClose }: { template: Template; onClose: () => void }) {
  const [vars, setVars] = useState<Record<string, string>>({ ...SAMPLE });
  const placeholders = template.placeholders ?? [];
  const rendered = render(template.bodyAr, vars);
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl p-5 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold">معاينة: {template.titleAr}</h2>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        {placeholders.length > 0 && (
          <div className="space-y-1.5">
            {placeholders.map((p) => (
              <div key={p}>
                <label className="text-[10px] text-muted-foreground font-mono" dir="ltr">{`{${p}}`}</label>
                <Input value={vars[p] ?? ""} onChange={(e) => setVars({ ...vars, [p]: e.target.value })} className="h-8 text-xs" />
              </div>
            ))}
          </div>
        )}
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-xs whitespace-pre-wrap">{rendered}</p>
        </div>
      </div>
    </div>
  );
}
