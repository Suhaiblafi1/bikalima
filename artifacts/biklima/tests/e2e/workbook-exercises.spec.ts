import type { APIRequestContext } from "@playwright/test";
import { expect, test } from "../fixtures/auth";
import { TEST_FIXTURES } from "../fixtures/data";
import { TEXT_RUBRIC, VIDEO_RUBRIC } from "@workspace/assessment";

const WB = TEST_FIXTURES.workbook;

/** Full marks on every criterion — what an unqualified "pass" used to mean. */
const TEXT_TOP = { idea_clarity: 4, structure: 4, impact: 4, brief: 4 };
const VIDEO_TOP = { voice: 4, body: 4, impact: 4, composure: 4 };

/**
 * Every assertion here covers something that fails silently. A broken
 * entitlement check still returns 200; a trainer scope that stops filtering
 * still returns a list; an award that pays twice still returns success; a
 * rubric gate that stops biting still records a pass. The only way any of it
 * surfaces is a test that names the number.
 */

type Ctx = { request: APIRequestContext };

/** The learner's own submission for a page, via their session. */
async function submissionFor(learner: Ctx, pageNumber: number) {
  const res = await learner.request.get(`/api/workbooks/${WB.slug}/pages/${pageNumber}`);
  const body = (await res.json()) as {
    submission: {
      id: string;
      status: string;
      decision: string | null;
      awardedPoints: number;
      awardedBreakdown: Record<string, number> | null;
      rubricKey: string | null;
      rubricVersion: number | null;
      rubricScores: Record<string, number> | null;
      rubricPercent: number | null;
    } | null;
  };
  return body.submission;
}

async function skillPoints(learner: Ctx, key: string) {
  const res = await learner.request.get("/api/me/skills");
  const body = (await res.json()) as { skills: Record<string, number> };
  return body.skills[key] ?? 0;
}

/**
 * Return one page's row to "nothing paid yet".
 *
 * The assertions below name absolute amounts — a top-marks pass moves exactly
 * 20 — and an amount is only absolute if the row had paid nothing before it.
 * rubric-grading-ui.spec.ts grades this same fixture page earlier in the run
 * and leaves a pass standing, which made those numbers deltas against 17.
 *
 * So the precondition is declared here rather than assumed, and declared
 * through the real review endpoint: clearing the award is the refund path, so
 * the setup exercises the thing it depends on.
 */
async function clearAward(learner: Ctx, trainer: Ctx, pageNumber: number) {
  const mine = await submissionFor(learner, pageNumber);
  if (!mine || mine.awardedPoints === 0) return;
  const res = await trainer.request.post(
    `/api/instructor/workbook-submissions/${mine.id}/review`,
    { data: { decision: "needs_revision" } },
  );
  expect(res.ok(), "clearing a standing award must succeed").toBeTruthy();
  expect((await submissionFor(learner, pageNumber))!.awardedPoints).toBe(0);
}

async function skillMap(learner: Ctx, keys: readonly string[]) {
  const res = await learner.request.get("/api/me/skills");
  const body = (await res.json()) as { skills: Record<string, number> };
  return Object.fromEntries(keys.map((k) => [k, body.skills[k] ?? 0]));
}

test("a written exercise is graded on the rubric and pays each skill once", async ({ learner, trainer }) => {
  await clearAward(learner, trainer, 1);
  const skills = ["idea", "structure", "impact"] as const;
  const before = await skillMap(learner, skills);

  const posted = await learner.request.post(`/api/workbook-pages/${await pageId(learner, 1)}/submission`, {
    data: { content: "افتتاحيتي الأولى، ثم الثانية، ثم الثالثة." },
  });
  expect(posted.status()).toBe(201);

  const mine = await submissionFor(learner, 1);
  expect(mine?.status).toBe("submitted");
  expect(mine?.decision).toBeNull();

  // The trainer teaches the course this workbook is linked to, so it is theirs.
  const queue = await trainer.request.get("/api/instructor/workbook-submissions?status=submitted");
  expect(queue.ok()).toBeTruthy();
  const { submissions } = (await queue.json()) as {
    submissions: Array<{ id: string; exerciseType: string; skillPoints: number }>;
  };
  const row = submissions.find((s) => s.id === mine!.id);
  expect(row, "the trainer's queue must contain their learner's submission").toBeTruthy();
  expect(row!.exerciseType).toBe("text");
  expect(row!.skillPoints).toBe(WB.skillPoints);

  const pass = await trainer.request.post(`/api/instructor/workbook-submissions/${mine!.id}/review`, {
    data: {
      decision: "pass",
      feedback: "افتتاحية قوية.",
      rubric: TEXT_TOP,
      rubricVersion: TEXT_RUBRIC.version,
      rubricNotes: { structure: "الترتيب هو ما رفع النصّ." },
    },
  });
  expect(pass.ok()).toBeTruthy();
  const paid = (await pass.json()) as {
    skillPointsChanged: number;
    awardedBreakdown: Record<string, number>;
    rubricPercent: number;
  };

  // Full marks pay the page's points in full, split across the three skills a
  // written answer can actually demonstrate.
  expect(paid.rubricPercent).toBe(100);
  expect(paid.skillPointsChanged).toBe(WB.skillPoints);
  expect(paid.awardedBreakdown).toEqual({ idea: 8, structure: 7, impact: 5 });
  const after = await skillMap(learner, skills);
  for (const key of skills) {
    expect(after[key] - before[key], `skill ${key}`).toBe(paid.awardedBreakdown[key]);
  }

  // The marks themselves are recorded, with the rubric revision they were made
  // against — a reworded descriptor must not silently redefine an old "3".
  const graded = await submissionFor(learner, 1);
  expect(graded!.rubricKey).toBe("text");
  expect(graded!.rubricVersion).toBe(TEXT_RUBRIC.version);
  expect(graded!.rubricScores).toEqual(TEXT_TOP);
  expect(graded!.awardedPoints).toBe(WB.skillPoints);

  // Passing the same row again must move nothing. This is the assertion the
  // awardedBreakdown column exists for: without it a re-review pays twice.
  const again = await trainer.request.post(`/api/instructor/workbook-submissions/${mine!.id}/review`, {
    data: { decision: "pass", rubric: TEXT_TOP, rubricVersion: TEXT_RUBRIC.version },
  });
  expect(((await again.json()) as { skillPointsChanged: number }).skillPointsChanged).toBe(0);
  expect(await skillMap(learner, skills)).toEqual(after);

  // Downgrading takes back exactly what the pass granted, from every skill it
  // touched — not just the one the page names.
  const down = await trainer.request.post(`/api/instructor/workbook-submissions/${mine!.id}/review`, {
    data: { decision: "needs_revision", feedback: "وسّع الجملة الأخيرة." },
  });
  expect(((await down.json()) as { skillPointsChanged: number }).skillPointsChanged).toBe(-WB.skillPoints);
  expect(await skillMap(learner, skills)).toEqual(before);
});

test("a weaker answer earns part of the points, not none and not all", async ({ learner, trainer }) => {
  // The old grading had two outcomes: the whole 20 or nothing. Solid-but-not-
  // outstanding work is the case that had nowhere to land.
  await clearAward(learner, trainer, 1);
  const skills = ["idea", "structure", "impact"] as const;
  const before = await skillMap(learner, skills);
  await learner.request.post(`/api/workbook-pages/${await pageId(learner, 1)}/submission`, {
    data: { content: "إجابة متوسّطة المستوى." },
  });
  const mine = await submissionFor(learner, 1);

  const res = await trainer.request.post(`/api/instructor/workbook-submissions/${mine!.id}/review`, {
    data: {
      decision: "pass",
      rubric: { idea_clarity: 3, structure: 3, impact: 3, brief: 3 },
      rubricVersion: TEXT_RUBRIC.version,
    },
  });
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as {
    skillPointsChanged: number;
    awardedBreakdown: Record<string, number>;
    rubricPercent: number;
  };
  expect(body.rubricPercent).toBe(67);
  expect(body.awardedBreakdown).toEqual({ idea: 5, structure: 5, impact: 3 });
  expect(body.skillPointsChanged).toBe(13);
  expect(body.skillPointsChanged).toBeLessThan(WB.skillPoints);

  const after = await skillMap(learner, skills);
  for (const key of skills) expect(after[key] - before[key], key).toBe(body.awardedBreakdown[key]);

  // Put the learner back where the test found them.
  await trainer.request.post(`/api/instructor/workbook-submissions/${mine!.id}/review`, {
    data: { decision: "needs_revision" },
  });
  expect(await skillMap(learner, skills)).toEqual(before);
});

test("a recorded speech credits the four skills it shows at once", async ({ learner, trainer }) => {
  // This is what the single skill_key could not express: one recording is
  // evidence of voice, body language, impact and composure together, and the
  // old award picked one of them and discarded the rest.
  await clearAward(learner, trainer, WB.videoPageNumber);
  const skills = ["voice", "body", "impact", "confidence"] as const;
  const before = await skillMap(learner, skills);

  await learner.request.post(`/api/workbook-pages/${await pageId(learner, WB.videoPageNumber)}/submission`, {
    data: { videoUrl: "https://example.com/my-speech" },
  });
  const mine = await submissionFor(learner, WB.videoPageNumber);

  const res = await trainer.request.post(`/api/instructor/workbook-submissions/${mine!.id}/review`, {
    data: { decision: "pass", rubric: VIDEO_TOP, rubricVersion: VIDEO_RUBRIC.version },
  });
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { awardedBreakdown: Record<string, number>; skillPointsChanged: number };
  expect(body.awardedBreakdown).toEqual({ voice: 5, body: 4, impact: 3, confidence: 3 });
  expect(body.skillPointsChanged).toBe(WB.videoSkillPoints);

  const after = await skillMap(learner, skills);
  for (const key of skills) expect(after[key] - before[key], key).toBe(body.awardedBreakdown[key]);

  await trainer.request.post(`/api/instructor/workbook-submissions/${mine!.id}/review`, {
    data: { decision: "needs_revision" },
  });
  expect(await skillMap(learner, skills)).toEqual(before);
});

test("a pass without a complete rubric is refused, and pays nothing", async ({ learner, trainer }) => {
  // The gate that makes the rest of this meaningful. If it stops biting, a
  // trainer can still certify a skill without saying against what.
  await clearAward(learner, trainer, 1);
  const before = await skillMap(learner, ["idea", "structure", "impact"]);
  await learner.request.post(`/api/workbook-pages/${await pageId(learner, 1)}/submission`, {
    data: { content: "إجابة تنتظر التقييم." },
  });
  const mine = await submissionFor(learner, 1);
  const url = `/api/instructor/workbook-submissions/${mine!.id}/review`;

  const bare = await trainer.request.post(url, { data: { decision: "pass" } });
  expect(bare.status()).toBe(400);
  expect(((await bare.json()) as { missing: string[] }).missing).toHaveLength(TEXT_RUBRIC.criteria.length);

  const partial = await trainer.request.post(url, {
    data: { decision: "pass", rubric: { idea_clarity: 4 }, rubricVersion: TEXT_RUBRIC.version },
  });
  expect(partial.status()).toBe(400);
  expect(((await partial.json()) as { missing: string[] }).missing).toEqual([
    "structure",
    "impact",
    "brief",
  ]);

  // A criterion this rubric does not define is a stale client, not a mark.
  const unknown = await trainer.request.post(url, {
    data: { decision: "pass", rubric: { ...TEXT_TOP, charisma: 4 }, rubricVersion: TEXT_RUBRIC.version },
  });
  expect(unknown.status()).toBe(400);
  expect(((await unknown.json()) as { unexpected: string[] }).unexpected).toEqual(["charisma"]);

  // Levels outside 1–4 are refused rather than clamped into a mark nobody made.
  const outOfRange = await trainer.request.post(url, {
    data: { decision: "pass", rubric: { ...TEXT_TOP, impact: 7 }, rubricVersion: TEXT_RUBRIC.version },
  });
  expect(outOfRange.status()).toBe(400);

  // Marks made against wording that has since changed are refused, not stored.
  const stale = await trainer.request.post(url, {
    data: { decision: "pass", rubric: TEXT_TOP, rubricVersion: TEXT_RUBRIC.version + 1 },
  });
  expect(stale.status()).toBe(409);

  // Not one of the five refusals moved a point or recorded a verdict.
  expect(await skillMap(learner, ["idea", "structure", "impact"])).toEqual(before);
  expect((await submissionFor(learner, 1))!.status).toBe("submitted");
});

test("sending work back needs no rubric, but keeps the marks already made", async ({ learner, trainer }) => {
  await learner.request.post(`/api/workbook-pages/${await pageId(learner, 1)}/submission`, {
    data: { content: "محاولة أخرى." },
  });
  const mine = await submissionFor(learner, 1);
  const url = `/api/instructor/workbook-submissions/${mine!.id}/review`;

  // A grader declining work is not certifying anything, so prose is enough.
  const sentBack = await trainer.request.post(url, {
    data: { decision: "needs_revision", feedback: "الفكرة غير واضحة." },
  });
  expect(sentBack.ok()).toBeTruthy();
  expect((await submissionFor(learner, 1))!.awardedPoints).toBe(0);

  // Marked, then sent back anyway: a high score and a revision are a legitimate
  // pair, and the marks must survive to explain the request.
  const marked = await trainer.request.post(url, {
    data: {
      decision: "needs_revision",
      rubric: { idea_clarity: 3, structure: 2, impact: 3, brief: 4 },
      rubricVersion: TEXT_RUBRIC.version,
      feedback: "قوي، لكن رتّبه.",
    },
  });
  expect(marked.ok()).toBeTruthy();
  const graded = await submissionFor(learner, 1);
  expect(graded!.rubricScores).toEqual({ idea_clarity: 3, structure: 2, impact: 3, brief: 4 });
  expect(graded!.rubricPercent).toBe(63);
  expect(graded!.awardedPoints).toBe(0);
  expect(graded!.awardedBreakdown).toEqual({});
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
    data: { decision: "pass", rubric: TEXT_TOP, rubricVersion: TEXT_RUBRIC.version },
  });
  expect(selfGrade.status()).toBe(403);
});

/** Page ids are not stable across runs, so read them from the reader itself. */
async function pageId(ctx: Ctx, pageNumber: number): Promise<string> {
  const res = await ctx.request.get(`/api/workbooks/${WB.slug}/pages/${pageNumber}`);
  const body = (await res.json()) as { page: { id: string } };
  return body.page.id;
}
