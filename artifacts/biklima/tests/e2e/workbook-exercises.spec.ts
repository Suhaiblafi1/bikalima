import { expect, test } from "../fixtures/auth";
import { TEST_FIXTURES } from "../fixtures/data";

const WB = TEST_FIXTURES.workbook;
const READ_PATH = `/workbooks/${WB.slug}/read`;

/**
 * Every assertion here covers something that fails silently. A broken
 * entitlement check still returns 200; a trainer scope that stops filtering
 * still returns a list; an award that pays twice still returns success. The
 * only way any of it surfaces is a test that names the number.
 */

/** The learner's own submission for a page, via their session. */
async function submissionFor(learner: { request: { get: (u: string) => Promise<{ json: () => Promise<unknown> }> } }, pageNumber: number) {
  const res = await learner.request.get(`/api/workbooks/${WB.slug}/pages/${pageNumber}`);
  const body = (await res.json()) as { submission: { id: string; status: string; decision: string | null; awardedPoints: number } | null };
  return body.submission;
}

async function skillPoints(learner: { request: { get: (u: string) => Promise<{ json: () => Promise<unknown> }> } }, key: string) {
  const res = await learner.request.get("/api/me/skills");
  const body = (await res.json()) as { skills: Record<string, number> };
  return body.skills[key] ?? 0;
}

test("a written exercise is submitted, graded, and pays its skill points once", async ({ learner, trainer }) => {
  const before = await skillPoints(learner, WB.skillKey);

  const posted = await learner.request.post(`/api/workbook-pages/${(await pageId(learner, 1))}/submission`, {
    data: { content: "افتتاحيتي الأولى، ثم الثانية، ثم الثالثة." },
  });
  expect(posted.status()).toBe(201);

  const mine = await submissionFor(learner, 1);
  expect(mine?.status).toBe("submitted");
  expect(mine?.decision).toBeNull();

  // The trainer teaches the course this workbook is linked to, so it is theirs.
  const queue = await trainer.request.get("/api/instructor/workbook-submissions?status=submitted");
  expect(queue.ok()).toBeTruthy();
  const { submissions } = (await queue.json()) as { submissions: Array<{ id: string; skillKey: string; skillPoints: number }> };
  const row = submissions.find((s) => s.id === mine!.id);
  expect(row, "the trainer's queue must contain their learner's submission").toBeTruthy();
  expect(row!.skillKey).toBe(WB.skillKey);
  expect(row!.skillPoints).toBe(WB.skillPoints);

  const pass = await trainer.request.post(`/api/instructor/workbook-submissions/${mine!.id}/review`, {
    data: { decision: "pass", feedback: "افتتاحية قوية." },
  });
  expect(pass.ok()).toBeTruthy();
  expect(((await pass.json()) as { skillPointsChanged: number }).skillPointsChanged).toBe(WB.skillPoints);
  expect(await skillPoints(learner, WB.skillKey)).toBe(before + WB.skillPoints);

  // Passing the same row again must move nothing. This is the assertion the
  // awardedPoints column exists for: without it a re-review pays twice.
  const again = await trainer.request.post(`/api/instructor/workbook-submissions/${mine!.id}/review`, {
    data: { decision: "pass" },
  });
  expect(((await again.json()) as { skillPointsChanged: number }).skillPointsChanged).toBe(0);
  expect(await skillPoints(learner, WB.skillKey)).toBe(before + WB.skillPoints);

  // Downgrading takes back exactly what the pass granted — no more.
  const down = await trainer.request.post(`/api/instructor/workbook-submissions/${mine!.id}/review`, {
    data: { decision: "needs_revision", feedback: "وسّع الجملة الأخيرة." },
  });
  expect(((await down.json()) as { skillPointsChanged: number }).skillPointsChanged).toBe(-WB.skillPoints);
  expect(await skillPoints(learner, WB.skillKey)).toBe(before);
});

test("resubmitting after a revision reuses the one row and clears the stale verdict", async ({ learner }) => {
  const id = await pageId(learner, 1);
  await learner.request.post(`/api/workbook-pages/${id}/submission`, { data: { content: "صيغة أولى." } });
  const first = await submissionFor(learner, 1);

  const second = await learner.request.post(`/api/workbook-pages/${id}/submission`, {
    data: { content: "صيغة منقّحة." },
  });
  expect(second.status()).toBe(201);
  const after = await submissionFor(learner, 1);

  // Same row, reopened — not a second copy queued behind the first.
  expect(after!.id).toBe(first!.id);
  expect(after!.status).toBe("submitted");
  expect(after!.decision).toBeNull();

  const listed = await learner.request.get(`/api/workbooks/${WB.slug}/submissions`);
  const { submissions } = (await listed.json()) as { submissions: Array<{ pageNumber: number }> };
  expect(submissions.filter((s) => s.pageNumber === 1)).toHaveLength(1);
});

test("each exercise accepts only the kind of answer it asked for", async ({ learner }) => {
  const textPage = await pageId(learner, 1);
  const videoPage = await pageId(learner, WB.videoPageNumber);

  // Typing at a "record your speech" exercise is refused, not stored in the
  // wrong column where a trainer would find an empty video link.
  const typedAtVideo = await learner.request.post(`/api/workbook-pages/${videoPage}/submission`, {
    data: { content: "أكتب بدل أن أصوّر." },
  });
  expect(typedAtVideo.status()).toBe(400);

  const linkedAtText = await learner.request.post(`/api/workbook-pages/${textPage}/submission`, {
    data: { videoUrl: "https://example.com/clip" },
  });
  expect(linkedAtText.status()).toBe(400);

  const proper = await learner.request.post(`/api/workbook-pages/${videoPage}/submission`, {
    data: { videoUrl: "https://example.com/my-speech" },
  });
  expect(proper.status()).toBe(201);
});

test("a learner who does not own the workbook cannot submit to it", async ({ learner, admin }) => {
  // The locked workbook has no order for this learner. Page ids come from the
  // admin, who can read every workbook — so the id is real and only the
  // entitlement is missing, which is exactly what must stop the write.
  const toc = await admin.request.get(`/api/workbooks/${TEST_FIXTURES.lockedWorkbook.slug}/pages`);
  expect(toc.ok()).toBeTruthy();
  const { pages } = (await toc.json()) as { pages: Array<{ id: string }> };
  test.skip(pages.length === 0, "locked workbook has no pages seeded");

  const res = await learner.request.post(`/api/workbook-pages/${pages[0].id}/submission`, {
    data: { content: "لا ينبغي أن يُحفظ." },
  });
  expect(res.status()).toBe(403);
});

test("a learner cannot read the trainer queue or grade their own work", async ({ learner }) => {
  const id = await pageId(learner, 1);
  await learner.request.post(`/api/workbook-pages/${id}/submission`, { data: { content: "إجابتي." } });
  const mine = await submissionFor(learner, 1);

  expect((await learner.request.get("/api/instructor/workbook-submissions")).status()).toBe(403);
  const selfGrade = await learner.request.post(`/api/instructor/workbook-submissions/${mine!.id}/review`, {
    data: { decision: "pass" },
  });
  expect(selfGrade.status()).toBe(403);
});

/** Page ids are not stable across runs, so read them from the reader itself. */
async function pageId(
  ctx: { request: { get: (u: string) => Promise<{ json: () => Promise<unknown> }> } },
  pageNumber: number,
): Promise<string> {
  const res = await ctx.request.get(`/api/workbooks/${WB.slug}/pages/${pageNumber}`);
  const body = (await res.json()) as { page: { id: string } };
  return body.page.id;
}
