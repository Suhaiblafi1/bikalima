/**
 * The figures Bikalima publishes about itself.
 *
 * These were in two places and disagreed: the home page trust strip said
 * "أكثر من ٨٠٠ متدرب" while the stats section counted up to 850. Same claim,
 * two numbers, both live on the same page.
 *
 * It is settled at 800 — the lower of the two, because that is the figure both
 * sources support: a business with 850 trainees has 800, while one with 800
 * does not have 850. Overstating is the direction with a cost. If 850 is the
 * real number, this constant is the only place to change it now.
 *
 * These are claims, not measurements. The live counts come from /api/impact
 * and take over on the impact page the moment any of them is real.
 */
export const PUBLISHED_FIGURES = [
  { key: "trainees", value: 800, suffix: "+" },
  { key: "countries", value: 7, suffix: "" },
  { key: "programs", value: 4, suffix: "" },
  { key: "trainers", value: 32, suffix: "+" },
] as const;

export type PublishedFigureKey = (typeof PUBLISHED_FIGURES)[number]["key"];

/** Arabic-Indic digits for Arabic, Western for English. */
export function formatFigure(n: number, lang: "ar" | "en"): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US").format(n);
}
