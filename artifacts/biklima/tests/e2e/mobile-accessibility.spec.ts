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
  expect(duration).toBe("0.00001s");
  await context.close();
});
