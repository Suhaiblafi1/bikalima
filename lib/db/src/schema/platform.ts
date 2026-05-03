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
import { lessonsTable } from "./lms";

// ── Badges & achievements ───────────────────────────────────────────────
// Static catalog of badges a learner can earn. Seeded once by the api
// server on startup; admins can edit copy later.
export const badgeDefinitionsTable = pgTable("badge_definitions", {
  key: varchar("key").primaryKey(),
  titleAr: varchar("title_ar").notNull(),
  titleEn: varchar("title_en").notNull(),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  icon: varchar("icon").notNull().default("award"),
  colorClass: varchar("color_class").notNull().default("bg-amber-100 text-amber-700"),
  eventName: varchar("event_name").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userBadgesTable = pgTable(
  "user_badges",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    badgeKey: varchar("badge_key").notNull().references(() => badgeDefinitionsTable.key, { onDelete: "cascade" }),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("UQ_user_badges_user_badge").on(t.userId, t.badgeKey),
    index("IDX_user_badges_user").on(t.userId),
  ],
);

// ── Live-session attendance ─────────────────────────────────────────────
// One row per (lesson, user) marking presence. Lessons that don't represent
// a live session simply have no rows.
export const lessonSessionAttendanceTable = pgTable(
  "lesson_session_attendance",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    lessonId: varchar("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    status: varchar("status").$type<"present" | "absent" | "excused">().notNull(),
    note: text("note"),
    markedById: varchar("marked_by_id").references(() => usersTable.id, { onDelete: "set null" }),
    markedAt: timestamp("marked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("UQ_attendance_lesson_user").on(t.lessonId, t.userId),
    index("IDX_attendance_user").on(t.userId),
    index("IDX_attendance_lesson").on(t.lessonId),
  ],
);

// ── Feature flags ───────────────────────────────────────────────────────
// Single global value per key. Defaults to enabled when no row exists.
export const featureFlagsTable = pgTable("feature_flags", {
  key: varchar("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(true),
  descriptionAr: varchar("description_ar"),
  descriptionEn: varchar("description_en"),
  updatedById: varchar("updated_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ── Structured audit log ────────────────────────────────────────────────
// Coexists with the simpler `admin_activities` table for backwards
// compatibility; new write paths should call `recordAuditLog()` which
// writes here AND can include a structured before/after diff.
export const auditLogEntriesTable = pgTable(
  "audit_log_entries",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    actorUserId: varchar("actor_user_id").references(() => usersTable.id, { onDelete: "set null" }),
    actorEmail: varchar("actor_email"),
    action: varchar("action").notNull(),
    entityType: varchar("entity_type").notNull(),
    entityId: varchar("entity_id"),
    description: text("description"),
    beforeJson: jsonb("before_json"),
    afterJson: jsonb("after_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("IDX_audit_log_created").on(t.createdAt),
    index("IDX_audit_log_actor").on(t.actorUserId),
    index("IDX_audit_log_entity").on(t.entityType, t.entityId),
  ],
);

// ── Public impact page ──────────────────────────────────────────────────
// Optional admin override of the four headline numbers (override is a
// string for flexibility, e.g. "+1500"). Real counts live in their own
// tables and are fetched at request time; the override only takes effect
// when present.
export const impactStatsOverridesTable = pgTable("impact_stats_overrides", {
  key: varchar("key").primaryKey(),
  labelAr: varchar("label_ar").notNull(),
  labelEn: varchar("label_en").notNull(),
  overrideValue: varchar("override_value"),
  displayOrder: integer("display_order").notNull().default(0),
  updatedById: varchar("updated_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const transformationStoriesTable = pgTable(
  "transformation_stories",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name").notNull(),
    roleAr: varchar("role_ar"),
    roleEn: varchar("role_en"),
    quoteAr: text("quote_ar").notNull(),
    quoteEn: text("quote_en"),
    photoUrl: varchar("photo_url"),
    displayOrder: integer("display_order").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("IDX_stories_published_order").on(t.isPublished, t.displayOrder)],
);

export type BadgeDefinition = typeof badgeDefinitionsTable.$inferSelect;
export type UserBadge = typeof userBadgesTable.$inferSelect;
export type LessonSessionAttendance = typeof lessonSessionAttendanceTable.$inferSelect;
export type FeatureFlag = typeof featureFlagsTable.$inferSelect;
export type AuditLogEntry = typeof auditLogEntriesTable.$inferSelect;
export type ImpactStatsOverride = typeof impactStatsOverridesTable.$inferSelect;
export type TransformationStory = typeof transformationStoriesTable.$inferSelect;
