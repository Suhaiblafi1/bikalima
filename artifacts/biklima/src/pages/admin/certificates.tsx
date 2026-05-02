import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "./_layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useApiFetch } from "./_shared";
import {
  Plus, Edit3, Trash2, X, Search, Download, Copy, RefreshCw,
  Sparkles, ExternalLink, ShieldCheck,
} from "lucide-react";

type Status = "active" | "expired" | "under-review" | "suspended" | "revoked";
type CertType =
  | "trainee" | "trainer" | "teacher"
  | "child-facilitator" | "ambassador" | "partner-institution";

type Cert = {
  id: string;
  code: string;
  fullName: string;
  email: string;
  phone: string | null;
  country: string | null;
  certType: CertType;
  programId: string | null;
  programName: string | null;
  issueDate: string;
  expiryDate: string | null;
  status: Status;
  assessorName: string | null;
  assessorUserId: string | null;
  internalNotes: string | null;
  certificateFileUrl: string | null;
  graduateImageUrl: string | null;
  showInRegistry: boolean;
  userId: string | null;
  createdAt: string;
};

const TYPE_LABELS: Record<CertType, string> = {
  "trainee": "متدرب مجتاز",
  "trainer": "مدرب معتمد",
  "teacher": "معلم معتمد",
  "child-facilitator": "ميسر برنامج الأطفال",
  "ambassador": "سفير بكلمة",
  "partner-institution": "مؤسسة شريكة معتمدة",
};
const STATUS_LABELS: Record<Status, string> = {
  active: "فعالة",
  expired: "منتهية",
  "under-review": "قيد المراجعة",
  suspended: "موقوفة",
  revoked: "ملغاة",
};
const STATUS_COLORS: Record<Status, string> = {
  active: "bg-emerald-100 text-emerald-800",
  expired: "bg-amber-100 text-amber-800",
  "under-review": "bg-sky-100 text-sky-800",
  suspended: "bg-orange-100 text-orange-800",
  revoked: "bg-rose-100 text-rose-800",
};

type FormState = {
  id: string | null;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  certType: CertType;
  programId: string;
  programName: string;
  issueDate: string;
  expiryDate: string;
  status: Status;
  assessorName: string;
  internalNotes: string;
  certificateFileUrl: string;
  graduateImageUrl: string;
  showInRegistry: boolean;
};

const empty: FormState = {
  id: null, code: "", fullName: "", email: "", phone: "", country: "",
  certType: "trainee", programId: "", programName: "",
  issueDate: new Date().toISOString().slice(0, 10),
  expiryDate: "", status: "active", assessorName: "",
  internalNotes: "", certificateFileUrl: "", graduateImageUrl: "",
  showInRegistry: false,
};

function toForm(c: Cert): FormState {
  return {
    id: c.id, code: c.code, fullName: c.fullName, email: c.email,
    phone: c.phone ?? "", country: c.country ?? "",
    certType: c.certType, programId: c.programId ?? "",
    programName: c.programName ?? "",
    issueDate: c.issueDate ? c.issueDate.slice(0, 10) : "",
    expiryDate: c.expiryDate ? c.expiryDate.slice(0, 10) : "",
    status: c.status, assessorName: c.assessorName ?? "",
    internalNotes: c.internalNotes ?? "",
    certificateFileUrl: c.certificateFileUrl ?? "",
    graduateImageUrl: c.graduateImageUrl ?? "",
    showInRegistry: c.showInRegistry,
  };
}

export default function AdminCertificates() {
  const apiFetch = useApiFetch();
  const [items, setItems] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Cert | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState<string>("");
  const [typeF, setTypeF] = useState<string>("");
  const [canDelete, setCanDelete] = useState(false);
  const [role, setRole] = useState<string>("");

  const verifyBaseUrl = useMemo(() => {
    return `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/certificates`;
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (statusF) params.set("status", statusF);
    if (typeF) params.set("type", typeF);
    const res = await apiFetch(`/admin/certificates${params.toString() ? `?${params}` : ""}`);
    if (res.ok) {
      const d = await res.json();
      setItems(d.certificates || []);
      setCanDelete(!!d.canDelete);
      setRole(d.role || "");
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const startCreate = async () => {
    setError(null);
    setEditing(null);
    setForm(empty);
    setCreating(true);
    // Pre-fill code from server
    const res = await apiFetch("/admin/certificates/generate-code", { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setForm((f) => ({ ...f, code: d.code }));
    }
  };

  const startEdit = (c: Cert) => {
    setError(null);
    setEditing(c);
    setForm(toForm(c));
    setCreating(false);
  };

  const cancel = () => {
    setEditing(null);
    setCreating(false);
    setForm(empty);
    setError(null);
  };

  const regenerateCode = async () => {
    const res = await apiFetch("/admin/certificates/generate-code", { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setForm((f) => ({ ...f, code: d.code }));
    }
  };

  const save = async () => {
    setError(null);
    if (!form.fullName.trim() || !form.email.trim()) {
      setError("الاسم والبريد الإلكتروني مطلوبان");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        code: form.code || undefined,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        country: form.country.trim() || null,
        certType: form.certType,
        programId: form.programId.trim() || null,
        programName: form.programName.trim() || null,
        issueDate: form.issueDate || undefined,
        expiryDate: form.expiryDate || null,
        status: form.status,
        assessorName: form.assessorName.trim() || null,
        internalNotes: form.internalNotes.trim() || null,
        certificateFileUrl: form.certificateFileUrl.trim() || null,
        graduateImageUrl: form.graduateImageUrl.trim() || null,
        showInRegistry: form.showInRegistry,
      };
      const res = editing
        ? await apiFetch(`/admin/certificates/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await apiFetch("/admin/certificates", {
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

  const remove = async (c: Cert) => {
    if (!canDelete) {
      alert("حذف الشهادات متاح فقط للمدير العام (Super Admin).");
      return;
    }
    if (!confirm(`حذف شهادة ${c.code} للخريج ${c.fullName}؟ لا يمكن التراجع.`)) return;
    const res = await apiFetch(`/admin/certificates/${c.id}`, { method: "DELETE" });
    if (res.ok) fetchItems();
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.message || "تعذّر الحذف");
    }
  };

  const changeStatus = async (c: Cert, status: Status) => {
    const res = await apiFetch(`/admin/certificates/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchItems();
  };

  const copyVerifyLink = async (c: Cert) => {
    const url = `${verifyBaseUrl}/${encodeURIComponent(c.code)}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("تم نسخ رابط التحقق");
    } catch {
      prompt("انسخ الرابط:", url);
    }
  };

  const exportCsv = () => {
    const apiBase = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "").replace(/\/[^/]+$/, "")}/api`;
    window.location.href = `${apiBase}/admin/certificates/export.csv`;
  };

  const isAdminRole = role === "admin";
  const showForm = creating || !!editing;

  return (
    <AdminLayout activeKey="certificates">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            سجل الشهادات والاعتمادات
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            إدارة شهادات بكلمة، توليد روابط تحقق ومشاركتها مع الخريجين.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isAdminRole && (
            <Button variant="outline" size="sm" className="gap-1" onClick={exportCsv} data-testid="cert-export">
              <Download className="w-4 h-4" /> تصدير CSV
            </Button>
          )}
          {isAdminRole && (
            <Button size="sm" className="gap-1" onClick={startCreate} data-testid="cert-new">
              <Plus className="w-4 h-4" /> شهادة جديدة
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl">
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم، البريد، أو رقم الشهادة"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") fetchItems(); }}
              className="pe-9"
              data-testid="cert-search"
            />
          </div>
          <select
            value={typeF}
            onChange={(e) => setTypeF(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="">كل الأنواع</option>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select
            value={statusF}
            onChange={(e) => setStatusF(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={fetchItems} className="gap-1">
            <Search className="w-4 h-4" /> بحث
          </Button>
        </CardContent>
      </Card>

      {/* Editor */}
      {showForm && (
        <Card className="rounded-2xl border-primary/40">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm">
                {editing ? `تعديل: ${editing.code}` : "إضافة شهادة جديدة"}
              </h2>
              <Button size="sm" variant="ghost" onClick={cancel}><X className="w-4 h-4" /></Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">رقم الشهادة</label>
                <div className="flex gap-1">
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} dir="ltr" data-testid="cert-form-code" />
                  <Button size="icon" variant="outline" onClick={regenerateCode} title="توليد رقم جديد">
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">الاسم الكامل *</label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} data-testid="cert-form-name" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">البريد الإلكتروني *</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" data-testid="cert-form-email" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">الهاتف</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">الدولة</label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">نوع الاعتماد</label>
                <select
                  value={form.certType}
                  onChange={(e) => setForm({ ...form, certType: e.target.value as CertType })}
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                >
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">معرّف البرنامج (slug/ID)</label>
                <Input value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })} dir="ltr" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">اسم البرنامج (للعرض)</label>
                <Input value={form.programName} onChange={(e) => setForm({ ...form, programName: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">المدرب أو المقيم</label>
                <Input value={form.assessorName} onChange={(e) => setForm({ ...form, assessorName: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">تاريخ الإصدار</label>
                <Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">تاريخ الانتهاء (اختياري)</label>
                <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">الحالة</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                >
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground">رابط ملف الشهادة (PDF/صورة)</label>
                <Input value={form.certificateFileUrl} onChange={(e) => setForm({ ...form, certificateFileUrl: e.target.value })} dir="ltr" placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">صورة الخريج (اختياري)</label>
                <Input value={form.graduateImageUrl} onChange={(e) => setForm({ ...form, graduateImageUrl: e.target.value })} dir="ltr" placeholder="https://..." />
              </div>
              <div className="md:col-span-3">
                <label className="text-xs text-muted-foreground">ملاحظات داخلية (لا تظهر للعموم)</label>
                <textarea
                  value={form.internalNotes}
                  onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                <input
                  id="cert-show-registry"
                  type="checkbox"
                  checked={form.showInRegistry}
                  onChange={(e) => setForm({ ...form, showInRegistry: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="cert-show-registry" className="text-sm cursor-pointer">
                  إظهار في سجل الخريجين العام (/graduates)
                </label>
              </div>
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={cancel}>إلغاء</Button>
              <Button size="sm" disabled={saving} onClick={save} data-testid="cert-save">
                {saving ? "جارٍ الحفظ..." : "حفظ"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>
      ) : items.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            لا توجد شهادات بعد. {isAdminRole ? "اضغط ‘شهادة جديدة’ لإضافة أول شهادة." : ""}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {items.map((c) => (
            <Card key={c.id} className="rounded-2xl">
              <CardContent className="p-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-0.5 rounded" dir="ltr">{c.code}</code>
                    <span className="font-bold">{c.fullName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted">
                      {TYPE_LABELS[c.certType]}
                    </span>
                    {c.showInRegistry && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        في السجل العام
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span dir="ltr">{c.email}</span>
                    {c.country && <> · {c.country}</>}
                    {c.programName && <> · {c.programName}</>}
                    {c.assessorName && <> · مقيّم: {c.assessorName}</>}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {isAdminRole && (
                    <select
                      value={c.status}
                      onChange={(e) => changeStatus(c, e.target.value as Status)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      title="تغيير الحالة"
                    >
                      {Object.entries(STATUS_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => copyVerifyLink(c)} title="نسخ رابط التحقق">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <a
                    href={`${verifyBaseUrl}/${encodeURIComponent(c.code)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted text-foreground/70"
                    title="فتح صفحة التحقق"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {isAdminRole && (
                    <Button size="icon" variant="ghost" onClick={() => startEdit(c)} title="تعديل">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button size="icon" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => remove(c)} title="حذف (Super Admin فقط)">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-2">
        <RefreshCw className="w-3 h-3" />
        التغييرات تُسجَّل في سجل النشاطات. الحذف متاح فقط للمدير العام (Super Admin).
      </p>
    </AdminLayout>
  );
}
