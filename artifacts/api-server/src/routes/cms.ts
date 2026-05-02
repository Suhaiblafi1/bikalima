import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  homePageSectionsTable,
  workbooksTable,
  fieldMediaTable,
  adminActivitiesTable,
} from "@workspace/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { requireAdmin, requireRole } from "../lib/admin.js";

// Allow trainers to also manage the field-media library + analysis (UI shows
// the page to admin+trainer; keep the API authorization aligned with that).
function requireFieldMediaAccess(req: Request, res: Response): boolean {
  return requireRole(req, res, "admin", "trainer");
}

const router: IRouter = Router();

// ── Helpers ─────────────────────────────────────────────────────────────
async function logActivity(
  req: Request,
  action: string,
  entityType: string,
  entityId: string | null,
  description: string,
) {
  try {
    await db.insert(adminActivitiesTable).values({
      actorUserId: req.user?.id ?? null,
      actorEmail: req.user?.email ?? null,
      action,
      entityType,
      entityId,
      description,
    });
  } catch (err) {
    req.log?.warn({ err }, "Failed to log admin activity");
  }
}

const HOME_SECTION_KEYS = [
  "hero",
  "about-trainer",
  "why-bikalima",
  "programs",
  "events",
  "gallery-preview",
  "field-videos",
  "testimonials",
  "faq",
  "enrollment-form",
  "footer",
] as const;

type SectionKey = (typeof HOME_SECTION_KEYS)[number];
function isSectionKey(v: unknown): v is SectionKey {
  return typeof v === "string" && (HOME_SECTION_KEYS as readonly string[]).includes(v);
}

// ── HOME PAGE SECTIONS (admin) ──────────────────────────────────────────
router.get("/admin/home-sections", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const rows = await db.select().from(homePageSectionsTable);
    const byKey = new Map(rows.map((r) => [r.sectionKey, r] as const));
    // Always return the canonical list, filling gaps with defaults so the
    // admin UI shows every section even if no row exists yet.
    const sections = HOME_SECTION_KEYS.map((key, idx) => {
      const existing = byKey.get(key);
      return existing ?? {
        sectionKey: key,
        contentAr: null,
        contentEn: null,
        visible: true,
        orderIndex: idx,
        status: "published" as const,
        publishedAt: null,
        updatedAt: new Date().toISOString(),
      };
    });
    res.json({ sections, validKeys: HOME_SECTION_KEYS });
  } catch (err) {
    req.log.error({ err }, "Failed to load home sections");
    res.status(500).json({ error: "Failed to load home sections" });
  }
});

router.put("/admin/home-sections/:key", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const { key } = req.params;
  if (!isSectionKey(key)) return res.status(400).json({ error: "Invalid section key" });
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const values = {
      sectionKey: key,
      contentAr: (body.contentAr ?? null) as Record<string, unknown> | null,
      contentEn: (body.contentEn ?? null) as Record<string, unknown> | null,
      visible: body.visible === undefined ? true : Boolean(body.visible),
      orderIndex: typeof body.orderIndex === "number" ? body.orderIndex : 0,
      status: (body.status === "draft" ? "draft" : "published") as "draft" | "published",
      publishedAt: body.status === "draft" ? null : new Date(),
    };
    const [row] = await db
      .insert(homePageSectionsTable)
      .values(values)
      .onConflictDoUpdate({
        target: homePageSectionsTable.sectionKey,
        set: {
          contentAr: values.contentAr,
          contentEn: values.contentEn,
          visible: values.visible,
          orderIndex: values.orderIndex,
          status: values.status,
          publishedAt: values.publishedAt,
        },
      })
      .returning();
    await logActivity(req, "update", "home-section", key, `Updated home section "${key}"`);
    res.json({ section: row });
  } catch (err) {
    req.log.error({ err, key }, "Failed to upsert home section");
    res.status(500).json({ error: "Failed to save home section" });
  }
});

// Public read (only published + visible)
router.get("/home-sections", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(homePageSectionsTable)
      .where(and(eq(homePageSectionsTable.status, "published"), eq(homePageSectionsTable.visible, true)));
    res.json({ sections: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to load home sections" });
  }
});

// ── WORKBOOKS (admin CRUD) ──────────────────────────────────────────────
type WorkbookBody = {
  slug?: string;
  titleAr?: string;
  titleEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  priceJod?: number | null;
  coverImageUrl?: string | null;
  samplePdfUrl?: string | null;
  topicsAr?: string[] | null;
  topicsEn?: string[] | null;
  format?: "digital" | "printed" | "both";
  linkedCourseId?: string | null;
  linkedProgramId?: string | null;
  status?: "draft" | "published" | "hidden";
  orderIndex?: number;
};

router.get("/admin/workbooks", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const rows = await db
      .select()
      .from(workbooksTable)
      .orderBy(workbooksTable.orderIndex, desc(workbooksTable.createdAt));
    res.json({ workbooks: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to list workbooks");
    res.status(500).json({ error: "Failed to list workbooks" });
  }
});

router.post("/admin/workbooks", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const body = (req.body ?? {}) as WorkbookBody;
    if (!body.slug || !body.titleAr) {
      return res.status(400).json({ error: "slug and titleAr are required" });
    }
    const [row] = await db
      .insert(workbooksTable)
      .values({
        slug: body.slug,
        titleAr: body.titleAr,
        titleEn: body.titleEn ?? null,
        descriptionAr: body.descriptionAr ?? null,
        descriptionEn: body.descriptionEn ?? null,
        priceJod: body.priceJod ?? null,
        coverImageUrl: body.coverImageUrl ?? null,
        samplePdfUrl: body.samplePdfUrl ?? null,
        topicsAr: body.topicsAr ?? null,
        topicsEn: body.topicsEn ?? null,
        format: body.format ?? "both",
        linkedCourseId: body.linkedCourseId ?? null,
        linkedProgramId: body.linkedProgramId ?? null,
        status: body.status ?? "draft",
        orderIndex: body.orderIndex ?? 0,
      })
      .returning();
    await logActivity(req, "create", "workbook", row.id, `Created workbook "${row.titleAr}"`);
    res.status(201).json({ workbook: row });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "23505") {
      return res.status(409).json({ error: "duplicate-slug", message: "هذا الـ slug مستخدم بالفعل لكراسة أخرى." });
    }
    req.log.error({ err }, "Failed to create workbook");
    res.status(500).json({ error: "Failed to create workbook" });
  }
});

router.patch("/admin/workbooks/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  try {
    const body = (req.body ?? {}) as WorkbookBody;
    const update: Record<string, unknown> = {};
    const allowed: (keyof WorkbookBody)[] = [
      "slug", "titleAr", "titleEn", "descriptionAr", "descriptionEn",
      "priceJod", "coverImageUrl", "samplePdfUrl", "topicsAr", "topicsEn",
      "format", "linkedCourseId", "linkedProgramId", "status", "orderIndex",
    ];
    for (const k of allowed) {
      if (k in body) update[k] = (body as Record<string, unknown>)[k];
    }
    const [row] = await db
      .update(workbooksTable)
      .set(update)
      .where(eq(workbooksTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Workbook not found" });
    await logActivity(req, "update", "workbook", row.id, `Updated workbook "${row.titleAr}"`);
    res.json({ workbook: row });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "23505") {
      return res.status(409).json({ error: "duplicate-slug", message: "هذا الـ slug مستخدم بالفعل لكراسة أخرى." });
    }
    req.log.error({ err, id }, "Failed to update workbook");
    res.status(500).json({ error: "Failed to update workbook" });
  }
});

router.delete("/admin/workbooks/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  try {
    const [row] = await db.delete(workbooksTable).where(eq(workbooksTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Workbook not found" });
    await logActivity(req, "delete", "workbook", id, `Deleted workbook "${row.titleAr}"`);
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err, id }, "Failed to delete workbook");
    res.status(500).json({ error: "Failed to delete workbook" });
  }
});

// Public read
router.get("/workbooks-cms", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(workbooksTable)
      .where(eq(workbooksTable.status, "published"))
      .orderBy(workbooksTable.orderIndex);
    res.json({ workbooks: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to load workbooks" });
  }
});

// ── FIELD MEDIA + Media Analysis (admin CRUD) ───────────────────────────
type FieldMediaBody = {
  mediaType?: "youtube" | "upload" | "image" | "instagram" | "tiktok";
  mediaUrl?: string;
  thumbnailUrl?: string | null;
  titleAr?: string;
  titleEn?: string | null;
  speakerName?: string | null;
  category?: string | null;
  targetSkill?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  linkedProgramId?: string | null;
  linkedWorkbookId?: string | null;
  placement?: string[] | null;
  status?: "draft" | "published" | "hidden";
  orderIndex?: number;
  analysisSkill?: string | null;
  analysisObserveAr?: string | null;
  analysisWhyAr?: string | null;
  analysisLearnAr?: string | null;
  analysisMistakesAr?: string | null;
  analysisExerciseAr?: string | null;
  analysisDifficulty?: "beginner" | "intermediate" | "advanced" | null;
  analysisLinkedTopic?: string | null;
};

router.get("/admin/field-media", async (req: Request, res: Response) => {
  if (!requireFieldMediaAccess(req, res)) return;
  try {
    const rows = await db
      .select()
      .from(fieldMediaTable)
      .orderBy(fieldMediaTable.orderIndex, desc(fieldMediaTable.createdAt));
    res.json({ items: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to list field media");
    res.status(500).json({ error: "Failed to list field media" });
  }
});

router.post("/admin/field-media", async (req: Request, res: Response) => {
  if (!requireFieldMediaAccess(req, res)) return;
  try {
    const body = (req.body ?? {}) as FieldMediaBody;
    if (!body.mediaType || !body.mediaUrl || !body.titleAr) {
      return res.status(400).json({ error: "mediaType, mediaUrl, titleAr are required" });
    }
    const [row] = await db
      .insert(fieldMediaTable)
      .values({
        mediaType: body.mediaType,
        mediaUrl: body.mediaUrl,
        thumbnailUrl: body.thumbnailUrl ?? null,
        titleAr: body.titleAr,
        titleEn: body.titleEn ?? null,
        speakerName: body.speakerName ?? null,
        category: body.category ?? null,
        targetSkill: body.targetSkill ?? null,
        descriptionAr: body.descriptionAr ?? null,
        descriptionEn: body.descriptionEn ?? null,
        linkedProgramId: body.linkedProgramId ?? null,
        linkedWorkbookId: body.linkedWorkbookId ?? null,
        placement: body.placement ?? null,
        status: body.status ?? "draft",
        orderIndex: body.orderIndex ?? 0,
      })
      .returning();
    await logActivity(req, "create", "field-media", row.id, `Created field media "${row.titleAr}"`);
    res.status(201).json({ item: row });
  } catch (err) {
    req.log.error({ err }, "Failed to create field media");
    res.status(500).json({ error: "Failed to create field media" });
  }
});

router.patch("/admin/field-media/:id", async (req: Request, res: Response) => {
  if (!requireFieldMediaAccess(req, res)) return;
  const { id } = req.params;
  try {
    const body = (req.body ?? {}) as FieldMediaBody;
    const update: Record<string, unknown> = {};
    const allowed: (keyof FieldMediaBody)[] = [
      "mediaType", "mediaUrl", "thumbnailUrl", "titleAr", "titleEn", "speakerName",
      "category", "targetSkill", "descriptionAr", "descriptionEn",
      "linkedProgramId", "linkedWorkbookId", "placement", "status", "orderIndex",
      "analysisSkill", "analysisObserveAr", "analysisWhyAr", "analysisLearnAr",
      "analysisMistakesAr", "analysisExerciseAr", "analysisDifficulty", "analysisLinkedTopic",
    ];
    for (const k of allowed) {
      if (k in body) update[k] = (body as Record<string, unknown>)[k];
    }
    // Mark hasAnalysis when at least one analysis field is present.
    const analysisFields = [
      "analysisSkill", "analysisObserveAr", "analysisWhyAr", "analysisLearnAr",
      "analysisMistakesAr", "analysisExerciseAr",
    ] as const;
    if (analysisFields.some((f) => f in body)) {
      const truthy = analysisFields.some((f) => {
        const v = (body as Record<string, unknown>)[f];
        return typeof v === "string" && v.trim().length > 0;
      });
      update.hasAnalysis = truthy;
    }
    const [row] = await db
      .update(fieldMediaTable)
      .set(update)
      .where(eq(fieldMediaTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Field media not found" });
    await logActivity(req, "update", "field-media", row.id, `Updated field media "${row.titleAr}"`);
    res.json({ item: row });
  } catch (err) {
    req.log.error({ err, id }, "Failed to update field media");
    res.status(500).json({ error: "Failed to update field media" });
  }
});

router.delete("/admin/field-media/:id", async (req: Request, res: Response) => {
  if (!requireFieldMediaAccess(req, res)) return;
  const { id } = req.params;
  try {
    const [row] = await db.delete(fieldMediaTable).where(eq(fieldMediaTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Field media not found" });
    await logActivity(req, "delete", "field-media", id, `Deleted field media "${row.titleAr}"`);
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err, id }, "Failed to delete field media");
    res.status(500).json({ error: "Failed to delete field media" });
  }
});

// Generate a draft analysis template for a media item. Pure scaffold for
// now — the trainer edits and refines it. Future work: call an AI model.
router.post("/admin/field-media/:id/generate-analysis", async (req: Request, res: Response) => {
  if (!requireFieldMediaAccess(req, res)) return;
  const { id } = req.params;
  const force = req.query.force === "true" || req.query.force === "1";
  try {
    const [existing] = await db.select().from(fieldMediaTable).where(eq(fieldMediaTable.id, id));
    if (!existing) return res.status(404).json({ error: "Field media not found" });
    if (existing.hasAnalysis && !force) {
      return res.status(409).json({
        error: "analysis-exists",
        message: "هذه المادة لديها تحليل مكتوب مسبقًا. أضف ?force=true للاستبدال.",
      });
    }
    const template = {
      analysisSkill: existing.targetSkill ?? existing.category ?? "",
      analysisObserveAr: "اكتب هنا أبرز الملاحظات على المقطع: لغة الجسد، نبرة الصوت، الإيقاع، تواصل العين، الانفعال…",
      analysisWhyAr: "اشرح لماذا هذا المقطع مؤثر: ما الذي جعله ينجح في إيصال الرسالة؟",
      analysisLearnAr: "ما الذي يستفيده الطالب من هذا المقطع؟ ما المهارة التي يطورها؟",
      analysisMistakesAr: "اذكر الأخطاء الشائعة التي يجب على المتدرب تجنبها عند تطبيق هذه المهارة.",
      analysisExerciseAr: "اقترح تمرينًا تطبيقيًا قصيرًا (5-10 دقائق) يستطيع المتدرب تجربته.",
      analysisDifficulty: existing.analysisDifficulty ?? "beginner",
      hasAnalysis: true,
    };
    const [row] = await db
      .update(fieldMediaTable)
      .set(template)
      .where(eq(fieldMediaTable.id, id))
      .returning();
    await logActivity(req, force ? "update" : "create", "media-analysis", id,
      `${force ? "Replaced" : "Generated"} draft analysis for "${row.titleAr}"`);
    res.json({ item: row });
  } catch (err) {
    req.log.error({ err, id }, "Failed to generate analysis");
    res.status(500).json({ error: "Failed to generate analysis" });
  }
});

// Public read
router.get("/field-media", async (req: Request, res: Response) => {
  try {
    const placement = typeof req.query.placement === "string" ? req.query.placement : null;
    const rows = await db
      .select()
      .from(fieldMediaTable)
      .where(eq(fieldMediaTable.status, "published"))
      .orderBy(fieldMediaTable.orderIndex);
    const filtered = placement
      ? rows.filter((r) => Array.isArray(r.placement) && r.placement.includes(placement))
      : rows;
    res.json({ items: filtered });
  } catch (err) {
    res.status(500).json({ error: "Failed to load field media" });
  }
});

// ── Admin: Recent activity feed + Top programs ──────────────────────────
router.get("/admin/activities", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const rows = await db
      .select()
      .from(adminActivitiesTable)
      .orderBy(desc(adminActivitiesTable.createdAt))
      .limit(50);
    res.json({ activities: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to load activities");
    res.status(500).json({ error: "Failed to load activities" });
  }
});

router.get("/admin/top-programs", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    // Aggregate enrollment requests by programId. Returns the top 6.
    const rows = await db.execute(sql`
      SELECT program_id AS "programId", COUNT(*)::int AS "requestCount"
      FROM enrollment_requests
      WHERE program_id IS NOT NULL AND program_id <> ''
      GROUP BY program_id
      ORDER BY COUNT(*) DESC
      LIMIT 6
    `);
    res.json({ topPrograms: rows.rows ?? rows });
  } catch (err) {
    req.log.error({ err }, "Failed to load top programs");
    res.status(500).json({ error: "Failed to load top programs" });
  }
});

export default router;
