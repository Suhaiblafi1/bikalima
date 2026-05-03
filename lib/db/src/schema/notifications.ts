import { sql } from "drizzle-orm";
import { index, pgTable, timestamp, varchar, text } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const notificationsTable = pgTable(
  "notifications",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 32 }).notNull(),
    titleAr: varchar("title_ar").notNull(),
    titleEn: varchar("title_en").notNull(),
    bodyAr: text("body_ar"),
    bodyEn: text("body_en"),
    link: varchar("link"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("IDX_notif_user_created").on(t.userId, t.createdAt),
    index("IDX_notif_user_unread").on(t.userId, t.readAt),
  ],
);

export type Notification = typeof notificationsTable.$inferSelect;
export type NewNotification = typeof notificationsTable.$inferInsert;
