import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  coursesTable,
  courseSectionsTable,
  lessonsTable,
  enrollmentsTable,
  lessonProgressTable,
  lessonNotesTable,
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

router.get("/my/lessons/:lessonId/note", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const { lessonId } = req.params;
    const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId));
    if (!lesson) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }
    const enrollment = await getEnrollmentStatus(req.user.id, lesson.courseId);
    if (!enrollment || enrollment.status !== "active") {
      res.status(403).json({ error: "Not enrolled" });
      return;
    }
    const [note] = await db
      .select()
      .from(lessonNotesTable)
      .where(and(eq(lessonNotesTable.userId, req.user.id), eq(lessonNotesTable.lessonId, lessonId)));
    res.json({ note: note ?? null });
  } catch {
    res.status(500).json({ error: "Failed to load note" });
  }
});

router.put("/my/lessons/:lessonId/note", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const { lessonId } = req.params;
    const content = String(req.body?.content ?? "").trim();

    const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId));
    if (!lesson) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }
    const enrollment = await getEnrollmentStatus(req.user.id, lesson.courseId);
    if (!enrollment || enrollment.status !== "active") {
      res.status(403).json({ error: "Not enrolled" });
      return;
    }

    const [existing] = await db
      .select()
      .from(lessonNotesTable)
      .where(and(eq(lessonNotesTable.userId, req.user.id), eq(lessonNotesTable.lessonId, lessonId)));

    if (!content) {
      if (existing) {
        await db.delete(lessonNotesTable).where(eq(lessonNotesTable.id, existing.id));
      }
      res.json({ note: null });
      return;
    }

    if (existing) {
      const [updated] = await db
        .update(lessonNotesTable)
        .set({ content, updatedAt: new Date() })
        .where(eq(lessonNotesTable.id, existing.id))
        .returning();
      res.json({ note: updated });
    } else {
      const [created] = await db
        .insert(lessonNotesTable)
        .values({ userId: req.user.id, lessonId, content })
        .returning();
      res.json({ note: created });
    }
  } catch {
    res.status(500).json({ error: "Failed to save note" });
  }
});

router.delete("/my/lessons/:lessonId/note", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const { lessonId } = req.params;
    const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId));
    if (!lesson) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }
    const enrollment = await getEnrollmentStatus(req.user.id, lesson.courseId);
    if (!enrollment || enrollment.status !== "active") {
      res.status(403).json({ error: "Not enrolled" });
      return;
    }
    await db
      .delete(lessonNotesTable)
      .where(and(eq(lessonNotesTable.userId, req.user.id), eq(lessonNotesTable.lessonId, lessonId)));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete note" });
  }
});

export default router;
