import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown, Save, X, Settings2 } from "lucide-react";
import { ACTIVITY_TYPE_META, type ActivityType, type Activity } from "@/components/activity-player";

const ALL_TYPES: ActivityType[] = [
  "video", "text", "quiz", "reflection", "speech_builder", "voice_recording",
  "video_submission", "drag_drop", "scenario", "self_assessment", "coach_feedback", "challenge",
];
const SKILLS = [
  "idea", "structure", "voice", "body", "improvisation", "impact", "confidence", "fear_management",
];
const SKILL_AR: Record<string, string> = {
  idea: "الفكرة", structure: "البناء", voice: "الصوت", body: "لغة الجسد",
  improvisation: "الارتجال", impact: "التأثير", confidence: "الثقة", fear_management: "إدارة الخوف",
};

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export function AdminActivityEditor({ lessonId, onClose }: { lessonId: string; onClose: () => void }) {
  const apiBase = getApiBase();
  const [acts, setActs] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState<ActivityType>("text");

  const reload = useCallback(() => {
    setLoading(true);
    fetch(`${apiBase}/admin/lessons/${lessonId}/activities`, { credentials: "include" })
      .then(r => r.ok ? r.json() : { activities: [] })
      .then(d => setActs(d.activities ?? []))
      .finally(() => setLoading(false));
  }, [apiBase, lessonId]);

  useEffect(() => { reload(); }, [reload]);

  const create = async () => {
    setCreating(true);
    try {
      const r = await fetch(`${apiBase}/admin/lessons/${lessonId}/activities`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newType,
          titleAr: ACTIVITY_TYPE_META[newType].ar,
          config: defaultConfigFor(newType),
        }),
      });
      if (r.ok) {
        const d = await r.json();
        setEditingId(d.activity.id);
        reload();
      }
    } finally { setCreating(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا النشاط؟")) return;
    await fetch(`${apiBase}/admin/activities/${id}`, { method: "DELETE", credentials: "include" });
    reload();
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = acts.findIndex(a => a.id === id);
    const next = idx + dir;
    if (next < 0 || next >= acts.length) return;
    const reordered = [...acts];
    [reordered[idx], reordered[next]] = [reordered[next], reordered[idx]];
    setActs(reordered);
    await fetch(`${apiBase}/admin/lessons/${lessonId}/activities/reorder`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map(a => a.id) }),
    });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-end md:items-center justify-center p-2 md:p-6" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="bg-background rounded-t-2xl md:rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" /> أنشطة الدرس
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : (
            <>
              {acts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">لا توجد أنشطة لهذا الدرس بعد. أضف نشاطاً أدناه.</p>
              ) : (
                <div className="space-y-2">
                  {acts.map((a, idx) => (
                    <ActivityRow key={a.id} activity={a} idx={idx} total={acts.length}
                      isEditing={editingId === a.id}
                      onEdit={() => setEditingId(editingId === a.id ? null : a.id)}
                      onMove={(dir) => move(a.id, dir)}
                      onDelete={() => remove(a.id)}
                      onSaved={() => { setEditingId(null); reload(); }}
                      apiBase={apiBase} />
                  ))}
                </div>
              )}

              <div className="border-t border-border pt-3 flex flex-wrap items-center gap-2">
                <select value={newType} onChange={(e) => setNewType(e.target.value as ActivityType)}
                  className="border border-border rounded-lg p-2 text-sm bg-background">
                  {ALL_TYPES.map(t => <option key={t} value={t}>{ACTIVITY_TYPE_META[t].ar}</option>)}
                </select>
                <Button onClick={create} disabled={creating} size="sm" className="gap-1">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  إضافة نشاط
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function defaultConfigFor(type: ActivityType): Record<string, unknown> {
  switch (type) {
    case "video": return { videoUrl: "", videoType: "youtube" };
    case "text": return { bodyAr: "" };
    case "quiz": return { questions: [{ q: "سؤال؟", choices: ["خيار 1", "خيار 2"], answer: 0 }], passScore: 60 };
    case "reflection": return { prompt: "ما الذي تعلّمته؟", minLength: 50 };
    case "speech_builder": return {};
    case "voice_recording": return {};
    case "video_submission": return {};
    case "drag_drop": return { pairs: [{ left: "أ", right: "1" }, { left: "ب", right: "2" }] };
    case "scenario": return { startId: "s1", steps: [{ id: "s1", text: "ابدأ هنا…", choices: [{ label: "خيار", isEnd: true }] }] };
    case "self_assessment": return { items: ["مؤشر 1", "مؤشر 2"], scale: 5 };
    case "coach_feedback": return {};
    case "challenge": return { goal: "نفّذ هذا التحدي خلال 24 ساعة." };
  }
}

function ActivityRow({ activity, idx, total, isEditing, onEdit, onMove, onDelete, onSaved, apiBase }: {
  activity: Activity; idx: number; total: number; isEditing: boolean;
  onEdit: () => void; onMove: (dir: -1 | 1) => void; onDelete: () => void; onSaved: () => void;
  apiBase: string;
}) {
  const meta = ACTIVITY_TYPE_META[activity.type];
  const Icon = meta.icon;
  const [titleAr, setTitleAr] = useState(activity.titleAr);
  const [instructionsAr, setInstructionsAr] = useState(activity.instructionsAr ?? "");
  const [isRequired, setIsRequired] = useState(activity.isRequired);
  const [isPublished, setIsPublished] = useState((activity as Activity & { isPublished?: boolean }).isPublished ?? true);
  const [skillKeys, setSkillKeys] = useState<string[]>(activity.skillKeys ?? []);
  const [pointsReward, setPointsReward] = useState(activity.pointsReward);
  const [configJson, setConfigJson] = useState(JSON.stringify(activity.config ?? {}, null, 2));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    let config: unknown;
    try { config = JSON.parse(configJson); }
    catch { setError("صيغة JSON غير صحيحة في الإعدادات"); return; }
    setSaving(true);
    try {
      const r = await fetch(`${apiBase}/admin/activities/${activity.id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleAr, instructionsAr, isRequired, isPublished, skillKeys, pointsReward, config }),
      });
      if (r.ok) onSaved();
      else setError("فشل الحفظ");
    } finally { setSaving(false); }
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 p-2 bg-muted/20">
        <div className="flex flex-col gap-0.5">
          <button onClick={() => onMove(-1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
            <ChevronUp className="w-3 h-3" /></button>
          <button onClick={() => onMove(1)} disabled={idx === total - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
            <ChevronDown className="w-3 h-3" /></button>
        </div>
        <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{idx + 1}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${meta.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{activity.titleAr}</p>
          <p className="text-[10px] text-muted-foreground">{meta.ar} • {activity.skillKeys.length} مهارة • {activity.pointsReward}ن{!activity.isRequired && " • اختياري"}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 px-2 text-xs">{isEditing ? "إغلاق" : "تعديل"}</Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 w-7 p-0 text-destructive">
          <Trash2 className="w-3.5 h-3.5" /></Button>
      </div>
      {isEditing && (
        <div className="p-3 space-y-2 bg-blue-50/40">
          <Input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} placeholder="عنوان النشاط" className="text-sm h-8" />
          <textarea value={instructionsAr} onChange={(e) => setInstructionsAr(e.target.value)}
            placeholder="تعليمات للطالب (اختياري)..."
            className="w-full p-2 rounded-lg border border-border text-sm min-h-[60px]" />
          <div className="flex flex-wrap gap-3 items-center text-xs">
            <label className="flex items-center gap-1"><input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} /> مطلوب</label>
            <label className="flex items-center gap-1"><input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} /> منشور</label>
            <label className="flex items-center gap-1">نقاط:
              <input type="number" value={pointsReward} onChange={(e) => setPointsReward(Number(e.target.value))} className="w-16 p-1 border rounded text-xs" /></label>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1">المهارات المرتبطة:</p>
            <div className="flex flex-wrap gap-1.5">
              {SKILLS.map(s => {
                const sel = skillKeys.includes(s);
                return (
                  <button key={s} type="button"
                    onClick={() => setSkillKeys(sel ? skillKeys.filter(x => x !== s) : [...skillKeys, s])}
                    className={`text-[10px] px-2 py-1 rounded-full border ${sel ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background text-muted-foreground"}`}>
                    {SKILL_AR[s]}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1">الإعدادات (JSON):</p>
            <textarea value={configJson} onChange={(e) => setConfigJson(e.target.value)}
              dir="ltr"
              className="w-full p-2 rounded-lg border border-border text-[11px] font-mono min-h-[120px]" />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button onClick={save} disabled={saving} size="sm" className="gap-1">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              حفظ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
