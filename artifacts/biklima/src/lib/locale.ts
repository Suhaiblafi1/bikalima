/**
 * One locale tag per language, for every date and number the UI renders.
 *
 * Four tags were in use — "ar", "ar-EG", "ar-JO", "ar-SA" — scattered across
 * the admin screens, and they are not interchangeable. Measured in Chromium:
 *
 *   ar      numberingSystem=latn   15‏/3‏/2026    1,234
 *   ar-EG   numberingSystem=arab   ١٥‏/٣‏/٢٠٢٦    ١٬٢٣٤
 *   ar-JO   numberingSystem=arab   ١٥‏/٣‏/٢٠٢٦    ١٬٢٣٤
 *   ar-SA   numberingSystem=arab   ١٥‏/٣‏/٢٠٢٦    ١٬٢٣٤
 *
 * So the bare tag renders Western digits and the qualified ones render
 * Arabic-Indic: two admin pages could show the same timestamp in different
 * digits with no reason behind the difference. (All four resolve to the
 * Gregorian calendar in Chromium, checked — ar-SA does not silently switch
 * these screens to Hijri, which would have been a far worse problem than
 * digit shapes.)
 *
 * ar-JO because the institution is Jordanian; it is identical in output to
 * ar-EG and ar-SA, so nothing about the rendering changes except that the
 * choice is now made once.
 */
export const AR_LOCALE = "ar-JO";
export const EN_LOCALE = "en-GB";

export function localeFor(lang: string): string {
  return lang === "ar" ? AR_LOCALE : EN_LOCALE;
}

/** A date, in the reader's language. Empty string for anything unparseable. */
export function formatDate(
  value: string | number | Date | null | undefined,
  lang: string = "ar",
  options: Intl.DateTimeFormatOptions = {},
): string {
  if (value == null || value === "") return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(localeFor(lang), options);
}

/** A date and time, in the reader's language. */
export function formatDateTime(
  value: string | number | Date | null | undefined,
  lang: string = "ar",
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" },
): string {
  if (value == null || value === "") return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(localeFor(lang), options);
}
