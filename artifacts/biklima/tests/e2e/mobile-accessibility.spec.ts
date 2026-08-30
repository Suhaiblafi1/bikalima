import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 320, height: 720 }, { width: 390, height: 844 }]) {
  test(`homepage remains usable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => localStorage.setItem("biklima-lang", "ar"));
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("skip link reaches the main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "تجاوز إلى المحتوى" });
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("404 page is human-readable in Arabic and exposes recovery actions", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("biklima-lang", "ar"));
  await page.goto("/missing-page-for-test");
  await expect(page.getByRole("heading", { name: "عذراً، لم نجد هذه الصفحة" })).toBeVisible();
  await expect(page.getByRole("button", { name: "الصفحة الرئيسية" })).toBeVisible();
});

test("reduced-motion preference is respected", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(baseURL!);
  const duration = await page.locator("body").evaluate((element) => getComputedStyle(element).transitionDuration);
  // The stylesheet collapses transitions to 0.01ms under reduced motion.
  // Assert the value rather than its spelling: Chromium serializes that
  // same computed duration as "0.00001s" on some versions and "1e-05s" on
  // others, and either one satisfies the preference.
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.001);
  await context.close();
});

for (const path of [
  "/",
  "/programs/influential-speaker",
  "/workbooks",
  "/about",
  "/library",
  "/gallery",
  "/careers",
  "/impact",
  "/accreditations",
  "/verify",
  "/privacy",
  "/terms",
]) {
  test(`${path} has one page title and no basic accessibility leaks`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      localStorage.setItem("biklima-lang", "ar");
      localStorage.setItem("bikalima_analytics_consent", "denied");
    });
    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);

    const audit = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      imagesWithoutAlt: [...document.querySelectorAll("img")].filter((image) => !image.hasAttribute("alt")).length,
      unlabeledButtons: [...document.querySelectorAll("button")].filter((button) => {
        const text = button.textContent?.trim();
        return !text && !button.getAttribute("aria-label") && !button.getAttribute("title");
      }).length,
      emptyLinks: [...document.querySelectorAll("a")].filter((link) => {
        const text = link.textContent?.trim();
        return !text && !link.getAttribute("aria-label") && !link.querySelector("img[alt]");
      }).length,
    }));

    expect(audit.overflow).toBeLessThanOrEqual(1);
    expect(audit.imagesWithoutAlt).toBe(0);
    expect(audit.unlabeledButtons).toBe(0);
    expect(audit.emptyLinks).toBe(0);
  });
}
