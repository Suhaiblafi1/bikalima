import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  usersTable,
  coursesTable,
  lessonsTable,
  enrollmentsTable,
  lessonProgressTable,
  enrollmentRequestsTable,
  workbookOrdersTable,
  ordersTable,
} from "@workspace/db";
import { eq, desc, sql, asc, inArray, and } from "drizzle-orm";

const router: IRouter = Router();

const ADMIN_EMAILS = ["info@bikalima.com"];

function isAdmin(req: Request): boolean {
  if (!req.isAuthenticated() || !req.user) return false;
  return ADMIN_EMAILS.includes(req.user.email.toLowerCase());
}

function requireAdmin(req: Request, res: Response): boolean {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

router.get("/admin/check", (req: Request, res: Response) => {
  res.json({ isAdmin: isAdmin(req) });
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
      lastName: usersTable.lastName, createdAt: usersTable.createdAt, updatedAt: usersTable.updatedAt,
    }).from(usersTable).orderBy(desc(usersTable.createdAt));
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
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
    const allEnrollments = await db.select().from(enrollmentsTable);
    const result = courses.map(c => ({
      ...c,
      lessons: allLessons.filter(l => l.courseId === c.id),
      enrollmentCount: allEnrollments.filter(e => e.courseId === c.id).length,
    }));
    res.json({ courses: result });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

router.post("/admin/courses", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { titleAr, titleEn, titleFr, descriptionAr, descriptionEn, descriptionFr, programId, imageUrl, isPublished } = req.body;
    const [course] = await db.insert(coursesTable).values({
      titleAr, titleEn, titleFr, descriptionAr, descriptionEn, descriptionFr, programId, imageUrl, isPublished: isPublished ?? false,
    }).returning();
    res.json({ course });
  } catch (err) {
    res.status(500).json({ error: "Failed to create course" });
  }
});

router.patch("/admin/courses/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const updates: any = {};
    for (const key of ["titleAr", "titleEn", "titleFr", "descriptionAr", "descriptionEn", "descriptionFr", "programId", "imageUrl", "isPublished"]) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
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
    const { titleAr, titleEn, titleFr, videoUrl, videoType, durationMinutes, sortOrder } = req.body;
    const [lesson] = await db.insert(lessonsTable).values({
      courseId, titleAr, titleEn, titleFr, videoUrl, videoType: videoType || "youtube", durationMinutes, sortOrder: sortOrder ?? 0,
    }).returning();
    res.json({ lesson });
  } catch (err) {
    res.status(500).json({ error: "Failed to create lesson" });
  }
});

router.patch("/admin/lessons/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const updates: any = {};
    for (const key of ["titleAr", "titleEn", "titleFr", "videoUrl", "videoType", "durationMinutes", "sortOrder", "isPublished"]) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const [lesson] = await db.update(lessonsTable).set(updates).where(eq(lessonsTable.id, req.params.id)).returning();
    if (!lesson) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ lesson });
  } catch (err) {
    res.status(500).json({ error: "Failed to update lesson" });
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
  if (!requireAdmin(req, res)) return;
  try {
    const requests = await db.select().from(enrollmentRequestsTable).orderBy(desc(enrollmentRequestsTable.createdAt));
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

router.patch("/admin/enrollment-requests/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { status, adminNotes } = req.body;
    const updates: any = {};
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    const [updated] = await db.update(enrollmentRequestsTable).set(updates).where(eq(enrollmentRequestsTable.id, req.params.id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ request: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update request" });
  }
});

router.get("/admin/workbook-orders", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const orders = await db.select().from(workbookOrdersTable).orderBy(desc(workbookOrdersTable.createdAt));
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.patch("/admin/workbook-orders/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { status, adminNotes } = req.body;
    const updates: any = {};
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
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
    let lessons: any[] = [];
    let progress: any[] = [];
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

router.get("/admin/lms-orders", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
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
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch LMS orders" });
  }
});

router.patch("/admin/lms-orders/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body as { status?: string; adminNotes?: string };

    const VALID_STATUSES = ["pending", "paid", "cancelled"] as const;
    if (status !== undefined && !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      res.status(400).json({ error: "Invalid status. Must be pending, paid, or cancelled." });
      return;
    }

    const updates: {
      updatedAt: Date;
      status?: string;
      adminNotes?: string;
      adminApprovedBy?: string;
    } = { updatedAt: new Date() };
    if (status !== undefined) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (status === "paid" && req.user) updates.adminApprovedBy = req.user.id;

    const [order] = await db
      .update(ordersTable)
      .set(updates)
      .where(eq(ordersTable.id, id))
      .returning();

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (status === "paid" && order.userId) {
      const existingEnrollment = await db
        .select()
        .from(enrollmentsTable)
        .where(and(eq(enrollmentsTable.userId, order.userId), eq(enrollmentsTable.courseId, order.courseId)));

      if (existingEnrollment.length === 0) {
        await db.insert(enrollmentsTable).values({
          userId: order.userId,
          courseId: order.courseId,
          status: "active",
          enrolledAt: new Date(),
        });
      } else if (existingEnrollment[0].status !== "active") {
        await db.update(enrollmentsTable).set({ status: "active" })
          .where(eq(enrollmentsTable.id, existingEnrollment[0].id));
      }
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: "Failed to update LMS order" });
  }
});

export default router;
