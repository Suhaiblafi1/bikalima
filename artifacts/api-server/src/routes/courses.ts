import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  coursesTable,
  courseSectionsTable,
  lessonsTable,
  enrollmentsTable,
  lessonProgressTable,
} from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";

const router: IRouter = Router();

async function getCourseBySlug(slug: string) {
  const [course] = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.slug, slug));
  return course ?? null;
}

async function getEnrollmentStatus(userId: string, courseId: string) {
  const [enrollment] = await db
    .select({ status: enrollmentsTable.status })
    .from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.courseId, courseId)));
  return enrollment ?? null;
}

router.get("/courses", async (_req: Request, res: Response) => {
  try {
    const courses = await db
      .select({
        id: coursesTable.id,
        programId: coursesTable.programId,
        titleAr: coursesTable.titleAr,
        titleEn: coursesTable.titleEn,
        imageUrl: coursesTable.imageUrl,
        isPublished: coursesTable.isPublished,
      })
      .from(coursesTable)
      .orderBy(coursesTable.createdAt);
    res.json({ courses });
  } catch {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

router.get("/courses/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const course = await getCourseBySlug(slug);

    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const rawLessons = await db
      .select()
      .from(lessonsTable)
      .where(eq(lessonsTable.courseId, course.id))
      .orderBy(asc(lessonsTable.sortOrder));

    let hasAccess = false;
    if (req.isAuthenticated() && req.user) {
      const enrollment = await getEnrollmentStatus(req.user.id, course.id);
      hasAccess = !!enrollment && enrollment.status === "active";
    }

    const lessons = rawLessons.map(l => ({
      ...l,
      videoUrl: hasAccess || l.isFreePreview ? l.videoUrl : null,
    }));

    res.json({ course: { ...course, lessons } });
  } catch {
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

router.get("/courses/:slug/learn", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const course = await getCourseBySlug(slug);
    if (!course) { res.status(404).json({ error: "Course not found" }); return; }

    const isLoggedIn = req.isAuthenticated() && !!req.user;
    let enrolled = false;
    let progressMap: Record<string, boolean> = {};

    if (isLoggedIn && req.user) {
      const enrollment = await getEnrollmentStatus(req.user.id, course.id);
      enrolled = !!enrollment && enrollment.status === "active";

      if (enrolled) {
        const lessons = await db.select({ lessonId: lessonsTable.id }).from(lessonsTable)
          .where(eq(lessonsTable.courseId, course.id));
        const lessonIds = lessons.map(l => l.lessonId);
        if (lessonIds.length > 0) {
          const progress = await db.select().from(lessonProgressTable)
            .where(eq(lessonProgressTable.userId, req.user.id));
          for (const p of progress) {
            if (p.completed && lessonIds.includes(p.lessonId)) {
              progressMap[p.lessonId] = true;
            }
          }
        }
      }
    }

    const sections = await db.select().from(courseSectionsTable)
      .where(eq(courseSectionsTable.courseId, course.id))
      .orderBy(asc(courseSectionsTable.sortOrder));

    const lessons = await db.select().from(lessonsTable)
      .where(eq(lessonsTable.courseId, course.id))
      .orderBy(asc(lessonsTable.sortOrder));

    res.json({ course, sections, lessons, progressMap, enrolled });
  } catch {
    res.status(500).json({ error: "Failed to load course" });
  }
});

router.get("/courses/:slug/access", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const course = await getCourseBySlug(slug);

    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    if (!req.isAuthenticated() || !req.user) {
      res.json({ hasAccess: false, enrolled: false });
      return;
    }

    const enrollment = await getEnrollmentStatus(req.user.id, course.id);
    res.json({ hasAccess: !!enrollment && enrollment.status === "active", enrolled: !!enrollment });
  } catch {
    res.status(500).json({ error: "Failed to check access" });
  }
});

export default router;
