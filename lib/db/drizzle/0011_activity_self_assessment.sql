ALTER TABLE "activity_submissions" ADD COLUMN IF NOT EXISTS "self_assessment_rating" integer;--> statement-breakpoint
ALTER TABLE "activity_submissions" ADD COLUMN IF NOT EXISTS "self_assessment_at" timestamp with time zone;
