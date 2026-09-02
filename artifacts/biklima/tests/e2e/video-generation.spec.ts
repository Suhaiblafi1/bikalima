import type { BrowserContext } from "@playwright/test";
import { expect, test } from "../fixtures/auth";

/**
 * The generator spends real money per clip, so what these tests protect is
 * the two gates in front of it: only an admin may reach it, and only after
 * both the feature flag and the provider credentials are deliberately
 * opened. CI has no `MINIMAX_API_KEY`, which is exactly the state worth
 * asserting — a request must be refused with a reason the admin panel can
 * act on, and must not leave a job row behind.
 */
const FLAG = "video_generation";
const STATUS_URL = "/api/admin/video-generation/status";
const JOBS_URL = "/api/admin/video-generation/jobs";

/** Marker that lets us prove no row was written for a refused request. */
const MARKER = `e2e-video-gen-${Date.now()}`;

function validBody(prompt = `${MARKER} افتتاحية خطاب قوية أمام جمهور صغير`) {
  return { prompt, duration: 8, ratio: "16:9", resolution: "768P", purpose: "e2e" };
}

async function setFlag(admin: BrowserContext, enabled: boolean) {
  const page = await admin.newPage();
  const response = await page.request.patch(`/api/admin/feature-flags/${FLAG}`, {
    data: { enabled },
  });
  expect(response.ok()).toBeTruthy();
  await page.close();
}

test.describe.serial("admin video generation", () => {
  test("only an admin can see or use the generator", async ({ anon, learner }) => {
    const anonPage = await anon.newPage();
    expect((await anonPage.request.get(STATUS_URL)).status()).toBe(403);
    expect((await anonPage.request.post(JOBS_URL, { data: validBody() })).status()).toBe(403);
    await anonPage.close();

    const learnerPage = await learner.newPage();
    expect((await learnerPage.request.get(STATUS_URL)).status()).toBe(403);
    expect((await learnerPage.request.get(JOBS_URL)).status()).toBe(403);
    expect((await learnerPage.request.post(JOBS_URL, { data: validBody() })).status()).toBe(403);
    await learnerPage.close();
  });

  test("status names which switch is still closed, even while disabled", async ({ admin }) => {
    // Every flag-dependent test sets the flag it needs rather than inheriting
    // it: these run in order, and a failure mid-file must not leave the next
    // run asserting against the wrong gate state.
    await setFlag(admin, false);
    const page = await admin.newPage();
    const response = await page.request.get(STATUS_URL);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    expect(body.flagEnabled).toBe(false);
    expect(body.configured).toBe(false);
    expect(body.missingEnvVars).toContain("MINIMAX_API_KEY");
    expect(body.model).toBeTruthy();
    expect(body.limits.maxDuration).toBe(15);
    await page.close();
  });

  test("with the flag off, no request reaches the provider", async ({ admin }) => {
    await setFlag(admin, false);
    const page = await admin.newPage();

    const created = await page.request.post(JOBS_URL, { data: validBody() });
    expect(created.status()).toBe(503);
    expect(await created.json()).toMatchObject({ reason: "feature_disabled", flag: FLAG });

    const listed = await page.request.get(JOBS_URL);
    expect(listed.status()).toBe(503);
    await page.close();
  });

  test("with the flag on, bad input is refused before the provider is called", async ({ admin }) => {
    await setFlag(admin, true);
    const page = await admin.newPage();

    const tooShort = await page.request.post(JOBS_URL, { data: { ...validBody(), prompt: "قصير" } });
    expect(tooShort.status()).toBe(400);

    const tooLong = await page.request.post(JOBS_URL, { data: { ...validBody(), duration: 30 } });
    expect(tooLong.status()).toBe(400);

    // The provider fetches attachments itself, so a non-https link would
    // fail deep inside its pipeline where the reason never reaches us.
    const insecureAttachment = await page.request.post(JOBS_URL, {
      data: {
        ...validBody(),
        conditions: [{ type: "image_url", url: "http://example.com/frame.png", role: "first_frame" }],
      },
    });
    expect(insecureAttachment.status()).toBe(400);
    expect((await insecureAttachment.json()).error).toContain("https");

    // Audio has no scene to attach a voice to unless an image or video comes with it.
    const loneAudio = await page.request.post(JOBS_URL, {
      data: {
        ...validBody(),
        conditions: [{ type: "audio_url", url: "https://example.com/voice.mp3", role: "reference_audio" }],
      },
    });
    expect(loneAudio.status()).toBe(400);

    const mismatchedRole = await page.request.post(JOBS_URL, {
      data: {
        ...validBody(),
        conditions: [{ type: "image_url", url: "https://example.com/clip.mp4", role: "reference_video" }],
      },
    });
    expect(mismatchedRole.status()).toBe(400);
    await page.close();
  });

  test("a valid request with no credentials is refused, and writes no job", async ({ admin }) => {
    await setFlag(admin, true);
    const page = await admin.newPage();

    const response = await page.request.post(JOBS_URL, { data: validBody() });
    expect(response.status()).toBe(503);
    const body = await response.json();
    expect(body.reason).toBe("not_configured");
    expect(body.missingEnvVars).toContain("MINIMAX_API_KEY");

    // Nothing was queued upstream, so nothing may linger in the job list.
    const listed = await page.request.get(JOBS_URL);
    expect(listed.ok()).toBeTruthy();
    const jobs = (await listed.json()).jobs ?? [];
    expect(jobs.some((job: { prompt?: string }) => job.prompt?.includes(MARKER))).toBe(false);
    await page.close();
  });

  test("status reports storage separately from the generator", async ({ admin }) => {
    const page = await admin.newPage();
    const body = await (await page.request.get(STATUS_URL)).json();

    // Saving a clip is a second capability with its own credentials: the page
    // has to be able to offer generation while saying that keeping the result
    // is not wired up yet.
    expect(body.storage.configured).toBe(false);
    expect(body.storage.missingEnvVars).toContain("STORAGE_PROVIDER");
    await page.close();
  });

  test("saving to the library is admin-only and survives the flag being off", async ({ anon, learner, admin }) => {
    const saveUrl = `${JOBS_URL}/does-not-exist/save-to-library`;
    const data = { titleAr: "عنوان صالح" };

    const anonPage = await anon.newPage();
    expect((await anonPage.request.post(saveUrl, { data })).status()).toBe(403);
    await anonPage.close();

    const learnerPage = await learner.newPage();
    expect((await learnerPage.request.post(saveUrl, { data })).status()).toBe(403);
    await learnerPage.close();

    // With the flag off on purpose: the flag governs new spending, and saving
    // spends nothing — it rescues a clip already paid for whose provider link
    // expires within hours. So this must answer about the job, not the flag.
    await setFlag(admin, false);
    const adminPage = await admin.newPage();
    const response = await adminPage.request.post(saveUrl, { data });
    expect(response.status()).toBe(404);

    // And a request with no usable title never reaches the provider or storage.
    const badTitle = await adminPage.request.post(saveUrl, { data: { titleAr: "ا" } });
    expect(badTitle.status()).toBe(400);
    await adminPage.close();
  });

  test("the cron reconciler refuses an unauthenticated call", async ({ anon }) => {
    const page = await anon.newPage();
    const response = await page.request.post("/api/cron/video-generation-reconcile");
    expect(response.status()).toBe(401);
    await page.close();
  });

  test("the admin page shows which gate is closed instead of a broken form", async ({ admin }) => {
    // Explicit rather than inherited from the previous test: this page's whole
    // job is reporting gate state, so the state has to be the one asserted.
    await setFlag(admin, false);
    const page = await admin.newPage();
    await page.goto("/admin/video-generation");

    // Both gates are shut in CI: the flag is off and there is no key.
    await expect(page.getByTestId("vg-flag-disabled")).toBeVisible();
    await expect(page.getByTestId("vg-not-configured")).toBeVisible();
    // No form while a gate is shut — a submit button that cannot work is worse
    // than no button.
    await expect(page.getByTestId("vg-submit")).toHaveCount(0);

    // Switching the flag on from the banner is the one gate an admin owns.
    await page.getByTestId("vg-enable-flag").click();
    await expect(page.getByTestId("vg-flag-disabled")).toHaveCount(0);
    // Still no credentials, so still no form — but the job list opens.
    await expect(page.getByTestId("vg-not-configured")).toBeVisible();
    await expect(page.getByTestId("vg-submit")).toHaveCount(0);
    await expect(page.getByTestId("vg-jobs-empty")).toBeVisible();
    await page.close();

    await setFlag(admin, false);
  });

  test("a learner cannot reach the generator page", async ({ learner }) => {
    const page = await learner.newPage();
    await page.goto("/admin/video-generation");
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.close();
  });

  test("turning the flag back off closes the door again", async ({ admin }) => {
    await setFlag(admin, false);
    const page = await admin.newPage();
    const response = await page.request.get(JOBS_URL);
    expect(response.status()).toBe(503);
    expect(await response.json()).toMatchObject({ reason: "feature_disabled" });
    await page.close();
  });
});
