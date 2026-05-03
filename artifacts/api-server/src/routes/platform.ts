import { Router, type IRouter, type Request, type Response } from "express";
import { z, type ZodSchema } from "zod";
import {
  db,
  auditLogEntriesTable,
  badgeDefinitionsTable,
  featureFlagsTable,
  impactStatsOverridesTable,
  lessonSessionAttendanceTable,
  transformationStoriesTable,
  userBadgesTable,
  certificatesTable,
  enrollmentsTable,
  lessonProgressTable,
  lessonsTable,
  speechEvaluationsTable,
} from "@workspace/db";
import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/admin.js";
import { invalidateFeatureFlagCache, recordAuditLog } from "../lib/platform.js";

// ── Validation helpers ─────────────────────────────────────────────────
function parseBody<T>(schema: ZodSchema<T>, req: Request, res: Response): T | null {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    res.status(400).json({ error: "invalid-input", issues: result.error.issues });
    return null;
  }
  return result.data;
}

function parseQuery<T>(schema: ZodSchema<T>, req: Request, res: Response): T | null {
  const result = schema.safeParse(req.query ?? {});
  if (!result.success) {
    res.status(400).json({ error: "invalid-query", issues: result.error.issues });
    return null;
  }
  return result.data;
}

// ── Zod schemas for request inputs ─────────────────────────────────────
const FeatureFlagPatchSchema = z.object({ enabled: z.boolean() });

const ImpactStatPatchSchema = z.object({
  overrideValue: z.string().nullable().optional(),
  labelAr: z.string().min(1).optional(),
  labelEn: z.string().min(1).optional(),
});

const StoryCreateSchema = z.object({
  name: z.string().min(1),
  roleAr: z.string().nullable().optional(),
  roleEn: z.string().nullable().optional(),
  quoteAr: z.string().min(1),
  quoteEn: z.string().nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
  displayOrder: z.number().int().optional(),
  isPublished: z.boolean().optional(),
});

const StoryUpdateSchema = StoryCreateSchema.partial();

const AuditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
  actor: z.string().optional().default(""),
  entityType: z.string().optional().default(""),
  action: z.string().optional().default(""),
});

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "unauthorized" });
    return false;
  }
  return true;
}

// ── PUBLIC: feature flags map (key → enabled) ───────────────────────────
// Lightweight, cache-friendly endpoint consumed by the client
// `useFeatureFlag` hook so it can decide whether to render gated UI
// without exposing description metadata.
router.get("/feature-flags", async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({ key: featureFlagsTable.key, enabled: featureFlagsTable.enabled })
      .from(featureFlagsTable);
    const flags: Record<string, boolean> = {};
    for (const r of rows) flags[r.key] = r.enabled;
    res.setHeader("Cache-Control", "public, max-age=30");
    res.json({ flags });
  } catch (err) {
    req.log.error({ err }, "list feature flags (public) failed");
    res.json({ flags: {} });
  }
});

// ── ADMIN: feature flags (full rows) ────────────────────────────────────
router.get("/admin/feature-flags", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const rows = await db
      .select()
      .from(featureFlagsTable)
      .orderBy(asc(featureFlagsTable.key));
    res.json({ flags: rows });
  } catch (err) {
    req.log.error({ err }, "list feature flags failed");
    res.status(500).json({ error: "failed" });
  }
});

router.patch("/admin/feature-flags/:key", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const key = String(req.params.key ?? "").trim();
  if (!key) return res.status(400).json({ error: "missing-key" });
  const body = parseBody(FeatureFlagPatchSchema, req, res);
  if (!body) return;
  const { enabled } = body;
  try {
    const [before] = await db
      .select()
      .from(featureFlagsTable)
      .where(eq(featureFlagsTable.key, key));
    if (!before) return res.status(404).json({ error: "not-found" });
    const [row] = await db
      .update(featureFlagsTable)
      .set({ enabled, updatedById: req.user?.id ?? null })
      .where(eq(featureFlagsTable.key, key))
      .returning();
    invalidateFeatureFlagCache(key);
    await recordAuditLog({
      actor: { id: req.user?.id ?? null, email: req.user?.email ?? null },
      action: "feature_flag.update",
      entityType: "feature_flag",
      entityId: key,
      description: `Set ${key} → ${enabled ? "enabled" : "disabled"}`,
      before: { enabled: before.enabled },
      after: { enabled },
    });
    res.json({ flag: row });
  } catch (err) {
    req.log.error({ err, key }, "update feature flag failed");
    res.status(500).json({ error: "failed" });
  }
});

// ── AUTHED: my badges (earned + locked previews) ────────────────────────
router.get("/my/badges", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const earnedRows = await db
      .select()
      .from(userBadgesTable)
      .where(eq(userBadgesTable.userId, req.user!.id));
    const earnedKeys = new Set(earnedRows.map((r) => r.badgeKey));
    const earnedAtByKey = new Map(earnedRows.map((r) => [r.badgeKey, r.earnedAt]));
    const definitions = await db
      .select()
      .from(badgeDefinitionsTable)
      .where(eq(badgeDefinitionsTable.isActive, true))
      .orderBy(asc(badgeDefinitionsTable.displayOrder));
    res.json({
      badges: definitions.map((d) => ({
        key: d.key,
        titleAr: d.titleAr,
        titleEn: d.titleEn,
        descriptionAr: d.descriptionAr,
        descriptionEn: d.descriptionEn,
        icon: d.icon,
        colorClass: d.colorClass,
        earned: earnedKeys.has(d.key),
        earnedAt: earnedAtByKey.get(d.key) ?? null,
      })),
      earnedCount: earnedKeys.size,
      totalCount: definitions.length,
    });
  } catch (err) {
    req.log.error({ err }, "list my badges failed");
    res.status(500).json({ error: "failed" });
  }
});

// ── ADMIN: audit log (paginated, filterable) ────────────────────────────
router.get("/admin/audit-log", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const q = parseQuery(AuditQuerySchema, req, res);
  if (!q) return;
  try {
    const { limit, offset } = q;
    const actor = q.actor.trim();
    const entityType = q.entityType.trim();
    const action = q.action.trim();

    const conds = [];
    if (actor) conds.push(ilike(auditLogEntriesTable.actorEmail, `%${actor}%`));
    if (entityType) conds.push(eq(auditLogEntriesTable.entityType, entityType));
    if (action) conds.push(eq(auditLogEntriesTable.action, action));

    const where = conds.length === 0 ? undefined : and(...conds);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogEntriesTable)
      .where(where);

    const rows = await db
      .select()
      .from(auditLogEntriesTable)
      .where(where)
      .orderBy(desc(auditLogEntriesTable.createdAt))
      .limit(limit)
      .offset(offset);
    res.json({ entries: rows, total: count, limit, offset });
  } catch (err) {
    req.log.error({ err }, "list audit log failed");
    res.status(500).json({ error: "failed" });
  }
});

// ── ADMIN: impact stats (overrides + stories management) ───────────────
router.get("/admin/impact-stats", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const overrides = await db
      .select()
      .from(impactStatsOverridesTable)
      .orderBy(asc(impactStatsOverridesTable.displayOrder));
    const stories = await db
      .select()
      .from(transformationStoriesTable)
      .orderBy(asc(transformationStoriesTable.displayOrder), desc(transformationStoriesTable.createdAt));
    const real = await computeRealImpact();
    res.json({ overrides, stories, real });
  } catch (err) {
    req.log.error({ err }, "list impact stats failed");
    res.status(500).json({ error: "failed" });
  }
});

router.patch("/admin/impact-stats/:key", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const key = String(req.params.key ?? "").trim();
  if (!key) return res.status(400).json({ error: "missing-key" });
  const body = parseBody(ImpactStatPatchSchema, req, res);
  if (!body) return;
  try {
    const [before] = await db
      .select()
      .from(impactStatsOverridesTable)
      .where(eq(impactStatsOverridesTable.key, key));
    if (!before) return res.status(404).json({ error: "not-found" });
    const update: Record<string, unknown> = { updatedById: req.user?.id ?? null };
    if ("overrideValue" in body) update.overrideValue = body.overrideValue ?? null;
    if (typeof body.labelAr === "string") update.labelAr = body.labelAr;
    if (typeof body.labelEn === "string") update.labelEn = body.labelEn;
    const [row] = await db
      .update(impactStatsOverridesTable)
      .set(update)
      .where(eq(impactStatsOverridesTable.key, key))
      .returning();
    await recordAuditLog({
      actor: { id: req.user?.id ?? null, email: req.user?.email ?? null },
      action: "impact_stat.update",
      entityType: "impact_stat",
      entityId: key,
      description: `Updated impact stat ${key}`,
      before: { overrideValue: before.overrideValue, labelAr: before.labelAr, labelEn: before.labelEn },
      after: { overrideValue: row.overrideValue, labelAr: row.labelAr, labelEn: row.labelEn },
    });
    res.json({ override: row });
  } catch (err) {
    req.log.error({ err, key }, "update impact stat failed");
    res.status(500).json({ error: "failed" });
  }
});

// Stories CRUD
router.post("/admin/impact-stories", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const body = parseBody(StoryCreateSchema, req, res);
  if (!body) return;
  try {
    const [row] = await db
      .insert(transformationStoriesTable)
      .values({
        name: body.name,
        roleAr: body.roleAr ?? null,
        roleEn: body.roleEn ?? null,
        quoteAr: body.quoteAr,
        quoteEn: body.quoteEn ?? null,
        photoUrl: body.photoUrl ?? null,
        displayOrder: body.displayOrder ?? 0,
        isPublished: body.isPublished ?? false,
      })
      .returning();
    await recordAuditLog({
      actor: { id: req.user?.id ?? null, email: req.user?.email ?? null },
      action: "story.create",
      entityType: "transformation_story",
      entityId: row.id,
      description: `Created story for ${row.name}`,
      after: row,
    });
    res.status(201).json({ story: row });
  } catch (err) {
    req.log.error({ err }, "create story failed");
    res.status(500).json({ error: "failed" });
  }
});

router.patch("/admin/impact-stories/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const id = String(req.params.id ?? "").trim();
  const body = parseBody(StoryUpdateSchema, req, res);
  if (!body) return;
  try {
    const [before] = await db
      .select()
      .from(transformationStoriesTable)
      .where(eq(transformationStoriesTable.id, id));
    if (!before) return res.status(404).json({ error: "not-found" });
    const update: Record<string, unknown> = {};
    for (const f of ["name", "roleAr", "roleEn", "quoteAr", "quoteEn", "photoUrl", "displayOrder", "isPublished"] as const) {
      if (f in body) update[f] = (body as Record<string, unknown>)[f];
    }
    const [row] = await db
      .update(transformationStoriesTable)
      .set(update)
      .where(eq(transformationStoriesTable.id, id))
      .returning();
    await recordAuditLog({
      actor: { id: req.user?.id ?? null, email: req.user?.email ?? null },
      action: "story.update",
      entityType: "transformation_story",
      entityId: id,
      description: `Updated story ${row.name}`,
      before,
      after: row,
    });
    res.json({ story: row });
  } catch (err) {
    req.log.error({ err, id }, "update story failed");
    res.status(500).json({ error: "failed" });
  }
});

router.delete("/admin/impact-stories/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const id = String(req.params.id ?? "").trim();
  try {
    const [row] = await db
      .delete(transformationStoriesTable)
      .where(eq(transformationStoriesTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "not-found" });
    await recordAuditLog({
      actor: { id: req.user?.id ?? null, email: req.user?.email ?? null },
      action: "story.delete",
      entityType: "transformation_story",
      entityId: id,
      description: `Deleted story ${row.name}`,
      before: row,
    });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err, id }, "delete story failed");
    res.status(500).json({ error: "failed" });
  }
});

// ── PUBLIC: /api/impact ─────────────────────────────────────────────────
router.get("/impact", async (req: Request, res: Response) => {
  try {
    const real = await computeRealImpact();
    const overrides = await db
      .select()
      .from(impactStatsOverridesTable)
      .orderBy(asc(impactStatsOverridesTable.displayOrder));
    const stories = await db
      .select({
        id: transformationStoriesTable.id,
        name: transformationStoriesTable.name,
        roleAr: transformationStoriesTable.roleAr,
        roleEn: transformationStoriesTable.roleEn,
        quoteAr: transformationStoriesTable.quoteAr,
        quoteEn: transformationStoriesTable.quoteEn,
        photoUrl: transformationStoriesTable.photoUrl,
        displayOrder: transformationStoriesTable.displayOrder,
      })
      .from(transformationStoriesTable)
      .where(eq(transformationStoriesTable.isPublished, true))
      .orderBy(asc(transformationStoriesTable.displayOrder), desc(transformationStoriesTable.createdAt));
    const stats = overrides.map((o) => ({
      key: o.key,
      labelAr: o.labelAr,
      labelEn: o.labelEn,
      value: o.overrideValue ?? formatRealValue(o.key, real),
      isOverridden: !!o.overrideValue,
    }));
    res.setHeader("Cache-Control", "public, max-age=120");
    res.json({ stats, stories });
  } catch (err) {
    req.log.error({ err }, "public impact failed");
    res.status(500).json({ error: "failed" });
  }
});

// ── ADMIN: platform health (row counts of new tables) ───────────────────
router.get("/admin/platform-health", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const [b] = await db.select({ c: sql<number>`count(*)::int` }).from(badgeDefinitionsTable);
    const [ub] = await db.select({ c: sql<number>`count(*)::int` }).from(userBadgesTable);
    const [ff] = await db.select({ c: sql<number>`count(*)::int` }).from(featureFlagsTable);
    const [al] = await db.select({ c: sql<number>`count(*)::int` }).from(auditLogEntriesTable);
    const [is] = await db.select({ c: sql<number>`count(*)::int` }).from(impactStatsOverridesTable);
    const [ts] = await db.select({ c: sql<number>`count(*)::int` }).from(transformationStoriesTable);
    const [att] = await db.select({ c: sql<number>`count(*)::int` }).from(lessonSessionAttendanceTable);
    res.json({
      counts: {
        badge_definitions: b?.c ?? 0,
        user_badges: ub?.c ?? 0,
        feature_flags: ff?.c ?? 0,
        audit_log_entries: al?.c ?? 0,
        impact_stats_overrides: is?.c ?? 0,
        transformation_stories: ts?.c ?? 0,
        lesson_session_attendance: att?.c ?? 0,
      },
    });
  } catch (err) {
    req.log.error({ err }, "platform health failed");
    res.status(500).json({ error: "failed" });
  }
});

// ── helpers ─────────────────────────────────────────────────────────────
async function computeRealImpact() {
  const [trainees] = await db
    .select({ c: sql<number>`count(distinct ${enrollmentsTable.userId})::int` })
    .from(enrollmentsTable);
  const [speeches] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(speechEvaluationsTable);
  const [certs] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(certificatesTable)
    .where(eq(certificatesTable.status, "active"));

  // completion rate = avg per-enrollment lessons-completed ÷ total-lessons.
  const completionRows = await db
    .select({
      enrollmentId: enrollmentsTable.id,
      total: sql<number>`(select count(*)::int from ${lessonsTable} where ${lessonsTable.courseId} = ${enrollmentsTable.courseId} and ${lessonsTable.isPublished} = true)`,
      done: sql<number>`(select count(*)::int from ${lessonProgressTable} l where l.user_id = ${enrollmentsTable.userId} and l.completed = true and l.lesson_id in (select id from ${lessonsTable} where ${lessonsTable.courseId} = ${enrollmentsTable.courseId} and ${lessonsTable.isPublished} = true))`,
    })
    .from(enrollmentsTable);
  let completionRate = 0;
  if (completionRows.length > 0) {
    const sumPct = completionRows.reduce((acc, row) => {
      const t = row.total ?? 0;
      const d = row.done ?? 0;
      return acc + (t > 0 ? (d / t) * 100 : 0);
    }, 0);
    completionRate = Math.round(sumPct / completionRows.length);
  }
  return {
    trainees_total: trainees?.c ?? 0,
    speeches_evaluated: speeches?.c ?? 0,
    certificates_issued: certs?.c ?? 0,
    completion_rate: completionRate,
  };
}

function formatRealValue(key: string, real: Awaited<ReturnType<typeof computeRealImpact>>): string {
  switch (key) {
    case "trainees_total":      return String(real.trainees_total);
    case "speeches_evaluated":  return String(real.speeches_evaluated);
    case "certificates_issued": return String(real.certificates_issued);
    case "completion_rate":     return `${real.completion_rate}%`;
    default:                    return "";
  }
}

export default router;
