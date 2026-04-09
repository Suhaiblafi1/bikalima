import { Router } from "express";
import { db, coursesTable, courseSectionsTable, lessonsTable, instructorsTable, reviewsTable, enrollmentsTable } from "../db.js";
import { eq, asc, and, sql } from "drizzle-orm";

const router = Router();

router.get("/courses", async (req, res) => {
  try {
    const courses = await db
      .select({
        id: coursesTable.id,
        slug: coursesTable.slug,
        programId: coursesTable.programId,
        titleAr: coursesTable.titleAr,
        titleEn: coursesTable.titleEn,
        subtitleAr: coursesTable.subtitleAr,
        subtitleEn: coursesTable.subtitleEn,
        descriptionAr: coursesTable.descriptionAr,
        descriptionEn: coursesTable.descriptionEn,
        imageUrl: coursesTable.imageUrl,
        price: coursesTable.price,
        discountPrice: coursesTable.discountPrice,
        hours: coursesTable.hours,
        sessions: coursesTable.sessions,
        level: coursesTable.level,
        language: coursesTable.language,
        isFeatured: coursesTable.isFeatured,
        instructorId: coursesTable.instructorId,
      })
      .from(coursesTable)
      .where(eq(coursesTable.isPublished, true))
      .orderBy(asc(coursesTable.createdAt));

    const coursesWithMeta = await Promise.all(
      courses.map(async (course) => {
        const [lessonCount] = await db
          .select({ count: sql`count(*)::int` })
          .from(lessonsTable)
          .where(and(eq(lessonsTable.courseId, course.id), eq(lessonsTable.isPublished, true)));

        const [enrollCount] = await db
          .select({ count: sql`count(*)::int` })
          .from(enrollmentsTable)
          .where(and(eq(enrollmentsTable.courseId, course.id), eq(enrollmentsTable.status, "active")));

        const [avgRating] = await db
          .select({ avg: sql`COALESCE(AVG(rating)::numeric(3,1), 0)` })
          .from(reviewsTable)
          .where(and(eq(reviewsTable.courseId, course.id), eq(reviewsTable.isApproved, true)));

        return {
          ...course,
          lessonCount: lessonCount.count,
          enrollmentCount: enrollCount.count,
          rating: parseFloat(avgRating.avg) || 0,
        };
      })
    );

    res.json({ courses: coursesWithMeta });
  } catch (err) {
    console.error("GET /courses error:", err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

router.get("/courses/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const [course] = await db
      .select()
      .from(coursesTable)
      .where(and(eq(coursesTable.slug, slug), eq(coursesTable.isPublished, true)));

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const sections = await db
      .select()
      .from(courseSectionsTable)
      .where(and(eq(courseSectionsTable.courseId, course.id), eq(courseSectionsTable.isPublished, true)))
      .orderBy(asc(courseSectionsTable.sortOrder));

    const lessons = await db
      .select()
      .from(lessonsTable)
      .where(and(eq(lessonsTable.courseId, course.id), eq(lessonsTable.isPublished, true)))
      .orderBy(asc(lessonsTable.sortOrder));

    let instructor = null;
    if (course.instructorId) {
      const [inst] = await db
        .select()
        .from(instructorsTable)
        .where(eq(instructorsTable.id, course.instructorId));
      instructor = inst || null;
    }

    const [enrollCount] = await db
      .select({ count: sql`count(*)::int` })
      .from(enrollmentsTable)
      .where(and(eq(enrollmentsTable.courseId, course.id), eq(enrollmentsTable.status, "active")));

    const approvedReviews = await db
      .select()
      .from(reviewsTable)
      .where(and(eq(reviewsTable.courseId, course.id), eq(reviewsTable.isApproved, true)))
      .orderBy(sql`created_at DESC`)
      .limit(10);

    const [avgRating] = await db
      .select({ avg: sql`COALESCE(AVG(rating)::numeric(3,1), 0)` })
      .from(reviewsTable)
      .where(and(eq(reviewsTable.courseId, course.id), eq(reviewsTable.isApproved, true)));

    const sectionsWithLessons = sections.map((section) => ({
      ...section,
      lessons: lessons.filter((l) => l.sectionId === section.id),
    }));

    const ungroupedLessons = lessons.filter((l) => !l.sectionId);

    res.json({
      course,
      sections: sectionsWithLessons,
      ungroupedLessons,
      instructor,
      enrollmentCount: enrollCount.count,
      reviews: approvedReviews,
      rating: parseFloat(avgRating.avg) || 0,
    });
  } catch (err) {
    console.error("GET /courses/:slug error:", err);
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

router.get("/courses/:slug/access", async (req, res) => {
  try {
    const { slug } = req.params;
    if (!req.isAuthenticated() || !req.user) {
      return res.json({ hasAccess: false, isAuthenticated: false });
    }

    const [course] = await db
      .select({ id: coursesTable.id })
      .from(coursesTable)
      .where(eq(coursesTable.slug, slug));

    if (!course) {
      return res.json({ hasAccess: false });
    }

    const [enrollment] = await db
      .select()
      .from(enrollmentsTable)
      .where(
        and(
          eq(enrollmentsTable.userId, req.user.id),
          eq(enrollmentsTable.courseId, course.id),
          eq(enrollmentsTable.status, "active")
        )
      );

    res.json({ hasAccess: !!enrollment, isAuthenticated: true });
  } catch (err) {
    console.error("GET /courses/:slug/access error:", err);
    res.status(500).json({ error: "Failed to check access" });
  }
});

export default router;
