import { Router, type IRouter, type Request, type Response } from "express";
import { db, speechEvaluationsTable } from "@workspace/db";

const router: IRouter = Router();

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/speech-evaluation", async (req: Request, res: Response) => {
  const clientIp = (
    (req.headers["x-forwarded-for"] as string) ||
    req.socket?.remoteAddress ||
    "unknown"
  )
    .split(",")[0]
    .trim();
  if (!checkRateLimit(clientIp)) {
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return;
  }

  const body = (req.body ?? {}) as {
    fullName?: unknown;
    email?: unknown;
    phone?: unknown;
    whatsapp?: unknown;
    speechText?: unknown;
    videoUrl?: unknown;
    speechTopic?: unknown;
    speechLanguage?: unknown;
    notes?: unknown;
  };

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phoneRaw =
    typeof body.whatsapp === "string"
      ? body.whatsapp
      : typeof body.phone === "string"
        ? body.phone
        : "";
  const phone = phoneRaw.trim();
  const speechText = typeof body.speechText === "string" ? body.speechText.trim() : "";
  const videoUrlRaw = typeof body.videoUrl === "string" ? body.videoUrl.trim() : "";
  const speechTopic = typeof body.speechTopic === "string" ? body.speechTopic.trim() : "";
  const speechLanguage = typeof body.speechLanguage === "string" ? body.speechLanguage.trim() : "";
  const userNotes = typeof body.notes === "string" ? body.notes.trim() : "";

  if (!fullName || fullName.length < 2 || fullName.length > 120) {
    res.status(400).json({ error: "fullName is required (2-120 chars)" });
    return;
  }
  if (!email || !EMAIL_RX.test(email)) {
    res.status(400).json({ error: "valid email is required" });
    return;
  }
  if (!phone || phone.length < 6 || phone.length > 40) {
    res.status(400).json({ error: "WhatsApp number is required" });
    return;
  }
  if (!speechText && !videoUrlRaw) {
    res.status(400).json({ error: "Provide either speechText or videoUrl" });
    return;
  }
  if (speechText && speechText.length > 5000) {
    res.status(400).json({ error: "speechText too long (max 5000 chars)" });
    return;
  }

  let videoUrl: string | null = null;
  if (videoUrlRaw) {
    try {
      const u = new URL(videoUrlRaw);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        res.status(400).json({ error: "videoUrl must be http(s)" });
        return;
      }
      videoUrl = u.toString();
    } catch {
      res.status(400).json({ error: "Invalid videoUrl" });
      return;
    }
  }

  try {
    const userId = req.isAuthenticated() ? (req.user?.id ?? null) : null;
    const combinedNotes = [
      speechText ? `[Speech text]\n${speechText}` : "",
      userNotes ? `[Notes]\n${userNotes}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const [inserted] = await db
      .insert(speechEvaluationsTable)
      .values({
        userId,
        fullName,
        email,
        phone,
        videoUrl,
        speechTopic: speechTopic || null,
        speechLanguage: speechLanguage || null,
        notes: combinedNotes || null,
        transcriptText: speechText || null,
        leadSource: "home_60sec_evaluation",
        status: "pending",
      })
      .returning({ id: speechEvaluationsTable.id });

    req.log.info({ id: inserted.id, email }, "speech-evaluation lead created");
    res.json({ ok: true, id: inserted.id });
  } catch (err) {
    req.log.error({ err }, "Failed to create speech evaluation");
    res.status(500).json({ error: "Failed to submit evaluation request" });
  }
});

export default router;
