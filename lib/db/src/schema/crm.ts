import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

// ── Leads ───────────────────────────────────────────────────────────────
// Central CRM record per prospect/customer. Every public form (enrollment,
// workbook order, speech eval, chat, consultation, certificate verify) feeds
// here, deduplicated by normalized phone or lowercase email.
export const leadsTable = pgTable(
  "leads",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    fullName: varchar("full_name").notNull(),
    phone: varchar("phone"),
    phoneNormalized: varchar("phone_normalized"),
    email: varchar("email"),
    emailLower: varchar("email_lower"),
    country: varchar("country"),
    // Origin source — one of:
    // interest_form | speech_evaluation | workbook_order | consultation
    // | live_chat | certificate_verify | whatsapp | enrollment | other
    source: varchar("source").notNull().default("other"),
    // Program of interest (loose ref, can be a course id or a freeform key).
    interestProgramId: varchar("interest_program_id"),
    interestProgramTitle: varchar("interest_program_title"),
    // Pipeline status — matches Kanban columns:
    // new | contacted | interested | consultation | offer_sent
    // | awaiting_payment | paid | student | not_qualified
    status: varchar("status").notNull().default("new"),
    // Hot/warm/cold scoring.
    interestScore: varchar("interest_score").$type<"hot" | "warm" | "cold">().default("warm"),
    // Assigned salesperson/trainer (FK to users).
    ownerUserId: varchar("owner_user_id").references(() => usersTable.id, { onDelete: "set null" }),
    // Last contact timestamp + next follow-up.
    lastContactAt: timestamp("last_contact_at", { withTimezone: true }),
    nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),
    // Internal admin-only notes.
    internalNotes: text("internal_notes"),
    // Optional graduating event — when the lead converted to student.
    convertedToUserId: varchar("converted_to_user_id").references(() => usersTable.id, { onDelete: "set null" }),
    convertedAt: timestamp("converted_at", { withTimezone: true }),
    // If the lead came from "becoming stale" automation, mark when it last
    // changed pipeline state so the 7-day-stale rule can run.
    lastStatusChangeAt: timestamp("last_status_change_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("IDX_leads_status").on(t.status),
    index("IDX_leads_owner").on(t.ownerUserId),
    index("IDX_leads_source").on(t.source),
    index("IDX_leads_phone_norm").on(t.phoneNormalized),
    index("IDX_leads_email_lower").on(t.emailLower),
    index("IDX_leads_next_followup").on(t.nextFollowUpAt),
  ],
);

// ── Lead activities (timeline) ───────────────────────────────────────────
// Append-only audit trail per lead. Used by the lead detail page and to
// power overview KPIs (e.g. "follow-ups today").
export const leadActivitiesTable = pgTable(
  "lead_activities",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    leadId: varchar("lead_id")
      .notNull()
      .references(() => leadsTable.id, { onDelete: "cascade" }),
    // Activity types: created | status_changed | note_added | task_created
    // | task_completed | linked_enrollment | linked_workbook_order
    // | linked_speech_evaluation | linked_chat | whatsapp_opened
    // | converted_to_student | follow_up_scheduled
    type: varchar("type").notNull(),
    // Free-form Arabic summary shown in the timeline.
    summaryAr: text("summary_ar"),
    // Structured payload (e.g. { from: "new", to: "interested" }).
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    // Optional links to source rows so the timeline can deep-link.
    relatedEntityType: varchar("related_entity_type"),
    relatedEntityId: varchar("related_entity_id"),
    // Who created the activity (null = system/automation).
    actorUserId: varchar("actor_user_id").references(() => usersTable.id, { onDelete: "set null" }),
    actorEmail: varchar("actor_email"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("IDX_lead_activities_lead").on(t.leadId),
    index("IDX_lead_activities_created").on(t.createdAt),
  ],
);

// ── Tasks ────────────────────────────────────────────────────────────────
// Internal task list — both manual and automation-generated.
export const tasksTable = pgTable(
  "tasks",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title").notNull(),
    description: text("description"),
    leadId: varchar("lead_id").references(() => leadsTable.id, { onDelete: "set null" }),
    // The user the task is assigned to.
    assigneeUserId: varchar("assignee_user_id").references(() => usersTable.id, { onDelete: "set null" }),
    createdByUserId: varchar("created_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    priority: varchar("priority").$type<"low" | "medium" | "high">().notNull().default("medium"),
    // open | in_progress | done | snoozed
    status: varchar("status").notNull().default("open"),
    // Optional source so we can show e.g. "auto-created from speech eval".
    sourceType: varchar("source_type"),
    sourceId: varchar("source_id"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("IDX_tasks_assignee").on(t.assigneeUserId),
    index("IDX_tasks_lead").on(t.leadId),
    index("IDX_tasks_status").on(t.status),
    index("IDX_tasks_due").on(t.dueAt),
  ],
);

// ── Automations ──────────────────────────────────────────────────────────
// Lightweight rules engine: when `trigger` fires, if `conditions` match,
// the listed `actions` are run (e.g. create_task with a template).
export const automationsTable = pgTable(
  "automations",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name").notNull(),
    descriptionAr: text("description_ar"),
    // Trigger event keys:
    // lead.created | lead.status_changed | lead.stale_7d
    // | speech_evaluation.created | workbook_order.created
    // | enrollment.created | chat.message_received
    trigger: varchar("trigger").notNull(),
    // Optional JSON conditions, e.g. { status: "interested" }.
    conditions: jsonb("conditions").$type<Record<string, unknown>>(),
    // Ordered list of actions, e.g.
    // [{ type: "create_task", title: "...", offsetDays: 2, assigneeRole: "sales" }]
    actions: jsonb("actions").$type<Array<Record<string, unknown>>>().notNull(),
    isActive: boolean("is_active").notNull().default(true),
    // Stats for the admin UI.
    runCount: integer("run_count").notNull().default(0),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("IDX_automations_trigger").on(t.trigger),
    index("IDX_automations_active").on(t.isActive),
  ],
);

// ── Message templates (WhatsApp / generic) ──────────────────────────────
// Editable templates with {placeholder} variables. Used by the lead detail
// page to open wa.me with a prefilled message — never auto-sent.
export const messageTemplatesTable = pgTable(
  "message_templates",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    // Stable key so the UI can find/seed defaults: e.g. "enrollment_received".
    key: varchar("key").notNull(),
    titleAr: varchar("title_ar").notNull(),
    bodyAr: text("body_ar").notNull(),
    // Optional English variant.
    titleEn: varchar("title_en"),
    bodyEn: text("body_en"),
    // List of placeholder names found in the body, for the editor preview.
    placeholders: jsonb("placeholders").$type<string[]>(),
    channel: varchar("channel").$type<"whatsapp" | "email" | "internal">().notNull().default("whatsapp"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("UQ_message_templates_key").on(t.key)],
);

// ── Funnels ──────────────────────────────────────────────────────────────
// Conversion-tracking definition. Steps reference event keys we already
// emit (lead source, lead status, lead activity types). The admin page
// computes counts on the fly from leads + lead_activities.
export const funnelsTable = pgTable(
  "funnels",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    key: varchar("key").notNull(),
    nameAr: varchar("name_ar").notNull(),
    descriptionAr: text("description_ar"),
    // The lead.source value this funnel filters by (e.g. "speech_evaluation").
    sourceFilter: varchar("source_filter"),
    // Ordered step list. Each step has:
    //   { id, labelAr, kind: "lead_source" | "lead_status" | "activity_type"
    //     | "task_completed" | "conversion", value: string }
    steps: jsonb("steps").$type<Array<Record<string, unknown>>>().notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("UQ_funnels_key").on(t.key)],
);

// ── Consultation bookings ───────────────────────────────────────────────
// Public form bookings collected from /consultation. Each booking always
// upserts a Lead and creates a follow-up task.
export const consultationBookingsTable = pgTable(
  "consultation_bookings",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    leadId: varchar("lead_id").references(() => leadsTable.id, { onDelete: "set null" }),
    fullName: varchar("full_name").notNull(),
    email: varchar("email").notNull(),
    phone: varchar("phone").notNull(),
    consultationType: varchar("consultation_type"),
    interestProgramId: varchar("interest_program_id"),
    interestProgramTitle: varchar("interest_program_title"),
    preferredDate: varchar("preferred_date"),
    preferredTime: varchar("preferred_time"),
    notes: text("notes"),
    status: varchar("status").$type<"requested" | "confirmed" | "completed" | "cancelled">().notNull().default("requested"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("IDX_consult_lead").on(t.leadId),
    index("IDX_consult_status").on(t.status),
  ],
);

// Cross-link helpers: which entity types a lead can be related to.
// Used by the lead detail page when rendering "linked records".
export type LeadActivityKind =
  | "created"
  | "status_changed"
  | "note_added"
  | "task_created"
  | "task_completed"
  | "linked_enrollment"
  | "linked_workbook_order"
  | "linked_speech_evaluation"
  | "linked_chat"
  | "linked_consultation"
  | "linked_certificate_verify"
  | "whatsapp_opened"
  | "converted_to_student"
  | "follow_up_scheduled";

export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "consultation"
  | "offer_sent"
  | "awaiting_payment"
  | "paid"
  | "student"
  | "not_qualified";

export type LeadSource =
  | "interest_form"
  | "speech_evaluation"
  | "workbook_order"
  | "consultation"
  | "live_chat"
  | "certificate_verify"
  | "whatsapp"
  | "enrollment"
  | "other";

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "interested",
  "consultation",
  "offer_sent",
  "awaiting_payment",
  "paid",
  "student",
  "not_qualified",
];

export const LEAD_SOURCES: LeadSource[] = [
  "interest_form",
  "speech_evaluation",
  "workbook_order",
  "consultation",
  "live_chat",
  "certificate_verify",
  "whatsapp",
  "enrollment",
  "other",
];

export type Lead = typeof leadsTable.$inferSelect;
export type LeadActivity = typeof leadActivitiesTable.$inferSelect;
export type Task = typeof tasksTable.$inferSelect;
export type Automation = typeof automationsTable.$inferSelect;
export type MessageTemplate = typeof messageTemplatesTable.$inferSelect;
export type Funnel = typeof funnelsTable.$inferSelect;
export type ConsultationBooking = typeof consultationBookingsTable.$inferSelect;
