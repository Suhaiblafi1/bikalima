import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListTodo, Plus, X, ExternalLink, Trash2 } from "lucide-react";
import { AdminLayout } from "./_layout";
import { useApiFetch, leadStatusLabel, leadStatusColor } from "./_shared";

type TaskRow = {
  id: string; title: string; description: string | null;
  leadId: string | null; leadName: string | null; leadStatus: string | null;
  assigneeUserId: string | null; assigneeEmail: string | null; assigneeFirstName: string | null; assigneeLastName: string | null;
  priority: string; status: string;
  dueAt: string | null; completedAt: string | null;
  sourceType: string | null; createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  open: "مفتوحة", in_progress: "قيد التنفيذ", done: "تمت", snoozed: "مؤجَّلة", cancelled: "ملغاة",
};
const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  done: "bg-emerald-100 text-emerald-800",
  snoozed: "bg-slate-100 text-slate-700",
  cancelled: "bg-rose-100 text-rose-700",
};
const PRIORITY_COLORS: Record<string, string> = {
  low: "text-slate-500", normal: "text-blue-600", high: "text-amber-600", urgent: "text-red-600 font-bold",
};
const PRIORITY_LABELS: Record<string, string> = {
  low: "منخفضة", normal: "عادية", high: "عالية", urgent: "عاجلة",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("ar", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function isOverdue(iso: string | null, status: string) {
  return iso && status !== "done" && new Date(iso).getTime() < Date.now();
}

const FILTERS = [
  { value: "all",    labelAr: "الكل" },
  { value: "open",   labelAr: "مفتوحة" },
  { value: "today",  labelAr: "اليوم" },
  { value: "overdue", labelAr: "متأخرة" },
  { value: "done",   labelAr: "مكتملة" },
];

export default function AdminTasksPage() {
  const apiFetch = useApiFetch();
  const [, navigate] = useLocation();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [assignee, setAssignee] = useState("all");
  const [showNew, setShowNew] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ filter, assignee });
    const r = await apiFetch(`/admin/tasks?${qs}`);
    if (r.ok) { const d = await r.json(); setTasks(d.tasks ?? []); }
    setLoading(false);
  }, [apiFetch, filter, assignee]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const updateStatus = async (id: string, status: string) => {
    await apiFetch(`/admin/tasks/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchTasks();
  };
  const remove = async (id: string) => {
    if (!confirm("حذف المهمة؟")) return;
    await apiFetch(`/admin/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  };

  return (
    <AdminLayout activeKey="tasks">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><ListTodo className="w-5 h-5 text-primary" /> المهام</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{tasks.length} مهمة</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="bg-primary text-white"><Plus className="w-4 h-4 me-1" /> مهمة جديدة</Button>
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${filter === f.value ? "bg-primary text-white border-primary" : "bg-card text-foreground border-border hover:bg-muted"}`}>
            {f.labelAr}
          </button>
        ))}
        <div className="border-r border-border h-5 mx-1" />
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="border rounded-md p-1 text-xs bg-background h-7">
          <option value="all">كل المسؤولين</option>
          <option value="mine">المسندة إليّ</option>
          <option value="unassigned">غير مُسندة</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : tasks.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">لا توجد مهام مطابقة.</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-[11px] uppercase">
                <tr>
                  <th className="text-start p-2 font-bold w-8"></th>
                  <th className="text-start p-2 font-bold">المهمة</th>
                  <th className="text-start p-2 font-bold">العميل</th>
                  <th className="text-start p-2 font-bold">الأولوية</th>
                  <th className="text-start p-2 font-bold">الحالة</th>
                  <th className="text-start p-2 font-bold">الموعد</th>
                  <th className="text-start p-2 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const overdue = isOverdue(t.dueAt, t.status);
                  return (
                    <tr key={t.id} className="border-t hover:bg-muted/20">
                      <td className="p-2">
                        <input type="checkbox" checked={t.status === "done"}
                          onChange={() => updateStatus(t.id, t.status === "done" ? "open" : "done")}
                          className="w-4 h-4" />
                      </td>
                      <td className={`p-2 ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                        <p className="font-bold">{t.title}</p>
                        {t.description && <p className="text-[10px] text-muted-foreground truncate max-w-xs">{t.description}</p>}
                      </td>
                      <td className="p-2">
                        {t.leadId && t.leadName ? (
                          <button onClick={() => navigate(`/admin/leads/${t.leadId}`)} className="text-primary hover:underline">{t.leadName}</button>
                        ) : "—"}
                        {t.leadStatus && <div><span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${leadStatusColor(t.leadStatus)}`}>{leadStatusLabel(t.leadStatus)}</span></div>}
                      </td>
                      <td className={`p-2 ${PRIORITY_COLORS[t.priority] ?? ""}`}>{PRIORITY_LABELS[t.priority] ?? t.priority}</td>
                      <td className="p-2">
                        <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border-0 ${STATUS_COLORS[t.status] ?? "bg-gray-100"}`}>
                          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </td>
                      <td className={`p-2 text-[11px] ${overdue ? "text-red-600 font-bold" : "text-muted-foreground"}`}>{fmt(t.dueAt)}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          {t.leadId && <button onClick={() => navigate(`/admin/leads/${t.leadId}`)} className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20"><ExternalLink className="w-3.5 h-3.5" /></button>}
                          <button onClick={() => remove(t.id)} className="p-1.5 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100"><Trash2 className="w-3.5 h-3.5" /></button>
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

      {showNew && <NewTaskModal onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); fetchTasks(); }} />}
    </AdminLayout>
  );
}

function NewTaskModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const apiFetch = useApiFetch();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState("normal");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const r = await apiFetch("/admin/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description: description || null, priority,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        sourceType: "manual",
      }),
    });
    setSaving(false);
    if (r.ok) onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl p-5 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold">مهمة جديدة</h2>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان المهمة *" className="h-9" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="تفاصيل (اختياري)"
          rows={3} className="w-full border rounded-md p-2 text-xs bg-background resize-none" />
        <div className="grid grid-cols-2 gap-2">
          <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="h-9 text-xs" />
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="border rounded-md p-2 text-xs bg-background h-9">
            <option value="low">منخفضة</option>
            <option value="normal">عادية</option>
            <option value="high">عالية</option>
            <option value="urgent">عاجلة</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>إلغاء</Button>
          <Button size="sm" onClick={submit} disabled={saving || !title.trim()} className="bg-primary text-white">{saving ? "..." : "حفظ"}</Button>
        </div>
      </div>
    </div>
  );
}
