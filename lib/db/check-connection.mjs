/**
 * Pre-flight for the production migration workflow.
 *
 * Refuses to let a migration start against a URL that cannot work, and says
 * which part is wrong. The first run of that workflow failed with a bare
 * "EAI_AGAIN host" from inside drizzle, because the secret still held a
 * placeholder — the kind of thing a connection check should catch and name,
 * not pass along as "no migrations applied yet".
 *
 * Prints host and port only. Never the user, password or database name.
 */
import pg from "pg";
import { readFileSync } from "node:fs";

const raw = process.env.DATABASE_URL;

function fail(message, ...detail) {
  console.error(`::error::${message}`);
  for (const line of detail) console.error(`  ${line}`);
  process.exit(1);
}

if (!raw) {
  fail(
    "Secret PRODUCTION_DATABASE_URL is not set on this repository.",
    "Add it under Settings → Secrets and variables → Actions.",
  );
}

if (raw !== raw.trim()) {
  fail("The secret has leading or trailing whitespace.", "Re-paste it without a trailing newline.");
}
if (/^["']|["']$/.test(raw)) {
  fail("The secret is wrapped in quotes.", "Store the bare URL, with no surrounding \" or '.");
}
if (/^\s*(psql|DATABASE_URL=)/i.test(raw)) {
  fail(
    "The secret looks like a shell command, not a URL.",
    'Store only the connection string itself, starting with "postgresql://".',
  );
}

let url;
try {
  url = new URL(raw);
} catch {
  fail(
    "The secret is not a valid URL.",
    'It should look like postgresql://<user>:<password>@<real-host>/<database>.',
  );
}
if (!/^postgres(ql)?:$/.test(url.protocol)) {
  fail(`Unexpected protocol "${url.protocol}".`, "Expected postgresql:// or postgres://.");
}

// A placeholder that was copied from documentation rather than replaced.
const PLACEHOLDER_HOSTS = new Set(["host", "hostname", "your-host", "your_host", "db-host", "example.com", "host.com"]);
if (PLACEHOLDER_HOSTS.has(url.hostname.toLowerCase())) {
  fail(
    `The secret still holds a placeholder host ("${url.hostname}").`,
    "Replace the whole value with the real connection string from your database provider",
    "(Neon / Supabase / RDS → Connect → connection string).",
  );
}
if (!url.hostname.includes(".") && url.hostname !== "localhost") {
  fail(
    `The host "${url.hostname}" has no domain part, so it cannot resolve from GitHub's runners.`,
    "Use the full public hostname your provider gives you.",
  );
}

const where = `${url.hostname}:${url.port || 5432}`;
console.log(`Connecting to ${where} …`);

const client = new pg.Client({ connectionString: raw, connectionTimeoutMillis: 15_000 });

const EXPLAIN = {
  EAI_AGAIN: "DNS could not resolve that host. Check the hostname for a typo.",
  ENOTFOUND: "DNS could not resolve that host. Check the hostname for a typo.",
  ECONNREFUSED: "The host answered but refused the port. Check the port.",
  ETIMEDOUT: "No answer before the timeout — usually a firewall or IP allow-list blocking GitHub's runners.",
  "28P01": "Password authentication failed. Check the user and password in the URL.",
  "28000": "The server rejected the authorisation. Check the user, and whether SSL is required (add ?sslmode=require).",
  "3D000": "That database name does not exist on the server.",
};

try {
  await client.connect();
} catch (err) {
  fail(
    `Could not connect to ${where} — ${err.code ?? err.message}`,
    EXPLAIN[err.code] ?? err.message,
  );
}

console.log("Connected.");

const expected = JSON.parse(readFileSync(new URL("./drizzle/meta/_journal.json", import.meta.url), "utf8"))
  .entries.length;

let applied = 0;
try {
  const { rows } = await client.query(
    "select hash, to_timestamp(created_at/1000) as applied_at from drizzle.__drizzle_migrations order by created_at",
  );
  applied = rows.length;
  console.log(`Already applied (${applied}):`);
  for (const row of rows.slice(-5)) {
    console.log(`  ${row.applied_at.toISOString()}  ${row.hash.slice(0, 12)}`);
  }
  if (rows.length > 5) console.log(`  … and ${rows.length - 5} earlier`);
} catch (err) {
  // 42P01/3F000: drizzle's ledger has never been created — a genuine first
  // run. Anything else is a real problem and must not be waved through.
  if (err.code === "42P01" || err.code === "3F000") {
    console.log("Already applied (0): drizzle's ledger does not exist yet — this is a first run.");
  } else {
    await client.end();
    fail(`Could not read the migration ledger — ${err.code ?? err.message}`, err.message);
  }
}

await client.end();

console.log(`\nMigrations in the repository: ${expected}`);
console.log(`Pending: ${Math.max(0, expected - applied)}`);
if (applied > expected) {
  fail(
    `The database has ${applied} migrations but the repository only has ${expected}.`,
    "This checkout is behind the database. Pull main before running.",
  );
}
if (expected === applied) console.log("Nothing to apply — production is already up to date.");
