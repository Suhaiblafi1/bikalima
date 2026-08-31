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
  inPersonCoursesTable,
  featureFlagsTable,
  badgeDefinitionsTable,
  userBadgesTable,
  courseTrainersTable,
  lessonActivitiesTable,
  parentLinksTable,
  workbooksTable,
  workbookPagesTable,
  workbookOrdersTable,
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
  role: "admin" | "trainer" | "student" | "sales" | "parent";
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

async function upsertDraftCourse(): Promise<string> {
  const slug = "e2e-private-draft";
  const [existing] = await db.select().from(coursesTable).where(eq(coursesTable.slug, slug));
  if (existing) {
    await db.update(coursesTable).set({ isPublished: false }).where(eq(coursesTable.id, existing.id));
    return existing.id;
  }
  const [created] = await db.insert(coursesTable).values({
    slug,
    programId: "core",
    titleAr: "مسودة خاصة للاختبار",
    titleEn: "Private E2E draft",
    titleFr: "Private E2E draft",
    descriptionAr: "يجب ألا تظهر هذه الدورة للعامة",
    descriptionEn: "This course must not be public",
    price: 0,
    discountPrice: 0,
    isPublished: false,
  }).returning();
  return created.id;
}

async function upsertQuizIntegrityFixture(courseId: string): Promise<{ lessonId: string; activityId: string }> {
  const [lesson] = await db.select({ id: lessonsTable.id })
    .from(lessonsTable)
    .where(eq(lessonsTable.courseId, courseId))
    .limit(1);
  if (!lesson) throw new Error("E2E course has no lesson for quiz fixture");

  const titleAr = "اختبار نزاهة E2E";
  const config = {
    questions: [{ q: "أي خيار صحيح؟", choices: ["الخيار الخاطئ", "الخيار الصحيح"], answer: 1 }],
    passScore: 60,
  };
  const [existing] = await db.select({ id: lessonActivitiesTable.id })
    .from(lessonActivitiesTable)
    .where(and(eq(lessonActivitiesTable.lessonId, lesson.id), eq(lessonActivitiesTable.titleAr, titleAr)))
    .limit(1);
  if (existing) {
    await db.update(lessonActivitiesTable)
      .set({ type: "quiz", config, isPublished: true, isRequired: false })
      .where(eq(lessonActivitiesTable.id, existing.id));
    return { lessonId: lesson.id, activityId: existing.id };
  }
  const [created] = await db.insert(lessonActivitiesTable).values({
    lessonId: lesson.id,
    type: "quiz",
    titleAr,
    titleEn: "E2E integrity quiz",
    config,
    sortOrder: 99,
    isRequired: false,
    isPublished: true,
    pointsReward: 0,
  }).returning();
  return { lessonId: lesson.id, activityId: created.id };
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

async function upsertInPersonCourse(courseId: string) {
  const titleAr = "موعد وجاهي لاختبار E2E";
  const [existing] = await db.select().from(inPersonCoursesTable).where(eq(inPersonCoursesTable.titleAr, titleAr));
  const startsAt = new Date(Date.now() + 7 * 24 * 60 * 60_000);
  const values = {
    courseId,
    programId: "core",
    titleAr,
    titleEn: "E2E In-person Course",
    locationAr: "عمّان",
    locationEn: "Amman",
    timezone: "Asia/Amman",
    startsAt,
    endsAt: new Date(startsAt.getTime() + 3 * 60 * 60_000),
    capacity: 2,
    status: "published" as const,
    waitlistEnabled: true,
  };
  if (existing) {
    const [updated] = await db.update(inPersonCoursesTable).set(values).where(eq(inPersonCoursesTable.id, existing.id)).returning();
    return updated.id;
  }
  const [created] = await db.insert(inPersonCoursesTable).values(values).returning();
  return created.id;
}

/**
 * Seed a workbook and its pages. Pages are keyed by their number so a re-run
 * updates in place rather than tripping uq_workbook_pages_number.
 */
async function upsertWorkbook(opts: {
  slug: string;
  titleAr: string;
  pages: Array<{
    pageNumber: number;
    sectionAr?: string;
    titleAr?: string;
    bodyAr: string;
    exerciseAr?: string;
    isPublished?: boolean;
  }>;
}): Promise<string> {
  const [existing] = await db.select().from(workbooksTable).where(eq(workbooksTable.slug, opts.slug));
  const values = {
    slug: opts.slug,
    titleAr: opts.titleAr,
    status: "published" as const,
    format: "digital" as const,
  };
  const workbookId = existing
    ? (await db.update(workbooksTable).set(values).where(eq(workbooksTable.id, existing.id)).returning())[0].id
    : (await db.insert(workbooksTable).values(values).returning())[0].id;

  for (const page of opts.pages) {
    const [row] = await db
      .select()
      .from(workbookPagesTable)
      .where(
        and(
          eq(workbookPagesTable.workbookId, workbookId),
          eq(workbookPagesTable.pageNumber, page.pageNumber),
        ),
      );
    const pageValues = {
      workbookId,
      pageNumber: page.pageNumber,
      sectionAr: page.sectionAr ?? null,
      titleAr: page.titleAr ?? null,
      bodyAr: page.bodyAr,
      exerciseAr: page.exerciseAr ?? null,
      isPublished: page.isPublished ?? true,
    };
    if (row) {
      await db.update(workbookPagesTable).set(pageValues).where(eq(workbookPagesTable.id, row.id));
    } else {
      await db.insert(workbookPagesTable).values(pageValues);
    }
  }
  return workbookId;
}

/** A confirmed order is what entitles the learner to read the workbook. */
async function ensureWorkbookOrder(userId: string, workbookId: string) {
  const [existing] = await db
    .select()
    .from(workbookOrdersTable)
    .where(
      and(
        eq(workbookOrdersTable.userId, userId),
        eq(workbookOrdersTable.workbookId, workbookId),
      ),
    );
  if (existing) {
    await db
      .update(workbookOrdersTable)
      .set({ status: "confirmed" })
      .where(eq(workbookOrdersTable.id, existing.id));
    return;
  }
  await db.insert(workbookOrdersTable).values({
    userId,
    workbookId,
    format: "pdf",
    buyerName: `${TEST_FIXTURES.learner.firstName} ${TEST_FIXTURES.learner.lastName}`,
    buyerEmail: TEST_FIXTURES.learner.email,
    buyerPhone: "0790000000",
    status: "confirmed",
  });
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
  await db.insert(enrollmentsTable)
    .values({ userId, courseId, status: "active" })
    .onConflictDoUpdate({
      target: [enrollmentsTable.userId, enrollmentsTable.courseId],
      set: { status: "active" },
    });
}

async function ensureTrainerCourse(userId: string, courseId: string) {
  const [existing] = await db
    .select({ id: courseTrainersTable.id })
    .from(courseTrainersTable)
    .where(and(eq(courseTrainersTable.userId, userId), eq(courseTrainersTable.courseId, courseId)));
  if (!existing) await db.insert(courseTrainersTable).values({ userId, courseId });
}

async function ensureParentLink(parentUserId: string, studentUserId: string) {
  const inviteCode = "E2EPARENT000001";
  const [existing] = await db
    .select({ id: parentLinksTable.id })
    .from(parentLinksTable)
    .where(eq(parentLinksTable.inviteCode, inviteCode))
    .limit(1);

  if (existing) {
    await db
      .update(parentLinksTable)
      .set({
        parentUserId,
        studentUserId,
        status: "active",
        relationshipAr: "ولي أمر",
        activatedAt: new Date(),
      })
      .where(eq(parentLinksTable.id, existing.id));
    return;
  }

  await db.insert(parentLinksTable).values({
    parentUserId,
    studentUserId,
    inviteCode,
    status: "active",
    relationshipAr: "ولي أمر",
    createdById: studentUserId,
    activatedAt: new Date(),
  });
}

export default async function globalSetup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL must be set for E2E tests. The api-server uses the same DB.",
    );
  }
  if (process.env.E2E_ALLOW_DB_SEED !== "true") {
    throw new Error(
      "Refusing to seed E2E fixtures. Set E2E_ALLOW_DB_SEED=true only for an isolated test database.",
    );
  }
  let databaseName = "";
  try {
    databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");
  } catch {
    throw new Error("DATABASE_URL is not a valid PostgreSQL URL.");
  }
  if (!/(^|[_-])(e2e|test)([_-]|$)/i.test(databaseName)) {
    throw new Error(
      `Refusing to seed database "${databaseName || "(unknown)"}". Its name must explicitly contain "e2e" or "test".`,
    );
  }

  const courseId = await upsertFreeCourse();
  const draftCourseId = await upsertDraftCourse();
  const quizFixture = await upsertQuizIntegrityFixture(courseId);

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

  const trainerId = await upsertUser({
    email: TEST_FIXTURES.trainer.email,
    password: TEST_FIXTURES.trainer.password,
    firstName: TEST_FIXTURES.trainer.firstName,
    lastName: TEST_FIXTURES.trainer.lastName,
    role: "trainer",
  });

  const parentId = await upsertUser({
    email: TEST_FIXTURES.parent.email,
    password: TEST_FIXTURES.parent.password,
    firstName: TEST_FIXTURES.parent.firstName,
    lastName: TEST_FIXTURES.parent.lastName,
    role: "parent",
  });

  await ensureEnrollment(learnerId, courseId);
  await ensureTrainerCourse(trainerId, courseId);
  await ensureParentLink(parentId, learnerId);
  const learnerFullName = `${TEST_FIXTURES.learner.firstName} ${TEST_FIXTURES.learner.lastName}`;
  await upsertCertificate({
    userId: learnerId,
    fullName: learnerFullName,
    email: TEST_FIXTURES.learner.email,
  });
  const inPersonCourseId = await upsertInPersonCourse(courseId);
  await ensureBadgeAwarded(learnerId);

  const wb = TEST_FIXTURES.workbook;
  const workbookId = await upsertWorkbook({
    slug: wb.slug,
    titleAr: wb.titleAr,
    pages: [
      {
        pageNumber: 1,
        sectionAr: wb.sectionAr,
        titleAr: wb.pageTitleAr,
        // A blank line between paragraphs is what the reader splits on.
        bodyAr: `${wb.bodyFirstParagraph}\n\n${wb.bodySecondParagraph}`,
        exerciseAr: wb.exerciseAr,
      },
      { pageNumber: 2, titleAr: wb.draftTitleAr, bodyAr: "مسودة لا يراها الطالب.", isPublished: false },
    ],
  });
  await ensureWorkbookOrder(learnerId, workbookId);
  const lockedWorkbookId = await upsertWorkbook({
    slug: TEST_FIXTURES.lockedWorkbook.slug,
    titleAr: TEST_FIXTURES.lockedWorkbook.titleAr,
    pages: [{ pageNumber: 1, bodyAr: "صفحة في كرّاسة لا يملكها الطالب." }],
  });
  // Make sure the public graduates registry is enabled so the spec can
  // assert the seeded card renders deterministically.
  await ensureFeatureFlag("graduates_page", true);

  // Make IDs available to specs that need them.
  process.env.E2E_COURSE_ID = courseId;
  process.env.E2E_ADMIN_ID = adminId;
  process.env.E2E_LEARNER_ID = learnerId;
  process.env.E2E_TRAINER_ID = trainerId;
  process.env.E2E_PARENT_ID = parentId;
  process.env.E2E_IN_PERSON_COURSE_ID = inPersonCourseId;
  process.env.E2E_DRAFT_COURSE_ID = draftCourseId;
  process.env.E2E_QUIZ_LESSON_ID = quizFixture.lessonId;
  process.env.E2E_QUIZ_ACTIVITY_ID = quizFixture.activityId;
  process.env.E2E_WORKBOOK_ID = workbookId;
  process.env.E2E_LOCKED_WORKBOOK_ID = lockedWorkbookId;

  // eslint-disable-next-line no-console
  console.log(
    `[e2e setup] course=${courseId} admin=${adminId} learner=${learnerId} trainer=${trainerId} parent=${parentId}`,
  );
}
