-- Generated short videos (MiniMax H3), tracked from request to file URL.
-- Additive: one new table, nothing altered.
CREATE TABLE IF NOT EXISTS "video_generation_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(32) DEFAULT 'minimax' NOT NULL,
	"model" varchar(64) NOT NULL,
	"external_task_id" varchar(128),
	"status" varchar(16) DEFAULT 'queued' NOT NULL,
	"purpose" varchar(40),
	"prompt" text NOT NULL,
	"resolution" varchar(8) NOT NULL,
	"duration" integer NOT NULL,
	"ratio" varchar(16) NOT NULL,
	"conditions" jsonb,
	"video_url" text,
	"usage" jsonb,
	"error_message" text,
	"requested_by_id" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "video_generation_jobs" ADD CONSTRAINT "video_generation_jobs_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_video_generation_jobs_status" ON "video_generation_jobs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_video_generation_jobs_task" ON "video_generation_jobs" USING btree ("external_task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_video_generation_jobs_requester" ON "video_generation_jobs" USING btree ("requested_by_id");
