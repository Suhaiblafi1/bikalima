import { Router, type IRouter, type Request, type Response } from "express";
import { db, speechEvaluationsTable } from "@workspace/db";
import { eq, or, desc, sql } from "drizzle-orm";
import { registerLeadFromForm } from "../lib/leads.js";
import { awardBadgeIfEligible } from "../lib/platform.js";

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

    // ── Badge: first speech uploaded (only when learner is signed in) ─────
    if (userId) {
      try {
        await awardBadgeIfEligible(userId, "speech_submitted", { evaluationId: inserted.id });
      } catch (err) {
        req.log.warn({ err }, "[BADGE] speech_submitted award failed");
      }
    }

    // ── CRM: register/upsert as a lead ──────────────────────────────
    try {
      await registerLeadFromForm({
        contact: {
          fullName,
          phone: phone || null,
          email: email || null,
          source: "speech_evaluation",
        },
        activity: {
          type: "linked_speech_evaluation",
          summaryAr: `قدّم تقييم خطاب جديد${speechTopic ? ` — موضوع: ${speechTopic}` : ""}`,
          relatedEntityType: "speech_evaluation",
          relatedEntityId: inserted.id,
        },
        trigger: "speech_evaluation.created",
        triggerPayload: { speechTopic, speechLanguage },
      });
    } catch (err) {
      req.log.warn({ err }, "[CRM] speech_evaluation lead upsert failed");
    }

    res.json({ ok: true, id: inserted.id });
  } catch (err) {
    req.log.error({ err }, "Failed to create speech evaluation");
    res.status(500).json({ error: "Failed to submit evaluation request" });
  }
});

// ── Learner-facing list of own evaluations ─────────────────────────────
// Matches by user_id when present, plus by case-insensitive email so that
// evaluations submitted as a guest (before the learner created an account
// or while logged out) still surface in their dashboard once they sign in.
router.get("/me/speech-evaluations", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const userId = req.user.id;
    const userEmail = (req.user.email ?? "").toLowerCase().trim();
    const rows = await db
      .select({
        id: speechEvaluationsTable.id,
        status: speechEvaluationsTable.status,
        speechTopic: speechEvaluationsTable.speechTopic,
        videoUrl: speechEvaluationsTable.videoUrl,
        transcriptText: speechEvaluationsTable.transcriptText,
        rubricScores: speechEvaluationsTable.rubricScores,
        rubricNotes: speechEvaluationsTable.rubricNotes,
        overallScore: speechEvaluationsTable.overallScore,
        programRecommendation: speechEvaluationsTable.programRecommendation,
        finalReportMd: speechEvaluationsTable.finalReportMd,
        reportPublishedAt: speechEvaluationsTable.reportPublishedAt,
        createdAt: speechEvaluationsTable.createdAt,
        updatedAt: speechEvaluationsTable.updatedAt,
      })
      .from(speechEvaluationsTable)
      .where(
        userEmail
          ? or(
              eq(speechEvaluationsTable.userId, userId),
              sql`lower(${speechEvaluationsTable.email}) = ${userEmail}`,
            )
          : eq(speechEvaluationsTable.userId, userId),
      )
      .orderBy(desc(speechEvaluationsTable.createdAt));
    // Hide draft evaluator content until the trainer publishes the report.
    // Pre-publish, only safe summary fields (status, topic, raw inputs) are
    // returned. `trainerFeedback` is internal and never exposed to learners.
    const sanitized = rows.map((r) => {
      const isPublished = !!r.reportPublishedAt;
      return {
        id: r.id,
        status: r.status,
        speechTopic: r.speechTopic,
        videoUrl: r.videoUrl,
        transcriptText: r.transcriptText,
        rubricScores: isPublished ? r.rubricScores : null,
        rubricNotes: isPublished ? r.rubricNotes : null,
        overallScore: isPublished ? r.overallScore : null,
        programRecommendation: isPublished ? r.programRecommendation : null,
        finalReportMd: isPublished ? r.finalReportMd : null,
        reportPublishedAt: r.reportPublishedAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });
    res.json({ evaluations: sanitized });
  } catch (err) {
    req.log.error({ err }, "Failed to load my speech evaluations");
    res.status(500).json({ error: "Failed to load evaluations" });
  }
});

export default router;
