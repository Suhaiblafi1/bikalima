import type { Request, Response } from "express";

export const ADMIN_EMAILS = ["info@bikalima.com"];

export function isAdmin(req: Request): boolean {
  if (!req.isAuthenticated() || !req.user) return false;
  return ADMIN_EMAILS.includes(req.user.email.toLowerCase());
}

export function requireAdmin(req: Request, res: Response): boolean {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}
