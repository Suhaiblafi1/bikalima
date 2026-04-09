import { Router } from "express";
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
} from "../db.js";
import { eq, desc, sql, asc, inArray, and, gte } from "drizzle-orm";

const router = Router();

const ADMIN_EMAILS = ["info@bikalima.com"];

function isAdmin(req) {
  if (!req.isAuthenticated() || !req.user) return false;
  return ADMIN_EMAILS.includes(req.user.email.toLowerCase());
}

function requireAdmin(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

router.get("/admin/check", (req, res) => {
  res.json({ isAdmin: isAdmin(req) });
});

router.get("/admin/stats", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const [usersCount] = await db.select({ count: sql`count(*)::int` }).from(usersTable);
    const [todayCount] = await db.select({ count: sql`count(*)::int` }).from(usersTable).where(sql`${usersTable.createdAt} >= CURRENT_DATE`);
    const [weekCount] = await db.select({ count: sql`count(*)::int` }).from(usersTable).where(sql`${usersTable.createdAt} >= CURRENT_DATE - INTERVAL '7 days'`);
    const [coursesCount] = await db.select({ count: sql`count(*)::int` }).from(coursesTable);
    const [enrollmentsCount] = await db.select({ count: sql`count(*)::int` }).from(enrollmentsTable);
    const [requestsCount] = await db.select({ count: sql`count(*)::int` }).from(enrollmentRequestsTable);
    const [ordersCount] = await db.select({ count: sql`count(*)::int` }).from(workbookOrdersTable);
    const [lmsOrdersCount] = await db.select({ count: sql`count(*)::int` }).from(ordersTable);
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
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/admin/users", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const users = await db.select({
      id: usersTable.id, email: usersTable.email, firstName: usersTable.firstName,
      lastName: usersTable.lastName, createdAt: usersTable.createdAt, updatedAt: usersTable.updatedAt,
    }).from(usersTable).orderBy(desc(usersTable.createdAt));
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.patch("/admin/users/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { firstName, lastName, email } = req.body;
    const updates = {};
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

router.delete("/admin/users/:id", async (req, res) => {
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

const COURSE_FIELDS = [
  "titleAr", "titleEn", "titleFr", "subtitleAr", "subtitleEn",
  "descriptionAr", "descriptionEn", "descriptionFr",
  "programId", "slug", "imageUrl", "trailerUrl",
  "price", "discountPrice", "level", "language", "category", "instructorId",
  "whatYouLearnAr", "whatYouLearnEn", "requirementsAr", "requirementsEn",
  "targetAudienceAr", "targetAudienceEn", "seoTitle", "seoDescription",
  "isPublished", "isFeatured",
];

router.get("/admin/courses", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const courses = await db.select().from(coursesTable).orderBy(desc(coursesTable.createdAt));
    const allLessons = await db.select().from(lessonsTable).orderBy(asc(lessonsTable.sortOrder));
    const allSections = await db.select().from(courseSectionsTable).orderBy(asc(courseSectionsTable.sortOrder));
    const allEnrollments = await db.select().from(enrollmentsTable);
    const result = courses.map((c) => ({
      ...c,
      lessons: allLessons.filter((l) => l.courseId === c.id),
      sections: allSections.filter((s) => s.courseId === c.id),
      enrollmentCount: allEnrollments.filter((e) => e.courseId === c.id).length,
    }));
    res.json({ courses: result });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

router.post("/admin/courses", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const vals = { titleAr: req.body.titleAr, titleEn: req.body.titleEn, titleFr: req.body.titleFr || "" };
    for (const key of COURSE_FIELDS) {
      if (req.body[key] !== undefined) vals[key] = req.body[key];
    }
    if (!vals.isPublished) vals.isPublished = false;
    const [course] = await db.insert(coursesTable).values(vals).returning();
    res.json({ course });
  } catch (err) {
    res.status(500).json({ error: "Failed to create course" });
  }
});

router.patch("/admin/courses/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const updates = {};
    for (const key of COURSE_FIELDS) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No fields" }); return; }
    const [course] = await db.update(coursesTable).set(updates).where(eq(coursesTable.id, id)).returning();
    if (!course) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ course });
  } catch (err) {
    res.status(500).json({ error: "Failed to update course" });
  }
});

router.delete("/admin/courses/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    await db.delete(coursesTable).where(eq(coursesTable.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete course" });
  }
});

router.post("/admin/courses/:id/duplicate", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const [orig] = await db.select().from(coursesTable).where(eq(coursesTable.id, req.params.id));
    if (!orig) { res.status(404).json({ error: "Course not found" }); return; }
    const { id: _id, createdAt: _c, updatedAt: _u, slug, titleAr, titleEn, ...rest } = orig;
    const [newCourse] = await db.insert(coursesTable).values({
      ...rest,
      titleAr: `${titleAr} (نسخة)`,
      titleEn: `${titleEn} (copy)`,
      slug: slug ? `${slug}-copy-${Date.now()}` : null,
      isPublished: false,
    }).returning();
    const sections = await db.select().from(courseSectionsTable).where(eq(courseSectionsTable.courseId, req.params.id)).orderBy(asc(courseSectionsTable.sortOrder));
    const sectionIdMap = {};
    for (const s of sections) {
      const { id: _sid, courseId: _cid, ...sRest } = s;
      const [ns] = await db.insert(courseSectionsTable).values({ ...sRest, courseId: newCourse.id }).returning();
      sectionIdMap[s.id] = ns.id;
    }
    const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.courseId, req.params.id)).orderBy(asc(lessonsTable.sortOrder));
    for (const l of lessons) {
      const { id: _lid, courseId: _cid, sectionId, ...lRest } = l;
      await db.insert(lessonsTable).values({ ...lRest, courseId: newCourse.id, sectionId: sectionId ? (sectionIdMap[sectionId] ?? null) : null });
    }
    res.json({ course: newCourse });
  } catch (err) {
    res.status(500).json({ error: "Failed to duplicate course" });
  }
});

const LESSON_FIELDS = [
  "titleAr", "titleEn", "titleFr", "descriptionAr", "descriptionEn",
  "videoUrl", "videoType", "durationMinutes", "sortOrder",
  "sectionId", "isFreePreview", "isPublished", "resources",
];

router.post("/admin/courses/:courseId/lessons", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { courseId } = req.params;
    const { titleAr, titleEn } = req.body;
    if (!titleAr || !titleEn) { res.status(400).json({ error: "titleAr and titleEn required" }); return; }
    const vals = { courseId, titleAr, titleEn, titleFr: req.body.titleFr || titleEn };
    for (const key of LESSON_FIELDS) {
      if (req.body[key] !== undefined) vals[key] = req.body[key];
    }
    if (!vals.videoType) vals.videoType = "youtube";
    if (vals.sortOrder == null) vals.sortOrder = 0;
    const [lesson] = await db.insert(lessonsTable).values(vals).returning();
    res.json({ lesson });
  } catch (err) {
    res.status(500).json({ error: "Failed to create lesson" });
  }
});

router.patch("/admin/lessons/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const updates = {};
    for (const key of LESSON_FIELDS) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No fields" }); return; }
    const [lesson] = await db.update(lessonsTable).set(updates).where(eq(lessonsTable.id, req.params.id)).returning();
    if (!lesson) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ lesson });
  } catch (err) {
    res.status(500).json({ error: "Failed to update lesson" });
  }
});

router.post("/admin/lessons/:id/resources", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const [lesson] = await db.select({ id: lessonsTable.id, resources: lessonsTable.resources }).from(lessonsTable).where(eq(lessonsTable.id, req.params.id));
    if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }
    const { titleAr, titleEn, url, type } = req.body;
    if (!titleAr || !url) { res.status(400).json({ error: "titleAr and url required" }); return; }
    const existing = lesson.resources ?? [];
    const updated = [...existing, { titleAr, titleEn: titleEn || titleAr, url, type: type || "link" }];
    const [updatedLesson] = await db.update(lessonsTable).set({ resources: updated }).where(eq(lessonsTable.id, req.params.id)).returning();
    res.json({ lesson: updatedLesson });
  } catch (err) {
    res.status(500).json({ error: "Failed to add resource" });
  }
});

router.delete("/admin/lessons/:id/resources/:idx", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const [lesson] = await db.select({ id: lessonsTable.id, resources: lessonsTable.resources }).from(lessonsTable).where(eq(lessonsTable.id, req.params.id));
    if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }
    const existing = lesson.resources ?? [];
    const updated = existing.filter((_, i) => i !== parseInt(req.params.idx));
    const [updatedLesson] = await db.update(lessonsTable).set({ resources: updated }).where(eq(lessonsTable.id, req.params.id)).returning();
    res.json({ lesson: updatedLesson });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove resource" });
  }
});

router.delete("/admin/lessons/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    await db.delete(lessonsTable).where(eq(lessonsTable.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete lesson" });
  }
});

router.post("/admin/enrollments", async (req, res) => {
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

router.delete("/admin/enrollments/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    await db.delete(enrollmentsTable).where(eq(enrollmentsTable.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove enrollment" });
  }
});

router.get("/admin/enrollments", async (req, res) => {
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

router.get("/admin/enrollment-requests", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const requests = await db.select().from(enrollmentRequestsTable).orderBy(desc(enrollmentRequestsTable.createdAt));
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

router.patch("/admin/enrollment-requests/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { status, adminNotes } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    const [updated] = await db.update(enrollmentRequestsTable).set(updates).where(eq(enrollmentRequestsTable.id, req.params.id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ request: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update request" });
  }
});

router.get("/admin/workbook-orders", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const orders = await db.select().from(workbookOrdersTable).orderBy(desc(workbookOrdersTable.createdAt));
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.patch("/admin/workbook-orders/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { status, adminNotes } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    const [updated] = await db.update(workbookOrdersTable).set(updates).where(eq(workbookOrdersTable.id, req.params.id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ order: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

router.get("/my/courses", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const enrollments = await db.select({
      enrollmentId: enrollmentsTable.id,
      courseId: enrollmentsTable.courseId,
      status: enrollmentsTable.status,
      enrolledAt: enrollmentsTable.enrolledAt,
      titleAr: coursesTable.titleAr,
      titleEn: coursesTable.titleEn,
      titleFr: coursesTable.titleFr,
      descriptionAr: coursesTable.descriptionAr,
      descriptionEn: coursesTable.descriptionEn,
      descriptionFr: coursesTable.descriptionFr,
      imageUrl: coursesTable.imageUrl,
      programId: coursesTable.programId,
      slug: coursesTable.slug,
    })
    .from(enrollmentsTable)
    .innerJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
    .where(and(eq(enrollmentsTable.userId, req.user.id), eq(enrollmentsTable.status, "active")));

    const courseIds = enrollments.map((e) => e.courseId);
    let lessons = [];
    let progress = [];
    if (courseIds.length > 0) {
      lessons = await db.select().from(lessonsTable)
        .where(inArray(lessonsTable.courseId, courseIds))
        .orderBy(asc(lessonsTable.sortOrder));
      progress = await db.select().from(lessonProgressTable)
        .where(eq(lessonProgressTable.userId, req.user.id));
    }

    const result = enrollments.map((e) => ({
      ...e,
      lessons: lessons.filter((l) => l.courseId === e.courseId),
      progress: progress.filter((p) =>
        lessons.some((l) => l.id === p.lessonId && l.courseId === e.courseId)
      ),
    }));

    res.json({ courses: result });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

router.post("/my/lessons/:lessonId/complete", async (req, res) => {
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

const VALID_LMS_STATUSES = ["pending", "paid", "cancelled"];

async function adminGetLmsOrders(req, res) {
  if (!requireAdmin(req, res)) return;
  try {
    const orders = await db
      .select({
        id: ordersTable.id,
        userId: ordersTable.userId,
        courseId: ordersTable.courseId,
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
        courseTitleAr: coursesTable.titleAr,
        courseTitleEn: coursesTable.titleEn,
      })
      .from(ordersTable)
      .leftJoin(coursesTable, eq(ordersTable.courseId, coursesTable.id))
      .orderBy(desc(ordersTable.createdAt));
    res.json({ orders: orders.map(o => ({ ...o, courseTitle: o.courseTitleAr ?? o.courseTitleEn ?? null })) });
  } catch {
    res.status(500).json({ error: "Failed to fetch LMS orders" });
  }
}

async function adminPatchLmsOrder(req, res) {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    if (status && !VALID_LMS_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    if (status === "pending") {
      const [current] = await db.select({ status: ordersTable.status }).from(ordersTable).where(eq(ordersTable.id, id));
      if (current && (current.status === "paid" || current.status === "cancelled")) {
        return res.status(400).json({ error: "Cannot revert a terminal order status back to pending." });
      }
    }
    const updates = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (status === "paid") updates.adminApprovedBy = req.user.id;
    const [order] = await db.update(ordersTable).set(updates).where(eq(ordersTable.id, id)).returning();
    if (!order) { res.status(404).json({ error: "Not found" }); return; }
    if (order.userId && order.courseId && (status === "paid" || status === "cancelled")) {
      const existing = await db
        .select()
        .from(enrollmentsTable)
        .where(and(eq(enrollmentsTable.userId, order.userId), eq(enrollmentsTable.courseId, order.courseId)));
      if (status === "paid") {
        if (existing.length === 0) {
          await db.insert(enrollmentsTable).values({ userId: order.userId, courseId: order.courseId, status: "active" });
        } else if (existing[0].status !== "active") {
          await db.update(enrollmentsTable).set({ status: "active" }).where(eq(enrollmentsTable.id, existing[0].id));
        }
      } else if (status === "cancelled" && existing.length > 0 && existing[0].status === "active") {
        await db.update(enrollmentsTable).set({ status: "suspended" }).where(eq(enrollmentsTable.id, existing[0].id));
      }
    }
    res.json({ order });
  } catch {
    res.status(500).json({ error: "Failed to update LMS order" });
  }
}

router.get("/admin/lms-orders", adminGetLmsOrders);
router.get("/admin/orders", adminGetLmsOrders);
router.patch("/admin/lms-orders/:id", adminPatchLmsOrder);
router.patch("/admin/orders/:id", adminPatchLmsOrder);

// ── Instructors ────────────────────────────────────────────────────────────
router.get("/admin/instructors", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const instructors = await db.select().from(instructorsTable).orderBy(asc(instructorsTable.nameAr));
    res.json({ instructors });
  } catch { res.status(500).json({ error: "Failed to fetch instructors" }); }
});
router.post("/admin/instructors", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { nameAr, nameEn, bioAr, bioEn, photoUrl, email } = req.body;
    if (!nameAr || !nameEn) { res.status(400).json({ error: "nameAr and nameEn required" }); return; }
    const [instructor] = await db.insert(instructorsTable).values({ nameAr, nameEn, bioAr, bioEn, photoUrl, email }).returning();
    res.json({ instructor });
  } catch { res.status(500).json({ error: "Failed to create instructor" }); }
});
router.patch("/admin/instructors/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const updates = {};
    for (const key of ["nameAr", "nameEn", "bioAr", "bioEn", "photoUrl", "email"]) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const [instructor] = await db.update(instructorsTable).set(updates).where(eq(instructorsTable.id, req.params.id)).returning();
    if (!instructor) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ instructor });
  } catch { res.status(500).json({ error: "Failed to update instructor" }); }
});
router.delete("/admin/instructors/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    await db.delete(instructorsTable).where(eq(instructorsTable.id, req.params.id));
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to delete instructor" }); }
});

// ── Sections ───────────────────────────────────────────────────────────────
router.post("/admin/courses/:courseId/sections", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { titleAr, titleEn, sortOrder } = req.body;
    if (!titleAr || !titleEn) { res.status(400).json({ error: "titleAr and titleEn required" }); return; }
    const [section] = await db.insert(courseSectionsTable).values({ courseId: req.params.courseId, titleAr, titleEn, sortOrder: sortOrder ?? 0 }).returning();
    res.json({ section });
  } catch { res.status(500).json({ error: "Failed to create section" }); }
});
router.patch("/admin/sections/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const updates = {};
    for (const key of ["titleAr", "titleEn", "sortOrder", "isPublished"]) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const [section] = await db.update(courseSectionsTable).set(updates).where(eq(courseSectionsTable.id, req.params.id)).returning();
    if (!section) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ section });
  } catch { res.status(500).json({ error: "Failed to update section" }); }
});
router.delete("/admin/sections/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    await db.delete(courseSectionsTable).where(eq(courseSectionsTable.id, req.params.id));
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to delete section" }); }
});

// ── Revenue ────────────────────────────────────────────────────────────────
router.get("/admin/revenue", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalRow] = await db.select({ total: sql`COALESCE(SUM(${ordersTable.amount}), 0)::int` }).from(ordersTable).where(eq(ordersTable.status, "paid"));
    const [pendingRow] = await db.select({ total: sql`COALESCE(SUM(${ordersTable.amount}), 0)::int`, count: sql`count(*)::int` }).from(ordersTable).where(eq(ordersTable.status, "pending"));
    const [cancelledRow] = await db.select({ count: sql`count(*)::int` }).from(ordersTable).where(eq(ordersTable.status, "cancelled"));
    const [paidCountRow] = await db.select({ count: sql`count(*)::int` }).from(ordersTable).where(eq(ordersTable.status, "paid"));
    const byCourse = await db.select({
      courseId: ordersTable.courseId,
      courseTitleAr: coursesTable.titleAr,
      courseTitleEn: coursesTable.titleEn,
      revenue: sql`COALESCE(SUM(${ordersTable.amount}), 0)::int`,
      orders: sql`count(*)::int`,
    }).from(ordersTable).leftJoin(coursesTable, eq(ordersTable.courseId, coursesTable.id)).where(eq(ordersTable.status, "paid")).groupBy(ordersTable.courseId, coursesTable.titleAr, coursesTable.titleEn).orderBy(desc(sql`SUM(${ordersTable.amount})`));
    const last30Days = await db.select({
      date: sql`DATE(${ordersTable.createdAt})::text`,
      revenue: sql`COALESCE(SUM(${ordersTable.amount}), 0)::int`,
      count: sql`count(*)::int`,
    }).from(ordersTable).where(and(eq(ordersTable.status, "paid"), gte(ordersTable.createdAt, thirtyDaysAgo))).groupBy(sql`DATE(${ordersTable.createdAt})`).orderBy(asc(sql`DATE(${ordersTable.createdAt})`));
    const topEnrolled = await db.select({
      courseId: enrollmentsTable.courseId,
      courseTitleAr: coursesTable.titleAr,
      courseTitleEn: coursesTable.titleEn,
      enrollments: sql`count(*)::int`,
    }).from(enrollmentsTable).leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id)).groupBy(enrollmentsTable.courseId, coursesTable.titleAr, coursesTable.titleEn).orderBy(desc(sql`count(*)`)).limit(5);
    res.json({ totalRevenue: totalRow.total, paidOrders: paidCountRow.count, pendingRevenue: pendingRow.total, pendingOrders: pendingRow.count, cancelledOrders: cancelledRow.count, byCourse, last30Days, topEnrolled });
  } catch { res.status(500).json({ error: "Failed to fetch revenue" }); }
});

export default router;
