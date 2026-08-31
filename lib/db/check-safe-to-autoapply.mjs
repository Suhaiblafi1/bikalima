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
 * Statements that must not be applied unattended, and the reason each one is
 * on the list. The reason is printed with the refusal — an operator being
 * stopped deserves to know what stopped them.
 */
const UNSAFE = [
  [/\bDROP\s+TABLE\b/i, "يحذف جدولاً — فقدان بيانات لا رجعة فيه"],
  [/\bDROP\s+(SCHEMA|DATABASE)\b/i, "يحذف مخطّطاً أو قاعدة — فقدان بيانات لا رجعة فيه"],
  [/\bDROP\s+COLUMN\b/i, "يحذف عموداً — فقدان بيانات، ويكسر الكود العامل الآن"],
  [/\bTRUNCATE\b/i, "يُفرِغ جدولاً — فقدان بيانات"],
  [/\bDELETE\s+FROM\b/i, "يحذف صفوفاً"],
  [/\bUPDATE\s+[^\s;]+\s+SET\b/i, "يعدّل بيانات قائمة"],
  [/\bRENAME\b/i, "يعيد التسمية — الكود العامل الآن يطلب الاسم القديم"],
  [/\bALTER\s+COLUMN\b[^;]*\bTYPE\b/i, "يغيّر نوع عمود — إعادة كتابة الجدول وقفل عليه"],
  [/\bSET\s+NOT\s+NULL\b/i, "يُلزِم عموداً بألّا يكون فارغاً — يسقط إن وُجد صفٌّ فارغ، ويكسر أي كتابة قائمة تتركه فارغاً"],
  [/\bDROP\s+DEFAULT\b/i, "يزيل قيمة افتراضية يعتمد عليها الكود العامل الآن"],
  [/\bDROP\s+NOT\s+NULL\b/i, "يسمح بقيم فارغة في عمود يفترضه الكود العامل الآن مملوءاً دائماً"],
  [/\bDROP\s+CONSTRAINT\b/i, "يزيل قيداً — يُضعف ضماناً قائماً بلا أن يلاحظ أحد"],
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
 * Rules that only bite on a table that already holds rows.
 *
 * Drizzle writes a new table and its own foreign keys into the same
 * migration, so judging a file as one blob marked every new table's keys as
 * needing a person. Measured against the fifteen migrations in this
 * repository, that sent nine of them — including the purely additive 0013 —
 * down the manual path, which would have left the automation doing nothing on
 * exactly the migrations it exists for.
 */
const SAFE_ON_NEW_TABLE = [
  [/\bADD\s+CONSTRAINT\b[^;]*\b(FOREIGN\s+KEY|CHECK)\b(?![^;]*\bNOT\s+VALID\b)/i,
   "يضيف قيداً يُفحَص على كل الصفوف القائمة — قفل على الجدول، ويسقط إن خالفه صفّ"],
  [/\bCREATE\s+UNIQUE\s+INDEX\b/i,
   "يضيف فهرساً فريداً على جدول قائم — يسقط إن كان فيه تكرار"],
  [/\bADD\s+COLUMN\b(?![^;]*\bDEFAULT\b)[^;]*\bNOT\s+NULL\b/i,
   "يضيف عموداً إلزامياً بلا قيمة افتراضية — يسقط على أي جدول غير فارغ"],
];

function findings(tag) {
  const file = path.join(drizzleDir, `${tag}.sql`);
  if (!fs.existsSync(file)) return [[`الملف غير موجود: ${tag}.sql`, ""]];
  const sql = strip(fs.readFileSync(file, "utf8"));
  const created = tablesCreatedIn(sql);
  const out = [];

  for (const statement of sql.split(";")) {
    if (!statement.trim()) continue;
    const shown = statement.replace(/\s+/g, " ").trim().slice(0, 160);

    for (const [pattern, reason] of UNSAFE) {
      if (pattern.test(statement)) out.push([reason, shown]);
    }

    const target = targetTable(statement);
    if (target !== null && created.has(target)) continue;
    for (const [pattern, reason] of SAFE_ON_NEW_TABLE) {
      if (pattern.test(statement)) {
        out.push([target ? `${reason} (${target})` : reason, shown]);
      }
    }
  }
  return out;
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
let blocked = 0;
for (const entry of pending) {
  const hits = findings(entry.tag);
  if (hits.length === 0) {
    console.log(`  آمن للتطبيق التلقائي  ${entry.tag}`);
    continue;
  }
  blocked++;
  console.log(`  يحتاج إنساناً        ${entry.tag}`);
  for (const [reason, statement] of hits) {
    console.log(`      ${reason}`);
    if (statement) console.log(`      ← ${statement.slice(0, 160)}`);
  }
}

fs.appendFileSync(process.env.GITHUB_OUTPUT ?? "/dev/null", `pending=${pending.length}\n`);

if (blocked > 0) {
  console.error(
    `::error::${blocked} من الترحيلات المعلّقة لا تُطبَّق تلقائياً. ` +
      "طبّقها بعد أخذ نسخة احتياطية عبر: Actions ← Apply database migrations (production).",
  );
  process.exit(1);
}
console.log("كل الترحيلات المعلّقة إضافية. المتابعة.");
