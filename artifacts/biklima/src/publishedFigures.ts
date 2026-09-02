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

/**
 * A figure that arrived as text, rendered in the reader's digits.
 *
 * The impact grid draws from two sources: the published claims above, which go
 * through formatFigure, and the live counts from /api/impact, which used to be
 * printed exactly as the server sent them. So the same tile could read "٨٠٠+"
 * one day and "142" the next — Arabic-Indic or Western digits decided by
 * nothing but which source happened to answer.
 *
 * Digits are localised and anything around them is left alone, so a suffix
 * ("+", "%") or a hand-written override from the admin screen survives intact.
 * An admin who types their own text is making an editorial choice and it is
 * not this function's place to renumber it.
 */
export function formatFigureText(raw: string, lang: "ar" | "en"): string {
  return raw.replace(/\d+/g, (digits) => formatFigure(Number(digits), lang));
}
