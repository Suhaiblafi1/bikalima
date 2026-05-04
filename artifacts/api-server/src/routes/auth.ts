import { Router, type IRouter, type Request, type Response } from "express";
import nodemailer from "nodemailer";
import { randomBytes } from "node:crypto";
import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { and, eq, gt } from "drizzle-orm";
import {
  clearSession,
  getSessionId,
  createSession,
  hashPassword,
  verifyPassword,
  updateSessionUser,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";
import { authRateLimit, checkFailureBudget, recordFailure } from "../middlewares/security";
import { z } from "zod";

// Centralised request schemas. 400s carry a uniform `{ error, issues }` body.
const RegisterSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(6).max(200),
  firstName: z.string().max(120).optional().nullable(),
  lastName: z.string().max(120).optional().nullable(),
});
const LoginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

// Brief requires "6 failed login attempts per minute → 429 with clear
// Arabic messaging". We track *failed* attempts only via
// checkFailureBudget/recordFailure, so legitimate logins (and the e2e
// suite) never trip the limiter. /api/auth/register stays on a small
// per-attempt cap because register attempts are inherently rare.
const LOGIN_FAIL_MAX = 6;
const LOGIN_FAIL_WINDOW = 60_000;
const registerLimiter = authRateLimit(10, 60_000);

const router: IRouter = Router();

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

function appOrigin(req: Request): string {
  const envDomains = (process.env.REPLIT_DOMAINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (envDomains.length > 0) return `https://${envDomains[0]}`;
  const host = req.get("host") ?? "localhost";
  const proto = (req.get("x-forwarded-proto") ?? req.protocol ?? "https").split(",")[0].trim();
  return `${proto}://${host}`;
}

function generateVerificationToken(): { token: string; expiresAt: Date } {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  return { token, expiresAt };
}

async function sendVerificationEmail(req: Request, email: string, firstName: string | null, token: string) {
  const transporter = buildTransporter();
  if (!transporter) {
    req.log.warn({ email }, "SMTP not configured — verification email not sent");
    return;
  }

  const name = firstName || email.split("@")[0];
  const link = `${appOrigin(req)}/verify-email?token=${encodeURIComponent(token)}`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `"بكلمة – Bikalima" <${process.env.SMTP_USER ?? "info@bikalima.com"}>`,
      to: email,
      subject: "أكّد بريدك الإلكتروني — Verify your Bikalima email",
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #25786A; font-size: 36px; margin: 0;">بكلمة</h1>
          </div>
          <h2 style="color: #333; margin-bottom: 10px;">مرحباً ${name} 👋</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.8;">
            شكراً لإنشائك حساباً في منصة <strong>بكلمة</strong>. لتفعيل حسابك بالكامل، رجاءً اضغط على الزر أدناه لتأكيد بريدك الإلكتروني.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${link}" style="display: inline-block; background: #25786A; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: bold; font-size: 16px;">
              تأكيد البريد الإلكتروني · Verify Email
            </a>
          </div>
          <p style="color: #888; font-size: 13px; line-height: 1.7; text-align: center;">
            أو انسخ هذا الرابط في متصفحك:<br />
            <span dir="ltr" style="word-break: break-all;">${link}</span>
          </p>
          <p style="color: #aaa; font-size: 12px; line-height: 1.6; text-align: center; margin-top: 24px;">
            هذا الرابط صالح لمدة 24 ساعة. إذا لم تنشئ هذا الحساب، يمكنك تجاهل هذه الرسالة.<br />
            This link is valid for 24 hours. If you didn't create an account, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #aaa; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} بكلمة — Bikalima</p>
        </div>
      `,
    });
  } catch (err) {
    req.log.error({ err, email }, "Failed to send verification email");
  }
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

router.get("/auth/user", (req: Request, res: Response) => {
  // Short private cache lets the browser memoize during a single navigation
  // burst without re-hitting the sessions table for every component that
  // reads useAuth(). `Vary: Cookie` keeps cached responses keyed to the
  // session, so a logged-out tab can never see another user's cached
  // identity, and `must-revalidate` forces a 304 round-trip after expiry.
  res.set("Cache-Control", "private, max-age=10, must-revalidate");
  res.set("Vary", "Cookie");
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

// Role-aware "me" endpoint. Returns the same identity as /auth/user but also
// includes the resolved role (admin|trainer|student|sales) so the frontend
// can gate the admin UI by role without parsing it out of /auth/user.
router.get("/me", async (req: Request, res: Response) => {
  // /me carries role + emailVerified — keep authoritative on every read so
  // role changes and sign-out are reflected immediately.
  res.set("Cache-Control", "no-store");
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  // Look up emailVerified directly so it stays current without re-login.
  const [fresh] = await db
    .select({ emailVerified: usersTable.emailVerified })
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id));
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName ?? null,
      lastName: req.user.lastName ?? null,
      profileImageUrl: req.user.profileImageUrl ?? null,
      role: req.user.role ?? "student",
      emailVerified: fresh?.emailVerified ?? false,
    },
  });
});

router.post("/auth/register", registerLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues });
      return;
    }
    const { email, password, firstName, lastName } = parsed.data;

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()));

    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const { token, expiresAt } = generateVerificationToken();

    const [user] = await db
      .insert(usersTable)
      .values({
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        emailVerified: false,
        emailVerificationToken: token,
        emailVerificationExpiresAt: expiresAt,
      })
      .returning();

    const sessionData: SessionData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      },
    };

    const sid = await createSession(sessionData);
    setSessionCookie(res, sid);

    sendVerificationEmail(req, user.email, user.firstName, token);

    res.json({ user: sessionData.user, emailVerified: false });
  } catch (err) {
    req.log.error({ err }, "Registration error");
    res.status(500).json({ error: "Registration failed" });
  }
});

// ── Email verification: confirm token ─────────────────────────────────────
router.post("/auth/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.body ?? {};
    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "Token is required" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.emailVerificationToken, token),
          gt(usersTable.emailVerificationExpiresAt, new Date()),
        ),
      );

    if (!user) {
      res.status(400).json({ error: "Invalid or expired token" });
      return;
    }

    await db
      .update(usersTable)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      })
      .where(eq(usersTable.id, user.id));

    res.json({ ok: true, email: user.email });
  } catch (err) {
    req.log.error({ err }, "Email verification failed");
    res.status(500).json({ error: "Verification failed" });
  }
});

// ── Email verification: resend link to currently logged-in user ──────────
router.post("/auth/resend-verification", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (user.emailVerified) {
      res.json({ ok: true, alreadyVerified: true });
      return;
    }
    const { token, expiresAt } = generateVerificationToken();
    await db
      .update(usersTable)
      .set({ emailVerificationToken: token, emailVerificationExpiresAt: expiresAt })
      .where(eq(usersTable.id, user.id));
    sendVerificationEmail(req, user.email, user.firstName, token);
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Resend verification failed");
    res.status(500).json({ error: "Could not resend verification" });
  }
});

router.post("/auth/login", async (req: Request, res: Response) => {
  // Per-IP failure-only limiter: 6 wrong-password attempts per minute.
  // Successful logins do not consume budget.
  const ip = req.ip ?? "unknown";
  const failKey = `login:${ip}`;
  if (!checkFailureBudget(res, failKey, LOGIN_FAIL_MAX, LOGIN_FAIL_WINDOW)) return;
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues });
      return;
    }
    const { email, password } = parsed.data;

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()));

    if (!user) {
      recordFailure(failKey, LOGIN_FAIL_WINDOW);
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      recordFailure(failKey, LOGIN_FAIL_WINDOW);
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const sessionData: SessionData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      },
    };

    const sid = await createSession(sessionData);
    setSessionCookie(res, sid);
    res.json({ user: sessionData.user });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed" });
  }
});

router.patch("/auth/profile", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : null);
    const firstName = str(body.firstName);
    const lastName = str(body.lastName);
    const phone = str(body.phone);
    const bio = str(body.bio);
    const profileImageUrl = str(body.profileImageUrl);

    if (bio && bio.length > 500) {
      res.status(400).json({ error: "Bio must be 500 characters or less" });
      return;
    }

    const [updated] = await db
      .update(usersTable)
      .set({
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        phone: phone ?? null,
        bio: bio ?? null,
        profileImageUrl: profileImageUrl ?? null,
      })
      .where(eq(usersTable.id, req.user.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Persist updated identity fields into the stored session so subsequent
    // requests (and other tabs) see the new values without requiring re-login.
    const sid = getSessionId(req);
    if (sid) {
      await updateSessionUser(sid, {
        firstName: updated.firstName,
        lastName: updated.lastName,
        profileImageUrl: updated.profileImageUrl,
      });
    }

    res.json({
      user: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        profileImageUrl: updated.profileImageUrl,
        phone: updated.phone,
        bio: updated.bio,
        role: updated.role,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Profile update error");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.post("/auth/change-password", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const { currentPassword, newPassword } = req.body ?? {};
    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      res.status(400).json({ error: "Current and new password are required" });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
    const passwordHash = await hashPassword(newPassword);
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, user.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Password change error");
    res.status(500).json({ error: "Failed to change password" });
  }
});

router.get("/me/profile", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        phone: user.phone,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Profile fetch error");
    res.status(500).json({ error: "Failed to load profile" });
  }
});

router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ success: true });
});

router.get("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.redirect("/");
});

export default router;
