import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  workbooksTable,
  workbookPagesTable,
  workbookNotesTable,
  workbookOrdersTable,
} from "@workspace/db";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { isAdmin, requireAdmin } from "../lib/admin.js";

const router: IRouter = Router();

// A learner may read a workbook once an order of theirs has left the
// "pending" state — the same rule /my/workbooks already uses to decide what
// appears in "مكتباتي". Admins read everything so they can proof a draft.
const OWNED_STATUSES = ["confirmed", "shipped", "delivered"] as const;

/**
 * True for a Postgres unique-violation. Drizzle wraps driver errors in a
 * _DrizzleQueryError, so the pg `code` sits on the cause rather than on the
 * error itself — checking only the top level silently misses every conflict.
 */
function isUniqueViolation(err: unknown): boolean {
  for (let e: unknown = err, depth = 0; e && depth < 5; depth++) {
    if ((e as { code?: string }).code === "23505") return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}

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
    res.json({ page, notes });
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

export default router;
