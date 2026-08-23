import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { width: 320, height: 720 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
  { width: 1440, height: 900 },
] as const;

test.describe("responsive density budgets", () => {
  for (const viewport of VIEWPORTS) {
    test(`home has no document overflow at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript(() => {
        localStorage.setItem("biklima-lang", "ar");
        localStorage.setItem("bikalima_analytics_consent", "denied");
      });
      await page.goto("/");
      await expect(page.locator("h1")).toBeVisible();

      const metrics = await page.evaluate(() => ({
        overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
        heroHeight: document.querySelector("main section")?.getBoundingClientRect().height ?? 0,
        direction: document.documentElement.dir,
      }));

      expect(metrics.overflowX).toBeLessThanOrEqual(1);
      expect(metrics.direction).toBe("rtl");
      if (viewport.width === 390) expect(metrics.scrollHeight / viewport.height).toBeLessThanOrEqual(13);
      if (viewport.width === 768) expect(metrics.heroHeight).toBeLessThanOrEqual(1_200);
    });
  }

  for (const path of ["/", "/about", "/gallery", "/library", "/programs/influential-speaker"]) {
    for (const viewport of [VIEWPORTS[3], VIEWPORTS[5], VIEWPORTS[7]]) {
      test(`${path} stays readable at ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.addInitScript(() => localStorage.setItem("biklima-lang", "ar"));
        await page.goto(path);
        await expect(page.locator("h1")).toHaveCount(1);
        const overflowX = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflowX).toBeLessThanOrEqual(1);
      });
    }
  }

  test("mobile controls use accessible touch heights", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[3]);
    await page.addInitScript(() => localStorage.setItem("biklima-lang", "ar"));
    await page.goto("/");
    await page.addStyleTag({
      content: "*,*::before,*::after{animation:none!important;transition:none!important;transform:none!important}",
    });

    const undersized = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="tab"],input,select,textarea')]
        .filter((element) => !element.matches('input[type="checkbox"],input[type="radio"]'))
        .filter((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== "none"
            && style.visibility !== "hidden"
            && rect.width > 0
            && rect.height > 0
            && (rect.height < 44 || rect.width < 44);
        })
        .map((element) => ({
          label: element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 50) || element.tagName,
          height: element.getBoundingClientRect().height,
          width: element.getBoundingClientRect().width,
        })),
    );
    expect(undersized).toEqual([]);
  });

  test("language choice synchronizes the document direction", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[3]);
    await page.addInitScript(() => localStorage.setItem("biklima-lang", "en"));
    await page.goto("/about");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });
});
