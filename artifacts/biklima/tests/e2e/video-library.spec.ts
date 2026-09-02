import { expect, test } from "../fixtures/auth";

/**
 * The public library section reads published «من الميدان» rows underneath its
 * static curated list. Four properties matter and none of them is obvious
 * from the code alone: the curated list still leads the section, a published
 * row reaches visitors, a draft never does, and an uploaded MP4 plays in a
 * real player rather than a YouTube iframe (the section was YouTube-only
 * until it had to show our own clips).
 *
 * Because the curated list leads and the grid pages at six, a published row
 * is not on the first page of «الكل» — it is reached through its category
 * tab, which is what these tests navigate. That is the cost of the ordering,
 * and asserting it here is what keeps it deliberate.
 */
const ADMIN_MEDIA_URL = "/api/admin/field-media";
const RUN = Date.now();
const PUBLISHED_TITLE = `فيديو منشور للاختبار ${RUN}`;
const DRAFT_TITLE = `فيديو مسودة للاختبار ${RUN}`;
const UPLOAD_TITLE = `مقطع مرفوع للاختبار ${RUN}`;

/** A tiny valid MP4 would still not play headlessly; the player is what we assert. */
const UPLOAD_URL = "https://media.invalid/e2e/generated-clip.mp4";

test.describe.serial("public video library", () => {
  const created: string[] = [];

  test("a published item reaches visitors and a draft does not", async ({ admin, anon }) => {
    const adminPage = await admin.newPage();

    for (const item of [
      {
        titleAr: PUBLISHED_TITLE,
        mediaType: "youtube",
        mediaUrl: "https://www.youtube.com/watch?v=QRHnlnwcFXI",
        category: "opening",
        targetSkill: "مهارة اختبارية",
        descriptionAr: "وصف اختباري لما ستتعلمه.",
        placement: ["library"],
        status: "published",
      },
      {
        titleAr: DRAFT_TITLE,
        mediaType: "youtube",
        mediaUrl: "https://www.youtube.com/watch?v=qp0HIF3SfI4",
        placement: ["library"],
        status: "draft",
      },
    ]) {
      const response = await adminPage.request.post(ADMIN_MEDIA_URL, { data: item });
      expect(response.status()).toBe(201);
      created.push((await response.json()).item.id);
    }
    await adminPage.close();

    const page = await anon.newPage();
    await page.goto("/library");

    // The curated list leads: the first card in the grid is a static one.
    await expect(page.locator('[data-testid^="library-item-"]').first())
      .toHaveAttribute("data-testid", /^library-item-static-/);
    await expect(page.getByText("خطاب من الميدان").first()).toBeVisible();

    // The published row is reached through its own category tab. Assertions
    // are scoped to that card by id, so a leftover row from an earlier run
    // cannot make this pass or fail for the wrong reason.
    await page.getByRole("tab", { name: /البداية/ }).click();
    const card = page.getByTestId(`library-item-cms-${created[0]}`);
    await expect(card).toBeVisible();
    // Title, skill chip and takeaway all come from the CMS row.
    await expect(card).toContainText(PUBLISHED_TITLE);
    await expect(card).toContainText("مهارة اختبارية");
    await expect(card).toContainText("وصف اختباري لما ستتعلمه.");

    // A draft is admin-only work in progress, in any tab.
    await expect(page.getByText(DRAFT_TITLE)).toHaveCount(0);
    await page.close();
  });

  test("an uploaded clip plays in a file player, not a YouTube frame", async ({ admin, anon }) => {
    const adminPage = await admin.newPage();
    const response = await adminPage.request.post(ADMIN_MEDIA_URL, {
      data: {
        titleAr: UPLOAD_TITLE,
        mediaType: "upload",
        mediaUrl: UPLOAD_URL,
        category: "voice",
        placement: ["library"],
        status: "published",
      },
    });
    expect(response.status()).toBe(201);
    created.push((await response.json()).item.id);
    await adminPage.close();

    const page = await anon.newPage();
    await page.goto("/library");
    await page.getByRole("tab", { name: /الصوت والإيقاع/ }).click();
    await page.getByRole("button", { name: new RegExp(UPLOAD_TITLE) }).click();

    const player = page.getByTestId("library-file-player");
    await expect(player).toBeVisible();
    await expect(player).toHaveAttribute("src", UPLOAD_URL);
    await page.close();
  });

  test("cleanup", async ({ admin }) => {
    const page = await admin.newPage();
    for (const id of created) {
      const response = await page.request.delete(`${ADMIN_MEDIA_URL}/${id}`);
      expect(response.ok()).toBeTruthy();
    }
    await page.close();
  });
});
