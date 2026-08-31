import { RUBRICS, rubricFor, skillLabel, type Rubric, type RubricKey } from "@workspace/assessment";

export type RubricResultData = {
  rubricKey?: string | null;
  rubricVersion?: number | null;
  rubricScores?: Record<string, number> | null;
  rubricNotes?: Record<string, string> | null;
  rubricPercent?: number | null;
  awardedBreakdown?: Record<string, number> | null;
};

/** Level 1 reads as a problem, 4 as an achievement, and the two middles differ. */
const LEVEL_STYLE: Record<number, string> = {
  1: "bg-destructive/10 text-destructive",
  2: "bg-warning-muted text-warning",
  3: "bg-info-muted text-info",
  4: "bg-success-muted text-success",
};

function resolveRubric(key: string | null | undefined): Rubric | null {
  if (!key) return null;
  return RUBRICS[key as RubricKey] ?? rubricFor(key);
}

/**
 * A finished rubric, read back.
 *
 * The descriptor of the level awarded is shown, not just the level's name.
 * "متمكّن" tells a learner nothing they can act on; "كل جملة تُسلّم للتي بعدها"
 * tells them what earned it, and reading the level above tells them what the
 * next one asks for — which is the only reason to hand a learner a rubric at
 * all rather than a score.
 */
export function RubricResult({
  data,
  lang,
  showNextLevel = false,
}: {
  data: RubricResultData;
  lang: "ar" | "en";
  /** Show what the level above asks for, on criteria not already at the top. */
  showNextLevel?: boolean;
}) {
  const rubric = resolveRubric(data.rubricKey);
  const marks = data.rubricScores;
  if (!rubric || !marks) return null;

  const isRtl = lang === "ar";
  const notes = data.rubricNotes ?? {};
  const breakdown = data.awardedBreakdown ?? {};
  const percent = data.rubricPercent;

  return (
    <div className="space-y-3" data-testid="rubric-result">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-muted-foreground">
          {isRtl ? rubric.titleAr : rubric.titleEn}
        </p>
        {typeof percent === "number" && (
          <span
            className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold"
            data-testid="rubric-percent"
          >
            {percent}%
          </span>
        )}
      </div>

      <ul className="space-y-2">
        {rubric.criteria.map((c) => {
          const level = marks[c.key];
          const cell = c.levels.find((l) => l.value === level);
          if (!cell) return null;
          const next = c.levels.find((l) => l.value === level + 1);
          return (
            <li
              key={c.key}
              className="rounded-xl border border-border p-3"
              data-testid="rubric-result-criterion"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-bold">{isRtl ? c.titleAr : c.titleEn}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${LEVEL_STYLE[level] ?? "bg-muted"}`}
                >
                  {isRtl ? cell.labelAr : cell.labelEn} · {level}/4
                </span>
                {c.skillKey && breakdown[c.skillKey] !== undefined && (
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {skillLabel(c.skillKey, lang)}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-foreground/75">
                {isRtl ? cell.descriptorAr : cell.descriptorEn}
              </p>
              {showNextLevel && next && (
                <p className="mt-1.5 border-t border-border pt-1.5 text-[12px] leading-relaxed text-info">
                  <span className="font-bold">{isRtl ? "للمستوى الأعلى: " : "For the next level: "}</span>
                  {isRtl ? next.descriptorAr : next.descriptorEn}
                </p>
              )}
              {notes[c.key] && (
                <p className="mt-1.5 rounded-lg bg-muted/60 p-2 text-[12px] leading-relaxed">
                  {notes[c.key]}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {Object.keys(breakdown).length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" data-testid="rubric-breakdown">
          {Object.entries(breakdown).map(([key, points]) => (
            <span
              key={key}
              className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary"
            >
              {skillLabel(key, lang)} +{points}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
