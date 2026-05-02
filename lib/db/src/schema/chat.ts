import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const chatThreadsTable = pgTable(
  "chat_threads",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    token: varchar("token").notNull().unique(),
    visitorName: varchar("visitor_name").notNull(),
    visitorWhatsapp: varchar("visitor_whatsapp"),
    visitorEmail: varchar("visitor_email"),
    lang: varchar("lang").$type<"ar" | "en">().notNull().default("ar"),
    status: varchar("status")
      .$type<"open" | "closed">()
      .notNull()
      .default("open"),
    unreadForAdmin: integer("unread_for_admin").notNull().default(0),
    unreadForVisitor: integer("unread_for_visitor").notNull().default(0),
    pageUrl: text("page_url"),
    userAgent: text("user_agent"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    byLastMessage: index("chat_threads_last_msg_idx").on(t.lastMessageAt),
    byStatus: index("chat_threads_status_idx").on(t.status),
  }),
);

export const chatMessagesTable = pgTable(
  "chat_messages",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    threadId: varchar("thread_id")
      .notNull()
      .references(() => chatThreadsTable.id, { onDelete: "cascade" }),
    sender: varchar("sender")
      .$type<"visitor" | "team" | "system">()
      .notNull(),
    body: text("body").notNull(),
    channel: varchar("channel")
      .$type<"web" | "whatsapp" | "email">()
      .notNull()
      .default("web"),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    byThread: index("chat_messages_thread_idx").on(t.threadId, t.createdAt),
  }),
);

export type ChatThread = typeof chatThreadsTable.$inferSelect;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
