import { type Request, type Response, type NextFunction } from "express";
import type { AuthUser } from "@workspace/api-zod";
import {
  clearSession,
  getSessionId,
  getSession,
} from "../lib/auth";
import { getUserRole, type Role } from "../lib/admin";

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

  // Always re-read role from the DB so promotions/demotions take effect
  // immediately without forcing the user to re-login. Also bootstraps admin
  // for any email in ADMIN_EMAILS.
  let role: Role = "student";
  try {
    role = await getUserRole(session.user.id);
  } catch {
    role = "student";
  }

  req.user = { ...session.user, role };
  next();
}
