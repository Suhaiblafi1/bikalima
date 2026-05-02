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
import { db as _db, courseTrainersTable } from "@workspace/db";
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

const router: IRouter = Router();

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
  if (!requireAdmin(req, res)) return;
  try {
    const courses = await db.select().from(coursesTable).orderBy(desc(coursesTable.createdAt));
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
  if (!requireAdmin(req, res)) return;
  try {
    const enrollments = await db.select({
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
    .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
    .orderBy(desc(enrollmentsTable.enrolledAt));
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
    const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId));
    if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }
    const enrollment = await db.select().from(enrollmentsTable)
      .where(and(eq(enrollmentsTable.userId, req.user.id), eq(enrollmentsTable.courseId, lesson.courseId)));
    if (enrollment.length === 0) { res.status(403).json({ error: "Not enrolled in this course" }); return; }
    const existing = await db.select().from(lessonProgressTable)
      .where(and(eq(lessonProgressTable.userId, req.user.id), eq(lessonProgressTable.lessonId, lessonId)));
    if (existing.length > 0) {
      await db.update(lessonProgressTable).set({ completed: true, completedAt: new Date() })
        .where(eq(lessonProgressTable.id, existing[0].id));
    } else {
      await db.insert(lessonProgressTable).values({ userId: req.user.id, lessonId, completed: true, completedAt: new Date() });
    }
    res.json({ success: true });
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
  if (!requireAdmin(req, res)) return;
  try {
    const rows = await db
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
      .leftJoin(coursesTable, eq(coursesTable.id, reviewsTable.courseId))
      .orderBy(desc(reviewsTable.createdAt));
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

router.get("/admin/speech-evaluations", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const rows = await db
      .select()
      .from(speechEvaluationsTable)
      .orderBy(desc(speechEvaluationsTable.createdAt));
    res.json({ evaluations: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to list speech evaluations");
    res.status(500).json({ error: "Failed to fetch speech evaluations" });
  }
});

router.patch("/admin/speech-evaluations/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const body = (req.body ?? {}) as {
      status?: unknown;
      trainerFeedback?: unknown;
      trainerScore?: unknown;
    };
    const update: Record<string, unknown> = {};
    if (typeof body.status === "string") {
      if (!SPEECH_EVAL_STATUSES.includes(body.status as SpeechEvalStatus)) {
        return res.status(400).json({ error: `Invalid status. Allowed: ${SPEECH_EVAL_STATUSES.join(", ")}` });
      }
      update.status = body.status;
    }
    if (typeof body.trainerFeedback === "string") {
      update.trainerFeedback = body.trainerFeedback;
    }
    if (typeof body.trainerScore === "number" && Number.isFinite(body.trainerScore)) {
      update.trainerScore = body.trainerScore;
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
    res.json({ evaluation: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update speech evaluation");
    res.status(500).json({ error: "Failed to update speech evaluation" });
  }
});

export default router;
