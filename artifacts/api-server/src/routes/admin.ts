import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  usersTable,
  coursesTable,
  courseSectionsTable,
  lessonsTable,
  enrollmentsTable,
  lessonProgressTable,
  enrollmentRequestsTable,
  workbookOrdersTable,
  ordersTable,
  instructorsTable,
  reviewsTable,
  siteSettingsTable,
  speechEvaluationsTable,
} from "@workspace/db";
import { db as _db, courseTrainersTable, trainerLearnerNotesTable } from "@workspace/db";
import { eq, desc, sql, asc, inArray, and, gte } from "drizzle-orm";
import {
  ADMIN_EMAILS,
  isAdmin,
  requireAdmin,
  requireRole,
  isValidRole,
  countAdmins,
  type Role,
} from "../lib/admin.js";
import { createNotification } from "../lib/notifications.js";
import { recordAuditLog, awardBadgeIfEligible } from "../lib/platform.js";

const router: IRouter = Router();

// Returns the set of courseIds this user can administer. Admins get null
// (= unrestricted). Trainers get only their assigned courses (course_trainers).
// Anyone else gets an empty array (effectively blocked).
async function getScopedCourseIds(req: Request): Promise<string[] | null> {
  if (isAdmin(req)) return null;
  if (!req.user) return [];
  if (req.user.role !== "trainer") return [];
  const rows = await db
    .select({ courseId: courseTrainersTable.courseId })
    .from(courseTrainersTable)
    .where(eq(courseTrainersTable.userId, req.user.id));
  return rows.map((r) => r.courseId);
}

type CourseInsert = {
  titleAr: string; titleEn: string; titleFr: string;
  subtitleAr?: string; subtitleEn?: string;
  descriptionAr?: string; descriptionEn?: string; descriptionFr?: string;
  programId?: string; slug?: string; imageUrl?: string; trailerUrl?: string;
  price?: number; discountPrice?: number; level?: string; language?: string;
  category?: string; instructorId?: string;
  whatYouLearnAr?: string[]; whatYouLearnEn?: string[];
  requirementsAr?: string[]; requirementsEn?: string[];
  targetAudienceAr?: string; targetAudienceEn?: string;
  seoTitle?: string; seoDescription?: string;
  isPublished?: boolean; isFeatured?: boolean;
};

type LessonUpdate = {
  titleAr?: string; titleEn?: string; titleFr?: string;
  descriptionAr?: string; descriptionEn?: string;
  videoUrl?: string; videoType?: string; durationMinutes?: number;
  sortOrder?: number; sectionId?: string | null;
  isFreePreview?: boolean; isPublished?: boolean;
  resources?: LessonResource[];
};

type LessonResource = { titleAr: string; titleEn: string; url: string; type: string };

type SectionUpdate = { titleAr?: string; titleEn?: string; sortOrder?: number; isPublished?: boolean };

type InstructorUpdate = { nameAr?: string; nameEn?: string; bioAr?: string; bioEn?: string; photoUrl?: string; email?: string };

router.get("/admin/check", (req: Request, res: Response) => {
  res.set("Cache-Control", "no-store");
  const role: Role = (req.user?.role as Role) ?? "student";
  // "Admin area" includes any non-student staff role so the route guard can
  // allow trainers and sales/support in too. The `role` field tells the
  // frontend which tabs to render.
  const canAccessAdminArea =
    isAdmin(req) || role === "trainer" || role === "sales";
  res.json({
    isAdmin: isAdmin(req),
    canAccessAdminArea,
    role: req.isAuthenticated() ? role : null,
  });
});

router.get("/admin/stats", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const [usersCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
    const [todayCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(sql`${usersTable.createdAt} >= CURRENT_DATE`);
    const [weekCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(sql`${usersTable.createdAt} >= CURRENT_DATE - INTERVAL '7 days'`);
    const [coursesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(coursesTable);
    const [enrollmentsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(enrollmentsTable);
    const [requestsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(enrollmentRequestsTable);
    const [ordersCount] = await db.select({ count: sql<number>`count(*)::int` }).from(workbookOrdersTable);
    const [lmsOrdersCount] = await db.select({ count: sql<number>`count(*)::int` }).from(ordersTable);

    res.json({
      totalUsers: usersCount.count,
      todaySignups: todayCount.count,
      weekSignups: weekCount.count,
      totalCourses: coursesCount.count,
      totalEnrollments: enrollmentsCount.count,
      totalRequests: requestsCount.count,
      totalOrders: ordersCount.count,
      totalLmsOrders: lmsOrdersCount.count,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/admin/users", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const users = await db.select({
      id: usersTable.id, email: usersTable.email, firstName: usersTable.firstName,
      lastName: usersTable.lastName, role: usersTable.role,
      createdAt: usersTable.createdAt, updatedAt: usersTable.updatedAt,
    }).from(usersTable).orderBy(desc(usersTable.createdAt));
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Update a user's role. Admin only. Cannot demote the last remaining admin.
//
// We do the count + update inside a SERIALIZABLE transaction with explicit
// row locking (`FOR UPDATE`) so concurrent demotions cannot both pass the
// "more than one admin" check and leave the system without an admin.
router.patch("/admin/users/:id/role", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { role } = req.body ?? {};
    if (!isValidRole(role)) {
      res.status(400).json({ error: "Invalid role", allowed: ["admin", "trainer", "student", "sales"] });
      return;
    }

    type UpdateOutcome =
      | { ok: true; user: { id: string; email: string; role: string; firstName: string | null; lastName: string | null } }
      | { ok: false; status: number; error: string };

    const outcome: UpdateOutcome = await db.transaction(async (tx) => {
      // Lock the target row first to serialize against any other writer
      // touching the same user. This blocks a parallel demotion attempt
      // until we either commit or roll back.
      const lockedTargets = await tx.execute(sql`
        SELECT id, email, role
        FROM ${usersTable}
        WHERE id = ${id}
        FOR UPDATE
      `);
      const targetRow = (lockedTargets as { rows?: Array<{ id: string; email: string; role: string }> }).rows?.[0]
        ?? (lockedTargets as unknown as Array<{ id: string; email: string; role: string }>)[0];
      if (!targetRow) return { ok: false, status: 404, error: "Not found" };

      if (targetRow.role === "admin" && role !== "admin") {
        if (ADMIN_EMAILS.includes(targetRow.email.toLowerCase())) {
          return { ok: false, status: 403, error: "Cannot demote a bootstrap admin" };
        }
        // Count *other* admins (not counting this row, which is being demoted),
        // also under a row-share lock so a concurrent demotion of a different
        // admin row is forced to serialize behind us.
        const otherAdmins = await tx.execute(sql`
          SELECT 1
          FROM ${usersTable}
          WHERE role = 'admin' AND id <> ${id}
          FOR SHARE
        `);
        const others = (otherAdmins as { rows?: unknown[] }).rows
          ?? (otherAdmins as unknown as unknown[]);
        if (!others || others.length === 0) {
          return { ok: false, status: 409, error: "Cannot demote the last admin" };
        }
      }

      const [updated] = await tx.update(usersTable)
        .set({ role })
        .where(eq(usersTable.id, id))
        .returning({
          id: usersTable.id, email: usersTable.email, role: usersTable.role,
          firstName: usersTable.firstName, lastName: usersTable.lastName,
        });
      return { ok: true, user: updated };
    });

    if (!outcome.ok) {
      res.status(outcome.status).json({ error: outcome.error });
      return;
    }
    res.json({ user: outcome.user });
  } catch (err) {
    req.log.error({ err }, "Failed to update role");
    res.status(500).json({ error: "Failed to update role" });
  }
});

// ---- Course trainers (many-to-many between courses and trainer users) ----

router.get("/admin/courses/:id/trainers", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "trainer")) return;
  try {
    // A trainer may only inspect the trainer roster of a course they're
    // assigned to. Admins are unrestricted. We treat a non-membership lookup
    // as 404 to avoid leaking which course IDs exist.
    if (!isAdmin(req)) {
      const userId = req.user?.id;
      if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
      const [own] = await db.select({ id: courseTrainersTable.id })
        .from(courseTrainersTable)
        .where(and(
          eq(courseTrainersTable.courseId, req.params.id),
          eq(courseTrainersTable.userId, userId),
        ));
      if (!own) { res.status(404).json({ error: "Not found" }); return; }
    }
    const rows = await db.select({
      id: courseTrainersTable.id,
      userId: courseTrainersTable.userId,
      courseId: courseTrainersTable.courseId,
      assignedAt: courseTrainersTable.assignedAt,
      email: usersTable.email,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      role: usersTable.role,
    })
    .from(courseTrainersTable)
    .innerJoin(usersTable, eq(courseTrainersTable.userId, usersTable.id))
    .where(eq(courseTrainersTable.courseId, req.params.id));
    res.json({ trainers: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to list course trainers");
    res.status(500).json({ error: "Failed to list trainers" });
  }
});

router.post("/admin/courses/:id/trainers", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const courseId = req.params.id;
    const { userId } = req.body ?? {};
    if (!userId || typeof userId !== "string") {
      res.status(400).json({ error: "userId required" });
      return;
    }
    const [course] = await db.select({ id: coursesTable.id }).from(coursesTable).where(eq(coursesTable.id, courseId));
    if (!course) { res.status(404).json({ error: "Course not found" }); return; }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    // Auto-promote a plain student to trainer when assigned to a course.
    if (user.role !== "trainer" && user.role !== "admin") {
      await db.update(usersTable).set({ role: "trainer" }).where(eq(usersTable.id, userId));
    }
    try {
      const [row] = await db.insert(courseTrainersTable).values({ courseId, userId }).returning();
      res.json({ assignment: row });
    } catch (e) {
      // Unique violation -> already assigned, return the existing row instead of erroring.
      const [existing] = await db.select().from(courseTrainersTable)
        .where(and(eq(courseTrainersTable.courseId, courseId), eq(courseTrainersTable.userId, userId)));
      if (existing) { res.json({ assignment: existing, alreadyAssigned: true }); return; }
      throw e;
    }
  } catch (err) {
    req.log.error({ err }, "Failed to assign trainer");
    res.status(500).json({ error: "Failed to assign trainer" });
  }
});

router.delete("/admin/courses/:id/trainers/:userId", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    await db.delete(courseTrainersTable)
      .where(and(
        eq(courseTrainersTable.courseId, req.params.id),
        eq(courseTrainersTable.userId, req.params.userId),
      ));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove trainer" });
  }
});

router.patch("/admin/users/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { firstName, lastName, email } = req.body;
    const updates: Record<string, string> = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (email !== undefined) updates.email = email.toLowerCase().trim();
    if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No fields" }); return; }
    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/admin/users/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (!user) { res.status(404).json({ error: "Not found" }); return; }
    if (ADMIN_EMAILS.includes(user.email.toLowerCase())) { res.status(403).json({ error: "Cannot delete admin" }); return; }
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

router.get("/admin/courses", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "trainer")) return;
  try {
    const scope = await getScopedCourseIds(req);
    const baseCourses = scope === null
      ? await db.select().from(coursesTable).orderBy(desc(coursesTable.createdAt))
      : scope.length === 0
        ? []
        : await db.select().from(coursesTable).where(inArray(coursesTable.id, scope)).orderBy(desc(coursesTable.createdAt));
    const courses = baseCourses;
    const allLessons = await db.select().from(lessonsTable).orderBy(asc(lessonsTable.sortOrder));
    const allSections = await db.select().from(courseSectionsTable).orderBy(asc(courseSectionsTable.sortOrder));
    const allEnrollments = await db.select().from(enrollmentsTable);
    const result = courses.map(c => ({
      ...c,
      lessons: allLessons.filter(l => l.courseId === c.id),
      sections: allSections.filter(s => s.courseId === c.id),
      enrollmentCount: allEnrollments.filter(e => e.courseId === c.id).length,
    }));
    res.json({ courses: result });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

const COURSE_FIELDS = [
  "titleAr", "titleEn", "titleFr", "subtitleAr", "subtitleEn",
  "descriptionAr", "descriptionEn", "descriptionFr",
  "programId", "slug", "imageUrl", "trailerUrl",
  "price", "discountPrice", "level", "language", "category", "instructorId",
  "whatYouLearnAr", "whatYouLearnEn", "requirementsAr", "requirementsEn",
  "targetAudienceAr", "targetAudienceEn", "seoTitle", "seoDescription",
  "isPublished", "isFeatured",
];

router.post("/admin/courses", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    if (!req.body.titleAr || !req.body.titleEn) { res.status(400).json({ error: "titleAr and titleEn required" }); return; }
    const vals: CourseInsert = { titleAr: req.body.titleAr, titleEn: req.body.titleEn, titleFr: req.body.titleFr || "" };
    for (const key of COURSE_FIELDS) {
      if (req.body[key] !== undefined) (vals as Record<string, unknown>)[key] = req.body[key];
    }
    if (!vals.isPublished) vals.isPublished = false;
    const [course] = await db.insert(coursesTable).values(vals).returning();
    res.json({ course });
  } catch (err) {
    res.status(500).json({ error: "Failed to create course" });
  }
});

router.patch("/admin/courses/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const updates: Partial<CourseInsert> = {};
    for (const key of COURSE_FIELDS) {
      if (req.body[key] !== undefined) (updates as Record<string, unknown>)[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No fields" }); return; }
    const [course] = await db.update(coursesTable).set(updates).where(eq(coursesTable.id, id)).returning();
    if (!course) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ course });
  } catch (err) {
    res.status(500).json({ error: "Failed to update course" });
  }
});

router.delete("/admin/courses/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    await db.delete(coursesTable).where(eq(coursesTable.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete course" });
  }
});

router.post("/admin/courses/:courseId/lessons", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { courseId } = req.params;
    const { titleAr, titleEn, titleFr, videoUrl, videoType, durationMinutes, sortOrder, sectionId, isFreePreview, isPublished, descriptionAr, descriptionEn, resources } = req.body;
    let nextSortOrder = 0;
    if (sortOrder !== undefined && sortOrder !== null) {
      nextSortOrder = Number(sortOrder);
    } else {
      const [maxRow] = await db.select({ maxOrder: sql<number>`coalesce(max(sort_order), -1)` }).from(lessonsTable).where(eq(lessonsTable.courseId, courseId));
      nextSortOrder = (maxRow?.maxOrder ?? -1) + 1;
    }
    const [lesson] = await db.insert(lessonsTable).values({
      courseId, titleAr, titleEn, titleFr: titleFr || "", videoUrl, videoType: videoType || "youtube",
      durationMinutes, sortOrder: nextSortOrder, sectionId: sectionId || null,
      isFreePreview: isFreePreview ?? false, isPublished: isPublished ?? true,
      descriptionAr, descriptionEn, resources,
    }).returning();
    res.json({ lesson });
  } catch (err) {
    res.status(500).json({ error: "Failed to create lesson" });
  }
});

router.patch("/admin/lessons/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const updates: LessonUpdate = {};
    const allowedKeys: (keyof LessonUpdate)[] = ["titleAr", "titleEn", "titleFr", "videoUrl", "videoType", "durationMinutes", "sortOrder", "isPublished", "sectionId", "isFreePreview", "descriptionAr", "descriptionEn", "resources"];
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) (updates as Record<string, unknown>)[key] = req.body[key];
    }
    const [lesson] = await db.update(lessonsTable).set(updates).where(eq(lessonsTable.id, req.params.id)).returning();
    if (!lesson) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ lesson });
  } catch (err) {
    res.status(500).json({ error: "Failed to update lesson" });
  }
});

router.post("/admin/lessons/:id/resources", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const [lesson] = await db.select({ id: lessonsTable.id, resources: lessonsTable.resources }).from(lessonsTable).where(eq(lessonsTable.id, id));
    if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }
    const { titleAr, titleEn, url, type } = req.body;
    if (!titleAr || !url) { res.status(400).json({ error: "titleAr and url required" }); return; }
    const existing = (lesson.resources as LessonResource[]) ?? [];
    const updated: LessonResource[] = [...existing, { titleAr, titleEn: titleEn || titleAr, url, type: type || "link" }];
    const [updatedLesson] = await db.update(lessonsTable).set({ resources: updated }).where(eq(lessonsTable.id, id)).returning();
    res.json({ lesson: updatedLesson });
  } catch (err) {
    res.status(500).json({ error: "Failed to add resource" });
  }
});

router.delete("/admin/lessons/:id/resources/:idx", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id, idx } = req.params;
    const [lesson] = await db.select({ id: lessonsTable.id, resources: lessonsTable.resources }).from(lessonsTable).where(eq(lessonsTable.id, id));
    if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }
    const existing = (lesson.resources as LessonResource[]) ?? [];
    const updated = existing.filter((_, i) => i !== parseInt(idx));
    const [updatedLesson] = await db.update(lessonsTable).set({ resources: updated }).where(eq(lessonsTable.id, id)).returning();
    res.json({ lesson: updatedLesson });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove resource" });
  }
});

router.post("/admin/courses/:courseId/sections", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { courseId } = req.params;
    const { titleAr, titleEn, sortOrder } = req.body;
    if (!titleAr || !titleEn) { res.status(400).json({ error: "titleAr and titleEn required" }); return; }
    const [section] = await db.insert(courseSectionsTable).values({
      courseId, titleAr, titleEn, sortOrder: sortOrder ?? 0,
    }).returning();
    res.json({ section });
  } catch (err) {
    res.status(500).json({ error: "Failed to create section" });
  }
});

router.patch("/admin/sections/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const updates: SectionUpdate = {};
    const allowedKeys: (keyof SectionUpdate)[] = ["titleAr", "titleEn", "sortOrder", "isPublished"];
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) (updates as Record<string, unknown>)[key] = req.body[key];
    }
    const [section] = await db.update(courseSectionsTable).set(updates).where(eq(courseSectionsTable.id, req.params.id)).returning();
    if (!section) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ section });
  } catch (err) {
    res.status(500).json({ error: "Failed to update section" });
  }
});

router.delete("/admin/sections/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    await db.delete(courseSectionsTable).where(eq(courseSectionsTable.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete section" });
  }
});

router.post("/admin/courses/:id/duplicate", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const [original] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
    if (!original) { res.status(404).json({ error: "Not found" }); return; }
    const origSections = await db.select().from(courseSectionsTable).where(eq(courseSectionsTable.courseId, id)).orderBy(asc(courseSectionsTable.sortOrder));
    const origLessons = await db.select().from(lessonsTable).where(eq(lessonsTable.courseId, id)).orderBy(asc(lessonsTable.sortOrder));
    const course = await db.transaction(async (tx) => {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = original;
      const suffix = `-copy-${Date.now()}`;
      const [newCourse] = await tx.insert(coursesTable).values({
        ...rest,
        titleAr: `${rest.titleAr} (نسخة)`,
        titleEn: `${rest.titleEn} (copy)`,
        slug: rest.slug ? `${rest.slug}${suffix}` : null,
        isPublished: false,
      }).returning();
      const sectionIdMap: Record<string, string> = {};
      for (const s of origSections) {
        const { id: _sid, createdAt: _sc, courseId: _cid, ...sRest } = s;
        const [ns] = await tx.insert(courseSectionsTable).values({ ...sRest, courseId: newCourse.id }).returning();
        sectionIdMap[s.id] = ns.id;
      }
      for (const l of origLessons) {
        const { id: _lid, createdAt: _lc, courseId: _lcid, ...lRest } = l;
        await tx.insert(lessonsTable).values({
          ...lRest,
          courseId: newCourse.id,
          sectionId: lRest.sectionId ? (sectionIdMap[lRest.sectionId] ?? null) : null,
        });
      }
      return newCourse;
    });
    res.json({ course });
  } catch (err) {
    res.status(500).json({ error: "Failed to duplicate course" });
  }
});

router.delete("/admin/lessons/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    await db.delete(lessonsTable).where(eq(lessonsTable.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete lesson" });
  }
});

router.post("/admin/enrollments", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { userId, courseId } = req.body;
    const existing = await db.select().from(enrollmentsTable)
      .where(sql`${enrollmentsTable.userId} = ${userId} AND ${enrollmentsTable.courseId} = ${courseId}`);
    if (existing.length > 0) { res.status(409).json({ error: "Already enrolled" }); return; }
    const [enrollment] = await db.insert(enrollmentsTable).values({ userId, courseId }).returning();
    res.json({ enrollment });
  } catch (err) {
    res.status(500).json({ error: "Failed to enroll user" });
  }
});

router.delete("/admin/enrollments/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    await db.delete(enrollmentsTable).where(eq(enrollmentsTable.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove enrollment" });
  }
});

router.get("/admin/enrollments", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "trainer")) return;
  try {
    const scope = await getScopedCourseIds(req);
    if (scope !== null && scope.length === 0) {
      return res.json({ enrollments: [] });
    }
    const baseSelect = db.select({
      id: enrollmentsTable.id,
      userId: enrollmentsTable.userId,
      courseId: enrollmentsTable.courseId,
      status: enrollmentsTable.status,
      enrolledAt: enrollmentsTable.enrolledAt,
      userEmail: usersTable.email,
      userFirstName: usersTable.firstName,
      userLastName: usersTable.lastName,
      courseTitle: coursesTable.titleAr,
    })
    .from(enrollmentsTable)
    .leftJoin(usersTable, eq(enrollmentsTable.userId, usersTable.id))
    .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id));
    const enrollments = scope === null
      ? await baseSelect.orderBy(desc(enrollmentsTable.enrolledAt))
      : await baseSelect.where(inArray(enrollmentsTable.courseId, scope)).orderBy(desc(enrollmentsTable.enrolledAt));
    res.json({ enrollments });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch enrollments" });
  }
});

router.get("/admin/enrollment-requests", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "sales")) return;
  try {
    const requests = await db.select().from(enrollmentRequestsTable).orderBy(desc(enrollmentRequestsTable.createdAt));
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

router.patch("/admin/enrollment-requests/:id", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "sales")) return;
  try {
    const { status, adminNotes } = req.body;
    const updates: { status?: string; adminNotes?: string } = {};
    if (status !== undefined) {
      if (!ORDER_STATUSES.includes(status) && !["approved", "rejected"].includes(status)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }
      updates.status = status;
    }
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No fields" }); return; }
    const [updated] = await db.update(enrollmentRequestsTable).set(updates).where(eq(enrollmentRequestsTable.id, req.params.id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    if (updated.userId && (updates.status === "approved" || updates.status === "rejected")) {
      const approved = updates.status === "approved";
      await createNotification({
        userId: updated.userId,
        type: approved ? "enrollment_approved" : "enrollment_rejected",
        titleAr: approved ? "تم قبول طلب تسجيلك ✅" : "تم رفض طلب تسجيلك",
        titleEn: approved ? "Your enrollment was approved ✅" : "Your enrollment was rejected",
        bodyAr: approved
          ? "يمكنك الآن متابعة دورتك من لوحة التحكم."
          : "يرجى التواصل معنا للمزيد من التفاصيل.",
        bodyEn: approved
          ? "You can now follow your course from the dashboard."
          : "Please contact us for more details.",
        link: "/dashboard?tab=courses",
      });
    }
    res.json({ request: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update request" });
  }
});

// Sales/support staff need read access + status updates for the order pipeline.
const ORDER_STATUSES = ["new", "contacted", "paid", "completed", "cancelled",
  // Legacy values kept for backward compatibility with rows already in the DB.
  "pending", "confirmed", "shipped", "delivered"] as const;

router.get("/admin/workbook-orders", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "sales")) return;
  try {
    const orders = await db.select().from(workbookOrdersTable).orderBy(desc(workbookOrdersTable.createdAt));
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.patch("/admin/workbook-orders/:id", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "sales")) return;
  try {
    const { status, adminNotes } = req.body;
    const updates: { status?: string; adminNotes?: string } = {};
    if (status !== undefined) {
      if (!ORDER_STATUSES.includes(status)) {
        res.status(400).json({ error: "Invalid status", allowed: ORDER_STATUSES });
        return;
      }
      updates.status = status;
    }
    // Sales role is restricted to status + notes, never the order contents.
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No fields" }); return; }
    const [updated] = await db.update(workbookOrdersTable).set(updates).where(eq(workbookOrdersTable.id, req.params.id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ order: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

router.get("/my/courses", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const enrollments = await db.select({
      enrollmentId: enrollmentsTable.id,
      courseId: enrollmentsTable.courseId,
      status: enrollmentsTable.status,
      enrolledAt: enrollmentsTable.enrolledAt,
      slug: coursesTable.slug,
      titleAr: coursesTable.titleAr,
      titleEn: coursesTable.titleEn,
      titleFr: coursesTable.titleFr,
      descriptionAr: coursesTable.descriptionAr,
      descriptionEn: coursesTable.descriptionEn,
      descriptionFr: coursesTable.descriptionFr,
      imageUrl: coursesTable.imageUrl,
      programId: coursesTable.programId,
    })
    .from(enrollmentsTable)
    .innerJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
    .where(and(eq(enrollmentsTable.userId, req.user.id), eq(enrollmentsTable.status, "active")));

    const courseIds = enrollments.map(e => e.courseId);
    let lessons: Record<string, unknown>[] = [];
    let progress: Record<string, unknown>[] = [];
    if (courseIds.length > 0) {
      lessons = await db.select().from(lessonsTable)
        .where(inArray(lessonsTable.courseId, courseIds))
        .orderBy(asc(lessonsTable.sortOrder));
      progress = await db.select().from(lessonProgressTable)
        .where(eq(lessonProgressTable.userId, req.user.id));
    }

    const result = enrollments.map(e => ({
      ...e,
      lessons: lessons.filter(l => l.courseId === e.courseId),
      progress: progress.filter(p => lessons.some(l => l.id === p.lessonId && l.courseId === e.courseId)),
    }));

    res.json({ courses: result });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

router.post("/my/lessons/:lessonId/complete", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;
    const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId));
    if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }
    const enrollment = await db.select().from(enrollmentsTable)
      .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.courseId, lesson.courseId)));
    if (enrollment.length === 0) { res.status(403).json({ error: "Not enrolled in this course" }); return; }

    // Gate: when the lesson has any required+published interactive activity,
    // completion must be derived from those activities (auto-flipped by the
    // activities route). Manual completion is rejected so students can't bypass.
    const requiredActs = await db.execute(sql`
      SELECT id FROM lesson_activities
      WHERE lesson_id = ${lessonId} AND is_required = true AND is_published = true
      LIMIT 1
    `);
    if (requiredActs.rows.length > 0) {
      res.status(409).json({
        error: "lesson_requires_activities",
        message: "أكمل جميع الأنشطة المطلوبة لهذا الدرس أولاً",
        messageEn: "Complete all required activities for this lesson first",
      });
      return;
    }

    const existing = await db.select().from(lessonProgressTable)
      .where(and(eq(lessonProgressTable.userId, userId), eq(lessonProgressTable.lessonId, lessonId)));
    const wasAlreadyCompleted = existing.length > 0 && existing[0].completed === true;
    if (existing.length > 0) {
      await db.update(lessonProgressTable).set({ completed: true, completedAt: new Date() })
        .where(eq(lessonProgressTable.id, existing[0].id));
    } else {
      await db.insert(lessonProgressTable).values({ userId, lessonId, completed: true, completedAt: new Date() });
    }

    // ── Badges: only fire on a fresh completion to avoid spam on re-clicks
    const newlyAwarded: { key: string; titleAr: string; titleEn: string; icon: string; colorClass: string }[] = [];
    if (!wasAlreadyCompleted) {
      try {
        const r1 = await awardBadgeIfEligible(userId, "lesson_completed", { lessonId });
        for (const b of r1.awarded) newlyAwarded.push({ key: b.key, titleAr: b.titleAr, titleEn: b.titleEn, icon: b.icon, colorClass: b.colorClass });

        // Course progress check (only published lessons count).
        const allLessons = await db.select({ id: lessonsTable.id }).from(lessonsTable)
          .where(and(eq(lessonsTable.courseId, lesson.courseId), eq(lessonsTable.isPublished, true)));
        const lessonIds = allLessons.map(l => l.id);
        if (lessonIds.length > 0) {
          const completedRows = await db.select({ id: lessonProgressTable.lessonId })
            .from(lessonProgressTable)
            .where(and(
              eq(lessonProgressTable.userId, userId),
              eq(lessonProgressTable.completed, true),
              inArray(lessonProgressTable.lessonId, lessonIds),
            ));
          const completedCount = completedRows.length;
          const ratio = completedCount / lessonIds.length;
          if (ratio >= 0.5) {
            const r2 = await awardBadgeIfEligible(userId, "course_half_done", { courseId: lesson.courseId });
            for (const b of r2.awarded) newlyAwarded.push({ key: b.key, titleAr: b.titleAr, titleEn: b.titleEn, icon: b.icon, colorClass: b.colorClass });
          }
          if (completedCount >= lessonIds.length) {
            const r3 = await awardBadgeIfEligible(userId, "course_completed", { courseId: lesson.courseId });
            for (const b of r3.awarded) newlyAwarded.push({ key: b.key, titleAr: b.titleAr, titleEn: b.titleEn, icon: b.icon, colorClass: b.colorClass });
          }
        }
      } catch (err) {
        req.log.warn({ err }, "[BADGE] lesson completion award failed");
      }
    }
    res.json({ success: true, awardedBadges: newlyAwarded });
  } catch (err) {
    res.status(500).json({ error: "Failed to update progress" });
  }
});

router.get("/admin/instructors", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const instructors = await db.select().from(instructorsTable).orderBy(asc(instructorsTable.nameAr));
    res.json({ instructors });
  } catch { res.status(500).json({ error: "Failed to fetch instructors" }); }
});

router.post("/admin/instructors", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { nameAr, nameEn, bioAr, bioEn, photoUrl, email } = req.body;
    if (!nameAr || !nameEn) { res.status(400).json({ error: "nameAr and nameEn required" }); return; }
    const [instructor] = await db.insert(instructorsTable).values({ nameAr, nameEn, bioAr, bioEn, photoUrl, email }).returning();
    res.json({ instructor });
  } catch { res.status(500).json({ error: "Failed to create instructor" }); }
});

router.patch("/admin/instructors/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const updates: InstructorUpdate = {};
    const allowedKeys: (keyof InstructorUpdate)[] = ["nameAr", "nameEn", "bioAr", "bioEn", "photoUrl", "email"];
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) (updates as Record<string, unknown>)[key] = req.body[key];
    }
    const [instructor] = await db.update(instructorsTable).set(updates).where(eq(instructorsTable.id, req.params.id)).returning();
    if (!instructor) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ instructor });
  } catch { res.status(500).json({ error: "Failed to update instructor" }); }
});

router.delete("/admin/instructors/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    await db.delete(instructorsTable).where(eq(instructorsTable.id, req.params.id));
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to delete instructor" }); }
});

router.get("/admin/revenue", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalRow] = await db
      .select({ total: sql<number>`COALESCE(SUM(${ordersTable.amount}), 0)::int` })
      .from(ordersTable).where(eq(ordersTable.status, "paid"));
    const [pendingRow] = await db
      .select({ total: sql<number>`COALESCE(SUM(${ordersTable.amount}), 0)::int`, count: sql<number>`count(*)::int` })
      .from(ordersTable).where(eq(ordersTable.status, "pending"));
    const [cancelledRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ordersTable).where(eq(ordersTable.status, "cancelled"));
    const [paidCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ordersTable).where(eq(ordersTable.status, "paid"));
    const byCourse = await db
      .select({
        courseId: ordersTable.courseId,
        courseTitleAr: coursesTable.titleAr,
        courseTitleEn: coursesTable.titleEn,
        revenue: sql<number>`COALESCE(SUM(${ordersTable.amount}), 0)::int`,
        orders: sql<number>`count(*)::int`,
      })
      .from(ordersTable)
      .leftJoin(coursesTable, eq(ordersTable.courseId, coursesTable.id))
      .where(eq(ordersTable.status, "paid"))
      .groupBy(ordersTable.courseId, coursesTable.titleAr, coursesTable.titleEn)
      .orderBy(desc(sql`SUM(${ordersTable.amount})`));
    const last30Days = await db
      .select({
        date: sql<string>`DATE(${ordersTable.createdAt})::text`,
        revenue: sql<number>`COALESCE(SUM(${ordersTable.amount}), 0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(ordersTable)
      .where(and(eq(ordersTable.status, "paid"), gte(ordersTable.createdAt, thirtyDaysAgo)))
      .groupBy(sql`DATE(${ordersTable.createdAt})`)
      .orderBy(asc(sql`DATE(${ordersTable.createdAt})`));
    const topEnrolled = await db
      .select({
        courseId: enrollmentsTable.courseId,
        courseTitleAr: coursesTable.titleAr,
        courseTitleEn: coursesTable.titleEn,
        enrollments: sql<number>`count(*)::int`,
      })
      .from(enrollmentsTable)
      .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
      .groupBy(enrollmentsTable.courseId, coursesTable.titleAr, coursesTable.titleEn)
      .orderBy(desc(sql`count(*)`))
      .limit(5);
    res.json({
      totalRevenue: totalRow.total,
      paidOrders: paidCountRow.count,
      pendingRevenue: pendingRow.total,
      pendingOrders: pendingRow.count,
      cancelledOrders: cancelledRow.count,
      byCourse,
      last30Days,
      topEnrolled,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch revenue" });
  }
});

const VALID_ORDER_STATUSES = ["pending", "paid", "cancelled"] as const;
type OrderStatus = typeof VALID_ORDER_STATUSES[number];

async function adminGetLmsOrders(req: Request, res: Response) {
  if (!requireRole(req, res, "sales")) return;
  try {
    const orders = await db
      .select({
        id: ordersTable.id,
        courseId: ordersTable.courseId,
        courseTitleAr: coursesTable.titleAr,
        courseTitleEn: coursesTable.titleEn,
        userId: ordersTable.userId,
        buyerName: ordersTable.buyerName,
        buyerEmail: ordersTable.buyerEmail,
        buyerPhone: ordersTable.buyerPhone,
        amount: ordersTable.amount,
        currency: ordersTable.currency,
        status: ordersTable.status,
        paymentNotes: ordersTable.paymentNotes,
        adminNotes: ordersTable.adminNotes,
        adminApprovedBy: ordersTable.adminApprovedBy,
        createdAt: ordersTable.createdAt,
        updatedAt: ordersTable.updatedAt,
      })
      .from(ordersTable)
      .leftJoin(coursesTable, eq(ordersTable.courseId, coursesTable.id))
      .orderBy(desc(ordersTable.createdAt));
    res.json({ orders: orders.map(o => ({ ...o, courseTitle: o.courseTitleAr ?? o.courseTitleEn ?? null })) });
  } catch {
    res.status(500).json({ error: "Failed to fetch LMS orders" });
  }
}

async function adminPatchLmsOrder(req: Request, res: Response) {
  if (!requireRole(req, res, "sales")) return;
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body as { status?: string; adminNotes?: string };

    if (status !== undefined && !VALID_ORDER_STATUSES.includes(status as OrderStatus)) {
      res.status(400).json({ error: "Invalid status. Must be pending, paid, or cancelled." });
      return;
    }

    if (status === "pending") {
      const [current] = await db.select({ status: ordersTable.status }).from(ordersTable).where(eq(ordersTable.id, id));
      if (current && (current.status === "paid" || current.status === "cancelled")) {
        res.status(400).json({ error: "Cannot revert a terminal order status back to pending." });
        return;
      }
    }

    const updates: { updatedAt: Date; status?: string; adminNotes?: string; adminApprovedBy?: string } = { updatedAt: new Date() };
    if (status !== undefined) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (status === "paid" && req.user) updates.adminApprovedBy = req.user.id;

    let order: typeof ordersTable.$inferSelect | undefined;
    await db.transaction(async (tx) => {
      const [updated] = await tx.update(ordersTable).set(updates).where(eq(ordersTable.id, id)).returning();
      if (!updated) return;
      order = updated;

      if (updated.userId && updated.courseId && (status === "paid" || status === "cancelled")) {
        const existing = await tx
          .select()
          .from(enrollmentsTable)
          .where(and(eq(enrollmentsTable.userId, updated.userId), eq(enrollmentsTable.courseId, updated.courseId)));
        if (status === "paid") {
          if (existing.length === 0) {
            await tx.insert(enrollmentsTable).values({ userId: updated.userId, courseId: updated.courseId, status: "active", enrolledAt: new Date() });
          } else if (existing[0].status !== "active") {
            await tx.update(enrollmentsTable).set({ status: "active" }).where(eq(enrollmentsTable.id, existing[0].id));
          }
        } else if (status === "cancelled" && existing.length > 0 && existing[0].status === "active") {
          await tx.update(enrollmentsTable).set({ status: "suspended" }).where(eq(enrollmentsTable.id, existing[0].id));
        }
      }
    });
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    res.json({ order });
  } catch {
    res.status(500).json({ error: "Failed to update LMS order" });
  }
}

router.get("/admin/lms-orders", adminGetLmsOrders);

router.get("/admin/student-progress", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const enrollments = await db
      .select({
        enrollmentId: enrollmentsTable.id,
        userId: enrollmentsTable.userId,
        courseId: enrollmentsTable.courseId,
        status: enrollmentsTable.status,
        enrolledAt: enrollmentsTable.enrolledAt,
        userEmail: usersTable.email,
        userFirstName: usersTable.firstName,
        userLastName: usersTable.lastName,
        courseTitleAr: coursesTable.titleAr,
        courseTitleEn: coursesTable.titleEn,
        courseSlug: coursesTable.slug,
      })
      .from(enrollmentsTable)
      .leftJoin(usersTable, eq(enrollmentsTable.userId, usersTable.id))
      .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
      .orderBy(desc(enrollmentsTable.enrolledAt));

    const allLessons = await db
      .select({ id: lessonsTable.id, courseId: lessonsTable.courseId })
      .from(lessonsTable);
    const lessonsByCourse = new Map<string, Set<string>>();
    for (const l of allLessons) {
      if (!lessonsByCourse.has(l.courseId)) lessonsByCourse.set(l.courseId, new Set());
      lessonsByCourse.get(l.courseId)!.add(l.id);
    }

    const allProgress = await db
      .select({
        userId: lessonProgressTable.userId,
        lessonId: lessonProgressTable.lessonId,
        completedAt: lessonProgressTable.completedAt,
      })
      .from(lessonProgressTable)
      .where(eq(lessonProgressTable.completed, true));

    const progressByUser = new Map<string, { lessonId: string; completedAt: Date | null }[]>();
    for (const p of allProgress) {
      if (!progressByUser.has(p.userId)) progressByUser.set(p.userId, []);
      progressByUser.get(p.userId)!.push({ lessonId: p.lessonId, completedAt: p.completedAt });
    }

    const progress = enrollments.map((e) => {
      const courseLessons = lessonsByCourse.get(e.courseId) ?? new Set();
      const totalLessons = courseLessons.size;
      const userProgress = progressByUser.get(e.userId) ?? [];
      const matched = userProgress.filter((p) => courseLessons.has(p.lessonId));
      const completedLessons = matched.length;
      const lastActivityAt = matched.reduce<Date | null>((acc, p) => {
        if (!p.completedAt) return acc;
        if (!acc || p.completedAt > acc) return p.completedAt;
        return acc;
      }, null);
      const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      return {
        ...e,
        totalLessons,
        completedLessons,
        progressPct,
        lastActivityAt,
      };
    });

    res.json({ progress });
  } catch {
    res.status(500).json({ error: "Failed to fetch student progress" });
  }
});
router.get("/admin/orders", adminGetLmsOrders);
router.patch("/admin/lms-orders/:id", adminPatchLmsOrder);
router.patch("/admin/orders/:id", adminPatchLmsOrder);

// ===== Reviews moderation =====
router.get("/admin/reviews", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "trainer")) return;
  try {
    const scope = await getScopedCourseIds(req);
    if (scope !== null && scope.length === 0) {
      return res.json({ reviews: [] });
    }
    const baseSelect = db
      .select({
        id: reviewsTable.id,
        userId: reviewsTable.userId,
        courseId: reviewsTable.courseId,
        rating: reviewsTable.rating,
        commentAr: reviewsTable.commentAr,
        commentEn: reviewsTable.commentEn,
        reviewerName: reviewsTable.reviewerName,
        createdAt: reviewsTable.createdAt,
        userEmail: usersTable.email,
        userFirstName: usersTable.firstName,
        userLastName: usersTable.lastName,
        courseTitleAr: coursesTable.titleAr,
        courseTitleEn: coursesTable.titleEn,
      })
      .from(reviewsTable)
      .leftJoin(usersTable, eq(usersTable.id, reviewsTable.userId))
      .leftJoin(coursesTable, eq(coursesTable.id, reviewsTable.courseId));
    const rows = scope === null
      ? await baseSelect.orderBy(desc(reviewsTable.createdAt))
      : await baseSelect.where(inArray(reviewsTable.courseId, scope)).orderBy(desc(reviewsTable.createdAt));
    res.json({ reviews: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to list reviews");
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.delete("/admin/reviews/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    await db.delete(reviewsTable).where(eq(reviewsTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete review");
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// ===== Site settings (singleton) =====
async function ensureSettingsRow() {
  const existing = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.id, "default")).limit(1);
  if (existing.length > 0) return existing[0];
  const inserted = await db
    .insert(siteSettingsTable)
    .values({ id: "default" })
    .onConflictDoNothing()
    .returning();
  if (inserted.length > 0) return inserted[0];
  const after = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.id, "default")).limit(1);
  return after[0];
}

router.get("/admin/settings", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const settings = await ensureSettingsRow();
    res.json({ settings });
  } catch (err) {
    req.log.error({ err }, "Failed to load settings");
    res.status(500).json({ error: "Failed to load settings" });
  }
});

router.patch("/admin/settings", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const allowed = [
      "siteNameAr", "siteNameEn", "logoUrl", "defaultLang", "defaultCurrency",
      "contactEmail", "contactPhone", "whatsappNumber",
      "facebookUrl", "instagramUrl", "youtubeUrl", "twitterUrl",
      "privacyPolicyAr", "privacyPolicyEn", "termsAr", "termsEn",
    ] as const;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const update: Record<string, string | null> = {};
    for (const key of allowed) {
      if (key in body) {
        const v = body[key];
        if (v === null || v === "") update[key] = null;
        else if (typeof v === "string") update[key] = v;
      }
    }
    if (update.defaultLang && update.defaultLang !== "ar" && update.defaultLang !== "en") {
      return res.status(400).json({ error: "defaultLang must be 'ar' or 'en'" });
    }
    await ensureSettingsRow();
    const updated = await db
      .update(siteSettingsTable)
      .set(update)
      .where(eq(siteSettingsTable.id, "default"))
      .returning();
    res.json({ settings: updated[0] });
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// ===== Speech Evaluations (lead-gen) =====
const SPEECH_EVAL_STATUSES = ["pending", "in_review", "completed", "converted", "cancelled"] as const;
type SpeechEvalStatus = (typeof SPEECH_EVAL_STATUSES)[number];

const RUBRIC_CRITERIA = [
  "clarity",
  "voice",
  "body_language",
  "structure",
  "content",
  "presence",
  "impact",
] as const;
type RubricCriterion = (typeof RUBRIC_CRITERIA)[number];

const PROGRAM_RECOMMENDATIONS = ["core", "tot", "teachers", "children", "none"] as const;
type ProgramRecommendation = (typeof PROGRAM_RECOMMENDATIONS)[number];

function computeOverallScore(rubric: Record<string, number> | null | undefined): number | null {
  if (!rubric) return null;
  const vals: number[] = [];
  for (const k of RUBRIC_CRITERIA) {
    const v = rubric[k];
    if (typeof v === "number" && Number.isFinite(v)) vals.push(Math.max(0, Math.min(100, v)));
  }
  if (vals.length === 0) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function isRubricComplete(rubric: Record<string, number> | null | undefined): boolean {
  if (!rubric) return false;
  return RUBRIC_CRITERIA.every((k) => {
    const v = rubric[k];
    return typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100;
  });
}

// List trainers (used by the speech evaluation assignment dropdown).
// Only role='trainer' is returned; admins are intentionally excluded so the
// dropdown reflects assignable trainer accounts.
router.get("/admin/trainers", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const rows = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        role: usersTable.role,
      })
      .from(usersTable)
      .where(sql`${usersTable.role} = 'trainer'`)
      .orderBy(asc(usersTable.email));
    res.json({ trainers: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to list trainers");
    res.status(500).json({ error: "Failed to list trainers" });
  }
});

// ===== Trainer "ملاحظاتي عن الطالب" — private notes a trainer keeps about a learner =====
router.get("/admin/learners/:learnerId/trainer-notes", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "trainer")) return;
  try {
    const learnerId = req.params.learnerId;
    if (isAdmin(req)) {
      const rows = await db
        .select()
        .from(trainerLearnerNotesTable)
        .where(eq(trainerLearnerNotesTable.learnerId, learnerId))
        .orderBy(desc(trainerLearnerNotesTable.updatedAt));
      return res.json({ notes: rows });
    }
    const trainerId = req.user!.id;
    // Verify the trainer is assigned to at least one course this learner is enrolled in.
    const scope = await getScopedCourseIds(req);
    if (scope === null || scope.length === 0) return res.json({ notes: [] });
    const enrolled = await db
      .select({ courseId: enrollmentsTable.courseId })
      .from(enrollmentsTable)
      .where(and(eq(enrollmentsTable.userId, learnerId), inArray(enrollmentsTable.courseId, scope)));
    if (enrolled.length === 0) {
      return res.status(403).json({ error: "Forbidden: learner not in your courses" });
    }
    const rows = await db
      .select()
      .from(trainerLearnerNotesTable)
      .where(and(
        eq(trainerLearnerNotesTable.learnerId, learnerId),
        eq(trainerLearnerNotesTable.trainerId, trainerId),
      ))
      .orderBy(desc(trainerLearnerNotesTable.updatedAt));
    res.json({ notes: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to list trainer notes");
    res.status(500).json({ error: "Failed to fetch trainer notes" });
  }
});

router.post("/admin/learners/:learnerId/trainer-notes", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "trainer")) return;
  try {
    const learnerId = req.params.learnerId;
    const note = typeof req.body?.note === "string" ? req.body.note.trim() : "";
    const courseId = typeof req.body?.courseId === "string" && req.body.courseId ? req.body.courseId : null;
    if (!note) return res.status(400).json({ error: "note required" });
    if (note.length > 4000) return res.status(400).json({ error: "note too long (max 4000)" });
    const trainerId = req.user!.id;
    if (!isAdmin(req)) {
      const scope = await getScopedCourseIds(req);
      if (scope === null || scope.length === 0) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const enrolled = await db
        .select({ courseId: enrollmentsTable.courseId })
        .from(enrollmentsTable)
        .where(and(eq(enrollmentsTable.userId, learnerId), inArray(enrollmentsTable.courseId, scope)));
      if (enrolled.length === 0) {
        return res.status(403).json({ error: "Forbidden: learner not in your courses" });
      }
      if (courseId && !scope.includes(courseId)) {
        return res.status(403).json({ error: "Forbidden: course not in your scope" });
      }
    }
    const [row] = await db.insert(trainerLearnerNotesTable).values({
      trainerId, learnerId, courseId, note,
    }).returning();
    res.json({ note: row });
  } catch (err) {
    req.log.error({ err }, "Failed to create trainer note");
    res.status(500).json({ error: "Failed to create trainer note" });
  }
});

router.delete("/admin/trainer-notes/:id", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "trainer")) return;
  try {
    const [existing] = await db.select().from(trainerLearnerNotesTable).where(eq(trainerLearnerNotesTable.id, req.params.id));
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (!isAdmin(req) && existing.trainerId !== req.user!.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    await db.delete(trainerLearnerNotesTable).where(eq(trainerLearnerNotesTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete trainer note");
    res.status(500).json({ error: "Failed to delete trainer note" });
  }
});

router.get("/admin/speech-evaluations", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "trainer")) return;
  try {
    const rows = isAdmin(req)
      ? await db
          .select()
          .from(speechEvaluationsTable)
          .orderBy(desc(speechEvaluationsTable.createdAt))
      : await db
          .select()
          .from(speechEvaluationsTable)
          .where(eq(speechEvaluationsTable.assignedTrainerUserId, req.user!.id))
          .orderBy(desc(speechEvaluationsTable.createdAt));
    res.json({ evaluations: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to list speech evaluations");
    res.status(500).json({ error: "Failed to fetch speech evaluations" });
  }
});

router.patch("/admin/speech-evaluations/:id", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "trainer")) return;
  // Trainers can only update evaluations explicitly assigned to them; cross-trainer
  // mutations return 403. Admins are unrestricted.
  if (!isAdmin(req)) {
    const [owned] = await db
      .select({ assignedTrainerUserId: speechEvaluationsTable.assignedTrainerUserId })
      .from(speechEvaluationsTable)
      .where(eq(speechEvaluationsTable.id, req.params.id));
    if (!owned) return res.status(404).json({ error: "Not found" });
    if (owned.assignedTrainerUserId !== req.user!.id) {
      return res.status(403).json({ error: "Forbidden: not assigned to this evaluation" });
    }
  }
  try {
    const body = (req.body ?? {}) as {
      status?: unknown;
      trainerFeedback?: unknown;
      trainerScore?: unknown;
      rubricScores?: unknown;
      rubricNotes?: unknown;
      programRecommendation?: unknown;
      finalReportMd?: unknown;
      assignedTrainerUserId?: unknown;
      publish?: unknown;
    };
    const update: Record<string, unknown> = {};

    if (typeof body.status === "string") {
      if (!SPEECH_EVAL_STATUSES.includes(body.status as SpeechEvalStatus)) {
        return res.status(400).json({ error: `Invalid status. Allowed: ${SPEECH_EVAL_STATUSES.join(", ")}` });
      }
      update.status = body.status;
    }
    if (typeof body.trainerFeedback === "string") update.trainerFeedback = body.trainerFeedback;
    if (typeof body.trainerScore === "number" && Number.isFinite(body.trainerScore)) {
      update.trainerScore = body.trainerScore;
    }

    // ── Rubric (validated) ───────────────────────────────────────────
    let nextRubric: Record<string, number> | null | undefined = undefined;
    if (body.rubricScores !== undefined) {
      if (body.rubricScores === null) {
        nextRubric = null;
      } else if (typeof body.rubricScores === "object") {
        const sanitized: Record<string, number> = {};
        for (const [k, v] of Object.entries(body.rubricScores as Record<string, unknown>)) {
          if (!(RUBRIC_CRITERIA as readonly string[]).includes(k)) continue;
          if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 100) {
            return res.status(400).json({ error: `Rubric score "${k}" must be a number between 0 and 100` });
          }
          sanitized[k as RubricCriterion] = Math.round(v);
        }
        nextRubric = sanitized;
      } else {
        return res.status(400).json({ error: "rubricScores must be an object" });
      }
      update.rubricScores = nextRubric;
      update.overallScore = computeOverallScore(nextRubric);
    }

    // ── Rubric notes (per-criterion qualitative feedback) ────────────
    if (body.rubricNotes !== undefined) {
      if (body.rubricNotes === null) {
        update.rubricNotes = null;
      } else if (typeof body.rubricNotes === "object") {
        const sanitizedNotes: Record<string, string> = {};
        for (const [k, v] of Object.entries(body.rubricNotes as Record<string, unknown>)) {
          if (!(RUBRIC_CRITERIA as readonly string[]).includes(k)) continue;
          if (v === null || v === "") continue;
          if (typeof v !== "string") {
            return res.status(400).json({ error: `Rubric note "${k}" must be a string` });
          }
          if (v.length > 2000) {
            return res.status(400).json({ error: `Rubric note "${k}" too long (max 2000 chars)` });
          }
          sanitizedNotes[k] = v;
        }
        update.rubricNotes = Object.keys(sanitizedNotes).length > 0 ? sanitizedNotes : null;
      } else {
        return res.status(400).json({ error: "rubricNotes must be an object" });
      }
    }

    if (body.programRecommendation !== undefined) {
      if (body.programRecommendation === null || body.programRecommendation === "") {
        update.programRecommendation = null;
      } else if (
        typeof body.programRecommendation === "string" &&
        (PROGRAM_RECOMMENDATIONS as readonly string[]).includes(body.programRecommendation)
      ) {
        update.programRecommendation = body.programRecommendation as ProgramRecommendation;
      } else {
        return res.status(400).json({
          error: `programRecommendation must be one of ${PROGRAM_RECOMMENDATIONS.join(", ")}`,
        });
      }
    }

    if (body.finalReportMd !== undefined) {
      if (body.finalReportMd === null || body.finalReportMd === "") {
        update.finalReportMd = null;
      } else if (typeof body.finalReportMd === "string") {
        if (body.finalReportMd.length > 50000) {
          return res.status(400).json({ error: "finalReportMd too long (max 50000 chars)" });
        }
        update.finalReportMd = body.finalReportMd;
      } else {
        return res.status(400).json({ error: "finalReportMd must be a string" });
      }
    }

    if (body.assignedTrainerUserId !== undefined) {
      if (!isAdmin(req)) {
        return res.status(403).json({ error: "Only admins can reassign evaluations" });
      }
      if (body.assignedTrainerUserId === null || body.assignedTrainerUserId === "") {
        update.assignedTrainerUserId = null;
      } else if (typeof body.assignedTrainerUserId === "string") {
        // Verify the user exists and is a trainer/admin
        const [trainer] = await db
          .select({ id: usersTable.id, role: usersTable.role })
          .from(usersTable)
          .where(eq(usersTable.id, body.assignedTrainerUserId));
        if (!trainer) return res.status(400).json({ error: "Trainer user not found" });
        if (trainer.role !== "trainer" && trainer.role !== "admin") {
          return res.status(400).json({ error: "Assigned user must be a trainer or admin" });
        }
        update.assignedTrainerUserId = trainer.id;
      } else {
        return res.status(400).json({ error: "assignedTrainerUserId must be a string or null" });
      }
    }

    // Need to know the existing record for publish gating + audit log diff
    const [existing] = await db
      .select()
      .from(speechEvaluationsTable)
      .where(eq(speechEvaluationsTable.id, req.params.id));
    if (!existing) return res.status(404).json({ error: "Not found" });

    // ── Publish gating ────────────────────────────────────────────────
    const publishRequested = body.publish === true;
    let isPublishingNow = false;
    if (publishRequested) {
      const effectiveRubric =
        nextRubric !== undefined ? nextRubric : (existing.rubricScores as Record<string, number> | null);
      const effectiveReport =
        update.finalReportMd !== undefined ? (update.finalReportMd as string | null) : existing.finalReportMd;
      const effectiveRecommendation =
        update.programRecommendation !== undefined
          ? (update.programRecommendation as string | null)
          : existing.programRecommendation;
      if (!isRubricComplete(effectiveRubric)) {
        return res.status(400).json({
          error: "Cannot publish: rubric is incomplete (all 7 criteria must have a score 0-100)",
        });
      }
      if (!effectiveReport || !effectiveReport.trim()) {
        return res.status(400).json({ error: "Cannot publish: finalReportMd is required" });
      }
      if (!effectiveRecommendation) {
        return res.status(400).json({ error: "Cannot publish: programRecommendation is required" });
      }
      isPublishingNow = !existing.reportPublishedAt;
      update.reportPublishedAt = new Date();
      update.status = "completed";
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const [updated] = await db
      .update(speechEvaluationsTable)
      .set(update)
      .where(eq(speechEvaluationsTable.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });

    // ── Audit log + badges on first publish ──────────────────────────
    if (isPublishingNow) {
      try {
        await recordAuditLog({
          actor: { id: req.user?.id ?? null, email: req.user?.email ?? null },
          action: "speech_evaluation.published",
          entityType: "speech_evaluation",
          entityId: updated.id,
          description: `Published evaluation for ${updated.fullName}`,
          before: { reportPublishedAt: existing.reportPublishedAt, status: existing.status },
          after: {
            reportPublishedAt: updated.reportPublishedAt,
            status: updated.status,
            overallScore: updated.overallScore,
            programRecommendation: updated.programRecommendation,
          },
        });
      } catch (err) {
        req.log.warn({ err }, "audit log failed for evaluation publish");
      }
      if (updated.userId) {
        try {
          await awardBadgeIfEligible(updated.userId, "evaluation_published", {
            evaluationId: updated.id,
            overallScore: updated.overallScore,
          });
          if (typeof updated.overallScore === "number" && updated.overallScore >= 85) {
            await awardBadgeIfEligible(updated.userId, "evaluation_high_score", {
              evaluationId: updated.id,
              overallScore: updated.overallScore,
            });
          }
        } catch (err) {
          req.log.warn({ err }, "[BADGE] evaluation_published award failed");
        }
      }
    }

    res.json({ evaluation: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update speech evaluation");
    res.status(500).json({ error: "Failed to update speech evaluation" });
  }
});

export default router;
