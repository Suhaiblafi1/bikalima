-- Rubric grading for workbook exercises.
--
-- Purely additive: six nullable columns on workbook_submissions. Rows already
-- graded under the old pass/fail keep their awarded_points and read back as
-- "graded without a rubric", which is what they were.
ALTER TABLE "workbook_submissions" ADD COLUMN IF NOT EXISTS "rubric_key" varchar(24);--> statement-breakpoint
ALTER TABLE "workbook_submissions" ADD COLUMN IF NOT EXISTS "rubric_version" integer;--> statement-breakpoint
ALTER TABLE "workbook_submissions" ADD COLUMN IF NOT EXISTS "rubric_scores" jsonb;--> statement-breakpoint
ALTER TABLE "workbook_submissions" ADD COLUMN IF NOT EXISTS "rubric_notes" jsonb;--> statement-breakpoint
ALTER TABLE "workbook_submissions" ADD COLUMN IF NOT EXISTS "rubric_percent" integer;--> statement-breakpoint
ALTER TABLE "workbook_submissions" ADD COLUMN IF NOT EXISTS "awarded_breakdown" jsonb;
