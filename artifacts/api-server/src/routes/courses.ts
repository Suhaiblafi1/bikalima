import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  coursesTable,
  lessonsTable,
  enrollmentsTable,
} from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";

const router: IRouter = Router();

const SLUG_TO_PROGRAM: Record<string, string> = {
  "influential-speaker": "core",
  "certified-trainer": "tot",
  "educators-program": "teachers",
  "young-speaker": "children",
};

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
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

router.get("/courses/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const programId = SLUG_TO_PROGRAM[slug] || null;

    let course: typeof coursesTable.$inferSelect | undefined;
    if (programId) {
      const [row] = await db
        .select()
        .from(coursesTable)
        .where(eq(coursesTable.programId, programId));
      course = row;
    }

    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const lessons = await db
      .select()
      .from(lessonsTable)
      .where(eq(lessonsTable.courseId, course.id))
      .orderBy(asc(lessonsTable.sortOrder));

    res.json({ course: { ...course, lessons } });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

router.get("/courses/:slug/access", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const programId = SLUG_TO_PROGRAM[slug] || null;

    if (!programId) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const [course] = await db
      .select({ id: coursesTable.id })
      .from(coursesTable)
      .where(eq(coursesTable.programId, programId));

    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    if (!req.isAuthenticated() || !req.user) {
      res.json({ hasAccess: false, enrolled: false });
      return;
    }

    const [enrollment] = await db
      .select()
      .from(enrollmentsTable)
      .where(
        and(
          eq(enrollmentsTable.userId, req.user.id),
          eq(enrollmentsTable.courseId, course.id),
        ),
      );

    res.json({ hasAccess: !!enrollment && enrollment.status === "active", enrolled: !!enrollment });
  } catch (err) {
    res.status(500).json({ error: "Failed to check access" });
  }
});

export default router;
