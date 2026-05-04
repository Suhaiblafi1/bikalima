import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "node:crypto";
import { CSRF_COOKIE } from "../middlewares/security.js";

const router: IRouter = Router();

// Returns the CSRF token, issuing a fresh one if the request doesn't yet
// carry the cookie. The middleware also sets a token on every response, but
// hitting this endpoint lets the SPA force-prime the cookie on app boot.
router.get("/csrf", (req: Request, res: Response) => {
  res.set("Cache-Control", "no-store");
  let token = (req.cookies?.[CSRF_COOKIE] as string | undefined) ?? "";
  if (!token || token.length < 32) {
    token = crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
  res.json({ token });
});

export default router;
