import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  lessonsTable,
  lessonProgressTable,
  enrollmentsTable,
  coursesTable,
  courseTrainersTable,
  usersTable,
  lessonActivitiesTable,
  activitySubmissionsTable,
  activityReviewsTable,
  studentSkillScoresTable,
  studentFearMeterTable,
  badgesTable,
  studentBadgesTable,
  ACTIVITY_TYPES,
  type ActivityType,
} from "@workspace/db";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { isSupervisorOrAdmin, requireAdmin, requireRole } from "../lib/admin.js";
import { createNotification } from "../lib/notifications.js";
import { awardBadgeIfEligible } from "../lib/platform.js";

const router: IRouter = Router();

// ── Constants ──────────────────────────────────────────────────────────
export const SKILL_KEYS = [
  "idea", "structure", "voice", "body", "improvisation",
  "impact", "confidence", "fear_management",
] as const;

export const SKILL_LABELS_AR: Record<string, string> = {
  idea: "الفكرة",
  structure: "البناء",
  voice: "الصوت",
  body: "لغة الجسد",
  improvisation: "الارتجال",
  impact: "التأثير",
  confidence: "الثقة",
  fear_management: "إدارة الخوف",
};

export const RUBRIC_CRITERIA = [
  { key: "clarity",     ar: "وضوح الفكرة" },
  { key: "opening",     ar: "قوة البداية" },
  { key: "order",       ar: "ترتيب الخطاب" },
  { key: "voice",       ar: "الصوت والنبرة" },
  { key: "pace",        ar: "السرعة والتوقفات" },
  { key: "diction",     ar: "مخارج الحروف" },
  { key: "body",        ar: "لغة الجسد" },
  { key: "eye_contact", ar: "التواصل البصري" },
  { key: "closing",     ar: "قوة الخاتمة" },
  { key: "impact",      ar: "الأثر العام" },
] as const;

const DEFAULT_BADGES = [
  { key: "first_step", titleAr: "الخطوة الأولى", titleEn: "First Step",
    descriptionAr: "أكملت أول نشاط تفاعلي.", descriptionEn: "Completed your first activity.",
    icon: "Sparkles", criteria: { type: "activities_completed", value: 1 } },
  { key: "speaker_5", titleAr: "متدرب نشط", titleEn: "Active Trainee",
    descriptionAr: "أكملت 5 أنشطة.", descriptionEn: "Completed 5 activities.",
    icon: "Award", criteria: { type: "activities_completed", value: 5 } },
  { key: "fearless", titleAr: "مواجِه الخوف", titleEn: "Fearless",
    descriptionAr: "كسرت حاجز الخوف.", descriptionEn: "Broke the fear barrier.",
    icon: "Shield", criteria: { type: "skill_points", skillKey: "fear_management", value: 50 } },
  { key: "voice_master", titleAr: "سيد الصوت", titleEn: "Voice Master",
    descriptionAr: "تميّز في تمارين الصوت.", descriptionEn: "Excelled in voice exercises.",
    icon: "Mic", criteria: { type: "skill_points", skillKey: "voice", value: 50 } },
  { key: "course_complete", titleAr: "متخرج", titleEn: "Graduate",
    descriptionAr: "أكملت دورة كاملة.", descriptionEn: "Completed a full course.",
    icon: "GraduationCap", criteria: { type: "course_completed", value: 1 } },
] as const;

let bootstrapped = false;

// Bootstrap (idempotent): seed default badges + convert legacy lessons → video activities
// + back-fill activity_submissions for already-completed lessons so students keep progress.
export async function bootstrapActivities(): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;
  try {
    // Seed badges
    for (const b of DEFAULT_BADGES) {
      await db.insert(badgesTable).values({
        key: b.key, titleAr: b.titleAr, titleEn: b.titleEn,
        descriptionAr: b.descriptionAr, descriptionEn: b.descriptionEn,
        icon: b.icon, criteria: b.criteria as Record<string, unknown>,
      }).onConflictDoNothing();
    }
    // Find lessons without any activity
    const lessonsWithout = await db.execute(sql`
      SELECT l.id, l.title_ar, l.title_en, l.video_url, l.video_type
      FROM lessons l
      LEFT JOIN lesson_activities a ON a.lesson_id = l.id
      WHERE a.id IS NULL
    `);
    type Row = { id: string; title_ar: string; title_en: string; video_url: string | null; video_type: string | null };
    const rows = (lessonsWithout.rows ?? []) as Row[];
    for (const r of rows) {
      const [act] = await db.insert(lessonActivitiesTable).values({
        lessonId: r.id,
        type: "video",
        titleAr: r.title_ar || "الفيديو",
        titleEn: r.title_en || "Video",
        config: { videoUrl: r.video_url, videoType: r.video_type ?? "youtube" },
        sortOrder: 0,
        isRequired: true,
        skillKeys: [],
        pointsReward: 5,
      }).returning({ id: lessonActivitiesTable.id });

      // Back-fill submissions from existing lesson_progress=true
      if (act?.id) {
        await db.execute(sql`
          INSERT INTO activity_submissions (user_id, activity_id, lesson_id, status, attempt_number, payload)
          SELECT lp.user_id, ${act.id}, lp.lesson_id, 'completed', 1, '{}'::jsonb
          FROM lesson_progress lp
          WHERE lp.lesson_id = ${r.id} AND lp.completed = true
          ON CONFLICT DO NOTHING
        `);
      }
    }
  } catch (err) {
    console.error("[activities bootstrap] failed", err);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────
async function isCourseTrainer(userId: string, courseId: string): Promise<boolean> {
  const [row] = await db.select({ id: courseTrainersTable.id })
    .from(courseTrainersTable)
    .where(and(eq(courseTrainersTable.userId, userId), eq(courseTrainersTable.courseId, courseId)))
    .limit(1);
  return !!row;
}

async function getUserCoursesAsTrainer(userId: string): Promise<string[]> {
  const rows = await db.select({ courseId: courseTrainersTable.courseId })
    .from(courseTrainersTable)
    .where(eq(courseTrainersTable.userId, userId));
  return rows.map(r => r.courseId);
}

async function isEnrolled(userId: string, courseId: string): Promise<boolean> {
  const [row] = await db.select({ id: enrollmentsTable.id })
    .from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.courseId, courseId)))
    .limit(1);
  return !!row;
}

// Resolve { courseId, isFreePreview } for a lesson id, or null when missing.
async function getLessonContext(lessonId: string): Promise<{ courseId: string; isFreePreview: boolean } | null> {
  const [row] = await db.select({
    courseId: lessonsTable.courseId,
    isFreePreview: lessonsTable.isFreePreview,
  }).from(lessonsTable).where(eq(lessonsTable.id, lessonId)).limit(1);
  return row ?? null;
}

// Authorize a request to manage activities on a lesson:
//   - admins: always allowed
//   - trainers: must be assigned to the lesson's course
async function canManageLesson(req: Request, lessonId: string): Promise<{ ok: boolean; courseId?: string }> {
  if (!req.isAuthenticated() || !req.user?.id) return { ok: false };
  const ctx = await getLessonContext(lessonId);
  if (!ctx) return { ok: false };
  if (isSupervisorOrAdmin(req)) return { ok: true, courseId: ctx.courseId };
  if (await isCourseTrainer(req.user.id, ctx.courseId)) return { ok: true, courseId: ctx.courseId };
  return { ok: false, courseId: ctx.courseId };
}

async function recomputeLessonProgress(userId: string, lessonId: string): Promise<boolean> {
  // Get all required & published activities of the lesson
  const acts = await db.select({ id: lessonActivitiesTable.id, isRequired: lessonActivitiesTable.isRequired })
    .from(lessonActivitiesTable)
    .where(and(eq(lessonActivitiesTable.lessonId, lessonId), eq(lessonActivitiesTable.isPublished, true)));
  const required = acts.filter(a => a.isRequired);
  if (required.length === 0) return false;

  // Get LATEST submission per activity (ordered by attemptNumber desc, then createdAt desc).
  // We must compare against the most recent attempt only, not any historical "completed".
  const subs = await db.select({
    activityId: activitySubmissionsTable.activityId,
    status: activitySubmissionsTable.status,
    attemptNumber: activitySubmissionsTable.attemptNumber,
    createdAt: activitySubmissionsTable.createdAt,
  })
    .from(activitySubmissionsTable)
    .where(and(
      eq(activitySubmissionsTable.userId, userId),
      inArray(activitySubmissionsTable.activityId, required.map(a => a.id)),
    ))
    .orderBy(desc(activitySubmissionsTable.attemptNumber), desc(activitySubmissionsTable.createdAt));
  const byAct = new Map<string, string>();
  for (const s of subs) {
    if (!byAct.has(s.activityId)) byAct.set(s.activityId, s.status);
  }
  const allDone = required.every(a => byAct.get(a.id) === "completed");

  // Update lesson_progress
  const [existing] = await db.select({ id: lessonProgressTable.id, completed: lessonProgressTable.completed })
    .from(lessonProgressTable)
    .where(and(eq(lessonProgressTable.userId, userId), eq(lessonProgressTable.lessonId, lessonId)))
    .limit(1);
  if (existing) {
    if (allDone && !existing.completed) {
      await db.update(lessonProgressTable)
        .set({ completed: true, completedAt: new Date() })
        .where(eq(lessonProgressTable.id, existing.id));
    } else if (!allDone && existing.completed) {
      await db.update(lessonProgressTable)
        .set({ completed: false, completedAt: null })
        .where(eq(lessonProgressTable.id, existing.id));
    }
  } else if (allDone) {
    await db.insert(lessonProgressTable).values({ userId, lessonId, completed: true, completedAt: new Date() });
  }
  return allDone;
}

async function awardSkillPoints(userId: string, skillKeys: string[], points: number): Promise<void> {
  for (const key of skillKeys) {
    if (!SKILL_KEYS.includes(key as (typeof SKILL_KEYS)[number])) continue;
    await db.execute(sql`
      INSERT INTO student_skill_scores (user_id, skill_key, points)
      VALUES (${userId}, ${key}, ${points})
      ON CONFLICT (user_id, skill_key) DO UPDATE
        SET points = student_skill_scores.points + ${points},
            updated_at = NOW()
    `);
  }
}

async function checkAndAwardBadges(userId: string): Promise<void> {
  try {
    const allBadges = await db.select().from(badgesTable);
    const owned = await db.select({ badgeId: studentBadgesTable.badgeId })
      .from(studentBadgesTable)
      .where(eq(studentBadgesTable.userId, userId));
    const ownedSet = new Set(owned.map(o => o.badgeId));

    // Counts
    const [completedCount] = await db.select({ c: sql<number>`count(*)::int` })
      .from(activitySubmissionsTable)
      .where(and(eq(activitySubmissionsTable.userId, userId), eq(activitySubmissionsTable.status, "completed")));
    const skillRows = await db.select({ skillKey: studentSkillScoresTable.skillKey, points: studentSkillScoresTable.points })
      .from(studentSkillScoresTable)
      .where(eq(studentSkillScoresTable.userId, userId));
    const skillMap = new Map(skillRows.map(r => [r.skillKey, r.points]));

    for (const b of allBadges) {
      if (ownedSet.has(b.id)) continue;
      const c = b.criteria as { type?: string; value?: number; skillKey?: string };
      let earned = false;
      if (c.type === "activities_completed" && (completedCount?.c ?? 0) >= (c.value ?? 0)) earned = true;
      if (c.type === "skill_points" && c.skillKey && (skillMap.get(c.skillKey) ?? 0) >= (c.value ?? 0)) earned = true;
      // course_completed handled by certificates flow elsewhere; we mark when ANY enrollment status=completed
      if (c.type === "course_completed") {
        const [done] = await db.select({ c: sql<number>`count(*)::int` })
          .from(enrollmentsTable)
          .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.status, "completed")));
        if ((done?.c ?? 0) >= (c.value ?? 1)) earned = true;
      }
      if (earned) {
        await db.insert(studentBadgesTable).values({ userId, badgeId: b.id }).onConflictDoNothing();
        await createNotification({
          userId, type: "badge_awarded",
          titleAr: `🏆 شارة جديدة: ${b.titleAr}`,
          titleEn: `🏆 New badge: ${b.titleEn}`,
          bodyAr: b.descriptionAr ?? null,
          bodyEn: b.descriptionEn ?? null,
          link: "/dashboard?tab=skills",
        });
      }
    }
  } catch (err) {
    console.error("[badges] check failed", err);
  }
}

// ── list activities of a lesson (student player) ───────────────────────
// Access: must be admin, an assigned trainer of the course, an enrolled student,
// OR the lesson must be a free preview lesson (which we only expose minimally).
router.get("/lessons/:lessonId/activities", async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  try {
    const ctx = await getLessonContext(lessonId);
    if (!ctx) { res.status(404).json({ error: "Lesson not found" }); return; }
    const userId = req.isAuthenticated() ? req.user?.id : undefined;

    let allowed = ctx.isFreePreview;
    if (!allowed && userId) {
      if (isSupervisorOrAdmin(req)) allowed = true;
      else if (await isCourseTrainer(userId, ctx.courseId)) allowed = true;
      else if (await isEnrolled(userId, ctx.courseId)) allowed = true;
    }
    if (!allowed) {
      res.status(403).json({ error: "Enrollment required to view this lesson's activities" });
      return;
    }

    const acts = await db.select().from(lessonActivitiesTable)
      .where(and(eq(lessonActivitiesTable.lessonId, lessonId), eq(lessonActivitiesTable.isPublished, true)))
      .orderBy(asc(lessonActivitiesTable.sortOrder));
    const myProgress: Record<string, { status: string; attemptNumber: number; autoScore: number | null }> = {};
    if (userId) {
      const subs = await db.select().from(activitySubmissionsTable)
        .where(and(
          eq(activitySubmissionsTable.userId, userId),
          eq(activitySubmissionsTable.lessonId, lessonId),
        ))
        .orderBy(desc(activitySubmissionsTable.attemptNumber), desc(activitySubmissionsTable.createdAt));
      for (const s of subs) {
        if (!myProgress[s.activityId]) {
          myProgress[s.activityId] = { status: s.status, attemptNumber: s.attemptNumber, autoScore: s.autoScore };
        }
      }
    }
    res.json({ activities: acts, myProgress });
  } catch (err) {
    req.log.error({ err }, "list activities failed");
    res.status(500).json({ error: "Failed to load activities" });
  }
});

// ── STUDENT: submit/complete activity ──────────────────────────────────
router.post("/activities/:activityId/submit", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { activityId } = req.params;
  const userId = req.user.id;
  const body = (req.body ?? {}) as { payload?: unknown; mediaUrl?: unknown; autoScore?: unknown };
  try {
    const [act] = await db.select().from(lessonActivitiesTable)
      .where(eq(lessonActivitiesTable.id, activityId)).limit(1);
    if (!act) { res.status(404).json({ error: "Activity not found" }); return; }

    const [lesson] = await db.select({ courseId: lessonsTable.courseId })
      .from(lessonsTable).where(eq(lessonsTable.id, act.lessonId)).limit(1);
    if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }
    if (!(await isEnrolled(userId, lesson.courseId))) {
      res.status(403).json({ error: "Not enrolled" });
      return;
    }

    // Decide initial status by activity type:
    //   video / text / reflection / self_assessment / drag_drop / quiz / scenario / speech_builder / challenge → completed (auto)
    //   voice_recording / video_submission / coach_feedback → pending (await trainer review)
    const TRAINER_REVIEWED: ActivityType[] = ["voice_recording", "video_submission", "coach_feedback"];
    const initialStatus: "pending" | "completed" = TRAINER_REVIEWED.includes(act.type) ? "pending" : "completed";

    // Compute attempt number
    const [last] = await db.select({ n: sql<number>`MAX(${activitySubmissionsTable.attemptNumber})::int` })
      .from(activitySubmissionsTable)
      .where(and(eq(activitySubmissionsTable.userId, userId), eq(activitySubmissionsTable.activityId, activityId)));
    const attemptNumber = (last?.n ?? 0) + 1;

    const autoScore = typeof body.autoScore === "number" ? Math.max(0, Math.min(100, Math.round(body.autoScore))) : null;
    const mediaUrl = typeof body.mediaUrl === "string" && body.mediaUrl.trim() ? body.mediaUrl.trim() : null;
    const payload = (body.payload && typeof body.payload === "object") ? body.payload as Record<string, unknown> : {};

    const [sub] = await db.insert(activitySubmissionsTable).values({
      userId, activityId, lessonId: act.lessonId,
      attemptNumber, status: initialStatus, autoScore, mediaUrl, payload,
    }).returning();

    // If completed automatically, award skills + check progress + badges.
    // Only award skill points the FIRST time this activity is completed for the user,
    // to prevent farming via repeated attempts.
    if (initialStatus === "completed") {
      const [prior] = await db.select({ id: activitySubmissionsTable.id })
        .from(activitySubmissionsTable)
        .where(and(
          eq(activitySubmissionsTable.userId, userId),
          eq(activitySubmissionsTable.activityId, activityId),
          eq(activitySubmissionsTable.status, "completed"),
        ))
        .limit(2); // we just inserted one, so 1 means first-ever completion
      const isFirstCompletion = !prior || (await db.select({ c: sql<number>`count(*)::int` })
        .from(activitySubmissionsTable)
        .where(and(
          eq(activitySubmissionsTable.userId, userId),
          eq(activitySubmissionsTable.activityId, activityId),
          eq(activitySubmissionsTable.status, "completed"),
        )))[0]?.c === 1;
      if (isFirstCompletion) {
        await awardSkillPoints(userId, act.skillKeys ?? [], act.pointsReward);
      }
      const lessonCompleted = await recomputeLessonProgress(userId, act.lessonId);
      await checkAndAwardBadges(userId);

      // ── Little Speaker badge events (event-based system) ──
      // Strong start: any first activity ever
      const [totalDone] = await db.select({ c: sql<number>`count(*)::int` })
        .from(activitySubmissionsTable)
        .where(and(
          eq(activitySubmissionsTable.userId, userId),
          eq(activitySubmissionsTable.status, "completed"),
        ));
      if ((totalDone?.c ?? 0) === 1) {
        await awardBadgeIfEligible(userId, "kid_strong_start", { activityId });
      }
      // "Little Leader": 5 distinct passed activities (matches trainer-review path).
      const distinctPassed = await db.selectDistinct({ activityId: activitySubmissionsTable.activityId })
        .from(activitySubmissionsTable)
        .where(and(
          eq(activitySubmissionsTable.userId, userId),
          eq(activitySubmissionsTable.status, "completed"),
        ));
      if (distinctPassed.length >= 5) {
        await awardBadgeIfEligible(userId, "kid_little_leader", { count: distinctPassed.length });
      }
      // Cross-activity self-assessment prompt: ask "كيف كان شعورك؟" after every
      // completed activity (skip when the activity *is* a self_assessment).
      // The actual UI/persistence is the kid-friendly modal in learn.tsx that
      // posts to POST /me/submissions/:id/self-assessment.
      if (act.type !== "self_assessment") {
        await createNotification({
          userId,
          type: "self_assessment_prompt",
          titleAr: "كيف كان شعورك؟ ⭐",
          titleEn: "How did that feel?",
          bodyAr: "قيّم نشاطك الأخير بنجمة واحدة بسيطة 🌟",
          bodyEn: "Rate your last activity with a quick star.",
          link: `/courses`,
        });
      }
      if (act.type === "challenge") {
        await awardBadgeIfEligible(userId, "kid_challenge_champion", { activityId });
      }
      // Self-assessment: confident_speaker if autoScore (0..100) ≥ 75
      if (act.type === "self_assessment" && (autoScore ?? 0) >= 75) {
        await awardBadgeIfEligible(userId, "kid_confident_speaker", { activityId, autoScore });
      }
      if (lessonCompleted) {
        await awardBadgeIfEligible(userId, "lesson_completed", { lessonId: act.lessonId });
      }
    } else {
      // Notify trainers of the course
      const trainers = await db.select({ userId: courseTrainersTable.userId })
        .from(courseTrainersTable).where(eq(courseTrainersTable.courseId, lesson.courseId));
      for (const t of trainers) {
        await createNotification({
          userId: t.userId, type: "submission_pending",
          titleAr: "تسليم جديد بانتظار المراجعة",
          titleEn: "New submission awaiting review",
          link: "/instructor/reviews",
        });
      }
    }
    res.json({ submission: sub, status: initialStatus });
  } catch (err) {
    req.log.error({ err }, "submit activity failed");
    res.status(500).json({ error: "Failed to submit" });
  }
});

// ── STUDENT: fear meter ────────────────────────────────────────────────
router.post("/me/fear-meter", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  const level = Math.max(0, Math.min(100, Math.round(Number((req.body ?? {}).level ?? 0))));
  const note = typeof (req.body ?? {}).note === "string" ? String((req.body ?? {}).note).slice(0, 500) : null;
  try {
    const [row] = await db.insert(studentFearMeterTable).values({ userId: req.user.id, level, note }).returning();
    res.json({ entry: row });
  } catch (err) {
    req.log.error({ err }, "fear meter failed");
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/me/fear-meter", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  const rows = await db.select().from(studentFearMeterTable)
    .where(eq(studentFearMeterTable.userId, req.user.id))
    .orderBy(desc(studentFearMeterTable.createdAt))
    .limit(50);
  res.json({ entries: rows });
});

// ── STUDENT: skills + badges ───────────────────────────────────────────
router.get("/me/skills", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  const rows = await db.select().from(studentSkillScoresTable)
    .where(eq(studentSkillScoresTable.userId, req.user.id));
  const map: Record<string, number> = {};
  for (const k of SKILL_KEYS) map[k] = 0;
  for (const r of rows) map[r.skillKey] = r.points;
  res.json({ skills: map, labelsAr: SKILL_LABELS_AR });
});

router.get("/me/badges", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  const all = await db.select().from(badgesTable).orderBy(asc(badgesTable.createdAt));
  const owned = await db.select({ badgeId: studentBadgesTable.badgeId, awardedAt: studentBadgesTable.awardedAt })
    .from(studentBadgesTable)
    .where(eq(studentBadgesTable.userId, req.user.id));
  const ownedMap = new Map(owned.map(o => [o.badgeId, o.awardedAt]));
  res.json({
    badges: all.map(b => ({
      id: b.id, key: b.key, titleAr: b.titleAr, titleEn: b.titleEn,
      descriptionAr: b.descriptionAr, descriptionEn: b.descriptionEn,
      icon: b.icon, owned: ownedMap.has(b.id),
      awardedAt: ownedMap.get(b.id) ?? null,
    })),
  });
});

// ── ADMIN/TRAINER: CRUD activities ─────────────────────────────────────
// All endpoints below require the user to be either an admin OR an assigned
// trainer for the lesson's course. Trainers cannot manage other courses.
router.get("/admin/lessons/:lessonId/activities", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "supervisor", "trainer")) return;
  const { lessonId } = req.params;
  const auth = await canManageLesson(req, lessonId);
  if (!auth.ok) { res.status(403).json({ error: "Not authorized for this course" }); return; }
  const acts = await db.select().from(lessonActivitiesTable)
    .where(eq(lessonActivitiesTable.lessonId, lessonId))
    .orderBy(asc(lessonActivitiesTable.sortOrder));
  res.json({ activities: acts });
});

router.post("/admin/lessons/:lessonId/activities", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "supervisor", "trainer")) return;
  const { lessonId } = req.params;
  const auth = await canManageLesson(req, lessonId);
  if (!auth.ok) { res.status(403).json({ error: "Not authorized for this course" }); return; }
  const body = req.body ?? {};
  const type = String(body.type ?? "");
  if (!ACTIVITY_TYPES.includes(type as ActivityType)) {
    res.status(400).json({ error: "Invalid activity type" });
    return;
  }
  // Determine sort order = last+1
  const [last] = await db.select({ n: sql<number>`COALESCE(MAX(${lessonActivitiesTable.sortOrder}), -1)::int` })
    .from(lessonActivitiesTable).where(eq(lessonActivitiesTable.lessonId, lessonId));
  const [act] = await db.insert(lessonActivitiesTable).values({
    lessonId,
    type: type as ActivityType,
    titleAr: String(body.titleAr ?? "نشاط"),
    titleEn: body.titleEn ? String(body.titleEn) : null,
    instructionsAr: body.instructionsAr ? String(body.instructionsAr) : null,
    instructionsEn: body.instructionsEn ? String(body.instructionsEn) : null,
    config: (body.config && typeof body.config === "object") ? body.config : {},
    sortOrder: (last?.n ?? -1) + 1,
    isRequired: body.isRequired !== false,
    skillKeys: Array.isArray(body.skillKeys) ? body.skillKeys.filter((s: unknown) => typeof s === "string") : [],
    pointsReward: typeof body.pointsReward === "number" ? body.pointsReward : 10,
    isPublished: body.isPublished !== false,
  }).returning();
  res.json({ activity: act });
});

router.patch("/admin/activities/:id", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "supervisor", "trainer")) return;
  const { id } = req.params;
  const [existing] = await db.select({ lessonId: lessonActivitiesTable.lessonId })
    .from(lessonActivitiesTable).where(eq(lessonActivitiesTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Activity not found" }); return; }
  const auth = await canManageLesson(req, existing.lessonId);
  if (!auth.ok) { res.status(403).json({ error: "Not authorized for this course" }); return; }
  const body = req.body ?? {};
  const upd: Record<string, unknown> = {};
  if (typeof body.titleAr === "string") upd.titleAr = body.titleAr;
  if (typeof body.titleEn === "string") upd.titleEn = body.titleEn;
  if (typeof body.instructionsAr === "string") upd.instructionsAr = body.instructionsAr;
  if (typeof body.instructionsEn === "string") upd.instructionsEn = body.instructionsEn;
  if (body.config && typeof body.config === "object") upd.config = body.config;
  if (typeof body.isRequired === "boolean") upd.isRequired = body.isRequired;
  if (typeof body.isPublished === "boolean") upd.isPublished = body.isPublished;
  if (Array.isArray(body.skillKeys)) upd.skillKeys = body.skillKeys.filter((s: unknown) => typeof s === "string");
  if (typeof body.pointsReward === "number") upd.pointsReward = body.pointsReward;
  if (typeof body.sortOrder === "number") upd.sortOrder = body.sortOrder;
  if (typeof body.type === "string" && ACTIVITY_TYPES.includes(body.type as ActivityType)) upd.type = body.type;
  const [act] = await db.update(lessonActivitiesTable).set(upd).where(eq(lessonActivitiesTable.id, id)).returning();
  res.json({ activity: act });
});

router.delete("/admin/activities/:id", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "supervisor", "trainer")) return;
  const [existing] = await db.select({ lessonId: lessonActivitiesTable.lessonId })
    .from(lessonActivitiesTable).where(eq(lessonActivitiesTable.id, req.params.id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Activity not found" }); return; }
  const auth = await canManageLesson(req, existing.lessonId);
  if (!auth.ok) { res.status(403).json({ error: "Not authorized for this course" }); return; }
  await db.delete(lessonActivitiesTable).where(eq(lessonActivitiesTable.id, req.params.id));
  res.json({ ok: true });
});

router.post("/admin/lessons/:lessonId/activities/reorder", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "supervisor", "trainer")) return;
  const { lessonId } = req.params;
  const auth = await canManageLesson(req, lessonId);
  if (!auth.ok) { res.status(403).json({ error: "Not authorized for this course" }); return; }
  const ids: unknown[] = Array.isArray(req.body?.ids) ? req.body.ids : [];
  // Limit reorder to ids that actually belong to THIS lesson, so a trainer
  // can't reorder activities from another course by smuggling foreign ids.
  const lessonActIds = new Set(
    (await db.select({ id: lessonActivitiesTable.id })
      .from(lessonActivitiesTable).where(eq(lessonActivitiesTable.lessonId, lessonId))).map(r => r.id),
  );
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (typeof id !== "string" || !lessonActIds.has(id)) continue;
    await db.update(lessonActivitiesTable)
      .set({ sortOrder: i })
      .where(eq(lessonActivitiesTable.id, id));
  }
  res.json({ ok: true });
});

// ── TRAINER: list pending submissions ──────────────────────────────────
router.get("/instructor/submissions", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "supervisor", "trainer")) return;
  const userId = req.user!.id;
  const status = String(req.query.status ?? "pending");

  let courseIds: string[] | null = null;
  if (!isSupervisorOrAdmin(req)) {
    courseIds = await getUserCoursesAsTrainer(userId);
    if (courseIds.length === 0) { res.json({ submissions: [] }); return; }
  }

  // Get submissions joined to lesson, course, user
  const conds = [eq(activitySubmissionsTable.status, status as "pending" | "completed" | "needs_revision")];
  const rows = await db.select({
    id: activitySubmissionsTable.id,
    activityId: activitySubmissionsTable.activityId,
    userId: activitySubmissionsTable.userId,
    lessonId: activitySubmissionsTable.lessonId,
    status: activitySubmissionsTable.status,
    attemptNumber: activitySubmissionsTable.attemptNumber,
    mediaUrl: activitySubmissionsTable.mediaUrl,
    payload: activitySubmissionsTable.payload,
    createdAt: activitySubmissionsTable.createdAt,
    activityType: lessonActivitiesTable.type,
    activityTitleAr: lessonActivitiesTable.titleAr,
    lessonTitleAr: lessonsTable.titleAr,
    courseId: lessonsTable.courseId,
    courseTitleAr: coursesTable.titleAr,
    courseSlug: coursesTable.slug,
    studentEmail: usersTable.email,
    studentFirst: usersTable.firstName,
    studentLast: usersTable.lastName,
  })
    .from(activitySubmissionsTable)
    .innerJoin(lessonActivitiesTable, eq(lessonActivitiesTable.id, activitySubmissionsTable.activityId))
    .innerJoin(lessonsTable, eq(lessonsTable.id, activitySubmissionsTable.lessonId))
    .innerJoin(coursesTable, eq(coursesTable.id, lessonsTable.courseId))
    .innerJoin(usersTable, eq(usersTable.id, activitySubmissionsTable.userId))
    .where(and(...conds, courseIds ? inArray(lessonsTable.courseId, courseIds) : sql`true`))
    .orderBy(desc(activitySubmissionsTable.createdAt))
    .limit(200);

  res.json({ submissions: rows });
});

// ── TRAINER: review a submission (rubric + decision) ───────────────────
router.post("/instructor/submissions/:id/review", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "supervisor", "trainer")) return;
  const reviewerId = req.user!.id;
  const { id } = req.params;
  const body = req.body ?? {};

  const [sub] = await db.select({
    id: activitySubmissionsTable.id,
    userId: activitySubmissionsTable.userId,
    activityId: activitySubmissionsTable.activityId,
    lessonId: activitySubmissionsTable.lessonId,
    courseId: lessonsTable.courseId,
  })
    .from(activitySubmissionsTable)
    .innerJoin(lessonsTable, eq(lessonsTable.id, activitySubmissionsTable.lessonId))
    .where(eq(activitySubmissionsTable.id, id))
    .limit(1);
  if (!sub) { res.status(404).json({ error: "Not found" }); return; }
  if (!isSupervisorOrAdmin(req) && !(await isCourseTrainer(reviewerId, sub.courseId))) {
    res.status(403).json({ error: "Not authorized for this course" });
    return;
  }

  const rubricRaw = (body.rubricScores && typeof body.rubricScores === "object") ? body.rubricScores : {};
  const rubricScores: Record<string, number> = {};
  let total = 0;
  for (const c of RUBRIC_CRITERIA) {
    const v = Math.max(0, Math.min(10, Math.round(Number(rubricRaw[c.key] ?? 0))));
    rubricScores[c.key] = v;
    total += v;
  }
  const decision: "pass" | "needs_revision" = body.decision === "needs_revision" ? "needs_revision" : "pass";
  const feedbackAr = typeof body.feedbackAr === "string" ? body.feedbackAr.slice(0, 4000) : null;
  const feedbackEn = typeof body.feedbackEn === "string" ? body.feedbackEn.slice(0, 4000) : null;

  const [thisReview] = await db.insert(activityReviewsTable).values({
    submissionId: id, reviewerId, rubricScores, totalScore: total,
    feedbackAr, feedbackEn, decision,
  }).returning();

  const newStatus = decision === "pass" ? "completed" : "needs_revision";
  await db.update(activitySubmissionsTable)
    .set({ status: newStatus, autoScore: total })
    .where(eq(activitySubmissionsTable.id, id));

  if (decision === "pass") {
    const [act] = await db.select().from(lessonActivitiesTable).where(eq(lessonActivitiesTable.id, sub.activityId)).limit(1);
    // Dedupe: only award skill points the first time the student gets a passing
    // review for this activity. Look for any earlier activity_reviews row with
    // decision=pass on a submission belonging to (userId, activityId).
    // Compare against the just-inserted review's own id (NOT the submission id)
    // so we exclude this very review when checking for any prior passing review.
    const [priorPass] = await db.select({ id: activityReviewsTable.id })
      .from(activityReviewsTable)
      .innerJoin(activitySubmissionsTable, eq(activitySubmissionsTable.id, activityReviewsTable.submissionId))
      .where(and(
        eq(activitySubmissionsTable.userId, sub.userId),
        eq(activitySubmissionsTable.activityId, sub.activityId),
        eq(activityReviewsTable.decision, "pass"),
        sql`${activityReviewsTable.id} <> ${thisReview.id}`,
      ))
      .limit(1);
    if (!priorPass) {
      await awardSkillPoints(sub.userId, act?.skillKeys ?? [], act?.pointsReward ?? 10);
    }
    const lessonNowComplete = await recomputeLessonProgress(sub.userId, sub.lessonId);
    await checkAndAwardBadges(sub.userId);
    // Little Speaker: "صوت واضح" after 3 passed voice_recording reviews.
    if (act?.type === "voice_recording") {
      const passedVoice = await db.selectDistinct({ activityId: activitySubmissionsTable.activityId })
        .from(activitySubmissionsTable)
        .innerJoin(lessonActivitiesTable, eq(lessonActivitiesTable.id, activitySubmissionsTable.activityId))
        .where(and(
          eq(activitySubmissionsTable.userId, sub.userId),
          eq(activitySubmissionsTable.status, "completed"),
          eq(lessonActivitiesTable.type, "voice_recording"),
        ));
      if (passedVoice.length >= 3) {
        await awardBadgeIfEligible(sub.userId, "kid_voice_clear", { count: passedVoice.length });
      }
    }
    // Self-assessment prompt after a trainer-passed submission too.
    if (decision === "pass") {
      await createNotification({
        userId: sub.userId,
        type: "self_assessment_prompt",
        titleAr: "كيف كان شعورك؟ ⭐",
        titleEn: "How did that feel?",
        bodyAr: "قيّم تجربتك بعد مراجعة المدرّب 🌟",
        bodyEn: "Rate how you felt after the review.",
        link: `/courses`,
      });
    }
    // "Little Leader": 5 distinct passed activities (any type).
    const distinctPassed = await db.selectDistinct({ activityId: activitySubmissionsTable.activityId })
      .from(activitySubmissionsTable)
      .where(and(
        eq(activitySubmissionsTable.userId, sub.userId),
        eq(activitySubmissionsTable.status, "completed"),
      ));
    if (distinctPassed.length >= 5) {
      await awardBadgeIfEligible(sub.userId, "kid_little_leader", { count: distinctPassed.length });
    }
    if (lessonNowComplete) {
      await awardBadgeIfEligible(sub.userId, "lesson_completed", { lessonId: sub.lessonId });
    }
  }

  // Resolve course slug for the deep link (route is /courses/:slug/learn).
  const [course] = await db.select({ slug: coursesTable.slug })
    .from(coursesTable).where(eq(coursesTable.id, sub.courseId)).limit(1);
  await createNotification({
    userId: sub.userId,
    type: "submission_reviewed",
    titleAr: decision === "pass" ? "تمّت مراجعة تسليمك ✅" : "تحتاج إعادة محاولة 🔁",
    titleEn: decision === "pass" ? "Your submission was approved" : "Your submission needs revision",
    bodyAr: feedbackAr,
    bodyEn: feedbackEn,
    link: course?.slug ? `/courses/${course.slug}/learn` : "/dashboard",
  });

  res.json({ ok: true, status: newStatus, totalScore: total });
});

// ── TRAINER: get full submission detail (with activity + reviews) ─────
router.get("/instructor/submissions/:id", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "supervisor", "trainer")) return;
  const { id } = req.params;
  const [sub] = await db.select({
    id: activitySubmissionsTable.id,
    userId: activitySubmissionsTable.userId,
    activityId: activitySubmissionsTable.activityId,
    lessonId: activitySubmissionsTable.lessonId,
    status: activitySubmissionsTable.status,
    attemptNumber: activitySubmissionsTable.attemptNumber,
    mediaUrl: activitySubmissionsTable.mediaUrl,
    payload: activitySubmissionsTable.payload,
    createdAt: activitySubmissionsTable.createdAt,
    courseId: lessonsTable.courseId,
  })
    .from(activitySubmissionsTable)
    .innerJoin(lessonsTable, eq(lessonsTable.id, activitySubmissionsTable.lessonId))
    .where(eq(activitySubmissionsTable.id, id)).limit(1);
  if (!sub) { res.status(404).json({ error: "Not found" }); return; }
  if (!isSupervisorOrAdmin(req) && !(await isCourseTrainer(req.user!.id, sub.courseId))) {
    res.status(403).json({ error: "Not authorized" }); return;
  }
  const [act] = await db.select().from(lessonActivitiesTable).where(eq(lessonActivitiesTable.id, sub.activityId)).limit(1);
  const reviews = await db.select().from(activityReviewsTable).where(eq(activityReviewsTable.submissionId, id))
    .orderBy(desc(activityReviewsTable.createdAt));
  const [user] = await db.select({ email: usersTable.email, firstName: usersTable.firstName, lastName: usersTable.lastName })
    .from(usersTable).where(eq(usersTable.id, sub.userId)).limit(1);
  res.json({ submission: sub, activity: act ?? null, reviews, student: user ?? null, rubricCriteria: RUBRIC_CRITERIA });
});

// ── ADMIN: badges CRUD (admin only) ────────────────────────────────────
// Kid-friendly post-activity self-assessment: persist 1..5 rating with the
// most recent submission for the (user, activity) pair. This is the FE flow
// triggered immediately after every activity submission (and after a passing
// trainer review for trainer-reviewed activity types).
router.post("/me/submissions/:id/self-assessment", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  const userId = req.user.id;
  const { id } = req.params;
  const rating = Math.round(Number((req.body ?? {}).rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    res.status(400).json({ error: "rating must be 1..5" }); return;
  }
  try {
    const [sub] = await db.select({ id: activitySubmissionsTable.id, userId: activitySubmissionsTable.userId })
      .from(activitySubmissionsTable).where(eq(activitySubmissionsTable.id, id)).limit(1);
    if (!sub || sub.userId !== userId) { res.status(404).json({ error: "Not found" }); return; }
    await db.update(activitySubmissionsTable)
      .set({ selfAssessmentRating: rating, selfAssessmentAt: new Date() })
      .where(eq(activitySubmissionsTable.id, id));
    res.json({ ok: true, rating });
  } catch (err) {
    req.log.error({ err }, "self-assessment save failed");
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/admin/badges", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const rows = await db.select().from(badgesTable).orderBy(asc(badgesTable.createdAt));
  res.json({ badges: rows });
});

export default router;
