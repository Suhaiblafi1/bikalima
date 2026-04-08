/**
 * Normalize a phone number to wa.me international format (digits only, no +).
 * Handles Jordanian input styles:
 *   +962799123456  → 962799123456
 *   00962799123456 → 962799123456
 *   0799123456     → 962799123456  (local format, assumes Jordan 962)
 */
export function toWaPhone(raw) {
  let s = (raw ?? "").replace(/[\s\-().]/g, "");
  if (s.startsWith("+")) s = s.slice(1);
  else if (s.startsWith("00")) s = s.slice(2);
  if (s.startsWith("0962")) s = s.slice(1);
  else if (s.startsWith("0")) s = "962" + s.slice(1);
  return s.replace(/[^0-9]/g, "");
}
