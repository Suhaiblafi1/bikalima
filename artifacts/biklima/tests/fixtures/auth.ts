import { test as base, request, type APIRequestContext, type BrowserContext } from "@playwright/test";
import { TEST_FIXTURES } from "./data";

/**
 * Programmatically log in a user against the real /api/auth/login endpoint and
 * inject the resulting session cookie into the browser context. This avoids
 * depending on Replit OIDC, captchas, or email verification flows in tests.
 */
async function loginAs(
  context: BrowserContext,
  baseURL: string,
  email: string,
  password: string,
): Promise<void> {
  const apiContext: APIRequestContext = await request.newContext({ baseURL });
  const res = await apiContext.post("/api/auth/login", {
    data: { email, password },
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok()) {
    const body = await res.text().catch(() => "");
    throw new Error(`login failed for ${email}: ${res.status()} ${body}`);
  }
  const cookies = await apiContext.storageState();
  await context.addCookies(cookies.cookies);
  await apiContext.dispose();

  // Defensive: verify the session cookie is actually being sent on
  // subsequent requests from the browser context. The api-server sets
  // the session cookie with `secure: true; sameSite: "none"`, which on
  // most origins would block transmission over plain HTTP — but
  // Chromium treats `localhost` as a "potentially trustworthy" origin
  // per the WHATWG Secure Contexts spec, so secure cookies ARE sent
  // over http://localhost. If a future change to baseURL or the cookie
  // policy breaks this, we want to fail loudly here rather than later
  // in an opaque 401 from a downstream assertion.
  const me = await context.request.get(`${baseURL}/api/auth/user`);
  if (!me.ok()) {
    throw new Error(
      `post-login session check failed for ${email}: ` +
        `${me.status()} ${await me.text().catch(() => "")}`,
    );
  }
  const meJson = (await me.json()) as { user: { email?: string } | null };
  if (!meJson.user || meJson.user.email?.toLowerCase() !== email.toLowerCase()) {
    throw new Error(
      `session cookie not honored for ${email}; got user=${JSON.stringify(meJson.user)}. ` +
        `If E2E_BASE_URL is not localhost-based, the api-server's secure cookie ` +
        `policy requires HTTPS — set E2E_BASE_URL to an https:// URL.`,
    );
  }
}

type Fixtures = {
  /** Anonymous browser context — no session cookie. */
  anon: BrowserContext;
  /** Browser context already logged in as the seeded learner. */
  learner: BrowserContext;
  /** Browser context already logged in as the seeded admin. */
  admin: BrowserContext;
};

export const test = base.extend<Fixtures>({
  anon: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    await use(ctx);
    await ctx.close();
  },
  learner: async ({ browser, baseURL }, use) => {
    const ctx = await browser.newContext();
    await loginAs(
      ctx,
      baseURL!,
      TEST_FIXTURES.learner.email,
      TEST_FIXTURES.learner.password,
    );
    await use(ctx);
    await ctx.close();
  },
  admin: async ({ browser, baseURL }, use) => {
    const ctx = await browser.newContext();
    await loginAs(
      ctx,
      baseURL!,
      TEST_FIXTURES.admin.email,
      TEST_FIXTURES.admin.password,
    );
    await use(ctx);
    await ctx.close();
  },
});

export { expect } from "@playwright/test";
