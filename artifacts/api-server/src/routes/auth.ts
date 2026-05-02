import { Router, type IRouter, type Request, type Response } from "express";
import nodemailer from "nodemailer";
import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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

const router: IRouter = Router();

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

async function sendWelcomeEmail(email: string, firstName: string | null) {
  const transporter = buildTransporter();
  if (!transporter) return;

  const name = firstName || email.split("@")[0];

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "مرحباً بك في بكلمة — Welcome to Bikalima",
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #25786A; font-size: 36px; margin: 0;">بكلمة</h1>
          </div>
          <h2 style="color: #333; margin-bottom: 10px;">مرحباً ${name}! 👋</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.8;">
            شكراً لتسجيلك في منصة <strong>بكلمة</strong>. حسابك جاهز الآن!
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.8;">
            يمكنك الآن تصفح برامجنا التدريبية والتسجيل فيها، وطلب الكراسات التدريبية، ومتابعة جدولك الزمني من لوحة التحكم الخاصة بك.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #999; font-size: 14px;">للتواصل المباشر عبر واتساب: <a href="https://wa.me/97455377065" style="color: #25786A;">+974 5537 7065</a></p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #aaa; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} بكلمة — Bikalima</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.set("Cache-Control", "no-store");
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

// Role-aware "me" endpoint. Returns the same identity as /auth/user but also
// includes the resolved role (admin|trainer|student|sales) so the frontend
// can gate the admin UI by role without parsing it out of /auth/user.
router.get("/me", (req: Request, res: Response) => {
  res.set("Cache-Control", "no-store");
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName ?? null,
      lastName: req.user.lastName ?? null,
      profileImageUrl: req.user.profileImageUrl ?? null,
      role: req.user.role ?? "student",
    },
  });
});

router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()));

    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(usersTable)
      .values({
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
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

    sendWelcomeEmail(user.email, user.firstName);

    res.json({ user: sessionData.user });
  } catch (err) {
    req.log.error({ err }, "Registration error");
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()));

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
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
