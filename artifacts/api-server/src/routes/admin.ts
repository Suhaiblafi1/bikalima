import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

const ADMIN_EMAILS = ["suhaib@ilgholding.com"];

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

router.get("/admin/users", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;

  try {
    const users = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt));

    res.json({ users });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch users");
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/admin/stats", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;

  try {
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable);

    const [todayResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(sql`${usersTable.createdAt} >= CURRENT_DATE`);

    const [weekResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(sql`${usersTable.createdAt} >= CURRENT_DATE - INTERVAL '7 days'`);

    res.json({
      totalUsers: countResult.count,
      todaySignups: todayResult.count,
      weekSignups: weekResult.count,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.delete("/admin/users/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;

  try {
    const { id } = req.params;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      res.status(403).json({ error: "Cannot delete admin user" });
      return;
    }
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete user");
    res.status(500).json({ error: "Failed to delete user" });
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

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, id))
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        createdAt: usersTable.createdAt,
      });

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update user");
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.get("/admin/check", (req: Request, res: Response) => {
  res.json({ isAdmin: isAdmin(req) });
});

export default router;
