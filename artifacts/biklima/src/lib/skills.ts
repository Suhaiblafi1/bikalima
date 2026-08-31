/**
 * Display names for the eight public-speaking skills the platform scores.
 * Shared so the reader and the skills tab cannot drift apart on wording.
 */
export const SKILL_LABELS_AR: Record<string, string> = {
  idea: "الفكرة", structure: "البناء", voice: "الصوت", body: "لغة الجسد",
  improvisation: "الارتجال", impact: "التأثير", confidence: "الثقة", fear_management: "إدارة الخوف",
};

export const SKILL_LABELS_EN: Record<string, string> = {
  idea: "Idea", structure: "Structure", voice: "Voice", body: "Body language",
  improvisation: "Improvisation", impact: "Impact", confidence: "Confidence",
  fear_management: "Managing fear",
};

export function skillLabel(key: string | null, lang: "ar" | "en"): string {
  if (!key) return "";
  return (lang === "en" ? SKILL_LABELS_EN : SKILL_LABELS_AR)[key] ?? key;
}
