import { expect, test } from "../fixtures/auth";

/**
 * A trainer sees their own courses and no one else's.
 *
 * This exists because of a negative result, not a hunch. The rule deciding
 * which courses a trainer may see was re-implemented in seven files, and when
 * it was pulled into one module the whole boundary suite — nineteen tests
 * across security-boundaries, workbook-exercises and workbook-reader — was run
 * against a deliberately broken version that returned *every* course for
 * *every* trainer. All nineteen still passed. Nothing in the suite was
 * watching this, so a refactor or a future change to the rule could have
 * opened every course to every trainer and shipped green.
 *
 * The seeded trainer is assigned to exactly one course. The paid-course
 * fixture is a second published course they were never assigned to, which is
 * what makes the leak observable.
 */

const TAUGHT_COURSE_ID = process.env.E2E_COURSE_ID ?? "";
const UNTAUGHT_COURSE_ID = process.env.E2E_PAID_COURSE_ID ?? "";

test("a trainer's course list holds the course they teach and not the one they do not", async ({ trainer, admin }) => {
  expect(TAUGHT_COURSE_ID, "the taught-course fixture must be seeded").not.toBe("");
  expect(UNTAUGHT_COURSE_ID, "the untaught-course fixture must be seeded").not.toBe("");
  expect(TAUGHT_COURSE_ID).not.toBe(UNTAUGHT_COURSE_ID);

  // An admin is unscoped, so this establishes that both courses really exist
  // and are visible to someone — otherwise the trainer's list could be short
  // for the wrong reason and the test would pass while proving nothing.
  const asAdmin = await admin.request.get("/api/admin/courses");
  expect(asAdmin.ok(), "an admin may list courses").toBeTruthy();
  const adminIds = ((await asAdmin.json()) as { courses: Array<{ id: string }> }).courses.map((c) => c.id);
  expect(adminIds, "the taught course is visible to an admin").toContain(TAUGHT_COURSE_ID);
  expect(adminIds, "the untaught course is visible to an admin").toContain(UNTAUGHT_COURSE_ID);

  const asTrainer = await trainer.request.get("/api/admin/courses");
  expect(asTrainer.ok(), "a trainer may list their own courses").toBeTruthy();
  const trainerIds = ((await asTrainer.json()) as { courses: Array<{ id: string }> }).courses.map((c) => c.id);

  expect(trainerIds, "a trainer sees the course they are assigned to").toContain(TAUGHT_COURSE_ID);
  expect(
    trainerIds,
    "a trainer must not see a course they were never assigned to",
  ).not.toContain(UNTAUGHT_COURSE_ID);
});

test("a trainer is refused the roster of a course they do not teach", async ({ trainer }) => {
  expect(UNTAUGHT_COURSE_ID, "the untaught-course fixture must be seeded").not.toBe("");

  // 404 rather than 403 is deliberate in the handler: it avoids confirming
  // that the id exists at all.
  const res = await trainer.request.get(`/api/admin/courses/${UNTAUGHT_COURSE_ID}/trainers`);
  expect(
    res.status(),
    "the roster of someone else's course is not found, not merely forbidden",
  ).toBe(404);

  const own = await trainer.request.get(`/api/admin/courses/${TAUGHT_COURSE_ID}/trainers`);
  expect(own.ok(), "a trainer may read the roster of their own course").toBeTruthy();
});
