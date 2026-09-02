/**
 * Compare the hand-maintained currency table against the live market.
 *
 * The table in lib/pricing is the only place a price is converted, for the
 * browser quoting a buyer and for the server charging them. Being hand-written
 * is a deliberate limitation — but it went four months unchecked and the six
 * Gulf rows drifted about 50% high, so "hand-written" needs a way to be
 * audited in one command. This is it.
 *
 * Read-only: it prints what it found and exits non-zero if any row is off by
 * more than the threshold. It never edits the table — the numbers a buyer sees
 * are not something a script should change without a person reading the diff.
 *
 *   pnpm --filter @workspace/scripts run check:fx
 *   pnpm --filter @workspace/scripts run check:fx -- --tolerance 0.01
 */
import { CURRENCIES } from "@workspace/pricing";

const FEED = "https://open.er-api.com/v6/latest/JOD";

/** Default tolerance: 2%. Pegged currencies barely move; floating ones do. */
const DEFAULT_TOLERANCE = 0.02;

type Feed = {
  result: string;
  time_last_update_utc?: string;
  base_code?: string;
  rates: Record<string, number>;
};

function tolerance(): number {
  const i = process.argv.indexOf("--tolerance");
  if (i === -1) return DEFAULT_TOLERANCE;
  const value = Number(process.argv[i + 1]);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`--tolerance needs a positive number, got "${process.argv[i + 1]}"`);
  }
  return value;
}

/** The row's precision, matching how the table is written. */
function places(rate: number): number {
  return rate < 1 ? 3 : rate < 100 ? 2 : 1;
}

/**
 * What the row should read: the market rate carrying the same spread as the
 * dollar row, rounded up so a quoted price never lands under the amount the
 * card is actually charged.
 */
function suggest(marketRate: number, spread: number): number {
  const target = marketRate * spread;
  const factor = 10 ** places(target);
  return Math.ceil(target * factor) / factor;
}

async function main(): Promise<void> {
  const limit = tolerance();

  const response = await fetch(FEED);
  if (!response.ok) {
    throw new Error(`FX feed returned ${response.status} ${response.statusText}`);
  }
  const feed = (await response.json()) as Feed;
  if (feed.result !== "success" || feed.base_code !== "JOD" || !feed.rates) {
    throw new Error(`FX feed did not return JOD rates (result: ${feed.result})`);
  }

  const marketUsd = feed.rates.USD;
  if (!Number.isFinite(marketUsd) || marketUsd <= 0) {
    throw new Error("FX feed carried no usable USD rate; cannot derive the spread.");
  }
  // Every charge leaves in USD, so the dollar row defines the spread the rest
  // of the table is measured against.
  const spread = CURRENCIES.DEFAULT.rate / marketUsd;

  console.log(`Feed: ${FEED}`);
  console.log(`As of: ${feed.time_last_update_utc ?? "unknown"}`);
  console.log(
    `Dollar row ${CURRENCIES.DEFAULT.rate} vs market ${marketUsd.toFixed(4)} — spread ${((spread - 1) * 100).toFixed(2)}%`,
  );
  console.log(`Tolerance: ${(limit * 100).toFixed(1)}%\n`);

  const drifted: string[] = [];
  const missing: string[] = [];

  for (const [key, config] of Object.entries(CURRENCIES)) {
    if (config.code === "JOD") continue; // the base; always 1

    const market = feed.rates[config.code];
    if (!Number.isFinite(market)) {
      missing.push(`${key} (${config.code})`);
      continue;
    }

    const expected = suggest(market, spread);
    const off = config.rate / expected - 1;
    const label = `${key.padEnd(8)} ${config.code}  table ${String(config.rate).padEnd(9)} market ${market.toFixed(4).padEnd(11)} suggested ${String(expected).padEnd(9)}`;

    if (Math.abs(off) > limit) {
      drifted.push(`${label} off ${(off * 100 > 0 ? "+" : "")}${(off * 100).toFixed(1)}%`);
      console.log(`DRIFTED  ${label} off ${off * 100 > 0 ? "+" : ""}${(off * 100).toFixed(1)}%`);
    } else {
      console.log(`ok       ${label}`);
    }
  }

  if (missing.length > 0) {
    console.log(`\nNot quoted by the feed, so unchecked: ${missing.join(", ")}`);
  }

  if (drifted.length > 0) {
    console.log(
      `\n${drifted.length} row(s) beyond ${(limit * 100).toFixed(1)}%. Update lib/pricing/src/index.ts to the suggested values, then run the pricing tests.`,
    );
    process.exitCode = 1;
    return;
  }
  console.log("\nEvery row is within tolerance.");
}

await main();
