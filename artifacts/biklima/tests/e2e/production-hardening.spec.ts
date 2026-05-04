import { test, expect } from "@playwright/test";
import { TEST_FIXTURES } from "../fixtures/data";

/**
 * Production-hardening spec. These tests run against the live dev server
 * (no DB writes, no auth fixtures) and exercise the public surface that
 * the security pass added: CSP / no-X-Powered-By, CORS allowlist, CSRF
 * enforcement, the checkout preview-before-login experience, sitemap and
 * robots files, and an admin route returning 401 without a session.
 */
test.describe("production hardening", () => {
  test("API returns hardened response headers", async ({ request }) => {
    const res = await request.get("/api/healthz");
    expect(res.ok()).toBeTruthy();
    const headers = res.headers();
    expect(headers["x-powered-by"]).toBeUndefined();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBeTruthy();
    expect(headers["permissions-policy"]).toBeTruthy();
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  });

  test("CORS rejects disallowed origins (no Allow-Origin echoed back)", async ({ request }) => {
    const res = await request.fetch("/api/healthz", {
      method: "OPTIONS",
      headers: {
        Origin: "https://attacker.example.com",
        "Access-Control-Request-Method": "POST",
      },
    });
    // Preflight may still return 204, but no allow-origin header → browser blocks.
    const headers = res.headers();
    expect(headers["access-control-allow-origin"]).toBeFalsy();
  });

  test("CORS allows the production domain explicitly", async ({ request }) => {
    const res = await request.fetch("/api/healthz", {
      method: "GET",
      headers: { Origin: "https://bikalima.com" },
    });
    expect(res.headers()["access-control-allow-origin"]).toBe("https://bikalima.com");
  });

  test("CSRF: POST with session cookie but no token is rejected", async ({ request }) => {
    // Forge a fake session cookie so the middleware kicks in (real session
    // not required — the CSRF check runs before auth lookup).
    const res = await request.post("/api/auth/login", {
      headers: {
        "Content-Type": "application/json",
        Cookie: "sid=fake-session-for-csrf-test",
      },
      data: { email: "noone@example.com", password: "irrelevant" },
    });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/csrf/i);
  });

  test("/api/csrf issues a token", async ({ request }) => {
    const res = await request.get("/api/csrf");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(typeof body.token).toBe("string");
    expect(body.token.length).toBeGreaterThanOrEqual(32);
  });

  test("admin route requires auth (401 without session)", async ({ request }) => {
    const res = await request.get("/api/admin/users");
    expect([401, 403]).toContain(res.status());
  });

  test("robots.txt and sitemap.xml are served", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    const robotsBody = await robots.text();
    expect(robotsBody).toMatch(/Disallow:\s*\/admin/);
    expect(robotsBody).toMatch(/Disallow:\s*\/checkout/);
    expect(robotsBody).toMatch(/Sitemap:/);

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const xml = await sitemap.text();
    expect(xml).toContain("<urlset");
    expect(xml).toContain("/programs/influential-speaker");
  });

  test("global fetch interceptor injects CSRF on in-app POSTs (logout works)", async ({ browser, baseURL, request }) => {
    // Log in via API (no fixture, no extraHTTPHeaders trickery), then load
    // the SPA in a fresh browser context that has ONLY the session cookie
    // and verify a same-origin POST through window.fetch succeeds — i.e.
    // the global interceptor is wiring x-csrf-token from the cookie.
    const csrfRes = await request.get("/api/csrf");
    const csrfToken = (await csrfRes.json()).token as string;
    // Re-issue login through plain request so cookies land on the request context.
    const login = await request.post("/api/auth/login", {
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
      data: { email: TEST_FIXTURES.learner.email, password: TEST_FIXTURES.learner.password },
    });
    expect(login.ok()).toBeTruthy();
    const state = await request.storageState();
    const ctx = await browser.newContext({ storageState: state });
    // Crucially: no setExtraHTTPHeaders here — the SPA must do the work.
    const page = await ctx.newPage();
    await page.goto(baseURL!);
    await page.waitForLoadState("domcontentloaded");
    // Give the install-csrf-fetch primer a tick.
    await page.waitForTimeout(500);
    const status = await page.evaluate(async () => {
      const r = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      return r.status;
    });
    expect(status).toBe(200);
    await ctx.close();
  });

  test("checkout shows course preview + login CTA when not authenticated", async ({ page }) => {
    await page.goto("/checkout?slug=influential-speaker");
    // Login gate appears (preview-before-login)
    await expect(page.getByTestId("checkout-login-gate")).toBeVisible();
    const cta = page.getByTestId("checkout-login-cta");
    await expect(cta).toBeVisible();
    // Course summary visible BEFORE auth (price + title)
    await expect(page.getByTestId("checkout-course-summary")).toBeVisible();
    // The login CTA goes to /login with a redirect param back to checkout
    await cta.click();
    await page.waitForURL(/\/login\?redirect=/, { timeout: 5000 });
    expect(page.url()).toMatch(/redirect=%2Fcheckout%3Fslug%3Dinfluential-speaker/);
  });
});
