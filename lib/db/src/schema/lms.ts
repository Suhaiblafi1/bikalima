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
  // Structured rubric (multi-criteria) and final report. Populated by the
  // admin/trainer when grading. `overallScore` is recomputed server-side
  // from `rubricScores` so it stays consistent.
  rubricScores: jsonb("rubric_scores").$type<Record<string, number>>(),
  // Optional per-criterion qualitative notes keyed by the same criterion keys
  // as `rubricScores`. Surfaced to the learner alongside the published score.
  rubricNotes: jsonb("rubric_notes").$type<Record<string, string>>(),
  overallScore: integer("overall_score"),
  programRecommendation: varchar("program_recommendation").$type<"core" | "tot" | "teachers" | "children" | "none">(),
  finalReportMd: text("final_report_md"),
  reportPublishedAt: timestamp("report_published_at", { withTimezone: true }),
  assignedTrainerId: varchar("assigned_trainer_id").references(() => instructorsTable.id, { onDelete: "set null" }),
  // Optional FK to a *user* trainer (separate from `instructors` records,
  // which are public profiles). Used when assigning the evaluation to an
  // internal trainer account for scoping.
  assignedTrainerUserId: varchar("assigned_trainer_user_id").references(() => usersTable.id, { onDelete: "set null" }),
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

export const trainerLearnerNotesTable = pgTable("trainer_learner_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trainerId: varchar("trainer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  learnerId: varchar("learner_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  courseId: varchar("course_id").references(() => coursesTable.id, { onDelete: "set null" }),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index("IDX_trainer_notes_trainer").on(t.trainerId),
  index("IDX_trainer_notes_learner").on(t.learnerId),
]);

export type TrainerLearnerNote = typeof trainerLearnerNotesTable.$inferSelect;

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
  logoUrl: varchar("logo_url"),
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

// ── CMS: Home Page Sections ─────────────────────────────────────────────
// Editable overrides per section of the public home page. The runtime
// fallback (when no row exists) is the static translation copy.
export const homePageSectionsTable = pgTable("home_page_sections", {
  sectionKey: varchar("section_key").primaryKey(),
  contentAr: jsonb("content_ar").$type<Record<string, unknown>>(),
  contentEn: jsonb("content_en").$type<Record<string, unknown>>(),
  visible: boolean("visible").notNull().default(true),
  orderIndex: integer("order_index").notNull().default(0),
  status: varchar("status").$type<"draft" | "published">().notNull().default("published"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ── CMS: Workbooks (DB-backed catalog) ──────────────────────────────────
export const workbooksTable = pgTable("workbooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").notNull(),
  titleAr: varchar("title_ar").notNull(),
  titleEn: varchar("title_en"),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  priceJod: integer("price_jod"),
  coverImageUrl: varchar("cover_image_url"),
  samplePdfUrl: varchar("sample_pdf_url"),
  topicsAr: jsonb("topics_ar").$type<string[]>(),
  topicsEn: jsonb("topics_en").$type<string[]>(),
  format: varchar("format").$type<"digital" | "printed" | "both">().notNull().default("both"),
  linkedCourseId: varchar("linked_course_id").references(() => coursesTable.id, { onDelete: "set null" }),
  linkedProgramId: varchar("linked_program_id"),
  status: varchar("status").$type<"draft" | "published" | "hidden">().notNull().default("draft"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex("UQ_workbooks_slug").on(t.slug),
]);

// ── CMS: Field Media + embedded Media Analysis ──────────────────────────
// "من الميدان" library. Each row carries the media metadata AND optional
// training analysis (skill, what to observe, why it matters, etc).
export const fieldMediaTable = pgTable("field_media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mediaType: varchar("media_type").$type<"youtube" | "upload" | "image" | "instagram" | "tiktok">().notNull(),
  mediaUrl: text("media_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  titleAr: varchar("title_ar").notNull(),
  titleEn: varchar("title_en"),
  speakerName: varchar("speaker_name"),
  category: varchar("category"),
  targetSkill: varchar("target_skill"),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  linkedProgramId: varchar("linked_program_id"),
  linkedWorkbookId: varchar("linked_workbook_id").references(() => workbooksTable.id, { onDelete: "set null" }),
  placement: jsonb("placement").$type<string[]>(),
  status: varchar("status").$type<"draft" | "published" | "hidden">().notNull().default("draft"),
  orderIndex: integer("order_index").notNull().default(0),
  analysisSkill: varchar("analysis_skill"),
  analysisObserveAr: text("analysis_observe_ar"),
  analysisWhyAr: text("analysis_why_ar"),
  analysisLearnAr: text("analysis_learn_ar"),
  analysisMistakesAr: text("analysis_mistakes_ar"),
  analysisExerciseAr: text("analysis_exercise_ar"),
  analysisDifficulty: varchar("analysis_difficulty").$type<"beginner" | "intermediate" | "advanced">(),
  analysisLinkedTopic: varchar("analysis_linked_topic"),
  hasAnalysis: boolean("has_analysis").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index("IDX_field_media_status").on(t.status),
]);

// ── Certificates Registry ("سجل بكلمة للاعتماد والشهادات") ─────────────
// Stores trainee/trainer/teacher/etc. certificates issued by Bikalima with
// public verification (by code) and optional public graduate listing.
export const certificatesTable = pgTable("certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Public-facing verification code, e.g. "BK-CERT-2026-0001". Must be unique
  // and is what the visitor types into the /verify page.
  code: varchar("code").notNull(),
  fullName: varchar("full_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  country: varchar("country"),
  // Type of accreditation: trainee | trainer | teacher | child-facilitator
  // | ambassador | partner-institution.
  certType: varchar("cert_type").notNull(),
  // Linked Bikalima program/course (loose ref — can be a course id or a
  // freeform program identifier).
  programId: varchar("program_id"),
  programName: varchar("program_name"),
  issueDate: timestamp("issue_date", { withTimezone: true }).notNull().defaultNow(),
  expiryDate: timestamp("expiry_date", { withTimezone: true }),
  status: varchar("status").$type<"active" | "expired" | "under-review" | "suspended" | "revoked">().notNull().default("active"),
  // The trainer/evaluator who signed off (freeform name + optional FK).
  assessorName: varchar("assessor_name"),
  assessorUserId: varchar("assessor_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  internalNotes: text("internal_notes"),
  // PDF/image of the certificate (URL to object storage or external).
  certificateFileUrl: varchar("certificate_file_url"),
  graduateImageUrl: varchar("graduate_image_url"),
  // Whether to surface this graduate in the public /graduates registry.
  showInRegistry: boolean("show_in_registry").notNull().default(false),
  // Optional link to the platform user (so /me/certificates can list it).
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdBy: varchar("created_by").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex("UQ_certificates_code").on(t.code),
  index("IDX_certificates_status").on(t.status),
  index("IDX_certificates_user").on(t.userId),
]);

// ── Admin Activity Log (for Overview "Recent Activities") ───────────────
// ── Interactive Activities (Task #48) ───────────────────────────────────
// Each lesson has an ordered list of "activities". A lesson is considered
// completed once all required activities for that lesson are completed by the
// student. Existing video-only lessons get auto-converted to a single `video`
// activity so legacy progress keeps working.

export const ACTIVITY_TYPES = [
  "video",
  "text",
  "quiz",
  "reflection",
  "speech_builder",
  "voice_recording",
  "video_submission",
  "drag_drop",
  "scenario",
  "self_assessment",
  "coach_feedback",
  "challenge",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const lessonActivitiesTable = pgTable(
  "lesson_activities",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    lessonId: varchar("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 32 }).$type<ActivityType>().notNull(),
    titleAr: varchar("title_ar").notNull(),
    titleEn: varchar("title_en"),
    instructionsAr: text("instructions_ar"),
    instructionsEn: text("instructions_en"),
    // Free-form per-type config (questions list, video url, drag pairs, scenario steps, etc.)
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    sortOrder: integer("sort_order").notNull().default(0),
    isRequired: boolean("is_required").notNull().default(true),
    // Skill keys awarded on successful completion
    skillKeys: jsonb("skill_keys").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    pointsReward: integer("points_reward").notNull().default(10),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("idx_lesson_activities_lesson").on(t.lessonId, t.sortOrder)],
);

export const activitySubmissionsTable = pgTable(
  "activity_submissions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    activityId: varchar("activity_id").notNull().references(() => lessonActivitiesTable.id, { onDelete: "cascade" }),
    lessonId: varchar("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull().default(1),
    // pending = awaiting trainer review, completed = passed, needs_revision = trainer asked to retry
    status: varchar("status", { length: 24 }).$type<"pending" | "completed" | "needs_revision">().notNull().default("completed"),
    // Auto-graded score (quiz/drag-drop/self-assessment) — 0..100
    autoScore: integer("auto_score"),
    // For voice/video submissions
    mediaUrl: varchar("media_url"),
    // Free-form student-provided answer (text answers, drag mappings, etc.)
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    // Kid-friendly post-activity self-assessment (1=😟 .. 5=🤩). null = not rated.
    selfAssessmentRating: integer("self_assessment_rating"),
    selfAssessmentAt: timestamp("self_assessment_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_act_subs_user_act").on(t.userId, t.activityId),
    index("idx_act_subs_status").on(t.status),
  ],
);

export const activityReviewsTable = pgTable("activity_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull().references(() => activitySubmissionsTable.id, { onDelete: "cascade" }),
  reviewerId: varchar("reviewer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  // 10-criterion rubric, each 0..10
  rubricScores: jsonb("rubric_scores").$type<Record<string, number>>().notNull().default({}),
  totalScore: integer("total_score"),
  feedbackAr: text("feedback_ar"),
  feedbackEn: text("feedback_en"),
  // pass | needs_revision
  decision: varchar("decision", { length: 24 }).$type<"pass" | "needs_revision">().notNull().default("pass"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 8 public-speaking skills, each user has cumulative points
export const studentSkillScoresTable = pgTable(
  "student_skill_scores",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    skillKey: varchar("skill_key", { length: 32 }).notNull(),
    points: integer("points").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("uq_skill_user").on(t.userId, t.skillKey)],
);

// "Fear meter" measurements: 0..100, lower is better
export const studentFearMeterTable = pgTable("student_fear_meter", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  level: integer("level").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const badgesTable = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 64 }).notNull().unique(),
  titleAr: varchar("title_ar").notNull(),
  titleEn: varchar("title_en").notNull(),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  icon: varchar("icon", { length: 64 }),
  // simple criteria: { type: "activities_completed" | "course_completed" | "skill_points", value: number, skillKey?: string, courseId?: string }
  criteria: jsonb("criteria").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const studentBadgesTable = pgTable(
  "student_badges",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    badgeId: varchar("badge_id").notNull().references(() => badgesTable.id, { onDelete: "cascade" }),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uq_user_badge").on(t.userId, t.badgeId)],
);

export type LessonActivity = typeof lessonActivitiesTable.$inferSelect;
export type NewLessonActivity = typeof lessonActivitiesTable.$inferInsert;
export type ActivitySubmission = typeof activitySubmissionsTable.$inferSelect;
export type NewActivitySubmission = typeof activitySubmissionsTable.$inferInsert;
export type ActivityReview = typeof activityReviewsTable.$inferSelect;
export type StudentSkillScore = typeof studentSkillScoresTable.$inferSelect;
export type StudentFearMeter = typeof studentFearMeterTable.$inferSelect;
export type Badge = typeof badgesTable.$inferSelect;
export type StudentBadge = typeof studentBadgesTable.$inferSelect;

export const adminActivitiesTable = pgTable("admin_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorUserId: varchar("actor_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  actorEmail: varchar("actor_email"),
  action: varchar("action").notNull(),
  entityType: varchar("entity_type").notNull(),
  entityId: varchar("entity_id"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("IDX_admin_activities_created").on(t.createdAt),
]);

export type SpeechEvaluation = typeof speechEvaluationsTable.$inferSelect;
export type Order = typeof ordersTable.$inferSelect;
export type Review = typeof reviewsTable.$inferSelect;
export type Assignment = typeof assignmentsTable.$inferSelect;
export type AssignmentSubmission = typeof assignmentSubmissionsTable.$inferSelect;
export type SiteSettings = typeof siteSettingsTable.$inferSelect;
export type HomePageSection = typeof homePageSectionsTable.$inferSelect;
export type Workbook = typeof workbooksTable.$inferSelect;
export type FieldMedia = typeof fieldMediaTable.$inferSelect;
export type AdminActivity = typeof adminActivitiesTable.$inferSelect;
export type Certificate = typeof certificatesTable.$inferSelect;
