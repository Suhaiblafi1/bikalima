/**
 * Admin-only short-video generation (MiniMax H3), behind the
 * `video_generation` feature flag.
 *
 * Two gates stand in front of every call that can spend money, and both
 * have to be open: the flag (a person switched it on in the admin panel)
 * and `MINIMAX_API_KEY` (an operator put a key in the environment). Either
 * one shut answers 503 with a `reason` the admin panel can act on, rather
 * than a generic failure that reads like a bug.
 *
 * Generation is asynchronous and billed per output second, so the local row
 * is written *before* the provider is called: a job we paid for must never
 * be able to exist without a record of it. Results are picked up either by
 * an admin opening the job (reconcile-on-read) or by the cron endpoint at
 * the bottom, so nothing is stranded when nobody is looking.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { and, desc, eq, inArray, isNotNull, lt } from "drizzle-orm";
import { db, usersTable, videoGenerationJobsTable, type VideoGenerationJob } from "@workspace/db";
import { requireAdmin } from "../lib/admin.js";
import { isFeatureEnabled, recordAuditLog } from "../lib/platform.js";
import { applyAdHocLimit } from "../middlewares/security.js";
import {
  MAX_DURATION_SECONDS,
  MAX_PROMPT_LENGTH,
  MIN_DURATION_SECONDS,
  VIDEO_RATIOS,
  VIDEO_RESOLUTIONS,
  videoGenService,
  type VideoCondition,
  type VideoTaskStatus,
} from "../integrations/videoGenService.js";

const router: IRouter = Router();

const FLAG_KEY = "video_generation";
const TERMINAL_STATUSES: VideoTaskStatus[] = ["succeeded", "failed", "cancelled"];

/**
 * How long a job may sit unfinished before we stop believing in it. The
 * provider only answers queries about tasks from the last 7 days, so a row
 * left open indefinitely becomes permanently unknowable; a day is far longer
 * than any 15-second render legitimately takes.
 */
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

function isTerminal(status: string): boolean {
  return (TERMINAL_STATUSES as string[]).includes(status);
}

/**
 * Admin, then flag. Authorization comes first so that a non-admin probe
 * learns nothing about which features this deployment has switched on.
 */
async function gate(req: Request, res: Response): Promise<boolean> {
  if (!requireAdmin(req, res)) return false;
  // Fails closed: if the flag row is missing or the lookup itself fails, a
  // billed provider call is not the safe assumption.
  if (!(await isFeatureEnabled(FLAG_KEY, { whenMissing: false }))) {
    res.status(503).json({
      error: "توليد الفيديو معطّل. فعّله من مفاتيح الميزات في لوحة الإدارة.",
      reason: "feature_disabled",
      flag: FLAG_KEY,
    });
    return false;
  }
  return true;
}

const ConditionSchema = z.object({
  type: z.enum(["image_url", "video_url", "audio_url"]),
  url: z.string().transform((s) => s.trim()).pipe(z.string().min(8).max(2000)),
  role: z
    .enum(["first_frame", "last_frame", "reference_image", "reference_video", "reference_audio"])
    .optional(),
});

const CreateJobSchema = z.object({
  prompt: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(8).max(MAX_PROMPT_LENGTH)),
  duration: z.number().int().min(MIN_DURATION_SECONDS).max(MAX_DURATION_SECONDS).default(10),
  ratio: z.enum(VIDEO_RATIOS).default("16:9"),
  resolution: z.enum(VIDEO_RESOLUTIONS).default("768P"),
  purpose: z.string().transform((s) => s.trim()).pipe(z.string().max(40)).optional(),
  conditions: z.array(ConditionSchema).max(12).default([]),
});

const ROLES_BY_TYPE: Record<VideoCondition["type"], string[]> = {
  image_url: ["first_frame", "last_frame", "reference_image"],
  video_url: ["reference_video"],
  audio_url: ["reference_audio"],
};

/**
 * The provider's input limits, checked here rather than paid for upstream.
 * A rejected request costs nothing, but its error arrives as an opaque 400,
 * and an admin staring at "invalid params" has no way to know which of the
 * twelve files was the problem.
 */
function conditionsProblem(conditions: VideoCondition[]): string | null {
  const counts = { image_url: 0, video_url: 0, audio_url: 0 };
  const roles: string[] = [];

  for (const condition of conditions) {
    counts[condition.type] += 1;
    let url: URL;
    try {
      url = new URL(condition.url);
    } catch {
      return "أحد روابط المرفقات غير صالح. الصق رابطاً كاملاً.";
    }
    // The provider fetches these itself, so they must be publicly reachable
    // over TLS — a local path or an http link fails inside their pipeline,
    // where the reason never reaches us.
    if (url.protocol !== "https:") {
      return "روابط المرفقات يجب أن تكون https ومتاحة للعموم حتى يتمكن المزوّد من قراءتها.";
    }
    if (condition.role) {
      if (!ROLES_BY_TYPE[condition.type].includes(condition.role)) {
        return `الدور "${condition.role}" لا يناسب نوع المرفق "${condition.type}".`;
      }
      roles.push(condition.role);
    }
  }

  if (counts.image_url > 9) return "الحد الأقصى 9 صور مرجعية.";
  if (counts.video_url > 3) return "الحد الأقصى 3 مقاطع فيديو مرجعية.";
  if (counts.audio_url > 3) return "الحد الأقصى 3 مقاطع صوتية مرجعية.";
  // Audio alone has no scene to attach a voice to; the provider refuses it.
  if (counts.audio_url > 0 && counts.image_url === 0 && counts.video_url === 0) {
    return "المرفق الصوتي يحتاج صورة أو فيديو معه، ولا يصلح وحده.";
  }
  for (const role of ["first_frame", "last_frame"]) {
    if (roles.filter((r) => r === role).length > 1) {
      return `لا يمكن تحديد أكثر من مرفق واحد بدور "${role}".`;
    }
  }
  return null;
}

/** Turn a provider failure into the clearest thing we can tell an admin. */
function describeFailure(failure: { status?: number; code?: string; message: string }): {
  httpStatus: number;
  error: string;
} {
  switch (failure.status) {
    case 400:
      return { httpStatus: 400, error: `المزوّد رفض الطلب: ${failure.message}` };
    case 401:
    case 403:
      return { httpStatus: 502, error: "مفتاح MINIMAX_API_KEY مرفوض من المزوّد. راجع المفتاح." };
    case 402:
      return { httpStatus: 402, error: "رصيد حساب المزوّد لا يكفي لتوليد هذا المقطع." };
    case 422:
      return { httpStatus: 422, error: "مرشّح المحتوى عند المزوّد رفض النص أو المرفقات. عدّل الوصف." };
    case 429:
      return { httpStatus: 429, error: "المزوّد يرفض الطلبات مؤقتاً لكثرتها. أعد المحاولة بعد قليل." };
    default:
      if (failure.message === "upstream_unreachable") {
        return { httpStatus: 504, error: "تعذّر الوصول إلى المزوّد. أعد المحاولة." };
      }
      return { httpStatus: 502, error: "تعذّر بدء التوليد عند المزوّد. حاول مرة أخرى." };
  }
}

/**
 * Ask the provider where an unfinished job got to and write down the answer.
 * A transport failure leaves the row untouched — "we could not ask" is not
 * the same as "it failed", and the next poll costs nothing.
 */
async function reconcile(job: VideoGenerationJob): Promise<VideoGenerationJob> {
  if (!job.externalTaskId || isTerminal(job.status)) return job;

  const result = await videoGenService.queryTask(job.externalTaskId);
  if (!result.ok) return job;

  const now = new Date();
  const [updated] = await db
    .update(videoGenerationJobsTable)
    .set({
      status: result.status,
      videoUrl: result.videoUrl ?? job.videoUrl,
      usage: result.usage ?? job.usage,
      errorMessage:
        result.errorMessage
        ?? (result.status === "failed" ? "فشل التوليد عند المزوّد دون تفصيل." : job.errorMessage),
      updatedAt: now,
      completedAt: isTerminal(result.status) ? (job.completedAt ?? now) : null,
    })
    .where(eq(videoGenerationJobsTable.id, job.id))
    .returning();
  return updated ?? job;
}

// ── Configuration state, readable even when the feature is off ──────────
// Deliberately not behind `gate`: an admin looking at a disabled feature
// needs to be told which of the two switches is the one still closed.
router.get("/admin/video-generation/status", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const status = videoGenService.getStatus();
  res.json({
    flag: FLAG_KEY,
    flagEnabled: await isFeatureEnabled(FLAG_KEY, { whenMissing: false }),
    configured: status.enabled,
    missingEnvVars: status.missingEnvVars,
    model: videoGenService.modelName(),
    limits: {
      minDuration: MIN_DURATION_SECONDS,
      maxDuration: MAX_DURATION_SECONDS,
      maxPromptLength: MAX_PROMPT_LENGTH,
      resolutions: VIDEO_RESOLUTIONS,
      ratios: VIDEO_RATIOS,
    },
  });
});

// ── Start a job ─────────────────────────────────────────────────────────
router.post("/admin/video-generation/jobs", async (req: Request, res: Response) => {
  if (!(await gate(req, res))) return;

  const parsed = CreateJobSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "تحقّق من بيانات الطلب.", issues: parsed.error.issues });
    return;
  }
  const { prompt, duration, ratio, resolution, purpose, conditions } = parsed.data;

  const problem = conditionsProblem(conditions);
  if (problem) {
    res.status(400).json({ error: problem });
    return;
  }

  if (!videoGenService.isEnabled()) {
    const status = videoGenService.getStatus();
    res.status(503).json({
      error: "تكامل توليد الفيديو غير مُهيَّأ. أضف مفتاح MINIMAX_API_KEY.",
      reason: "not_configured",
      missingEnvVars: status.missingEnvVars,
    });
    return;
  }

  // Counted after validation so a malformed request never spends a real
  // budget. Two ceilings: one per admin, one for the whole deployment —
  // several admins each within their own limit can still run up a bill.
  const adminId = req.user!.id;
  if (!applyAdHocLimit(res, `video-gen:${adminId}`, 20, 60 * 60 * 1000,
    "تجاوزت حد التوليد لهذه الساعة. أعد المحاولة لاحقاً.")) return;
  if (!applyAdHocLimit(res, "video-gen:all", 60, 60 * 60 * 1000,
    "تجاوزت المنصة حد التوليد لهذه الساعة. أعد المحاولة لاحقاً.")) return;

  const conditionsForRow = conditions.length > 0 ? conditions : null;

  // Written first, on purpose: the provider bills for a queued task, and a
  // crash between the call and the insert would leave that spend invisible.
  let [job] = await db
    .insert(videoGenerationJobsTable)
    .values({
      provider: "minimax",
      model: videoGenService.modelName(),
      status: "queued",
      purpose: purpose ?? null,
      prompt,
      resolution,
      duration,
      ratio,
      conditions: conditionsForRow,
      requestedById: adminId,
    })
    .returning();

  const created = await videoGenService.createJob({
    prompt,
    duration,
    ratio,
    resolution,
    conditions,
  });

  if (!created.ok) {
    // What gets written down is what an admin reading the list can act on:
    // the provider's own sentence when it sent one ("sensitive content
    // detected" says which attempt to reword), and our Arabic explanation
    // when the failure was ours to describe (unreachable, no task id).
    const message =
      created.reason === "not_configured"
        ? "تكامل توليد الفيديو غير مُهيَّأ."
        : created.status !== undefined
          ? created.message
          : describeFailure(created).error;
    const [failed] = await db
      .update(videoGenerationJobsTable)
      .set({ status: "failed", errorMessage: message, updatedAt: new Date(), completedAt: new Date() })
      .where(eq(videoGenerationJobsTable.id, job.id))
      .returning();
    req.log.error({ jobId: job.id, reason: created.reason, message }, "[video-gen] create failed");

    if (created.reason === "not_configured") {
      res.status(503).json({
        error: "تكامل توليد الفيديو غير مُهيَّأ. أضف مفتاح MINIMAX_API_KEY.",
        reason: "not_configured",
        missingEnvVars: created.missingEnvVars,
        job: failed ?? job,
      });
      return;
    }
    const described = describeFailure(created);
    res.status(described.httpStatus).json({ error: described.error, job: failed ?? job });
    return;
  }

  const [accepted] = await db
    .update(videoGenerationJobsTable)
    .set({ externalTaskId: created.taskId, model: created.model, updatedAt: new Date() })
    .where(eq(videoGenerationJobsTable.id, job.id))
    .returning();
  job = accepted ?? job;

  // Audited because it spends money on someone's behalf; the prompt is the
  // part worth being able to attribute later.
  await recordAuditLog({
    actor: { id: adminId, email: req.user?.email ?? null },
    action: "video_generation.create",
    entityType: "video_generation_job",
    entityId: job.id,
    description: `${resolution} · ${duration}s · ${ratio}`,
    after: { prompt, resolution, duration, ratio, purpose: purpose ?? null, taskId: created.taskId },
  });

  res.status(202).json({ job });
});

// ── List jobs ───────────────────────────────────────────────────────────
router.get("/admin/video-generation/jobs", async (req: Request, res: Response) => {
  if (!(await gate(req, res))) return;

  const statusFilter = typeof req.query.status === "string" ? req.query.status.trim() : "";
  const requested = Number.parseInt(String(req.query.limit ?? "50"), 10);
  const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 200) : 50;

  const allowed: string[] = ["queued", "running", "succeeded", "failed", "cancelled"];
  const where =
    statusFilter === "pending"
      ? inArray(videoGenerationJobsTable.status, ["queued", "running"])
      : allowed.includes(statusFilter)
        ? eq(videoGenerationJobsTable.status, statusFilter as VideoTaskStatus)
        : undefined;

  try {
    const base = db
      .select({
        id: videoGenerationJobsTable.id,
        provider: videoGenerationJobsTable.provider,
        model: videoGenerationJobsTable.model,
        externalTaskId: videoGenerationJobsTable.externalTaskId,
        status: videoGenerationJobsTable.status,
        purpose: videoGenerationJobsTable.purpose,
        prompt: videoGenerationJobsTable.prompt,
        resolution: videoGenerationJobsTable.resolution,
        duration: videoGenerationJobsTable.duration,
        ratio: videoGenerationJobsTable.ratio,
        videoUrl: videoGenerationJobsTable.videoUrl,
        usage: videoGenerationJobsTable.usage,
        errorMessage: videoGenerationJobsTable.errorMessage,
        requestedById: videoGenerationJobsTable.requestedById,
        requestedByEmail: usersTable.email,
        createdAt: videoGenerationJobsTable.createdAt,
        updatedAt: videoGenerationJobsTable.updatedAt,
        completedAt: videoGenerationJobsTable.completedAt,
      })
      .from(videoGenerationJobsTable)
      .leftJoin(usersTable, eq(usersTable.id, videoGenerationJobsTable.requestedById));

    const rows = await (where ? base.where(where) : base)
      .orderBy(desc(videoGenerationJobsTable.createdAt))
      .limit(limit);

    res.set("Cache-Control", "no-store");
    res.json({ jobs: rows });
  } catch (err) {
    req.log.error({ err }, "[video-gen] list failed");
    res.status(500).json({ error: "تعذّر قراءة قائمة المهام." });
  }
});

// ── One job, refreshed from the provider if it is still running ─────────
router.get("/admin/video-generation/jobs/:id", async (req: Request, res: Response) => {
  if (!(await gate(req, res))) return;

  const id = String(req.params.id ?? "").trim();
  if (!id) {
    res.status(400).json({ error: "معرّف المهمة مطلوب." });
    return;
  }

  try {
    const [job] = await db
      .select()
      .from(videoGenerationJobsTable)
      .where(eq(videoGenerationJobsTable.id, id));
    if (!job) {
      res.status(404).json({ error: "المهمة غير موجودة." });
      return;
    }

    // Polling is cheap but not free upstream; cap how often one admin can
    // provoke a query, without making a normal open-and-watch feel broken.
    if (!isTerminal(job.status) && job.externalTaskId) {
      if (!applyAdHocLimit(res, `video-gen-poll:${req.user!.id}`, 600, 60 * 60 * 1000)) return;
      res.set("Cache-Control", "no-store");
      res.json({ job: await reconcile(job) });
      return;
    }

    res.set("Cache-Control", "no-store");
    res.json({ job });
  } catch (err) {
    req.log.error({ err, id }, "[video-gen] read failed");
    res.status(500).json({ error: "تعذّر قراءة المهمة." });
  }
});

// ── Unattended reconciliation ───────────────────────────────────────────
/**
 * Call from cron with `Authorization: Bearer $CRON_SECRET`. Finishes what
 * admins started: results land in the row without anyone watching, and jobs
 * the provider never resolved get closed instead of sitting "queued" for
 * ever.
 *
 * Runs regardless of the feature flag. Turning the flag off must stop new
 * spending, not abandon a clip that was already paid for.
 */
router.post("/cron/video-generation-reconcile", async (req: Request, res: Response) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!videoGenService.isEnabled()) {
    res.json({ ok: true, skipped: "not_configured" });
    return;
  }

  const staleBefore = new Date(Date.now() - STALE_AFTER_MS);
  try {
    const pending = await db
      .select()
      .from(videoGenerationJobsTable)
      .where(
        and(
          inArray(videoGenerationJobsTable.status, ["queued", "running"]),
          isNotNull(videoGenerationJobsTable.externalTaskId),
        ),
      )
      .orderBy(videoGenerationJobsTable.createdAt)
      .limit(25);

    let resolved = 0;
    for (const job of pending) {
      const updated = await reconcile(job);
      if (isTerminal(updated.status)) resolved += 1;
    }

    // Past this age the provider no longer answers questions about the task
    // either, so an open row can never be resolved — say so and close it.
    const abandoned = await db
      .update(videoGenerationJobsTable)
      .set({
        status: "failed",
        errorMessage: "لم يُرجع المزوّد نتيجة خلال 24 ساعة.",
        updatedAt: new Date(),
        completedAt: new Date(),
      })
      .where(
        and(
          inArray(videoGenerationJobsTable.status, ["queued", "running"]),
          lt(videoGenerationJobsTable.createdAt, staleBefore),
        ),
      )
      .returning({ id: videoGenerationJobsTable.id });

    res.json({ ok: true, checked: pending.length, resolved, abandoned: abandoned.length });
  } catch (err) {
    req.log.error({ err }, "[video-gen] reconcile failed");
    res.status(500).json({ error: "reconcile_failed" });
  }
});

export default router;
