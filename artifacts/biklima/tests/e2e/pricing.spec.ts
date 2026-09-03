import { expect, test } from "@playwright/test";
import {
  CURRENCIES,
  convertFromJod,
  currencyByCode,
  formatMoney,
  toMinorUnits,
} from "@workspace/pricing";

/**
 * The arithmetic between a quoted price and a charged card.
 *
 * Every price is stored in JOD and the Stripe account in use cannot accept
 * JOD, so the charge is converted before it is sent. Two numbers have to agree
 * exactly: the one the buyer reads on the page, and the one the processor is
 * asked for. They come from the same functions now — these tests are what keep
 * them that way, because the failure mode is silent and expensive. A buyer
 * quoted 70 د.أ and charged $987.00 would find out from their statement.
 *
 * No browser here. The suite has no separate unit runner, and this is pure
 * arithmetic worth testing directly rather than through a page.
 */

test("a JOD price converts to the number the page shows", () => {
  const usd = CURRENCIES.DEFAULT;
  expect(usd.code).toBe("USD");
  // 70 × 1.42 = 99.4, shown and charged as a whole 99. A converted price is
  // an approximation — the rates are hand-maintained — so the fraction was
  // false precision.
  expect(convertFromJod(70, usd)).toBe(99);
  expect(formatMoney(convertFromJod(70, usd), usd.decimals)).toBe("99");
});

test("minor units follow the currency, not a fixed factor", () => {
  // Two decimals: dollars and most of the world.
  expect(toMinorUnits(99, "USD")).toBe(9900);
  // Three: the dinar is 1000 fils, and treating it as 100 would charge a buyer
  // a tenth of the price.
  expect(toMinorUnits(70, "JOD")).toBe(70000);
  expect(toMinorUnits(59.5, "JOD")).toBe(59500);
  // None at all: yen has no minor unit, and multiplying by 100 would charge a
  // hundred times over.
  expect(toMinorUnits(1500, "JPY")).toBe(1500);
  // Case does not matter — Stripe reports currencies lowercased.
  expect(toMinorUnits(99, "usd")).toBe(9900);
});

test("a converted price is whole, but the dinar keeps its own precision", () => {
  const sar = currencyByCode("SAR")!;
  const kwd = currencyByCode("KWD")!;
  const jod = currencyByCode("JOD")!;

  // 70 × 5.33 = 373.1, shown as 373. Every converted currency is whole.
  expect(convertFromJod(70, sar)).toBe(373);
  // Whole applies to the 3-decimal currencies too: 70 × 0.439 = 30.73 -> 31.
  expect(convertFromJod(70, kwd)).toBe(31);

  // The dinar is not a conversion, it is the price as stored. 15% off 70 is
  // 59.5 and a Jordanian buyer pays exactly that — rounding it would change a
  // price the institution set and make the advertised 15% a lie.
  expect(convertFromJod(59.5, jod)).toBe(59.5);
  expect(convertFromJod(70, jod)).toBe(70);
});

test("rounding the amount did not touch how many minor units a currency has", () => {
  // The trap this guards: `decimals` drives toMinorUnits, so rounding prices
  // by lowering it would have turned 99 dollars into 99 cents, and 70 dinars
  // into 70 fils. Whole amounts, unchanged minor units.
  expect(currencyByCode("USD")!.decimals).toBe(2);
  expect(currencyByCode("KWD")!.decimals).toBe(3);
  expect(currencyByCode("JOD")!.decimals).toBe(3);

  expect(toMinorUnits(convertFromJod(70, currencyByCode("USD")!), "USD")).toBe(9900);
  expect(toMinorUnits(convertFromJod(70, currencyByCode("KWD")!), "KWD")).toBe(31000);
});

test("a discounted price survives the float, quoted and charged alike", () => {
  const usd = CURRENCIES.DEFAULT;
  // 15% off 70 JOD is 59.5, the case where a float artefact would otherwise
  // reach a buyer as 59.49999999999999.
  expect(formatMoney(59.5)).toBe("59.5");
  const charged = convertFromJod(59.5, usd);
  expect(charged).toBe(84);
  expect(toMinorUnits(charged, usd.code)).toBe(8400);
});

test("every currency in the table can be charged and quoted coherently", () => {
  for (const [key, config] of Object.entries(CURRENCIES)) {
    const converted = convertFromJod(70, config);
    expect(Number.isFinite(converted), `${key} converts to a finite amount`).toBe(true);

    // The quoted string and the charged minor units must describe the same
    // money: re-reading the formatted amount has to give back the same units.
    const shown = formatMoney(converted, config.decimals);
    expect(
      toMinorUnits(Number(shown), config.code),
      `${key}: what is shown (${shown}) and what is charged must agree`,
    ).toBe(toMinorUnits(converted, config.code));

    expect(currencyByCode(config.code)?.code, `${key} is findable by its code`).toBe(config.code);
  }
});

test("an unknown currency code is not silently treated as two decimals", () => {
  // currencyByCode returning null is what makes the server fall back to JOD
  // rather than charge in a currency nobody configured.
  expect(currencyByCode("XYZ")).toBeNull();
  expect(currencyByCode("")).toBeNull();
});
