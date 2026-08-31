import {
  distributeSkillPoints,
  scoreRubric,
  skillLabel,
  type Rubric,
  type RubricMarks,
} from "@workspace/assessment";

const LEVEL_STYLE: Record<number, { on: string; off: string }> = {
  1: { on: "bg-destructive text-white border-destructive", off: "hover:border-destructive/50" },
  2: { on: "bg-warning text-warning-foreground border-warning", off: "hover:border-warning/50" },
  3: { on: "bg-info text-info-foreground border-info", off: "hover:border-info/50" },
  4: { on: "bg-success text-success-foreground border-success", off: "hover:border-success/50" },
};

/**
 * The grading grid: one row per criterion, four descriptors to choose between.
 *
 * The descriptors are the control itself rather than a tooltip on it, because a
 * rubric a grader can use without reading is a rubric that changes nothing —
 * they would press the middle button and the numbers would go back to meaning
 * one person's impression. It is longer to read on purpose.
 *
 * The running total shows what a pass would pay into each skill before the
 * grader commits, so the consequence of a mark is visible while it is still
 * being made.
 */
export function RubricGrader({
  rubric,
  marks,
  notes,
  pot,
  onMark,
  onNote,
  disabled = false,
}: {
  rubric: Rubric;
  marks: RubricMarks;
  notes: Readonly<Record<string, string>>;
  /** The page's skill_points — the size of the pot a full pass would pay. */
  pot: number;
  onMark: (criterionKey: string, level: number) => void;
  onNote: (criterionKey: string, note: string) => void;
  disabled?: boolean;
}) {
  const score = scoreRubric(rubric, marks);
  const preview = score.complete ? distributeSkillPoints(rubric, marks, pot) : {};

  return (
    <div className="space-y-3" data-testid="rubric-grader">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold">{rubric.titleAr}</p>
        <span className="text-[11px] text-muted-foreground">
          النسخة {rubric.version} · {score.complete ? `${score.percent}%` : `بقي ${score.missing.length} معيار`}
        </span>
      </div>

      {rubric.criteria.map((c) => {
        const chosen = marks[c.key];
        return (
          <fieldset
            key={c.key}
            className="rounded-xl border border-border p-3"
            data-testid={`rubric-criterion-${c.key}`}
          >
            <legend className="flex items-center gap-2 px-1 text-[13px] font-bold">
              {c.titleAr}
              <span className="text-[10px] font-semibold text-muted-foreground">
                {c.skillKey ? `${skillLabel(c.skillKey, "ar")} · وزن ${c.weight}` : `لا نقاط مهارة · وزن ${c.weight}`}
              </span>
            </legend>
            <div className="mt-1 space-y-1.5">
              {c.levels.map((level) => {
                const on = chosen === level.value;
                const style = LEVEL_STYLE[level.value];
                return (
                  <label
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-1 ${
                      on ? "border-primary bg-primary/5" : `border-border ${style.off}`
                    } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                    key={level.value}
                    data-testid={`rubric-level-${c.key}-${level.value}`}
                  >
                    <input
                      type="radio"
                      name={`${rubric.key}-${c.key}`}
                      className="sr-only"
                      checked={on}
                      disabled={disabled}
                      onChange={() => onMark(c.key, level.value)}
                    />
                    <span
                      className={`mt-px shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
                        on ? style.on : "border-border text-muted-foreground"
                      }`}
                    >
                      {level.value} · {level.labelAr}
                    </span>
                    <span className="text-[12px] leading-relaxed text-foreground/80">
                      {level.descriptorAr}
                    </span>
                  </label>
                );
              })}
            </div>
            <input
              type="text"
              value={notes[c.key] ?? ""}
              disabled={disabled}
              onChange={(e) => onNote(c.key, e.target.value)}
              placeholder={`ملاحظتك على ${c.titleAr} (اختيارية)…`}
              className="mt-2 w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12px] outline-none focus:border-primary"
              data-testid={`rubric-note-${c.key}`}
            />
          </fieldset>
        );
      })}

      <div
        className={`rounded-xl p-3 text-[12px] leading-relaxed ${
          score.complete
            ? score.suggestedDecision === "pass"
              ? "bg-success-muted text-success"
              : "bg-warning-muted text-warning"
            : "bg-muted text-muted-foreground"
        }`}
        data-testid="rubric-summary"
        aria-live="polite"
      >
        {!score.complete ? (
          <>قيّم كل المعايير ليُحتسب المجموع ويُعتمد الاجتياز.</>
        ) : (
          <>
            <span className="font-bold">
              {score.percent}% — سلّم التقييم يرشّح: {score.suggestedDecision === "pass" ? "اجتاز" : "يحتاج تعديلاً"}
            </span>
            {score.hasFloorLevel && (
              <>
                {" "}
                <span data-testid="rubric-floor-warning">
                  (معيار واحد على الأقلّ في المستوى الأوّل — لا يُرشَّح الاجتياز مهما ارتفع المجموع.)
                </span>
              </>
            )}
            {Object.keys(preview).length > 0 && (
              <span className="mt-1.5 flex flex-wrap gap-1.5" data-testid="rubric-preview">
                {Object.entries(preview).map(([key, points]) => (
                  <span
                    key={key}
                    className="rounded-full bg-card/70 px-2 py-0.5 text-[11px] font-bold"
                  >
                    {skillLabel(key, "ar")} +{points}
                  </span>
                ))}
                <span className="px-1 text-[11px] opacity-80">من أصل {pot}</span>
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
