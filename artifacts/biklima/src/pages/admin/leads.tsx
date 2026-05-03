import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search, Phone, Mail, MessageCircle, ExternalLink, Plus, X } from "lucide-react";
import { AdminLayout } from "./_layout";
import {
  useApiFetch,
  LEAD_STATUS_OPTIONS, LEAD_SOURCE_LABELS, INTEREST_SCORE_OPTIONS,
  leadStatusLabel, leadStatusColor,
} from "./_shared";

type Lead = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  country: string | null;
  source: string;
  status: string;
  interestScore: "hot" | "warm" | "cold" | null;
  ownerUserId: string | null;
  interestProgramTitle: string | null;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
};
type Owner = { id: string; fullName: string; email: string };

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} س`;
  const d = Math.floor(h / 24);
  return `قبل ${d} يوم`;
}

export default function AdminLeadsPage() {
  const apiFetch = useApiFetch();
  const [, navigate] = useLocation();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (statusFilter) qs.set("status", statusFilter);
    if (sourceFilter) qs.set("source", sourceFilter);
    if (ownerFilter) qs.set("owner", ownerFilter);
    if (search) qs.set("q", search);
    const r = await apiFetch(`/admin/leads?${qs}`);
    if (r.ok) {
      const d = await r.json();
      setLeads(d.leads ?? []);
      const counts: Record<string, number> = {};
      for (const c of d.statusCounts ?? []) counts[c.status] = c.c;
      setStatusCounts(counts);
    }
    setLoading(false);
  }, [apiFetch, statusFilter, sourceFilter, ownerFilter, search]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => {
    apiFetch("/admin/leads-meta/owners").then((r) => r.ok ? r.json() : null).then((d) => {
      if (d?.owners) setOwners(d.owners);
    });
  }, [apiFetch]);

  const totalCount = useMemo(() => Object.values(statusCounts).reduce((a, b) => a + b, 0), [statusCounts]);

  return (
    <AdminLayout activeKey="leads">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" /> العملاء المحتملون</h1>
          <p className="text-xs text-muted-foreground mt-0.5">إجمالي {totalCount} عميل محتمل في قاعدة البيانات</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="bg-primary text-white"><Plus className="w-4 h-4 ml-1" /> إضافة عميل</Button>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setStatusFilter("")} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${!statusFilter ? "bg-primary text-white border-primary" : "bg-card text-foreground border-border hover:bg-muted"}`}>
          الكل ({totalCount})
        </button>
        {LEAD_STATUS_OPTIONS.map((s) => (
          <button key={s.value} onClick={() => setStatusFilter(s.value === statusFilter ? "" : s.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${statusFilter === s.value ? "bg-primary text-white border-primary" : `${s.color} border-transparent hover:opacity-80`}`}>
            {s.labelAr} ({statusCounts[s.value] ?? 0})
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الهاتف أو الإيميل..." className="text-xs h-8 pr-8" />
          </div>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="border rounded-md p-1 text-xs bg-background h-8">
            <option value="">كل المصادر</option>
            {Object.entries(LEAD_SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="border rounded-md p-1 text-xs bg-background h-8">
            <option value="">كل المسؤولين</option>
            <option value="unassigned">— غير مُعيَّن —</option>
            {owners.map((o) => <option key={o.id} value={o.id}>{o.fullName || o.email}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={fetchLeads} className="h-8 text-xs">تحديث</Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : leads.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">لا توجد نتائج تطابق المرشّحات.</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-[11px] uppercase">
                <tr>
                  <th className="text-start p-2 font-bold">الاسم</th>
                  <th className="text-start p-2 font-bold">المصدر</th>
                  <th className="text-start p-2 font-bold">البرنامج</th>
                  <th className="text-start p-2 font-bold">الحالة</th>
                  <th className="text-start p-2 font-bold">الاهتمام</th>
                  <th className="text-start p-2 font-bold">آخر تواصل</th>
                  <th className="text-start p-2 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => {
                  const score = INTEREST_SCORE_OPTIONS.find((s) => s.value === l.interestScore);
                  return (
                    <tr key={l.id} className="border-t hover:bg-muted/20 cursor-pointer" onClick={() => navigate(`/admin/leads/${l.id}`)}>
                      <td className="p-2">
                        <div className="font-bold">{l.fullName}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5" dir="ltr">
                          {l.phone && <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{l.phone}</span>}
                          {l.email && <span className="flex items-center gap-0.5"><Mail className="w-2.5 h-2.5" />{l.email}</span>}
                        </div>
                      </td>
                      <td className="p-2"><span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{LEAD_SOURCE_LABELS[l.source] ?? l.source}</span></td>
                      <td className="p-2 text-[11px]">{l.interestProgramTitle ?? "—"}</td>
                      <td className="p-2"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${leadStatusColor(l.status)}`}>{leadStatusLabel(l.status)}</span></td>
                      <td className="p-2">{score ? <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${score.color}`}>{score.labelAr}</span> : "—"}</td>
                      <td className="p-2 text-[11px] text-muted-foreground">{timeAgo(l.lastContactAt ?? l.createdAt)}</td>
                      <td className="p-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {l.phone && <a href={`https://wa.me/${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100" title="واتساب"><MessageCircle className="w-3.5 h-3.5" /></a>}
                          <button onClick={() => navigate(`/admin/leads/${l.id}`)} className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20" title="فتح"><ExternalLink className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {showNew && <NewLeadModal onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); fetchLeads(); }} />}
    </AdminLayout>
  );
}

function NewLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const apiFetch = useApiFetch();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("other");
  const [interestProgramTitle, setInterestProgramTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!fullName.trim()) { setError("الاسم مطلوب"); return; }
    setSaving(true); setError("");
    const r = await apiFetch("/admin/leads", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone: phone || null, email: email || null, source, interestProgramTitle: interestProgramTitle || null }),
    });
    setSaving(false);
    if (r.ok) onCreated(); else setError("فشل الحفظ");
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl p-5 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold">إضافة عميل محتمل</h2>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="الاسم الكامل *" className="h-9" />
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الواتساب" dir="ltr" className="h-9" />
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" dir="ltr" className="h-9" />
        <Input value={interestProgramTitle} onChange={(e) => setInterestProgramTitle(e.target.value)} placeholder="البرنامج المهتم به" className="h-9" />
        <select value={source} onChange={(e) => setSource(e.target.value)} className="border rounded-md p-2 text-xs bg-background w-full h-9">
          {Object.entries(LEAD_SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>إلغاء</Button>
          <Button size="sm" onClick={submit} disabled={saving} className="bg-primary text-white">{saving ? "..." : "حفظ"}</Button>
        </div>
      </div>
    </div>
  );
}
