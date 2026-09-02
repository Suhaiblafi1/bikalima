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
  // 70 × 1.42 = 99.4 — and this is the case the rounding in convertFromJod
  // exists for: the raw product is 99.39999999999999, which must never reach a
  // buyer or a card as anything but 99.4.
  expect(convertFromJod(70, usd)).toBe(99.4);
  expect(formatMoney(convertFromJod(70, usd), usd.decimals)).toBe("99.4");
});

test("minor units follow the currency, not a fixed factor", () => {
  // Two decimals: dollars and most of the world.
  expect(toMinorUnits(99.4, "USD")).toBe(9940);
  // Three: the dinar is 1000 fils, and treating it as 100 would charge a buyer
  // a tenth of the price.
  expect(toMinorUnits(70, "JOD")).toBe(70000);
  expect(toMinorUnits(59.5, "JOD")).toBe(59500);
  // None at all: yen has no minor unit, and multiplying by 100 would charge a
  // hundred times over.
  expect(toMinorUnits(1500, "JPY")).toBe(1500);
  // Case does not matter — Stripe reports currencies lowercased.
  expect(toMinorUnits(99.4, "usd")).toBe(9940);
});

test("conversion rounds to the currency's real precision, both ways", () => {
  const sar = currencyByCode("SAR")!;
  const kwd = currencyByCode("KWD")!;
  // 70 × 7.92 = 554.4 — and not 554, which is what rounding to whole units
  // used to do to every non-dinar price.
  expect(convertFromJod(70, sar)).toBe(554.4);
  // A 3-decimal currency keeps its third digit: 70 × 0.69 = 48.3
  expect(convertFromJod(70, kwd)).toBe(48.3);
  expect(kwd.decimals).toBe(3);
});

test("a discounted price survives the float, quoted and charged alike", () => {
  const usd = CURRENCIES.DEFAULT;
  // 15% off 70 JOD is 59.5, the case where a float artefact would otherwise
  // reach a buyer as 59.49999999999999.
  expect(formatMoney(59.5)).toBe("59.5");
  const charged = convertFromJod(59.5, usd);
  expect(charged).toBe(84.49);
  expect(toMinorUnits(charged, usd.code)).toBe(8449);
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
