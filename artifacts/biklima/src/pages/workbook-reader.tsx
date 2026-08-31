import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CheckCircle2, Lock, NotebookPen, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/states";
import { useLang } from "@/hooks/useLang";
import { apiFetch } from "@/lib/api-fetch";
import { rubricFor, rubricSkills, skillLabel } from "@workspace/assessment";
import { RubricBrief } from "@/components/rubric-brief";
import { RubricResult } from "@/components/rubric-result";

type PageSummary = {
  id: string;
  pageNumber: number;
  sectionAr: string | null;
  sectionEn: string | null;
  titleAr: string | null;
  titleEn: string | null;
  isPublished: boolean;
};

type WorkbookPage = PageSummary & {
  bodyAr: string;
  bodyEn: string | null;
  exerciseAr: string | null;
  exerciseEn: string | null;
  exerciseType: "none" | "text" | "video_link";
  skillKey: string | null;
  skillPoints: number;
};

type Submission = {
  id: string;
  content: string | null;
  videoUrl: string | null;
  status: "submitted" | "reviewed";
  decision: "pass" | "needs_revision" | null;
  feedback: string | null;
  awardedPoints: number;
  awardedBreakdown: Record<string, number> | null;
  rubricKey: string | null;
  rubricVersion: number | null;
  rubricScores: Record<string, number> | null;
  rubricNotes: Record<string, string> | null;
  rubricPercent: number | null;
  updatedAt: string;
};

type Note = {
  id: string;
  pageId: string;
  quote: string | null;
  content: string;
  createdAt: string;
};

type TocResponse = {
  workbook: { id: string; slug: string; titleAr: string; titleEn: string | null };
  pages: PageSummary[];
  totalPages: number;
};

const copy = {
  ar: {
    back: "رجوع",
    notOwned: "لا تملك هذه الكرّاسة بعد",
    notOwnedBody: "تظهر الكرّاسة هنا فور تأكيد طلبك. يمكنك طلبها من صفحة الكرّاسات.",
    browse: "تصفّح الكرّاسات",
    empty: "لم تُضَف صفحات لهذه الكرّاسة بعد",
    emptyBody: "سيضيفها فريق بكلمة قريباً.",
    pageOf: (n: number, total: number) => `صفحة ${n} من ${total}`,
    exercise: "تمرين الصفحة",
    yourNote: "ملاحظاتك على هذه الصفحة",
    placeholder: "اكتب ملاحظتك على هذه الصفحة…",
    save: "حفظ",
    saving: "جارٍ الحفظ…",
    private: "خاصة بك — لا يراها المدرب",
    quoted: "على المقطع المحدَّد",
    clearQuote: "إلغاء التحديد",
    selectHint: "حدّد نصاً من الصفحة لتربط ملاحظتك به.",
    prev: "السابق",
    next: "التالي",
    delete: "حذف",
    noNotes: "لا ملاحظات على هذه الصفحة بعد.",
    draft: "مسودة",
    answerPlaceholder: "اكتب إجابتك على التمرين…",
    videoPlaceholder: "الصق رابط الفيديو (يوتيوب، درايف، …)",
    submit: "سلّم للمدرّب",
    resubmit: "أعد التسليم",
    submitting: "جارٍ التسليم…",
    awaiting: "بانتظار تصحيح المدرّب",
    passed: "اجتزت التمرين",
    needsRevision: "يحتاج تعديلاً",
    trainerFeedback: "ملاحظة المدرّب",
    worth: (n: number, skills: string) => `حتى ${n} نقطة · ${skills}`,
    earned: (n: number) => `+${n} نقطة`,
    notPrivate: "يراها المدرّب لتصحيحها",
    yourAnswer: "إجابتك",
    openVideo: "فتح الفيديو",
  },
  en: {
    back: "Back",
    notOwned: "You don't own this workbook yet",
    notOwnedBody: "It appears here once your order is confirmed. You can order it from the workbooks page.",
    browse: "Browse workbooks",
    empty: "No pages have been added yet",
    emptyBody: "The Bikalima team will add them soon.",
    pageOf: (n: number, total: number) => `Page ${n} of ${total}`,
    exercise: "Page exercise",
    yourNote: "Your notes on this page",
    placeholder: "Write your note on this page…",
    save: "Save",
    saving: "Saving…",
    private: "Private to you — your trainer can't see it",
    quoted: "On the selected passage",
    clearQuote: "Clear selection",
    selectHint: "Select text on the page to anchor your note to it.",
    prev: "Previous",
    next: "Next",
    delete: "Delete",
    noNotes: "No notes on this page yet.",
    draft: "Draft",
    answerPlaceholder: "Write your answer to the exercise…",
    videoPlaceholder: "Paste the video link (YouTube, Drive, …)",
    submit: "Send to trainer",
    resubmit: "Submit again",
    submitting: "Submitting…",
    awaiting: "Waiting for your trainer",
    passed: "Passed",
    needsRevision: "Needs revision",
    trainerFeedback: "Trainer's note",
    worth: (n: number, skills: string) => `up to ${n} points · ${skills}`,
    earned: (n: number) => `+${n} points`,
    notPrivate: "Your trainer reads this to grade it",
    yourAnswer: "Your answer",
    openVideo: "Open video",
  },
} as const;

export default function WorkbookReaderPage() {
  const [, params] = useRoute("/workbooks/:slug/read");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const { lang, dir } = useLang();
  const isRtl = lang === "ar";
  const t = copy[lang];
  const queryClient = useQueryClient();

  const [pageNumber, setPageNumber] = useState(1);
  const [draft, setDraft] = useState("");
  const [quote, setQuote] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerTouched, setAnswerTouched] = useState(false);

  const toc = useQuery<TocResponse | { forbidden: true }>({
    queryKey: ["workbook-toc", slug],
    enabled: !!slug,
    queryFn: async () => {
      const res = await apiFetch(`/workbooks/${encodeURIComponent(slug)}/pages`);
      if (res.status === 403) return { forbidden: true } as const;
      if (!res.ok) throw new Error("toc");
      return (await res.json()) as TocResponse;
    },
  });

  const forbidden = !!toc.data && "forbidden" in toc.data;
  const tocData = forbidden ? null : (toc.data as TocResponse | undefined) ?? null;
  const totalPages = tocData?.totalPages ?? 0;
  const firstPageNumber = tocData?.pages[0]?.pageNumber ?? 1;

  // Land on the first authored page rather than assuming it is numbered 1.
  useEffect(() => {
    if (tocData && tocData.pages.length > 0) setPageNumber((n) => (n === 1 ? firstPageNumber : n));
  }, [tocData, firstPageNumber]);

  const page = useQuery<{ page: WorkbookPage; notes: Note[]; submission: Submission | null }>({
    queryKey: ["workbook-page", slug, pageNumber],
    enabled: !!slug && !!tocData && tocData.pages.length > 0,
    queryFn: async () => {
      const res = await apiFetch(`/workbooks/${encodeURIComponent(slug)}/pages/${pageNumber}`);
      if (!res.ok) throw new Error("page");
      return res.json();
    },
  });

  const invalidatePage = () =>
    queryClient.invalidateQueries({ queryKey: ["workbook-page", slug, pageNumber] });

  const submitExercise = useMutation({
    mutationFn: async () => {
      const p = page.data!.page;
      const res = await apiFetch(`/workbook-pages/${p.id}/submission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          p.exerciseType === "video_link"
            ? { videoUrl: answer.trim() }
            : { content: answer.trim() },
        ),
      });
      if (!res.ok) throw new Error("submit");
      return res.json();
    },
    onSuccess: () => {
      setAnswerTouched(false);
      void invalidatePage();
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/workbook-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: page.data!.page.id,
          quote: quote || undefined,
          content: draft.trim(),
        }),
      });
      if (!res.ok) throw new Error("save");
      return res.json();
    },
    onSuccess: async () => {
      setDraft("");
      setQuote("");
      await invalidatePage();
    },
  });

  const removeNote = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/workbook-notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete");
    },
    onSuccess: invalidatePage,
  });

  const pageNumbers = useMemo(() => tocData?.pages.map((p) => p.pageNumber) ?? [], [tocData]);
  const index = pageNumbers.indexOf(pageNumber);
  const prevNumber = index > 0 ? pageNumbers[index - 1] : null;
  const nextNumber = index >= 0 && index < pageNumbers.length - 1 ? pageNumbers[index + 1] : null;

  // Capture the reader's text selection so a note can quote it.
  function captureSelection() {
    const text = window.getSelection?.()?.toString().trim() ?? "";
    if (text) setQuote(text.slice(0, 2000));
  }

  const body = page.data?.page;
  const submission = page.data?.submission ?? null;
  const prose = (lang === "en" && body?.bodyEn ? body.bodyEn : body?.bodyAr ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const exercise = lang === "en" && body?.exerciseEn ? body.exerciseEn : body?.exerciseAr;

  // Seed the answer box with what this learner last sent for this page, so a
  // revision starts from their own words rather than a blank field. Keyed on
  // the page id so turning the page swaps the answer with it, and skipped once
  // they start typing so a background refetch cannot overwrite them mid-edit.
  useEffect(() => {
    if (answerTouched) return;
    setAnswer(submission?.videoUrl ?? submission?.content ?? "");
  }, [submission?.id, submission?.updatedAt, body?.id, answerTouched]);
  const section = lang === "en" && body?.sectionEn ? body.sectionEn : body?.sectionAr;
  const title = lang === "en" && body?.titleEn ? body.titleEn : body?.titleAr;

  return (
    <AppShell
      containerClassName="container mx-auto px-4 py-6 max-w-3xl"
      breadcrumb={[
        { label: isRtl ? "الكرّاسات" : "Workbooks", href: "/workbooks" },
        { label: tocData?.workbook.titleAr ?? (isRtl ? "قراءة" : "Read") },
      ]}
    >
      <div dir={dir} className="space-y-5" data-testid="workbook-reader">
        <button
          type="button"
          onClick={() => navigate("/dashboard?tab=workbooks")}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className={`h-4 w-4 ${isRtl ? "" : "rotate-180"}`} />
          {t.back}
        </button>

        {toc.isLoading ? (
          <LoadingState />
        ) : forbidden ? (
          <Card data-testid="workbook-locked">
            <CardContent className="p-8 space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
              <h1 className="text-xl font-bold">{t.notOwned}</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.notOwnedBody}</p>
              <Button className="rounded-full font-bold" onClick={() => navigate("/workbooks")}>
                {t.browse}
              </Button>
            </CardContent>
          </Card>
        ) : totalPages === 0 ? (
          <Card data-testid="workbook-empty">
            <CardContent className="p-8 space-y-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <h1 className="text-xl font-bold">{t.empty}</h1>
              <p className="text-sm text-muted-foreground">{t.emptyBody}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <h1 className="text-xl font-bold">{tocData?.workbook.titleAr}</h1>
              <span className="text-xs font-bold text-muted-foreground">
                {t.pageOf(pageNumber, totalPages)}
              </span>
            </div>

            {page.isLoading || !body ? (
              <LoadingState />
            ) : (
              <>
                <Card>
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    {section && (
                      <p className="text-xs font-bold text-primary">{section}</p>
                    )}
                    {title && (
                      <h2 className="font-serif text-xl font-bold leading-relaxed">{title}</h2>
                    )}
                    {!body.isPublished && (
                      <span className="inline-flex items-center rounded-full bg-warning-muted px-2.5 py-0.5 text-[11px] font-bold text-warning">
                        {t.draft}
                      </span>
                    )}
                    <div
                      className="space-y-4 font-serif text-[15px] leading-loose"
                      onMouseUp={captureSelection}
                      onTouchEnd={captureSelection}
                      data-testid="workbook-page-body"
                    >
                      {prose.map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                    {exercise && (
                      <div
                        className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3"
                        data-testid="workbook-exercise"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-bold text-primary">{t.exercise}</p>
                          {body!.skillPoints > 0 && (
                            <span className="text-[11px] font-semibold text-muted-foreground">
                              {t.worth(
                                body!.skillPoints,
                                // Which skills a pass can credit is the rubric's
                                // answer now, and a recording credits four of
                                // them at once. The page's own skill_key only
                                // stands in where there is no rubric.
                                (rubricFor(body!.exerciseType)
                                  ? rubricSkills(rubricFor(body!.exerciseType)!)
                                  : body!.skillKey
                                    ? [body!.skillKey]
                                    : []
                                )
                                  .map((k) => skillLabel(k, lang))
                                  .join(" · "),
                              )}
                            </span>
                          )}
                        </div>
                        <p className="font-serif text-[14px] leading-loose">{exercise}</p>

                        {body!.exerciseType !== "none" && (
                          <div className="space-y-2 pt-1">
                            {/* The standard, before the attempt — not only after
                                the verdict. Hidden once the page is passed, where
                                the marks themselves are the better answer. */}
                            {submission?.decision !== "pass" && (
                              <RubricBrief
                                exerciseType={body!.exerciseType}
                                pot={body!.skillPoints}
                                lang={lang}
                              />
                            )}
                            {/* The verdict, when there is one. Shown above the input so a
                                learner reading their trainer's note sees it before the box
                                they are about to type into again. */}
                            {submission && submission.status === "reviewed" && (
                              <div
                                className={`rounded-lg p-3 space-y-1 border ${
                                  submission.decision === "pass"
                                    ? "border-success/30 bg-success-muted"
                                    : "border-accent/40 bg-accent/10"
                                }`}
                                data-testid="workbook-exercise-verdict"
                              >
                                <p className="text-xs font-bold flex items-center gap-1.5">
                                  {submission.decision === "pass" ? (
                                    <>
                                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                                      {t.passed}
                                      {submission.awardedPoints > 0 && (
                                        <span className="text-success">
                                          {t.earned(submission.awardedPoints)}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    t.needsRevision
                                  )}
                                </p>
                                {submission.feedback && (
                                  <p className="text-[13px] leading-relaxed">
                                    <span className="font-semibold">{t.trainerFeedback}: </span>
                                    {submission.feedback}
                                  </p>
                                )}
                                {/* The criterion-by-criterion marks, with what the
                                    level above asks for. A learner told only
                                    "يحتاج تعديلاً" has to guess what to change. */}
                                {submission.rubricScores && (
                                  <div className="pt-1">
                                    <RubricResult
                                      data={submission}
                                      lang={lang}
                                      showNextLevel={submission.decision !== "pass"}
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {submission && submission.status === "submitted" && (
                              <p
                                className="text-xs font-semibold text-muted-foreground"
                                data-testid="workbook-exercise-awaiting"
                              >
                                {t.awaiting}
                              </p>
                            )}

                            {/* A passed exercise is finished. Offering the box again
                                would invite a learner to resubmit work that already
                                earned its points and put it back in the queue, where a
                                second verdict could take them away. Their answer stays
                                visible; only the way to undo it is gone. */}
                            {submission?.decision === "pass" ? (
                              <div
                                className="rounded-lg border border-border bg-card p-3"
                                data-testid="workbook-exercise-final"
                              >
                                <p className="text-[11px] font-semibold text-muted-foreground mb-1">
                                  {t.yourAnswer}
                                </p>
                                {submission.videoUrl ? (
                                  <a
                                    href={submission.videoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    dir="ltr"
                                    className="break-all text-sm font-medium text-primary hover:underline"
                                  >
                                    {submission.videoUrl}
                                  </a>
                                ) : (
                                  <p className="whitespace-pre-wrap font-serif text-[14px] leading-loose">
                                    {submission.content}
                                  </p>
                                )}
                              </div>
                            ) : body!.exerciseType === "video_link" ? (
                              <input
                                type="url"
                                dir="ltr"
                                value={answer}
                                onChange={(e) => {
                                  setAnswer(e.target.value);
                                  setAnswerTouched(true);
                                }}
                                placeholder={t.videoPlaceholder}
                                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                                data-testid="workbook-exercise-input"
                              />
                            ) : (
                              <textarea
                                value={answer}
                                onChange={(e) => {
                                  setAnswer(e.target.value);
                                  setAnswerTouched(true);
                                }}
                                rows={4}
                                placeholder={t.answerPlaceholder}
                                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm leading-relaxed outline-none focus:border-primary resize-y"
                                data-testid="workbook-exercise-input"
                              />
                            )}

                            <div
                              className={`items-center justify-between gap-2 ${
                                submission?.decision === "pass" ? "hidden" : "flex"
                              }`}
                            >
                              <p className="text-[11px] text-muted-foreground">{t.notPrivate}</p>
                              <Button
                                size="sm"
                                className="rounded-lg font-bold"
                                disabled={!answer.trim() || submitExercise.isPending || !answerTouched}
                                onClick={() => submitExercise.mutate()}
                                data-testid="workbook-exercise-submit"
                              >
                                {submitExercise.isPending
                                  ? t.submitting
                                  : submission
                                    ? t.resubmit
                                    : t.submit}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="min-h-11 flex-1 rounded-xl font-bold"
                    disabled={prevNumber === null}
                    onClick={() => prevNumber !== null && setPageNumber(prevNumber)}
                    data-testid="workbook-prev"
                  >
                    {t.prev}
                  </Button>
                  <Button
                    className="min-h-11 flex-1 rounded-xl font-bold"
                    disabled={nextNumber === null}
                    onClick={() => nextNumber !== null && setPageNumber(nextNumber)}
                    data-testid="workbook-next"
                  >
                    {t.next}
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <NotebookPen className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold">{t.yourNote}</h3>
                    </div>

                    {quote ? (
                      <div className="rounded-xl border border-accent/40 bg-accent/10 p-3 space-y-1.5">
                        <p className="text-[11px] font-bold text-muted-foreground">{t.quoted}</p>
                        <p className="text-xs leading-relaxed line-clamp-3">{quote}</p>
                        <button
                          type="button"
                          onClick={() => setQuote("")}
                          className="text-[11px] font-bold text-muted-foreground hover:text-foreground"
                        >
                          {t.clearQuote}
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">{t.selectHint}</p>
                    )}

                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={t.placeholder}
                      rows={3}
                      maxLength={4000}
                      className="w-full rounded-xl border border-border bg-background p-3 text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      data-testid="workbook-note-input"
                    />

                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        {t.private}
                      </span>
                      <Button
                        className="min-h-10 rounded-full font-bold"
                        disabled={!draft.trim() || addNote.isPending}
                        onClick={() => addNote.mutate()}
                        data-testid="workbook-note-save"
                      >
                        {addNote.isPending ? t.saving : t.save}
                      </Button>
                    </div>

                    <div className="space-y-2 pt-1">
                      {(page.data?.notes ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">{t.noNotes}</p>
                      ) : (
                        (page.data?.notes ?? []).map((note) => (
                          <div
                            key={note.id}
                            className="rounded-xl border border-border bg-card p-3 space-y-1.5"
                            data-testid="workbook-note"
                          >
                            {note.quote && (
                              <p className="border-s-2 border-accent/60 ps-2 text-[11px] leading-relaxed text-muted-foreground">
                                {note.quote}
                              </p>
                            )}
                            <p className="text-sm leading-relaxed">{note.content}</p>
                            <button
                              type="button"
                              onClick={() => removeNote.mutate(note.id)}
                              className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                              {t.delete}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
