import { expect, test } from "../fixtures/auth";
import { TEST_FIXTURES } from "../fixtures/data";

test.describe.serial("authorization and grading boundaries", () => {
  test("draft courses stay out of every public course surface", async ({ anon }) => {
    const page = await anon.newPage();
    const detail = await page.request.get("/api/courses/e2e-private-draft");
    const learn = await page.request.get("/api/courses/e2e-private-draft/learn");
    const listing = await page.request.get("/api/courses");

    expect(detail.status()).toBe(404);
    expect(learn.status()).toBe(404);
    expect(listing.ok()).toBeTruthy();
    const body = await listing.json();
    expect((body.courses ?? []).some((course: { slug?: string }) => course.slug === "e2e-private-draft")).toBe(false);
    await page.close();
  });

  test("an enrolled learner cannot purchase a draft by its id", async ({ learner }) => {
    const page = await learner.newPage();
    const response = await page.request.post("/api/orders", {
      data: {
        courseId: process.env.E2E_DRAFT_COURSE_ID,
        deliveryFormat: "recorded",
        buyerName: `${TEST_FIXTURES.learner.firstName} ${TEST_FIXTURES.learner.lastName}`,
        buyerEmail: TEST_FIXTURES.learner.email,
        buyerPhone: "0790000000",
      },
    });
    expect(response.status()).toBe(404);
    await page.close();
  });

  test("quiz answers stay private and the server ignores client scores", async ({ learner }) => {
    const page = await learner.newPage();
    const list = await page.request.get(`/api/lessons/${process.env.E2E_QUIZ_LESSON_ID}/activities`);
    expect(list.ok()).toBeTruthy();
    const listBody = await list.json();
    const quiz = (listBody.activities ?? []).find(
      (activity: { id: string }) => activity.id === process.env.E2E_QUIZ_ACTIVITY_ID,
    );
    expect(quiz).toBeTruthy();
    expect(quiz.config.questions[0]).not.toHaveProperty("answer");

    const wrong = await page.request.post(`/api/activities/${quiz.id}/submit`, {
      data: { payload: { picks: { 0: 0 } }, autoScore: 100 },
    });
    expect(wrong.ok()).toBeTruthy();
    expect(await wrong.json()).toMatchObject({
      status: "needs_revision",
      grade: { score: 0, passed: false },
    });

    const correct = await page.request.post(`/api/activities/${quiz.id}/submit`, {
      data: { payload: { picks: { 0: 1 } }, autoScore: 0 },
    });
    expect(correct.ok()).toBeTruthy();
    expect(await correct.json()).toMatchObject({
      status: "completed",
      grade: { score: 100, passed: true },
    });
    await page.close();
  });
});
