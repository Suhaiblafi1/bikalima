import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import nodemailer from "nodemailer";
import crypto from "crypto";
import {
  db,
  chatThreadsTable,
  chatMessagesTable,
  type ChatThread,
} from "@workspace/db";
import { requireRole } from "../lib/admin";
import {
  sendWhatsAppText,
  isWhatsAppConfigured,
  getTeamWhatsAppNumber,
} from "../lib/whatsapp";

const router: IRouter = Router();

// ── Config ─────────────────────────────────────────────────────────────
const TEAM_NOTIFICATION_EMAIL =
  process.env.CHAT_TEAM_EMAIL ?? "info@bikalima.com";
const FROM_ADDRESS =
  process.env.SMTP_FROM ??
  `"بكلمة – Bikalima" <${process.env.SMTP_USER ?? "info@bikalima.com"}>`;

// ── Rate limiting (in-memory, bounded + GC'd) ─────────────────────────
// Bounded so an attacker can't grow these maps without limit. Eviction
// happens lazily at write-time when we exceed MAX_KEYS or when a key is
// already expired.
const NEW_THREAD_MAX = 5;
const NEW_THREAD_WINDOW = 10 * 60 * 1000; // 5 new threads per 10 minutes / IP
const MESSAGE_MAX = 30;
const MESSAGE_WINDOW = 60 * 1000; // 30 messages per minute / thread
const RATE_MAX_KEYS = 5000;

const newThreadRateLimit = new Map<string, { count: number; resetAt: number }>();
const messageRateLimit = new Map<string, { count: number; resetAt: number }>();

function gcRateMap(map: Map<string, { count: number; resetAt: number }>) {
  const now = Date.now();
  for (const [k, v] of map) {
    if (v.resetAt < now) map.delete(k);
  }
  // If still over the cap (active flood), drop oldest insertion-order keys.
  while (map.size > RATE_MAX_KEYS) {
    const first = map.keys().next().value;
    if (first === undefined) break;
    map.delete(first);
  }
}

function bumpRate(
  map: Map<string, { count: number; resetAt: number }>,
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry || entry.resetAt < now) {
    if (map.size >= RATE_MAX_KEYS) gcRateMap(map);
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// Use Express's `req.ip`, which respects `trust proxy` (set to 1 in app.ts).
// Never read X-Forwarded-For directly — it's spoofable.
function clientIp(req: Request): string {
  return req.ip ?? "unknown";
}

function isAdminOrSales(req: Request, res: Response): boolean {
  return requireRole(req, res, "sales");
}

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function publicThread(t: ChatThread) {
  return {
    id: t.id,
    visitorName: t.visitorName,
    visitorWhatsapp: t.visitorWhatsapp,
    lang: t.lang,
    status: t.status,
    lastMessageAt: t.lastMessageAt,
    createdAt: t.createdAt,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────
async function notifyTeamByEmail(opts: {
  thread: ChatThread;
  body: string;
}): Promise<void> {
  const transporter = buildTransporter();
  if (!transporter) return;
  const { thread, body } = opts;
  const html = `
    <div style="font-family: -apple-system, Segoe UI, sans-serif; direction: rtl; text-align: right; max-width: 560px;">
      <h2 style="margin:0 0 8px;color:#0f172a;">رسالة جديدة في الشات المباشر</h2>
      <p style="margin:0 0 12px;color:#475569;">من: <b>${esc(thread.visitorName)}</b>${
        thread.visitorWhatsapp ? ` — واتساب: ${esc(thread.visitorWhatsapp)}` : ""
      }</p>
      <div style="border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;padding:14px 16px;color:#0f172a;line-height:1.6;white-space:pre-wrap;">
        ${esc(body)}
      </div>
      <p style="margin:18px 0 0;color:#64748b;font-size:13px;">
        افتح لوحة الإدارة للرد المباشر:
        <a href="https://bikalima.com/admin/chat" style="color:#0f766e;font-weight:600;">/admin/chat</a>
      </p>
    </div>
  `;
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: TEAM_NOTIFICATION_EMAIL,
      subject: `شات مباشر: ${thread.visitorName}`,
      html,
      replyTo: thread.visitorEmail ?? undefined,
    });
  } catch (err) {
    // Best effort only.
    console.warn("[chat] team notification email failed", err);
  }
}

async function pingTeamWhatsApp(thread: ChatThread, body: string): Promise<void> {
  if (!isWhatsAppConfigured()) return;
  const teamNumber = getTeamWhatsAppNumber();
  if (!teamNumber) return;
  const preface =
    thread.lang === "en"
      ? `New live-chat message from ${thread.visitorName}:\n\n`
      : `رسالة جديدة من ${thread.visitorName} في الشات المباشر:\n\n`;
  await sendWhatsAppText(teamNumber, preface + body);
}

function ensureToken(req: Request, threadToken: string): boolean {
  const provided =
    (req.headers["x-chat-token"] as string | undefined) ??
    (req.query.token as string | undefined);
  if (!provided) return false;
  // constant-time compare
  const a = Buffer.from(provided);
  const b = Buffer.from(threadToken);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ── Visitor: create thread ─────────────────────────────────────────────
router.post("/chat/threads", async (req: Request, res: Response) => {
  const ip = clientIp(req);
  if (!bumpRate(newThreadRateLimit, ip, NEW_THREAD_MAX, NEW_THREAD_WINDOW)) {
    return res
      .status(429)
      .json({ error: "too_many_requests", retryAfter: NEW_THREAD_WINDOW });
  }

  const body = req.body as {
    name?: string;
    whatsapp?: string;
    email?: string;
    message?: string;
    lang?: "ar" | "en";
    pageUrl?: string;
  };

  const name = (body.name ?? "").trim();
  const message = (body.message ?? "").trim();
  const whatsapp = (body.whatsapp ?? "").replace(/\D/g, "").slice(0, 20) || null;
  const email = (body.email ?? "").trim().slice(0, 200) || null;
  const lang: "ar" | "en" = body.lang === "en" ? "en" : "ar";

  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ error: "invalid_name" });
  }
  if (message.length < 1 || message.length > 2000) {
    return res.status(400).json({ error: "invalid_message" });
  }

  const token = crypto.randomBytes(24).toString("hex");

  try {
    const [thread] = await db
      .insert(chatThreadsTable)
      .values({
        token,
        visitorName: name,
        visitorWhatsapp: whatsapp,
        visitorEmail: email,
        lang,
        pageUrl: (body.pageUrl ?? "").slice(0, 500) || null,
        userAgent: (req.headers["user-agent"] ?? "").toString().slice(0, 300),
        unreadForAdmin: 1,
      })
      .returning();

    await db.insert(chatMessagesTable).values({
      threadId: thread.id,
      sender: "visitor",
      body: message,
      channel: "web",
    });

    // Best-effort notifications — do not block response
    notifyTeamByEmail({ thread, body: message }).catch(() => {});
    pingTeamWhatsApp(thread, message).catch(() => {});

    res.json({ threadId: thread.id, token, thread: publicThread(thread) });
  } catch (err) {
    req.log.error({ err }, "[chat] failed to create thread");
    res.status(500).json({ error: "server_error" });
  }
});

// ── Visitor: post a follow-up message ──────────────────────────────────
router.post(
  "/chat/threads/:id/messages",
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const body = (req.body?.body ?? "").toString().trim();
    if (body.length < 1 || body.length > 2000) {
      return res.status(400).json({ error: "invalid_body" });
    }

    try {
      const [thread] = await db
        .select()
        .from(chatThreadsTable)
        .where(eq(chatThreadsTable.id, id))
        .limit(1);
      if (!thread) return res.status(404).json({ error: "not_found" });
      if (!ensureToken(req, thread.token)) {
        return res.status(401).json({ error: "unauthorized" });
      }
      if (thread.status === "closed") {
        return res.status(409).json({ error: "thread_closed" });
      }
      // Rate-limit only AFTER auth so random IDs cannot grow the map.
      if (!bumpRate(messageRateLimit, id, MESSAGE_MAX, MESSAGE_WINDOW)) {
        return res.status(429).json({ error: "too_many_requests" });
      }

      const [msg] = await db
        .insert(chatMessagesTable)
        .values({
          threadId: id,
          sender: "visitor",
          body,
          channel: "web",
        })
        .returning();

      await db
        .update(chatThreadsTable)
        .set({
          lastMessageAt: new Date(),
          unreadForAdmin: sql`${chatThreadsTable.unreadForAdmin} + 1`,
        })
        .where(eq(chatThreadsTable.id, id));

      notifyTeamByEmail({ thread, body }).catch(() => {});
      pingTeamWhatsApp(thread, body).catch(() => {});

      res.json({ message: msg });
    } catch (err) {
      req.log.error({ err }, "[chat] failed to add visitor message");
      res.status(500).json({ error: "server_error" });
    }
  },
);

// ── Visitor: poll thread + new messages ────────────────────────────────
router.get("/chat/threads/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const [thread] = await db
      .select()
      .from(chatThreadsTable)
      .where(eq(chatThreadsTable.id, id))
      .limit(1);
    if (!thread) return res.status(404).json({ error: "not_found" });
    if (!ensureToken(req, thread.token)) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const sinceParam = req.query.since;
    const sinceDate =
      typeof sinceParam === "string" && sinceParam
        ? new Date(sinceParam)
        : null;

    const where = sinceDate && !Number.isNaN(sinceDate.valueOf())
      ? and(
          eq(chatMessagesTable.threadId, id),
          gt(chatMessagesTable.createdAt, sinceDate),
        )
      : eq(chatMessagesTable.threadId, id);

    const messages = await db
      .select({
        id: chatMessagesTable.id,
        sender: chatMessagesTable.sender,
        body: chatMessagesTable.body,
        channel: chatMessagesTable.channel,
        createdAt: chatMessagesTable.createdAt,
      })
      .from(chatMessagesTable)
      .where(where)
      .orderBy(asc(chatMessagesTable.createdAt));

    // mark visitor-side as read (zero out unreadForVisitor on full fetch)
    if (!sinceDate && thread.unreadForVisitor > 0) {
      await db
        .update(chatThreadsTable)
        .set({ unreadForVisitor: 0 })
        .where(eq(chatThreadsTable.id, id));
    }

    res.set("Cache-Control", "no-store");
    res.json({ thread: publicThread(thread), messages });
  } catch (err) {
    req.log.error({ err }, "[chat] failed to fetch thread");
    res.status(500).json({ error: "server_error" });
  }
});

// ── Admin: list threads ────────────────────────────────────────────────
router.get("/admin/chat/threads", async (req: Request, res: Response) => {
  if (!isAdminOrSales(req, res)) return;
  const status = (req.query.status as string | undefined) ?? "all";
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  try {
    const where =
      status === "open" || status === "closed"
        ? eq(chatThreadsTable.status, status)
        : undefined;

    const rows = await db
      .select()
      .from(chatThreadsTable)
      .where(where as any)
      .orderBy(desc(chatThreadsTable.lastMessageAt))
      .limit(limit);

    res.set("Cache-Control", "no-store");
    res.json({
      threads: rows.map((t) => ({
        id: t.id,
        visitorName: t.visitorName,
        visitorWhatsapp: t.visitorWhatsapp,
        visitorEmail: t.visitorEmail,
        lang: t.lang,
        status: t.status,
        unreadForAdmin: t.unreadForAdmin,
        pageUrl: t.pageUrl,
        lastMessageAt: t.lastMessageAt,
        createdAt: t.createdAt,
      })),
      whatsappConfigured: isWhatsAppConfigured(),
    });
  } catch (err) {
    req.log.error({ err }, "[chat] admin list failed");
    res.status(500).json({ error: "server_error" });
  }
});

// ── Admin: get thread + all messages ───────────────────────────────────
router.get("/admin/chat/threads/:id", async (req: Request, res: Response) => {
  if (!isAdminOrSales(req, res)) return;
  const id = req.params.id;
  try {
    const [thread] = await db
      .select()
      .from(chatThreadsTable)
      .where(eq(chatThreadsTable.id, id))
      .limit(1);
    if (!thread) return res.status(404).json({ error: "not_found" });

    const messages = await db
      .select({
        id: chatMessagesTable.id,
        sender: chatMessagesTable.sender,
        body: chatMessagesTable.body,
        channel: chatMessagesTable.channel,
        createdAt: chatMessagesTable.createdAt,
      })
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.threadId, id))
      .orderBy(asc(chatMessagesTable.createdAt));

    if (thread.unreadForAdmin > 0) {
      await db
        .update(chatThreadsTable)
        .set({ unreadForAdmin: 0 })
        .where(eq(chatThreadsTable.id, id));
    }

    res.set("Cache-Control", "no-store");
    res.json({
      thread: {
        id: thread.id,
        visitorName: thread.visitorName,
        visitorWhatsapp: thread.visitorWhatsapp,
        visitorEmail: thread.visitorEmail,
        lang: thread.lang,
        status: thread.status,
        pageUrl: thread.pageUrl,
        userAgent: thread.userAgent,
        lastMessageAt: thread.lastMessageAt,
        createdAt: thread.createdAt,
      },
      messages,
    });
  } catch (err) {
    req.log.error({ err }, "[chat] admin fetch failed");
    res.status(500).json({ error: "server_error" });
  }
});

// ── Admin: reply ───────────────────────────────────────────────────────
router.post(
  "/admin/chat/threads/:id/messages",
  async (req: Request, res: Response) => {
    if (!isAdminOrSales(req, res)) return;
    const id = req.params.id;
    const body = (req.body?.body ?? "").toString().trim();
    if (body.length < 1 || body.length > 2000) {
      return res.status(400).json({ error: "invalid_body" });
    }
    try {
      const [thread] = await db
        .select()
        .from(chatThreadsTable)
        .where(eq(chatThreadsTable.id, id))
        .limit(1);
      if (!thread) return res.status(404).json({ error: "not_found" });

      const [msg] = await db
        .insert(chatMessagesTable)
        .values({
          threadId: id,
          sender: "team",
          body,
          channel: "web",
        })
        .returning();

      await db
        .update(chatThreadsTable)
        .set({
          lastMessageAt: new Date(),
          unreadForVisitor: sql`${chatThreadsTable.unreadForVisitor} + 1`,
          status: "open",
        })
        .where(eq(chatThreadsTable.id, id));

      // Optional WhatsApp delivery to visitor
      let whatsappStatus: { ok: boolean; error?: string } | null = null;
      if (isWhatsAppConfigured() && thread.visitorWhatsapp) {
        whatsappStatus = await sendWhatsAppText(thread.visitorWhatsapp, body);
      }

      res.json({ message: msg, whatsapp: whatsappStatus });
    } catch (err) {
      req.log.error({ err }, "[chat] admin reply failed");
      res.status(500).json({ error: "server_error" });
    }
  },
);

// ── Admin: close / reopen thread ───────────────────────────────────────
router.patch("/admin/chat/threads/:id", async (req: Request, res: Response) => {
  if (!isAdminOrSales(req, res)) return;
  const id = req.params.id;
  const status = req.body?.status;
  if (status !== "open" && status !== "closed") {
    return res.status(400).json({ error: "invalid_status" });
  }
  try {
    const [updated] = await db
      .update(chatThreadsTable)
      .set({ status })
      .where(eq(chatThreadsTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "not_found" });
    res.json({ thread: publicThread(updated) });
  } catch (err) {
    req.log.error({ err }, "[chat] admin status update failed");
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
