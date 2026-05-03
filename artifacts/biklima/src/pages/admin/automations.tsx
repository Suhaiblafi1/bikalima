import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Plus, X, Trash2, Edit3, PlayCircle } from "lucide-react";
import { AdminLayout } from "./_layout";
import { useApiFetch } from "./_shared";

type Automation = {
  id: string;
  name: string;
  descriptionAr: string | null;
  trigger: string;
  conditions: unknown;
  actions: Array<{ type: string; [k: string]: unknown }>;
  isActive: boolean;
  createdAt: string;
};

const TRIGGER_LABELS: Record<string, string> = {
  "lead.created": "عميل جديد",
  "lead.status_changed": "تغيُّر حالة العميل",
  "lead.stale_7d": "عميل خامل (7 أيام)",
  "speech_evaluation.created": "تقييم خطاب جديد",
  "workbook_order.created": "طلب كراسة جديد",
  "consultation.created": "حجز استشارة جديد",
  "enrollment.created": "طلب تسجيل جديد",
  "chat.message_received": "رسالة شات جديدة",
};

const ACTION_LABELS: Record<string, string> = {
  create_task: "إنشاء مهمة",
  send_whatsapp_template: "إرسال قالب واتساب",
  set_lead_status: "تعديل حالة العميل",
  add_activity: "تسجيل نشاط",
  notify_admin_email: "إشعار بريد للمدير",
};

export default function AdminAutomationsPage() {
  const apiFetch = useApiFetch();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [showNew, setShowNew] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch("/admin/automations");
    if (r.ok) { const d = await r.json(); setAutomations(d.automations ?? []); setTriggers(d.triggers ?? []); }
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggle = async (a: Automation) => {
    await apiFetch(`/admin/automations/${a.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !a.isActive }),
    });
    fetchAll();
  };
  const remove = async (id: string) => {
    if (!confirm("حذف الأتمتة؟")) return;
    await apiFetch(`/admin/automations/${id}`, { method: "DELETE" });
    fetchAll();
  };
  const test = async (id: string) => {
    const r = await apiFetch(`/admin/automations/${id}/test`, { method: "POST" });
    if (r.ok) alert("تم تشغيل الاختبار بنجاح ✓"); else alert("فشل الاختبار");
  };

  return (
    <AdminLayout activeKey="automations">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> الأتمتة</h1>
          <p className="text-xs text-muted-foreground mt-0.5">قواعد تلقائية تُشغَّل عند أحداث معيّنة — {automations.filter((a) => a.isActive).length} نشطة</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="bg-primary text-white"><Plus className="w-4 h-4 ml-1" /> أتمتة جديدة</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {automations.map((a) => (
            <Card key={a.id} className={a.isActive ? "" : "opacity-60"}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm">{a.name}</h3>
                    {a.descriptionAr && <p className="text-[11px] text-muted-foreground mt-0.5">{a.descriptionAr}</p>}
                  </div>
                  <label className="flex items-center gap-1 text-[10px] cursor-pointer shrink-0">
                    <input type="checkbox" checked={a.isActive} onChange={() => toggle(a)} className="w-3.5 h-3.5" />
                    {a.isActive ? "نشطة" : "متوقفة"}
                  </label>
                </div>
                <div className="text-[11px] space-y-1">
                  <p><span className="font-bold text-muted-foreground">المُشغِّل:</span> <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px]">{TRIGGER_LABELS[a.trigger] ?? a.trigger}</span></p>
                  <div>
                    <p className="font-bold text-muted-foreground mb-0.5">الإجراءات:</p>
                    <ul className="space-y-0.5">
                      {(a.actions ?? []).map((act, i) => (
                        <li key={i} className="text-[10px] bg-muted/30 px-2 py-1 rounded">
                          <span className="font-bold">{ACTION_LABELS[act.type] ?? act.type}</span>
                          {act.type === "create_task" && (act as { title?: string }).title && <span className="text-muted-foreground"> — {(act as { title?: string }).title}</span>}
                          {act.type === "send_whatsapp_template" && (act as { templateKey?: string }).templateKey && <span className="text-muted-foreground"> — {(act as { templateKey?: string }).templateKey}</span>}
                          {act.type === "set_lead_status" && (act as { status?: string }).status && <span className="text-muted-foreground"> → {(act as { status?: string }).status}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 pt-1">
                  <button onClick={() => test(a.id)} className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100" title="اختبار"><PlayCircle className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setEditing(a)} className="p-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(a.id)} className="p-1.5 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(showNew || editing) && (
        <AutomationModal
          triggers={triggers}
          initial={editing}
          onClose={() => { setShowNew(false); setEditing(null); }}
          onSaved={() => { setShowNew(false); setEditing(null); fetchAll(); }}
        />
      )}
    </AdminLayout>
  );
}

function AutomationModal({
  initial, triggers, onClose, onSaved,
}: { initial: Automation | null; triggers: string[]; onClose: () => void; onSaved: () => void }) {
  const apiFetch = useApiFetch();
  const [name, setName] = useState(initial?.name ?? "");
  const [descriptionAr, setDescriptionAr] = useState(initial?.descriptionAr ?? "");
  const [trigger, setTrigger] = useState(initial?.trigger ?? triggers[0] ?? "lead.created");
  const [actionsJson, setActionsJson] = useState(JSON.stringify(initial?.actions ?? [{ type: "create_task", title: "متابعة العميل", priority: "normal", dueInHours: 24 }], null, 2));
  const [conditionsJson, setConditionsJson] = useState(initial?.conditions ? JSON.stringify(initial.conditions, null, 2) : "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    let actions: unknown[];
    try { actions = JSON.parse(actionsJson); }
    catch { setError("صيغة JSON للإجراءات غير صحيحة"); return; }
    let conditions: unknown = null;
    if (conditionsJson.trim()) {
      try { conditions = JSON.parse(conditionsJson); }
      catch { setError("صيغة JSON للشروط غير صحيحة"); return; }
    }
    setSaving(true);
    const url = initial ? `/admin/automations/${initial.id}` : "/admin/automations";
    const r = await apiFetch(url, {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, descriptionAr, trigger, actions, conditions, isActive }),
    });
    setSaving(false);
    if (r.ok) onSaved(); else setError("فشل الحفظ");
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl p-5 w-full max-w-2xl space-y-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{initial ? "تعديل الأتمتة" : "أتمتة جديدة"}</h2>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الأتمتة *" className="h-9" />
        <Input value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} placeholder="وصف (عربي)" className="h-9" />
        <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="border rounded-md p-2 text-xs bg-background w-full h-9">
          {triggers.map((t) => <option key={t} value={t}>{t} — {TRIGGER_LABELS[t] ?? ""}</option>)}
        </select>
        <div>
          <label className="text-[11px] font-bold text-muted-foreground">الإجراءات (JSON)</label>
          <textarea value={actionsJson} onChange={(e) => setActionsJson(e.target.value)} rows={8}
            className="w-full border rounded-md p-2 text-xs font-mono bg-background resize-none" dir="ltr" />
          <p className="text-[10px] text-muted-foreground mt-1">
            الأنواع المدعومة: create_task, send_whatsapp_template, set_lead_status, add_activity, notify_admin_email
          </p>
        </div>
        <div>
          <label className="text-[11px] font-bold text-muted-foreground">الشروط (JSON اختياري)</label>
          <textarea value={conditionsJson} onChange={(e) => setConditionsJson(e.target.value)} rows={3}
            placeholder='{"source":"speech_evaluation"}'
            className="w-full border rounded-md p-2 text-xs font-mono bg-background resize-none" dir="ltr" />
        </div>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4" />
          نشطة
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>إلغاء</Button>
          <Button size="sm" onClick={submit} disabled={saving || !name.trim()} className="bg-primary text-white">{saving ? "..." : "حفظ"}</Button>
        </div>
      </div>
    </div>
  );
}
