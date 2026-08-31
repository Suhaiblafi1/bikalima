import { expect, test } from "../fixtures/auth";
import { TEST_FIXTURES } from "../fixtures/data";
import { TEXT_RUBRIC } from "@workspace/assessment";

const WB = TEST_FIXTURES.workbook;

/**
 * The grading screen, driven the way a trainer drives it.
 *
 * The API specs prove the server refuses a pass without a rubric. This proves
 * the trainer finds that out before writing four notes, and that the learner
 * is afterwards shown what earned each mark rather than a bare verdict — the
 * two halves of the change that only exist in the browser.
 */
test("a trainer grades on the rubric, and the learner reads the marks back", async ({
  learner,
  trainer,
}) => {
  // Before answering, the learner can read the standard they will be held to.
  // A rubric the graded person cannot see spends the cost of writing one and
  // keeps almost none of the benefit.
  const before = await learner.newPage();
  await before.goto(`/workbooks/${WB.slug}/read`);
  const brief = before.getByTestId("rubric-brief");
  await expect(brief).toBeVisible();
  await brief.getByText("على ماذا سأُقيَّم؟").click();
  for (const c of TEXT_RUBRIC.criteria) {
    await expect(brief).toContainText(c.titleAr);
    await expect(brief).toContainText(c.levels[3].descriptorAr);
  }
  await before.close();

  await learner.request.post(`/api/workbook-pages/${await pageId(learner)}/submission`, {
    data: { content: "افتتاحيةٌ كتبتها لأُقيَّم عليها على سلّم المعايير." },
  });

  const page = await trainer.newPage();
  await page.goto("/trainer");
  // The workbook queue lives in the "courses" tab panel.
  await page.locator("#trainer-tab-courses").click();
  const queue = page.getByTestId("trainer-workbook-queue");
  await expect(queue).toBeVisible();

  const item = queue.getByTestId("workbook-queue-item").first();
  await item.getByTestId("workbook-queue-open").click();

  // Every criterion is on screen with all four descriptors — the rubric is the
  // control, not a tooltip on it.
  const grader = item.getByTestId("rubric-grader");
  await expect(grader).toBeVisible();
  for (const c of TEXT_RUBRIC.criteria) {
    await expect(item.getByTestId(`rubric-criterion-${c.key}`)).toBeVisible();
    for (const level of c.levels) {
      await expect(
        item.getByTestId(`rubric-criterion-${c.key}`).getByText(level.descriptorAr, { exact: true }),
      ).toBeVisible();
    }
  }

  // The button the server would refuse is the button that is disabled.
  const passButton = item.getByTestId("workbook-queue-pass");
  await expect(passButton).toBeDisabled();
  await expect(item.getByTestId("rubric-summary")).toContainText("قيّم كل المعايير");

  // Mark three of four: still refused, because "almost graded" is not graded.
  await item.getByTestId("rubric-level-idea_clarity-4").click();
  await item.getByTestId("rubric-level-structure-3").click();
  await item.getByTestId("rubric-level-impact-3").click();
  await expect(passButton).toBeDisabled();

  await item.getByTestId("rubric-level-brief-4").click();
  await expect(passButton).toBeEnabled();

  // The consequence of the marks is visible before they are committed.
  const summary = item.getByTestId("rubric-summary");
  await expect(summary).toContainText("%");
  await expect(summary).toContainText("اجتاز");
  await expect(item.getByTestId("rubric-preview")).toContainText("الفكرة");

  await item.getByTestId(`rubric-note-structure`).fill("رتّب الجملة الثانية قبل الثالثة.");
  await passButton.click();

  // Now the learner's side: the marks, not just the verdict.
  const readerPage = await learner.newPage();
  await readerPage.goto(`/workbooks/${WB.slug}/read`);
  const verdict = readerPage.getByTestId("workbook-exercise-verdict");
  await expect(verdict).toBeVisible();
  const result = verdict.getByTestId("rubric-result");
  await expect(result).toBeVisible();
  await expect(result.getByTestId("rubric-result-criterion")).toHaveCount(TEXT_RUBRIC.criteria.length);
  await expect(result.getByTestId("rubric-percent")).toBeVisible();
  // The descriptor that was awarded, and the trainer's note against it.
  await expect(result).toContainText(TEXT_RUBRIC.criteria[0].levels[3].descriptorAr);
  await expect(result).toContainText("رتّب الجملة الثانية قبل الثالثة.");
  // Points named per skill, because one answer credited three of them.
  await expect(result.getByTestId("rubric-breakdown")).toContainText("الفكرة");
  await expect(result.getByTestId("rubric-breakdown")).toContainText("البناء");

  await page.close();
  await readerPage.close();

  // Hand the fixture page back the way it was found. A pass left standing
  // makes the exercise read-only for whatever runs next, and turns the API
  // spec's absolute amounts into deltas against this test's 17 points.
  const graded = await learner.request.get(`/api/workbooks/${WB.slug}/pages/1`);
  const { submission } = (await graded.json()) as { submission: { id: string } | null };
  if (submission) {
    await trainer.request.post(`/api/instructor/workbook-submissions/${submission.id}/review`, {
      data: { decision: "needs_revision" },
    });
  }
});

/** Page ids are not stable across runs, so read them from the reader itself. */
async function pageId(ctx: {
  request: { get: (u: string) => Promise<{ json: () => Promise<unknown> }> };
}): Promise<string> {
  const res = await ctx.request.get(`/api/workbooks/${WB.slug}/pages/1`);
  const body = (await res.json()) as { page: { id: string } };
  return body.page.id;
}
