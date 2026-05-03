CREATE TABLE "audit_log_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" varchar,
	"actor_email" varchar,
	"action" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar,
	"description" text,
	"before_json" jsonb,
	"after_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badge_definitions" (
	"key" varchar PRIMARY KEY NOT NULL,
	"title_ar" varchar NOT NULL,
	"title_en" varchar NOT NULL,
	"description_ar" text,
	"description_en" text,
	"icon" varchar DEFAULT 'award' NOT NULL,
	"color_class" varchar DEFAULT 'bg-amber-100 text-amber-700' NOT NULL,
	"event_name" varchar NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"key" varchar PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"description_ar" varchar,
	"description_en" varchar,
	"updated_by_id" varchar,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "impact_stats_overrides" (
	"key" varchar PRIMARY KEY NOT NULL,
	"label_ar" varchar NOT NULL,
	"label_en" varchar NOT NULL,
	"override_value" varchar,
	"display_order" integer DEFAULT 0 NOT NULL,
	"updated_by_id" varchar,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_session_attendance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"status" varchar NOT NULL,
	"note" text,
	"marked_by_id" varchar,
	"marked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transformation_stories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"role_ar" varchar,
	"role_en" varchar,
	"quote_ar" text NOT NULL,
	"quote_en" text,
	"photo_url" varchar,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"badge_key" varchar NOT NULL,
	"payload" jsonb,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "speech_evaluations" ADD COLUMN "rubric_scores" jsonb;--> statement-breakpoint
ALTER TABLE "speech_evaluations" ADD COLUMN "overall_score" integer;--> statement-breakpoint
ALTER TABLE "speech_evaluations" ADD COLUMN "program_recommendation" varchar;--> statement-breakpoint
ALTER TABLE "speech_evaluations" ADD COLUMN "final_report_md" text;--> statement-breakpoint
ALTER TABLE "speech_evaluations" ADD COLUMN "report_published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "speech_evaluations" ADD COLUMN "assigned_trainer_user_id" varchar;--> statement-breakpoint
ALTER TABLE "audit_log_entries" ADD CONSTRAINT "audit_log_entries_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_stats_overrides" ADD CONSTRAINT "impact_stats_overrides_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_session_attendance" ADD CONSTRAINT "lesson_session_attendance_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_session_attendance" ADD CONSTRAINT "lesson_session_attendance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_session_attendance" ADD CONSTRAINT "lesson_session_attendance_marked_by_id_users_id_fk" FOREIGN KEY ("marked_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_key_badge_definitions_key_fk" FOREIGN KEY ("badge_key") REFERENCES "public"."badge_definitions"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_audit_log_created" ON "audit_log_entries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_audit_log_actor" ON "audit_log_entries" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "IDX_audit_log_entity" ON "audit_log_entries" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "UQ_attendance_lesson_user" ON "lesson_session_attendance" USING btree ("lesson_id","user_id");--> statement-breakpoint
CREATE INDEX "IDX_attendance_user" ON "lesson_session_attendance" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_attendance_lesson" ON "lesson_session_attendance" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "IDX_stories_published_order" ON "transformation_stories" USING btree ("is_published","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "UQ_user_badges_user_badge" ON "user_badges" USING btree ("user_id","badge_key");--> statement-breakpoint
CREATE INDEX "IDX_user_badges_user" ON "user_badges" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "speech_evaluations" ADD CONSTRAINT "speech_evaluations_assigned_trainer_user_id_users_id_fk" FOREIGN KEY ("assigned_trainer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;