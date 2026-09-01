/**
 * Decide whether the pending migrations are safe to apply without a person
 * watching, and refuse if any of them is not.
 *
 * Automation is worth having here because the failure it replaces is real and
 * repeated: a migration merges, nobody runs the manual workflow, and
 * production serves errors for hours against a schema the deployed code
 * expects. That is a far worse outcome than any of the risks below.
 *
 * But "apply whatever merged" is not the answer either. An additive migration
 * — a new column, a new table, a new index — cannot lose data and cannot
 * break the code already running, so it is safe to apply while nobody is
 * looking. A migration that drops, renames, retypes, tightens or rewrites can
 * do both, and belongs to a person who has taken a backup and can watch it.
 *
 * So this script sorts the pending migrations into those two buckets and
 * exits non-zero on the second, naming the file and the statement that put it
 * there. The manual workflow still exists for exactly that case.
 *
 * Pending is worked out the way drizzle itself works it out: every journal
 * entry whose `when` is newer than the newest `created_at` in the ledger.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
const drizzleDir = path.join(here, "drizzle");
const journal = JSON.parse(fs.readFileSync(path.join(drizzleDir, "meta", "_journal.json"), "utf8"));

/**
 * Statements that must never be applied unattended.
 *
 * What these share is that they SUCCEED and cause harm: data gone, a column
 * renamed out from under the running code, a constraint quietly relaxed. No
 * amount of retrying helps, because the damage is the success.
 */
const NEVER_UNATTENDED = [
  [/\bDROP\s+TABLE\b/i, "يحذف جدولاً — فقدان بيانات لا رجعة فيه"],
  [/\bDROP\s+(SCHEMA|DATABASE)\b/i, "يحذف مخطّطاً أو قاعدة — فقدان بيانات لا رجعة فيه"],
  [/\bDROP\s+COLUMN\b/i, "يحذف عموداً — فقدان بيانات، ويكسر الكود العامل الآن"],
  [/\bTRUNCATE\b/i, "يُفرِغ جدولاً — فقدان بيانات"],
  [/\bDELETE\s+FROM\b/i, "يحذف صفوفاً"],
  [/\bUPDATE\s+[^\s;]+\s+SET\b/i, "يعدّل بيانات قائمة"],
  [/\bRENAME\b/i, "يعيد التسمية — الكود العامل الآن يطلب الاسم القديم"],
  [/\bALTER\s+COLUMN\b[^;]*\bTYPE\b/i, "يغيّر نوع عمود — إعادة كتابة الجدول وقفل عليه"],
  [/\bSET\s+NOT\s+NULL\b/i, "يُلزِم عموداً بألّا يكون فارغاً — يكسر أي كتابة قائمة تتركه فارغاً"],
  [/\bDROP\s+DEFAULT\b/i, "يزيل قيمة افتراضية يعتمد عليها الكود العامل الآن"],
  [/\bDROP\s+NOT\s+NULL\b/i, "يسمح بقيم فارغة في عمود يفترضه الكود العامل الآن مملوءاً دائماً"],
  [/\bDROP\s+CONSTRAINT\b/i, "يزيل قيداً — يُضعف ضماناً قائماً بلا أن يلاحظ أحد"],
];

/**
 * Statements that may fail, and cost nothing when they do.
 *
 * A unique index on a table that already holds duplicates fails; a foreign key
 * validated against existing rows fails if one violates it. Neither can half
 * happen: drizzle runs each migration file in a transaction, so a failure
 * leaves the database exactly as it was and the ledger un-advanced. Measured
 * rather than assumed — a probe whose first statement created a table and
 * whose second hit a duplicate left no table behind and the ledger at 17.
 *
 * So attempting them unattended risks nothing but a red run, which is the
 * outcome anyway if a person is asked to do it and does not. They are
 * reported, not refused.
 */
const MAY_FAIL_CLEANLY = [
  [/\bADD\s+CONSTRAINT\b[^;]*\b(FOREIGN\s+KEY|CHECK)\b(?![^;]*\bNOT\s+VALID\b)/i,
   "قيد يُفحَص على الصفوف القائمة — يسقط إن خالفه صفّ"],
  [/\bCREATE\s+UNIQUE\s+INDEX\b/i,
   "فهرس فريد على جدول قائم — يسقط إن كان فيه تكرار"],
  [/\bADD\s+COLUMN\b(?![^;]*\bDEFAULT\b)[^;]*\bNOT\s+NULL\b/i,
   "عمود إلزامي بلا قيمة افتراضية — يسقط على أي جدول غير فارغ"],
];

/** SQL with comments and string literals stripped, so a word inside a quoted
 *  default value cannot look like a statement. */
function strip(sql) {
  return sql
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/'(?:[^']|'')*'/g, "''");
}

/** Table names this file creates. Nothing can fail on data in a table that
 *  did not exist a statement ago, which is why several rules below stop
 *  applying once the target is one of these. */
function tablesCreatedIn(sql) {
  const names = new Set();
  for (const m of sql.matchAll(/\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?([A-Za-z0-9_]+)"?/gi)) {
    names.add(m[1].toLowerCase());
  }
  return names;
}

/** The table a statement acts on, lowercased, or null if it names none. */
function targetTable(statement) {
  const alter = statement.match(/\bALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?"?([A-Za-z0-9_]+)"?/i);
  if (alter) return alter[1].toLowerCase();
  const index = statement.match(/\bON\s+"?([A-Za-z0-9_]+)"?/i);
  if (index) return index[1].toLowerCase();
  return null;
}

/**
 * Two lists, because they answer different questions: what would this do if it
 * worked, and what happens if it does not.
 *
 * Returns { blocking, mayFail }. Only `blocking` stops a migration.
 */
function findings(tag) {
  const file = path.join(drizzleDir, `${tag}.sql`);
  if (!fs.existsSync(file)) return { blocking: [[`الملف غير موجود: ${tag}.sql`, ""]], mayFail: [] };
  const sql = strip(fs.readFileSync(file, "utf8"));
  const created = tablesCreatedIn(sql);
  const blocking = [];
  const mayFail = [];

  for (const statement of sql.split(";")) {
    if (!statement.trim()) continue;
    const shown = statement.replace(/\s+/g, " ").trim().slice(0, 160);

    for (const [pattern, reason] of NEVER_UNATTENDED) {
      if (pattern.test(statement)) blocking.push([reason, shown]);
    }

    // Nothing can fail on data in a table that did not exist a statement ago,
    // so a new table's own keys and indexes are not even worth mentioning.
    const target = targetTable(statement);
    if (target !== null && created.has(target)) continue;
    for (const [pattern, reason] of MAY_FAIL_CLEANLY) {
      if (pattern.test(statement)) mayFail.push([target ? `${reason} (${target})` : reason, shown]);
    }
  }
  return { blocking, mayFail };
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
let appliedThrough = -1;
try {
  await client.connect();
  const res = await client.query(
    "select coalesce(max(created_at), -1)::bigint as last from drizzle.__drizzle_migrations",
  );
  appliedThrough = Number(res.rows[0].last);
} catch (err) {
  // A missing ledger is a legitimate first run. Anything else is a connection
  // or permission problem, and guessing "nothing applied yet" from it would
  // hand every migration in the repository to an unattended run.
  if (err.code === "42P01" || err.code === "3F000") {
    appliedThrough = -1;
  } else {
    console.error(`::error::تعذّر قراءة سجلّ الترحيلات: ${err.message}`);
    process.exit(1);
  }
} finally {
  await client.end().catch(() => {});
}

const pending = journal.entries.filter((e) => e.when > appliedThrough);

if (pending.length === 0) {
  console.log("لا ترحيلات معلّقة. قاعدة الإنتاج محدَّثة.");
  fs.appendFileSync(process.env.GITHUB_OUTPUT ?? "/dev/null", "pending=0\n");
  process.exit(0);
}

console.log(`ترحيلات معلّقة: ${pending.length}`);

/**
 * Only a prefix can be applied.
 *
 * Migrations run in order, so the safe ones are the unbroken run from the
 * front up to the first that needs a person — everything after it is behind
 * that one and has to wait with it. The first attempt judged the whole batch
 * and refused all of it when any single migration was unsafe, which left a
 * purely additive 0015 unapplied because 0016 sat behind it. That is the
 * disease this workflow exists to cure, reintroduced one level up.
 */
let safeCount = 0;
let stopped = false;
const blocked = [];

for (const entry of pending) {
  const { blocking, mayFail } = findings(entry.tag);

  if (blocking.length > 0) {
    stopped = true;
    blocked.push(entry.tag);
    console.log(`  يحتاج إنساناً        ${entry.tag}`);
    for (const [reason, statement] of blocking) {
      console.log(`      ${reason}`);
      if (statement) console.log(`      ← ${statement.slice(0, 160)}`);
    }
    continue;
  }

  if (stopped) {
    console.log(`  ينتظر ما قبله         ${entry.tag}`);
    blocked.push(entry.tag);
    continue;
  }

  safeCount++;
  if (mayFail.length === 0) {
    console.log(`  آمن للتطبيق التلقائي  ${entry.tag}`);
  } else {
    // Attempted, not refused: a failure here rolls the whole file back and
    // leaves the ledger where it was, so trying costs nothing but a red run.
    console.log(`  يُحاوَل تلقائياً       ${entry.tag}`);
    for (const [reason] of mayFail) console.log(`      قد يسقط: ${reason} — وإن سقط لم يتغيّر شيء`);
  }
}

// The number of journal entries the apply step should trim to, so drizzle
// applies the safe prefix and stops.
const applyThrough = journal.entries.length - (pending.length - safeCount);
fs.appendFileSync(
  process.env.GITHUB_OUTPUT ?? "/dev/null",
  `pending=${pending.length}\nsafe_count=${safeCount}\nblocked_count=${blocked.length}\napply_through=${applyThrough}\n`,
);

if (safeCount > 0) {
  console.log(`\nسيُطبَّق ${safeCount} ترحيلاً تلقائياً.`);
}
if (blocked.length > 0) {
  console.error(
    `::error::${blocked.length} ترحيلاً لا يُطبَّق تلقائياً (${blocked.join("، ")}). ` +
      "طبّقه بعد أخذ نسخة احتياطية عبر: Actions ← Apply database migrations (production).",
  );
  // Still an error, so it is red and nobody forgets — but the safe prefix is
  // applied first by the step that runs before this exit code is read.
  process.exitCode = 1;
}
