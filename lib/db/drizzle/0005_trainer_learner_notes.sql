CREATE TABLE IF NOT EXISTS "trainer_learner_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" varchar NOT NULL,
	"learner_id" varchar NOT NULL,
	"course_id" varchar,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trainer_learner_notes" ADD CONSTRAINT "trainer_learner_notes_trainer_id_users_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trainer_learner_notes" ADD CONSTRAINT "trainer_learner_notes_learner_id_users_id_fk" FOREIGN KEY ("learner_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trainer_learner_notes" ADD CONSTRAINT "trainer_learner_notes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_trainer_notes_trainer" ON "trainer_learner_notes" ("trainer_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_trainer_notes_learner" ON "trainer_learner_notes" ("learner_id");
