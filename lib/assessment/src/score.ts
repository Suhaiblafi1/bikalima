import type { Rubric, RubricLevelValue } from "./rubrics";
import type { SkillKey } from "./skills";

/** A grader's level for each criterion, keyed by criterion key. */
export type RubricMarks = Readonly<Record<string, number>>;

export type RubricScore = {
  /** Every criterion carries a valid level — the only state worth a pass. */
  readonly complete: boolean;
  /** Criteria the grader left unmarked. */
  readonly missing: readonly string[];
  /** Keys sent that this rubric does not define — a stale client or a typo. */
  readonly unexpected: readonly string[];
  /** Criteria marked with something that is not a level 1–4. */
  readonly invalid: readonly string[];
  readonly earnedUnits: number;
  readonly maxUnits: number;
  /** Share of the available marks, 0–100, rounded. */
  readonly percent: number;
  /** True when any criterion sits at the bottom level. */
  readonly hasFloorLevel: boolean;
  /**
   * What the rubric alone would decide. Advisory: the trainer records the
   * verdict, and a rubric that could overrule them would be a rubric nobody
   * fills in honestly.
   */
  readonly suggestedDecision: "pass" | "needs_revision";
};

function isLevel(value: unknown): value is RubricLevelValue {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

/**
 * Read a set of marks against a rubric.
 *
 * Units, not percentages, are the primitive: a criterion at level L earns
 * `weight × (L − 1)` of a possible `weight × 3`, so the bottom level earns
 * nothing and the top earns everything. Every criterion counts towards the
 * total, including one that pays into no skill — ignoring the brief has to
 * cost marks even though "following the brief" is not a skill.
 */
export function scoreRubric(rubric: Rubric, marks: RubricMarks): RubricScore {
  const missing: string[] = [];
  const invalid: string[] = [];
  const defined = new Set(rubric.criteria.map((c) => c.key));
  const unexpected = Object.keys(marks).filter((k) => !defined.has(k));

  let earnedUnits = 0;
  let maxUnits = 0;
  let hasFloorLevel = false;

  for (const c of rubric.criteria) {
    maxUnits += c.weight * 3;
    const mark = marks[c.key];
    if (mark === undefined || mark === null) {
      missing.push(c.key);
      continue;
    }
    if (!isLevel(mark)) {
      invalid.push(c.key);
      continue;
    }
    if (mark === 1) hasFloorLevel = true;
    earnedUnits += c.weight * (mark - 1);
  }

  const complete = missing.length === 0 && invalid.length === 0 && unexpected.length === 0;
  const percent = maxUnits === 0 ? 0 : Math.round((earnedUnits / maxUnits) * 100);

  // A single criterion at the bottom level blocks the suggestion however high
  // the total climbs. A speech delivered beautifully that says nothing has not
  // passed, and an average is exactly the arithmetic that would say it had.
  const suggestedDecision =
    complete && !hasFloorLevel && earnedUnits >= rubric.passThreshold * maxUnits
      ? "pass"
      : "needs_revision";

  return {
    complete,
    missing,
    unexpected,
    invalid,
    earnedUnits,
    maxUnits,
    percent,
    hasFloorLevel,
    suggestedDecision,
  };
}

/**
 * Split a page's skill points across the skills its rubric actually measured.
 *
 * Two properties this has to hold, because a learner's skill map is built out
 * of it:
 *
 *  - Full marks on every criterion award exactly the page's `skillPoints`,
 *    never one more or one less. That is why the shares are settled by
 *    largest remainder rather than by rounding each share on its own:
 *    four criteria splitting 20 points by naive rounding come to 21.
 *  - A criterion that pays into no skill still counts against the total. Half
 *    the marks earns half the pot even when every mark lost was on the brief.
 *
 * When nothing was earned on any skill-bearing criterion the result is empty
 * rather than a pot spread over skills the work did not demonstrate.
 */
export function distributeSkillPoints(
  rubric: Rubric,
  marks: RubricMarks,
  pot: number,
): Record<string, number> {
  if (!Number.isFinite(pot) || pot <= 0) return {};
  const score = scoreRubric(rubric, marks);
  if (!score.complete || score.maxUnits === 0 || score.earnedUnits === 0) return {};

  const shares = rubric.criteria
    .filter((c): c is typeof c & { skillKey: SkillKey } => c.skillKey !== null)
    .map((c) => ({ skillKey: c.skillKey, units: c.weight * ((marks[c.key] as number) - 1) }));

  const skillUnits = shares.reduce((sum, s) => sum + s.units, 0);
  if (skillUnits === 0) return {};

  const total = Math.min(pot, Math.round((pot * score.earnedUnits) / score.maxUnits));

  // Largest remainder: floor every share, then hand the leftover points to the
  // shares with the biggest fractional part, criterion order breaking ties.
  const exact = shares.map((s, index) => {
    const value = (total * s.units) / skillUnits;
    const base = Math.floor(value);
    return { ...s, base, fraction: value - base, index };
  });
  let leftover = total - exact.reduce((sum, s) => sum + s.base, 0);
  const byRemainder = [...exact].sort(
    (a, b) => b.fraction - a.fraction || a.index - b.index,
  );
  for (const share of byRemainder) {
    if (leftover <= 0) break;
    share.base += 1;
    leftover -= 1;
  }

  const out: Record<string, number> = {};
  for (const share of exact) {
    if (share.base > 0) out[share.skillKey] = (out[share.skillKey] ?? 0) + share.base;
  }
  return out;
}

/**
 * What one review has to add to (or take back from) each skill counter.
 *
 * A trainer may review the same submission more than once, so the settlement
 * is a difference and not an addition: passing twice must not pay twice, and
 * downgrading a pass must take back exactly what that pass granted — per
 * skill, since a pass now touches several.
 */
export function settleSkillPoints(
  previous: Readonly<Record<string, number>>,
  next: Readonly<Record<string, number>>,
): Record<string, number> {
  const deltas: Record<string, number> = {};
  for (const key of new Set([...Object.keys(previous), ...Object.keys(next)])) {
    const delta = (next[key] ?? 0) - (previous[key] ?? 0);
    if (delta !== 0) deltas[key] = delta;
  }
  return deltas;
}
