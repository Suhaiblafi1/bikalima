DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM enrollments GROUP BY user_id, course_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add uq_enrollments_user_course: duplicate enrollments exist. Resolve them explicitly before migrating.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM lesson_progress GROUP BY user_id, lesson_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add uq_lesson_progress_user_lesson: duplicate progress rows exist. Resolve them explicitly before migrating.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM lesson_notes GROUP BY user_id, lesson_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add uq_lesson_notes_user_lesson: duplicate note rows exist. Resolve them explicitly before migrating.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_enrollments_user_course"
  ON "enrollments" ("user_id", "course_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_lesson_progress_user_lesson"
  ON "lesson_progress" ("user_id", "lesson_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_lesson_notes_user_lesson"
  ON "lesson_notes" ("user_id", "lesson_id");
