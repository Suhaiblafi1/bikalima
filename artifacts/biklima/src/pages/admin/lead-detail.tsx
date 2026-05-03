import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight, Phone, Mail, MessageCircle, Activity, ListTodo,
  Send, GraduationCap, Star, FileText, Mic2, CalendarCheck, MessagesSquare, UserCheck,
} from "lucide-react";
import { AdminLayout } from "./_layout";
import {
  useApiFetch, LEAD_STATUS_OPTIONS, INTEREST_SCORE_OPTIONS, LEAD_SOURCE_LABELS,
  leadStatusLabel, leadStatusColor,
} from "./_shared";

type Lead = {
  id: string; fullName: string; phone: string | null; email: string | null;
  country: string | null; source: string; status: string;
  interestScore: "hot" | "warm" | "cold" | null;
  interestProgramId: string | null; interestProgramTitle: string | null;
  internalNotes: string | null;
  ownerUserId: string | null;
  lastContactAt: string | null; nextFollowUpAt: string | null;
  convertedAt: string | null; convertedToUserId: string | null;
  createdAt: string;
};
type Activity = {
  id: string; type: string; summaryAr: string | null; payload: unknown;
  actorEmail: string | null; createdAt: string;
};
type TaskRow = {
  id: string; title: string; status: string; priority: string;
  dueAt: string | null; assigneeUserId: string | null; createdAt: string;
};
type Linked = {
  enrollments: Array<{ id: string; program: string | null; createdAt: string }>;
  workbookOrders: Array<{ id: string; workbookId: string; quantity: number; format: string; createdAt: string }>;
  speechEvaluations: Array<{ id: string; status: string; createdAt: string }>;
  consultations: Array<{ id: string; preferredDate: string; preferredTime: string; status: string }>;
  chatThreads: Array<{ id: string; status: string; lastMessageAt: string | null }>;
};

const ACTIVITY_ICONS: Record<string, JSX.Element> = {
  linked_enrollment: <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />,
  linked_workbook_order: <FileText className="w-3.5 h-3.5 text-purple-600" />,
  linked_speech_evaluation: <Mic2 className="w-3.5 h-3.5 text-blue-600" />,
  linked_consultation: <CalendarCheck className="w-3.5 h-3.5 text-indigo-600" />,
  linked_chat: <MessagesSquare className="w-3.5 h-3.5 text-cyan-600" />,
  status_changed: <Star className="w-3.5 h-3.5 text-amber-600" />,
  note_added: <FileText className="w-3.5 h-3.5 text-slate-600" />,
  task_completed: <ListTodo className="w-3.5 h-3.5 text-green-600" />,
  converted: <UserCheck className="w-3.5 h-3.5 text-emerald-700" />,
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("ar", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminLeadDetailPage({ id }: { id: string }) {
  const apiFetch = useApiFetch();
  const [, navigate] = useLocation();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [linked, setLinked] = useState<Linked | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch(`/admin/leads/${id}`);
    if (r.ok) {
      const d = await r.json();
      setLead(d.lead); setActivities(d.activities ?? []); setTasks(d.tasks ?? []); setLinked(d.linked ?? null);
    }
    setLoading(false);
  }, [apiFetch, id]);

  useEffect(() => { refresh(); }, [refresh]);

  const updateLead = async (patch: Record<string, unknown>) => {
    setBusy(true);
    const r = await apiFetch(`/admin/leads/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setBusy(false);
    if (r.ok) refresh();
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setBusy(true);
    await apiFetch(`/admin/leads/${id}/activities`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "note_added", summaryAr: noteText.trim() }),
    });
    setNoteText(""); setBusy(false); refresh();
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    setBusy(true);
    await apiFetch(`/admin/tasks`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTaskTitle.trim(),
        leadId: id,
        dueAt: newTaskDue ? new Date(newTaskDue).toISOString() : null,
        priority: "normal",
        sourceType: "manual",
      }),
    });
    setNewTaskTitle(""); setNewTaskDue(""); setBusy(false); refresh();
  };

  const completeTask = async (taskId: string) => {
    await apiFetch(`/admin/tasks/${taskId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    refresh();
  };

  const convert = async () => {
    if (!confirm("هل أنت متأكد من تحويل العميل إلى طالب؟")) return;
    setBusy(true);
    await apiFetch(`/admin/leads/${id}/convert`, { method: "POST" });
    setBusy(false); refresh();
  };

  if (loading) {
    return (
      <AdminLayout activeKey="leads">
        <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      </AdminLayout>
    );
  }
  if (!lead) {
    return (
      <AdminLayout activeKey="leads">
        <Card><CardContent className="p-8 text-center text-sm">العميل غير موجود.</CardContent></Card>
      </AdminLayout>
    );
  }

  const waLink = lead.phone ? `https://wa.me/${lead.phone.replace(/\D/g, "")}` : null;

  return (
    <AdminLayout activeKey="leads">
      <button onClick={() => navigate("/admin/leads")} className="text-xs text-primary hover:underline flex items-center gap-1">
        <ArrowRight className="w-3 h-3" /> العودة لقائمة العملاء
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left: contact + status + actions */}
        <div className="lg:col-span-1 space-y-3">
          <Card>
            <CardContent className="p-4 space-y-2.5">
              <div>
                <h2 className="text-lg font-bold">{lead.fullName}</h2>
                <p className="text-[11px] text-muted-foreground">{LEAD_SOURCE_LABELS[lead.source] ?? lead.source} · {fmt(lead.createdAt)}</p>
              </div>
              <div className="space-y-1.5 text-xs" dir="ltr">
                {lead.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-muted-foreground" /> {lead.phone}</p>}
                {lead.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-muted-foreground" /> {lead.email}</p>}
                {lead.country && <p className="text-muted-foreground">{lead.country}</p>}
                {lead.interestProgramTitle && <p className="text-muted-foreground" dir="rtl">البرنامج: {lead.interestProgramTitle}</p>}
              </div>
              <div className="flex gap-2 pt-1">
                {waLink && <a href={waLink} target="_blank" rel="noreferrer" className="flex-1 text-center text-xs bg-green-600 text-white px-2 py-1.5 rounded-md hover:bg-green-700 flex items-center justify-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> واتساب</a>}
                {lead.email && <a href={`mailto:${lead.email}`} className="flex-1 text-center text-xs bg-blue-600 text-white px-2 py-1.5 rounded-md hover:bg-blue-700 flex items-center justify-center gap-1"><Mail className="w-3.5 h-3.5" /> إيميل</a>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground">الحالة</label>
                <select value={lead.status} onChange={(e) => updateLead({ status: e.target.value })} disabled={busy}
                  className={`mt-1 w-full border rounded-md p-1.5 text-xs font-bold ${leadStatusColor(lead.status)}`}>
                  {LEAD_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.labelAr}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground">درجة الاهتمام</label>
                <div className="flex gap-1 mt-1">
                  {INTEREST_SCORE_OPTIONS.map((s) => (
                    <button key={s.value} onClick={() => updateLead({ interestScore: s.value })}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-md border transition ${lead.interestScore === s.value ? `${s.color} border-current` : "bg-card border-border hover:bg-muted"}`}>
                      {s.labelAr}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground">المتابعة التالية</label>
                <Input type="datetime-local" value={lead.nextFollowUpAt ? lead.nextFollowUpAt.slice(0, 16) : ""}
                  onChange={(e) => updateLead({ nextFollowUpAt: e.target.value || null })}
                  className="mt-1 h-8 text-xs" />
              </div>
              {!lead.convertedAt ? (
                <Button onClick={convert} disabled={busy} className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
                  <UserCheck className="w-4 h-4 ml-1" /> تحويل إلى طالب
                </Button>
              ) : (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-md text-center font-bold">تم التحويل بتاريخ {fmt(lead.convertedAt)}</p>
              )}
            </CardContent>
          </Card>

          {linked && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-bold text-xs">السجلات المرتبطة</h3>
                <div className="space-y-1 text-[11px]">
                  <LinkedRow icon={<GraduationCap className="w-3 h-3" />} label="طلبات تسجيل" count={linked.enrollments.length} />
                  <LinkedRow icon={<FileText className="w-3 h-3" />} label="طلبات كراسات" count={linked.workbookOrders.length} />
                  <LinkedRow icon={<Mic2 className="w-3 h-3" />} label="تقييمات خطاب" count={linked.speechEvaluations.length} />
                  <LinkedRow icon={<CalendarCheck className="w-3 h-3" />} label="حجوزات استشارة" count={linked.consultations.length} />
                  <LinkedRow icon={<MessagesSquare className="w-3 h-3" />} label="محادثات الشات" count={linked.chatThreads.length} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: timeline + tasks */}
        <div className="lg:col-span-2 space-y-3">
          {/* Add note + activity timeline */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-bold text-sm flex items-center gap-1.5"><Activity className="w-4 h-4 text-primary" /> سجل النشاطات</h3>
              <div className="flex gap-2">
                <Input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="أضف ملاحظة..." className="h-8 text-xs" />
                <Button size="sm" onClick={addNote} disabled={busy || !noteText.trim()} className="h-8 bg-primary text-white"><Send className="w-3.5 h-3.5" /></Button>
              </div>
              {activities.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">لا توجد نشاطات بعد.</p>
              ) : (
                <ul className="space-y-1.5 max-h-96 overflow-y-auto">
                  {activities.map((a) => (
                    <li key={a.id} className="flex items-start gap-2 text-xs border-b last:border-0 pb-1.5">
                      <span className="mt-0.5 shrink-0">{ACTIVITY_ICONS[a.type] ?? <Activity className="w-3.5 h-3.5 text-muted-foreground" />}</span>
                      <div className="flex-1 min-w-0">
                        <p>{a.summaryAr ?? a.type}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{a.actorEmail ?? "تلقائي"} · {fmt(a.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-bold text-sm flex items-center gap-1.5"><ListTodo className="w-4 h-4 text-primary" /> المهام المرتبطة</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="عنوان المهمة" className="h-8 text-xs sm:col-span-2" />
                <div className="flex gap-1">
                  <Input type="datetime-local" value={newTaskDue} onChange={(e) => setNewTaskDue(e.target.value)} className="h-8 text-xs flex-1" />
                  <Button size="sm" onClick={addTask} disabled={busy || !newTaskTitle.trim()} className="h-8 bg-primary text-white">+</Button>
                </div>
              </div>
              {tasks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">لا توجد مهام.</p>
              ) : (
                <ul className="space-y-1">
                  {tasks.map((t) => (
                    <li key={t.id} className={`flex items-center gap-2 text-xs p-1.5 rounded ${t.status === "done" ? "bg-emerald-50 text-emerald-800 line-through" : "bg-muted/30"}`}>
                      <input type="checkbox" checked={t.status === "done"} onChange={() => completeTask(t.id)} disabled={t.status === "done"} className="w-3.5 h-3.5" />
                      <span className="flex-1">{t.title}</span>
                      {t.dueAt && <span className="text-[10px] text-muted-foreground">{fmt(t.dueAt)}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function LinkedRow({ icon, label, count }: { icon: JSX.Element; label: string; count: number }) {
  return (
    <div className="flex items-center justify-between p-1.5 rounded bg-muted/20">
      <span className="flex items-center gap-1.5 text-foreground/80">{icon} {label}</span>
      <span className={`font-bold ${count > 0 ? "text-primary" : "text-muted-foreground"}`}>{count}</span>
    </div>
  );
}
