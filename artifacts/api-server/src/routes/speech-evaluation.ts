import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { db, speechEvaluationsTable } from "@workspace/db";
import { lt } from "drizzle-orm";
import { registerLeadFromForm } from "../lib/leads.js";
import { applyAdHocLimit } from "../middlewares/security.js";

const router: IRouter = Router();

// Zod schema centralises shape + length limits. `whatsapp` and `phone` are
// interchangeable so we accept either. This public request is intentionally
// video-link only; evaluation is performed by the Bikalima team, not AI.
const trimmed = (min: number, max: number) =>
  z.string().transform((s) => s.trim()).pipe(z.string().min(min).max(max));

const SpeechEvaluationSchema = z
  .object({
    fullName: trimmed(2, 120),
    email: trimmed(3, 200).pipe(z.string().email()),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    videoUrl: trimmed(8, 2000),
    speechTopic: z.string().max(200).optional(),
    speechLanguage: z.string().max(50).optional(),
    notes: z.string().max(2000).optional(),
    privacyConsent: z.literal(true),
  })
  .superRefine((data, ctx) => {
    const phone = (data.whatsapp ?? data.phone ?? "").trim();
    if (phone.length < 6 || phone.length > 40) {
      ctx.addIssue({ code: "custom", path: ["whatsapp"], message: "WhatsApp number is required (6-40 chars)" });
    }
    try {
      const u = new URL(data.videoUrl);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        ctx.addIssue({ code: "custom", path: ["videoUrl"], message: "videoUrl must be http(s)" });
      }
    } catch {
      ctx.addIssue({ code: "custom", path: ["videoUrl"], message: "Invalid videoUrl" });
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
  const videoUrlRaw = data.videoUrl;
  const speechTopic = (data.speechTopic ?? "").trim();
  const speechLanguage = (data.speechLanguage ?? "").trim();
  const userNotes = (data.notes ?? "").trim();
  const videoUrl: string | null = videoUrlRaw ? new URL(videoUrlRaw).toString() : null;

  try {
    const userId = req.isAuthenticated() ? (req.user?.id ?? null) : null;
    const combinedNotes = userNotes ? `[Notes]\n${userNotes}` : "";

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
        transcriptText: null,
        leadSource: "home_60sec_evaluation",
        status: "pending",
        privacyConsentAt: new Date(),
        privacyConsentVersion: "speech-review-v1",
        retentionExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60_000),
      })
      .returning({ id: speechEvaluationsTable.id });

    req.log.info({ id: inserted.id }, "speech-evaluation lead created");

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

router.post("/cron/speech-retention", async (req: Request, res: Response) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const expired = await db.update(speechEvaluationsTable).set({
    fullName: "محذوف وفق سياسة الاحتفاظ",
    email: "deleted@privacy.invalid",
    phone: "deleted",
    videoUrl: null,
    audioUrl: null,
    notes: null,
    transcriptText: null,
    trainerFeedback: null,
    rubricScores: null,
    rubricNotes: null,
    finalReportMd: null,
    retentionExpiresAt: null,
    updatedAt: new Date(),
  }).where(lt(speechEvaluationsTable.retentionExpiresAt, new Date())).returning({ id: speechEvaluationsTable.id });
  res.json({ ok: true, anonymized: expired.length });
});

export default router;
