/**
 * Writing to the eight public-speaking skill counters.
 *
 * The key list, the labels and the rubrics that decide where points go all
 * live in @workspace/assessment, shared with the web app so a criterion can
 * never credit a skill the counters do not have. What stays here is the one
 * thing that needs a database: the write itself.
 */
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { isSkillKey } from "@workspace/assessment";

/**
 * Anything that can run SQL: the pool, or a transaction inside it. A review
 * now settles several counters at once, so it needs to hand this one function
 * a transaction and have all of them land or none.
 */
type Executor = Pick<typeof db, "execute">;

export { SKILL_KEYS, isSkillKey } from "@workspace/assessment";
export type { SkillKey } from "@workspace/assessment";

/**
 * Add `delta` to a learner's running total for one skill, creating the row on
 * first credit. Negative deltas are allowed and are what make a re-review
 * safe: a grader who downgrades a pass takes the points back rather than
 * leaving the learner credited for work that no longer qualifies.
 *
 * A total is never allowed below zero — points come from several features and
 * a correction in one should not eat what another awarded.
 */
export async function creditSkillPoints(
  userId: string,
  skillKey: string,
  delta: number,
  executor: Executor = db,
): Promise<void> {
  if (!isSkillKey(skillKey) || delta === 0) return;
  await executor.execute(sql`
    INSERT INTO student_skill_scores (user_id, skill_key, points)
    VALUES (${userId}, ${skillKey}, ${Math.max(0, delta)})
    ON CONFLICT (user_id, skill_key) DO UPDATE
      SET points = GREATEST(0, student_skill_scores.points + ${delta}),
          updated_at = NOW()
  `);
}
