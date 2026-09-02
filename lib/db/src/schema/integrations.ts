import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, timestamp, varchar, text } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { fieldMediaTable } from "./lms";

export const integrationSyncEventsTable = pgTable("integration_sync_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: varchar("provider").notNull(),
  entityType: varchar("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  action: varchar("action").notNull(),
  status: varchar("status").$type<"pending" | "success" | "error" | "skipped">().notNull().default("pending"),
  externalId: varchar("external_id"),
  errorMessage: text("error_message"),
  payload: jsonb("payload"),
  response: jsonb("response"),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type IntegrationSyncEvent = typeof integrationSyncEventsTable.$inferSelect;

/**
 * One row per generated short video (MiniMax H3 and anything that replaces
 * it later), from the moment the request is accepted to the moment a file
 * URL comes back.
 *
 * The row exists because generation is asynchronous, billed per second, and
 * moderated upstream: the provider answers with a task id and nothing else,
 * so without a local record a paid job becomes unfindable the moment the
 * admin closes the tab. `external_task_id` is what the reconciler polls,
 * `prompt` and `conditions` are what let a good result be reproduced, and
 * `usage` is what makes the invoice explainable.
 *
 * `video_url` is a provider-hosted, short-lived link — treat it as a
 * download source, not as storage. Anything worth keeping must be copied
 * into our own bucket before the link expires.
 */
export const videoGenerationJobsTable = pgTable(
  "video_generation_jobs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    provider: varchar("provider", { length: 32 }).notNull().default("minimax"),
    model: varchar("model", { length: 64 }).notNull(),
    // Null only in the window between accepting the request and the provider
    // answering, and permanently null when that call failed outright.
    externalTaskId: varchar("external_task_id", { length: 128 }),
    status: varchar("status", { length: 16 })
      .$type<"queued" | "running" | "succeeded" | "failed" | "cancelled">()
      .notNull()
      .default("queued"),
    // Free-form label for what the clip is for ("video_library", "promo",
    // "gallery"), so a month of jobs can be read back by intent.
    purpose: varchar("purpose", { length: 40 }),
    prompt: text("prompt").notNull(),
    resolution: varchar("resolution", { length: 8 }).notNull(),
    duration: integer("duration").notNull(),
    ratio: varchar("ratio", { length: 16 }).notNull(),
    conditions: jsonb("conditions").$type<Array<Record<string, unknown>>>(),
    videoUrl: text("video_url"),
    // Our own copy, once the clip has been saved: `stored_url` is what the
    // site may link to indefinitely, `stored_key` is the object behind it
    // (kept so the file can be found or removed later without parsing a
    // URL), and `field_media_id` is the media-library row it became.
    storedUrl: text("stored_url"),
    storedKey: text("stored_key"),
    fieldMediaId: varchar("field_media_id").references(() => fieldMediaTable.id, {
      onDelete: "set null",
    }),
    usage: jsonb("usage").$type<Record<string, unknown>>(),
    errorMessage: text("error_message"),
    requestedById: varchar("requested_by_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    // The reconciler's query: unfinished jobs, oldest first.
    index("idx_video_generation_jobs_status").on(t.status, t.createdAt),
    index("idx_video_generation_jobs_task").on(t.externalTaskId),
    index("idx_video_generation_jobs_requester").on(t.requestedById),
    index("idx_video_generation_jobs_field_media").on(t.fieldMediaId),
  ],
);

export type VideoGenerationJob = typeof videoGenerationJobsTable.$inferSelect;
export type VideoGenerationJobStatus = VideoGenerationJob["status"];
