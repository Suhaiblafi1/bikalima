/**
 * Display names for the eight public-speaking skills the platform scores.
 *
 * Re-exported from @workspace/assessment, which the API server reads too: the
 * rubric criteria name these keys, so a label the server does not know about
 * would be a skill the grader can award and no screen can explain.
 */
export {
  SKILL_KEYS,
  SKILL_LABELS_AR,
  SKILL_LABELS_EN,
  isSkillKey,
  skillLabel,
} from "@workspace/assessment";
export type { SkillKey } from "@workspace/assessment";
