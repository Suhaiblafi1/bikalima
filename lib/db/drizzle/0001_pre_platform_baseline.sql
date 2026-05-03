CREATE TABLE "admin_activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" varchar,
	"actor_email" varchar,
	"action" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignment_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"submission_type" varchar NOT NULL,
	"submission_url" varchar,
	"submission_text" text,
	"status" varchar DEFAULT 'submitted' NOT NULL,
	"clarity_score" integer,
	"structure_score" integer,
	"opening_score" integer,
	"voice_score" integer,
	"body_language_score" integer,
	"conclusion_score" integer,
	"impact_score" integer,
	"total_score" integer,
	"trainer_feedback" text,
	"reviewed_at" timestamp with time zone,
	"reviewed_by_id" varchar,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" varchar,
	"title_ar" varchar NOT NULL,
	"title_en" varchar,
	"description_ar" text,
	"description_en" text,
	"due_at" timestamp with time zone,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_by_id" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar NOT NULL,
	"full_name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar,
	"country" varchar,
	"cert_type" varchar NOT NULL,
	"program_id" varchar,
	"program_name" varchar,
	"issue_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expiry_date" timestamp with time zone,
	"status" varchar DEFAULT 'active' NOT NULL,
	"assessor_name" varchar,
	"assessor_user_id" varchar,
	"internal_notes" text,
	"certificate_file_url" varchar,
	"graduate_image_url" varchar,
	"show_in_registry" boolean DEFAULT false NOT NULL,
	"user_id" varchar,
	"created_by" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_sections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" varchar NOT NULL,
	"title_ar" varchar NOT NULL,
	"title_en" varchar NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_trainers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" varchar,
	"slug" varchar,
	"title_ar" varchar NOT NULL,
	"title_en" varchar NOT NULL,
	"title_fr" varchar NOT NULL,
	"subtitle_ar" varchar,
	"subtitle_en" varchar,
	"description_ar" text,
	"description_en" text,
	"description_fr" text,
	"image_url" varchar,
	"trailer_url" varchar,
	"price" integer,
	"discount_price" integer,
	"level" varchar,
	"language" varchar DEFAULT 'ar',
	"category" varchar,
	"instructor_id" varchar,
	"what_you_learn_ar" jsonb,
	"what_you_learn_en" jsonb,
	"requirements_ar" jsonb,
	"requirements_en" jsonb,
	"target_audience_ar" text,
	"target_audience_en" text,
	"seo_title" varchar,
	"seo_description" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollment_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"applicant_type" varchar NOT NULL,
	"full_name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"program_id" varchar NOT NULL,
	"training_type" varchar,
	"private_mode" varchar,
	"youtube_link" varchar,
	"discount_code" varchar,
	"institution_name" varchar,
	"student_count" integer,
	"teacher_count" integer,
	"workbooks_needed" integer,
	"message" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"form_data" jsonb,
	"external_crm_id" varchar,
	"ai_analysis_status" varchar DEFAULT 'none',
	"ai_analysis_result" jsonb,
	"assigned_trainer_id" varchar,
	"lead_source" varchar,
	"sync_status" varchar DEFAULT 'pending',
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"course_id" varchar NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_media" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_type" varchar NOT NULL,
	"media_url" text NOT NULL,
	"thumbnail_url" text,
	"title_ar" varchar NOT NULL,
	"title_en" varchar,
	"speaker_name" varchar,
	"category" varchar,
	"target_skill" varchar,
	"description_ar" text,
	"description_en" text,
	"linked_program_id" varchar,
	"linked_workbook_id" varchar,
	"placement" jsonb,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"analysis_skill" varchar,
	"analysis_observe_ar" text,
	"analysis_why_ar" text,
	"analysis_learn_ar" text,
	"analysis_mistakes_ar" text,
	"analysis_exercise_ar" text,
	"analysis_difficulty" varchar,
	"analysis_linked_topic" varchar,
	"has_analysis" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "home_page_sections" (
	"section_key" varchar PRIMARY KEY NOT NULL,
	"content_ar" jsonb,
	"content_en" jsonb,
	"visible" boolean DEFAULT true NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"status" varchar DEFAULT 'published' NOT NULL,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_ar" varchar NOT NULL,
	"name_en" varchar NOT NULL,
	"bio_ar" text,
	"bio_en" text,
	"photo_url" varchar,
	"email" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"lesson_id" varchar NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"lesson_id" varchar NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" varchar NOT NULL,
	"section_id" varchar,
	"title_ar" varchar NOT NULL,
	"title_en" varchar NOT NULL,
	"title_fr" varchar NOT NULL,
	"description_ar" text,
	"description_en" text,
	"video_url" varchar,
	"video_type" varchar DEFAULT 'youtube',
	"duration_minutes" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_free_preview" boolean DEFAULT false NOT NULL,
	"resources" jsonb,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"course_id" varchar,
	"buyer_name" varchar NOT NULL,
	"buyer_email" varchar NOT NULL,
	"buyer_phone" varchar NOT NULL,
	"amount" integer,
	"currency" varchar DEFAULT 'JOD',
	"status" varchar DEFAULT 'pending' NOT NULL,
	"payment_notes" text,
	"admin_notes" text,
	"admin_approved_by" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"course_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"comment_ar" text,
	"comment_en" text,
	"reviewer_name" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" varchar PRIMARY KEY DEFAULT 'default' NOT NULL,
	"site_name_ar" varchar,
	"site_name_en" varchar,
	"logo_url" varchar,
	"default_lang" varchar DEFAULT 'ar',
	"default_currency" varchar DEFAULT 'USD',
	"contact_email" varchar,
	"contact_phone" varchar,
	"whatsapp_number" varchar,
	"facebook_url" varchar,
	"instagram_url" varchar,
	"youtube_url" varchar,
	"twitter_url" varchar,
	"privacy_policy_ar" text,
	"privacy_policy_en" text,
	"terms_ar" text,
	"terms_en" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speech_evaluations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"full_name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"video_url" varchar,
	"audio_url" varchar,
	"speech_topic" varchar,
	"speech_language" varchar,
	"notes" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"external_crm_id" varchar,
	"ai_analysis_status" varchar DEFAULT 'none',
	"ai_analysis_result" jsonb,
	"transcript_text" text,
	"trainer_score" integer,
	"trainer_feedback" text,
	"assigned_trainer_id" varchar,
	"lead_source" varchar,
	"sync_status" varchar DEFAULT 'pending',
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workbook_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"workbook_id" varchar NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"format" varchar NOT NULL,
	"buyer_name" varchar NOT NULL,
	"buyer_email" varchar NOT NULL,
	"buyer_phone" varchar NOT NULL,
	"buyer_country" varchar,
	"notes" text,
	"delivery_address" text,
	"total_price" integer,
	"currency" varchar DEFAULT 'JOD',
	"status" varchar DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"external_crm_id" varchar,
	"lead_source" varchar,
	"sync_status" varchar DEFAULT 'pending',
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workbooks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar NOT NULL,
	"title_ar" varchar NOT NULL,
	"title_en" varchar,
	"description_ar" text,
	"description_en" text,
	"price_jod" integer,
	"cover_image_url" varchar,
	"sample_pdf_url" varchar,
	"topics_ar" jsonb,
	"topics_en" jsonb,
	"format" varchar DEFAULT 'both' NOT NULL,
	"linked_course_id" varchar,
	"linked_program_id" varchar,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_sync_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"external_id" varchar,
	"error_message" text,
	"payload" jsonb,
	"response" jsonb,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "automations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description_ar" text,
	"trigger" varchar NOT NULL,
	"conditions" jsonb,
	"actions" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"run_count" integer DEFAULT 0 NOT NULL,
	"last_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultation_bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar,
	"full_name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"consultation_type" varchar,
	"interest_program_id" varchar,
	"interest_program_title" varchar,
	"preferred_date" varchar,
	"preferred_time" varchar,
	"notes" text,
	"status" varchar DEFAULT 'requested' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "funnels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar NOT NULL,
	"name_ar" varchar NOT NULL,
	"description_ar" text,
	"source_filter" varchar,
	"steps" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"summary_ar" text,
	"payload" jsonb,
	"related_entity_type" varchar,
	"related_entity_id" varchar,
	"actor_user_id" varchar,
	"actor_email" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar NOT NULL,
	"phone" varchar,
	"phone_normalized" varchar,
	"email" varchar,
	"email_lower" varchar,
	"country" varchar,
	"source" varchar DEFAULT 'other' NOT NULL,
	"interest_program_id" varchar,
	"interest_program_title" varchar,
	"status" varchar DEFAULT 'new' NOT NULL,
	"interest_score" varchar DEFAULT 'warm',
	"owner_user_id" varchar,
	"last_contact_at" timestamp with time zone,
	"next_follow_up_at" timestamp with time zone,
	"internal_notes" text,
	"converted_to_user_id" varchar,
	"converted_at" timestamp with time zone,
	"last_status_change_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar NOT NULL,
	"title_ar" varchar NOT NULL,
	"body_ar" text NOT NULL,
	"title_en" varchar,
	"body_en" text,
	"placeholders" jsonb,
	"channel" varchar DEFAULT 'whatsapp' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"lead_id" varchar,
	"assignee_user_id" varchar,
	"created_by_user_id" varchar,
	"due_at" timestamp with time zone,
	"priority" varchar DEFAULT 'medium' NOT NULL,
	"status" varchar DEFAULT 'open' NOT NULL,
	"source_type" varchar,
	"source_id" varchar,
	"completed_at" timestamp with time zone,
	"snoozed_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" varchar NOT NULL,
	"sender" varchar NOT NULL,
	"body" text NOT NULL,
	"channel" varchar DEFAULT 'web' NOT NULL,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_threads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar NOT NULL,
	"visitor_name" varchar NOT NULL,
	"visitor_whatsapp" varchar,
	"visitor_email" varchar,
	"lang" varchar DEFAULT 'ar' NOT NULL,
	"status" varchar DEFAULT 'open' NOT NULL,
	"unread_for_admin" integer DEFAULT 0 NOT NULL,
	"unread_for_visitor" integer DEFAULT 0 NOT NULL,
	"page_url" text,
	"user_agent" text,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_threads_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar(32) NOT NULL,
	"title_ar" varchar NOT NULL,
	"title_en" varchar NOT NULL,
	"body_ar" text,
	"body_en" text,
	"link" varchar,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(16) DEFAULT 'student' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_super_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_token" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "admin_activities" ADD CONSTRAINT "admin_activities_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_assessor_user_id_users_id_fk" FOREIGN KEY ("assessor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_trainers" ADD CONSTRAINT "course_trainers_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_trainers" ADD CONSTRAINT "course_trainers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_instructors_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_requests" ADD CONSTRAINT "enrollment_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_requests" ADD CONSTRAINT "enrollment_requests_assigned_trainer_id_instructors_id_fk" FOREIGN KEY ("assigned_trainer_id") REFERENCES "public"."instructors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_media" ADD CONSTRAINT "field_media_linked_workbook_id_workbooks_id_fk" FOREIGN KEY ("linked_workbook_id") REFERENCES "public"."workbooks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_section_id_course_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speech_evaluations" ADD CONSTRAINT "speech_evaluations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speech_evaluations" ADD CONSTRAINT "speech_evaluations_assigned_trainer_id_instructors_id_fk" FOREIGN KEY ("assigned_trainer_id") REFERENCES "public"."instructors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbook_orders" ADD CONSTRAINT "workbook_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbooks" ADD CONSTRAINT "workbooks_linked_course_id_courses_id_fk" FOREIGN KEY ("linked_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_bookings" ADD CONSTRAINT "consultation_bookings_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_converted_to_user_id_users_id_fk" FOREIGN KEY ("converted_to_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_user_id_users_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_thread_id_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_admin_activities_created" ON "admin_activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_submission_user" ON "assignment_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_submission_assignment" ON "assignment_submissions" USING btree ("assignment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "UQ_submission_assignment_user" ON "assignment_submissions" USING btree ("assignment_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "UQ_certificates_code" ON "certificates" USING btree ("code");--> statement-breakpoint
CREATE INDEX "IDX_certificates_status" ON "certificates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_certificates_user" ON "certificates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_course_trainers_course" ON "course_trainers" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "IDX_course_trainers_user" ON "course_trainers" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "UQ_course_trainers_course_user" ON "course_trainers" USING btree ("course_id","user_id");--> statement-breakpoint
CREATE INDEX "IDX_field_media_status" ON "field_media" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "UQ_workbooks_slug" ON "workbooks" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "IDX_automations_trigger" ON "automations" USING btree ("trigger");--> statement-breakpoint
CREATE INDEX "IDX_automations_active" ON "automations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "IDX_consult_lead" ON "consultation_bookings" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "IDX_consult_status" ON "consultation_bookings" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "UQ_funnels_key" ON "funnels" USING btree ("key");--> statement-breakpoint
CREATE INDEX "IDX_lead_activities_lead" ON "lead_activities" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "IDX_lead_activities_created" ON "lead_activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_leads_status" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_leads_owner" ON "leads" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "IDX_leads_source" ON "leads" USING btree ("source");--> statement-breakpoint
CREATE INDEX "IDX_leads_phone_norm" ON "leads" USING btree ("phone_normalized");--> statement-breakpoint
CREATE INDEX "IDX_leads_email_lower" ON "leads" USING btree ("email_lower");--> statement-breakpoint
CREATE INDEX "IDX_leads_next_followup" ON "leads" USING btree ("next_follow_up_at");--> statement-breakpoint
CREATE UNIQUE INDEX "UQ_message_templates_key" ON "message_templates" USING btree ("key");--> statement-breakpoint
CREATE INDEX "IDX_tasks_assignee" ON "tasks" USING btree ("assignee_user_id");--> statement-breakpoint
CREATE INDEX "IDX_tasks_lead" ON "tasks" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "IDX_tasks_status" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_tasks_due" ON "tasks" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "chat_messages_thread_idx" ON "chat_messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_threads_last_msg_idx" ON "chat_threads" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "chat_threads_status_idx" ON "chat_threads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_notif_user_created" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "IDX_notif_user_unread" ON "notifications" USING btree ("user_id","read_at");