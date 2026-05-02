import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  Star,
  Send,
  Youtube,
  Video,
  FileText,
  ExternalLink,
} from "lucide-react";

type Lang = "ar" | "en";

type StudentSubmission = {
  id: string;
  assignmentId: string;
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
};

type StudentAssignment = {
  id: string;
  courseId: string | null;
  titleAr: string;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  dueAt: string | null;
  createdAt: string;
  courseTitleAr: string | null;
  courseTitleEn: string | null;
  submission: StudentSubmission | null;
};

type ProgressSummary = {
  total: number;
  reviewedCount: number;
  averageScore: number | null;
};

const T = {
  ar: {
    heading: "الواجبات والتقييم",
    empty: "لا توجد واجبات متاحة حالياً.",
    progressHeading: "ملخّص تقدّمك",
    submitted: "في انتظار التقييم",
    reviewed: "تم التقييم",
    notSubmitted: "لم يتم التسليم",
    due: "آخر موعد",
    course: "الدورة",
    descriptionLabel: "التعليمات",
    submissionType: "نوع التسليم",
    typeYoutube: "رابط YouTube",
    typeVideo: "رابط فيديو آخر",
    typeText: "نص مكتوب",
    placeholderYoutube: "https://youtube.com/...",
    placeholderVideo: "https://...",
    placeholderText: "اكتب نص خطابك / إجابتك هنا…",
    submit: "إرسال التسليم",
    resubmit: "إعادة التسليم",
    yourSubmission: "تسليمك",
    feedback: "ملاحظات المدرّب",
    scores: "تقييم المعايير",
    totalScore: "المجموع",
    avg: "المعدل العام",
    reviewedCount: "واجبات مُقيَّمة",
    totalCount: "إجمالي التسليمات",
    criteria: {
      clarityScore: "الوضوح",
      structureScore: "البنية",
      openingScore: "الافتتاحية",
      voiceScore: "الصوت",
      bodyLanguageScore: "لغة الجسد",
      conclusionScore: "الخاتمة",
      impactScore: "التأثير",
    } as Record<string, string>,
  },
  en: {
    heading: "Assignments & Evaluation",
    empty: "No assignments available yet.",
    progressHeading: "Your Progress Summary",
    submitted: "Awaiting review",
    reviewed: "Reviewed",
    notSubmitted: "Not submitted",
    due: "Due",
    course: "Course",
    descriptionLabel: "Instructions",
    submissionType: "Submission type",
    typeYoutube: "YouTube link",
    typeVideo: "Other video link",
    typeText: "Written text",
    placeholderYoutube: "https://youtube.com/...",
    placeholderVideo: "https://...",
    placeholderText: "Write your speech / answer here…",
    submit: "Submit",
    resubmit: "Resubmit",
    yourSubmission: "Your submission",
    feedback: "Trainer feedback",
    scores: "Criteria scores",
    totalScore: "Total",
    avg: "Average score",
    reviewedCount: "Reviewed",
    totalCount: "Total submissions",
    criteria: {
      clarityScore: "Clarity",
      structureScore: "Structure",
      openingScore: "Opening",
      voiceScore: "Voice",
      bodyLanguageScore: "Body Language",
      conclusionScore: "Conclusion",
      impactScore: "Impact",
    } as Record<string, string>,
  },
};

const CRITERIA_KEYS = [
  "clarityScore",
  "structureScore",
  "openingScore",
  "voiceScore",
  "bodyLanguageScore",
  "conclusionScore",
  "impactScore",
] as const;

function fmtDate(iso: string | null, lang: Lang) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-SA" : undefined);
  } catch {
    return iso;
  }
}

export default function StudentAssignmentsTab({
  apiBase,
  lang,
}: {
  apiBase: string;
  lang: Lang;
}) {
  const t = T[lang];
  const isRtl = lang === "ar";

  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    type: "youtube" | "video_url" | "text";
    url: string;
    text: string;
  }>({ type: "youtube", url: "", text: "" });
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, pRes] = await Promise.all([
        fetch(`${apiBase}/my/assignments`, { credentials: "include" }),
        fetch(`${apiBase}/my/assignments/progress`, { credentials: "include" }),
      ]);
      if (aRes.ok) {
        const d = await aRes.json();
        setAssignments(d.assignments ?? []);
      }
      if (pRes.ok) {
        const d = await pRes.json();
        setProgress(d.summary ?? null);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, [apiBase]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const startEdit = (a: StudentAssignment) => {
    setEditingId(a.id);
    if (a.submission) {
      setDraft({
        type: a.submission.submissionType,
        url: a.submission.submissionUrl ?? "",
        text: a.submission.submissionText ?? "",
      });
    } else {
      setDraft({ type: "youtube", url: "", text: "" });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ type: "youtube", url: "", text: "" });
  };

  const submit = async (assignmentId: string) => {
    const payload = {
      submissionType: draft.type,
      submissionUrl: draft.type === "text" ? null : draft.url.trim(),
      submissionText: draft.type === "text" ? draft.text.trim() : null,
    };
    if (draft.type !== "text" && !payload.submissionUrl) return;
    if (draft.type === "text" && !payload.submissionText) return;
    setSubmittingId(assignmentId);
    try {
      const res = await fetch(`${apiBase}/my/assignments/${assignmentId}/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchAll();
        cancelEdit();
      }
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            {t.heading}
          </h3>

          {progress && progress.total > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-primary/8 rounded-xl px-3 py-3 text-center">
                <p className="text-2xl font-bold text-primary leading-none">
                  {progress.averageScore ?? "—"}
                  {progress.averageScore !== null && (
                    <span className="text-xs font-normal text-muted-foreground"> /100</span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">{t.avg}</p>
              </div>
              <div className="bg-green-50 rounded-xl px-3 py-3 text-center">
                <p className="text-2xl font-bold text-green-700 leading-none">
                  {progress.reviewedCount}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">{t.reviewedCount}</p>
              </div>
              <div className="bg-muted/30 rounded-xl px-3 py-3 text-center">
                <p className="text-2xl font-bold leading-none">{progress.total}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{t.totalCount}</p>
              </div>
            </div>
          )}

          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <ClipboardList className="w-8 h-8 text-primary/40" />
              </div>
              <p className="text-muted-foreground">{t.empty}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => {
                const sub = a.submission;
                const isEditing = editingId === a.id;
                const courseTitle = isRtl ? a.courseTitleAr : a.courseTitleEn || a.courseTitleAr;
                const title = isRtl ? a.titleAr : a.titleEn || a.titleAr;
                const description = isRtl
                  ? a.descriptionAr
                  : a.descriptionEn || a.descriptionAr;
                const isReviewed = sub?.status === "reviewed";

                return (
                  <div
                    key={a.id}
                    className="border border-border/60 rounded-xl p-4 space-y-3 bg-background"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold">{title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {courseTitle ? `${t.course}: ${courseTitle}` : ""}
                          {a.dueAt ? ` · ${t.due} ${fmtDate(a.dueAt, lang)}` : ""}
                        </p>
                      </div>
                      <div>
                        {!sub && (
                          <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {t.notSubmitted}
                          </span>
                        )}
                        {sub && sub.status === "submitted" && (
                          <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {t.submitted}
                          </span>
                        )}
                        {isReviewed && (
                          <span className="text-[11px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> {t.reviewed}
                            {sub.totalScore !== null ? ` · ${sub.totalScore}/100` : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {description}
                      </p>
                    )}

                    {sub && !isEditing && (
                      <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-2">
                        <p className="text-[11px] font-semibold text-muted-foreground">
                          {t.yourSubmission}
                        </p>
                        {sub.submissionType === "youtube" && sub.submissionUrl && (
                          <a
                            href={sub.submissionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                            dir="ltr"
                          >
                            <Youtube className="w-4 h-4" /> {sub.submissionUrl}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {sub.submissionType === "video_url" && sub.submissionUrl && (
                          <a
                            href={sub.submissionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                            dir="ltr"
                          >
                            <Video className="w-4 h-4" /> {sub.submissionUrl}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {sub.submissionType === "text" && sub.submissionText && (
                          <div className="flex gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="whitespace-pre-wrap text-sm">{sub.submissionText}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {isReviewed && !isEditing && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-primary" />
                          <p className="font-semibold text-sm">{t.scores}</p>
                          {sub.totalScore !== null && (
                            <span className="ms-auto text-sm font-bold text-primary">
                              {t.totalScore}: {sub.totalScore}/100
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {CRITERIA_KEYS.map((k) => {
                            const v = sub[k] as number | null;
                            return (
                              <div
                                key={k}
                                className="bg-background rounded-md px-2 py-1.5 text-xs"
                              >
                                <p className="text-muted-foreground text-[10px]">
                                  {t.criteria[k]}
                                </p>
                                <p className="font-bold text-sm">
                                  {v ?? "—"}
                                  {v !== null && (
                                    <span className="text-[10px] font-normal text-muted-foreground">
                                      {" "}
                                      /10
                                    </span>
                                  )}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                        {sub.trainerFeedback && (
                          <div className="border-t border-primary/15 pt-2">
                            <p className="text-[11px] font-semibold text-muted-foreground mb-1">
                              {t.feedback}
                            </p>
                            <p className="text-sm whitespace-pre-wrap">{sub.trainerFeedback}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {isReviewed && !isEditing && (
                      <p className="text-[11px] text-muted-foreground italic text-end">
                        {isRtl
                          ? "تمّ تقييم هذا الواجب — تواصل مع المدرّب لإعادة فتحه."
                          : "This assignment has been reviewed — contact your trainer to reopen."}
                      </p>
                    )}

                    {isEditing ? (
                      <div className="space-y-3 border-t border-border/40 pt-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            {t.submissionType}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {(
                              [
                                { v: "youtube", label: t.typeYoutube, Icon: Youtube },
                                { v: "video_url", label: t.typeVideo, Icon: Video },
                                { v: "text", label: t.typeText, Icon: FileText },
                              ] as const
                            ).map(({ v, label, Icon }) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => setDraft((d) => ({ ...d, type: v }))}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                  draft.type === v
                                    ? "bg-primary text-white border-primary"
                                    : "bg-background border-border text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" /> {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {draft.type === "text" ? (
                          <textarea
                            className="border rounded-lg p-2 text-sm resize-none bg-background w-full"
                            rows={5}
                            placeholder={t.placeholderText}
                            value={draft.text}
                            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                          />
                        ) : (
                          <Input
                            placeholder={
                              draft.type === "youtube"
                                ? t.placeholderYoutube
                                : t.placeholderVideo
                            }
                            value={draft.url}
                            onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                            dir="ltr"
                          />
                        )}

                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            {isRtl ? "إلغاء" : "Cancel"}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-primary text-white gap-1"
                            onClick={() => submit(a.id)}
                            disabled={submittingId === a.id}
                          >
                            <Send className="w-3.5 h-3.5" />
                            {submittingId === a.id
                              ? isRtl
                                ? "جارٍ الإرسال…"
                                : "Sending…"
                              : t.submit}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      !isReviewed && (
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant={sub ? "outline" : "default"}
                            className={!sub ? "bg-primary text-white gap-1" : "gap-1"}
                            onClick={() => startEdit(a)}
                          >
                            <Send className="w-3.5 h-3.5" />
                            {sub ? t.resubmit : t.submit}
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
