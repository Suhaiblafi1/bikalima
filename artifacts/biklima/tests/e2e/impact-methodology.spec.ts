import { expect, test } from "../fixtures/auth";

/**
 * The impact page shows one of two sets of numbers — the live counts computed
 * from the database, or the published figures the home page stands behind —
 * and it explains its numbers in three places: the subheading, the stories
 * blurb, and the "كيف نقيس؟" cards.
 *
 * The bug worth a test is not a crash. It is the page explaining how it counts
 * certificates on a screen that displays a count of countries: every word still
 * renders, and every word is about numbers that are not there. So each case
 * below pins the wording to the numbers actually on screen.
 */
type Stat = { key: string; labelAr: string; labelEn: string; value: string; isOverridden: boolean };

function stat(key: string, value: string): Stat {
  return { key, labelAr: key, labelEn: key, value, isOverridden: false };
}

const LIVE_PROMISE = "تُحدَّث تلقائياً من قاعدة بياناتنا";

test("with every computed count at zero, the page shows and explains the published figures", async ({ anon }) => {
  const page = await anon.newPage();
  await page.route("**/api/impact", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        stats: [stat("trainees_total", "0"), stat("speeches_evaluated", "0"), stat("certificates_issued", "0"), stat("completion_rate", "0%")],
        stories: [],
      }),
    }),
  );
  await page.goto("/impact");

  const method = page.locator('[data-testid="impact-method-published"]');
  await expect(method).toBeVisible();
  await expect(page.locator('[data-testid="impact-method-computed"]')).toHaveCount(0);

  // The four published figures, and only those, are described. Asserted on the
  // section itself and not on the body: "البرامج" is also a footer heading.
  await expect(method.locator("h3")).toHaveText(["المتدرّبون", "الدول", "البرامج", "المدرّبون"]);

  // And no sentence left over that still promises live database numbers.
  await expect(page.locator("body")).not.toContainText(LIVE_PROMISE);
});

test("once a computed count is real, both the numbers and their explanations switch", async ({ anon }) => {
  const page = await anon.newPage();
  await page.route("**/api/impact", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        stats: [stat("trainees_total", "12"), stat("speeches_evaluated", "5"), stat("certificates_issued", "0"), stat("completion_rate", "0%")],
        stories: [],
      }),
    }),
  );
  await page.goto("/impact");

  const method = page.locator('[data-testid="impact-method-computed"]');
  await expect(method).toBeVisible();
  await expect(page.locator('[data-testid="impact-method-published"]')).toHaveCount(0);

  // Two counts came back real and two came back zero. The zeros are filtered
  // out of the grid, so their methodology cards must go with them — otherwise
  // the page explains how it counts certificates and shows no certificates.
  await expect(page.locator('[data-testid^="impact-stat-value-"]')).toHaveText(["12", "5"]);
  await expect(method.locator("h3")).toHaveText(["المتدرّبون", "الخطابات المُقيَّمة"]);

  await expect(page.locator("body")).toContainText(LIVE_PROMISE);
});

test("when the numbers fail to load, the consultation button survives", async ({ anon }) => {
  const page = await anon.newPage();
  await page.route("**/api/impact", (route) => route.fulfill({ status: 500, body: "boom" }));
  await page.goto("/impact");

  // The methodology section carries the page's only call to action. An earlier
  // attempt hid the whole section whenever it had no cards to show, which took
  // the button down on every failed load.
  await expect(page.locator('[data-testid="impact-cta-consultation"]')).toBeVisible();
  await expect(page.getByText("تعذّر تحميل الأرقام")).toBeVisible();
});
