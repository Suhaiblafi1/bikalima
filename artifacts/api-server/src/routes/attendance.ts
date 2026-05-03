import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  coursesTable,
  lessonsTable,
  enrollmentsTable,
  usersTable,
  lessonSessionAttendanceTable,
} from "@workspace/db";
import { and, eq, inArray, sql } from "drizzle-orm";
import { requireRole } from "../lib/admin.js";
import { recordAuditLog } from "../lib/platform.js";
import { createNotification } from "../lib/notifications.js";

const router: IRouter = Router();

type AttStatus = "present" | "absent" | "excused";
const VALID_STATUSES: AttStatus[] = ["present", "absent", "excused"];

// ── ADMIN/TRAINER: course attendance overview ───────────────────────────
router.get("/admin/courses/:id/attendance", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "trainer")) return;
  const courseId = req.params.id;
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId)).limit(1);
  if (!course) return res.status(404).json({ error: "Course not found" });

  const lessons = await db
    .select({ id: lessonsTable.id, titleAr: lessonsTable.titleAr, titleEn: lessonsTable.titleEn, sortOrder: lessonsTable.sortOrder })
    .from(lessonsTable)
    .where(eq(lessonsTable.courseId, courseId))
    .orderBy(lessonsTable.sortOrder);

  const enrollments = await db
    .select({
      userId: enrollmentsTable.userId,
      status: enrollmentsTable.status,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
    })
    .from(enrollmentsTable)
    .innerJoin(usersTable, eq(usersTable.id, enrollmentsTable.userId))
    .where(eq(enrollmentsTable.courseId, courseId));

  const lessonIds = lessons.map((l) => l.id);
  const attendance = lessonIds.length
    ? await db
        .select()
        .from(lessonSessionAttendanceTable)
        .where(inArray(lessonSessionAttendanceTable.lessonId, lessonIds))
    : [];

  res.json({ course: { id: course.id, titleAr: course.titleAr, titleEn: course.titleEn }, lessons, learners: enrollments, attendance });
});

// ── ADMIN/TRAINER: bulk upsert attendance for one lesson ─────────────────
router.post("/admin/lessons/:id/attendance", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "trainer")) return;
  const lessonId = req.params.id;
  const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId)).limit(1);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });

  const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
  if (!entries.length) return res.status(400).json({ error: "entries required" });

  // Restrict writes to users currently enrolled in this lesson's course.
  const enrolledRows = await db
    .select({ userId: enrollmentsTable.userId })
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.courseId, lesson.courseId));
  const allowedIds = new Set(enrolledRows.map((r) => r.userId));

  const actor = { id: req.user!.id, email: req.user!.email };
  const [course] = await db
    .select({ titleAr: coursesTable.titleAr, slug: coursesTable.slug })
    .from(coursesTable)
    .where(eq(coursesTable.id, lesson.courseId))
    .limit(1);

  // Pre-fetch existing rows to detect changes / new absences
  const existing = await db
    .select()
    .from(lessonSessionAttendanceTable)
    .where(eq(lessonSessionAttendanceTable.lessonId, lessonId));
  const existingMap = new Map(existing.map((r) => [r.userId, r]));

  const newlyAbsentUserIds: string[] = [];
  let written = 0;

  for (const entry of entries) {
    const userId = String(entry?.userId ?? "");
    const status = entry?.status as AttStatus | undefined;
    const note = entry?.note ? String(entry.note) : null;
    if (!userId || !status || !VALID_STATUSES.includes(status)) continue;
    if (!allowedIds.has(userId)) continue;

    const prev = existingMap.get(userId);
    if (prev && prev.status === status && (prev.note ?? null) === (note ?? null)) continue;

    await db
      .insert(lessonSessionAttendanceTable)
      .values({ lessonId, userId, status, note, markedById: actor.id, markedAt: new Date() })
      .onConflictDoUpdate({
        target: [lessonSessionAttendanceTable.lessonId, lessonSessionAttendanceTable.userId],
        set: { status, note, markedById: actor.id, markedAt: new Date() },
      });

    written++;
    await recordAuditLog({
      actor,
      action: "attendance.upsert",
      entityType: "lesson_session_attendance",
      entityId: `${lessonId}:${userId}`,
      description: `حضور: ${status}`,
      before: prev ? { status: prev.status, note: prev.note } : null,
      after: { status, note },
    });

    if (status === "absent" && (!prev || prev.status !== "absent")) {
      newlyAbsentUserIds.push(userId);
    }
  }

  // Notify learners newly marked absent
  for (const uid of newlyAbsentUserIds) {
    await createNotification({
      userId: uid,
      type: "attendance_absent",
      titleAr: "تم تسجيل غيابك",
      titleEn: "Absence recorded",
      bodyAr: `تم تسجيل غيابك عن جلسة "${lesson.titleAr}" في دورة "${course?.titleAr ?? ""}".`,
      bodyEn: `You were marked absent from session "${lesson.titleEn}".`,
      link: course?.slug ? `/courses/${course.slug}/learn` : "/dashboard?tab=courses",
    });
  }

  res.json({ ok: true, written });
});

// ── LEARNER: my attendance for a course ──────────────────────────────────
router.get("/my/courses/:slug/attendance", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) return res.status(401).json({ error: "Not authenticated" });
  const userId = req.user.id;
  const slug = req.params.slug;
  const [course] = await db.select({ id: coursesTable.id }).from(coursesTable).where(eq(coursesTable.slug, slug)).limit(1);
  if (!course) return res.status(404).json({ error: "Course not found" });

  const lessons = await db
    .select({ id: lessonsTable.id })
    .from(lessonsTable)
    .where(eq(lessonsTable.courseId, course.id));
  const lessonIds = lessons.map((l) => l.id);

  const rows = lessonIds.length
    ? await db
        .select()
        .from(lessonSessionAttendanceTable)
        .where(
          and(
            eq(lessonSessionAttendanceTable.userId, userId),
            inArray(lessonSessionAttendanceTable.lessonId, lessonIds),
          ),
        )
    : [];

  const present = rows.filter((r) => r.status === "present").length;
  const excused = rows.filter((r) => r.status === "excused").length;
  const absent = rows.filter((r) => r.status === "absent").length;
  const tracked = rows.length;
  res.json({ entries: rows, present, excused, absent, tracked });
});

// ── LEARNER: aggregated counts across all my courses ─────────────────────
router.get("/my/attendance/summary", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) return res.status(401).json({ error: "Not authenticated" });
  const userId = req.user.id;

  const summary = await db
    .select({
      courseId: lessonsTable.courseId,
      status: lessonSessionAttendanceTable.status,
      cnt: sql<number>`count(*)::int`,
    })
    .from(lessonSessionAttendanceTable)
    .innerJoin(lessonsTable, eq(lessonsTable.id, lessonSessionAttendanceTable.lessonId))
    .where(eq(lessonSessionAttendanceTable.userId, userId))
    .groupBy(lessonsTable.courseId, lessonSessionAttendanceTable.status);

  const byCourse: Record<string, { present: number; absent: number; excused: number; tracked: number }> = {};
  for (const r of summary) {
    const slot = byCourse[r.courseId] ?? (byCourse[r.courseId] = { present: 0, absent: 0, excused: 0, tracked: 0 });
    if (r.status === "present") slot.present = r.cnt;
    else if (r.status === "absent") slot.absent = r.cnt;
    else if (r.status === "excused") slot.excused = r.cnt;
    slot.tracked += r.cnt;
  }
  res.json({ byCourse });
});

export default router;
