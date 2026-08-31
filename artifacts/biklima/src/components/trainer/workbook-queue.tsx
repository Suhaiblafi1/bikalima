import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, RotateCcw, SlidersHorizontal } from "lucide-react";
import { rubricFor, scoreRubric, skillLabel, type RubricMarks } from "@workspace/assessment";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RubricResult } from "@/components/rubric-result";
import { RubricGrader } from "@/components/trainer/rubric-grader";
import { apiFetch } from "@/lib/api-fetch";

type QueueRow = {
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
  pageNumber: number;
  pageTitleAr: string | null;
  exerciseAr: string | null;
  exerciseType: "none" | "text" | "video_link";
  skillKey: string | null;
  skillPoints: number;
  workbookTitleAr: string | null;
  workbookSlug: string | null;
  studentEmail: string;
  studentFirst: string | null;
  studentLast: string | null;
};

type Draft = { marks: Record<string, number>; notes: Record<string, string>; feedback: string };

const EMPTY_DRAFT: Draft = { marks: {}, notes: {}, feedback: "" };

function studentName(row: QueueRow): string {
  const name = [row.studentFirst, row.studentLast].filter(Boolean).join(" ").trim();
  return name || row.studentEmail;
}

/**
 * The trainer's queue of workbook exercises awaiting a verdict.
 *
 * The server scopes this to workbooks linked to courses this trainer teaches,
 * so there is no filtering to do here — an empty list means there is genuinely
 * nothing of theirs waiting, not that something was hidden client-side.
 *
 * Only one submission's rubric is open at a time. Sixteen descriptors is what
 * it costs to grade against a standard, and rendering that for every row at
 * once would turn the queue into a wall nobody reads — which is the same
 * failure as having no rubric.
 */
export function TrainerWorkbookQueue({ onReviewed }: { onReviewed?: () => void }) {
  const [tab, setTab] = useState<"submitted" | "reviewed">("submitted");
  const [rows, setRows] = useState<QueueRow[] | null>(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await apiFetch(`/instructor/workbook-submissions?status=${tab}`);
      if (!res.ok) throw new Error("queue");
      const data = (await res.json()) as { submissions: QueueRow[] };
      setRows(data.submissions);
    } catch {
      setRows([]);
      setError("تعذّر تحميل تسليمات الكرّاسة.");
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  // Opening a row seeds the grid from whatever was recorded before, so a
  // trainer revisiting a verdict adjusts the marks rather than re-entering
  // four of them from scratch.
  const openRow = (row: QueueRow) => {
    setOpenId((current) => (current === row.id ? null : row.id));
    setDrafts((d) =>
      d[row.id]
        ? d
        : {
            ...d,
            [row.id]: {
              marks: { ...(row.rubricScores ?? {}) },
              notes: { ...(row.rubricNotes ?? {}) },
              feedback: row.feedback ?? "",
            },
          },
    );
  };

  const patchDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? EMPTY_DRAFT), ...patch } }));

  const review = async (row: QueueRow, decision: "pass" | "needs_revision") => {
    const rubric = rubricFor(row.exerciseType);
    const draft = drafts[row.id] ?? EMPTY_DRAFT;
    setBusyId(row.id);
    setError("");
    try {
      const res = await apiFetch(`/instructor/workbook-submissions/${row.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          feedback: draft.feedback.trim() || undefined,
          ...(rubric && Object.keys(draft.marks).length > 0
            ? { rubric: draft.marks, rubricVersion: rubric.version }
            : {}),
          ...(Object.keys(draft.notes).some((k) => draft.notes[k]?.trim())
            ? { rubricNotes: draft.notes }
            : {}),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "review");
      }
      setDrafts((d) => {
        const next = { ...d };
        delete next[row.id];
        return next;
      });
      setOpenId(null);
      await load();
      onReviewed?.();
    } catch (err) {
      setError(err instanceof Error && err.message !== "review" ? err.message : "تعذّر حفظ التقييم.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3" data-testid="trainer-workbook-queue">
      <div className="flex items-center gap-2">
        {(["submitted", "reviewed"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              tab === key
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:border-primary/40"
            }`}
            data-testid={`workbook-queue-tab-${key}`}
          >
            {key === "submitted" ? "بانتظار التصحيح" : "مُصحَّحة"}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {rows === null ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="workbook-queue-empty">
          {tab === "submitted" ? "لا تسليمات بانتظار التصحيح." : "لم تُصحَّح تسليمات بعد."}
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <QueueItem
              key={row.id}
              row={row}
              open={openId === row.id}
              draft={drafts[row.id] ?? EMPTY_DRAFT}
              busy={busyId === row.id}
              onToggle={() => openRow(row)}
              onMark={(k, level) =>
                patchDraft(row.id, {
                  marks: { ...(drafts[row.id]?.marks ?? {}), [k]: level },
                })
              }
              onNote={(k, note) =>
                patchDraft(row.id, {
                  notes: { ...(drafts[row.id]?.notes ?? {}), [k]: note },
                })
              }
              onFeedback={(feedback) => patchDraft(row.id, { feedback })}
              onReview={(decision) => void review(row, decision)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QueueItem({
  row,
  open,
  draft,
  busy,
  onToggle,
  onMark,
  onNote,
  onFeedback,
  onReview,
}: {
  row: QueueRow;
  open: boolean;
  draft: Draft;
  busy: boolean;
  onToggle: () => void;
  onMark: (criterionKey: string, level: number) => void;
  onNote: (criterionKey: string, note: string) => void;
  onFeedback: (feedback: string) => void;
  onReview: (decision: "pass" | "needs_revision") => void;
}) {
  const rubric = rubricFor(row.exerciseType);
  const marks = draft.marks as RubricMarks;
  const score = useMemo(() => (rubric ? scoreRubric(rubric, marks) : null), [rubric, marks]);
  // The server refuses a pass without a complete rubric, so the button that
  // would be refused is the button that is disabled — the trainer finds out
  // here rather than from an error after writing four notes.
  const canPass = !rubric || (score?.complete ?? false);

  return (
    <Card data-testid="workbook-queue-item">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold">{studentName(row)}</p>
            <p className="text-xs text-muted-foreground">
              {row.workbookTitleAr} · صفحة {row.pageNumber}
              {row.pageTitleAr ? ` · ${row.pageTitleAr}` : ""}
            </p>
          </div>
          {row.skillPoints > 0 && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
              {row.skillPoints} نقطة
              {rubric
                ? ` · ${rubric.criteria
                    .map((c) => c.skillKey)
                    .filter((k, i, a): k is NonNullable<typeof k> => !!k && a.indexOf(k) === i)
                    .map((k) => skillLabel(k, "ar"))
                    .join(" · ")}`
                : row.skillKey
                  ? ` · ${skillLabel(row.skillKey, "ar")}`
                  : ""}
            </span>
          )}
        </div>

        {row.exerciseAr && (
          <p className="rounded-lg bg-muted/50 p-2.5 text-xs leading-relaxed text-muted-foreground">
            {row.exerciseAr}
          </p>
        )}

        {row.exerciseType === "video_link" && row.videoUrl ? (
          <a
            href={row.videoUrl}
            target="_blank"
            rel="noreferrer"
            dir="ltr"
            className="inline-flex items-center gap-1.5 break-all text-sm font-medium text-primary hover:underline"
            data-testid="workbook-queue-video"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            {row.videoUrl}
          </a>
        ) : (
          <p
            className="whitespace-pre-wrap rounded-lg border border-border p-3 font-serif text-[14px] leading-loose"
            data-testid="workbook-queue-answer"
          >
            {row.content}
          </p>
        )}

        {/* What was recorded last time, until the grid is opened over it. */}
        {row.status === "reviewed" && !open && row.rubricScores && (
          <RubricResult data={row} lang="ar" />
        )}

        {row.status === "reviewed" && !open ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-bold ${
                row.decision === "pass" ? "bg-success-muted text-success" : "bg-accent/15 text-accent-foreground"
              }`}
            >
              {row.decision === "pass" ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> اجتاز
                  {row.awardedPoints > 0 && <> · +{row.awardedPoints}</>}
                </>
              ) : (
                "يحتاج تعديلاً"
              )}
            </span>
            {row.feedback && <span className="text-muted-foreground">{row.feedback}</span>}
            <Button
              size="sm"
              variant="ghost"
              className="ms-auto gap-1.5 text-xs"
              disabled={busy}
              onClick={onToggle}
              data-testid="workbook-queue-change"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              تغيير التقييم
            </Button>
          </div>
        ) : !open ? (
          <Button
            size="sm"
            className="w-full gap-1.5 rounded-lg font-bold"
            onClick={onToggle}
            data-testid="workbook-queue-open"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            قيّم على سلّم المعايير
          </Button>
        ) : null}

        {open && (
          <div className="space-y-3 border-t border-border pt-3">
            {rubric && (
              <RubricGrader
                rubric={rubric}
                marks={marks}
                notes={draft.notes}
                pot={row.skillPoints}
                onMark={onMark}
                onNote={onNote}
                disabled={busy}
              />
            )}
            <textarea
              rows={2}
              value={draft.feedback}
              onChange={(e) => onFeedback(e.target.value)}
              placeholder="ملاحظة عامّة للطالب (اختيارية)…"
              className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              data-testid="workbook-queue-feedback"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                className="rounded-lg font-bold"
                disabled={busy || !canPass}
                title={canPass ? undefined : "قيّم كل المعايير أولاً"}
                onClick={() => onReview("pass")}
                data-testid="workbook-queue-pass"
              >
                {busy ? "…" : "اجتاز"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg font-bold"
                disabled={busy}
                onClick={() => onReview("needs_revision")}
                data-testid="workbook-queue-revise"
              >
                يحتاج تعديلاً
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="ms-auto text-xs"
                disabled={busy}
                onClick={onToggle}
              >
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
