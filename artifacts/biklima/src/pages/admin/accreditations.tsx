import { useEffect, useState } from "react";
import { AdminLayout } from "./_layout";
import { useApiFetch } from "./_shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Edit3, Trash2, X, Save, RefreshCw, ShieldCheck, Loader2,
  Calendar, Building2, ExternalLink, Sparkles,
} from "lucide-react";

type Status = "active" | "expired" | "pending_renewal" | "revoked" | "suspended";

interface Accreditation {
  id: string;
  nameAr: string; nameEn: string | null;
  descriptionAr: string | null; descriptionEn: string | null;
  issuerNameAr: string; issuerNameEn: string | null;
  issuerCountry: string | null; issuerWebsite: string | null; issuerLogoUrl: string | null;
  accreditationNumber: string | null;
  scopeAr: string | null; scopeEn: string | null;
  issueDate: string;
  expiryDate: string | null;
  status: Status;
  certificateFileUrl: string | null;
  verificationUrl: string | null;
  badgeColor: string;
  displayOrder: number;
  isPublic: boolean;
  isFeatured: boolean;
  notes: string | null;
}

const STATUS_LABEL: Record<Status, string> = {
  active: "ساري", expired: "منتهٍ", pending_renewal: "قيد التجديد", suspended: "موقوف", revoked: "ملغى",
};

const empty: Partial<Accreditation> = {
  nameAr: "", nameEn: "", issuerNameAr: "", issuerNameEn: "", issuerCountry: "",
  issuerWebsite: "", issuerLogoUrl: "", accreditationNumber: "",
  descriptionAr: "", descriptionEn: "", scopeAr: "", scopeEn: "",
  issueDate: new Date().toISOString().slice(0, 10), expiryDate: "",
  status: "active", certificateFileUrl: "", verificationUrl: "",
  displayOrder: 0, isPublic: true, isFeatured: false, notes: "",
};

export default function AdminAccreditationsPage() {
  const apiFetch = useApiFetch();
  const [items, setItems] = useState<Accreditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Accreditation> | null>(null);
  const [renewing, setRenewing] = useState<Accreditation | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiFetch("/admin/accreditations");
      if (r.ok) {
        const d = await r.json();
        setItems(d.accreditations ?? []);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const isNew = !editing.id;
      const r = await apiFetch(isNew ? "/admin/accreditations" : `/admin/accreditations/${editing.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editing,
          expiryDate: editing.expiryDate || null,
        }),
      });
      if (r.ok) { setEditing(null); await load(); }
      else { alert("فشل الحفظ"); }
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    const r = await apiFetch(`/admin/accreditations/${id}`, { method: "DELETE" });
    if (r.ok) await load();
  };

  const renew = async () => {
    if (!renewing) return;
    const newExpiryDate = (document.getElementById("renew-date") as HTMLInputElement)?.value;
    const newCertificateFileUrl = (document.getElementById("renew-cert") as HTMLInputElement)?.value;
    const notes = (document.getElementById("renew-notes") as HTMLTextAreaElement)?.value;
    if (!newExpiryDate) { alert("يرجى تحديد تاريخ الانتهاء الجديد"); return; }
    const r = await apiFetch(`/admin/accreditations/${renewing.id}/renew`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newExpiryDate, newCertificateFileUrl: newCertificateFileUrl || null, notes: notes || null }),
    });
    if (r.ok) { setRenewing(null); await load(); }
  };

  return (
    <AdminLayout activeKey="accreditations">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
            الاعتمادات والشهادات المؤسسية
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة اعتمادات المنصة، تواريخ الصلاحية، ومصادر الإصدار.
          </p>
        </div>
        <Button onClick={() => setEditing({ ...empty })}>
          <Plus className="w-4 h-4 me-1" /> إضافة اعتماد
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          لا يوجد اعتمادات مسجلة بعد.
        </CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {items.map(a => (
            <Card key={a.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start gap-3">
                  {a.issuerLogoUrl ? (
                    <img src={a.issuerLogoUrl} alt="" className="w-12 h-12 object-contain rounded-lg bg-white border border-border" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold">{a.nameAr}</h3>
                      <Badge variant="outline" className={
                        a.status === "active" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                        a.status === "expired" ? "bg-slate-200 text-slate-700" :
                        a.status === "pending_renewal" ? "bg-amber-100 text-amber-700" :
                        "bg-rose-100 text-rose-700"
                      }>{STATUS_LABEL[a.status]}</Badge>
                      {a.isFeatured && <Badge className="bg-amber-500"><Sparkles className="w-3 h-3 me-1" />مميّز</Badge>}
                      {!a.isPublic && <Badge variant="outline">مخفي</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{a.issuerNameAr}{a.issuerCountry ? ` • ${a.issuerCountry}` : ""}</p>
                    {a.accreditationNumber && <p className="text-xs font-mono text-muted-foreground mt-1">رقم: {a.accreditationNumber}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />صدر: {a.issueDate}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />ينتهي: {a.expiryDate || "بدون"}</span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                    <Edit3 className="w-3.5 h-3.5 me-1" />تعديل
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRenewing(a)}>
                    <RefreshCw className="w-3.5 h-3.5 me-1" />تجديد
                  </Button>
                  {a.verificationUrl && (
                    <a href={a.verificationUrl} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5" />تحقق
                    </a>
                  )}
                  <Button size="sm" variant="outline" className="text-rose-600 ms-auto" onClick={() => remove(a.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setEditing(null)}>
          <Card className="w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{editing.id ? "تعديل اعتماد" : "إضافة اعتماد جديد"}</h2>
                <Button variant="ghost" size="sm" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="اسم الاعتماد (عربي) *">
                  <Input value={editing.nameAr ?? ""} onChange={e => setEditing({ ...editing, nameAr: e.target.value })} />
                </Field>
                <Field label="اسم الاعتماد (English)">
                  <Input value={editing.nameEn ?? ""} onChange={e => setEditing({ ...editing, nameEn: e.target.value })} />
                </Field>
                <Field label="الجهة المانحة (عربي) *">
                  <Input value={editing.issuerNameAr ?? ""} onChange={e => setEditing({ ...editing, issuerNameAr: e.target.value })} />
                </Field>
                <Field label="الجهة المانحة (English)">
                  <Input value={editing.issuerNameEn ?? ""} onChange={e => setEditing({ ...editing, issuerNameEn: e.target.value })} />
                </Field>
                <Field label="بلد الجهة">
                  <Input value={editing.issuerCountry ?? ""} onChange={e => setEditing({ ...editing, issuerCountry: e.target.value })} />
                </Field>
                <Field label="رقم الاعتماد">
                  <Input value={editing.accreditationNumber ?? ""} onChange={e => setEditing({ ...editing, accreditationNumber: e.target.value })} />
                </Field>
                <Field label="موقع الجهة (URL)">
                  <Input value={editing.issuerWebsite ?? ""} onChange={e => setEditing({ ...editing, issuerWebsite: e.target.value })} />
                </Field>
                <Field label="شعار الجهة (URL)">
                  <Input value={editing.issuerLogoUrl ?? ""} onChange={e => setEditing({ ...editing, issuerLogoUrl: e.target.value })} />
                </Field>
                <Field label="تاريخ الإصدار *">
                  <Input type="date" value={editing.issueDate ?? ""} onChange={e => setEditing({ ...editing, issueDate: e.target.value })} />
                </Field>
                <Field label="تاريخ الانتهاء (اتركه فارغاً للدائم)">
                  <Input type="date" value={editing.expiryDate ?? ""} onChange={e => setEditing({ ...editing, expiryDate: e.target.value })} />
                </Field>
                <Field label="الحالة">
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={editing.status ?? "active"}
                    onChange={e => setEditing({ ...editing, status: e.target.value as Status })}>
                    {(Object.keys(STATUS_LABEL) as Status[]).map(s => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </Field>
                <Field label="ترتيب العرض">
                  <Input type="number" value={editing.displayOrder ?? 0} onChange={e => setEditing({ ...editing, displayOrder: Number(e.target.value) })} />
                </Field>
                <Field label="رابط شهادة الاعتماد (PDF)">
                  <Input value={editing.certificateFileUrl ?? ""} onChange={e => setEditing({ ...editing, certificateFileUrl: e.target.value })} />
                </Field>
                <Field label="رابط التحقق (موقع الجهة)">
                  <Input value={editing.verificationUrl ?? ""} onChange={e => setEditing({ ...editing, verificationUrl: e.target.value })} />
                </Field>
              </div>
              <Field label="الوصف (عربي)">
                <Textarea rows={2} value={editing.descriptionAr ?? ""} onChange={e => setEditing({ ...editing, descriptionAr: e.target.value })} />
              </Field>
              <Field label="نطاق الاعتماد">
                <Textarea rows={2} value={editing.scopeAr ?? ""} onChange={e => setEditing({ ...editing, scopeAr: e.target.value })} />
              </Field>
              <Field label="ملاحظات داخلية">
                <Textarea rows={2} value={editing.notes ?? ""} onChange={e => setEditing({ ...editing, notes: e.target.value })} />
              </Field>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={editing.isPublic ?? true}
                    onChange={e => setEditing({ ...editing, isPublic: e.target.checked })} />
                  منشور للعام
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={editing.isFeatured ?? false}
                    onChange={e => setEditing({ ...editing, isFeatured: e.target.checked })} />
                  مميّز
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

      {/* Renew modal */}
      {renewing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setRenewing(null)}>
          <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold">تجديد: {renewing.nameAr}</h2>
              <p className="text-sm text-muted-foreground">سيتم تسجيل التجديد في السجل وتحديث تاريخ الانتهاء.</p>
              <Field label="تاريخ الانتهاء الجديد *">
                <Input id="renew-date" type="date" defaultValue="" />
              </Field>
              <Field label="رابط الشهادة الجديدة (اختياري)">
                <Input id="renew-cert" defaultValue="" placeholder="https://..." />
              </Field>
              <Field label="ملاحظات">
                <Textarea id="renew-notes" rows={2} defaultValue="" />
              </Field>
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setRenewing(null)}>إلغاء</Button>
                <Button onClick={renew}><RefreshCw className="w-4 h-4 me-1" />تجديد</Button>
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
