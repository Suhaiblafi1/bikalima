import { clearSession, getSessionId, getSession } from "../lib/auth.js";

export async function authMiddleware(req, res, next) {
  req.isAuthenticated = function () {
    return this.user != null;
  };

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

  req.user = session.user;
  next();
}
