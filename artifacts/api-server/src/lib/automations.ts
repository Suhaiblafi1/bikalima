import { and, eq, sql } from "drizzle-orm";
import {
  db,
  automationsTable,
  leadsTable,
  tasksTable,
  leadActivitiesTable,
  type Automation,
} from "@workspace/db";
import { logger } from "./logger.js";

export type AutomationAction =
  | { type: "create_task"; title: string; offsetDays?: number; priority?: "low" | "medium" | "high"; description?: string }
  | { type: "set_status"; status: string }
  | { type: "set_lead_status"; status: string }
  | { type: "set_score"; score: "hot" | "warm" | "cold" }
  | { type: "add_note"; text: string }
  | { type: "add_activity"; summaryAr: string; activityType?: string }
  | { type: "send_whatsapp_template"; templateKey: string }
  | { type: "notify_admin_email"; subject?: string };

export type AutomationDef = {
  key?: string;
  name: string;
  descriptionAr?: string;
  trigger: string;
  conditions?: Record<string, unknown>;
  actions: AutomationAction[];
};

// Default automations seeded from the brief. Keyed for idempotent seeding.
export const DEFAULT_AUTOMATIONS: AutomationDef[] = [
  {
    key: "speech_eval_followup",
    name: "متابعة تقييم الخطاب خلال يومين",
    descriptionAr: "ينشئ مهمة متابعة تلقائية عند تسجيل تقييم خطاب جديد.",
    trigger: "speech_evaluation.created",
    actions: [
      { type: "create_task", title: "متابعة طالب تقييم الخطاب", offsetDays: 2, priority: "high" },
      { type: "set_score", score: "hot" },
    ],
  },
  {
    key: "consultation_nextday",
    name: "تذكير قبل جلسة الاستشارة",
    descriptionAr: "ينشئ مهمة تذكير للمستشار قبل يوم من الجلسة.",
    trigger: "consultation.created",
    actions: [
      { type: "create_task", title: "تأكيد جلسة الاستشارة وإرسال رابط Zoom", offsetDays: 1, priority: "high" },
      { type: "set_status", status: "consultation" },
    ],
  },
  {
    key: "workbook_print_followup",
    name: "متابعة طلب كراسة مطبوعة",
    descriptionAr: "متابعة دفع وعنوان شحن لطلبات الكراسات المطبوعة.",
    trigger: "workbook_order.created",
    conditions: { format: "print" },
    actions: [
      { type: "create_task", title: "تأكيد عنوان الشحن وحساب رسوم التوصيل", offsetDays: 1, priority: "medium" },
    ],
  },
  {
    key: "enrollment_paymentfollowup",
    name: "متابعة الدفع بعد تسجيل البرنامج",
    descriptionAr: "إنشاء مهمة متابعة دفع بعد ٢٤ ساعة من طلب التسجيل.",
    trigger: "enrollment.created",
    actions: [
      { type: "set_status", status: "offer_sent" },
      { type: "create_task", title: "متابعة الدفع وإرسال رابط السداد", offsetDays: 1, priority: "high" },
    ],
  },
  {
    key: "stale_lead_7d",
    name: "تنبيه عميل محتمل خامل ٧ أيام",
    descriptionAr: "ينبّه إلى العملاء المحتملين بدون نشاط لأكثر من أسبوع.",
    trigger: "lead.stale_7d",
    actions: [
      { type: "create_task", title: "إعادة الاتصال بعميل محتمل خامل (٧ أيام)", offsetDays: 0, priority: "medium" },
    ],
  },
];

let seeded = false;

export async function ensureDefaultAutomationsSeeded(): Promise<void> {
  if (seeded) return;
  for (const def of DEFAULT_AUTOMATIONS) {
    if (!def.key) continue;
    const existing = await db
      .select({ id: automationsTable.id })
      .from(automationsTable)
      .where(eq(automationsTable.name, def.name))
      .limit(1);
    if (existing.length > 0) continue;
    await db.insert(automationsTable).values({
      name: def.name,
      descriptionAr: def.descriptionAr ?? null,
      trigger: def.trigger,
      conditions: def.conditions ?? null,
      actions: def.actions as unknown as Array<Record<string, unknown>>,
      isActive: true,
    });
  }
  seeded = true;
}

function matchesConditions(
  conditions: Record<string, unknown> | null | undefined,
  payload: Record<string, unknown>,
): boolean {
  if (!conditions) return true;
  for (const [k, v] of Object.entries(conditions)) {
    if (payload[k] !== v) return false;
  }
  return true;
}

async function runAction(
  action: AutomationAction,
  payload: Record<string, unknown>,
): Promise<void> {
  const leadId = typeof payload.leadId === "string" ? payload.leadId : null;
  if (!leadId) return;

  switch (action.type) {
    case "create_task": {
      const dueAt =
        typeof action.offsetDays === "number"
          ? new Date(Date.now() + action.offsetDays * 86400_000)
          : null;
      await db.insert(tasksTable).values({
        title: action.title,
        description: action.description ?? null,
        leadId,
        priority: action.priority ?? "medium",
        status: "open",
        dueAt,
        sourceType: "automation",
      });
      return;
    }
    case "set_status":
    case "set_lead_status": {
      await db
        .update(leadsTable)
        .set({ status: action.status, lastStatusChangeAt: new Date() })
        .where(eq(leadsTable.id, leadId));
      return;
    }
    case "add_activity": {
      await db.insert(leadActivitiesTable).values({
        leadId,
        type: action.activityType ?? "automation",
        summaryAr: action.summaryAr,
      });
      return;
    }
    case "send_whatsapp_template": {
      await db.insert(leadActivitiesTable).values({
        leadId,
        type: "whatsapp_template_queued",
        summaryAr: `قالب واتساب مُجدول للإرسال: ${action.templateKey}`,
        payload: { templateKey: action.templateKey } as unknown as Record<string, unknown>,
      });
      return;
    }
    case "notify_admin_email": {
      await db.insert(leadActivitiesTable).values({
        leadId,
        type: "admin_email_queued",
        summaryAr: action.subject ?? "إشعار للمدير بخصوص هذا العميل",
      });
      return;
    }
    case "set_score": {
      await db
        .update(leadsTable)
        .set({ interestScore: action.score })
        .where(eq(leadsTable.id, leadId));
      return;
    }
    case "add_note": {
      await db
        .update(leadsTable)
        .set({
          internalNotes: sql`coalesce(${leadsTable.internalNotes}, '') || E'\n' || ${action.text}`,
        })
        .where(eq(leadsTable.id, leadId));
      return;
    }
  }
}

/**
 * Run all active automations matching the given trigger and payload.
 * Best-effort — never throws to the caller, errors are logged.
 */
export async function runAutomations(
  trigger: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await ensureDefaultAutomationsSeeded();
    const rows = await db
      .select()
      .from(automationsTable)
      .where(and(eq(automationsTable.trigger, trigger), eq(automationsTable.isActive, true)));
    for (const row of rows as Automation[]) {
      await executeAutomationRow(row, payload);
    }
  } catch (err) {
    logger.warn({ err, trigger }, "runAutomations failed");
  }
}

/**
 * Execute a single automation row (used by the manual /test endpoint).
 */
export async function executeAutomationRow(
  row: Automation,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!matchesConditions(row.conditions, payload)) return;
  const actions = (row.actions ?? []) as AutomationAction[];
  for (const action of actions) {
    try {
      await runAction(action, payload);
    } catch (err) {
      logger.warn({ err, automationId: row.id, action }, "automation action failed");
    }
  }
  await db
    .update(automationsTable)
    .set({
      runCount: sql`${automationsTable.runCount} + 1`,
      lastRunAt: new Date(),
    })
    .where(eq(automationsTable.id, row.id));
}
