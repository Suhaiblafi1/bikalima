import { expect, test } from "../fixtures/auth";
import { TEST_FIXTURES } from "../fixtures/data";

const WB = TEST_FIXTURES.workbook;
const READ_PATH = `/workbooks/${WB.slug}/read`;

test("a learner who owns the workbook reads its page in the platform", async ({ learner }) => {
  const page = await learner.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("biklima-lang", "ar"));
  await page.goto(READ_PATH);

  await expect(page.getByTestId("workbook-reader")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: WB.titleAr })).toBeVisible();
  await expect(page.getByText(WB.sectionAr)).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: WB.pageTitleAr })).toBeVisible();

  // A blank line in the authored body becomes two paragraphs, not one run-on.
  const paragraphs = page.getByTestId("workbook-page-body").locator("p");
  await expect(paragraphs).toHaveCount(2);
  await expect(paragraphs.first()).toHaveText(WB.bodyFirstParagraph);
  await expect(paragraphs.nth(1)).toHaveText(WB.bodySecondParagraph);
  await expect(page.getByText(WB.exerciseAr)).toBeVisible();

  await page.close();
});

test("the draft page is absent from the reader and refused on a direct request", async ({ learner }) => {
  const page = await learner.newPage();
  await page.addInitScript(() => localStorage.setItem("biklima-lang", "ar"));
  await page.goto(READ_PATH);
  await expect(page.getByTestId("workbook-reader")).toBeVisible();

  // Page 2 is a draft, so the learner's index skips it: the reader offers
  // page 3 next, never the draft.
  await expect(page.getByText(WB.draftTitleAr)).toHaveCount(0);

  // ...and asking for the draft by number is refused rather than served.
  const direct = await learner.request.get(`/api/workbooks/${WB.slug}/pages/2`);
  expect(direct.status()).toBe(404);

  const toc = await learner.request.get(`/api/workbooks/${WB.slug}/pages`);
  expect(toc.ok()).toBeTruthy();
  const body = (await toc.json()) as { totalPages: number; pages: Array<{ pageNumber: number }> };
  // The two published pages, with the draft in between omitted — the point of
  // the assertion is the absence of 2, not the count itself.
  expect(body.pages.map((p) => p.pageNumber)).toEqual([1, WB.videoPageNumber]);
  expect(body.totalPages).toBe(2);

  await page.close();
});

test("an admin proofing the workbook sees the draft the learner cannot", async ({ admin }) => {
  const toc = await admin.request.get(`/api/workbooks/${WB.slug}/pages`);
  expect(toc.ok()).toBeTruthy();
  const body = (await toc.json()) as { totalPages: number; pages: Array<{ pageNumber: number }> };
  // An admin sees the draft too, so their index is one longer than a learner's.
  expect(body.pages.map((p) => p.pageNumber)).toEqual([1, 2, WB.videoPageNumber]);
  expect(body.totalPages).toBe(3);

  const draft = await admin.request.get(`/api/workbooks/${WB.slug}/pages/2`);
  expect(draft.ok()).toBeTruthy();
});

test("a learner without an order is refused the workbook", async ({ learner }) => {
  const page = await learner.newPage();
  await page.addInitScript(() => localStorage.setItem("biklima-lang", "ar"));
  await page.goto(`/workbooks/${TEST_FIXTURES.lockedWorkbook.slug}/read`);

  await expect(page.getByTestId("workbook-locked")).toBeVisible();
  await expect(page.getByTestId("workbook-page-body")).toHaveCount(0);

  const res = await learner.request.get(`/api/workbooks/${TEST_FIXTURES.lockedWorkbook.slug}/pages`);
  expect(res.status()).toBe(403);

  await page.close();
});

test("a note written on a page is kept, and stays private to its author", async ({ learner, admin }) => {
  const page = await learner.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("biklima-lang", "ar"));
  await page.goto(READ_PATH);
  await expect(page.getByTestId("workbook-reader")).toBeVisible();

  const before = await page.getByTestId("workbook-note").count();
  const text = `ملاحظة اختبار ${Date.now()}`;
  await page.getByTestId("workbook-note-input").fill(text);
  await page.getByTestId("workbook-note-save").click();

  await expect(page.getByTestId("workbook-note")).toHaveCount(before + 1);
  await expect(page.getByText(text)).toBeVisible();

  // Find the note through the author's own listing, then confirm nobody else
  // can reach it — not even an admin, who can read every page.
  const listed = await learner.request.get(`/api/workbooks/${WB.slug}/notes`);
  expect(listed.ok()).toBeTruthy();
  const { notes } = (await listed.json()) as { notes: Array<{ id: string; content: string }> };
  const mine = notes.find((n) => n.content === text);
  expect(mine).toBeTruthy();

  const adminPatch = await admin.request.patch(`/api/workbook-notes/${mine!.id}`, {
    data: { content: "محاولة تعديل" },
  });
  expect(adminPatch.status()).toBe(404);
  const adminDelete = await admin.request.delete(`/api/workbook-notes/${mine!.id}`);
  expect(adminDelete.status()).toBe(404);

  // The author still owns it.
  const ownerDelete = await learner.request.delete(`/api/workbook-notes/${mine!.id}`);
  expect(ownerDelete.ok()).toBeTruthy();

  await page.close();
});

test("authoring rejects a page number already used in the workbook", async ({ admin }) => {
  const workbookId = process.env.E2E_WORKBOOK_ID;
  expect(workbookId, "globalSetup must expose E2E_WORKBOOK_ID").toBeTruthy();

  const duplicate = await admin.request.post(`/api/admin/workbooks/${workbookId}/pages`, {
    data: { pageNumber: 1, bodyAr: "صفحة مكررة" },
  });
  // A unique violation must surface as a conflict the author can act on,
  // not as an opaque 500.
  expect(duplicate.status()).toBe(409);

  const created = await admin.request.post(`/api/admin/workbooks/${workbookId}/pages`, {
    data: { pageNumber: 99, titleAr: "صفحة مضافة", bodyAr: "نص الصفحة المضافة." },
  });
  expect(created.status()).toBe(201);
  const { page } = (await created.json()) as { page: { id: string } };
  await admin.request.delete(`/api/admin/workbook-pages/${page.id}`);
});

test("a learner cannot author workbook pages", async ({ learner }) => {
  const res = await learner.request.post(
    `/api/admin/workbooks/${process.env.E2E_WORKBOOK_ID}/pages`,
    { data: { pageNumber: 50, bodyAr: "لا ينبغي أن تُحفظ." } },
  );
  expect(res.status()).toBe(403);
});
