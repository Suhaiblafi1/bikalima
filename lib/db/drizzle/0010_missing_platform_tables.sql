CREATE TABLE IF NOT EXISTS "accreditations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_ar" varchar NOT NULL,
	"name_en" varchar,
	"description_ar" text,
	"description_en" text,
	"issuer_name_ar" varchar NOT NULL,
	"issuer_name_en" varchar,
	"issuer_country" varchar(80),
	"issuer_website" varchar,
	"issuer_logo_url" varchar,
	"accreditation_number" varchar,
	"scope_ar" text,
	"scope_en" text,
	"issue_date" date NOT NULL,
	"expiry_date" date,
	"status" varchar(24) DEFAULT 'active' NOT NULL,
	"certificate_file_url" varchar,
	"verification_url" varchar,
	"badge_color" varchar(24) DEFAULT 'amber' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_accred_status" ON "accreditations" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_accred_public" ON "accreditations" USING btree ("is_public", "display_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_accred_expiry" ON "accreditations" USING btree ("expiry_date");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "accreditation_renewals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accreditation_id" varchar NOT NULL,
	"previous_expiry_date" date,
	"new_expiry_date" date NOT NULL,
	"renewed_on" date NOT NULL,
	"new_certificate_file_url" varchar,
	"notes" text,
	"actor_user_id" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accreditation_renewals_accreditation_id_accreditations_id_fk" FOREIGN KEY ("accreditation_id") REFERENCES "public"."accreditations"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "accreditation_renewals_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "policy_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"title_ar" varchar NOT NULL,
	"title_en" varchar,
	"summary_ar" text,
	"summary_en" text,
	"body_ar" text NOT NULL,
	"body_en" text,
	"effective_date" date NOT NULL,
	"requires_acceptance" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"icon" varchar(32) DEFAULT 'scroll-text' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_policy_slug_version" ON "policy_documents" USING btree ("slug", "version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_policy_published" ON "policy_documents" USING btree ("is_published", "display_order");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "policy_acceptances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"policy_slug" varchar(64) NOT NULL,
	"version" integer NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" varchar(64),
	"user_agent" varchar(512),
	CONSTRAINT "policy_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_policy_acceptance" ON "policy_acceptances" USING btree ("user_id", "policy_slug", "version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_policy_acceptance_user" ON "policy_acceptances" USING btree ("user_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "live_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" varchar NOT NULL,
	"zoom_join_url" varchar NOT NULL,
	"zoom_meeting_id" varchar,
	"title_ar" varchar,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"status" varchar(16) DEFAULT 'scheduled' NOT NULL,
	"recording_url" varchar,
	"created_by_id" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "live_sessions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "live_sessions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_live_sessions_lesson" ON "live_sessions" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_live_sessions_scheduled" ON "live_sessions" USING btree ("scheduled_at");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "parent_links" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_user_id" varchar,
	"student_user_id" varchar NOT NULL,
	"invite_code" varchar(16) NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"relationship_ar" varchar,
	"created_by_id" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activated_at" timestamp with time zone,
	CONSTRAINT "parent_links_parent_user_id_users_id_fk" FOREIGN KEY ("parent_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "parent_links_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "parent_links_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_parent_links_code" ON "parent_links" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_parent_links_parent" ON "parent_links" USING btree ("parent_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_parent_links_student" ON "parent_links" USING btree ("student_user_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "message_threads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" varchar,
	"subject" varchar NOT NULL,
	"is_broadcast" boolean DEFAULT false NOT NULL,
	"created_by_id" varchar NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_threads_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action,
	CONSTRAINT "message_threads_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_message_threads_course" ON "message_threads" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_message_threads_recent" ON "message_threads" USING btree ("last_message_at");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "message_thread_participants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"last_read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_thread_participants_thread_id_message_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."message_threads"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "message_thread_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_thread_participants_thread_user" ON "message_thread_participants" USING btree ("thread_id", "user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_thread_participants_user" ON "message_thread_participants" USING btree ("user_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "platform_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_messages_thread_id_message_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."message_threads"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "platform_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_platform_messages_thread" ON "platform_messages" USING btree ("thread_id", "created_at");
