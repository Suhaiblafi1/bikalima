import { and, eq } from "drizzle-orm";
import { db, courseTrainersTable, enrollmentsTable } from "@workspace/db";

/**
 * Who may see and touch a course.
 *
 * These four questions were answered by separate local copies in activities.ts,
 * little-speaker.ts, attendance.ts, assignments.ts, admin.ts and
 * workbook-reader.ts — fifteen sites in seven files, all agreeing today by
 * coincidence rather than by construction. The danger was never the
 * duplication itself but the next edit: widening the enrolment rule to accept
 * "completed" as well as "active" would have been applied to one copy and
 * missed on the rest, and the result reads exactly like a permission bug.
 *
 * Nothing here changes behaviour. Each function is the query its callers were
 * already running, with the same conditions and the same meaning of "active".
 * Note in particular that enrolment counts only while status is "active";
 * routes that need the status *value* (courses.ts, deciding between pending
 * and active) ask a different question and keep their own query.
 */

/** Is this user assigned to teach this course? */
export async function isCourseTrainer(userId: string, courseId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: courseTrainersTable.id })
    .from(courseTrainersTable)
    .where(and(eq(courseTrainersTable.userId, userId), eq(courseTrainersTable.courseId, courseId)))
    .limit(1);
  return !!row;
}

/** Which courses does this user teach? Empty when they teach none. */
export async function trainerCourseIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ courseId: courseTrainersTable.courseId })
    .from(courseTrainersTable)
    .where(eq(courseTrainersTable.userId, userId));
  return rows.map((r) => r.courseId);
}

/** Is this user actively enrolled in this course? */
export async function isEnrolled(userId: string, courseId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: enrollmentsTable.id })
    .from(enrollmentsTable)
    .where(
      and(
        eq(enrollmentsTable.userId, userId),
        eq(enrollmentsTable.courseId, courseId),
        eq(enrollmentsTable.status, "active"),
      ),
    )
    .limit(1);
  return !!row;
}

/** Which courses is this user actively enrolled in? Empty when none. */
export async function enrolledCourseIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ courseId: enrollmentsTable.courseId })
    .from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.status, "active")));
  return rows.map((r) => r.courseId);
}
