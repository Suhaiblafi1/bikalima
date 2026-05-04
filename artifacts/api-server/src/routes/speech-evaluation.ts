import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { db, speechEvaluationsTable } from "@workspace/db";
import { eq, or, desc, sql } from "drizzle-orm";
import { registerLeadFromForm } from "../lib/leads.js";
import { awardBadgeIfEligible } from "../lib/platform.js";
import { applyAdHocLimit } from "../middlewares/security.js";

const router: IRouter = Router();

// Zod schema centralises shape + length limits. `whatsapp` and `phone` are
// interchangeable so we accept either; `speechText` OR `videoUrl` is
// required (refined below). Values are trimmed by .transform.
const trimmed = (min: number, max: number) =>
  z.string().transform((s) => s.trim()).pipe(z.string().min(min).max(max));

const SpeechEvaluationSchema = z
  .object({
    fullName: trimmed(2, 120),
    email: trimmed(3, 200).pipe(z.string().email()),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    speechText: z.string().max(5000).optional(),
    videoUrl: z.string().max(2000).optional(),
    speechTopic: z.string().max(200).optional(),
    speechLanguage: z.string().max(50).optional(),
    notes: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    const phone = (data.whatsapp ?? data.phone ?? "").trim();
    if (phone.length < 6 || phone.length > 40) {
      ctx.addIssue({ code: "custom", path: ["whatsapp"], message: "WhatsApp number is required (6-40 chars)" });
    }
    const hasText = (data.speechText ?? "").trim().length > 0;
    const hasUrl = (data.videoUrl ?? "").trim().length > 0;
    if (!hasText && !hasUrl) {
      ctx.addIssue({ code: "custom", path: ["speechText"], message: "Provide either speechText or videoUrl" });
    }
    if (hasUrl) {
      try {
        const u = new URL(data.videoUrl!.trim());
        if (u.protocol !== "http:" && u.protocol !== "https:") {
          ctx.addIssue({ code: "custom", path: ["videoUrl"], message: "videoUrl must be http(s)" });
        }
      } catch {
        ctx.addIssue({ code: "custom", path: ["videoUrl"], message: "Invalid videoUrl" });
      }
    }
  });

router.post("/speech-evaluation", async (req: Request, res: Response) => {
  // Use req.ip — populated by Express via `app.set("trust proxy", 1)` so it
  // is the client IP after the trusted Replit edge proxy, not the
  // spoofable raw x-forwarded-for header. applyAdHocLimit emits the
  // Retry-After header on 429 for us.
  const clientIp = req.ip ?? "unknown";
  if (!applyAdHocLimit(res, `speech-eval:${clientIp}`, 5, 60 * 60 * 1000)) return;

  const parsed = SpeechEvaluationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues });
    return;
  }
  const data = parsed.data;
  const fullName = data.fullName;
  const email = data.email;
  const phone = (data.whatsapp ?? data.phone ?? "").trim();
  const speechText = (data.speechText ?? "").trim();
  const videoUrlRaw = (data.videoUrl ?? "").trim();
  const speechTopic = (data.speechTopic ?? "").trim();
  const speechLanguage = (data.speechLanguage ?? "").trim();
  const userNotes = (data.notes ?? "").trim();
  const videoUrl: string | null = videoUrlRaw ? new URL(videoUrlRaw).toString() : null;

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
