/**
 * The eight public-speaking skills a learner accumulates points in, and the
 * one place those points are written.
 *
 * Two features credit the same eight counters — lesson activities and, since
 * migration 0013, workbook page exercises. The UPSERT below lived privately
 * inside the activities route; it is here so a second copy never drifts from
 * the first.
 */
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

export const SKILL_KEYS = [
  "idea", "structure", "voice", "body", "improvisation",
  "impact", "confidence", "fear_management",
] as const;

export type SkillKey = (typeof SKILL_KEYS)[number];

export function isSkillKey(value: unknown): value is SkillKey {
  return typeof value === "string" && (SKILL_KEYS as readonly string[]).includes(value);
}

/**
 * Add `delta` to a learner's running total for one skill, creating the row on
 * first credit. Negative deltas are allowed and are what make a re-review
 * safe: a grader who downgrades a pass takes the points back rather than
 * leaving the learner credited for work that no longer qualifies.
 *
 * A total is never allowed below zero — points come from several features and
 * a correction in one should not eat what another awarded.
 */
export async function creditSkillPoints(userId: string, skillKey: string, delta: number): Promise<void> {
  if (!isSkillKey(skillKey) || delta === 0) return;
  await db.execute(sql`
    INSERT INTO student_skill_scores (user_id, skill_key, points)
    VALUES (${userId}, ${skillKey}, ${Math.max(0, delta)})
    ON CONFLICT (user_id, skill_key) DO UPDATE
      SET points = GREATEST(0, student_skill_scores.points + ${delta}),
          updated_at = NOW()
  `);
}
