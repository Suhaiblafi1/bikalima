import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-fetch";
import { skillLabel } from "@/lib/skills";

type QueueRow = {
  id: string;
  content: string | null;
  videoUrl: string | null;
  status: "submitted" | "reviewed";
  decision: "pass" | "needs_revision" | null;
  feedback: string | null;
  awardedPoints: number;
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
 */
export function TrainerWorkbookQueue({ onReviewed }: { onReviewed?: () => void }) {
  const [tab, setTab] = useState<"submitted" | "reviewed">("submitted");
  const [rows, setRows] = useState<QueueRow[] | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<Record<string, string>>({});
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

  const review = async (row: QueueRow, decision: "pass" | "needs_revision") => {
    setBusyId(row.id);
    setError("");
    try {
      const res = await apiFetch(`/instructor/workbook-submissions/${row.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, feedback: feedback[row.id]?.trim() || undefined }),
      });
      if (!res.ok) throw new Error("review");
      setFeedback((f) => ({ ...f, [row.id]: "" }));
      await load();
      onReviewed?.();
    } catch {
      setError("تعذّر حفظ التقييم.");
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
          {tab === "submitted"
            ? "لا تسليمات بانتظار التصحيح."
            : "لم تُصحَّح تسليمات بعد."}
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.id} data-testid="workbook-queue-item">
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{studentName(row)}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.workbookTitleAr} · صفحة {row.pageNumber}
                      {row.pageTitleAr ? ` · ${row.pageTitleAr}` : ""}
                    </p>
                  </div>
                  {row.skillKey && row.skillPoints > 0 && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                      {row.skillPoints} نقطة · {skillLabel(row.skillKey, "ar")}
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

                {row.status === "reviewed" ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-bold ${
                        row.decision === "pass"
                          ? "bg-green-600/10 text-green-700"
                          : "bg-accent/15 text-accent-foreground"
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
                      disabled={busyId === row.id}
                      onClick={() => review(row, row.decision === "pass" ? "needs_revision" : "pass")}
                      data-testid="workbook-queue-change"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      تغيير الحكم
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={feedback[row.id] ?? ""}
                      onChange={(e) => setFeedback((f) => ({ ...f, [row.id]: e.target.value }))}
                      placeholder="ملاحظتك للطالب (اختيارية)…"
                      className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                      data-testid="workbook-queue-feedback"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="rounded-lg font-bold"
                        disabled={busyId === row.id}
                        onClick={() => review(row, "pass")}
                        data-testid="workbook-queue-pass"
                      >
                        {busyId === row.id ? "…" : "اجتاز"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg font-bold"
                        disabled={busyId === row.id}
                        onClick={() => review(row, "needs_revision")}
                        data-testid="workbook-queue-revise"
                      >
                        يحتاج تعديلاً
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
