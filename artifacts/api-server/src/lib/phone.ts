/**
 * Normalize a phone number to wa.me international format (digits only, no +).
 *
 * Handles all common Jordanian input styles:
 *   +962799123456  → 962799123456
 *   00962799123456 → 962799123456
 *   0962799123456  → 962799123456  (leading 0 before country code)
 *   0799123456     → 962799123456  (local format, assumes Jordan 962)
 *   962799123456   → 962799123456  (already correct)
 */
export function toWaPhone(raw: string): string {
  let s = (raw ?? "").replace(/[\s\-().]/g, "");
  if (s.startsWith("+")) s = s.slice(1);          // +962… → 962…
  else if (s.startsWith("00")) s = s.slice(2);    // 00962… → 962…
  if (s.startsWith("0962")) s = s.slice(1);       // 0962… → 962… (avoid double prefix)
  else if (s.startsWith("0")) s = "962" + s.slice(1); // 07… → 962 7… (Jordan local)
  return s.replace(/[^0-9]/g, "");
}
