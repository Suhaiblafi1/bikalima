import { defineConfig, devices } from "@playwright/test";

// Default to the shared Replit proxy on port 80. The api-server issues
// session cookies with `secure: true; sameSite: "none"`, which Chromium
// (and therefore Playwright) treats as transmittable over plain HTTP only
// when the origin is `localhost` (per the WHATWG Secure Contexts spec).
// If you point this at a non-localhost host, use https:// or the auth
// fixture's post-login session check will fail loudly.
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:80";

export default defineConfig({
  testDir: "./artifacts/biklima/tests/e2e",
  globalSetup: "./artifacts/biklima/tests/global-setup.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    ignoreHTTPSErrors: true,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
