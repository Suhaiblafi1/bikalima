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
    const page = await admin.newPage();
    const response = await page.request.get(STATUS_URL);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    // Seeded off: a billed feature does not arrive switched on.
    expect(body.flagEnabled).toBe(false);
    expect(body.configured).toBe(false);
    expect(body.missingEnvVars).toContain("MINIMAX_API_KEY");
    expect(body.model).toBeTruthy();
    expect(body.limits.maxDuration).toBe(15);
    await page.close();
  });

  test("with the flag off, no request reaches the provider", async ({ admin }) => {
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

  test("the cron reconciler refuses an unauthenticated call", async ({ anon }) => {
    const page = await anon.newPage();
    const response = await page.request.post("/api/cron/video-generation-reconcile");
    expect(response.status()).toBe(401);
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
