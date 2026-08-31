ALTER TABLE "workbook_pages" ADD COLUMN IF NOT EXISTS "exercise_type" varchar(16) DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "workbook_pages" ADD COLUMN IF NOT EXISTS "skill_key" varchar(32);--> statement-breakpoint
ALTER TABLE "workbook_pages" ADD COLUMN IF NOT EXISTS "skill_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workbook_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"workbook_id" varchar NOT NULL,
	"page_id" varchar NOT NULL,
	"content" text,
	"video_url" text,
	"status" varchar(16) DEFAULT 'submitted' NOT NULL,
	"decision" varchar(16),
	"feedback" text,
	"reviewed_by_id" varchar,
	"reviewed_at" timestamp with time zone,
	"awarded_points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workbook_submissions" ADD CONSTRAINT "workbook_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workbook_submissions" ADD CONSTRAINT "workbook_submissions_workbook_id_workbooks_id_fk" FOREIGN KEY ("workbook_id") REFERENCES "public"."workbooks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workbook_submissions" ADD CONSTRAINT "workbook_submissions_page_id_workbook_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."workbook_pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workbook_submissions" ADD CONSTRAINT "workbook_submissions_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_workbook_submissions_user_page" ON "workbook_submissions" USING btree ("user_id","page_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_workbook_submissions_queue" ON "workbook_submissions" USING btree ("workbook_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_workbook_submissions_user" ON "workbook_submissions" USING btree ("user_id","workbook_id");
