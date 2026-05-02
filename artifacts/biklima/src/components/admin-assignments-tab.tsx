import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ClipboardList,
  Plus,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Clock,
  Save,
  X,
  Star,
  ExternalLink,
  Youtube,
  Video,
  FileText,
} from "lucide-react";

type ApiFetch = (path: string, opts?: RequestInit) => Promise<Response>;

type AssignmentSummary = {
  id: string;
  courseId: string | null;
  titleAr: string;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  dueAt: string | null;
  isPublished: boolean;
  createdAt: string;
  courseTitleAr: string | null;
  courseTitleEn: string | null;
  submissionsTotal: number;
  submissionsReviewed: number;
};

type SubmissionRow = {
  id: string;
  userId: string;
  submissionType: "youtube" | "video_url" | "text";
  submissionUrl: string | null;
  submissionText: string | null;
  status: "submitted" | "reviewed";
  clarityScore: number | null;
  structureScore: number | null;
  openingScore: number | null;
  voiceScore: number | null;
  bodyLanguageScore: number | null;
  conclusionScore: number | null;
  impactScore: number | null;
  totalScore: number | null;
  trainerFeedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
};

type CourseOption = { id: string; titleAr: string; titleEn: string };

const CRITERIA = [
  { key: "clarityScore", labelAr: "الوضوح", labelEn: "Clarity" },
  { key: "structureScore", labelAr: "البنية", labelEn: "Structure" },
  { key: "openingScore", labelAr: "الافتتاحية", labelEn: "Opening" },
  { key: "voiceScore", labelAr: "الصوت", labelEn: "Voice" },
  { key: "bodyLanguageScore", labelAr: "لغة الجسد", labelEn: "Body Language" },
  { key: "conclusionScore", labelAr: "الخاتمة", labelEn: "Conclusion" },
  { key: "impactScore", labelAr: "التأثير", labelEn: "Impact" },
] as const;

type CriterionKey = (typeof CRITERIA)[number]["key"];

function blankForm() {
  return {
    courseId: "",
    titleAr: "",
    titleEn: "",
    descriptionAr: "",
    descriptionEn: "",
    dueAt: "",
    isPublished: true,
  };
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-SA");
  } catch {
    return iso;
  }
}

export default function AdminAssignmentsTab({
  apiFetch,
  courses,
}: {
  apiFetch: ApiFetch;
  courses: CourseOption[];
}) {
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [evalDraft, setEvalDraft] = useState<Record<string, Partial<Record<CriterionKey | "trainerFeedback", string>>>>({});

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch("/admin/assignments");
    if (res.ok) {
      const data = await res.json();
      setAssignments(data.assignments ?? []);
    }
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const loadSubmissions = useCallback(
    async (assignmentId: string) => {
      setSubmissionsLoading(true);
      setSubmissions([]);
      const res = await apiFetch(`/admin/assignments/${assignmentId}/submissions`);
      if (res.ok) {
        const data = await res.json();
        const rows: SubmissionRow[] = data.submissions ?? [];
        setSubmissions(rows);
        const draft: Record<string, Partial<Record<CriterionKey | "trainerFeedback", string>>> = {};
        for (const r of rows) {
          draft[r.id] = {
            clarityScore: r.clarityScore?.toString() ?? "",
            structureScore: r.structureScore?.toString() ?? "",
            openingScore: r.openingScore?.toString() ?? "",
            voiceScore: r.voiceScore?.toString() ?? "",
            bodyLanguageScore: r.bodyLanguageScore?.toString() ?? "",
            conclusionScore: r.conclusionScore?.toString() ?? "",
            impactScore: r.impactScore?.toString() ?? "",
            trainerFeedback: r.trainerFeedback ?? "",
          };
        }
        setEvalDraft(draft);
      }
      setSubmissionsLoading(false);
    },
    [apiFetch],
  );

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setSubmissions([]);
    } else {
      setExpandedId(id);
      loadSubmissions(id);
    }
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(blankForm());
    setShowForm(true);
  };

  const startEdit = (a: AssignmentSummary) => {
    setEditingId(a.id);
    setForm({
      courseId: a.courseId ?? "",
      titleAr: a.titleAr,
      titleEn: a.titleEn ?? "",
      descriptionAr: a.descriptionAr ?? "",
      descriptionEn: a.descriptionEn ?? "",
      dueAt: a.dueAt ? a.dueAt.slice(0, 10) : "",
      isPublished: a.isPublished,
    });
    setShowForm(true);
  };

  const submitForm = async () => {
    if (!form.titleAr.trim()) return;
    const payload = {
      courseId: form.courseId || null,
      titleAr: form.titleAr.trim(),
      titleEn: form.titleEn.trim() || null,
      descriptionAr: form.descriptionAr.trim() || null,
      descriptionEn: form.descriptionEn.trim() || null,
      dueAt: form.dueAt ? new Date(`${form.dueAt}T23:59:59`).toISOString() : null,
      isPublished: form.isPublished,
    };
    const res = editingId
      ? await apiFetch(`/admin/assignments/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await apiFetch("/admin/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    if (res.ok) {
      setShowForm(false);
      setEditingId(null);
      setForm(blankForm());
      fetchAssignments();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذا الواجب وجميع تسليماته؟")) return;
    const res = await apiFetch(`/admin/assignments/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (expandedId === id) setExpandedId(null);
      fetchAssignments();
    }
  };

  const evaluate = async (submissionId: string) => {
    const draft = evalDraft[submissionId] ?? {};
    const payload: Record<string, unknown> = {
      trainerFeedback: draft.trainerFeedback ?? "",
    };
    for (const c of CRITERIA) {
      const v = draft[c.key];
      payload[c.key] = v ? Number(v) : null;
    }
    const res = await apiFetch(`/admin/submissions/${submissionId}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok && expandedId) {
      loadSubmissions(expandedId);
      fetchAssignments();
    }
  };

  const updateDraft = (subId: string, key: CriterionKey | "trainerFeedback", value: string) => {
    setEvalDraft((d) => ({ ...d, [subId]: { ...d[subId], [key]: value } }));
  };

  const courseLabel = (id: string) =>
    courses.find((c) => c.id === id)?.titleAr ?? id;

  const liveTotal = useMemo(() => {
    const totals: Record<string, number | null> = {};
    for (const [subId, draft] of Object.entries(evalDraft)) {
      const nums = CRITERIA.map((c) => {
        const v = draft[c.key];
        return v ? Number(v) : NaN;
      }).filter((n) => Number.isFinite(n));
      if (nums.length === 0) {
        totals[subId] = null;
      } else {
        const sum = nums.reduce((a, b) => a + b, 0);
        totals[subId] = Math.round((sum / (nums.length * 10)) * 100);
      }
    }
    return totals;
  }, [evalDraft]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          الواجبات والتقييم
        </h2>
        <Button size="sm" onClick={startCreate} className="gap-1 bg-primary text-white">
          <Plus className="w-4 h-4" /> واجب جديد
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-bold text-sm">{editingId ? "تعديل الواجب" : "واجب جديد"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="عنوان الواجب (عربي) *"
                value={form.titleAr}
                onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
              />
              <Input
                placeholder="Title (English)"
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                dir="ltr"
              />
              <select
                className="border rounded-lg p-2 text-sm bg-background"
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              >
                <option value="">— بدون دورة محددة —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titleAr}
                  </option>
                ))}
              </select>
              <Input
                type="date"
                placeholder="آخر موعد"
                value={form.dueAt}
                onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
              />
              <textarea
                className="border rounded-lg p-2 text-sm resize-none bg-background sm:col-span-2"
                rows={3}
                placeholder="وصف / تعليمات الواجب (عربي)"
                value={form.descriptionAr}
                onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
              />
              <textarea
                className="border rounded-lg p-2 text-sm resize-none bg-background sm:col-span-2"
                rows={3}
                placeholder="Description / instructions (English)"
                value={form.descriptionEn}
                onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                dir="ltr"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              />
              منشور (متاح للطلاب)
            </label>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                إلغاء
              </Button>
              <Button
                size="sm"
                className="bg-primary text-white"
                onClick={submitForm}
                disabled={!form.titleAr.trim()}
              >
                {editingId ? "حفظ" : "إضافة"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">جارٍ التحميل…</div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            لا توجد واجبات بعد. أضف أول واجب من الزر أعلاه.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => {
            const isOpen = expandedId === a.id;
            return (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleExpand(a.id)}
                      className="mt-0.5 text-muted-foreground hover:text-foreground"
                      aria-label="toggle"
                    >
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold">{a.titleAr}</p>
                        {!a.isPublished && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            مسودة
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.courseTitleAr ? `الدورة: ${a.courseTitleAr}` : "بدون دورة"}
                        {" · "}
                        أنشئ في {fmtDate(a.createdAt)}
                        {a.dueAt ? ` · آخر موعد ${fmtDate(a.dueAt)}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        التسليمات: {a.submissionsTotal} · المُقيَّمة: {a.submissionsReviewed}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(a)}
                        className="h-7 w-7 p-0 text-blue-600"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(a.id)}
                        className="h-7 w-7 p-0 text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-border/40 space-y-3">
                      {a.descriptionAr && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {a.descriptionAr}
                        </p>
                      )}

                      {submissionsLoading ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          جارٍ تحميل التسليمات…
                        </div>
                      ) : submissions.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          لا توجد تسليمات بعد.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {submissions.map((s) => {
                            const fullName =
                              [s.userFirstName, s.userLastName]
                                .filter(Boolean)
                                .join(" ")
                                .trim() ||
                              s.userEmail ||
                              s.userId;
                            const draft = evalDraft[s.id] ?? {};
                            const total = liveTotal[s.id];
                            return (
                              <div
                                key={s.id}
                                className="border border-border/40 rounded-xl p-3 space-y-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <p className="font-medium text-sm">{fullName}</p>
                                    <p className="text-[11px] text-muted-foreground" dir="ltr">
                                      {s.userEmail}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                      سُلّم في {fmtDate(s.submittedAt)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {s.status === "reviewed" ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                        <CheckCircle className="w-3 h-3" /> مقيّم{" "}
                                        {s.totalScore !== null ? `· ${s.totalScore}/100` : ""}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                        <Clock className="w-3 h-3" /> بانتظار التقييم
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="bg-muted/30 rounded-lg p-3 text-sm">
                                  {s.submissionType === "youtube" && s.submissionUrl && (
                                    <a
                                      href={s.submissionUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-primary hover:underline"
                                      dir="ltr"
                                    >
                                      <Youtube className="w-4 h-4" /> {s.submissionUrl}
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                  {s.submissionType === "video_url" && s.submissionUrl && (
                                    <a
                                      href={s.submissionUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-primary hover:underline"
                                      dir="ltr"
                                    >
                                      <Video className="w-4 h-4" /> {s.submissionUrl}
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                  {s.submissionType === "text" && s.submissionText && (
                                    <div className="flex gap-2">
                                      <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                      <p className="whitespace-pre-wrap text-sm">
                                        {s.submissionText}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {CRITERIA.map((c) => (
                                    <div key={c.key} className="space-y-1">
                                      <label className="text-[11px] text-muted-foreground">
                                        {c.labelAr} (1-10)
                                      </label>
                                      <Input
                                        type="number"
                                        min={1}
                                        max={10}
                                        className="h-8 text-sm"
                                        value={draft[c.key] ?? ""}
                                        onChange={(e) =>
                                          updateDraft(s.id, c.key, e.target.value)
                                        }
                                        dir="ltr"
                                      />
                                    </div>
                                  ))}
                                  <div className="space-y-1">
                                    <label className="text-[11px] text-muted-foreground">
                                      المجموع (تلقائي)
                                    </label>
                                    <div className="h-8 flex items-center gap-1 px-2 rounded-md bg-primary/10 text-primary font-bold text-sm">
                                      <Star className="w-3.5 h-3.5" />
                                      {total ?? "—"}
                                      {total !== null && (
                                        <span className="text-[10px] font-normal text-muted-foreground">
                                          /100
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <textarea
                                  className="border rounded-lg p-2 text-sm resize-none bg-background w-full"
                                  rows={3}
                                  placeholder="ملاحظات المدرّب للطالب…"
                                  value={draft.trainerFeedback ?? ""}
                                  onChange={(e) =>
                                    updateDraft(s.id, "trainerFeedback", e.target.value)
                                  }
                                />

                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-primary text-white gap-1"
                                    onClick={() => evaluate(s.id)}
                                  >
                                    <Save className="w-3.5 h-3.5" /> حفظ التقييم
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
