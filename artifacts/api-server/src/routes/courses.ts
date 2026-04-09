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
        const allLessons = await db.select({ id: lessonsTable.id }).from(lessonsTable)
          .where(eq(lessonsTable.courseId, course.id));
        const lessonIds = allLessons.map(l => l.id);
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

    const rawLessons = await db.select().from(lessonsTable)
      .where(eq(lessonsTable.courseId, course.id))
      .orderBy(asc(lessonsTable.sortOrder));

    const lessons = rawLessons.map(l => {
      if (!enrolled && !l.isFreePreview) {
        return { ...l, videoUrl: null, resources: null };
      }
      return l;
    });

    res.json({ course, sections, lessons, progressMap, enrolled });
  } catch {
    res.status(500).json({ error: "Failed to load course" });
  }
});

router.get("/programs/:programId/preview", async (req: Request, res: Response) => {
  try {
    const { programId } = req.params;
    const [course] = await db.select().from(coursesTable)
      .where(and(eq(coursesTable.programId, programId), eq(coursesTable.isPublished, true)))
      .limit(1);
    if (!course) { res.json({ course: null, sections: [], lessons: [] }); return; }

    const sections = await db.select().from(courseSectionsTable)
      .where(and(eq(courseSectionsTable.courseId, course.id), eq(courseSectionsTable.isPublished, true)))
      .orderBy(asc(courseSectionsTable.sortOrder));

    const lessons = await db.select({
      id: lessonsTable.id,
      sectionId: lessonsTable.sectionId,
      titleAr: lessonsTable.titleAr,
      titleEn: lessonsTable.titleEn,
      durationMinutes: lessonsTable.durationMinutes,
      isFreePreview: lessonsTable.isFreePreview,
      sortOrder: lessonsTable.sortOrder,
      isPublished: lessonsTable.isPublished,
    }).from(lessonsTable)
      .where(and(eq(lessonsTable.courseId, course.id), eq(lessonsTable.isPublished, true)))
      .orderBy(asc(lessonsTable.sortOrder));

    res.json({ course, sections, lessons });
  } catch {
    res.status(500).json({ error: "Failed to load program preview" });
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
