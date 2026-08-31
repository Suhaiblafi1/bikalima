import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  usersTable,
  workbooksTable,
  workbookPagesTable,
  workbookNotesTable,
  workbookOrdersTable,
  workbookSubmissionsTable,
  courseTrainersTable,
} from "@workspace/db";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { isAdmin, isSupervisorOrAdmin, requireAdmin, requireRole } from "../lib/admin.js";
import { SKILL_KEYS, creditSkillPoints } from "../lib/skills.js";
import { isUniqueViolation } from "../lib/db-errors.js";

const router: IRouter = Router();

// A learner may read a workbook once an order of theirs has left the
// "pending" state — the same rule /my/workbooks already uses to decide what
// appears in "مكتباتي". Admins read everything so they can proof a draft.
const OWNED_STATUSES = ["confirmed", "shipped", "delivered"] as const;

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated?.() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  return true;
}

async function canRead(req: Request, workbookId: string): Promise<boolean> {
  if (isAdmin(req)) return true;
  const userId = req.user?.id;
  if (!userId) return false;
  const [owned] = await db
    .select({ id: workbookOrdersTable.id })
    .from(workbookOrdersTable)
    .where(
      and(
        eq(workbookOrdersTable.userId, userId),
        eq(workbookOrdersTable.workbookId, workbookId),
        inArray(workbookOrdersTable.status, OWNED_STATUSES),
      ),
    )
    .limit(1);
  return !!owned;
}

async function findWorkbookBySlug(slug: string) {
  const [workbook] = await db
    .select()
    .from(workbooksTable)
    .where(eq(workbooksTable.slug, slug))
    .limit(1);
  return workbook ?? null;
}

// ── Reading ────────────────────────────────────────────────────────────

/** Table of contents: every published page, without its body. */
router.get("/workbooks/:slug/pages", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const workbook = await findWorkbookBySlug(req.params.slug);
    if (!workbook) {
      res.status(404).json({ error: "Workbook not found" });
      return;
    }
    if (!(await canRead(req, workbook.id))) {
      res.status(403).json({ error: "لا تملك هذه الكرّاسة بعد" });
      return;
    }
    const admin = isAdmin(req);
    const rows = await db
      .select({
        id: workbookPagesTable.id,
        pageNumber: workbookPagesTable.pageNumber,
        sectionAr: workbookPagesTable.sectionAr,
        sectionEn: workbookPagesTable.sectionEn,
        titleAr: workbookPagesTable.titleAr,
        titleEn: workbookPagesTable.titleEn,
        isPublished: workbookPagesTable.isPublished,
      })
      .from(workbookPagesTable)
      .where(eq(workbookPagesTable.workbookId, workbook.id))
      .orderBy(asc(workbookPagesTable.pageNumber));
    const pages = admin ? rows : rows.filter((p) => p.isPublished);
    res.json({
      workbook: {
        id: workbook.id,
        slug: workbook.slug,
        titleAr: workbook.titleAr,
        titleEn: workbook.titleEn,
        coverImageUrl: workbook.coverImageUrl,
      },
      pages,
      totalPages: pages.length,
    });
  } catch (err) {
    req.log.error({ err }, "Workbook pages list failed");
    res.status(500).json({ error: "Could not load workbook" });
  }
});

/** One page plus the reader's own notes on it. */
router.get("/workbooks/:slug/pages/:pageNumber", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const pageNumber = Number(req.params.pageNumber);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    res.status(400).json({ error: "Invalid page number" });
    return;
  }
  try {
    const workbook = await findWorkbookBySlug(req.params.slug);
    if (!workbook) {
      res.status(404).json({ error: "Workbook not found" });
      return;
    }
    if (!(await canRead(req, workbook.id))) {
      res.status(403).json({ error: "لا تملك هذه الكرّاسة بعد" });
      return;
    }
    const [page] = await db
      .select()
      .from(workbookPagesTable)
      .where(
        and(
          eq(workbookPagesTable.workbookId, workbook.id),
          eq(workbookPagesTable.pageNumber, pageNumber),
        ),
      )
      .limit(1);
    if (!page || (!page.isPublished && !isAdmin(req))) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    const notes = await db
      .select()
      .from(workbookNotesTable)
      .where(
        and(
          eq(workbookNotesTable.userId, req.user!.id),
          eq(workbookNotesTable.pageId, page.id),
        ),
      )
      .orderBy(desc(workbookNotesTable.createdAt));
    // The reader needs the learner's own attempt to render the exercise box in
    // the right state: empty, awaiting review, passed, or sent back.
    const [submission] = await db
      .select()
      .from(workbookSubmissionsTable)
      .where(
        and(
          eq(workbookSubmissionsTable.userId, req.user!.id),
          eq(workbookSubmissionsTable.pageId, page.id),
        ),
      )
      .limit(1);
    res.json({ page, notes, submission: submission ?? null });
  } catch (err) {
    req.log.error({ err }, "Workbook page read failed");
    res.status(500).json({ error: "Could not load page" });
  }
});

// ── Notes (a reader's own, always private) ─────────────────────────────

/** Every note this reader wrote in the workbook, newest first. */
router.get("/workbooks/:slug/notes", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const workbook = await findWorkbookBySlug(req.params.slug);
    if (!workbook) {
      res.status(404).json({ error: "Workbook not found" });
      return;
    }
    if (!(await canRead(req, workbook.id))) {
      res.status(403).json({ error: "لا تملك هذه الكرّاسة بعد" });
      return;
    }
    const notes = await db
      .select({
        id: workbookNotesTable.id,
        pageId: workbookNotesTable.pageId,
        quote: workbookNotesTable.quote,
        content: workbookNotesTable.content,
        createdAt: workbookNotesTable.createdAt,
        pageNumber: workbookPagesTable.pageNumber,
      })
      .from(workbookNotesTable)
      .innerJoin(workbookPagesTable, eq(workbookNotesTable.pageId, workbookPagesTable.id))
      .where(
        and(
          eq(workbookNotesTable.userId, req.user!.id),
          eq(workbookNotesTable.workbookId, workbook.id),
        ),
      )
      .orderBy(asc(workbookPagesTable.pageNumber), desc(workbookNotesTable.createdAt));
    res.json({ notes });
  } catch (err) {
    req.log.error({ err }, "Workbook notes list failed");
    res.status(500).json({ error: "Could not load notes" });
  }
});

const NoteInput = z.object({
  pageId: z.string().min(1).max(64),
  quote: z.string().trim().max(2000).optional(),
  content: z.string().trim().min(1).max(4000),
});

router.post("/workbook-notes", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const parsed = NoteInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues });
    return;
  }
  try {
    const [page] = await db
      .select({ id: workbookPagesTable.id, workbookId: workbookPagesTable.workbookId })
      .from(workbookPagesTable)
      .where(eq(workbookPagesTable.id, parsed.data.pageId))
      .limit(1);
    if (!page) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    if (!(await canRead(req, page.workbookId))) {
      res.status(403).json({ error: "لا تملك هذه الكرّاسة بعد" });
      return;
    }
    const [note] = await db
      .insert(workbookNotesTable)
      .values({
        userId: req.user!.id,
        workbookId: page.workbookId,
        pageId: page.id,
        quote: parsed.data.quote?.length ? parsed.data.quote : null,
        content: parsed.data.content,
      })
      .returning();
    res.status(201).json({ note });
  } catch (err) {
    req.log.error({ err }, "Workbook note create failed");
    res.status(500).json({ error: "Could not save note" });
  }
});

const NotePatch = z.object({ content: z.string().trim().min(1).max(4000) });

router.patch("/workbook-notes/:id", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const parsed = NotePatch.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues });
    return;
  }
  try {
    // Scoping the update to the owner is what keeps one reader out of
    // another's notes — there is no separate ownership check to forget.
    const [note] = await db
      .update(workbookNotesTable)
      .set({ content: parsed.data.content })
      .where(
        and(
          eq(workbookNotesTable.id, req.params.id),
          eq(workbookNotesTable.userId, req.user!.id),
        ),
      )
      .returning();
    if (!note) {
      res.status(404).json({ error: "Note not found" });
      return;
    }
    res.json({ note });
  } catch (err) {
    req.log.error({ err }, "Workbook note update failed");
    res.status(500).json({ error: "Could not update note" });
  }
});

router.delete("/workbook-notes/:id", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const [note] = await db
      .delete(workbookNotesTable)
      .where(
        and(
          eq(workbookNotesTable.id, req.params.id),
          eq(workbookNotesTable.userId, req.user!.id),
        ),
      )
      .returning({ id: workbookNotesTable.id });
    if (!note) {
      res.status(404).json({ error: "Note not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Workbook note delete failed");
    res.status(500).json({ error: "Could not delete note" });
  }
});

// ── Authoring (admin) ──────────────────────────────────────────────────

router.get("/admin/workbooks/:workbookId/pages", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const pages = await db
      .select()
      .from(workbookPagesTable)
      .where(eq(workbookPagesTable.workbookId, req.params.workbookId))
      .orderBy(asc(workbookPagesTable.pageNumber));
    res.json({ pages });
  } catch (err) {
    req.log.error({ err }, "Admin workbook pages list failed");
    res.status(500).json({ error: "Could not load pages" });
  }
});

const PageInput = z.object({
  pageNumber: z.number().int().min(1).max(10_000),
  sectionAr: z.string().trim().max(200).optional(),
  sectionEn: z.string().trim().max(200).optional(),
  titleAr: z.string().trim().max(300).optional(),
  titleEn: z.string().trim().max(300).optional(),
  bodyAr: z.string().trim().min(1).max(20_000),
  bodyEn: z.string().trim().max(20_000).optional(),
  exerciseAr: z.string().trim().max(4000).optional(),
  exerciseEn: z.string().trim().max(4000).optional(),
  // What the exercise asks for, and what a pass is worth. skillKey is
  // validated against the eight real skills so a typo cannot create a ninth
  // counter that no screen ever shows.
  exerciseType: z.enum(["none", "text", "video_link"]).optional(),
  skillKey: z.enum(SKILL_KEYS).nullish(),
  skillPoints: z.number().int().min(0).max(1000).optional(),
  isPublished: z.boolean().optional(),
});

router.post("/admin/workbooks/:workbookId/pages", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const parsed = PageInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues });
    return;
  }
  try {
    const [workbook] = await db
      .select({ id: workbooksTable.id })
      .from(workbooksTable)
      .where(eq(workbooksTable.id, req.params.workbookId))
      .limit(1);
    if (!workbook) {
      res.status(404).json({ error: "Workbook not found" });
      return;
    }
    const [page] = await db
      .insert(workbookPagesTable)
      .values({ ...parsed.data, workbookId: workbook.id })
      .returning();
    res.status(201).json({ page });
  } catch (err) {
    // uq_workbook_pages_number: that page number is already taken.
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: "رقم الصفحة مستخدم في هذه الكرّاسة" });
      return;
    }
    req.log.error({ err }, "Admin workbook page create failed");
    res.status(500).json({ error: "Could not create page" });
  }
});

router.patch("/admin/workbook-pages/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const parsed = PageInput.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues });
    return;
  }
  try {
    const [page] = await db
      .update(workbookPagesTable)
      .set(parsed.data)
      .where(eq(workbookPagesTable.id, req.params.id))
      .returning();
    if (!page) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    res.json({ page });
  } catch (err) {
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: "رقم الصفحة مستخدم في هذه الكرّاسة" });
      return;
    }
    req.log.error({ err }, "Admin workbook page update failed");
    res.status(500).json({ error: "Could not update page" });
  }
});

router.delete("/admin/workbook-pages/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const [page] = await db
      .delete(workbookPagesTable)
      .where(eq(workbookPagesTable.id, req.params.id))
      .returning({ id: workbookPagesTable.id });
    if (!page) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Admin workbook page delete failed");
    res.status(500).json({ error: "Could not delete page" });
  }
});

// ── Exercises: the learner submits, a trainer judges ───────────────────

const submissionSchema = z.object({
  content: z.string().trim().min(1).max(8000).optional(),
  videoUrl: z.string().trim().url().max(2000).optional(),
});

const reviewSchema = z.object({
  decision: z.enum(["pass", "needs_revision"]),
  feedback: z.string().trim().max(4000).optional(),
});

/**
 * Submit, or resubmit, the exercise on one page.
 *
 * Entitlement is checked against the page's own workbook rather than anything
 * the client sends, so a learner cannot answer an exercise in a workbook they
 * have not bought by quoting someone else's page id.
 */
router.post("/workbook-pages/:pageId/submission", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const parsed = submissionSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid submission", details: parsed.error.flatten() });
    return;
  }
  try {
    const [page] = await db
      .select()
      .from(workbookPagesTable)
      .where(eq(workbookPagesTable.id, req.params.pageId))
      .limit(1);
    if (!page || !page.isPublished) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    if (!(await canRead(req, page.workbookId))) {
      res.status(403).json({ error: "لا تملك هذه الكرّاسة بعد" });
      return;
    }
    if (page.exerciseType === "none") {
      res.status(400).json({ error: "لا يوجد تمرين على هذه الصفحة" });
      return;
    }
    // Each exercise type accepts exactly the answer it asked for. Taking the
    // other field would let a learner satisfy a speech exercise by typing.
    const content = page.exerciseType === "text" ? parsed.data.content : undefined;
    const videoUrl = page.exerciseType === "video_link" ? parsed.data.videoUrl : undefined;
    if (page.exerciseType === "text" && !content) {
      res.status(400).json({ error: "اكتب إجابتك أولاً" });
      return;
    }
    if (page.exerciseType === "video_link" && !videoUrl) {
      res.status(400).json({ error: "أضف رابط الفيديو أولاً" });
      return;
    }

    // One row per learner per page: a resubmission after "needs_revision"
    // reopens this row rather than queueing a second copy of the same work.
    // The verdict is cleared so a reviewed row cannot sit in the queue still
    // showing the previous decision.
    const [saved] = await db
      .insert(workbookSubmissionsTable)
      .values({
        userId: req.user!.id,
        workbookId: page.workbookId,
        pageId: page.id,
        content: content ?? null,
        videoUrl: videoUrl ?? null,
        status: "submitted",
      })
      .onConflictDoUpdate({
        target: [workbookSubmissionsTable.userId, workbookSubmissionsTable.pageId],
        set: {
          content: content ?? null,
          videoUrl: videoUrl ?? null,
          status: "submitted",
          decision: null,
          feedback: null,
          reviewedById: null,
          reviewedAt: null,
          updatedAt: new Date(),
        },
      })
      .returning();
    res.status(201).json({ submission: saved });
  } catch (err) {
    req.log.error({ err }, "Workbook submission failed");
    res.status(500).json({ error: "Could not save your answer" });
  }
});

/** Everything this learner has submitted in one workbook — their progress. */
router.get("/workbooks/:slug/submissions", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const workbook = await findWorkbookBySlug(req.params.slug);
    if (!workbook) {
      res.status(404).json({ error: "Workbook not found" });
      return;
    }
    if (!(await canRead(req, workbook.id))) {
      res.status(403).json({ error: "لا تملك هذه الكرّاسة بعد" });
      return;
    }
    const rows = await db
      .select({
        id: workbookSubmissionsTable.id,
        pageId: workbookSubmissionsTable.pageId,
        pageNumber: workbookPagesTable.pageNumber,
        status: workbookSubmissionsTable.status,
        decision: workbookSubmissionsTable.decision,
        feedback: workbookSubmissionsTable.feedback,
        awardedPoints: workbookSubmissionsTable.awardedPoints,
        updatedAt: workbookSubmissionsTable.updatedAt,
      })
      .from(workbookSubmissionsTable)
      .innerJoin(workbookPagesTable, eq(workbookPagesTable.id, workbookSubmissionsTable.pageId))
      .where(
        and(
          eq(workbookSubmissionsTable.userId, req.user!.id),
          eq(workbookSubmissionsTable.workbookId, workbook.id),
        ),
      )
      .orderBy(asc(workbookPagesTable.pageNumber));
    res.json({ submissions: rows });
  } catch (err) {
    req.log.error({ err }, "Workbook submissions read failed");
    res.status(500).json({ error: "Could not load your progress" });
  }
});

/**
 * The trainer's queue: work waiting on a verdict, newest first.
 *
 * A plain trainer sees only workbooks linked to a course they teach — the
 * same rule the lesson-activity queue applies, and for the same reason: a
 * learner's written answer is theirs, not every trainer's to read. A workbook
 * with no linked course therefore reaches supervisors and admins only, which
 * is the safe direction to fail; linking it to its course is what puts it in
 * front of the right trainer.
 */
router.get("/instructor/workbook-submissions", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "supervisor", "trainer")) return;
  const status = req.query.status === "reviewed" ? "reviewed" : "submitted";
  try {
    let scope = null as null | string[];
    if (!isSupervisorOrAdmin(req)) {
      const taught = await db
        .select({ courseId: courseTrainersTable.courseId })
        .from(courseTrainersTable)
        .where(eq(courseTrainersTable.userId, req.user!.id));
      scope = taught.map((r) => r.courseId);
      if (scope.length === 0) {
        res.json({ submissions: [] });
        return;
      }
    }
    const rows = await db
      .select({
        id: workbookSubmissionsTable.id,
        content: workbookSubmissionsTable.content,
        videoUrl: workbookSubmissionsTable.videoUrl,
        status: workbookSubmissionsTable.status,
        decision: workbookSubmissionsTable.decision,
        feedback: workbookSubmissionsTable.feedback,
        awardedPoints: workbookSubmissionsTable.awardedPoints,
        createdAt: workbookSubmissionsTable.createdAt,
        updatedAt: workbookSubmissionsTable.updatedAt,
        pageNumber: workbookPagesTable.pageNumber,
        pageTitleAr: workbookPagesTable.titleAr,
        exerciseAr: workbookPagesTable.exerciseAr,
        exerciseType: workbookPagesTable.exerciseType,
        skillKey: workbookPagesTable.skillKey,
        skillPoints: workbookPagesTable.skillPoints,
        workbookTitleAr: workbooksTable.titleAr,
        workbookSlug: workbooksTable.slug,
        studentEmail: usersTable.email,
        studentFirst: usersTable.firstName,
        studentLast: usersTable.lastName,
      })
      .from(workbookSubmissionsTable)
      .innerJoin(workbookPagesTable, eq(workbookPagesTable.id, workbookSubmissionsTable.pageId))
      .innerJoin(workbooksTable, eq(workbooksTable.id, workbookSubmissionsTable.workbookId))
      .innerJoin(usersTable, eq(usersTable.id, workbookSubmissionsTable.userId))
      .where(
        and(
          eq(workbookSubmissionsTable.status, status),
          ...(scope ? [inArray(workbooksTable.linkedCourseId, scope)] : []),
        ),
      )
      .orderBy(desc(workbookSubmissionsTable.updatedAt))
      .limit(200);
    res.json({ submissions: rows });
  } catch (err) {
    req.log.error({ err }, "Workbook submission queue failed");
    res.status(500).json({ error: "Could not load the queue" });
  }
});

/**
 * Record a verdict, and settle the skill points it is worth.
 *
 * The award is expressed as a difference against awardedPoints rather than as
 * an addition, because a trainer may review the same row more than once:
 * passing twice must not pay twice, and downgrading a pass to
 * "needs_revision" must take back exactly what that pass granted.
 */
router.post("/instructor/workbook-submissions/:id/review", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "supervisor", "trainer")) return;
  const parsed = reviewSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid review", details: parsed.error.flatten() });
    return;
  }
  const { decision, feedback } = parsed.data;
  try {
    // Scoped exactly like the queue. Reading the queue and acting on a row
    // are the same privilege, so an id learned elsewhere must not be a way
    // around it — the scope goes in the WHERE clause, not a later check.
    let scope = null as null | string[];
    if (!isSupervisorOrAdmin(req)) {
      const taught = await db
        .select({ courseId: courseTrainersTable.courseId })
        .from(courseTrainersTable)
        .where(eq(courseTrainersTable.userId, req.user!.id));
      scope = taught.map((r) => r.courseId);
      if (scope.length === 0) {
        res.status(404).json({ error: "Submission not found" });
        return;
      }
    }
    const [row] = await db
      .select({
        submissionId: workbookSubmissionsTable.id,
        userId: workbookSubmissionsTable.userId,
        awardedPoints: workbookSubmissionsTable.awardedPoints,
        skillKey: workbookPagesTable.skillKey,
        skillPoints: workbookPagesTable.skillPoints,
      })
      .from(workbookSubmissionsTable)
      .innerJoin(workbookPagesTable, eq(workbookPagesTable.id, workbookSubmissionsTable.pageId))
      .innerJoin(workbooksTable, eq(workbooksTable.id, workbookSubmissionsTable.workbookId))
      .where(
        and(
          eq(workbookSubmissionsTable.id, req.params.id),
          ...(scope ? [inArray(workbooksTable.linkedCourseId, scope)] : []),
        ),
      )
      .limit(1);
    if (!row) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    const shouldBeWorth = decision === "pass" && row.skillKey ? row.skillPoints : 0;
    const delta = shouldBeWorth - row.awardedPoints;

    const [saved] = await db
      .update(workbookSubmissionsTable)
      .set({
        status: "reviewed",
        decision,
        feedback: feedback ?? null,
        reviewedById: req.user!.id,
        reviewedAt: new Date(),
        awardedPoints: shouldBeWorth,
        updatedAt: new Date(),
      })
      .where(eq(workbookSubmissionsTable.id, row.submissionId))
      .returning();

    if (delta !== 0 && row.skillKey) {
      await creditSkillPoints(row.userId, row.skillKey, delta);
    }
    res.json({ submission: saved, skillPointsChanged: delta });
  } catch (err) {
    req.log.error({ err }, "Workbook submission review failed");
    res.status(500).json({ error: "Could not save the review" });
  }
});

export default router;
