-- Visitors suggesting a speech they liked, with what they thought of it.
-- Additive: one new table, nothing altered.
CREATE TABLE IF NOT EXISTS "speech_suggestions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"video_url" text NOT NULL,
	"opinion" text,
	"status" varchar(16) DEFAULT 'new' NOT NULL,
	"admin_note" text,
	"reviewed_by_id" varchar,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "speech_suggestions" ADD CONSTRAINT "speech_suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "speech_suggestions" ADD CONSTRAINT "speech_suggestions_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_speech_suggestions_status" ON "speech_suggestions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_speech_suggestions_user" ON "speech_suggestions" USING btree ("user_id");
