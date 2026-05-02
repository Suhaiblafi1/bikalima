import { sql } from "drizzle-orm";
import { jsonb, pgTable, timestamp, varchar, text } from "drizzle-orm/pg-core";

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
