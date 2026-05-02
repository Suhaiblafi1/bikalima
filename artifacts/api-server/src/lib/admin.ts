import type { Request, Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

export const ADMIN_EMAILS = ["info@bikalima.com"];

export type Role = "admin" | "trainer" | "student" | "sales";
export const ROLES: readonly Role[] = ["admin", "trainer", "student", "sales"] as const;

export function isValidRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

declare global {
  // Augment the Express user with a role; the actual value is loaded by authMiddleware.
  namespace Express {
    interface User {
      role?: Role;
    }
  }
}

/**
 * Re-read the user's role from the database. We always trust the DB over the
 * session payload so role changes take effect without forcing the user to log
 * out. Falls back to "student" if the user record is missing.
 */
export async function getUserRole(userId: string): Promise<Role> {
  const [row] = await db
    .select({ role: usersTable.role, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  if (!row) return "student";
  // Bootstrap: any user whose email is in ADMIN_EMAILS is auto-promoted.
  if (ADMIN_EMAILS.includes(row.email.toLowerCase()) && row.role !== "admin") {
    await db
      .update(usersTable)
      .set({ role: "admin" })
      .where(eq(usersTable.id, userId));
    return "admin";
  }
  return isValidRole(row.role) ? row.role : "student";
}

export function isAdmin(req: Request): boolean {
  if (!req.isAuthenticated() || !req.user) return false;
  if (req.user.role === "admin") return true;
  return ADMIN_EMAILS.includes(req.user.email.toLowerCase());
}

export function requireAdmin(req: Request, res: Response): boolean {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

/**
 * Allow only the listed roles. Admin always passes regardless of `allowed`.
 * Returns true if the request may proceed; otherwise sends 401/403 and returns false.
 */
export function requireRole(req: Request, res: Response, ...allowed: Role[]): boolean {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  const role = req.user.role ?? "student";
  if (role === "admin") return true;
  if (allowed.includes(role)) return true;
  res.status(403).json({ error: "Forbidden", role, allowed });
  return false;
}

/**
 * Count how many admin accounts currently exist. Used to prevent demoting the
 * last admin into oblivion.
 */
export async function countAdmins(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(eq(usersTable.role, "admin"));
  return row?.count ?? 0;
}
