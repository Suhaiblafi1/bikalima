import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  assignmentsTable,
  assignmentSubmissionsTable,
  enrollmentsTable,
  coursesTable,
  courseTrainersTable,
  usersTable,
} from "@workspace/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import { requireRole, isAdmin } from "../lib/admin.js";
import { createNotification } from "../lib/notifications.js";

// Returns the set of courseIds this user can administer assignments for.
// Admins get null (= unrestricted). Trainers get their assigned course list.
// Returns an empty array for anyone else (effectively blocks them).
async function getAdminScopeCourseIds(req: Request): Promise<string[] | null> {
  if (isAdmin(req)) return null;
  if (!req.user) return [];
  if (req.user.role !== "trainer") return [];
  const rows = await db
    .select({ courseId: courseTrainersTable.courseId })
    .from(courseTrainersTable)
    .where(eq(courseTrainersTable.userId, req.user.id));
  return rows.map((r) => r.courseId);
}

function trainerCanTouchCourse(scope: string[] | null, courseId: string | null): boolean {
  if (scope === null) return true; // admin
  if (!courseId) return false; // unattached assignments belong to admins only
  return scope.includes(courseId);
}

const router: IRouter = Router();

const SCORE_FIELDS = [
  "clarityScore",
  "structureScore",
  "openingScore",
  "voiceScore",
  "bodyLanguageScore",
  "conclusionScore",
  "impactScore",
] as const;

type ScoreField = (typeof SCORE_FIELDS)[number];

function clamp10(n: unknown): number | null {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return null;
  return Math.max(1, Math.min(10, Math.round(v)));
}

function computeTotalOutOf100(scores: Record<ScoreField, number | null>): number | null {
  const values = SCORE_FIELDS.map((k) => scores[k]).filter(
    (n): n is number => n !== null && n !== undefined,
  );
  if (values.length === 0) return null;
  const sum = values.reduce((acc, n) => acc + n, 0);
  return Math.round((sum / (values.length * 10)) * 100);
}

async function getEnrolledCourseIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ courseId: enrollmentsTable.courseId })
    .from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.status, "active")));
  return rows.map((r) => r.courseId);
}

// ────────────────────────────────────────────────────────────────────────────
// Student endpoints
// ────────────────────────────────────────────────────────────────────────────

router.get("/my/assignments", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const courseIds = await getEnrolledCourseIds(req.user.id);
    if (courseIds.length === 0) {
      res.json({ assignments: [] });
      return;
    }

    const assignments = await db
      .select({
        id: assignmentsTable.id,
        courseId: assignmentsTable.courseId,
        titleAr: assignmentsTable.titleAr,
        titleEn: assignmentsTable.titleEn,
        descriptionAr: assignmentsTable.descriptionAr,
        descriptionEn: assignmentsTable.descriptionEn,
        dueAt: assignmentsTable.dueAt,
        createdAt: assignmentsTable.createdAt,
        courseTitleAr: coursesTable.titleAr,
        courseTitleEn: coursesTable.titleEn,
      })
      .from(assignmentsTable)
      .leftJoin(coursesTable, eq(assignmentsTable.courseId, coursesTable.id))
      .where(
        and(
          eq(assignmentsTable.isPublished, true),
          inArray(assignmentsTable.courseId, courseIds),
        ),
      )
      .orderBy(desc(assignmentsTable.createdAt));

    const submissions = assignments.length
      ? await db
          .select()
          .from(assignmentSubmissionsTable)
          .where(
            and(
              eq(assignmentSubmissionsTable.userId, req.user.id),
              inArray(
                assignmentSubmissionsTable.assignmentId,
                assignments.map((a) => a.id),
              ),
            ),
          )
      : [];

    const subByAssignment = new Map(submissions.map((s) => [s.assignmentId, s]));

    res.json({
      assignments: assignments.map((a) => ({
        ...a,
        submission: subByAssignment.get(a.id) ?? null,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to load assignments");
    res.status(500).json({ error: "Failed to load assignments" });
  }
});

router.post("/my/assignments/:id/submit", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const { id } = req.params;
    const { submissionType, submissionUrl, submissionText } = req.body ?? {};

    const validTypes = ["youtube", "video_url", "text"] as const;
    if (!validTypes.includes(submissionType)) {
      res.status(400).json({ error: "Invalid submission type" });
      return;
    }

    const url = typeof submissionUrl === "string" ? submissionUrl.trim() : "";
    const text = typeof submissionText === "string" ? submissionText.trim() : "";

    if (submissionType === "text" && !text) {
      res.status(400).json({ error: "Submission text is required" });
      return;
    }
    if ((submissionType === "youtube" || submissionType === "video_url") && !url) {
      res.status(400).json({ error: "Submission URL is required" });
      return;
    }

    const [assignment] = await db
      .select()
      .from(assignmentsTable)
      .where(and(eq(assignmentsTable.id, id), eq(assignmentsTable.isPublished, true)));
    if (!assignment) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    if (assignment.courseId) {
      const courseIds = await getEnrolledCourseIds(req.user.id);
      if (!courseIds.includes(assignment.courseId)) {
        res.status(403).json({ error: "Not enrolled in the course for this assignment" });
        return;
      }
    }

    const [existing] = await db
      .select()
      .from(assignmentSubmissionsTable)
      .where(
        and(
          eq(assignmentSubmissionsTable.assignmentId, id),
          eq(assignmentSubmissionsTable.userId, req.user.id),
        ),
      );

    if (existing && existing.status === "reviewed") {
      res.status(409).json({
        error: "already_reviewed",
        message: "هذا الواجب تمّ تقييمه بالفعل. تواصل مع المدرّب لإعادة فتحه.",
      });
      return;
    }

    const payload = {
      submissionType,
      submissionUrl: submissionType === "text" ? null : url,
      submissionText: submissionType === "text" ? text : null,
      status: "submitted" as const,
      clarityScore: null,
      structureScore: null,
      openingScore: null,
      voiceScore: null,
      bodyLanguageScore: null,
      conclusionScore: null,
      impactScore: null,
      totalScore: null,
      trainerFeedback: null,
      reviewedAt: null,
      reviewedById: null,
      submittedAt: new Date(),
    };

    if (existing) {
      const [updated] = await db
        .update(assignmentSubmissionsTable)
        .set(payload)
        .where(eq(assignmentSubmissionsTable.id, existing.id))
        .returning();
      res.json({ submission: updated });
    } else {
      const [created] = await db
        .insert(assignmentSubmissionsTable)
        .values({ assignmentId: id, userId: req.user.id, ...payload })
        .returning();
      res.json({ submission: created });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to submit assignment");
    res.status(500).json({ error: "Failed to submit" });
  }
});

router.get("/my/assignments/progress", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const rows = await db
      .select({
        id: assignmentSubmissionsTable.id,
        assignmentId: assignmentSubmissionsTable.assignmentId,
        status: assignmentSubmissionsTable.status,
        totalScore: assignmentSubmissionsTable.totalScore,
        trainerFeedback: assignmentSubmissionsTable.trainerFeedback,
        submittedAt: assignmentSubmissionsTable.submittedAt,
        reviewedAt: assignmentSubmissionsTable.reviewedAt,
        clarityScore: assignmentSubmissionsTable.clarityScore,
        structureScore: assignmentSubmissionsTable.structureScore,
        openingScore: assignmentSubmissionsTable.openingScore,
        voiceScore: assignmentSubmissionsTable.voiceScore,
        bodyLanguageScore: assignmentSubmissionsTable.bodyLanguageScore,
        conclusionScore: assignmentSubmissionsTable.conclusionScore,
        impactScore: assignmentSubmissionsTable.impactScore,
        assignmentTitleAr: assignmentsTable.titleAr,
        assignmentTitleEn: assignmentsTable.titleEn,
      })
      .from(assignmentSubmissionsTable)
      .leftJoin(
        assignmentsTable,
        eq(assignmentSubmissionsTable.assignmentId, assignmentsTable.id),
      )
      .where(eq(assignmentSubmissionsTable.userId, req.user.id))
      .orderBy(desc(assignmentSubmissionsTable.submittedAt));

    const reviewed = rows.filter(
      (r) => r.status === "reviewed" && typeof r.totalScore === "number",
    );
    const avg =
      reviewed.length > 0
        ? Math.round(
            reviewed.reduce((acc, r) => acc + (r.totalScore ?? 0), 0) / reviewed.length,
          )
        : null;

    res.json({
      submissions: rows,
      summary: {
        total: rows.length,
        reviewedCount: reviewed.length,
        averageScore: avg,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to load progress");
    res.status(500).json({ error: "Failed to load progress" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Admin / trainer endpoints
// ────────────────────────────────────────────────────────────────────────────

router.get("/admin/assignments", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "trainer")) return;
  try {
    const scope = await getAdminScopeCourseIds(req);
    // Trainer with no assigned courses sees nothing rather than 403'ing.
    if (scope !== null && scope.length === 0) {
      res.json({ assignments: [] });
      return;
    }

    const baseQuery = db
      .select({
        id: assignmentsTable.id,
        courseId: assignmentsTable.courseId,
        titleAr: assignmentsTable.titleAr,
        titleEn: assignmentsTable.titleEn,
        descriptionAr: assignmentsTable.descriptionAr,
        descriptionEn: assignmentsTable.descriptionEn,
        dueAt: assignmentsTable.dueAt,
        isPublished: assignmentsTable.isPublished,
        createdAt: assignmentsTable.createdAt,
        courseTitleAr: coursesTable.titleAr,
        courseTitleEn: coursesTable.titleEn,
      })
      .from(assignmentsTable)
      .leftJoin(coursesTable, eq(assignmentsTable.courseId, coursesTable.id));

    const assignments = scope === null
      ? await baseQuery.orderBy(desc(assignmentsTable.createdAt))
      : await baseQuery
          .where(inArray(assignmentsTable.courseId, scope))
          .orderBy(desc(assignmentsTable.createdAt));

    const ids = assignments.map((a) => a.id);
    const counts = ids.length
      ? await db
          .select({
            assignmentId: assignmentSubmissionsTable.assignmentId,
            status: assignmentSubmissionsTable.status,
          })
          .from(assignmentSubmissionsTable)
          .where(inArray(assignmentSubmissionsTable.assignmentId, ids))
      : [];

    const submissionStats = new Map<string, { total: number; reviewed: number }>();
    for (const c of counts) {
      const cur = submissionStats.get(c.assignmentId) ?? { total: 0, reviewed: 0 };
      cur.total += 1;
      if (c.status === "reviewed") cur.reviewed += 1;
      submissionStats.set(c.assignmentId, cur);
    }

    res.json({
      assignments: assignments.map((a) => ({
        ...a,
        submissionsTotal: submissionStats.get(a.id)?.total ?? 0,
        submissionsReviewed: submissionStats.get(a.id)?.reviewed ?? 0,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list assignments");
    res.status(500).json({ error: "Failed to list assignments" });
  }
});

router.post("/admin/assignments", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "trainer")) return;
  try {
    const { courseId, titleAr, titleEn, descriptionAr, descriptionEn, dueAt, isPublished } =
      req.body ?? {};
    if (!titleAr || typeof titleAr !== "string") {
      res.status(400).json({ error: "titleAr is required" });
      return;
    }
    const scope = await getAdminScopeCourseIds(req);
    if (!trainerCanTouchCourse(scope, courseId ?? null)) {
      res.status(403).json({ error: "Cannot create an assignment for this course" });
      return;
    }

    const [created] = await db
      .insert(assignmentsTable)
      .values({
        courseId: courseId || null,
        titleAr: titleAr.trim(),
        titleEn: titleEn?.trim() || null,
        descriptionAr: descriptionAr?.trim() || null,
        descriptionEn: descriptionEn?.trim() || null,
        dueAt: dueAt ? new Date(dueAt) : null,
        isPublished: isPublished !== false,
        createdById: req.user!.id,
      })
      .returning();
    res.json({ assignment: created });
  } catch (err) {
    req.log.error({ err }, "Failed to create assignment");
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

router.patch("/admin/assignments/:id", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "trainer")) return;
  try {
    const { id } = req.params;
    const { courseId, titleAr, titleEn, descriptionAr, descriptionEn, dueAt, isPublished } =
      req.body ?? {};
    const scope = await getAdminScopeCourseIds(req);
    const [current] = await db.select({ courseId: assignmentsTable.courseId })
      .from(assignmentsTable).where(eq(assignmentsTable.id, id));
    if (!current) { res.status(404).json({ error: "Not found" }); return; }
    if (!trainerCanTouchCourse(scope, current.courseId)) {
      res.status(403).json({ error: "Not your course" });
      return;
    }
    if (courseId !== undefined && !trainerCanTouchCourse(scope, courseId ?? null)) {
      res.status(403).json({ error: "Cannot reassign to that course" });
      return;
    }
    const updates: Record<string, unknown> = {};
    if (courseId !== undefined) updates.courseId = courseId || null;
    if (titleAr !== undefined) updates.titleAr = String(titleAr).trim();
    if (titleEn !== undefined) updates.titleEn = titleEn ? String(titleEn).trim() : null;
    if (descriptionAr !== undefined)
      updates.descriptionAr = descriptionAr ? String(descriptionAr).trim() : null;
    if (descriptionEn !== undefined)
      updates.descriptionEn = descriptionEn ? String(descriptionEn).trim() : null;
    if (dueAt !== undefined) updates.dueAt = dueAt ? new Date(dueAt) : null;
    if (isPublished !== undefined) updates.isPublished = !!isPublished;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    const [updated] = await db
      .update(assignmentsTable)
      .set(updates)
      .where(eq(assignmentsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ assignment: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update assignment");
    res.status(500).json({ error: "Failed to update" });
  }
});

router.delete("/admin/assignments/:id", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "trainer")) return;
  try {
    const { id } = req.params;
    const scope = await getAdminScopeCourseIds(req);
    const [current] = await db.select({ courseId: assignmentsTable.courseId })
      .from(assignmentsTable).where(eq(assignmentsTable.id, id));
    if (!current) { res.status(404).json({ error: "Not found" }); return; }
    if (!trainerCanTouchCourse(scope, current.courseId)) {
      res.status(403).json({ error: "Not your course" });
      return;
    }
    await db.delete(assignmentsTable).where(eq(assignmentsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete assignment");
    res.status(500).json({ error: "Failed to delete" });
  }
});

router.get("/admin/assignments/:id/submissions", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "trainer")) return;
  try {
    const { id } = req.params;
    const scope = await getAdminScopeCourseIds(req);

    const [assignment] = await db
      .select({
        id: assignmentsTable.id,
        titleAr: assignmentsTable.titleAr,
        titleEn: assignmentsTable.titleEn,
        descriptionAr: assignmentsTable.descriptionAr,
        descriptionEn: assignmentsTable.descriptionEn,
        courseId: assignmentsTable.courseId,
        courseTitleAr: coursesTable.titleAr,
        courseTitleEn: coursesTable.titleEn,
      })
      .from(assignmentsTable)
      .leftJoin(coursesTable, eq(assignmentsTable.courseId, coursesTable.id))
      .where(eq(assignmentsTable.id, id));
    if (!assignment) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!trainerCanTouchCourse(scope, assignment.courseId)) {
      res.status(403).json({ error: "Not your course" });
      return;
    }

    const submissions = await db
      .select({
        id: assignmentSubmissionsTable.id,
        userId: assignmentSubmissionsTable.userId,
        submissionType: assignmentSubmissionsTable.submissionType,
        submissionUrl: assignmentSubmissionsTable.submissionUrl,
        submissionText: assignmentSubmissionsTable.submissionText,
        status: assignmentSubmissionsTable.status,
        clarityScore: assignmentSubmissionsTable.clarityScore,
        structureScore: assignmentSubmissionsTable.structureScore,
        openingScore: assignmentSubmissionsTable.openingScore,
        voiceScore: assignmentSubmissionsTable.voiceScore,
        bodyLanguageScore: assignmentSubmissionsTable.bodyLanguageScore,
        conclusionScore: assignmentSubmissionsTable.conclusionScore,
        impactScore: assignmentSubmissionsTable.impactScore,
        totalScore: assignmentSubmissionsTable.totalScore,
        trainerFeedback: assignmentSubmissionsTable.trainerFeedback,
        submittedAt: assignmentSubmissionsTable.submittedAt,
        reviewedAt: assignmentSubmissionsTable.reviewedAt,
        userEmail: usersTable.email,
        userFirstName: usersTable.firstName,
        userLastName: usersTable.lastName,
      })
      .from(assignmentSubmissionsTable)
      .leftJoin(usersTable, eq(assignmentSubmissionsTable.userId, usersTable.id))
      .where(eq(assignmentSubmissionsTable.assignmentId, id))
      .orderBy(desc(assignmentSubmissionsTable.submittedAt));

    res.json({ assignment, submissions });
  } catch (err) {
    req.log.error({ err }, "Failed to load submissions");
    res.status(500).json({ error: "Failed to load submissions" });
  }
});

router.post("/admin/submissions/:id/evaluate", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "trainer")) return;
  try {
    const { id } = req.params;
    const body = req.body ?? {};

    // Verify the trainer owns the course this submission belongs to.
    const scope = await getAdminScopeCourseIds(req);
    if (scope !== null) {
      const [link] = await db.select({ courseId: assignmentsTable.courseId })
        .from(assignmentSubmissionsTable)
        .innerJoin(assignmentsTable, eq(assignmentSubmissionsTable.assignmentId, assignmentsTable.id))
        .where(eq(assignmentSubmissionsTable.id, id));
      if (!link) { res.status(404).json({ error: "Submission not found" }); return; }
      if (!trainerCanTouchCourse(scope, link.courseId)) {
        res.status(403).json({ error: "Not your course" });
        return;
      }
    }

    const scores: Record<ScoreField, number | null> = {
      clarityScore: clamp10(body.clarityScore),
      structureScore: clamp10(body.structureScore),
      openingScore: clamp10(body.openingScore),
      voiceScore: clamp10(body.voiceScore),
      bodyLanguageScore: clamp10(body.bodyLanguageScore),
      conclusionScore: clamp10(body.conclusionScore),
      impactScore: clamp10(body.impactScore),
    };
    const missing = SCORE_FIELDS.filter((k) => scores[k] === null);
    if (missing.length > 0) {
      res.status(400).json({
        error: "incomplete_scores",
        message: "يجب تقييم جميع المعايير السبعة (1-10) قبل الحفظ.",
        missing,
      });
      return;
    }
    const totalScore = computeTotalOutOf100(scores);
    const trainerFeedback =
      typeof body.trainerFeedback === "string" ? body.trainerFeedback.trim() || null : null;

    const [updated] = await db
      .update(assignmentSubmissionsTable)
      .set({
        ...scores,
        totalScore,
        trainerFeedback,
        status: "reviewed",
        reviewedAt: new Date(),
        reviewedById: req.user!.id,
      })
      .where(eq(assignmentSubmissionsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }
    // Notify the student that their submission was reviewed.
    try {
      const [a] = await db
        .select({ id: assignmentsTable.id, titleAr: assignmentsTable.titleAr, titleEn: assignmentsTable.titleEn })
        .from(assignmentsTable)
        .where(eq(assignmentsTable.id, updated.assignmentId));
      const aTitleAr = a?.titleAr ?? "تكليفك";
      const aTitleEn = a?.titleEn ?? "your assignment";
      await createNotification({
        userId: updated.userId,
        type: "assignment_reviewed",
        titleAr: "تم تقييم تكليفك",
        titleEn: "Your assignment was reviewed",
        bodyAr: `حصلت على ${updated.totalScore ?? 0}/100 في «${aTitleAr}». اطّلع على ملاحظات المدرّب.`,
        bodyEn: `You scored ${updated.totalScore ?? 0}/100 on "${aTitleEn}". See trainer feedback.`,
        link: "/dashboard?tab=assignments",
      });
    } catch (err) {
      req.log.warn({ err }, "notify-on-grade failed");
    }
    res.json({ submission: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to evaluate submission");
    res.status(500).json({ error: "Failed to evaluate" });
  }
});

export default router;
