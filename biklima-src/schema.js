import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  jsonb,
  index,
  boolean,
  integer,
  text,
  decimal,
} from "drizzle-orm/pg-core";

export const sessionsTable = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

export const usersTable = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const instructorsTable = pgTable("instructors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameAr: varchar("name_ar").notNull(),
  nameEn: varchar("name_en").notNull(),
  titleAr: varchar("title_ar"),
  titleEn: varchar("title_en"),
  bioAr: text("bio_ar"),
  bioEn: text("bio_en"),
  photoUrl: varchar("photo_url"),
  email: varchar("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categoriesTable = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameAr: varchar("name_ar").notNull(),
  nameEn: varchar("name_en").notNull(),
  slug: varchar("slug").unique().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const coursesTable = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programId: varchar("program_id"),
  slug: varchar("slug").unique(),
  titleAr: varchar("title_ar").notNull(),
  titleEn: varchar("title_en").notNull(),
  titleFr: varchar("title_fr").notNull(),
  subtitleAr: varchar("subtitle_ar"),
  subtitleEn: varchar("subtitle_en"),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  descriptionFr: text("description_fr"),
  trailerUrl: varchar("trailer_url"),
  imageUrl: varchar("image_url"),
  whatYouLearnAr: jsonb("what_you_learn_ar"),
  whatYouLearnEn: jsonb("what_you_learn_en"),
  requirementsAr: jsonb("requirements_ar"),
  requirementsEn: jsonb("requirements_en"),
  targetAudienceAr: jsonb("target_audience_ar"),
  targetAudienceEn: jsonb("target_audience_en"),
  level: varchar("level").default("all"),
  language: varchar("language").default("ar"),
  price: integer("price"),
  discountPrice: integer("discount_price"),
  hours: integer("hours"),
  sessions: integer("sessions"),
  instructorId: varchar("instructor_id").references(() => instructorsTable.id, { onDelete: "set null" }),
  categoryId: varchar("category_id").references(() => categoriesTable.id, { onDelete: "set null" }),
  isPublished: boolean("is_published").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  seoTitle: varchar("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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
  videoUrl: varchar("video_url"),
  videoType: varchar("video_type").default("youtube"),
  durationMinutes: integer("duration_minutes"),
  sortOrder: integer("sort_order").notNull().default(0),
  isFreePreview: boolean("is_free_preview").notNull().default(false),
  resources: jsonb("resources"),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessonResourcesTable = pgTable("lesson_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
  titleAr: varchar("title_ar").notNull(),
  titleEn: varchar("title_en").notNull(),
  resourceUrl: varchar("resource_url").notNull(),
  resourceType: varchar("resource_type").default("pdf"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const enrollmentsTable = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  courseId: varchar("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  status: varchar("status").notNull().default("active"),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessonProgressTable = pgTable("lesson_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  lessonId: varchar("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
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
  isApproved: boolean("is_approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const enrollmentRequestsTable = pgTable("enrollment_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  applicantType: varchar("applicant_type").notNull(),
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
  status: varchar("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  formData: jsonb("form_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workbookOrdersTable = pgTable("workbook_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  workbookId: varchar("workbook_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  format: varchar("format").notNull(),
  buyerName: varchar("buyer_name").notNull(),
  buyerEmail: varchar("buyer_email").notNull(),
  buyerPhone: varchar("buyer_phone").notNull(),
  deliveryAddress: text("delivery_address"),
  totalPrice: integer("total_price"),
  currency: varchar("currency").default("JOD"),
  status: varchar("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
