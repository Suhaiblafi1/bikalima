import type { Request, Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

export type Role = "admin" | "supervisor" | "trainer" | "student" | "sales" | "parent";
export const ROLES: readonly Role[] = ["admin", "supervisor", "trainer", "student", "sales", "parent"] as const;

/**
 * Returns true only for a verified account explicitly provisioned as a
 * super-admin in the database. Email addresses are never authorization
 * credentials: a freshly registered user must not gain privileges merely by
 * claiming a particular address.
 */
export function isMasterAccount(req: Request): boolean {
  if (!req.isAuthenticated() || !req.user) return false;
  return req.user.role === "admin"
    && req.user.isSuperAdmin === true
    && req.user.emailVerified === true;
}

export function isValidRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

declare global {
  // Augment the Express user with a role; the actual value is loaded by authMiddleware.
  namespace Express {
    interface User {
      role?: Role;
      isSuperAdmin?: boolean;
      emailVerified?: boolean;
    }
  }
}

/**
 * Re-read the user's role from the database. We always trust the DB over the
 * session payload so role changes take effect without forcing the user to log
 * out. Falls back to "student" if the user record is missing.
 */
export async function getUserAccess(userId: string): Promise<{
  role: Role;
  isSuperAdmin: boolean;
  emailVerified: boolean;
} | null> {
  const [row] = await db
    .select({
      role: usersTable.role,
      isSuperAdmin: usersTable.isSuperAdmin,
      emailVerified: usersTable.emailVerified,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  if (!row) return null;
  return {
    role: isValidRole(row.role) ? row.role : "student",
    isSuperAdmin: row.isSuperAdmin,
    emailVerified: row.emailVerified,
  };
}

export async function getUserRole(userId: string): Promise<Role> {
  return (await getUserAccess(userId))?.role ?? "student";
}

export function isAdmin(req: Request): boolean {
  if (!req.isAuthenticated() || !req.user) return false;
  return req.user.role === "admin";
}

/**
 * True when the user is a true admin OR a supervisor. Use this for endpoints
 * that the supervisor role is allowed to use (LMS/content/overview).
 */
export function isSupervisorOrAdmin(req: Request): boolean {
  if (isAdmin(req)) return true;
  return req.user?.role === "supervisor";
}

export function requireAdmin(req: Request, res: Response): boolean {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

/** Allow admins (incl. master) and supervisors. Used for LMS/content endpoints. */
export function requireSupervisorOrAdmin(req: Request, res: Response): boolean {
  if (!isSupervisorOrAdmin(req)) {
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
