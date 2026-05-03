import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  accreditationsTable,
  accreditationRenewalsTable,
  policyDocumentsTable,
  policyAcceptancesTable,
} from "@workspace/db";
import { and, asc, desc, eq, lte, sql } from "drizzle-orm";
import { isAdmin, requireAdmin, requireSupervisorOrAdmin } from "../lib/admin.js";

const router: IRouter = Router();

// Default policy seeds — created once on first read so the platform always
// has the legally-required documents available even before an admin edits.
const DEFAULT_POLICIES: Array<{
  slug: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  bodyAr: string;
  icon: string;
  displayOrder: number;
  requiresAcceptance: boolean;
}> = [
  {
    slug: "terms",
    titleAr: "شروط الاستخدام",
    titleEn: "Terms of Service",
    summaryAr: "الشروط العامة لاستخدام منصة بكلمة وخدماتها التعليمية.",
    icon: "scroll-text",
    displayOrder: 1,
    requiresAcceptance: true,
    bodyAr: `# شروط الاستخدام

مرحباً بك في منصة **بكلمة**. باستخدامك للمنصة فإنك توافق على الشروط التالية:

## 1. التسجيل والحساب
- يجب تقديم بيانات صحيحة عند التسجيل.
- المستخدم مسؤول عن الحفاظ على سرية كلمة المرور.
- يحظر مشاركة الحساب أو بيعه أو تأجيره.

## 2. استخدام المحتوى
- جميع محتويات المنصة (دروس، فيديوهات، كراسات، شهادات) محمية بحقوق الملكية الفكرية.
- يُمنع منعاً باتاً نسخ المحتوى أو إعادة توزيعه أو نشره أو تسجيله بأي وسيلة (تسجيل شاشة، تصوير، تحميل).
- يحق للمنصة إنهاء الاشتراك فوراً عند ثبوت أي محاولة تسريب.

## 3. الاشتراكات والمدفوعات
- يتم تفعيل الاشتراك بعد سداد المبلغ المطلوب.
- الأسعار قابلة للتغيير بإشعار مسبق.

## 4. سلوك المستخدم
- يلتزم المستخدم باحترام المدربين وزملائه في النقاشات والجلسات الحية.
- يحظر استخدام لغة مسيئة أو محتوى غير لائق.

## 5. إنهاء الخدمة
يحق للمنصة تعليق أو إنهاء حساب أي مستخدم يخالف هذه الشروط دون الحاجة لإشعار مسبق.`,
  },
  {
    slug: "privacy",
    titleAr: "سياسة الخصوصية",
    titleEn: "Privacy Policy",
    summaryAr: "كيف نجمع ونستخدم ونحمي بياناتك الشخصية.",
    icon: "shield",
    displayOrder: 2,
    requiresAcceptance: true,
    bodyAr: `# سياسة الخصوصية

نحرص في **بكلمة** على حماية خصوصية مستخدمينا.

## البيانات التي نجمعها
- الاسم، البريد الإلكتروني، رقم الهاتف.
- بيانات الاستخدام (الدروس المشاهدة، التقدم، الواجبات).
- بيانات تقنية (عنوان IP، نوع المتصفح).

## استخدام البيانات
- تقديم الخدمة وتخصيص التجربة التعليمية.
- إرسال إشعارات تتعلق بالحساب والتقدم.
- تحسين المنصة وتطوير ميزات جديدة.

## مشاركة البيانات
- لا نبيع أو نؤجر بياناتك لأي طرف ثالث.
- قد تُشارك مع مزودي الخدمات الضروريين (الدفع، الاستضافة) ضمن اتفاقيات سرية.

## حقوقك
- حق الاطلاع على بياناتك.
- حق تصحيحها أو حذفها.
- حق إلغاء الاشتراك في الإشعارات.

للتواصل: info@bikalima.com`,
  },
  {
    slug: "refund",
    titleAr: "سياسة الاسترداد",
    titleEn: "Refund Policy",
    summaryAr: "شروط استرداد المبالغ المدفوعة.",
    icon: "wallet",
    displayOrder: 3,
    requiresAcceptance: false,
    bodyAr: `# سياسة الاسترداد

## المدة المسموح بها للاسترداد
يحق للمشترك طلب استرداد كامل المبلغ خلال **7 أيام** من تاريخ الاشتراك بشرط:
- ألا يكون قد أكمل أكثر من 20% من محتوى الدورة.
- ألا يكون قد حصل على شهادة إتمام.

## بعد المدة
لا يمكن استرداد المبلغ بعد مرور 7 أيام أو بعد إتمام أكثر من 20% من المحتوى.

## آلية الاسترداد
- يُقدم الطلب عبر البريد: info@bikalima.com
- تتم معالجته خلال 5–10 أيام عمل.
- يُرد المبلغ بنفس وسيلة الدفع الأصلية.`,
  },
  {
    slug: "code-of-conduct",
    titleAr: "ميثاق السلوك",
    titleEn: "Code of Conduct",
    summaryAr: "قواعد السلوك في الفصول والجلسات الحية.",
    icon: "users",
    displayOrder: 4,
    requiresAcceptance: true,
    bodyAr: `# ميثاق السلوك

نسعى لبيئة تعليمية إيجابية وآمنة.

## نتوقع من جميع المشاركين:
- الاحترام المتبادل بين المتدربين والمدربين.
- الالتزام بمواعيد الجلسات الحية.
- المشاركة الإيجابية وتجنب المقاطعة.
- استخدام لغة لائقة في الدردشة والتعليقات.

## محظورات صريحة:
- التحرش بأي شكل من أشكاله.
- التمييز على أساس العرق أو الدين أو الجنس.
- نشر روابط أو إعلانات خارجية.
- مشاركة محتوى المنصة خارجها.

## العقوبات:
الإخلال بهذا الميثاق يؤدي إلى إنذار، ثم إيقاف مؤقت، ثم إنهاء الاشتراك دون استرداد.`,
  },
  {
    slug: "child-safeguarding",
    titleAr: "سياسة حماية الأطفال",
    titleEn: "Child Safeguarding Policy",
    summaryAr: "إجراءات حماية المتدربين القاصرين.",
    icon: "heart-handshake",
    displayOrder: 5,
    requiresAcceptance: false,
    bodyAr: `# سياسة حماية الأطفال

تلتزم منصة **بكلمة** — وخاصة برنامج "المتحدث الصغير" — بأعلى معايير حماية الطفل.

## التزاماتنا:
- جميع المدربين خاضعون للتحقق من السوابق.
- الجلسات الحية مع الأطفال مسجّلة ويمكن لولي الأمر الاطلاع عليها.
- لا يتم التواصل المباشر بين المدرب والطفل خارج المنصة.
- جميع الرسائل بين المدرب والطفل قابلة للمراقبة من ولي الأمر.

## دور ولي الأمر:
- لكل طفل حساب ولي أمر مرتبط برمز ربط.
- يستطيع ولي الأمر متابعة التقدم والشهادات والتقييمات.
- يستطيع تلقي رسائل المدرب وإلغاء الربط في أي وقت.

## الإبلاغ عن المخاوف:
أي قلق حول سلامة طفل يُرسل فوراً إلى: safety@bikalima.com`,
  },
  {
    slug: "ip-and-content",
    titleAr: "حقوق الملكية الفكرية",
    titleEn: "Intellectual Property",
    summaryAr: "حقوق المحتوى وحظر النسخ والتسجيل.",
    icon: "copyright",
    displayOrder: 6,
    requiresAcceptance: true,
    bodyAr: `# حقوق الملكية الفكرية

جميع حقوق النشر والملكية الفكرية لمحتوى منصة **بكلمة** محفوظة.

## يُحظر منعاً باتاً:
- نسخ أو طباعة أي جزء من الدروس أو الكراسات.
- تسجيل الشاشة أو تصوير المحتوى بكاميرا خارجية.
- تنزيل الفيديوهات بأي وسيلة.
- مشاركة بيانات الدخول أو إعادة بث المحتوى.

## آليات الحماية:
- يتم وضع علامة مائية تحمل اسم المتدرب وبريده على كل صفحة.
- في حال اكتشاف تسريب يمكن تتبّع المصدر فوراً.
- العواقب: إلغاء الاشتراك دون استرداد، وملاحقة قانونية للأضرار.

## الاستخدام المسموح:
- مشاهدة المحتوى داخل المنصة فقط.
- تقديم الواجبات والأنشطة المطلوبة.
- مناقشة الأفكار في القنوات الرسمية.`,
  },
];

// ── PUBLIC: List published accreditations ───────────────────────────────
router.get("/accreditations", async (_req: Request, res: Response) => {
  // Auto-mark expired before responding (cheap idempotent update).
  await db
    .update(accreditationsTable)
    .set({ status: "expired", updatedAt: new Date() })
    .where(and(
      eq(accreditationsTable.status, "active"),
      lte(accreditationsTable.expiryDate, sql`current_date`),
    ));
  const rows = await db
    .select()
    .from(accreditationsTable)
    .where(eq(accreditationsTable.isPublic, true))
    .orderBy(desc(accreditationsTable.isFeatured), asc(accreditationsTable.displayOrder), desc(accreditationsTable.issueDate));
  res.json({ accreditations: rows });
});

// ── PUBLIC: Single accreditation by id (verification page) ──────────────
router.get("/accreditations/:id", async (req: Request, res: Response) => {
  const [row] = await db.select().from(accreditationsTable).where(eq(accreditationsTable.id, req.params.id)).limit(1);
  if (!row || !row.isPublic) { res.status(404).json({ error: "Not found" }); return; }
  const renewals = await db.select().from(accreditationRenewalsTable)
    .where(eq(accreditationRenewalsTable.accreditationId, row.id))
    .orderBy(desc(accreditationRenewalsTable.renewedOn));
  res.json({ accreditation: row, renewals });
});

// ── ADMIN: list all (incl. private/expired) ────────────────────────────
router.get("/admin/accreditations", async (req: Request, res: Response) => {
  if (!requireSupervisorOrAdmin(req, res)) return;
  const rows = await db.select().from(accreditationsTable)
    .orderBy(asc(accreditationsTable.displayOrder), desc(accreditationsTable.issueDate));
  res.json({ accreditations: rows });
});

// ── ADMIN: create ───────────────────────────────────────────────────────
router.post("/admin/accreditations", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const body = req.body ?? {};
    if (!body.nameAr || !body.issuerNameAr || !body.issueDate) {
      res.status(400).json({ error: "nameAr, issuerNameAr, issueDate required" }); return;
    }
    const [row] = await db.insert(accreditationsTable).values({
      nameAr: String(body.nameAr),
      nameEn: body.nameEn ?? null,
      descriptionAr: body.descriptionAr ?? null,
      descriptionEn: body.descriptionEn ?? null,
      issuerNameAr: String(body.issuerNameAr),
      issuerNameEn: body.issuerNameEn ?? null,
      issuerCountry: body.issuerCountry ?? null,
      issuerWebsite: body.issuerWebsite ?? null,
      issuerLogoUrl: body.issuerLogoUrl ?? null,
      accreditationNumber: body.accreditationNumber ?? null,
      scopeAr: body.scopeAr ?? null,
      scopeEn: body.scopeEn ?? null,
      issueDate: String(body.issueDate),
      expiryDate: body.expiryDate ?? null,
      status: body.status ?? "active",
      certificateFileUrl: body.certificateFileUrl ?? null,
      verificationUrl: body.verificationUrl ?? null,
      badgeColor: body.badgeColor ?? "amber",
      displayOrder: Number(body.displayOrder ?? 0),
      isPublic: body.isPublic !== false,
      isFeatured: !!body.isFeatured,
      notes: body.notes ?? null,
    }).returning();
    res.json({ accreditation: row });
  } catch (err) {
    req.log.error({ err }, "create accreditation failed");
    res.status(500).json({ error: "Failed" });
  }
});

// ── ADMIN: update ───────────────────────────────────────────────────────
router.put("/admin/accreditations/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const allowed = [
    "nameAr","nameEn","descriptionAr","descriptionEn",
    "issuerNameAr","issuerNameEn","issuerCountry","issuerWebsite","issuerLogoUrl",
    "accreditationNumber","scopeAr","scopeEn",
    "issueDate","expiryDate","status",
    "certificateFileUrl","verificationUrl",
    "badgeColor","displayOrder","isPublic","isFeatured","notes",
  ] as const;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of allowed) if (k in req.body) patch[k] = req.body[k];
  try {
    const [row] = await db.update(accreditationsTable).set(patch)
      .where(eq(accreditationsTable.id, req.params.id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ accreditation: row });
  } catch (err) {
    req.log.error({ err }, "update accreditation failed");
    res.status(500).json({ error: "Failed" });
  }
});

// ── ADMIN: delete ───────────────────────────────────────────────────────
router.delete("/admin/accreditations/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  await db.delete(accreditationsTable).where(eq(accreditationsTable.id, req.params.id));
  res.json({ ok: true });
});

// ── ADMIN: renew (extend expiry + log history) ──────────────────────────
router.post("/admin/accreditations/:id/renew", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const { newExpiryDate, newCertificateFileUrl, notes } = req.body ?? {};
  if (!newExpiryDate) { res.status(400).json({ error: "newExpiryDate required" }); return; }
  try {
    const [current] = await db.select().from(accreditationsTable)
      .where(eq(accreditationsTable.id, req.params.id)).limit(1);
    if (!current) { res.status(404).json({ error: "Not found" }); return; }
    await db.insert(accreditationRenewalsTable).values({
      accreditationId: current.id,
      previousExpiryDate: current.expiryDate ?? null,
      newExpiryDate: String(newExpiryDate),
      renewedOn: new Date().toISOString().slice(0, 10),
      newCertificateFileUrl: newCertificateFileUrl ?? null,
      notes: notes ?? null,
      actorUserId: req.user?.id ?? null,
    });
    const [updated] = await db.update(accreditationsTable).set({
      expiryDate: String(newExpiryDate),
      certificateFileUrl: newCertificateFileUrl ?? current.certificateFileUrl,
      status: "active",
      updatedAt: new Date(),
    }).where(eq(accreditationsTable.id, current.id)).returning();
    res.json({ accreditation: updated });
  } catch (err) {
    req.log.error({ err }, "renew accreditation failed");
    res.status(500).json({ error: "Failed" });
  }
});

// ── PUBLIC: List published policies (latest version per slug) ──────────
router.get("/policies", async (_req: Request, res: Response) => {
  await seedDefaultPolicies();
  const rows = await db.select().from(policyDocumentsTable)
    .where(eq(policyDocumentsTable.isPublished, true))
    .orderBy(asc(policyDocumentsTable.displayOrder), desc(policyDocumentsTable.version));
  // Keep only the highest-version row per slug (table has UQ on slug+version).
  const latestBySlug = new Map<string, typeof rows[number]>();
  for (const r of rows) {
    const cur = latestBySlug.get(r.slug);
    if (!cur || r.version > cur.version) latestBySlug.set(r.slug, r);
  }
  res.json({ policies: Array.from(latestBySlug.values()) });
});

// ── PUBLIC: single policy by slug ──────────────────────────────────────
router.get("/policies/:slug", async (req: Request, res: Response) => {
  await seedDefaultPolicies();
  const rows = await db.select().from(policyDocumentsTable)
    .where(and(eq(policyDocumentsTable.slug, req.params.slug), eq(policyDocumentsTable.isPublished, true)))
    .orderBy(desc(policyDocumentsTable.version)).limit(1);
  if (rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ policy: rows[0] });
});

// ── USER: pending policies that need acceptance ────────────────────────
router.get("/me/pending-policies", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  await seedDefaultPolicies();
  const required = await db.select().from(policyDocumentsTable)
    .where(and(
      eq(policyDocumentsTable.isPublished, true),
      eq(policyDocumentsTable.requiresAcceptance, true),
    ));
  const accepted = await db.select({
    slug: policyAcceptancesTable.policySlug,
    version: policyAcceptancesTable.version,
  }).from(policyAcceptancesTable).where(eq(policyAcceptancesTable.userId, req.user.id));
  const acceptedMap = new Map<string, number>();
  for (const a of accepted) {
    const cur = acceptedMap.get(a.slug) ?? 0;
    if (a.version > cur) acceptedMap.set(a.slug, a.version);
  }
  // Latest version per slug; pending = user's accepted version < latest.
  const latestBySlug = new Map<string, typeof required[number]>();
  for (const p of required) {
    const cur = latestBySlug.get(p.slug);
    if (!cur || p.version > cur.version) latestBySlug.set(p.slug, p);
  }
  const pending = Array.from(latestBySlug.values()).filter(p => (acceptedMap.get(p.slug) ?? 0) < p.version);
  res.json({ pending });
});

// ── USER: accept a policy ──────────────────────────────────────────────
router.post("/me/policies/:slug/accept", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user?.id) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { slug } = req.params;
  const version = Number((req.body ?? {}).version);
  if (!Number.isFinite(version) || version < 1) { res.status(400).json({ error: "version required" }); return; }
  // Verify policy + version exist & published.
  const [policy] = await db.select().from(policyDocumentsTable)
    .where(and(eq(policyDocumentsTable.slug, slug), eq(policyDocumentsTable.version, version), eq(policyDocumentsTable.isPublished, true)))
    .limit(1);
  if (!policy) { res.status(404).json({ error: "Policy/version not found" }); return; }
  try {
    await db.insert(policyAcceptancesTable).values({
      userId: req.user.id,
      policySlug: slug,
      version,
      ipAddress: (req.ip ?? req.socket?.remoteAddress ?? "").slice(0, 64),
      userAgent: String(req.headers["user-agent"] ?? "").slice(0, 512),
    }).onConflictDoNothing();
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "accept policy failed");
    res.status(500).json({ error: "Failed" });
  }
});

// ── ADMIN: list all policies (every version) ───────────────────────────
router.get("/admin/policies", async (req: Request, res: Response) => {
  if (!requireSupervisorOrAdmin(req, res)) return;
  await seedDefaultPolicies();
  const rows = await db.select().from(policyDocumentsTable)
    .orderBy(asc(policyDocumentsTable.displayOrder), asc(policyDocumentsTable.slug), desc(policyDocumentsTable.version));
  res.json({ policies: rows });
});

// ── ADMIN: create new policy (or new version of existing slug) ─────────
router.post("/admin/policies", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const b = req.body ?? {};
  if (!b.slug || !b.titleAr || !b.bodyAr || !b.effectiveDate) {
    res.status(400).json({ error: "slug, titleAr, bodyAr, effectiveDate required" }); return;
  }
  // Auto-bump version if slug already exists.
  const existing = await db.select({ version: policyDocumentsTable.version }).from(policyDocumentsTable)
    .where(eq(policyDocumentsTable.slug, String(b.slug)))
    .orderBy(desc(policyDocumentsTable.version)).limit(1);
  const version = b.version ? Number(b.version) : (existing[0]?.version ?? 0) + 1;
  try {
    const [row] = await db.insert(policyDocumentsTable).values({
      slug: String(b.slug),
      version,
      titleAr: String(b.titleAr),
      titleEn: b.titleEn ?? null,
      summaryAr: b.summaryAr ?? null,
      summaryEn: b.summaryEn ?? null,
      bodyAr: String(b.bodyAr),
      bodyEn: b.bodyEn ?? null,
      effectiveDate: String(b.effectiveDate),
      requiresAcceptance: !!b.requiresAcceptance,
      displayOrder: Number(b.displayOrder ?? 0),
      isPublished: b.isPublished !== false,
      icon: b.icon ?? "scroll-text",
    }).returning();
    res.json({ policy: row });
  } catch (err) {
    req.log.error({ err }, "create policy failed");
    res.status(500).json({ error: "Failed" });
  }
});

// ── ADMIN: update existing policy row (typically draft/unpublished) ────
router.put("/admin/policies/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const allowed = ["titleAr","titleEn","summaryAr","summaryEn","bodyAr","bodyEn","effectiveDate","requiresAcceptance","displayOrder","isPublished","icon"] as const;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of allowed) if (k in req.body) patch[k] = req.body[k];
  try {
    const [row] = await db.update(policyDocumentsTable).set(patch)
      .where(eq(policyDocumentsTable.id, req.params.id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ policy: row });
  } catch (err) {
    req.log.error({ err }, "update policy failed");
    res.status(500).json({ error: "Failed" });
  }
});

router.delete("/admin/policies/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  await db.delete(policyDocumentsTable).where(eq(policyDocumentsTable.id, req.params.id));
  res.json({ ok: true });
});

// ── ADMIN: list a single user's policy acceptances ─────────────────────
router.get("/admin/users/:userId/policy-acceptances", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const rows = await db.select().from(policyAcceptancesTable)
    .where(eq(policyAcceptancesTable.userId, req.params.userId))
    .orderBy(desc(policyAcceptancesTable.acceptedAt));
  res.json({ acceptances: rows });
});

// ── Internal: idempotently seed the default policy set ─────────────────
let seededOnce = false;
async function seedDefaultPolicies(): Promise<void> {
  if (seededOnce) return;
  try {
    const existing = await db.selectDistinct({ slug: policyDocumentsTable.slug }).from(policyDocumentsTable);
    const haveSlugs = new Set(existing.map(r => r.slug));
    const today = new Date().toISOString().slice(0, 10);
    for (const p of DEFAULT_POLICIES) {
      if (haveSlugs.has(p.slug)) continue;
      await db.insert(policyDocumentsTable).values({
        slug: p.slug,
        version: 1,
        titleAr: p.titleAr,
        titleEn: p.titleEn,
        summaryAr: p.summaryAr,
        bodyAr: p.bodyAr,
        effectiveDate: today,
        requiresAcceptance: p.requiresAcceptance,
        displayOrder: p.displayOrder,
        isPublished: true,
        icon: p.icon,
      }).onConflictDoNothing();
    }
    seededOnce = true;
  } catch {
    // Schema may not yet be pushed; allow next call to retry.
  }
}

export default router;
