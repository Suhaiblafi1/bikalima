import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useApiFetch } from "@/pages/admin/_shared";
import { StickyNote, Trash2, Loader2 } from "lucide-react";

type NoteRow = {
  id: string;
  trainerId: string;
  learnerId: string;
  courseId: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export function TrainerNotesPanel({
  learnerId,
  courseId,
  currentTrainerId,
  className,
}: {
  learnerId: string;
  courseId?: string | null;
  currentTrainerId?: string | null;
  className?: string;
}) {
  const apiFetch = useApiFetch();
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch(`/admin/learners/${learnerId}/trainer-notes`);
    if (res.ok) {
      const data = await res.json();
      setNotes(data.notes ?? []);
    } else if (res.status === 403) {
      setError("هذا الطالب ليس ضمن دوراتك.");
    } else {
      setError("تعذّر تحميل الملاحظات.");
    }
    setLoading(false);
  }, [apiFetch, learnerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    const text = draft.trim();
    if (!text) return;
    setSaving(true);
    const res = await apiFetch(`/admin/learners/${learnerId}/trainer-notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: text, courseId: courseId ?? undefined }),
    });
    setSaving(false);
    if (res.ok) {
      setDraft("");
      void load();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "تعذّر الحفظ.");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذه الملاحظة؟")) return;
    const res = await apiFetch(`/admin/trainer-notes/${id}`, { method: "DELETE" });
    if (res.ok) void load();
  };

  return (
    <div
      className={`border border-amber-200 bg-amber-50/50 rounded-lg p-3 space-y-2 ${className ?? ""}`}
      data-testid={`trainer-notes-${learnerId}`}
      dir="rtl"
    >
      <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
        <StickyNote className="w-4 h-4" /> ملاحظاتي عن الطالب (خاصة)
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> جاري التحميل...
        </div>
      ) : error ? (
        <div className="text-xs text-red-700">{error}</div>
      ) : notes.length === 0 ? (
        <div className="text-xs text-muted-foreground">لا توجد ملاحظات بعد.</div>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="bg-white border border-amber-100 rounded-md p-2 text-sm flex items-start gap-2"
              data-testid={`trainer-note-${n.id}`}
            >
              <div className="flex-1 whitespace-pre-wrap leading-relaxed">{n.note}</div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[10px] text-muted-foreground">
                  {new Date(n.updatedAt).toLocaleDateString("ar-EG")}
                </span>
                {(!currentTrainerId || n.trainerId === currentTrainerId) && (
                  <button
                    onClick={() => remove(n.id)}
                    className="text-red-600 hover:text-red-800"
                    aria-label="حذف"
                    data-testid={`delete-note-${n.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {!error && (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="اكتب ملاحظة خاصة عن الطالب (يراها أنت فقط)..."
            rows={2}
            className="text-sm bg-white"
            data-testid={`trainer-note-input-${learnerId}`}
          />
          <Button
            size="sm"
            onClick={submit}
            disabled={!draft.trim() || saving}
            className="bg-amber-700 hover:bg-amber-800 text-white h-7 text-xs"
            data-testid={`save-trainer-note-${learnerId}`}
          >
            {saving ? "جاري الحفظ..." : "حفظ الملاحظة"}
          </Button>
        </div>
      )}
    </div>
  );
}
