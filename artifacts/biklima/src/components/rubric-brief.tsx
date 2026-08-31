import { rubricFor, skillLabel } from "@workspace/assessment";

/**
 * The rubric, shown to the learner before they answer.
 *
 * The largest thing a rubric buys is not consistency between graders — it is
 * that the person being graded knows what they are being graded on. Holding it
 * back until after the verdict spends the cost of writing one and keeps almost
 * none of the benefit, so the criteria and what full marks look like are on the
 * page next to the box they type into.
 *
 * Collapsed by default: it is reference material, not the instruction.
 */
export function RubricBrief({
  exerciseType,
  pot,
  lang,
}: {
  exerciseType: string;
  pot: number;
  lang: "ar" | "en";
}) {
  const rubric = rubricFor(exerciseType);
  if (!rubric) return null;
  const isRtl = lang === "ar";

  return (
    <details className="rounded-lg border border-border bg-card/60 px-3 py-2" data-testid="rubric-brief">
      <summary className="cursor-pointer text-xs font-bold text-primary">
        {isRtl ? "على ماذا سأُقيَّم؟" : "What am I graded on?"}
      </summary>
      <div className="mt-2 space-y-2">
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          {isRtl
            ? `يُقيَّم عملك على ${rubric.criteria.length} معايير، كلٌّ منها على أربعة مستويات. النقاط جزئية: تنال منها بمقدار ما تحقّق، لا كل شيء أو لا شيء.`
            : `Your work is marked against ${rubric.criteria.length} criteria, each on four levels. Marks are partial — you earn what you demonstrated, not all or nothing.`}
        </p>
        <ul className="space-y-1.5">
          {rubric.criteria.map((c) => {
            const top = c.levels[c.levels.length - 1];
            return (
              <li key={c.key} className="rounded-lg bg-muted/50 p-2">
                <span className="text-[12px] font-bold">{isRtl ? c.titleAr : c.titleEn}</span>
                {c.skillKey && (
                  <span className="ms-1.5 text-[10px] font-semibold text-muted-foreground">
                    {skillLabel(c.skillKey, lang)}
                  </span>
                )}
                <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/70">
                  <span className="font-semibold">{isRtl ? "أعلى مستوى: " : "Top level: "}</span>
                  {isRtl ? top.descriptorAr : top.descriptorEn}
                </p>
              </li>
            );
          })}
        </ul>
        {pot > 0 && (
          <p className="text-[11px] text-muted-foreground">
            {isRtl
              ? `الدرجة الكاملة على هذه الصفحة ${pot} نقطة، تُوزَّع على المهارات التي يقيسها كل معيار.`
              : `Full marks on this page are ${pot} points, split across the skills each criterion measures.`}
          </p>
        )}
      </div>
    </details>
  );
}
