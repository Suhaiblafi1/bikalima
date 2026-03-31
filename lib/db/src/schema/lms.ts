import { sql } from "drizzle-orm";
import { integer, jsonb, pgTable, timestamp, varchar, text, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const coursesTable = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programId: varchar("program_id"),
  titleAr: varchar("title_ar").notNull(),
  titleEn: varchar("title_en").notNull(),
  titleFr: varchar("title_fr").notNull(),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  descriptionFr: text("description_fr"),
  imageUrl: varchar("image_url"),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const lessonsTable = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  titleAr: varchar("title_ar").notNull(),
  titleEn: varchar("title_en").notNull(),
  titleFr: varchar("title_fr").notNull(),
  videoUrl: varchar("video_url"),
  videoType: varchar("video_type").$type<"youtube" | "vimeo" | "other">().default("youtube"),
  durationMinutes: integer("duration_minutes"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const enrollmentsTable = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  courseId: varchar("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  status: varchar("status").$type<"active" | "completed" | "suspended">().notNull().default("active"),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessonProgressTable = pgTable("lesson_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  lessonId: varchar("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const enrollmentRequestsTable = pgTable("enrollment_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  applicantType: varchar("applicant_type").$type<"individual" | "institution">().notNull(),
  fullName: varchar("full_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  programId: varchar("program_id").notNull(),
  trainingType: varchar("training_type"),
  privateMode: varchar("private_mode"),
  youtubeLink: varchar("youtube_link"),
  discountCode: varchar("discount_code"),
  institutionName: varchar("institution_name"),
  studentCount: integer("student_count"),
  teacherCount: integer("teacher_count"),
  workbooksNeeded: integer("workbooks_needed"),
  message: text("message"),
  status: varchar("status").$type<"pending" | "approved" | "rejected">().notNull().default("pending"),
  adminNotes: text("admin_notes"),
  formData: jsonb("form_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workbookOrdersTable = pgTable("workbook_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  workbookId: varchar("workbook_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  format: varchar("format").$type<"pdf" | "print">().notNull(),
  buyerName: varchar("buyer_name").notNull(),
  buyerEmail: varchar("buyer_email").notNull(),
  buyerPhone: varchar("buyer_phone").notNull(),
  deliveryAddress: text("delivery_address"),
  totalPrice: integer("total_price"),
  currency: varchar("currency").default("JOD"),
  status: varchar("status").$type<"pending" | "confirmed" | "shipped" | "delivered">().notNull().default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Course = typeof coursesTable.$inferSelect;
export type Lesson = typeof lessonsTable.$inferSelect;
export type Enrollment = typeof enrollmentsTable.$inferSelect;
export type LessonProgress = typeof lessonProgressTable.$inferSelect;
export type EnrollmentRequest = typeof enrollmentRequestsTable.$inferSelect;
export type WorkbookOrder = typeof workbookOrdersTable.$inferSelect;
