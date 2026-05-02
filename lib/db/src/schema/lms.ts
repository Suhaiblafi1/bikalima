import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, timestamp, uniqueIndex, varchar, text, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const instructorsTable = pgTable("instructors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameAr: varchar("name_ar").notNull(),
  nameEn: varchar("name_en").notNull(),
  bioAr: text("bio_ar"),
  bioEn: text("bio_en"),
  photoUrl: varchar("photo_url"),
  email: varchar("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const coursesTable = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programId: varchar("program_id"),
  slug: varchar("slug"),
  titleAr: varchar("title_ar").notNull(),
  titleEn: varchar("title_en").notNull(),
  titleFr: varchar("title_fr").notNull(),
  subtitleAr: varchar("subtitle_ar"),
  subtitleEn: varchar("subtitle_en"),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  descriptionFr: text("description_fr"),
  imageUrl: varchar("image_url"),
  trailerUrl: varchar("trailer_url"),
  price: integer("price"),
  discountPrice: integer("discount_price"),
  level: varchar("level").$type<"beginner" | "intermediate" | "advanced">(),
  language: varchar("language").default("ar"),
  category: varchar("category"),
  instructorId: varchar("instructor_id").references(() => instructorsTable.id, { onDelete: "set null" }),
  whatYouLearnAr: jsonb("what_you_learn_ar").$type<string[]>(),
  whatYouLearnEn: jsonb("what_you_learn_en").$type<string[]>(),
  requirementsAr: jsonb("requirements_ar").$type<string[]>(),
  requirementsEn: jsonb("requirements_en").$type<string[]>(),
  targetAudienceAr: text("target_audience_ar"),
  targetAudienceEn: text("target_audience_en"),
  seoTitle: varchar("seo_title"),
  seoDescription: text("seo_description"),
  isFeatured: boolean("is_featured").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const courseSectionsTable = pgTable("course_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  titleAr: varchar("title_ar").notNull(),
  titleEn: varchar("title_en").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessonsTable = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  sectionId: varchar("section_id").references(() => courseSectionsTable.id, { onDelete: "set null" }),
  titleAr: varchar("title_ar").notNull(),
  titleEn: varchar("title_en").notNull(),
  titleFr: varchar("title_fr").notNull(),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  videoUrl: varchar("video_url"),
  videoType: varchar("video_type").$type<"youtube" | "vimeo" | "other">().default("youtube"),
  durationMinutes: integer("duration_minutes"),
  sortOrder: integer("sort_order").notNull().default(0),
  isFreePreview: boolean("is_free_preview").notNull().default(false),
  resources: jsonb("resources").$type<{ titleAr: string; titleEn: string; url: string; type?: string }[]>(),
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

export const lessonNotesTable = pgTable("lesson_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  lessonId: varchar("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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
  status: varchar("status").$type<"new" | "pending" | "contacted" | "approved" | "rejected">().notNull().default("pending"),
  adminNotes: text("admin_notes"),
  formData: jsonb("form_data"),
  externalCrmId: varchar("external_crm_id"),
  aiAnalysisStatus: varchar("ai_analysis_status").$type<"none" | "pending" | "running" | "done" | "error">().default("none"),
  aiAnalysisResult: jsonb("ai_analysis_result"),
  assignedTrainerId: varchar("assigned_trainer_id").references(() => instructorsTable.id, { onDelete: "set null" }),
  leadSource: varchar("lead_source"),
  syncStatus: varchar("sync_status").$type<"pending" | "synced" | "error" | "skipped">().default("pending"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
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
  buyerCountry: varchar("buyer_country"),
  notes: text("notes"),
  deliveryAddress: text("delivery_address"),
  totalPrice: integer("total_price"),
  currency: varchar("currency").default("JOD"),
  status: varchar("status").$type<"pending" | "confirmed" | "shipped" | "delivered">().notNull().default("pending"),
  adminNotes: text("admin_notes"),
  externalCrmId: varchar("external_crm_id"),
  leadSource: varchar("lead_source"),
  syncStatus: varchar("sync_status").$type<"pending" | "synced" | "error" | "skipped">().default("pending"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const speechEvaluationsTable = pgTable("speech_evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  fullName: varchar("full_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  videoUrl: varchar("video_url"),
  audioUrl: varchar("audio_url"),
  speechTopic: varchar("speech_topic"),
  speechLanguage: varchar("speech_language"),
  notes: text("notes"),
  status: varchar("status").$type<"pending" | "in_review" | "completed" | "converted" | "cancelled">().notNull().default("pending"),
  externalCrmId: varchar("external_crm_id"),
  aiAnalysisStatus: varchar("ai_analysis_status").$type<"none" | "pending" | "running" | "done" | "error">().default("none"),
  aiAnalysisResult: jsonb("ai_analysis_result"),
  transcriptText: text("transcript_text"),
  trainerScore: integer("trainer_score"),
  trainerFeedback: text("trainer_feedback"),
  assignedTrainerId: varchar("assigned_trainer_id").references(() => instructorsTable.id, { onDelete: "set null" }),
  leadSource: varchar("lead_source"),
  syncStatus: varchar("sync_status").$type<"pending" | "synced" | "error" | "skipped">().default("pending"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ordersTable = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  courseId: varchar("course_id").references(() => coursesTable.id, { onDelete: "set null" }),
  buyerName: varchar("buyer_name").notNull(),
  buyerEmail: varchar("buyer_email").notNull(),
  buyerPhone: varchar("buyer_phone").notNull(),
  amount: integer("amount"),
  currency: varchar("currency").default("JOD"),
  status: varchar("status").notNull().default("pending"),
  paymentNotes: text("payment_notes"),
  adminNotes: text("admin_notes"),
  adminApprovedBy: varchar("admin_approved_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviewsTable = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  courseId: varchar("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  commentAr: text("comment_ar"),
  commentEn: text("comment_en"),
  reviewerName: varchar("reviewer_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assignmentsTable = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => coursesTable.id, { onDelete: "cascade" }),
  titleAr: varchar("title_ar").notNull(),
  titleEn: varchar("title_en"),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  isPublished: boolean("is_published").notNull().default(true),
  createdById: varchar("created_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const assignmentSubmissionsTable = pgTable("assignment_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull().references(() => assignmentsTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  submissionType: varchar("submission_type").$type<"youtube" | "video_url" | "text">().notNull(),
  submissionUrl: varchar("submission_url"),
  submissionText: text("submission_text"),
  status: varchar("status").$type<"submitted" | "reviewed">().notNull().default("submitted"),
  clarityScore: integer("clarity_score"),
  structureScore: integer("structure_score"),
  openingScore: integer("opening_score"),
  voiceScore: integer("voice_score"),
  bodyLanguageScore: integer("body_language_score"),
  conclusionScore: integer("conclusion_score"),
  impactScore: integer("impact_score"),
  totalScore: integer("total_score"),
  trainerFeedback: text("trainer_feedback"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedById: varchar("reviewed_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index("IDX_submission_user").on(t.userId),
  index("IDX_submission_assignment").on(t.assignmentId),
  uniqueIndex("UQ_submission_assignment_user").on(t.assignmentId, t.userId),
]);

export const courseTrainersTable = pgTable("course_trainers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("IDX_course_trainers_course").on(t.courseId),
  index("IDX_course_trainers_user").on(t.userId),
  uniqueIndex("UQ_course_trainers_course_user").on(t.courseId, t.userId),
]);

export type CourseTrainer = typeof courseTrainersTable.$inferSelect;
export type Instructor = typeof instructorsTable.$inferSelect;
export type Course = typeof coursesTable.$inferSelect;
export type CourseSection = typeof courseSectionsTable.$inferSelect;
export type Lesson = typeof lessonsTable.$inferSelect;
export type Enrollment = typeof enrollmentsTable.$inferSelect;
export type LessonProgress = typeof lessonProgressTable.$inferSelect;
export type LessonNote = typeof lessonNotesTable.$inferSelect;
export type EnrollmentRequest = typeof enrollmentRequestsTable.$inferSelect;
export type WorkbookOrder = typeof workbookOrdersTable.$inferSelect;
export const siteSettingsTable = pgTable("site_settings", {
  id: varchar("id").primaryKey().default("default"),
  siteNameAr: varchar("site_name_ar"),
  siteNameEn: varchar("site_name_en"),
  defaultLang: varchar("default_lang").$type<"ar" | "en">().default("ar"),
  defaultCurrency: varchar("default_currency").default("USD"),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  whatsappNumber: varchar("whatsapp_number"),
  facebookUrl: varchar("facebook_url"),
  instagramUrl: varchar("instagram_url"),
  youtubeUrl: varchar("youtube_url"),
  twitterUrl: varchar("twitter_url"),
  privacyPolicyAr: text("privacy_policy_ar"),
  privacyPolicyEn: text("privacy_policy_en"),
  termsAr: text("terms_ar"),
  termsEn: text("terms_en"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type SpeechEvaluation = typeof speechEvaluationsTable.$inferSelect;
export type Order = typeof ordersTable.$inferSelect;
export type Review = typeof reviewsTable.$inferSelect;
export type Assignment = typeof assignmentsTable.$inferSelect;
export type AssignmentSubmission = typeof assignmentSubmissionsTable.$inferSelect;
export type SiteSettings = typeof siteSettingsTable.$inferSelect;
