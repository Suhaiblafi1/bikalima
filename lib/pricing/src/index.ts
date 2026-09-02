/**
 * Prices, currencies and the conversion between them — shared by the browser
 * that quotes a buyer and the server that charges them.
 *
 * This table used to live only in the web app, and it had to move here the
 * moment the server needed it. Every price in the database is stored in JOD,
 * but the configured Stripe account is US-registered and Stripe refuses JOD
 * from it outright ("Stripe accounts in US do not support jod"), so the charge
 * has to be converted. Converting on the server against a second copy of these
 * rates would mean a buyer could be quoted one number and charged another the
 * first time the two copies drifted — and money is precisely where a second
 * source of truth is unacceptable. One table, imported by both.
 *
 * The rates are hand-maintained, not live FX. That is a deliberate limitation
 * of the existing design and unchanged here: they are the numbers the site has
 * always shown, so quoting and charging stay consistent with each other even
 * when both are a little behind the market.
 */

export type CurrencyConfig = {
  code: string;
  symbol: string;
  name: string;
  nameEn: string;
  /** Multiplier from the stored JOD price. JOD itself is 1. */
  rate: number;
  /**
   * How many fractional digits the currency actually uses, not a display
   * preference. The Gulf dinars (JOD, KWD, BHD, OMR) and the Tunisian dinar
   * are 3-decimal currencies — 1 fils is 0.001 — while the rest are 2.
   * Rounding all of them to whole units silently threw away real money on any
   * amount that was not already round.
   */
  decimals: number;
};

export const CURRENCIES: Record<string, CurrencyConfig> = {
  DEFAULT: { code: "USD", symbol: "$",   name: "دولار أمريكي", nameEn: "USD $", rate: 1.41, decimals: 2 },
  JO:      { code: "JOD", symbol: "د.أ", name: "دينار أردني",  nameEn: "JOD د.أ", rate: 1, decimals: 3 },
  SA:      { code: "SAR", symbol: "ر.س", name: "ريال سعودي",  nameEn: "SAR ر.س", rate: 7.92, decimals: 2 },
  AE:      { code: "AED", symbol: "د.إ", name: "درهم إماراتي", nameEn: "AED د.إ", rate: 7.77, decimals: 2 },
  KW:      { code: "KWD", symbol: "د.ك", name: "دينار كويتي", nameEn: "KWD د.ك", rate: 0.69, decimals: 3 },
  QA:      { code: "QAR", symbol: "ر.ق", name: "ريال قطري",  nameEn: "QAR ر.ق", rate: 7.73, decimals: 2 },
  BH:      { code: "BHD", symbol: "د.ب", name: "دينار بحريني", nameEn: "BHD د.ب", rate: 0.80, decimals: 3 },
  OM:      { code: "OMR", symbol: "ر.ع", name: "ريال عُماني", nameEn: "OMR ر.ع", rate: 0.81, decimals: 3 },
  EG:      { code: "EGP", symbol: "ج.م", name: "جنيه مصري",  nameEn: "EGP ج.م", rate: 47.0, decimals: 2 },
  MA:      { code: "MAD", symbol: "د.م", name: "درهم مغربي",  nameEn: "MAD د.م", rate: 10.2, decimals: 2 },
  TN:      { code: "TND", symbol: "د.ت", name: "دينار تونسي", nameEn: "TND د.ت", rate: 4.5, decimals: 3 },
  DZ:      { code: "DZD", symbol: "د.ج", name: "دينار جزائري", nameEn: "DZD د.ج", rate: 190, decimals: 2 },
};

/** Jordanian dinar — the currency every price in the database is stored in. */
export const JOD = CURRENCIES.JO;
export const JOD_DECIMALS = JOD.decimals;

/** Look a currency up by its ISO code (case-insensitive), e.g. "usd" → USD. */
export function currencyByCode(code: string): CurrencyConfig | null {
  const wanted = code.trim().toUpperCase();
  for (const config of Object.values(CURRENCIES)) {
    if (config.code === wanted) return config;
  }
  return null;
}

/**
 * An amount rendered with its currency's real precision, and with trailing
 * zeros dropped so a round price stays "70" rather than "70.000".
 *
 * A discounted amount is where this matters: 15% off 70 JOD is 59.5, which
 * has to read as 59.500 د.أ, and a float artefact like 59.49999999999999 must
 * never reach a buyer at the moment they are deciding to pay.
 */
export function formatMoney(
  amount: number | null | undefined,
  decimals: number = JOD_DECIMALS,
): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  const fixed = amount.toFixed(decimals);
  return fixed.includes(".") ? fixed.replace(/\.?0+$/, "") : fixed;
}

/**
 * A JOD price converted into `target`, rounded to that currency's real
 * precision — the same arithmetic the price on the page went through, so the
 * quote and the charge agree to the last minor unit.
 */
export function convertFromJod(amountJod: number, target: CurrencyConfig): number {
  const raw = amountJod * target.rate;
  const factor = 10 ** target.decimals;
  return Math.round(raw * factor) / factor;
}

/**
 * The same amount in the smallest unit the payment processor wants.
 *
 * Stripe takes minor units, and how many there are depends on the currency:
 * JOD and the other 3-decimal dinars have 1000, USD and most others 100, and a
 * handful — yen, dinar-less African francs — have none at all. Getting this
 * wrong is not a rounding error, it is charging a buyer a thousand times too
 * much or a hundredth of the price.
 */
const ZERO_DECIMAL_CODES = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG",
  "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

export function toMinorUnits(amount: number, currencyCode: string): number {
  const code = currencyCode.trim().toUpperCase();
  if (ZERO_DECIMAL_CODES.has(code)) return Math.round(amount);
  const known = currencyByCode(code);
  const decimals = known ? known.decimals : 2;
  return Math.round(amount * 10 ** decimals);
}
