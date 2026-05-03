import {
  db,
  auditLogEntriesTable,
  badgeDefinitionsTable,
  featureFlagsTable,
  impactStatsOverridesTable,
  userBadgesTable,
  type BadgeDefinition,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger.js";

// ── Audit log ───────────────────────────────────────────────────────────

export type AuditActor = { id: string | null; email: string | null };

/**
 * Append a structured audit-log entry. Never throws — logging failures
 * must not break the originating action. Pass `before` / `after` to
 * record the diff for an update.
 */
export async function recordAuditLog(opts: {
  actor: AuditActor;
  action: string;
  entityType: string;
  entityId?: string | null;
  description?: string | null;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  try {
    await db.insert(auditLogEntriesTable).values({
      actorUserId: opts.actor.id ?? null,
      actorEmail: opts.actor.email ?? null,
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId ?? null,
      description: opts.description ?? null,
      beforeJson: (opts.before as object | undefined) ?? null,
      afterJson: (opts.after as object | undefined) ?? null,
    });
  } catch (err) {
    logger.warn({ err, action: opts.action, entityType: opts.entityType }, "audit log write failed");
  }
}

// ── Feature flags ───────────────────────────────────────────────────────

const FLAG_TTL_MS = 30_000;
type FlagCacheEntry = { enabled: boolean; expiresAt: number };
const flagCache = new Map<string, FlagCacheEntry>();

/**
 * Returns whether a feature flag is enabled. Defaults to `true` when no
 * row exists for the key (so missing flags never silently disable
 * functionality). Cached for 30s.
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const now = Date.now();
  const hit = flagCache.get(key);
  if (hit && hit.expiresAt > now) return hit.enabled;
  try {
    const [row] = await db
      .select({ enabled: featureFlagsTable.enabled })
      .from(featureFlagsTable)
      .where(eq(featureFlagsTable.key, key));
    const enabled = row?.enabled ?? true;
    flagCache.set(key, { enabled, expiresAt: now + FLAG_TTL_MS });
    return enabled;
  } catch (err) {
    logger.warn({ err, key }, "feature-flag lookup failed; defaulting to enabled");
    return true;
  }
}

/** Invalidate the cache after a write (called by the admin PATCH route). */
export function invalidateFeatureFlagCache(key?: string): void {
  if (key) flagCache.delete(key);
  else flagCache.clear();
}

// ── Badges ──────────────────────────────────────────────────────────────

/**
 * Award a badge to a user if they don't already have it. Idempotent: a
 * unique index on (userId, badgeKey) prevents duplicates. Returns
 * `{ awarded: true, badge }` only on the FIRST award.
 */
export async function awardBadgeIfEligible(opts: {
  userId: string;
  badgeKey: string;
  payload?: Record<string, unknown>;
}): Promise<{ awarded: boolean; badge?: BadgeDefinition }> {
  try {
    const [definition] = await db
      .select()
      .from(badgeDefinitionsTable)
      .where(eq(badgeDefinitionsTable.key, opts.badgeKey));
    if (!definition || !definition.isActive) {
      return { awarded: false };
    }
    const inserted = await db
      .insert(userBadgesTable)
      .values({
        userId: opts.userId,
        badgeKey: opts.badgeKey,
        payload: opts.payload ?? null,
      })
      .onConflictDoNothing({
        target: [userBadgesTable.userId, userBadgesTable.badgeKey],
      })
      .returning();
    if (inserted.length === 0) {
      return { awarded: false, badge: definition };
    }
    return { awarded: true, badge: definition };
  } catch (err) {
    logger.warn({ err, ...opts }, "badge award failed");
    return { awarded: false };
  }
}

// ── Seeding (one-shot, idempotent) ──────────────────────────────────────

const DEFAULT_BADGES: Array<{
  key: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  colorClass: string;
  eventName: string;
  displayOrder: number;
}> = [
  {
    key: "first_lesson_completed",
    titleAr: "أول درس مكتمل",
    titleEn: "First Lesson Completed",
    descriptionAr: "أكملت أول درس في رحلتك مع بكلمة.",
    descriptionEn: "You completed your first lesson on Bikalima.",
    icon: "play-circle",
    colorClass: "bg-sky-100 text-sky-700",
    eventName: "lesson_completed",
    displayOrder: 1,
  },
  {
    key: "first_speech_uploaded",
    titleAr: "أول خطاب مرفوع",
    titleEn: "First Speech Uploaded",
    descriptionAr: "أرسلت أول خطاب لتقييمه.",
    descriptionEn: "You submitted your first speech for evaluation.",
    icon: "mic",
    colorClass: "bg-violet-100 text-violet-700",
    eventName: "speech_submitted",
    displayOrder: 2,
  },
  {
    key: "first_evaluation_received",
    titleAr: "أول تقييم مكتمل",
    titleEn: "First Evaluation Received",
    descriptionAr: "وصلك أول تقرير تقييم خطاب.",
    descriptionEn: "Your first speech evaluation report is ready.",
    icon: "clipboard-check",
    colorClass: "bg-indigo-100 text-indigo-700",
    eventName: "evaluation_published",
    displayOrder: 3,
  },
  {
    key: "course_half_done",
    titleAr: "نصف الطريق",
    titleEn: "Halfway There",
    descriptionAr: "أكملت ٥٠٪ من إحدى الدورات.",
    descriptionEn: "You completed 50% of a course.",
    icon: "trending-up",
    colorClass: "bg-cyan-100 text-cyan-700",
    eventName: "course_half_done",
    displayOrder: 4,
  },
  {
    key: "course_completed",
    titleAr: "إنهاء الدورة",
    titleEn: "Course Completed",
    descriptionAr: "أتممت دورة كاملة. مبارك!",
    descriptionEn: "You finished a full course. Congrats!",
    icon: "graduation-cap",
    colorClass: "bg-emerald-100 text-emerald-700",
    eventName: "course_completed",
    displayOrder: 5,
  },
  {
    key: "influential_speaker",
    titleAr: "متحدث مؤثر",
    titleEn: "Influential Speaker",
    descriptionAr: "حصلت على ٨٥ فأعلى في تقييم خطاب.",
    descriptionEn: "You scored 85 or above on a speech evaluation.",
    icon: "sparkles",
    colorClass: "bg-amber-100 text-amber-700",
    eventName: "evaluation_high_score",
    displayOrder: 6,
  },
  {
    key: "certified_trainer",
    titleAr: "مدرب معتمد",
    titleEn: "Certified Trainer",
    descriptionAr: "حصلت على شهادة اعتماد المدربين من بكلمة.",
    descriptionEn: "You earned the Bikalima Certified Trainer certificate.",
    icon: "shield-check",
    colorClass: "bg-rose-100 text-rose-700",
    eventName: "trainer_certificate_issued",
    displayOrder: 7,
  },
];

const DEFAULT_FLAGS: Array<{
  key: string;
  descriptionAr: string;
  descriptionEn: string;
}> = [
  { key: "ai_evaluation",     descriptionAr: "التقييم التلقائي بالذكاء الاصطناعي", descriptionEn: "AI-powered evaluation" },
  { key: "live_chat",         descriptionAr: "الشات المباشر مع الزوار",            descriptionEn: "Live chat widget" },
  { key: "payments",          descriptionAr: "الدفع الإلكتروني",                    descriptionEn: "Online payments" },
  { key: "graduates_page",    descriptionAr: "صفحة سجل الخريجين العامة",            descriptionEn: "Public graduates registry" },
  { key: "video_upload",      descriptionAr: "رفع الفيديوهات في الخطابات",          descriptionEn: "Video upload" },
  { key: "certificate_pdf",   descriptionAr: "تحميل الشهادات بصيغة PDF",            descriptionEn: "Certificate PDF download" },
  { key: "consultation_booking", descriptionAr: "حجز جلسة استشارة",                  descriptionEn: "Consultation booking" },
];

const DEFAULT_IMPACT_STATS: Array<{
  key: string;
  labelAr: string;
  labelEn: string;
  displayOrder: number;
}> = [
  { key: "trainees_total",        labelAr: "إجمالي المتدربين",       labelEn: "Total trainees",          displayOrder: 1 },
  { key: "speeches_evaluated",    labelAr: "خطابات تم تقييمها",      labelEn: "Speeches evaluated",      displayOrder: 2 },
  { key: "certificates_issued",   labelAr: "شهادات صادرة",           labelEn: "Certificates issued",     displayOrder: 3 },
  { key: "completion_rate",       labelAr: "نسبة إكمال البرامج",     labelEn: "Program completion rate", displayOrder: 4 },
];

let seedingDone = false;
let seedingInflight: Promise<void> | null = null;

/**
 * Insert the default badge definitions, feature flags, and impact-stats
 * placeholders if they don't already exist. Safe to call repeatedly:
 * concurrent callers share a single in-flight promise; on failure the
 * cache is cleared so the next call retries (important for transient DB
 * cold-start errors at boot).
 */
export function seedPlatformDefaults(): Promise<void> {
  if (seedingDone) return Promise.resolve();
  if (seedingInflight) return seedingInflight;
  seedingInflight = (async () => {
    try {
      if (DEFAULT_BADGES.length > 0) {
        await db
          .insert(badgeDefinitionsTable)
          .values(DEFAULT_BADGES)
          .onConflictDoNothing({ target: badgeDefinitionsTable.key });
      }
      if (DEFAULT_FLAGS.length > 0) {
        await db
          .insert(featureFlagsTable)
          .values(DEFAULT_FLAGS.map((f) => ({ key: f.key, enabled: true, descriptionAr: f.descriptionAr, descriptionEn: f.descriptionEn })))
          .onConflictDoNothing({ target: featureFlagsTable.key });
      }
      if (DEFAULT_IMPACT_STATS.length > 0) {
        await db
          .insert(impactStatsOverridesTable)
          .values(DEFAULT_IMPACT_STATS.map((s) => ({ key: s.key, labelAr: s.labelAr, labelEn: s.labelEn, displayOrder: s.displayOrder })))
          .onConflictDoNothing({ target: impactStatsOverridesTable.key });
      }
      seedingDone = true;
      logger.info("platform defaults seeded");
    } catch (err) {
      // Clear the in-flight promise so the next caller (e.g. a request
      // handler that calls `seedPlatformDefaults()` defensively, or a
      // later boot-time retry) can attempt again.
      logger.warn({ err }, "platform default seeding failed; will retry on next call");
      throw err;
    } finally {
      seedingInflight = null;
    }
  })();
  // Swallow the rejection on the cached handle so callers using
  // `.catch()` aren't required, but the `throw` above still resets the
  // inflight slot.
  return seedingInflight.catch(() => {});
}
