-- Where a generated clip ended up once it was saved: our storage object and
-- the media-library row it became.
-- Additive: three nullable columns and one foreign key, nothing altered.
ALTER TABLE "video_generation_jobs" ADD COLUMN IF NOT EXISTS "stored_url" text;--> statement-breakpoint
ALTER TABLE "video_generation_jobs" ADD COLUMN IF NOT EXISTS "stored_key" text;--> statement-breakpoint
ALTER TABLE "video_generation_jobs" ADD COLUMN IF NOT EXISTS "field_media_id" varchar;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "video_generation_jobs" ADD CONSTRAINT "video_generation_jobs_field_media_id_field_media_id_fk" FOREIGN KEY ("field_media_id") REFERENCES "public"."field_media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_video_generation_jobs_field_media" ON "video_generation_jobs" USING btree ("field_media_id");
