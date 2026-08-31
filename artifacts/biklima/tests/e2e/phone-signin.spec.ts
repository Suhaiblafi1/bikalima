import { expect, test, request } from "@playwright/test";

/**
 * Signing in with a phone number instead of an email.
 *
 * The cases that matter are the ones a person actually creates: the same
 * Jordanian mobile written three different ways, a number already taken, and
 * a number that must not become a second way to guess a password.
 */
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:80";
const stamp = Date.now();
const EMAIL = `e2e.phone.${stamp}@bikalima.test`;
const PHONE = `079${String(stamp).slice(-7)}`;
const PASSWORD = "Str0ng-Passw0rd!";

async function api() {
  const ctx = await request.newContext({ baseURL: BASE });
  const token = ((await (await ctx.get("/api/csrf")).json()) as { token?: string }).token ?? "";
  return { ctx, headers: { "Content-Type": "application/json", "x-csrf-token": token } };
}

test("an account can be created with a phone and signed into with it", async () => {
  const { ctx, headers } = await api();

  const registered = await ctx.post("/api/auth/register", {
    headers,
    data: { email: EMAIL, password: PASSWORD, firstName: "هاتف", phone: PHONE },
  });
  expect(registered.ok(), await registered.text()).toBeTruthy();

  // The same number as a person would actually retype it: local, international,
  // and with the spacing they see on their own handset.
  const local = PHONE;
  const international = `+962${PHONE.slice(1)}`;
  const spaced = `${PHONE.slice(0, 3)} ${PHONE.slice(3, 6)} ${PHONE.slice(6)}`;

  for (const identifier of [local, international, spaced, EMAIL]) {
    const fresh = await request.newContext({ baseURL: BASE });
    const t = ((await (await fresh.get("/api/csrf")).json()) as { token?: string }).token ?? "";
    const res = await fresh.post("/api/auth/login", {
      headers: { "Content-Type": "application/json", "x-csrf-token": t },
      data: { identifier, password: PASSWORD },
    });
    expect(res.ok(), `should sign in with ${identifier}`).toBeTruthy();
    await fresh.dispose();
  }
  await ctx.dispose();
});

test("a phone already on another account is refused, and named as the reason", async () => {
  const { ctx, headers } = await api();
  const res = await ctx.post("/api/auth/register", {
    headers,
    data: { email: `other.${stamp}@bikalima.test`, password: PASSWORD, phone: PHONE },
  });
  expect(res.status()).toBe(409);
  expect(((await res.json()) as { error: string }).error).toContain("الهاتف");
  await ctx.dispose();
});

test("a phone number is not a way past the password", async () => {
  const { ctx, headers } = await api();
  const res = await ctx.post("/api/auth/login", {
    headers,
    data: { identifier: PHONE, password: "not-the-password" },
  });
  expect(res.status()).toBe(401);

  // An unknown number must answer exactly like a wrong password, so the form
  // cannot be used to find out which numbers have accounts.
  const unknown = await ctx.post("/api/auth/login", {
    headers,
    data: { identifier: "0799999999", password: PASSWORD },
  });
  expect(unknown.status()).toBe(401);
  await ctx.dispose();
});

test("an older client sending `email` still signs in", async () => {
  // A tab left open across the deploy posts the old field name.
  const { ctx, headers } = await api();
  const res = await ctx.post("/api/auth/login", { headers, data: { email: EMAIL, password: PASSWORD } });
  expect(res.ok()).toBeTruthy();
  await ctx.dispose();
});
