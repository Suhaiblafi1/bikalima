/**
 * Provision an admin account on production, without anyone handling the
 * database URL by hand.
 *
 * Roles are not derived from the email address — see lib/admin.ts: "Email
 * addresses are never authorization credentials". A user becomes an admin
 * only by having the row written, and this is the safe way to write it.
 *
 * MODE=list   list every account that is not a plain student
 * MODE=grant  promote ADMIN_EMAIL to a verified super-admin
 *
 * Prints email addresses (the owner's own data). Never prints the
 * connection string, the password hash, or any token.
 */
import pg from "pg";

const mode = process.env.MODE === "grant" ? "grant" : "list";
const rawEmail = process.env.ADMIN_EMAIL ?? "";
const email = rawEmail.trim().toLowerCase();

function fail(message, ...detail) {
  console.error(`::error::${message}`);
  for (const line of detail) console.error(`  ${line}`);
  process.exit(1);
}

if (mode === "grant" && !email) {
  fail("MODE=grant needs an email address.", "Pass the account you want promoted.");
}
if (mode === "grant" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  fail(`"${rawEmail}" is not a valid email address.`);
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

await listPrivileged("Accounts above student");

if (mode === "grant") {
  const { rows: found } = await client.query(
    "select id, email, role, is_super_admin, email_verified from users where lower(email) = $1",
    [email],
  );
  if (found.length === 0) {
    await client.end();
    fail(
      `No account exists for ${email}.`,
      "Register that address on the site first (Sign up), then run this again.",
      "This script promotes an existing account; it never creates one.",
    );
  }

  const before = found[0];
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

await client.end();
