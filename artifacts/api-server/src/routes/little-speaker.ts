import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  liveSessionsTable,
  parentLinksTable,
  messageThreadsTable,
  messageThreadParticipantsTable,
  platformMessagesTable,
  lessonsTable,
  coursesTable,
  enrollmentsTable,
  courseTrainersTable,
  usersTable,
  lessonProgressTable,
  activitySubmissionsTable,
  activityReviewsTable,
  lessonActivitiesTable,
  certificatesTable,
  notificationsTable,
} from "@workspace/db";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { isSupervisorOrAdmin, requireRole } from "../lib/admin.js";
import { createNotification } from "../lib/notifications.js";

const router: IRouter = Router();

// ── helpers ─────────────────────────────────────────────────────────────
function genCode(len = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

async function isCourseTrainer(userId: string, courseId: string): Promise<boolean> {
  const [row] = await db.select({ id: courseTrainersTable.id })
    .from(courseTrainersTable)
    .where(and(eq(courseTrainersTable.userId, userId), eq(courseTrainersTable.courseId, courseId)))
    .limit(1);
  return !!row;
}

// --- LIVE SESSIONS (Zoom links per lesson) ---

// Trainer/admin: read or upsert a lesson's live session.
router.get("/admin/lessons/:lessonId/live-session", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "supervisor", "trainer")) return;
  const { lessonId } = req.params;
  const userId = req.user!.id;
  try {
    // Same course-scope check as PUT: trainers must be assigned to the course.
    const [lesson] = await db.select({ courseId: lessonsTable.courseId })
      .from(lessonsTable).where(eq(lessonsTable.id, lessonId)).limit(1);
    if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }
    if (!isSupervisorOrAdmin(req) && !(await isCourseTrainer(userId, lesson.courseId))) {
      res.status(403).json({ error: "Not authorized" }); return;
    }
    const [row] = await db.select().from(liveSessionsTable)
      .where(eq(liveSessionsTable.lessonId, lessonId)).limit(1);
    res.json({ session: row ?? null });
  } catch (err) {
    req.log.error({ err }, "get live session failed");
    res.status(500).json({ error: "Failed" });
  }
});

router.put("/admin/lessons/:lessonId/live-session", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "supervisor", "trainer")) return;
  const { lessonId } = req.params;
  const userId = req.user!.id;
  try {
    // Authorize: must be admin/supervisor or assigned trainer for the course
    const [lesson] = await db.select({ courseId: lessonsTable.courseId })
      .from(lessonsTable).where(eq(lessonsTable.id, lessonId)).limit(1);
    if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }
    if (!isSupervisorOrAdmin(req) && !(await isCourseTrainer(userId, lesson.courseId))) {
      res.status(403).json({ error: "Not authorized" }); return;
    }
    const b = req.body ?? {};
    const zoomJoinUrl = String(b.zoomJoinUrl ?? "").trim();
    if (!zoomJoinUrl) { res.status(400).json({ error: "zoomJoinUrl required" }); return; }
    const scheduledAt = b.scheduledAt ? new Date(b.scheduledAt) : null;
    if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
      res.status(400).json({ error: "scheduledAt required" }); return;
    }
    const durationMinutes = Math.max(5, Math.min(480, Math.round(Number(b.durationMinutes ?? 60))));
    const titleAr = typeof b.titleAr === "string" ? b.titleAr.slice(0, 200) : null;
    const zoomMeetingId = typeof b.zoomMeetingId === "string" ? b.zoomMeetingId.slice(0, 64) : null;
    const recordingUrl = typeof b.recordingUrl === "string" && b.recordingUrl.trim() ? b.recordingUrl.trim() : null;
    const status: "scheduled" | "live" | "ended" | "cancelled" =
      ["scheduled", "live", "ended", "cancelled"].includes(b.status) ? b.status : "scheduled";

    const [existing] = await db.select({ id: liveSessionsTable.id })
      .from(liveSessionsTable).where(eq(liveSessionsTable.lessonId, lessonId)).limit(1);
    let row;
    if (existing) {
      [row] = await db.update(liveSessionsTable)
        .set({ zoomJoinUrl, zoomMeetingId, titleAr, scheduledAt, durationMinutes, status, recordingUrl })
        .where(eq(liveSessionsTable.id, existing.id))
        .returning();
    } else {
      [row] = await db.insert(liveSessionsTable).values({
        lessonId, zoomJoinUrl, zoomMeetingId, titleAr, scheduledAt, durationMinutes, status, recordingUrl,
        createdById: userId,
      }).returning();
    }

    // Notify enrolled students
    const students = await db.select({ userId: enrollmentsTable.userId })
      .from(enrollmentsTable).where(eq(enrollmentsTable.courseId, lesson.courseId));
    for (const s of students) {
      await createNotification({
        userId: s.userId,
        type: "live_session_scheduled",
        titleAr: "حصة مباشرة جديدة",
        titleEn: "New live session",
        bodyAr: titleAr ?? null,
        bodyEn: null,
        link: "/dashboard?tab=live",
      });
    }
    res.json({ session: row });
  } catch (err) {
    req.log.error({ err }, "upsert live session failed");
    res.status(500).json({ error: "Failed" });
  }
});

// Student: list upcoming/recent live sessions for their enrolled courses.
router.get("/my/live-sessions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = req.user.id;
  try {
    const enrolls = await db.select({ courseId: enrollmentsTable.courseId })
      .from(enrollmentsTable).where(eq(enrollmentsTable.userId, userId));
    const courseIds = enrolls.map(e => e.courseId);
    if (courseIds.length === 0) { res.json({ sessions: [] }); return; }
    const lessons = await db.select({ id: lessonsTable.id, courseId: lessonsTable.courseId, lessonTitleAr: lessonsTable.titleAr })
      .from(lessonsTable).where(inArray(lessonsTable.courseId, courseIds));
    const lessonIds = lessons.map(l => l.id);
    if (lessonIds.length === 0) { res.json({ sessions: [] }); return; }
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000); // include sessions started up to 2h ago
    const sessions = await db.select().from(liveSessionsTable)
      .where(and(inArray(liveSessionsTable.lessonId, lessonIds), gte(liveSessionsTable.scheduledAt, cutoff)))
      .orderBy(asc(liveSessionsTable.scheduledAt))
      .limit(20);
    const lessonMap = new Map(lessons.map(l => [l.id, l]));
    const courses = await db.select({ id: coursesTable.id, slug: coursesTable.slug, titleAr: coursesTable.titleAr })
      .from(coursesTable).where(inArray(coursesTable.id, courseIds));
    const courseMap = new Map(courses.map(c => [c.id, c]));
    res.json({ sessions: sessions.map(s => decorateSession(s, lessonMap, courseMap)) });
  } catch (err) {
    req.log.error({ err }, "list my live-sessions failed");
    res.status(500).json({ error: "Failed" });
  }
});

// Parent: list upcoming/recent live sessions for all linked children's courses.
router.get("/parent/live-sessions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  const me = req.user.id;
  try {
    const children = (await db.select({ studentUserId: parentLinksTable.studentUserId })
      .from(parentLinksTable)
      .where(and(eq(parentLinksTable.parentUserId, me), eq(parentLinksTable.status, "active"))))
      .map(r => r.studentUserId);
    if (children.length === 0) { res.json({ sessions: [] }); return; }
    const enrolls = await db.select({ courseId: enrollmentsTable.courseId, userId: enrollmentsTable.userId })
      .from(enrollmentsTable).where(inArray(enrollmentsTable.userId, children));
    const courseIds = Array.from(new Set(enrolls.map(e => e.courseId)));
    if (courseIds.length === 0) { res.json({ sessions: [] }); return; }
    const lessons = await db.select({ id: lessonsTable.id, courseId: lessonsTable.courseId, lessonTitleAr: lessonsTable.titleAr })
      .from(lessonsTable).where(inArray(lessonsTable.courseId, courseIds));
    const lessonIds = lessons.map(l => l.id);
    if (lessonIds.length === 0) { res.json({ sessions: [] }); return; }
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const sessions = await db.select().from(liveSessionsTable)
      .where(and(inArray(liveSessionsTable.lessonId, lessonIds), gte(liveSessionsTable.scheduledAt, cutoff)))
      .orderBy(asc(liveSessionsTable.scheduledAt))
      .limit(20);
    const lessonMap = new Map(lessons.map(l => [l.id, l]));
    const courses = await db.select({ id: coursesTable.id, slug: coursesTable.slug, titleAr: coursesTable.titleAr })
      .from(coursesTable).where(inArray(coursesTable.id, courseIds));
    const courseMap = new Map(courses.map(c => [c.id, c]));
    res.json({ sessions: sessions.map(s => decorateSession(s, lessonMap, courseMap)) });
  } catch (err) {
    req.log.error({ err }, "list parent live-sessions failed");
    res.status(500).json({ error: "Failed" });
  }
});

// Derive a live/ended status from scheduledAt+durationMinutes when the
// stored status is still "scheduled". Trainers can also flip it manually.
function decorateSession(
  s: { lessonId: string; scheduledAt: Date; durationMinutes: number; status: string } & Record<string, unknown>,
  lessonMap: Map<string, { lessonTitleAr: string | null; courseId: string }>,
  courseMap: Map<string, { slug: string; titleAr: string }>,
) {
  const l = lessonMap.get(s.lessonId);
  const c = l ? courseMap.get(l.courseId) : null;
  let derivedStatus = s.status;
  if (s.status === "scheduled") {
    const startMs = new Date(s.scheduledAt).getTime();
    const endMs = startMs + s.durationMinutes * 60_000;
    const now = Date.now();
    if (now >= startMs && now <= endMs) derivedStatus = "live";
    else if (now > endMs) derivedStatus = "ended";
  }
  return {
    ...s,
    status: derivedStatus,
    lessonTitleAr: l?.lessonTitleAr ?? null,
    courseTitleAr: c?.titleAr ?? null,
    courseSlug: c?.slug ?? null,
  };
}

// --- PARENT LINKS (parent ↔ student) ---

// Student or admin: create an invite code that a parent can redeem.
router.post("/parent/invites", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  const me = req.user;
  const b = req.body ?? {};
  // Admin can create on behalf of any student; otherwise self-link.
  let studentUserId = me.id;
  if (typeof b.studentUserId === "string" && b.studentUserId !== me.id) {
    if (!isSupervisorOrAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
    studentUserId = b.studentUserId;
  }
  const relationshipAr = typeof b.relationshipAr === "string" ? b.relationshipAr.slice(0, 64) : null;
  try {
    // Generate a unique code (retry up to 5x on collision)
    let code = "";
    for (let i = 0; i < 5; i++) {
      code = genCode(8);
      const [exists] = await db.select({ id: parentLinksTable.id })
        .from(parentLinksTable).where(eq(parentLinksTable.inviteCode, code)).limit(1);
      if (!exists) break;
    }
    const [row] = await db.insert(parentLinksTable).values({
      studentUserId, inviteCode: code, status: "pending",
      relationshipAr, createdById: me.id,
    }).returning();
    res.json({ invite: row });
  } catch (err) {
    req.log.error({ err }, "parent invite create failed");
    res.status(500).json({ error: "Failed" });
  }
});

// Anyone authenticated: redeem code → become a parent of that student.
router.post("/parent/redeem", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  const me = req.user;
  const code = String((req.body ?? {}).inviteCode ?? "").trim().toUpperCase();
  if (!code) { res.status(400).json({ error: "inviteCode required" }); return; }
  try {
    const [link] = await db.select().from(parentLinksTable)
      .where(eq(parentLinksTable.inviteCode, code)).limit(1);
    if (!link) { res.status(404).json({ error: "Invite not found" }); return; }
    if (link.status === "active") { res.status(400).json({ error: "Already redeemed" }); return; }
    if (link.status === "revoked") { res.status(400).json({ error: "Invite revoked" }); return; }
    if (link.studentUserId === me.id) { res.status(400).json({ error: "Cannot link yourself" }); return; }

    // Race-safe: only update if still pending. If two parents redeem the same
    // code at the same time, only the first UPDATE sees status='pending'.
    const updatedRows = await db.update(parentLinksTable)
      .set({ parentUserId: me.id, status: "active", activatedAt: new Date() })
      .where(and(eq(parentLinksTable.id, link.id), eq(parentLinksTable.status, "pending")))
      .returning();
    if (updatedRows.length === 0) {
      res.status(409).json({ error: "Invite was just redeemed by someone else" });
      return;
    }
    const updated = updatedRows[0];

    // Promote redeemer to "parent" role only if they are currently a plain student/no role.
    // (Admins/trainers/etc keep their existing role.)
    const [u] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, me.id));
    if (u && (u.role === "student" || !u.role)) {
      await db.update(usersTable).set({ role: "parent" }).where(eq(usersTable.id, me.id));
    }
    // Notify the student
    await createNotification({
      userId: link.studentUserId,
      type: "parent_linked",
      titleAr: "تمّ ربط ولي الأمر بحسابك",
      titleEn: "A parent linked their account to yours",
      link: "/dashboard",
    });
    res.json({ link: updated });
  } catch (err) {
    req.log.error({ err }, "parent redeem failed");
    res.status(500).json({ error: "Failed" });
  }
});

// Parent: list my children with summary progress.
router.get("/parent/children", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  const me = req.user.id;
  try {
    const links = await db.select({
      id: parentLinksTable.id,
      studentUserId: parentLinksTable.studentUserId,
      status: parentLinksTable.status,
      relationshipAr: parentLinksTable.relationshipAr,
      activatedAt: parentLinksTable.activatedAt,
    }).from(parentLinksTable)
      .where(and(eq(parentLinksTable.parentUserId, me), eq(parentLinksTable.status, "active")));
    if (links.length === 0) { res.json({ children: [] }); return; }
    const studentIds = links.map(l => l.studentUserId);
    const students = await db.select({
      id: usersTable.id, email: usersTable.email,
      firstName: usersTable.firstName, lastName: usersTable.lastName,
      profileImageUrl: usersTable.profileImageUrl,
    }).from(usersTable).where(inArray(usersTable.id, studentIds));
    const studentMap = new Map(students.map(s => [s.id, s]));

    // Compute per-child summary
    const summaries: Array<Record<string, unknown>> = [];
    for (const link of links) {
      const s = studentMap.get(link.studentUserId);
      if (!s) continue;
      const [enrollCount] = await db.select({ c: sql<number>`count(*)::int` })
        .from(enrollmentsTable).where(eq(enrollmentsTable.userId, link.studentUserId));
      const [doneLessons] = await db.select({ c: sql<number>`count(*)::int` })
        .from(lessonProgressTable)
        .where(and(eq(lessonProgressTable.userId, link.studentUserId), eq(lessonProgressTable.completed, true)));
      const [submissions] = await db.select({ c: sql<number>`count(*)::int` })
        .from(activitySubmissionsTable)
        .where(and(eq(activitySubmissionsTable.userId, link.studentUserId), eq(activitySubmissionsTable.status, "completed")));
      summaries.push({
        linkId: link.id,
        relationshipAr: link.relationshipAr,
        student: s,
        enrolledCourses: enrollCount?.c ?? 0,
        completedLessons: doneLessons?.c ?? 0,
        completedActivities: submissions?.c ?? 0,
      });
    }
    res.json({ children: summaries });
  } catch (err) {
    req.log.error({ err }, "parent children failed");
    res.status(500).json({ error: "Failed" });
  }
});

// Student: list pending invites I created (so I can show/share the code).
router.get("/parent/my-invites", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  const me = req.user.id;
  const rows = await db.select().from(parentLinksTable)
    .where(eq(parentLinksTable.studentUserId, me))
    .orderBy(desc(parentLinksTable.createdAt));
  res.json({ invites: rows });
});

// --- INTERNAL MESSAGING (trainer ↔ student/parent + course broadcast) ---

// List my threads (any thread I'm a participant in)
router.get("/messages/threads", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  const me = req.user.id;
  try {
    const myThreads = await db
      .select({
        id: messageThreadsTable.id,
        subject: messageThreadsTable.subject,
        courseId: messageThreadsTable.courseId,
        isBroadcast: messageThreadsTable.isBroadcast,
        lastMessageAt: messageThreadsTable.lastMessageAt,
        createdAt: messageThreadsTable.createdAt,
        lastReadAt: messageThreadParticipantsTable.lastReadAt,
      })
      .from(messageThreadParticipantsTable)
      .innerJoin(messageThreadsTable, eq(messageThreadsTable.id, messageThreadParticipantsTable.threadId))
      .where(eq(messageThreadParticipantsTable.userId, me))
      .orderBy(desc(messageThreadsTable.lastMessageAt))
      .limit(100);
    res.json({ threads: myThreads });
  } catch (err) {
    req.log.error({ err }, "list threads failed");
    res.status(500).json({ error: "Failed" });
  }
});

// List users I'm allowed to message (mirrors POST /messages/threads RBAC).
router.get("/messages/contacts", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  const me = req.user.id;
  const myRole = req.user.role ?? "student";
  try {
    const ids = new Set<string>();
    if (myRole === "trainer" || isSupervisorOrAdmin(req)) {
      const myCourses = (await db.select({ courseId: courseTrainersTable.courseId })
        .from(courseTrainersTable).where(eq(courseTrainersTable.userId, me))).map(r => r.courseId);
      if (myCourses.length > 0) {
        const students = await db.select({ userId: enrollmentsTable.userId })
          .from(enrollmentsTable).where(inArray(enrollmentsTable.courseId, myCourses));
        const studentIds = students.map(s => s.userId);
        for (const sid of studentIds) ids.add(sid);
        if (studentIds.length > 0) {
          const parents = await db.select({ parentUserId: parentLinksTable.parentUserId })
            .from(parentLinksTable)
            .where(and(eq(parentLinksTable.status, "active"), inArray(parentLinksTable.studentUserId, studentIds)));
          for (const p of parents) if (p.parentUserId) ids.add(p.parentUserId);
        }
      }
    } else if (myRole === "parent") {
      const children = (await db.select({ studentUserId: parentLinksTable.studentUserId })
        .from(parentLinksTable)
        .where(and(eq(parentLinksTable.parentUserId, me), eq(parentLinksTable.status, "active"))))
        .map(r => r.studentUserId);
      for (const cid of children) ids.add(cid);
      if (children.length > 0) {
        const courseIds = (await db.select({ courseId: enrollmentsTable.courseId })
          .from(enrollmentsTable).where(inArray(enrollmentsTable.userId, children))).map(r => r.courseId);
        if (courseIds.length > 0) {
          const trainers = await db.select({ userId: courseTrainersTable.userId })
            .from(courseTrainersTable).where(inArray(courseTrainersTable.courseId, courseIds));
          for (const t of trainers) ids.add(t.userId);
        }
      }
    } else {
      // Student → trainers of their enrolled courses.
      const myCourses = (await db.select({ courseId: enrollmentsTable.courseId })
        .from(enrollmentsTable).where(eq(enrollmentsTable.userId, me))).map(r => r.courseId);
      if (myCourses.length > 0) {
        const trainers = await db.select({ userId: courseTrainersTable.userId })
          .from(courseTrainersTable).where(inArray(courseTrainersTable.courseId, myCourses));
        for (const t of trainers) ids.add(t.userId);
      }
    }
    ids.delete(me);
    const idList = Array.from(ids);
    if (idList.length === 0) { res.json({ contacts: [] }); return; }
    const users = await db.select({
      id: usersTable.id, firstName: usersTable.firstName, lastName: usersTable.lastName,
      email: usersTable.email, role: usersTable.role,
    }).from(usersTable).where(inArray(usersTable.id, idList));
    res.json({ contacts: users });
  } catch (err) {
    req.log.error({ err }, "list contacts failed");
    res.status(500).json({ error: "Failed" });
  }
});

// Create a 1:1 (or small) thread. Trainer↔student/parent only — students can
// open a thread with their course's trainers; trainers can open with any
// enrolled student (or that student's linked parent).
router.post("/messages/threads", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  const me = req.user.id;
  const myRole = req.user.role ?? "student";
  const b = req.body ?? {};
  const subject = String(b.subject ?? "").trim().slice(0, 200) || "رسالة";
  const recipientId = String(b.recipientUserId ?? "").trim();
  const initialBody = String(b.body ?? "").trim().slice(0, 4000);
  if (!recipientId) { res.status(400).json({ error: "recipientUserId required" }); return; }
  if (recipientId === me) { res.status(400).json({ error: "Cannot message yourself" }); return; }

  try {
    // Authorization check: enforce only relevant role pairs.
    const [recipient] = await db.select({ id: usersTable.id, role: usersTable.role })
      .from(usersTable).where(eq(usersTable.id, recipientId)).limit(1);
    if (!recipient) { res.status(404).json({ error: "Recipient not found" }); return; }

    // Strict relationship-based RBAC. We allow:
    //  - admin/supervisor → anyone (operations support);
    //  - trainer → enrolled students of their courses, or those students' linked parents;
    //  - student → trainers assigned to a course they are enrolled in;
    //  - parent → trainers of their linked children's courses, or those children themselves.
    let allowed = false;
    if (isSupervisorOrAdmin(req)) {
      allowed = true;
    } else if (myRole === "trainer") {
      // Find courses this trainer teaches.
      const myCourses = (await db.select({ courseId: courseTrainersTable.courseId })
        .from(courseTrainersTable).where(eq(courseTrainersTable.userId, me))).map(r => r.courseId);
      if (myCourses.length > 0) {
        // Recipient is an enrolled student?
        const [enrolled] = await db.select({ id: enrollmentsTable.id }).from(enrollmentsTable)
          .where(and(eq(enrollmentsTable.userId, recipientId), inArray(enrollmentsTable.courseId, myCourses)))
          .limit(1);
        if (enrolled) allowed = true;
        else {
          // Recipient is a parent of an enrolled student?
          const myStudentIds = (await db.select({ userId: enrollmentsTable.userId })
            .from(enrollmentsTable).where(inArray(enrollmentsTable.courseId, myCourses))).map(r => r.userId);
          if (myStudentIds.length > 0) {
            const [pl] = await db.select({ id: parentLinksTable.id }).from(parentLinksTable)
              .where(and(
                eq(parentLinksTable.parentUserId, recipientId),
                eq(parentLinksTable.status, "active"),
                inArray(parentLinksTable.studentUserId, myStudentIds),
              )).limit(1);
            if (pl) allowed = true;
          }
        }
      }
    } else if (recipient.role === "trainer") {
      // Student or parent → trainer: trainer must teach a relevant course.
      const trainerCourses = (await db.select({ courseId: courseTrainersTable.courseId })
        .from(courseTrainersTable).where(eq(courseTrainersTable.userId, recipientId))).map(r => r.courseId);
      if (trainerCourses.length > 0) {
        if (myRole === "parent") {
          const myChildren = (await db.select({ studentUserId: parentLinksTable.studentUserId })
            .from(parentLinksTable)
            .where(and(eq(parentLinksTable.parentUserId, me), eq(parentLinksTable.status, "active"))))
            .map(r => r.studentUserId);
          if (myChildren.length > 0) {
            const [enr] = await db.select({ id: enrollmentsTable.id }).from(enrollmentsTable)
              .where(and(inArray(enrollmentsTable.userId, myChildren), inArray(enrollmentsTable.courseId, trainerCourses)))
              .limit(1);
            if (enr) allowed = true;
          }
        } else {
          // Student → must be enrolled in at least one of trainer's courses.
          const [enr] = await db.select({ id: enrollmentsTable.id }).from(enrollmentsTable)
            .where(and(eq(enrollmentsTable.userId, me), inArray(enrollmentsTable.courseId, trainerCourses)))
            .limit(1);
          if (enr) allowed = true;
        }
      }
    } else if (myRole === "parent") {
      // Parent → their own linked child (allow direct messaging too).
      const [pl] = await db.select({ id: parentLinksTable.id }).from(parentLinksTable)
        .where(and(
          eq(parentLinksTable.parentUserId, me),
          eq(parentLinksTable.studentUserId, recipientId),
          eq(parentLinksTable.status, "active"),
        )).limit(1);
      if (pl) allowed = true;
    }
    if (!allowed) { res.status(403).json({ error: "No relationship permits this conversation" }); return; }

    const [thread] = await db.insert(messageThreadsTable).values({
      subject, createdById: me, isBroadcast: false,
    }).returning();
    await db.insert(messageThreadParticipantsTable).values([
      { threadId: thread.id, userId: me, lastReadAt: new Date() },
      { threadId: thread.id, userId: recipientId },
    ]);
    if (initialBody) {
      await db.insert(platformMessagesTable).values({ threadId: thread.id, senderId: me, body: initialBody });
      await db.update(messageThreadsTable)
        .set({ lastMessageAt: new Date() })
        .where(eq(messageThreadsTable.id, thread.id));
      await createNotification({
        userId: recipientId, type: "message_received",
        titleAr: "رسالة جديدة", titleEn: "New message",
        bodyAr: initialBody.slice(0, 120), bodyEn: null,
        link: "/dashboard?tab=messages",
      });
    }
    res.json({ thread });
  } catch (err) {
    req.log.error({ err }, "create thread failed");
    res.status(500).json({ error: "Failed" });
  }
});

// Get messages in a thread (must be participant)
router.get("/messages/threads/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  const me = req.user.id;
  const { id } = req.params;
  try {
    const [part] = await db.select({ id: messageThreadParticipantsTable.id })
      .from(messageThreadParticipantsTable)
      .where(and(
        eq(messageThreadParticipantsTable.threadId, id),
        eq(messageThreadParticipantsTable.userId, me),
      )).limit(1);
    if (!part && !isSupervisorOrAdmin(req)) {
      res.status(403).json({ error: "Not a participant" }); return;
    }
    const [thread] = await db.select().from(messageThreadsTable).where(eq(messageThreadsTable.id, id)).limit(1);
    if (!thread) { res.status(404).json({ error: "Not found" }); return; }
    const messages = await db.select({
      id: platformMessagesTable.id,
      senderId: platformMessagesTable.senderId,
      body: platformMessagesTable.body,
      createdAt: platformMessagesTable.createdAt,
    }).from(platformMessagesTable)
      .where(eq(platformMessagesTable.threadId, id))
      .orderBy(asc(platformMessagesTable.createdAt))
      .limit(500);
    const participants = await db.select({
      userId: messageThreadParticipantsTable.userId,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
    }).from(messageThreadParticipantsTable)
      .innerJoin(usersTable, eq(usersTable.id, messageThreadParticipantsTable.userId))
      .where(eq(messageThreadParticipantsTable.threadId, id));
    // Mark read
    if (part) {
      await db.update(messageThreadParticipantsTable)
        .set({ lastReadAt: new Date() })
        .where(eq(messageThreadParticipantsTable.id, part.id));
    }
    res.json({ thread, messages, participants });
  } catch (err) {
    req.log.error({ err }, "get thread failed");
    res.status(500).json({ error: "Failed" });
  }
});

// Post a message (must be participant)
router.post("/messages/threads/:id/messages", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  const me = req.user.id;
  const { id } = req.params;
  const body = String((req.body ?? {}).body ?? "").trim().slice(0, 4000);
  if (!body) { res.status(400).json({ error: "body required" }); return; }
  try {
    const [part] = await db.select({ id: messageThreadParticipantsTable.id })
      .from(messageThreadParticipantsTable)
      .where(and(
        eq(messageThreadParticipantsTable.threadId, id),
        eq(messageThreadParticipantsTable.userId, me),
      )).limit(1);
    if (!part) { res.status(403).json({ error: "Not a participant" }); return; }
    const [msg] = await db.insert(platformMessagesTable).values({ threadId: id, senderId: me, body }).returning();
    await db.update(messageThreadsTable)
      .set({ lastMessageAt: new Date() })
      .where(eq(messageThreadsTable.id, id));
    await db.update(messageThreadParticipantsTable)
      .set({ lastReadAt: new Date() })
      .where(eq(messageThreadParticipantsTable.id, part.id));

    // Notify other participants
    const others = await db.select({ userId: messageThreadParticipantsTable.userId })
      .from(messageThreadParticipantsTable)
      .where(eq(messageThreadParticipantsTable.threadId, id));
    for (const p of others) {
      if (p.userId === me) continue;
      await createNotification({
        userId: p.userId, type: "message_received",
        titleAr: "رسالة جديدة", titleEn: "New message",
        bodyAr: body.slice(0, 120), bodyEn: null,
        link: "/dashboard?tab=messages",
      });
    }
    res.json({ message: msg });
  } catch (err) {
    req.log.error({ err }, "post message failed");
    res.status(500).json({ error: "Failed" });
  }
});

// Trainer/admin: broadcast to all enrolled students of a course.
router.post("/messages/courses/:courseId/broadcast", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "supervisor", "trainer")) return;
  const { courseId } = req.params;
  const me = req.user!.id;
  const b = req.body ?? {};
  const subject = String(b.subject ?? "").trim().slice(0, 200) || "إعلان من المدرّب";
  const body = String(b.body ?? "").trim().slice(0, 4000);
  if (!body) { res.status(400).json({ error: "body required" }); return; }
  try {
    if (!isSupervisorOrAdmin(req) && !(await isCourseTrainer(me, courseId))) {
      res.status(403).json({ error: "Not authorized for this course" }); return;
    }
    const students = await db.select({ userId: enrollmentsTable.userId })
      .from(enrollmentsTable).where(eq(enrollmentsTable.courseId, courseId));
    if (students.length === 0) { res.json({ thread: null, recipients: 0 }); return; }

    const [thread] = await db.insert(messageThreadsTable).values({
      subject, createdById: me, courseId, isBroadcast: true,
    }).returning();
    const partRows = [
      { threadId: thread.id, userId: me, lastReadAt: new Date() },
      ...students.filter(s => s.userId !== me).map(s => ({ threadId: thread.id, userId: s.userId })),
    ];
    await db.insert(messageThreadParticipantsTable).values(partRows);
    await db.insert(platformMessagesTable).values({ threadId: thread.id, senderId: me, body });
    await db.update(messageThreadsTable)
      .set({ lastMessageAt: new Date() })
      .where(eq(messageThreadsTable.id, thread.id));
    for (const s of students) {
      if (s.userId === me) continue;
      await createNotification({
        userId: s.userId, type: "broadcast_received",
        titleAr: "📣 إعلان جديد من المدرّب",
        titleEn: "📣 New broadcast from your trainer",
        bodyAr: body.slice(0, 120), bodyEn: null,
        link: "/dashboard?tab=messages",
      });
    }
    res.json({ thread, recipients: students.length });
  } catch (err) {
    req.log.error({ err }, "broadcast failed");
    res.status(500).json({ error: "Failed" });
  }
});

// ── PARENT DASHBOARD: per-child evaluations + certificates ────────────
router.get("/parent/dashboard", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  const me = req.user.id;
  try {
    const links = await db.select({
      linkId: parentLinksTable.id,
      studentUserId: parentLinksTable.studentUserId,
      relationshipAr: parentLinksTable.relationshipAr,
    }).from(parentLinksTable)
      .where(and(eq(parentLinksTable.parentUserId, me), eq(parentLinksTable.status, "active")));
    if (links.length === 0) { res.json({ children: [] }); return; }
    const studentIds = links.map(l => l.studentUserId);
    const students = await db.select({
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
    }).from(usersTable).where(inArray(usersTable.id, studentIds));
    const studentMap = new Map(students.map(s => [s.id, s]));

    // Latest 5 trainer reviews per child (joined with submission to get userId).
    const reviews = await db.select({
      id: activityReviewsTable.id,
      submissionId: activityReviewsTable.submissionId,
      reviewerId: activityReviewsTable.reviewerId,
      totalScore: activityReviewsTable.totalScore,
      decision: activityReviewsTable.decision,
      createdAt: activityReviewsTable.createdAt,
      userId: activitySubmissionsTable.userId,
      activityId: activitySubmissionsTable.activityId,
    }).from(activityReviewsTable)
      .innerJoin(activitySubmissionsTable, eq(activitySubmissionsTable.id, activityReviewsTable.submissionId))
      .where(inArray(activitySubmissionsTable.userId, studentIds))
      .orderBy(desc(activityReviewsTable.createdAt))
      .limit(50);
    const activityIds = Array.from(new Set(reviews.map(r => r.activityId)));
    const acts = activityIds.length > 0
      ? await db.select({ id: lessonActivitiesTable.id, titleAr: lessonActivitiesTable.titleAr, type: lessonActivitiesTable.type })
          .from(lessonActivitiesTable).where(inArray(lessonActivitiesTable.id, activityIds))
      : [];
    const actMap = new Map(acts.map(a => [a.id, a]));

    // Certificates per child.
    const certs = await db.select().from(certificatesTable)
      .where(inArray(certificatesTable.userId, studentIds))
      .orderBy(desc(certificatesTable.issueDate));

    const children = links.map(l => {
      const s = studentMap.get(l.studentUserId);
      const name = s ? [s.firstName, s.lastName].filter(Boolean).join(" ").trim() || null : null;
      const myReviews = reviews.filter(r => r.userId === l.studentUserId).slice(0, 5).map(r => ({
        id: r.id,
        decision: r.decision,
        totalScore: r.totalScore,
        createdAt: r.createdAt,
        activityTitleAr: actMap.get(r.activityId)?.titleAr ?? null,
        activityType: actMap.get(r.activityId)?.type ?? null,
      }));
      const myCerts = certs.filter(c => c.userId === l.studentUserId).map(c => ({
        id: c.id, code: c.code, programName: c.programName, certType: c.certType,
        status: c.status, issueDate: c.issueDate, certificateFileUrl: c.certificateFileUrl,
      }));
      return {
        linkId: l.linkId,
        studentUserId: l.studentUserId,
        name,
        email: s?.email ?? null,
        relationshipAr: l.relationshipAr,
        recentReviews: myReviews,
        certificates: myCerts,
      };
    });
    res.json({ children });
  } catch (err) {
    req.log.error({ err }, "parent dashboard failed");
    res.status(500).json({ error: "Failed" });
  }
});

// ── 30-min live-session reminder cron ─────────────────────────────────
// Runs every 5 minutes. Finds sessions starting in [now+25min, now+30min]
// (a 5-min window matching the cron interval) and notifies enrolled
// students + linked parents. Dedupes via notifications.type+link presence.
async function runLiveSessionReminders(): Promise<number> {
  try {
    const now = Date.now();
    const winStart = new Date(now + 25 * 60_000);
    const winEnd = new Date(now + 30 * 60_000);
    const upcoming = await db.select().from(liveSessionsTable)
      .where(and(
        eq(liveSessionsTable.status, "scheduled"),
        gte(liveSessionsTable.scheduledAt, winStart),
        lte(liveSessionsTable.scheduledAt, winEnd),
      ));
    if (upcoming.length === 0) return 0;
    let sent = 0;
    for (const s of upcoming) {
      const link = `/dashboard?tab=live&session=${s.id}`;
      const [lesson] = await db.select({ courseId: lessonsTable.courseId, titleAr: lessonsTable.titleAr })
        .from(lessonsTable).where(eq(lessonsTable.id, s.lessonId)).limit(1);
      if (!lesson) continue;
      const enrolled = await db.select({ userId: enrollmentsTable.userId })
        .from(enrollmentsTable).where(eq(enrollmentsTable.courseId, lesson.courseId));
      const studentIds = enrolled.map(e => e.userId);
      const parents = studentIds.length > 0
        ? await db.select({ parentUserId: parentLinksTable.parentUserId })
            .from(parentLinksTable)
            .where(and(inArray(parentLinksTable.studentUserId, studentIds), eq(parentLinksTable.status, "active")))
        : [];
      const recipients = new Set<string>([
        ...studentIds,
        ...parents.map(p => p.parentUserId).filter((x): x is string => !!x),
      ]);
      for (const userId of recipients) {
        const [already] = await db.select({ id: notificationsTable.id })
          .from(notificationsTable)
          .where(and(
            eq(notificationsTable.userId, userId),
            eq(notificationsTable.type, "live_session_reminder"),
            eq(notificationsTable.link, link),
          )).limit(1);
        if (already) continue;
        await createNotification({
          userId,
          type: "live_session_reminder",
          titleAr: "حصة مباشرة بعد ٣٠ دقيقة ⏰",
          titleEn: "Live session in 30 minutes",
          bodyAr: s.titleAr ?? lesson.titleAr ?? null,
          bodyEn: null,
          link,
        });
        sent++;
      }
    }
    return sent;
  } catch (err) {
    logger.error({ err }, "live-session reminder run failed");
    return 0;
  }
}

let reminderTimer: NodeJS.Timeout | null = null;
export function startLiveSessionReminders(): void {
  if (reminderTimer) return;
  reminderTimer = setInterval(() => {
    runLiveSessionReminders().catch((err) => logger.error({ err }, "live reminder failed"));
  }, 5 * 60_000);
  setTimeout(() => {
    runLiveSessionReminders().catch((err) => logger.error({ err }, "live reminder failed"));
  }, 30_000).unref();
  reminderTimer.unref?.();
}

export default router;
