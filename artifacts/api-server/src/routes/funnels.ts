import { Router, type IRouter, type Request, type Response } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, funnelsTable, leadsTable, leadActivitiesTable } from "@workspace/db";
import { requireRole } from "../lib/admin.js";

const router: IRouter = Router();

function gate(req: Request, res: Response): boolean {
  return requireRole(req, res, "sales");
}

type FunnelStep = {
  id: string;
  labelAr: string;
  kind: "lead_source" | "lead_status" | "activity_type" | "conversion";
  value: string;
};

const DEFAULT_FUNNELS: Array<{
  key: string;
  nameAr: string;
  descriptionAr: string;
  sourceFilter?: string;
  steps: FunnelStep[];
}> = [
  {
    key: "speech_eval_to_student",
    nameAr: "من تقييم الخطاب إلى طالب",
    descriptionAr: "تتبّع مسار من قدّم تقييم خطاب حتى أصبح طالباً.",
    sourceFilter: "speech_evaluation",
    steps: [
      { id: "s1", labelAr: "قدّم تقييم خطاب", kind: "lead_source", value: "speech_evaluation" },
      { id: "s2", labelAr: "تواصلنا معه", kind: "lead_status", value: "contacted" },
      { id: "s3", labelAr: "أبدى اهتماماً", kind: "lead_status", value: "interested" },
      { id: "s4", labelAr: "دفع", kind: "lead_status", value: "paid" },
      { id: "s5", labelAr: "أصبح طالباً", kind: "lead_status", value: "student" },
    ],
  },
  {
    key: "consultation_to_student",
    nameAr: "من استشارة مجانية إلى طالب",
    descriptionAr: "تتبّع مسار من حجز جلسة استشارة حتى أصبح طالباً.",
    sourceFilter: "consultation",
    steps: [
      { id: "s1", labelAr: "حجز استشارة", kind: "lead_source", value: "consultation" },
      { id: "s2", labelAr: "حضر الجلسة", kind: "lead_status", value: "consultation" },
      { id: "s3", labelAr: "تم إرسال العرض", kind: "lead_status", value: "offer_sent" },
      { id: "s4", labelAr: "بانتظار الدفع", kind: "lead_status", value: "awaiting_payment" },
      { id: "s5", labelAr: "أصبح طالباً", kind: "lead_status", value: "student" },
    ],
  },
  {
    key: "workbook_to_student",
    nameAr: "من شراء كراسة إلى طالب",
    descriptionAr: "كم من مشتري كراسة تحوّل لاحقاً إلى طالب في برنامج.",
    sourceFilter: "workbook_order",
    steps: [
      { id: "s1", labelAr: "اشترى كراسة", kind: "lead_source", value: "workbook_order" },
      { id: "s2", labelAr: "تواصلنا معه", kind: "lead_status", value: "contacted" },
      { id: "s3", labelAr: "أبدى اهتماماً ببرنامج", kind: "lead_status", value: "interested" },
      { id: "s4", labelAr: "أصبح طالباً", kind: "lead_status", value: "student" },
    ],
  },
  {
    key: "chat_to_student",
    nameAr: "من شات مباشر إلى طالب",
    descriptionAr: "تحويل زوار الشات المباشر إلى طلاب.",
    sourceFilter: "live_chat",
    steps: [
      { id: "s1", labelAr: "بدأ شات مباشر", kind: "lead_source", value: "live_chat" },
      { id: "s2", labelAr: "أبدى اهتماماً", kind: "lead_status", value: "interested" },
      { id: "s3", labelAr: "تم إرسال العرض", kind: "lead_status", value: "offer_sent" },
      { id: "s4", labelAr: "أصبح طالباً", kind: "lead_status", value: "student" },
    ],
  },
  {
    key: "enrollment_to_paid",
    nameAr: "من طلب تسجيل إلى دفع كامل",
    descriptionAr: "كم من طلبات التسجيل وصلت إلى الدفع الفعلي.",
    sourceFilter: "enrollment",
    steps: [
      { id: "s1", labelAr: "طلب تسجيل", kind: "lead_source", value: "enrollment" },
      { id: "s2", labelAr: "تم إرسال العرض/الرابط", kind: "lead_status", value: "offer_sent" },
      { id: "s3", labelAr: "بانتظار الدفع", kind: "lead_status", value: "awaiting_payment" },
      { id: "s4", labelAr: "تم الدفع", kind: "lead_status", value: "paid" },
    ],
  },
];

let seeded = false;
async function seedDefaults() {
  if (seeded) return;
  for (const f of DEFAULT_FUNNELS) {
    const exists = await db
      .select({ id: funnelsTable.id })
      .from(funnelsTable)
      .where(eq(funnelsTable.key, f.key))
      .limit(1);
    if (exists.length > 0) continue;
    await db.insert(funnelsTable).values({
      key: f.key,
      nameAr: f.nameAr,
      descriptionAr: f.descriptionAr,
      sourceFilter: f.sourceFilter ?? null,
      steps: f.steps as unknown as Array<Record<string, unknown>>,
      isActive: true,
    });
  }
  seeded = true;
}


/**
 * Every count a funnel list needs, in four queries instead of one per step.
 *
 * The old shape asked the database once per step of every funnel — parallel,
 * but still funnels × steps round trips to a database with no persistent
 * server in front of it. There are only four kinds of step, so four grouped
 * queries answer all of them however many funnels exist.
 *
 * lead_status is the one that needs care: its count is scoped by each funnel's
 * own sourceFilter, so the grouping keeps source and status together and the
 * per-funnel total is summed from that, rather than grouping by status alone
 * and losing the ability to filter.
 */
type FunnelCounts = {
  leadSource: Map<string, number>;
  /** `${source}\u0000${status}` → count, so a funnel can sum its own source. */
  sourceStatus: Map<string, number>;
  statusTotal: Map<string, number>;
  activityType: Map<string, number>;
  conversions: number;
};

async function loadFunnelCounts(): Promise<FunnelCounts> {
  const [sources, sourceStatuses, activities, conversion] = await Promise.all([
    db
      .select({ source: leadsTable.source, c: sql<number>`count(*)::int` })
      .from(leadsTable)
      .groupBy(leadsTable.source),
    db
      .select({
        source: leadsTable.source,
        status: leadsTable.status,
        c: sql<number>`count(distinct ${leadsTable.id})::int`,
      })
      .from(leadsTable)
      .groupBy(leadsTable.source, leadsTable.status),
    db
      .select({
        type: leadActivitiesTable.type,
        c: sql<number>`count(distinct ${leadActivitiesTable.leadId})::int`,
      })
      .from(leadActivitiesTable)
      .groupBy(leadActivitiesTable.type),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(leadsTable)
      .where(sql`${leadsTable.convertedAt} is not null`),
  ]);

  const leadSource = new Map<string, number>();
  for (const r of sources) leadSource.set(String(r.source), r.c);

  const sourceStatus = new Map<string, number>();
  const statusTotal = new Map<string, number>();
  for (const r of sourceStatuses) {
    const status = String(r.status);
    sourceStatus.set(`${String(r.source)}\u0000${status}`, r.c);
    statusTotal.set(status, (statusTotal.get(status) ?? 0) + r.c);
  }

  const activityType = new Map<string, number>();
  for (const r of activities) activityType.set(String(r.type), r.c);

  return {
    leadSource,
    sourceStatus,
    statusTotal,
    activityType,
    conversions: conversion[0]?.c ?? 0,
  };
}

function countStepFrom(
  step: FunnelStep,
  sourceFilter: string | null,
  counts: FunnelCounts,
): number {
  switch (step.kind) {
    case "lead_source":
      return counts.leadSource.get(step.value) ?? 0;
    case "lead_status":
      return sourceFilter
        ? counts.sourceStatus.get(`${sourceFilter}\u0000${step.value}`) ?? 0
        : counts.statusTotal.get(step.value) ?? 0;
    case "activity_type":
      return counts.activityType.get(step.value) ?? 0;
    case "conversion":
      return counts.conversions;
    default:
      return 0;
  }
}

router.get("/admin/funnels", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    await seedDefaults();
    const rows = await db
      .select()
      .from(funnelsTable)
      .orderBy(desc(funnelsTable.isActive), desc(funnelsTable.createdAt));

    const counts = await loadFunnelCounts();
    const enriched = rows.map((f) => {
      {
        const steps = (f.steps ?? []) as unknown as FunnelStep[];
        const stepsWithCounts = steps.map((s) => ({
          ...s,
          count: countStepFrom(s, f.sourceFilter, counts),
        }));
        const top = stepsWithCounts[0]?.count ?? 0;
        const bottom = stepsWithCounts[stepsWithCounts.length - 1]?.count ?? 0;
        const conversionRate = top > 0 ? Math.round((bottom / top) * 1000) / 10 : 0;
        return { ...f, steps: stepsWithCounts, conversionRate };
      }
    });

    res.set("Cache-Control", "no-store");
    res.json({ funnels: enriched });
  } catch (err) {
    req.log.error({ err }, "[funnels] list failed");
    res.status(500).json({ error: "server_error" });
  }
});

router.post("/admin/funnels", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    const body = req.body ?? {};
    const key = String(body.key ?? `fnl_${Date.now()}`);
    const nameAr = String(body.nameAr ?? "").trim();
    const steps = Array.isArray(body.steps) ? body.steps : [];
    if (!nameAr || steps.length === 0) {
      return res.status(400).json({ error: "name_steps_required" });
    }
    const [created] = await db
      .insert(funnelsTable)
      .values({
        key,
        nameAr,
        descriptionAr: body.descriptionAr ?? null,
        sourceFilter: body.sourceFilter ?? null,
        steps,
        isActive: body.isActive !== false,
      })
      .returning();
    res.json({ funnel: created });
  } catch (err) {
    req.log.error({ err }, "[funnels] create failed");
    res.status(500).json({ error: "server_error" });
  }
});

router.patch("/admin/funnels/:id", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    const id = req.params.id;
    const body = req.body ?? {};
    const patch: Partial<typeof funnelsTable.$inferInsert> = {};
    if (typeof body.nameAr === "string") patch.nameAr = body.nameAr;
    if (typeof body.descriptionAr === "string") patch.descriptionAr = body.descriptionAr;
    if ("sourceFilter" in body) patch.sourceFilter = body.sourceFilter ?? null;
    if (Array.isArray(body.steps)) patch.steps = body.steps;
    if (typeof body.isActive === "boolean") patch.isActive = body.isActive;
    const [updated] = await db
      .update(funnelsTable)
      .set(patch)
      .where(eq(funnelsTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "not_found" });
    res.json({ funnel: updated });
  } catch (err) {
    req.log.error({ err }, "[funnels] update failed");
    res.status(500).json({ error: "server_error" });
  }
});

router.delete("/admin/funnels/:id", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    await db.delete(funnelsTable).where(eq(funnelsTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "[funnels] delete failed");
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
