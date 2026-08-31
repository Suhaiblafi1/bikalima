CREATE TABLE IF NOT EXISTS "workbook_pages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workbook_id" varchar NOT NULL,
	"page_number" integer NOT NULL,
	"section_ar" varchar,
	"section_en" varchar,
	"title_ar" varchar,
	"title_en" varchar,
	"body_ar" text NOT NULL,
	"body_en" text,
	"exercise_ar" text,
	"exercise_en" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workbook_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"workbook_id" varchar NOT NULL,
	"page_id" varchar NOT NULL,
	"quote" text,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workbook_pages" ADD CONSTRAINT "workbook_pages_workbook_id_workbooks_id_fk" FOREIGN KEY ("workbook_id") REFERENCES "public"."workbooks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workbook_notes" ADD CONSTRAINT "workbook_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workbook_notes" ADD CONSTRAINT "workbook_notes_workbook_id_workbooks_id_fk" FOREIGN KEY ("workbook_id") REFERENCES "public"."workbooks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workbook_notes" ADD CONSTRAINT "workbook_notes_page_id_workbook_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."workbook_pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_workbook_pages_number" ON "workbook_pages" USING btree ("workbook_id","page_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_workbook_pages_workbook" ON "workbook_pages" USING btree ("workbook_id","page_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_workbook_notes_user_workbook" ON "workbook_notes" USING btree ("user_id","workbook_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_workbook_notes_page" ON "workbook_notes" USING btree ("page_id");
