import { db, lessonSessionAttendanceTable, lessonsTable, coursesTable, courseTrainersTable } from "@workspace/db";
import { and, eq, gte, inArray } from "drizzle-orm";
import { createNotification } from "./notifications";
import { logger } from "./logger";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function runDailyAbsenceDigest(now: Date = new Date()): Promise<number> {
  const since = new Date(now.getTime() - DAY_MS);
  const recentAbsences = await db
    .select({
      lessonId: lessonSessionAttendanceTable.lessonId,
      userId: lessonSessionAttendanceTable.userId,
      courseId: lessonsTable.courseId,
    })
    .from(lessonSessionAttendanceTable)
    .innerJoin(lessonsTable, eq(lessonsTable.id, lessonSessionAttendanceTable.lessonId))
    .where(
      and(
        eq(lessonSessionAttendanceTable.status, "absent"),
        gte(lessonSessionAttendanceTable.markedAt, since),
      ),
    );

  if (recentAbsences.length === 0) return 0;

  const courseIds = Array.from(new Set(recentAbsences.map((r) => r.courseId)));
  const courses = await db
    .select({ id: coursesTable.id, titleAr: coursesTable.titleAr, titleEn: coursesTable.titleEn })
    .from(coursesTable)
    .where(inArray(coursesTable.id, courseIds));
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const trainerLinks = await db
    .select({ courseId: courseTrainersTable.courseId, userId: courseTrainersTable.userId })
    .from(courseTrainersTable)
    .where(inArray(courseTrainersTable.courseId, courseIds));

  type CourseAgg = { courseId: string; lessons: Set<string>; learners: Set<string> };
  const trainerAgg = new Map<string, Map<string, CourseAgg>>();
  for (const link of trainerLinks) {
    const rows = recentAbsences.filter((r) => r.courseId === link.courseId);
    if (rows.length === 0) continue;
    const perTrainer = trainerAgg.get(link.userId) ?? new Map<string, CourseAgg>();
    const agg = perTrainer.get(link.courseId) ?? { courseId: link.courseId, lessons: new Set(), learners: new Set() };
    for (const r of rows) {
      agg.lessons.add(r.lessonId);
      agg.learners.add(r.userId);
    }
    perTrainer.set(link.courseId, agg);
    trainerAgg.set(link.userId, perTrainer);
  }

  let sent = 0;
  for (const [trainerId, courseAggs] of trainerAgg) {
    const courseEntries = Array.from(courseAggs.values());
    const totalLessons = courseEntries.reduce((s, c) => s + c.lessons.size, 0);
    const totalLearners = new Set(courseEntries.flatMap((c) => Array.from(c.learners))).size;
    const courseListAr = courseEntries.map((c) => `"${courseMap.get(c.courseId)?.titleAr ?? ""}"`).join("، ");
    const courseListEn = courseEntries.map((c) => `"${courseMap.get(c.courseId)?.titleEn ?? ""}"`).join(", ");
    await createNotification({
      userId: trainerId,
      type: "attendance_daily_digest",
      titleAr: "ملخص الغياب اليومي",
      titleEn: "Daily absence digest",
      bodyAr: `${totalLearners} متعلم/متعلمة سُجّل غيابهم في ${totalLessons} جلسة خلال آخر ٢٤ ساعة (${courseListAr}).`,
      bodyEn: `${totalLearners} learners marked absent across ${totalLessons} sessions in the last 24h (${courseListEn}).`,
      link: "/admin/courses",
    });
    sent++;
  }
  logger.info({ sent, trainers: trainerAgg.size }, "attendance daily digest sent");
  return sent;
}

let timer: NodeJS.Timeout | null = null;
export function startDailyAbsenceDigest(): void {
  if (timer) return;
  // Run roughly once a day. First run after 1 minute so app boot is clean.
  timer = setInterval(() => {
    runDailyAbsenceDigest().catch((err) => logger.error({ err }, "daily attendance digest failed"));
  }, DAY_MS);
  setTimeout(() => {
    runDailyAbsenceDigest().catch((err) => logger.error({ err }, "daily attendance digest failed"));
  }, 60_000).unref();
  timer.unref?.();
}
