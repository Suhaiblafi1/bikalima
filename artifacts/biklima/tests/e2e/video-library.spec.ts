import { expect, test } from "../fixtures/auth";

/**
 * The public library section reads published «من الميدان» rows on top of its
 * static curated list. Three properties matter and none of them is obvious
 * from the code alone: a published row reaches visitors, a draft never does,
 * and an uploaded MP4 plays in a real player rather than a YouTube iframe
 * (the section was YouTube-only until it had to show our own clips).
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

    await expect(page.getByText(PUBLISHED_TITLE)).toBeVisible();
    // Its skill chip and description come from the CMS row, not the static list.
    await expect(page.getByText("مهارة اختبارية")).toBeVisible();
    // A draft is admin-only work in progress.
    await expect(page.getByText(DRAFT_TITLE)).toHaveCount(0);
    // The curated list is still the spine of the section.
    await expect(page.getByText("خطاب من الميدان").first()).toBeVisible();
    await page.close();
  });

  test("an uploaded clip plays in a file player, not a YouTube frame", async ({ admin, anon }) => {
    const adminPage = await admin.newPage();
    const response = await adminPage.request.post(ADMIN_MEDIA_URL, {
      data: {
        titleAr: UPLOAD_TITLE,
        mediaType: "upload",
        mediaUrl: UPLOAD_URL,
        placement: ["library"],
        status: "published",
      },
    });
    expect(response.status()).toBe(201);
    created.push((await response.json()).item.id);
    await adminPage.close();

    const page = await anon.newPage();
    await page.goto("/library");
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
