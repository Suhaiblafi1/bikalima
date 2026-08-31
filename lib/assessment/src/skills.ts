/**
 * The eight public-speaking skills the platform scores, and their labels.
 *
 * Three places used to hold their own copy of this list — the activities
 * route, the API server's skill crediting, and the web app's labels. It lives
 * here now because the rubrics below hand points to these keys by name: a key
 * that exists in a rubric but not in the counters would award points nobody
 * can ever see.
 */
export const SKILL_KEYS = [
  "idea",
  "structure",
  "voice",
  "body",
  "improvisation",
  "impact",
  "confidence",
  "fear_management",
] as const;

export type SkillKey = (typeof SKILL_KEYS)[number];

export function isSkillKey(value: unknown): value is SkillKey {
  return typeof value === "string" && (SKILL_KEYS as readonly string[]).includes(value);
}

export const SKILL_LABELS_AR: Record<SkillKey, string> = {
  idea: "الفكرة",
  structure: "البناء",
  voice: "الصوت",
  body: "لغة الجسد",
  improvisation: "الارتجال",
  impact: "التأثير",
  confidence: "الثقة",
  fear_management: "إدارة الخوف",
};

export const SKILL_LABELS_EN: Record<SkillKey, string> = {
  idea: "Idea",
  structure: "Structure",
  voice: "Voice",
  body: "Body language",
  improvisation: "Improvisation",
  impact: "Impact",
  confidence: "Confidence",
  fear_management: "Managing fear",
};

export function skillLabel(key: string | null | undefined, lang: "ar" | "en"): string {
  if (!key) return "";
  const table = lang === "en" ? SKILL_LABELS_EN : SKILL_LABELS_AR;
  return (table as Record<string, string>)[key] ?? key;
}
