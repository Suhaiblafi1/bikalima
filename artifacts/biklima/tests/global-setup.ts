import crypto from "node:crypto";
import { promisify } from "node:util";
import {
  db,
  coursesTable,
  courseSectionsTable,
  lessonsTable,
  usersTable,
  certificatesTable,
  enrollmentsTable,
  speechEvaluationsTable,
  featureFlagsTable,
  badgeDefinitionsTable,
  userBadgesTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { TEST_FIXTURES } from "./fixtures/data";

// Mirror of the api-server's password hash format (salt:hex). Inlined here so
// the e2e setup doesn't reach across artifacts.
const scryptAsync = promisify(crypto.scrypt);
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function upsertUser(opts: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "admin" | "trainer" | "student" | "sales";
  isSuperAdmin?: boolean;
}) {
  const passwordHash = await hashPassword(opts.password);
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, opts.email));
  if (existing) {
    await db
      .update(usersTable)
      .set({
        passwordHash,
        firstName: opts.firstName,
        lastName: opts.lastName,
        role: opts.role,
        isSuperAdmin: opts.isSuperAdmin ?? false,
        emailVerified: true,
      })
      .where(eq(usersTable.id, existing.id));
    return existing.id;
  }
  const [created] = await db
    .insert(usersTable)
    .values({
      email: opts.email,
      passwordHash,
      firstName: opts.firstName,
      lastName: opts.lastName,
      role: opts.role,
      isSuperAdmin: opts.isSuperAdmin ?? false,
      emailVerified: true,
    })
    .returning();
  return created.id;
}

async function upsertFreeCourse() {
  const slug = TEST_FIXTURES.course.slug;
  const [existing] = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.slug, slug));

  let courseId: string;
  if (existing) {
    await db
      .update(coursesTable)
      .set({ isPublished: true, price: 0, discountPrice: 0 })
      .where(eq(coursesTable.id, existing.id));
    courseId = existing.id;
  } else {
    const [created] = await db
      .insert(coursesTable)
      .values({
        slug,
        programId: "core",
        titleAr: TEST_FIXTURES.course.titleAr,
        titleEn: TEST_FIXTURES.course.titleEn,
        titleFr: TEST_FIXTURES.course.titleEn,
        descriptionAr: "دورة اختبار E2E",
        descriptionEn: "E2E test course",
        price: 0,
        discountPrice: 0,
        isPublished: true,
      })
      .returning();
    courseId = created.id;
  }

  // Ensure a section + lesson exist so the learn page renders meaningfully.
  const [section] = await db
    .select()
    .from(courseSectionsTable)
    .where(eq(courseSectionsTable.courseId, courseId))
    .limit(1);
  let sectionId = section?.id;
  if (!sectionId) {
    const [s] = await db
      .insert(courseSectionsTable)
      .values({
        courseId,
        titleAr: "القسم الأول",
        titleEn: "Section 1",
        sortOrder: 0,
      })
      .returning();
    sectionId = s.id;
  }

  const [lesson] = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.courseId, courseId))
    .limit(1);
  if (!lesson) {
    await db.insert(lessonsTable).values({
      courseId,
      sectionId,
      titleAr: "الدرس الأول",
      titleEn: "Lesson 1",
      titleFr: "Lesson 1",
      descriptionAr: "درس اختبار",
      descriptionEn: "Test lesson",
      sortOrder: 0,
      isFreePreview: true,
    });
  }

  return courseId;
}

async function upsertCertificate(opts: { userId: string; fullName: string; email: string }) {
  const code = TEST_FIXTURES.certificate.code;
  const fileUrl = TEST_FIXTURES.certificate.fileUrl;
  const [existing] = await db
    .select()
    .from(certificatesTable)
    .where(eq(certificatesTable.code, code));
  if (existing) {
    await db
      .update(certificatesTable)
      .set({
        userId: opts.userId,
        fullName: opts.fullName,
        email: opts.email,
        showInRegistry: true,
        status: "active",
        certificateFileUrl: fileUrl,
        country: "Jordan",
      })
      .where(eq(certificatesTable.id, existing.id));
    return existing.id;
  }
  const [created] = await db
    .insert(certificatesTable)
    .values({
      code,
      fullName: opts.fullName,
      email: opts.email,
      certType: "trainee",
      programId: "core",
      programName: TEST_FIXTURES.course.titleAr,
      status: "active",
      showInRegistry: true,
      userId: opts.userId,
      certificateFileUrl: fileUrl,
      country: "Jordan",
    })
    .returning();
  return created.id;
}

async function upsertPublishedSpeechEvaluation(opts: {
  userId: string;
  fullName: string;
  email: string;
}) {
  const [existing] = await db
    .select()
    .from(speechEvaluationsTable)
    .where(eq(speechEvaluationsTable.userId, opts.userId));
  const values = {
    userId: opts.userId,
    fullName: opts.fullName,
    email: opts.email,
    phone: "0790000000",
    speechTopic: TEST_FIXTURES.speechEvaluation.topic,
    speechLanguage: "ar",
    transcriptText: "نص خطاب اختبار E2E.",
    status: "completed" as const,
    rubricScores: { delivery: 8, content: 9, structure: 8 },
    rubricNotes: { delivery: "Clear and confident.", content: "Strong examples." },
    overallScore: TEST_FIXTURES.speechEvaluation.overallScore,
    programRecommendation: "core" as const,
    finalReportMd: TEST_FIXTURES.speechEvaluation.reportMarker,
    reportPublishedAt: new Date(),
  };
  if (existing) {
    await db
      .update(speechEvaluationsTable)
      .set(values)
      .where(eq(speechEvaluationsTable.id, existing.id));
    return existing.id;
  }
  const [created] = await db
    .insert(speechEvaluationsTable)
    .values(values)
    .returning();
  return created.id;
}

async function ensureFeatureFlag(key: string, enabled: boolean) {
  const [existing] = await db
    .select()
    .from(featureFlagsTable)
    .where(eq(featureFlagsTable.key, key));
  if (existing) {
    if (existing.enabled !== enabled) {
      await db.update(featureFlagsTable).set({ enabled }).where(eq(featureFlagsTable.key, key));
    }
    return;
  }
  await db.insert(featureFlagsTable).values({ key, enabled });
}

async function ensureBadgeAwarded(userId: string) {
  const key = TEST_FIXTURES.badge.key;
  const [def] = await db
    .select()
    .from(badgeDefinitionsTable)
    .where(eq(badgeDefinitionsTable.key, key));
  if (!def) {
    await db.insert(badgeDefinitionsTable).values({
      key,
      titleAr: "إنجاز اختبار",
      titleEn: "E2E Achievement",
      descriptionAr: "شارة اختبار للمسار التلقائي.",
      descriptionEn: "Test badge awarded by the e2e seed.",
      eventName: "e2e.test_event",
      isActive: true,
    });
  }
  const [awarded] = await db
    .select()
    .from(userBadgesTable)
    .where(and(eq(userBadgesTable.userId, userId), eq(userBadgesTable.badgeKey, key)));
  if (!awarded) {
    await db.insert(userBadgesTable).values({ userId, badgeKey: key });
  }
}

async function ensureEnrollment(userId: string, courseId: string) {
  const existing = await db
    .select()
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.userId, userId));
  const has = existing.some((e) => e.courseId === courseId);
  if (!has) {
    await db.insert(enrollmentsTable).values({ userId, courseId, status: "active" });
  }
}

export default async function globalSetup() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set for E2E tests. The api-server uses the same DB.",
    );
  }

  const courseId = await upsertFreeCourse();

  const adminId = await upsertUser({
    email: TEST_FIXTURES.admin.email,
    password: TEST_FIXTURES.admin.password,
    firstName: TEST_FIXTURES.admin.firstName,
    lastName: TEST_FIXTURES.admin.lastName,
    role: "admin",
    isSuperAdmin: true,
  });

  const learnerId = await upsertUser({
    email: TEST_FIXTURES.learner.email,
    password: TEST_FIXTURES.learner.password,
    firstName: TEST_FIXTURES.learner.firstName,
    lastName: TEST_FIXTURES.learner.lastName,
    role: "student",
  });

  await ensureEnrollment(learnerId, courseId);
  const learnerFullName = `${TEST_FIXTURES.learner.firstName} ${TEST_FIXTURES.learner.lastName}`;
  await upsertCertificate({
    userId: learnerId,
    fullName: learnerFullName,
    email: TEST_FIXTURES.learner.email,
  });
  await upsertPublishedSpeechEvaluation({
    userId: learnerId,
    fullName: learnerFullName,
    email: TEST_FIXTURES.learner.email,
  });
  await ensureBadgeAwarded(learnerId);
  // Make sure the public graduates registry is enabled so the spec can
  // assert the seeded card renders deterministically.
  await ensureFeatureFlag("graduates_page", true);

  // Make IDs available to specs that need them.
  process.env.E2E_COURSE_ID = courseId;
  process.env.E2E_ADMIN_ID = adminId;
  process.env.E2E_LEARNER_ID = learnerId;

  // eslint-disable-next-line no-console
  console.log(
    `[e2e setup] course=${courseId} admin=${adminId} learner=${learnerId}`,
  );
}
