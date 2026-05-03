import { test, expect } from "../fixtures/auth";
import { TEST_FIXTURES } from "../fixtures/data";

/**
 * Happy-path learner journey. The steps mirror the audit's required flow:
 *   anonymous browse → enroll → pay → access lesson → submit speech →
 *   evaluation visible → see badge → download certificate → graduates page.
 *
 * The seeded test course (`e2e-test-course`) is free, so the order endpoint
 * exercises the same code path real paid orders use, but completes the
 * enrollment immediately without hitting Stripe. The seed also pre-publishes
 * a speech evaluation, awards a badge, attaches a certificate file URL, and
 * forces the `graduates_page` feature flag on so the public registry assertion
 * is deterministic.
 */
test.describe.serial("learner happy path", () => {
  test("anonymous visitor can browse the public site", async ({ anon }) => {
    const page = await anon.newPage();
    const res = await page.goto("/");
    expect(res?.ok(), "homepage should respond 2xx").toBeTruthy();
    await expect(page).toHaveTitle(/بكلمة|Bikalima/i);
    await page.close();
  });

  test("learner can enroll via the order API and reach the learn page", async ({
    learner,
  }) => {
    const page = await learner.newPage();

    // Place a (free) order — same endpoint a paid checkout would call.
    const orderResp = await page.request.post("/api/orders", {
      data: {
        courseId: process.env.E2E_COURSE_ID,
        buyerName: `${TEST_FIXTURES.learner.firstName} ${TEST_FIXTURES.learner.lastName}`,
        buyerEmail: TEST_FIXTURES.learner.email,
        buyerPhone: "0790000000",
      },
    });
    expect(orderResp.ok(), `order should succeed: ${await orderResp.text()}`).toBeTruthy();
    const orderJson = await orderResp.json();
    expect(orderJson.success).toBe(true);

    // Learn page should load with enrollment recognised.
    const accessResp = await page.request.get(
      `/api/courses/${TEST_FIXTURES.course.slug}/access`,
    );
    expect(accessResp.ok()).toBeTruthy();
    expect(await accessResp.json()).toMatchObject({ hasAccess: true });

    await page.goto(`/courses/${TEST_FIXTURES.course.slug}/learn`);
    await expect(page.locator("body")).toContainText(
      new RegExp(
        `${TEST_FIXTURES.course.titleEn}|${TEST_FIXTURES.course.titleAr.slice(0, 6)}`,
      ),
    );
    await page.close();
  });

  test("anyone can submit a speech evaluation request", async ({ anon }) => {
    const page = await anon.newPage();
    const resp = await page.request.post("/api/speech-evaluation", {
      data: {
        fullName: "زائر اختبار",
        email: `e2e.speech+${Date.now()}@bikalima.test`,
        whatsapp: "0790000000",
        speechText:
          "هذا نص خطاب اختباري أرسل عبر مجموعة اختبارات النهاية إلى النهاية للتحقق من المسار.",
        speechTopic: "Test",
        speechLanguage: "ar",
      },
    });
    expect(
      resp.ok(),
      `speech eval should succeed: ${await resp.text()}`,
    ).toBeTruthy();
    await page.close();
  });

  test("learner sees the published evaluation report", async ({ learner }) => {
    const page = await learner.newPage();
    const resp = await page.request.get("/api/me/speech-evaluations");
    expect(resp.ok(), `me/speech-evaluations failed: ${await resp.text()}`).toBeTruthy();
    const json = await resp.json();
    expect(Array.isArray(json.evaluations)).toBe(true);

    // Find the seeded, published evaluation by topic.
    const published = json.evaluations.find(
      (e: { speechTopic: string | null; reportPublishedAt: string | null }) =>
        e.speechTopic === TEST_FIXTURES.speechEvaluation.topic &&
        e.reportPublishedAt,
    );
    expect(
      published,
      "seeded published evaluation should be visible to the learner",
    ).toBeTruthy();
    expect(published.overallScore).toBe(TEST_FIXTURES.speechEvaluation.overallScore);
    expect(published.finalReportMd).toContain("E2E Final Report");
    expect(published.programRecommendation).toBe("core");
    await page.close();
  });

  test("learner has the seeded badge on /api/my/badges", async ({ learner }) => {
    const page = await learner.newPage();
    const resp = await page.request.get("/api/my/badges");
    expect(resp.ok(), `my/badges failed: ${await resp.text()}`).toBeTruthy();
    const json = await resp.json();
    const badge = json.badges.find(
      (b: { key: string }) => b.key === TEST_FIXTURES.badge.key,
    );
    expect(badge, "seeded e2e badge should be in /my/badges").toBeTruthy();
    expect(badge.earned).toBe(true);
    expect(badge.earnedAt).toBeTruthy();
    expect(json.earnedCount).toBeGreaterThanOrEqual(1);
    await page.close();
  });

  test("certificate is verifiable and downloadable", async ({ learner }) => {
    const page = await learner.newPage();

    // Public verify endpoint — real contract is `/api/verify?code=...`.
    const verifyResp = await page.request.get(
      `/api/verify?code=${encodeURIComponent(TEST_FIXTURES.certificate.code)}`,
    );
    expect(
      verifyResp.ok(),
      `verify failed: ${verifyResp.status()} ${await verifyResp.text()}`,
    ).toBeTruthy();
    const verifyJson = await verifyResp.json();
    expect(verifyJson.found).toBe(true);
    expect(verifyJson.results).toHaveLength(1);
    expect(verifyJson.results[0].code).toBe(TEST_FIXTURES.certificate.code);

    // Public single-cert endpoint — exposes the file URL the UI uses for
    // the "download certificate" affordance.
    const detailResp = await page.request.get(
      `/api/certificates/${encodeURIComponent(TEST_FIXTURES.certificate.code)}`,
    );
    expect(detailResp.ok()).toBeTruthy();
    const detailJson = await detailResp.json();
    expect(detailJson.certificate.code).toBe(TEST_FIXTURES.certificate.code);
    expect(detailJson.certificate.certificateFileUrl).toBe(
      TEST_FIXTURES.certificate.fileUrl,
    );

    // Learner-scoped list — same data, behind auth, used by the dashboard
    // to render the "download" button.
    const mineResp = await page.request.get("/api/me/certificates");
    expect(mineResp.ok()).toBeTruthy();
    const mineJson = await mineResp.json();
    const mine = mineJson.certificates.find(
      (c: { code: string }) => c.code === TEST_FIXTURES.certificate.code,
    );
    expect(mine, "learner should see their seeded certificate").toBeTruthy();
    expect(mine.certificateFileUrl).toBe(TEST_FIXTURES.certificate.fileUrl);

    await page.close();
  });

  test("graduates registry includes the seeded learner", async ({ anon }) => {
    const page = await anon.newPage();

    // API: the public registry must return the seeded card.
    const apiResp = await page.request.get("/api/graduates");
    expect(apiResp.ok()).toBeTruthy();
    const apiJson = await apiResp.json();
    const seeded = apiJson.graduates.find(
      (g: { code: string }) => g.code === TEST_FIXTURES.certificate.code,
    );
    expect(seeded, "seeded graduate should appear in /api/graduates").toBeTruthy();
    expect(seeded.certType).toBe("trainee");

    // Page: with the feature flag forced on by the seed, the route renders
    // (does not redirect home) and contains the seeded full name.
    const nav = await page.goto("/graduates");
    expect(nav?.ok()).toBeTruthy();
    expect(new URL(page.url()).pathname).toBe("/graduates");
    await expect(page.locator("body")).toContainText(
      `${TEST_FIXTURES.learner.firstName} ${TEST_FIXTURES.learner.lastName}`,
    );

    await page.close();
  });
});
