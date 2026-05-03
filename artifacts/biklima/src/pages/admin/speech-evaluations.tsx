import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mic2, ExternalLink, ChevronDown, ChevronUp, Mail, Phone, Calendar, Send, Save, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { AdminLayout } from "./_layout";
import { TrainerNotesPanel } from "@/components/trainer-notes-panel";
import { useMe } from "@/hooks/use-me";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import {
  useApiFetch,
  StatusBadge,
  SPEECH_EVAL_STATUS_OPTIONS,
  RUBRIC_CRITERIA,
  PROGRAM_RECOMMENDATION_OPTIONS,
  type SpeechEvaluationRecord,
  type TrainerOption,
} from "./_shared";

type Toast = { type: "success" | "error"; text: string } | null;

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function RubricEditor({
  evaluation,
  trainers,
  onSaved,
  onToast,
  canReassign,
}: {
  evaluation: SpeechEvaluationRecord;
  trainers: TrainerOption[];
  onSaved: (next: SpeechEvaluationRecord) => void;
  onToast: (t: Toast) => void;
  canReassign: boolean;
}) {
  const apiFetch = useApiFetch();
  const initialRubric: Record<string, number> = {};
  for (const c of RUBRIC_CRITERIA) {
    const v = evaluation.rubricScores?.[c.key];
    if (typeof v === "number") initialRubric[c.key] = v;
  }
  const [rubric, setRubric] = useState<Record<string, number | "">>(() => {
    const seed: Record<string, number | ""> = {};
    for (const c of RUBRIC_CRITERIA) {
      seed[c.key] = typeof initialRubric[c.key] === "number" ? initialRubric[c.key] : "";
    }
    return seed;
  });
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const c of RUBRIC_CRITERIA) {
      const v = evaluation.rubricNotes?.[c.key];
      seed[c.key] = typeof v === "string" ? v : "";
    }
    return seed;
  });
  const [recommendation, setRecommendation] = useState<string>(evaluation.programRecommendation ?? "");
  const [reportMd, setReportMd] = useState<string>(evaluation.finalReportMd ?? "");
  const [trainerId, setTrainerId] = useState<string>(evaluation.assignedTrainerUserId ?? "");
  const [feedback, setFeedback] = useState<string>(evaluation.trainerFeedback ?? "");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const aiEvalEnabled = useFeatureFlag("ai_evaluation");

  const numericRubric = useMemo(() => {
    const out: number[] = [];
    for (const c of RUBRIC_CRITERIA) {
      const v = rubric[c.key];
      if (typeof v === "number" && Number.isFinite(v)) out.push(v);
    }
    return out;
  }, [rubric]);

  const liveOverall = numericRubric.length === RUBRIC_CRITERIA.length ? average(numericRubric) : null;
  const rubricComplete = numericRubric.length === RUBRIC_CRITERIA.length;
  const canPublish = rubricComplete && reportMd.trim().length > 0 && !!recommendation;

  const collectRubricForSubmit = (): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const c of RUBRIC_CRITERIA) {
      const v = rubric[c.key];
      if (typeof v === "number" && Number.isFinite(v)) out[c.key] = v;
    }
    return out;
  };

  const submit = async (publish: boolean) => {
    if (publish) setPublishing(true);
    else setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        rubricScores: collectRubricForSubmit(),
        rubricNotes: notes,
        programRecommendation: recommendation || null,
        finalReportMd: reportMd,
        trainerFeedback: feedback,
        publish,
      };
      if (canReassign && (trainerId || "") !== (evaluation.assignedTrainerUserId ?? "")) {
        payload.assignedTrainerUserId = trainerId || null;
      }
      const res = await apiFetch(`/admin/speech-evaluations/${evaluation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { evaluation?: SpeechEvaluationRecord; error?: string };
      if (!res.ok) {
        onToast({ type: "error", text: data.error ?? "تعذّر الحفظ" });
        return;
      }
      if (data.evaluation) onSaved(data.evaluation);
      onToast({ type: "success", text: publish ? "تم نشر التقرير" : "تم الحفظ" });
    } catch {
      onToast({ type: "error", text: "حدث خطأ غير متوقع" });
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const isPublished = !!evaluation.reportPublishedAt;

  return (
    <div className="space-y-4 text-xs" data-testid={`rubric-editor-${evaluation.id}`}>
      {/* Trainer assignment + recommendation */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-muted-foreground mb-1">المدرّب المسؤول</label>
          {canReassign ? (
            <select
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
              className="w-full text-xs border rounded p-2 bg-background"
              data-testid={`trainer-select-${evaluation.id}`}
            >
              <option value="">— لم يُعيَّن —</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {(t.firstName || t.lastName) ? `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() : t.email}
                  {t.role === "admin" ? " (مدير)" : ""}
                </option>
              ))}
            </select>
          ) : (
            <div
              className="w-full text-xs border rounded p-2 bg-muted text-muted-foreground"
              data-testid={`trainer-display-${evaluation.id}`}
            >
              {(() => {
                const t = trainers.find((x) => x.id === trainerId);
                if (!t) return "أنت";
                return (t.firstName || t.lastName) ? `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() : t.email;
              })()}
            </div>
          )}
        </div>
        <div>
          <label className="block font-bold text-muted-foreground mb-1">توصية البرنامج</label>
          <select
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            className="w-full text-xs border rounded p-2 bg-background"
            data-testid={`recommendation-select-${evaluation.id}`}
          >
            <option value="">— اختر التوصية —</option>
            {PROGRAM_RECOMMENDATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.labelAr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rubric grid */}
      <div className="bg-background border border-border rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-muted-foreground">المعايير (٠–١٠٠)</div>
          <div className="font-bold text-foreground">
            النتيجة الإجمالية: {liveOverall !== null ? <span className="text-primary text-base">{liveOverall}</span> : <span className="text-muted-foreground">—</span>}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {RUBRIC_CRITERIA.map((c) => (
            <div key={c.key} className="border border-border/60 rounded-lg p-2 bg-muted/10">
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="text-[11px] font-bold text-muted-foreground">{c.labelAr}</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={rubric[c.key] === "" ? "" : String(rubric[c.key])}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setRubric((p) => ({ ...p, [c.key]: "" }));
                      return;
                    }
                    const n = Number(raw);
                    if (Number.isNaN(n)) return;
                    setRubric((p) => ({ ...p, [c.key]: Math.max(0, Math.min(100, Math.round(n))) }));
                  }}
                  className="h-8 text-sm w-20"
                  data-testid={`rubric-${c.key}-${evaluation.id}`}
                />
              </div>
              <Textarea
                value={notes[c.key] ?? ""}
                onChange={(e) => setNotes((p) => ({ ...p, [c.key]: e.target.value.slice(0, 2000) }))}
                rows={2}
                placeholder="ملاحظة قصيرة لهذا المعيار (اختيارية)"
                className="text-xs"
                data-testid={`rubric-note-${c.key}-${evaluation.id}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Final report */}
      <div>
        <label className="block font-bold text-muted-foreground mb-1">
          التقرير النهائي (Markdown){isPublished && <span className="ms-2 text-emerald-700">— منشور</span>}
        </label>
        <Textarea
          value={reportMd}
          onChange={(e) => setReportMd(e.target.value.slice(0, 50000))}
          rows={8}
          placeholder="اكتب تقريرًا واضحًا للمتدرّب: نقاط القوة، فرص التحسين، الخطوات التالية..."
          className="text-sm font-mono"
          data-testid={`report-md-${evaluation.id}`}
        />
        <div className="text-[11px] text-muted-foreground text-end mt-1">{reportMd.length} / 50000</div>
      </div>

      {/* Internal trainer feedback (private) */}
      <div>
        <label className="block font-bold text-muted-foreground mb-1">ملاحظات داخلية (لا تظهر للمتدرّب)</label>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={2}
          className="text-sm"
          data-testid={`feedback-${evaluation.id}`}
        />
      </div>

      {!canPublish && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            للنشر يجب: إكمال كل المعايير السبعة، اختيار توصية البرنامج، وكتابة التقرير النهائي.
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-end pt-1">
        {aiEvalEnabled && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled
            title="سيتم تفعيل التقييم بالذكاء الاصطناعي قريباً"
            className="rounded-full"
            data-testid={`ai-evaluate-${evaluation.id}`}
          >
            <Sparkles className="w-3.5 h-3.5 me-1" />
            اقتراح تقرير بالذكاء الاصطناعي
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => submit(false)}
          disabled={saving || publishing}
          className="rounded-full"
          data-testid={`save-eval-${evaluation.id}`}
        >
          <Save className="w-3.5 h-3.5 me-1" />
          {saving ? "جارٍ الحفظ..." : "حفظ مسوّدة"}
        </Button>
        <Button
          size="sm"
          onClick={() => submit(true)}
          disabled={!canPublish || saving || publishing}
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          data-testid={`publish-eval-${evaluation.id}`}
        >
          {isPublished ? <CheckCircle2 className="w-3.5 h-3.5 me-1" /> : <Send className="w-3.5 h-3.5 me-1" />}
          {publishing ? "جارٍ النشر..." : isPublished ? "إعادة نشر" : "نشر التقرير"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminSpeechEvaluationsPage() {
  const apiFetch = useApiFetch();
  const { user: me, role } = useMe();
  const [items, setItems] = useState<SpeechEvaluationRecord[]>([]);
  const [trainers, setTrainers] = useState<TrainerOption[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [evalRes, trainerRes] = await Promise.all([
      apiFetch("/admin/speech-evaluations"),
      apiFetch("/admin/trainers"),
    ]);
    if (evalRes.ok) {
      const data = (await evalRes.json()) as { evaluations: SpeechEvaluationRecord[] };
      setItems(data.evaluations);
    }
    if (trainerRes.ok) {
      const data = (await trainerRes.json()) as { trainers: TrainerOption[] };
      setTrainers(data.trainers);
    }
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateStatus = async (id: string, status: SpeechEvaluationRecord["status"]) => {
    const res = await apiFetch(`/admin/speech-evaluations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
      setToast({ type: "success", text: "تم تحديث الحالة" });
    } else {
      setToast({ type: "error", text: "تعذّر تحديث الحالة" });
    }
  };

  const filtered = useMemo(
    () => (statusFilter === "all" ? items : items.filter((i) => i.status === statusFilter)),
    [items, statusFilter],
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: items.length };
    SPEECH_EVAL_STATUS_OPTIONS.forEach((o) => (m[o.value] = 0));
    items.forEach((i) => { m[i.status] = (m[i.status] ?? 0) + 1; });
    return m;
  }, [items]);

  return (
    <AdminLayout activeKey="speech-evaluations">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="font-bold flex items-center gap-2">
              <Mic2 className="w-5 h-5 text-primary" />
              طلبات تقييم الخطاب ({filtered.length})
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  statusFilter === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:bg-muted"
                }`}
                data-testid="filter-status-all"
              >
                الكل ({counts.all})
              </button>
              {SPEECH_EVAL_STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    statusFilter === s.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  }`}
                  data-testid={`filter-status-${s.value}`}
                >
                  {s.labelAr} ({counts[s.value] ?? 0})
                </button>
              ))}
            </div>
          </div>

          {toast && (
            <div
              className={`mb-3 px-3 py-2 rounded-lg text-xs font-medium border ${
                toast.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
              data-testid="admin-eval-toast"
            >
              {toast.text}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="w-8" />
                  <th className="text-start py-2 px-3 font-medium">الاسم</th>
                  <th className="text-start py-2 px-3 font-medium">التواصل</th>
                  <th className="text-start py-2 px-3 font-medium">المحتوى</th>
                  <th className="text-start py-2 px-3 font-medium">النتيجة</th>
                  <th className="text-start py-2 px-3 font-medium">الحالة</th>
                  <th className="text-start py-2 px-3 font-medium">التاريخ</th>
                  <th className="text-end py-2 px-3 font-medium">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">جاري التحميل...</td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">لا توجد طلبات</td></tr>
                )}
                {!loading && filtered.map((i) => {
                  const isOpen = expandedId === i.id;
                  const waPhone = i.phone.replace(/[^0-9]/g, "");
                  return (
                    <>
                      <tr key={i.id} className="border-b border-border/30 hover:bg-muted/20">
                        <td className="py-2 px-2 align-top">
                          <button
                            onClick={() => setExpandedId(isOpen ? null : i.id)}
                            className="text-muted-foreground hover:text-primary"
                            aria-label={isOpen ? "إغلاق" : "عرض التفاصيل"}
                            data-testid={`toggle-${i.id}`}
                          >
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="py-2 px-3 font-medium align-top">{i.fullName}</td>
                        <td className="py-2 px-3 align-top">
                          <div className="flex flex-col gap-1 text-xs">
                            <a href={`mailto:${i.email}`} className="inline-flex items-center gap-1 text-foreground hover:text-primary">
                              <Mail className="w-3 h-3" />{i.email}
                            </a>
                            <a
                              href={`https://wa.me/${waPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-green-700 hover:text-green-800"
                            >
                              <Phone className="w-3 h-3" />{i.phone}
                            </a>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-xs text-muted-foreground align-top">
                          <div className="flex flex-col gap-1">
                            {i.videoUrl && (
                              <a href={i.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                                <ExternalLink className="w-3 h-3" />فيديو
                              </a>
                            )}
                            {i.transcriptText && (
                              <span className="inline-flex items-center gap-1">نص ({i.transcriptText.length} حرف)</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 align-top">
                          {typeof i.overallScore === "number" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                              {i.overallScore}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 align-top">
                          <StatusBadge status={i.status} />
                          {i.reportPublishedAt && (
                            <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" />منشور
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-xs text-muted-foreground align-top whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(i.createdAt).toLocaleDateString("ar-SA")}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-end align-top">
                          <select
                            value={i.status}
                            onChange={(e) => updateStatus(i.id, e.target.value as SpeechEvaluationRecord["status"])}
                            className="text-xs border rounded p-1 bg-background"
                            data-testid={`status-select-${i.id}`}
                          >
                            {SPEECH_EVAL_STATUS_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>{s.labelAr}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={`${i.id}-detail`} className="border-b border-border/30 bg-muted/10">
                          <td />
                          <td colSpan={7} className="py-3 px-3">
                            {(i.transcriptText || i.videoUrl) && (
                              <div className="mb-3 grid md:grid-cols-2 gap-3 text-xs">
                                {i.transcriptText && (
                                  <div className="md:col-span-2">
                                    <div className="font-bold text-muted-foreground mb-1">نص الخطاب الأصلي</div>
                                    <div className="bg-background border border-border rounded-lg p-3 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                                      {i.transcriptText}
                                    </div>
                                  </div>
                                )}
                                {i.videoUrl && (
                                  <div>
                                    <div className="font-bold text-muted-foreground mb-1">رابط الفيديو</div>
                                    <a href={i.videoUrl} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">
                                      {i.videoUrl}
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                            <RubricEditor
                              evaluation={i}
                              trainers={trainers}
                              onSaved={(next) => setItems((prev) => prev.map((p) => (p.id === next.id ? next : p)))}
                              onToast={setToast}
                              canReassign={role === "admin"}
                            />
                            {i.userId && (role === "trainer" || role === "admin") && (
                              <div className="mt-3">
                                <TrainerNotesPanel
                                  learnerId={i.userId}
                                  currentTrainerId={me?.id ?? null}
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
