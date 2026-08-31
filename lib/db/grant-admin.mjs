/**
 * Manage privileged accounts on production, without anyone handling the
 * database URL by hand.
 *
 * Roles are not derived from the email address — see lib/admin.ts: "Email
 * addresses are never authorization credentials". A user becomes an admin
 * only by having the row written, and this is the safe way to write it.
 *
 * ACTION=list     list every account that is not a plain student
 * ACTION=inspect  show what a delete would destroy, changing nothing
 * ACTION=grant    promote ADMIN_EMAIL to a verified super-admin
 * ACTION=revoke   drop ADMIN_EMAIL back to a plain student, keeping the row
 * ACTION=delete   remove ADMIN_EMAIL's row, and everything cascading from it
 *
 * Prints email addresses (the owner's own data). Never prints the
 * connection string, the password hash, or any token.
 */
import pg from "pg";

const ACTIONS = new Set(["list", "inspect", "grant", "revoke", "delete"]);
const action = ACTIONS.has(process.env.ACTION ?? "") ? process.env.ACTION : "list";
const rawEmail = process.env.ADMIN_EMAIL ?? "";
const email = rawEmail.trim().toLowerCase();

function fail(message, ...detail) {
  console.error(`::error::${message}`);
  for (const line of detail) console.error(`  ${line}`);
  process.exit(1);
}

if (action !== "list") {
  if (!email) fail(`ACTION=${action} needs an email address.`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail(`"${rawEmail}" is not a valid email address.`);
  }
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15_000,
});

try {
  await client.connect();
} catch (err) {
  fail(`Could not connect — ${err.code ?? err.message}`, err.message);
}

async function listPrivileged(label) {
  const { rows } = await client.query(
    `select email, role, is_super_admin, email_verified
       from users
      where role <> 'student'
      order by role, email`,
  );
  console.log(`\n${label} (${rows.length}):`);
  if (rows.length === 0) {
    console.log("  none — every account is a plain student.");
    return rows;
  }
  for (const r of rows) {
    const flags = [
      r.is_super_admin ? "super-admin" : null,
      r.email_verified ? "verified" : "UNVERIFIED",
    ].filter(Boolean).join(", ");
    console.log(`  ${r.role.padEnd(11)} ${r.email}  (${flags})`);
  }
  return rows;
}

async function findUser() {
  const { rows } = await client.query(
    "select id, email, role, is_super_admin, email_verified from users where lower(email) = $1",
    [email],
  );
  if (rows.length === 0) {
    await client.end();
    fail(
      `No account exists for ${email}.`,
      action === "grant"
        ? "Register that address on the site first (Sign up), then run this again."
        : "Nothing to do — check the address against the list above.",
    );
  }
  return rows[0];
}

/**
 * Refuse any change that would leave the platform with no administrator.
 * Locking everyone out of the admin panel is not recoverable from the UI —
 * only by another run of this workflow — so it is worth blocking outright.
 */
async function refuseIfLastAdmin(user) {
  if (user.role !== "admin") return;
  const { rows } = await client.query(
    "select count(*)::int as n from users where role = 'admin' and id <> $1",
    [user.id],
  );
  if (rows[0].n === 0) {
    await client.end();
    fail(
      `${user.email} is the only admin left — refusing to ${action} it.`,
      "Promote another account first, then run this again.",
    );
  }
}

/**
 * Every foreign key pointing at users, read from the catalogue rather than
 * hardcoded, so a new table cannot quietly fall out of this report. Rows
 * under a CASCADE key die with the user; SET NULL keeps the row and only
 * forgets who it belonged to.
 */
async function referenceReport(userId) {
  const { rows: fks } = await client.query(`
    select tc.table_name, kcu.column_name, rc.delete_rule
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on kcu.constraint_name = tc.constraint_name and kcu.constraint_schema = tc.constraint_schema
      join information_schema.constraint_column_usage ccu
        on ccu.constraint_name = tc.constraint_name and ccu.constraint_schema = tc.constraint_schema
      join information_schema.referential_constraints rc
        on rc.constraint_name = tc.constraint_name and rc.constraint_schema = tc.constraint_schema
     where tc.constraint_type = 'FOREIGN KEY'
       and ccu.table_name = 'users'
       and tc.table_schema = 'public'
     order by rc.delete_rule, tc.table_name, kcu.column_name
  `);

  const destroyed = [];
  const orphaned = [];
  for (const fk of fks) {
    // Identifiers come from the catalogue, but quote them anyway rather than
    // interpolating a bare name into SQL.
    const { rows } = await client.query(
      `select count(*)::int as n from "${fk.table_name.replaceAll('"', '""')}" where "${fk.column_name.replaceAll('"', '""')}" = $1`,
      [userId],
    );
    if (rows[0].n === 0) continue;
    const entry = `${rows[0].n.toString().padStart(6)}  ${fk.table_name}.${fk.column_name}`;
    if (fk.delete_rule === "CASCADE") destroyed.push(entry);
    else orphaned.push(`${entry} → ${fk.delete_rule.toLowerCase()}`);
  }

  console.log(`\nRows referencing this account (${fks.length} foreign keys checked):`);
  if (destroyed.length === 0 && orphaned.length === 0) {
    console.log("  none — the account owns no data.");
  }
  if (destroyed.length) {
    console.log("  DELETED with the account (cascade):");
    for (const line of destroyed) console.log(`  ${line}`);
  }
  if (orphaned.length) {
    console.log("  Kept, author forgotten:");
    for (const line of orphaned) console.log(`  ${line}`);
  }
  return destroyed.length;
}

await listPrivileged("Accounts above student");

if (action === "inspect") {
  const user = await findUser();
  console.log(`\nFound ${user.email} — role "${user.role}", super-admin ${user.is_super_admin}.`);
  await referenceReport(user.id);
  console.log("\nNothing was changed. Re-run with ACTION=delete to remove it.");
}

if (action === "grant") {
  const before = await findUser();
  console.log(`\nFound ${before.email} — role "${before.role}", super-admin ${before.is_super_admin}, verified ${before.email_verified}.`);

  // email_verified is forced true because isMasterAccount() requires it, and
  // an owner promoting their own account should not be locked out by an
  // unsent verification email.
  const { rows: after } = await client.query(
    `update users
        set role = 'admin', is_super_admin = true, email_verified = true, updated_at = now()
      where id = $1
      returning email, role, is_super_admin, email_verified`,
    [before.id],
  );
  const a = after[0];
  console.log(`Now:   ${a.email} — role "${a.role}", super-admin ${a.is_super_admin}, verified ${a.email_verified}.`);
  if (!before.email_verified) console.log("       (email_verified was flipped from false to true)");

  await listPrivileged("Accounts above student, after the change");
  console.log("\nSign out and back in for the new role to load into the session.");
}

if (action === "revoke") {
  const before = await findUser();
  console.log(`\nFound ${before.email} — role "${before.role}", super-admin ${before.is_super_admin}.`);
  await refuseIfLastAdmin(before);

  const { rows: after } = await client.query(
    `update users
        set role = 'student', is_super_admin = false, updated_at = now()
      where id = $1
      returning email, role, is_super_admin`,
    [before.id],
  );
  const a = after[0];
  console.log(`Now:   ${a.email} — role "${a.role}", super-admin ${a.is_super_admin}.`);
  console.log("The account still exists and its data is untouched; it simply has no privileges.");
  // getUserAccess() re-reads the role from the database on every request, so
  // a live session loses its powers immediately — no logout needed.
  console.log("Any signed-in session loses admin access on its next request.");

  await listPrivileged("Accounts above student, after the change");
}

if (action === "delete") {
  const before = await findUser();
  console.log(`\nFound ${before.email} — role "${before.role}", super-admin ${before.is_super_admin}.`);
  await refuseIfLastAdmin(before);
  await referenceReport(before.id);

  const { rowCount } = await client.query("delete from users where id = $1", [before.id]);
  console.log(`\nDeleted ${rowCount} account row. This cannot be undone.`);

  await listPrivileged("Accounts above student, after the change");
}

await client.end();
