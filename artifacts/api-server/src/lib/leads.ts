import { and, eq, or, sql } from "drizzle-orm";
import {
  db,
  leadsTable,
  leadActivitiesTable,
  tasksTable,
  type Lead,
  type LeadStatus,
  type LeadSource,
  type LeadActivityKind,
} from "@workspace/db";
import { toWaPhone } from "./phone.js";
import { runAutomations } from "./automations.js";

export type UpsertLeadInput = {
  fullName: string;
  phone?: string | null;
  email?: string | null;
  country?: string | null;
  source: LeadSource;
  interestProgramId?: string | null;
  interestProgramTitle?: string | null;
  ownerUserId?: string | null;
};

function normalizePhone(p?: string | null): string | null {
  if (!p) return null;
  const w = toWaPhone(p);
  return w.length >= 6 ? w : null;
}

function normalizeEmail(e?: string | null): string | null {
  if (!e) return null;
  const t = e.trim().toLowerCase();
  return t.length > 0 ? t : null;
}

/**
 * Find an existing lead matching the given phone or email, or create a new
 * one. Returns { lead, created }. Never throws on dup-key — falls back to
 * select after a race.
 */
export async function upsertLeadFromContact(
  input: UpsertLeadInput,
): Promise<{ lead: Lead; created: boolean }> {
  const phoneNorm = normalizePhone(input.phone);
  const emailLower = normalizeEmail(input.email);

  if (phoneNorm || emailLower) {
    const matches = await db
      .select()
      .from(leadsTable)
      .where(
        or(
          phoneNorm ? eq(leadsTable.phoneNormalized, phoneNorm) : sql`false`,
          emailLower ? eq(leadsTable.emailLower, emailLower) : sql`false`,
        ),
      )
      .limit(1);

    const existing = matches[0];
    if (existing) {
      // Patch any missing fields on the existing lead.
      const patch: Partial<typeof leadsTable.$inferInsert> = {};
      if (!existing.fullName && input.fullName) patch.fullName = input.fullName;
      if (!existing.phone && input.phone) {
        patch.phone = input.phone;
        patch.phoneNormalized = phoneNorm;
      }
      if (!existing.email && input.email) {
        patch.email = input.email;
        patch.emailLower = emailLower;
      }
      if (!existing.country && input.country) patch.country = input.country;
      if (!existing.interestProgramId && input.interestProgramId) {
        patch.interestProgramId = input.interestProgramId;
      }
      if (!existing.interestProgramTitle && input.interestProgramTitle) {
        patch.interestProgramTitle = input.interestProgramTitle;
      }
      if (Object.keys(patch).length > 0) {
        const [updated] = await db
          .update(leadsTable)
          .set(patch)
          .where(eq(leadsTable.id, existing.id))
          .returning();
        return { lead: updated, created: false };
      }
      return { lead: existing, created: false };
    }
  }

  const [created] = await db
    .insert(leadsTable)
    .values({
      fullName: input.fullName || (input.email ?? input.phone ?? "بدون اسم"),
      phone: input.phone ?? null,
      phoneNormalized: phoneNorm,
      email: input.email ?? null,
      emailLower,
      country: input.country ?? null,
      source: input.source,
      interestProgramId: input.interestProgramId ?? null,
      interestProgramTitle: input.interestProgramTitle ?? null,
      ownerUserId: input.ownerUserId ?? null,
      status: "new",
      interestScore: "warm",
    })
    .returning();

  await db.insert(leadActivitiesTable).values({
    leadId: created.id,
    type: "created",
    summaryAr: `تم إنشاء العميل المحتمل من المصدر: ${input.source}`,
    payload: { source: input.source },
  });

  return { lead: created, created: true };
}

export type ActivityInput = {
  leadId: string;
  type: LeadActivityKind | string;
  summaryAr?: string;
  payload?: Record<string, unknown>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actorUserId?: string;
  actorEmail?: string;
};

export async function recordLeadActivity(input: ActivityInput): Promise<void> {
  await db.insert(leadActivitiesTable).values({
    leadId: input.leadId,
    type: input.type,
    summaryAr: input.summaryAr ?? null,
    payload: input.payload ?? null,
    relatedEntityType: input.relatedEntityType ?? null,
    relatedEntityId: input.relatedEntityId ?? null,
    actorUserId: input.actorUserId ?? null,
    actorEmail: input.actorEmail ?? null,
  });
  // Touch the lead so list ordering reflects recent activity.
  await db
    .update(leadsTable)
    .set({ lastContactAt: new Date() })
    .where(eq(leadsTable.id, input.leadId));
}

export async function setLeadStatus(
  leadId: string,
  newStatus: LeadStatus,
  actor?: { userId?: string; email?: string },
): Promise<Lead | null> {
  const [current] = await db
    .select()
    .from(leadsTable)
    .where(eq(leadsTable.id, leadId))
    .limit(1);
  if (!current) return null;
  if (current.status === newStatus) return current;

  const [updated] = await db
    .update(leadsTable)
    .set({
      status: newStatus,
      lastStatusChangeAt: new Date(),
    })
    .where(eq(leadsTable.id, leadId))
    .returning();

  await recordLeadActivity({
    leadId,
    type: "status_changed",
    summaryAr: `تغيّر الحالة من "${current.status}" إلى "${newStatus}"`,
    payload: { from: current.status, to: newStatus },
    actorUserId: actor?.userId,
    actorEmail: actor?.email,
  });

  // Fire automations.
  runAutomations("lead.status_changed", {
    leadId,
    from: current.status,
    to: newStatus,
  }).catch(() => {});

  return updated;
}

/**
 * Convenience helper: register a lead from a public form, log a "linked"
 * activity, and trigger downstream automations. Use this instead of calling
 * the lower-level helpers individually from form handlers.
 */
export async function registerLeadFromForm(opts: {
  contact: UpsertLeadInput;
  activity: {
    type: LeadActivityKind;
    summaryAr: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    payload?: Record<string, unknown>;
  };
  trigger?: string;
  triggerPayload?: Record<string, unknown>;
}): Promise<{ leadId: string; created: boolean }> {
  const { lead, created } = await upsertLeadFromContact(opts.contact);
  await recordLeadActivity({
    leadId: lead.id,
    type: opts.activity.type,
    summaryAr: opts.activity.summaryAr,
    relatedEntityType: opts.activity.relatedEntityType,
    relatedEntityId: opts.activity.relatedEntityId,
    payload: opts.activity.payload,
  });

  if (created) {
    runAutomations("lead.created", { leadId: lead.id, source: opts.contact.source }).catch(
      () => {},
    );
  }
  if (opts.trigger) {
    runAutomations(opts.trigger, { leadId: lead.id, ...(opts.triggerPayload ?? {}) }).catch(
      () => {},
    );
  }
  return { leadId: lead.id, created };
}

export async function createTaskForLead(opts: {
  leadId: string;
  title: string;
  description?: string;
  dueInDays?: number;
  priority?: "low" | "medium" | "high";
  assigneeUserId?: string | null;
  sourceType?: string;
  sourceId?: string;
}): Promise<void> {
  const dueAt =
    typeof opts.dueInDays === "number"
      ? new Date(Date.now() + opts.dueInDays * 86400_000)
      : null;
  const [task] = await db
    .insert(tasksTable)
    .values({
      title: opts.title,
      description: opts.description ?? null,
      leadId: opts.leadId,
      assigneeUserId: opts.assigneeUserId ?? null,
      dueAt,
      priority: opts.priority ?? "medium",
      status: "open",
      sourceType: opts.sourceType ?? "automation",
      sourceId: opts.sourceId ?? null,
    })
    .returning();

  await recordLeadActivity({
    leadId: opts.leadId,
    type: "task_created",
    summaryAr: `تم إنشاء مهمة: ${opts.title}`,
    relatedEntityType: "task",
    relatedEntityId: task.id,
  });
}

export { normalizePhone, normalizeEmail };
