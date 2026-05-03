import { Router, type IRouter, type Request, type Response } from "express";
import { db, notificationsTable } from "@workspace/db";
import { and, desc, eq, isNull, sql } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "unauthorized" });
    return false;
  }
  return true;
}

router.get("/my/notifications", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
<<<<<<< HEAD
    const raw = parseInt(String(req.query.limit ?? "20"), 10);
    const limit = Math.min(Math.max(Number.isFinite(raw) && raw > 0 ? raw : 20, 1), 100);
=======
    const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10) || 20, 100);
>>>>>>> c80f513 (Saved your changes before starting work)
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, req.user!.id))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(limit);
    res.json({ notifications: rows });
  } catch (err) {
    req.log.error({ err }, "list notifications failed");
    res.status(500).json({ error: "failed" });
  }
});

router.get("/my/notifications/unread-count", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notificationsTable)
      .where(and(eq(notificationsTable.userId, req.user!.id), isNull(notificationsTable.readAt)));
    res.json({ count: row?.count ?? 0 });
  } catch (err) {
    req.log.error({ err }, "unread count failed");
    res.status(500).json({ error: "failed" });
  }
});

router.post("/my/notifications/:id/read", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    await db
      .update(notificationsTable)
      .set({ readAt: new Date() })
      .where(and(eq(notificationsTable.id, req.params.id), eq(notificationsTable.userId, req.user!.id)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "mark read failed");
    res.status(500).json({ error: "failed" });
  }
});

router.post("/my/notifications/read-all", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    await db
      .update(notificationsTable)
      .set({ readAt: new Date() })
      .where(and(eq(notificationsTable.userId, req.user!.id), isNull(notificationsTable.readAt)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "mark all read failed");
    res.status(500).json({ error: "failed" });
  }
});

export default router;
