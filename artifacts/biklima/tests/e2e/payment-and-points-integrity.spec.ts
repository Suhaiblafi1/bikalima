import type { APIRequestContext } from "@playwright/test";
import { expect, test } from "../fixtures/auth";
import { TEST_FIXTURES } from "../fixtures/data";

/**
 * The four places where a crash used to leave state nothing could repair.
 *
 * Every one of them returned 200 while doing half the work: an order that was
 * paid with no access granted, a completion recorded with no points behind it,
 * two CRM records for one person, an invite code that could be guessed at
 * leisure. None of it raised an error and none of it showed up in a log, which
 * is exactly why none of it was caught before. So each test here names the
 * number or the status that has to hold, and asserts on the second call as
 * well as the first — because "it worked once" was never the failing case.
 *
 * What these tests do and do not prove, measured rather than assumed. Each was
 * run against the pre-fix code with the fixes reverted and the unique indexes
 * dropped:
 *
 *   - The lead race (one lead, not two) and the invite-code budget FAIL
 *     against the pre-fix code — two leads, and fourteen guesses all answered.
 *     They are regression tests in the strict sense.
 *   - The three points-and-access tests PASS against the pre-fix code, and
 *     that is not a defect in them. What was fixed there is atomicity: the
 *     award and the row it belongs to, the payment and the access it buys, now
 *     commit together. On the happy path the old code reached the same end
 *     state by doing the second half after the first had already committed, so
 *     no black-box test can tell the two apart without injecting a failure
 *     between the halves. Doing that would mean shipping a switch that can
 *     stop points being credited, inside the path that credits points — too
 *     much standing risk for the coverage it buys. The atomicity itself was
 *     proven by hand instead, and those runs are recorded in commit 4516396.
 *     These three lock in the behaviour around it: paid exactly once, never
 *     twice, and access granted with the payment.
 */

type Ctx = { request: APIRequestContext };

const POINTS_ACTIVITY_ID = process.env.E2E_POINTS_ACTIVITY_ID ?? "";
const REVIEWED_ACTIVITY_ID = process.env.E2E_REVIEWED_ACTIVITY_ID ?? "";
const PENDING_ORDER_ID = process.env.E2E_PENDING_ORDER_ID ?? "";

async function skillMap(learner: Ctx, keys: readonly string[]) {
  const res = await learner.request.get("/api/me/skills");
  expect(res.ok(), "reading the skills map must succeed").toBeTruthy();
  const body = (await res.json()) as { skills: Record<string, number> };
  return Object.fromEntries(keys.map((k) => [k, body.skills[k] ?? 0]));
}

test("an auto-graded activity pays each of its skills once, and a retry pays nothing more", async ({ learner }) => {
  const fx = TEST_FIXTURES.pointsActivity;
  expect(POINTS_ACTIVITY_ID, "the paying-activity fixture must be seeded").not.toBe("");

  const before = await skillMap(learner, fx.skillKeys);

  const first = await learner.request.post(`/api/activities/${POINTS_ACTIVITY_ID}/submit`, {
    data: { payload: { picks: { "0": 1 } } },
  });
  expect(first.status(), "a correct answer is accepted").toBe(200);
  const firstBody = (await first.json()) as { status: string; grade: { passed: boolean } | null };
  expect(firstBody.status).toBe("completed");
  expect(firstBody.grade?.passed).toBe(true);

  // The points and the submission row settle together now, so a completed
  // submission always has its award behind it.
  const afterFirst = await skillMap(learner, fx.skillKeys);
  for (const key of fx.skillKeys) {
    expect(afterFirst[key], `${key} is paid the activity's reward exactly once`)
      .toBe(before[key] + fx.points);
  }

  // Farming guard: the dedup keys off the first completed row, and it still
  // holds now that the award lands inside the same transaction as that row.
  const second = await learner.request.post(`/api/activities/${POINTS_ACTIVITY_ID}/submit`, {
    data: { payload: { picks: { "0": 1 } } },
  });
  expect(second.status(), "a second attempt is still accepted").toBe(200);

  const afterSecond = await skillMap(learner, fx.skillKeys);
  for (const key of fx.skillKeys) {
    expect(afterSecond[key], `${key} is not paid twice for the same activity`)
      .toBe(afterFirst[key]);
  }
});

test("a trainer's first passing review pays the skill, and reviewing again does not", async ({ learner, trainer }) => {
  const fx = TEST_FIXTURES.reviewedActivity;
  expect(REVIEWED_ACTIVITY_ID, "the reviewed-activity fixture must be seeded").not.toBe("");

  const before = await skillMap(learner, fx.skillKeys);

  const submit = await learner.request.post(`/api/activities/${REVIEWED_ACTIVITY_ID}/submit`, {
    data: { mediaUrl: "https://example.com/e2e/recording.mp3", payload: {} },
  });
  expect(submit.status(), "a recording is accepted for review").toBe(200);
  const submitted = (await submit.json()) as { submission: { id: string }; status: string };
  expect(submitted.status, "a trainer-reviewed type waits for the trainer").toBe("pending");

  // Nothing is owed until a trainer passes it.
  const afterSubmit = await skillMap(learner, fx.skillKeys);
  for (const key of fx.skillKeys) {
    expect(afterSubmit[key], `${key} is untouched while the work is pending`).toBe(before[key]);
  }

  const review = await trainer.request.post(`/api/instructor/submissions/${submitted.submission.id}/review`, {
    data: { decision: "pass", rubricScores: { clarity: 8, voice: 8, body: 8, impact: 8 }, feedbackAr: "أداء واضح." },
  });
  expect(review.ok(), "a trainer may pass their own course's submission").toBeTruthy();

  const afterPass = await skillMap(learner, fx.skillKeys);
  for (const key of fx.skillKeys) {
    expect(afterPass[key], `${key} is paid when the trainer passes it`).toBe(before[key] + fx.points);
  }

  // A second pass on the same activity must not pay again. The prior-pass
  // check reads the review row, which is now written in the same transaction
  // as the award — so the two can never disagree.
  const again = await trainer.request.post(`/api/instructor/submissions/${submitted.submission.id}/review`, {
    data: { decision: "pass", rubricScores: { clarity: 9, voice: 9, body: 9, impact: 9 }, feedbackAr: "مراجعة ثانية." },
  });
  expect(again.ok(), "re-reviewing is allowed").toBeTruthy();

  const afterSecondPass = await skillMap(learner, fx.skillKeys);
  for (const key of fx.skillKeys) {
    expect(afterSecondPass[key], `${key} is not paid twice for one activity`).toBe(afterPass[key]);
  }
});

test("approving an order as paid grants the course access in the same breath", async ({ learner, admin }) => {
  const slug = TEST_FIXTURES.paidCourse.slug;
  expect(PENDING_ORDER_ID, "the pending-order fixture must be seeded").not.toBe("");

  // The learner is deliberately not enrolled in this course, so access has to
  // come from the approval and nothing else.
  const denied = await learner.request.get(`/api/courses/${slug}/access`);
  expect(denied.ok()).toBeTruthy();
  expect((await denied.json()) as { hasAccess: boolean }).toMatchObject({ hasAccess: false });

  const approve = await admin.request.patch(`/api/admin/orders/${PENDING_ORDER_ID}`, {
    data: { status: "paid" },
  });
  expect(approve.ok(), "an admin may approve a pending order").toBeTruthy();

  // Enrolment used to happen after the payment transaction had already
  // committed, so a failure in between left the order paid and the buyer
  // locked out, with nothing to re-drive it. It settles with the payment now.
  const granted = await learner.request.get(`/api/courses/${slug}/access`);
  expect(granted.ok()).toBeTruthy();
  expect(
    (await granted.json()) as { hasAccess: boolean },
    "a paid order must leave the buyer holding the access they paid for",
  ).toMatchObject({ hasAccess: true });
});

test("the same person submitting two forms at once leaves one lead, not two", async ({ anon, admin }) => {
  const stamp = Date.now();
  const email = `e2e.race.${stamp}@bikalima.test`;
  const phone = `+96279${String(stamp).slice(-7)}`;

  // The six bookings are fired from inside the page, not through Playwright's
  // APIRequestContext. The driver queues its own requests — one context or
  // six, they arrive one after another — which closes the very window this
  // test exists to open: fired that way, six bookings against the pre-fix code
  // still left one lead and the test passed while the bug was live. The
  // browser's own connection pool overlaps them for real.
  //
  // book-consultation is rate limited to 3/hour per client IP and req.ip comes
  // from X-Forwarded-For under `trust proxy = 1`, so each request carries a
  // distinct one; otherwise the limiter, not the fix, is what keeps the count
  // at one. The CSRF header and cookie come from the `anon` fixture.
  const page = await anon.newPage();
  await page.goto("/");
  const statuses = await page.evaluate(
    async ({ email, phone, stamp }) => {
      const one = (ip: string) =>
        fetch("/api/book-consultation", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Forwarded-For": ip },
          body: JSON.stringify({
            name: "سباق اختبار",
            email,
            phone,
            date: "2026-10-01",
            time: "10:00",
          }),
        }).then((r) => r.status);
      return Promise.all(
        Array.from({ length: 6 }, (_, i) => one(`10.77.${stamp % 200}.${i + 1}`)),
      );
    },
    { email, phone, stamp },
  );
  await page.close();

  for (const status of statuses) {
    expect(status, "a booking is accepted").toBe(200);
  }

  // Six bookings, one person. Before the unique index and the conflict
  // handling, two of these interleaved between the lookup and the insert and
  // left two un-mergeable CRM records with split history.
  const list = await admin.request.get(`/api/admin/leads?q=${encodeURIComponent(email)}`);
  expect(list.ok(), "an admin may list leads").toBeTruthy();
  const body = (await list.json()) as { leads: Array<{ email: string | null }> };
  const mine = body.leads.filter((l) => (l.email ?? "").toLowerCase() === email);
  expect(mine.length, "one person is one lead, however many forms they send at once").toBe(1);
});

test("guessing parent invite codes runs out of attempts", async ({ learner }) => {
  // A wrong code here is a miss against a child's account. The endpoint had no
  // limiter at all, so an attacker could work through the space unhurried; the
  // codes themselves were also predictable, which is fixed separately in how
  // they are generated.
  //
  // The budget is 10/hour per user and the limiter is in-process, so a run
  // cannot assume it starts with a full one — reseeding the database does not
  // reset an in-memory counter, and an earlier run in the same hour leaves it
  // spent. The assertions are therefore on what holds either way: a bogus code
  // is never honoured, the number of attempts actually *answered* never exceeds
  // the budget, and once the budget is gone the refusal sticks. Against the
  // pre-fix endpoint all fourteen were answered, which trips both of the last
  // two.
  const BUDGET = 10;
  const ATTEMPTS = BUDGET + 4;
  const statuses: number[] = [];
  for (let i = 0; i < ATTEMPTS; i += 1) {
    const res = await learner.request.post("/api/parent/redeem", {
      data: { inviteCode: `ZZGUESS${String(i).padStart(2, "0")}` },
    });
    statuses.push(res.status());
  }

  expect(
    statuses.every((s) => s === 404 || s === 429),
    "a bogus code is either not found or refused — never accepted",
  ).toBeTruthy();
  expect(
    statuses.filter((s) => s !== 429).length,
    "no more guesses may be answered than the hourly budget allows",
  ).toBeLessThanOrEqual(BUDGET);
  expect(
    statuses[statuses.length - 1],
    "once the budget is spent it stays spent for the rest of the window",
  ).toBe(429);
});
