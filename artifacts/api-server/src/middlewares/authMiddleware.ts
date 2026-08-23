import { type Request, type Response, type NextFunction } from "express";
import type { AuthUser } from "@workspace/api-zod";
import {
  clearSession,
  getSessionId,
  getSession,
} from "../lib/auth.js";
import { getUserAccess, type Role } from "../lib/admin.js";

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;
      user?: User | undefined;
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  const sid = getSessionId(req);
  if (!sid) {
    next();
    return;
  }

  const session = await getSession(sid);
  if (!session?.user?.id) {
    await clearSession(res, sid);
    next();
    return;
  }

  // Always re-read authorization state from the DB so changes take effect
  // immediately without forcing the user to log out. No privilege is inferred
  // from an email address or from the stale session payload.
  let role: Role = "student";
  let isSuperAdmin = false;
  let emailVerified = false;
  try {
    const access = await getUserAccess(session.user.id);
    if (!access) {
      await clearSession(res, sid);
      next();
      return;
    }
    role = access.role;
    isSuperAdmin = access.isSuperAdmin;
    emailVerified = access.emailVerified;
  } catch {
    role = "student";
  }

  req.user = { ...session.user, role, isSuperAdmin, emailVerified };
  next();
}
