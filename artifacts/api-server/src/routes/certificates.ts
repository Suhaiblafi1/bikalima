import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  certificatesTable,
  adminActivitiesTable,
  usersTable,
} from "@workspace/db";
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { requireAdmin, requireRole, isAdmin } from "../lib/admin.js";
import { createNotification } from "../lib/notifications.js";
import { awardBadgeIfEligible } from "../lib/platform.js";

const router: IRouter = Router();

// ── Helpers ──────────────────────────────────────────────────────────────
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

const VALID_TYPES = [
  "trainee",
  "trainer",
  "teacher",
  "child-facilitator",
  "ambassador",
  "partner-institution",
] as const;
const VALID_STATUSES = [
  "active",
  "expired",
  "under-review",
  "suspended",
  "revoked",
] as const;
type CertType = (typeof VALID_TYPES)[number];
type CertStatus = (typeof VALID_STATUSES)[number];

function isValidType(v: unknown): v is CertType {
  return typeof v === "string" && (VALID_TYPES as readonly string[]).includes(v);
}
function isValidStatus(v: unknown): v is CertStatus {
  return typeof v === "string" && (VALID_STATUSES as readonly string[]).includes(v);
}

async function isSuperAdmin(req: Request): Promise<boolean> {
  if (!req.user) return false;
  const [row] = await db
    .select({ flag: usersTable.isSuperAdmin })
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id));
  return !!row?.flag;
}

// Public-safe shape that strips internal/PII fields.
function toPublic(c: typeof certificatesTable.$inferSelect) {
  return {
    code: c.code,
    fullName: c.fullName,
    country: c.country,
    certType: c.certType,
    programId: c.programId,
    programName: c.programName,
    issueDate: c.issueDate,
    expiryDate: c.expiryDate,
    status: c.status,
    assessorName: c.assessorName,
    certificateFileUrl: c.certificateFileUrl,
    graduateImageUrl: c.graduateImageUrl,
  };
}

// ── PUBLIC: verify by code (and optional name) ───────────────────────────
router.get("/verify", async (req: Request, res: Response) => {
  const code = String(req.query.code ?? "").trim();
  const name = String(req.query.name ?? "").trim();
  if (!code && !name) {
    return res.json({ found: false, results: [] });
  }
  try {
    const conds = [];
    if (code) conds.push(eq(certificatesTable.code, code));
    if (name) conds.push(ilike(certificatesTable.fullName, `%${name}%`));
    // Match either filter (OR) when both provided to be lenient.
    const where = conds.length === 1 ? conds[0] : or(...conds);
    const rows = await db
      .select()
      .from(certificatesTable)
      .where(where)
      .limit(10);
    if (rows.length === 0) return res.json({ found: false, results: [] });
    res.json({
      found: true,
      results: rows.map(toPublic),
    });
  } catch (err) {
    req.log.error({ err }, "verify failed");
    res.status(500).json({ error: "Verification failed" });
  }
});

// ── PUBLIC: single certificate by code (shareable) ───────────────────────
router.get("/certificates/:code", async (req: Request, res: Response) => {
  const code = String(req.params.code ?? "").trim();
  try {
    const [row] = await db
      .select()
      .from(certificatesTable)
      .where(eq(certificatesTable.code, code));
    if (!row) return res.status(404).json({ error: "not-found" });
    res.json({ certificate: toPublic(row) });
  } catch (err) {
    req.log.error({ err, code }, "fetch certificate failed");
    res.status(500).json({ error: "Failed to load certificate" });
  }
});

// ── PUBLIC: graduates registry (filtered, only showInRegistry=true) ──────
router.get("/graduates", async (req: Request, res: Response) => {
  const type = String(req.query.type ?? "").trim();
  const program = String(req.query.program ?? "").trim();
  const country = String(req.query.country ?? "").trim();
  const year = String(req.query.year ?? "").trim();
  const status = String(req.query.status ?? "").trim();
  try {
    const conds = [eq(certificatesTable.showInRegistry, true)];
    if (type && isValidType(type)) conds.push(eq(certificatesTable.certType, type));
    if (program) conds.push(eq(certificatesTable.programId, program));
    if (country) conds.push(eq(certificatesTable.country, country));
    if (status && isValidStatus(status)) conds.push(eq(certificatesTable.status, status));
    if (year && /^\d{4}$/.test(year)) {
      const start = new Date(`${year}-01-01T00:00:00Z`);
      const end = new Date(`${Number(year) + 1}-01-01T00:00:00Z`);
      conds.push(gte(certificatesTable.issueDate, start));
      conds.push(lte(certificatesTable.issueDate, end));
    }
    const rows = await db
      .select()
      .from(certificatesTable)
      .where(and(...conds))
      .orderBy(desc(certificatesTable.issueDate))
      .limit(200);
    res.json({ graduates: rows.map(toPublic) });
  } catch (err) {
    req.log.error({ err }, "graduates fetch failed");
    res.status(500).json({ error: "Failed to load graduates" });
  }
});

// ── ADMIN: list (admin sees all, trainer sees only theirs) ───────────────
router.get("/admin/certificates", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "admin", "trainer", "sales")) return;
  try {
    const role = req.user?.role ?? "student";
    const adminFlag = isAdmin(req);
    const search = String(req.query.q ?? "").trim();
    const status = String(req.query.status ?? "").trim();
    const type = String(req.query.type ?? "").trim();

    const conds = [];
    if (search) {
      conds.push(or(
        ilike(certificatesTable.fullName, `%${search}%`),
        ilike(certificatesTable.code, `%${search}%`),
        ilike(certificatesTable.email, `%${search}%`),
      ));
    }
    if (status && isValidStatus(status)) conds.push(eq(certificatesTable.status, status));
    if (type && isValidType(type)) conds.push(eq(certificatesTable.certType, type));

    // Trainers/sales: scope to certificates where they are the assessor.
    if (!adminFlag && (role === "trainer" || role === "sales")) {
      conds.push(eq(certificatesTable.assessorUserId, req.user!.id));
    }

    const rows = await db
      .select()
      .from(certificatesTable)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(certificatesTable.createdAt))
      .limit(500);
    res.json({ certificates: rows, role, canDelete: await isSuperAdmin(req) });
  } catch (err) {
    req.log.error({ err }, "list certificates failed");
    res.status(500).json({ error: "Failed to load certificates" });
  }
});

// ── ADMIN: generate next code (BK-CERT-YYYY-NNNN) ────────────────────────
router.post("/admin/certificates/generate-code", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const year = new Date().getFullYear();
    const prefix = `BK-CERT-${year}-`;
    const [row] = await db
      .select({ code: certificatesTable.code })
      .from(certificatesTable)
      .where(ilike(certificatesTable.code, `${prefix}%`))
      .orderBy(desc(certificatesTable.code))
      .limit(1);
    let next = 1;
    if (row?.code) {
      const tail = row.code.slice(prefix.length);
      const n = parseInt(tail, 10);
      if (!Number.isNaN(n)) next = n + 1;
    }
    res.json({ code: `${prefix}${String(next).padStart(4, "0")}` });
  } catch (err) {
    req.log.error({ err }, "generate-code failed");
    res.status(500).json({ error: "Failed to generate code" });
  }
});

// ── ADMIN: CSV export (admin only) ───────────────────────────────────────
router.get("/admin/certificates/export.csv", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const rows = await db
      .select()
      .from(certificatesTable)
      .orderBy(desc(certificatesTable.createdAt));
    const headers = [
      "code", "fullName", "email", "phone", "country", "certType",
      "programId", "programName", "issueDate", "expiryDate", "status",
      "assessorName", "showInRegistry", "createdAt",
    ];
    const escape = (v: unknown): string => {
      if (v === null || v === undefined) return "";
      const s = v instanceof Date ? v.toISOString() : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = [headers.join(",")];
    for (const r of rows) {
      lines.push(headers.map((h) => escape((r as Record<string, unknown>)[h])).join(","));
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="bikalima-certificates-${Date.now()}.csv"`);
    res.send("\uFEFF" + lines.join("\n"));
  } catch (err) {
    req.log.error({ err }, "csv export failed");
    res.status(500).json({ error: "Failed to export" });
  }
});

// ── ADMIN: create ────────────────────────────────────────────────────────
type CertBody = {
  code?: string;
  fullName?: string;
  email?: string;
  phone?: string | null;
  country?: string | null;
  certType?: string;
  programId?: string | null;
  programName?: string | null;
  issueDate?: string;
  expiryDate?: string | null;
  status?: string;
  assessorName?: string | null;
  assessorUserId?: string | null;
  internalNotes?: string | null;
  certificateFileUrl?: string | null;
  graduateImageUrl?: string | null;
  showInRegistry?: boolean;
  userId?: string | null;
};

router.post("/admin/certificates", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const body = (req.body ?? {}) as CertBody;
    if (!body.fullName || !body.email || !body.certType) {
      return res.status(400).json({ error: "fullName, email, certType are required" });
    }
    if (!isValidType(body.certType)) {
      return res.status(400).json({ error: "invalid-cert-type" });
    }
    if (body.status && !isValidStatus(body.status)) {
      return res.status(400).json({ error: "invalid-status" });
    }
    // Auto-generate code if not provided.
    let code = body.code?.trim() || "";
    if (!code) {
      const year = new Date().getFullYear();
      const prefix = `BK-CERT-${year}-`;
      const [row] = await db
        .select({ code: certificatesTable.code })
        .from(certificatesTable)
        .where(ilike(certificatesTable.code, `${prefix}%`))
        .orderBy(desc(certificatesTable.code))
        .limit(1);
      let next = 1;
      if (row?.code) {
        const tail = row.code.slice(prefix.length);
        const n = parseInt(tail, 10);
        if (!Number.isNaN(n)) next = n + 1;
      }
      code = `${prefix}${String(next).padStart(4, "0")}`;
    }
    const [row] = await db
      .insert(certificatesTable)
      .values({
        code,
        fullName: body.fullName,
        email: body.email,
        phone: body.phone ?? null,
        country: body.country ?? null,
        certType: body.certType,
        programId: body.programId ?? null,
        programName: body.programName ?? null,
        issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        status: (body.status as CertStatus) ?? "active",
        assessorName: body.assessorName ?? null,
        assessorUserId: body.assessorUserId ?? null,
        internalNotes: body.internalNotes ?? null,
        certificateFileUrl: body.certificateFileUrl ?? null,
        graduateImageUrl: body.graduateImageUrl ?? null,
        showInRegistry: body.showInRegistry ?? false,
        userId: body.userId ?? null,
        createdBy: req.user?.id ?? null,
      })
      .returning();
    await logActivity(req, "create", "certificate", row.id, `Issued certificate ${row.code} to ${row.fullName}`);
    if (row.userId) {
      await createNotification({
        userId: row.userId,
        type: "certificate_issued",
        titleAr: "صدرت شهادتك 🎓",
        titleEn: "Your certificate is ready 🎓",
        bodyAr: `تم إصدار شهادة برقم ${row.code}. يمكنك تحميلها من قسم شهاداتي.`,
        bodyEn: `Certificate ${row.code} has been issued. Download it from My Certificates.`,
        link: "/dashboard?tab=certificates",
      });
      // Trainer-certification badge.
      if (row.certType === "trainer" && row.status === "active") {
        try {
          await awardBadgeIfEligible(row.userId, "trainer_certificate_issued", { certificateId: row.id, code: row.code });
        } catch (err) {
          req.log.warn({ err }, "[BADGE] trainer_certificate_issued award failed");
        }
      }
    }
    res.status(201).json({ certificate: row });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "23505") {
      return res.status(409).json({
        error: "duplicate-code",
        message: "هذا الرقم مستخدم بالفعل لشهادة أخرى.",
      });
    }
    req.log.error({ err }, "create certificate failed");
    res.status(500).json({ error: "Failed to create certificate" });
  }
});

// ── ADMIN: update (admin only) ───────────────────────────────────────────
router.patch("/admin/certificates/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const { id } = req.params;
  try {
    const body = (req.body ?? {}) as CertBody;
    if (body.certType && !isValidType(body.certType)) {
      return res.status(400).json({ error: "invalid-cert-type" });
    }
    if (body.status && !isValidStatus(body.status)) {
      return res.status(400).json({ error: "invalid-status" });
    }
    const update: Record<string, unknown> = {};
    const fields: (keyof CertBody)[] = [
      "code", "fullName", "email", "phone", "country", "certType",
      "programId", "programName", "status", "assessorName", "assessorUserId",
      "internalNotes", "certificateFileUrl", "graduateImageUrl",
      "showInRegistry", "userId",
    ];
    for (const f of fields) {
      if (f in body) update[f] = body[f];
    }
    if ("issueDate" in body) update.issueDate = body.issueDate ? new Date(body.issueDate) : null;
    if ("expiryDate" in body) update.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;

    const [row] = await db
      .update(certificatesTable)
      .set(update)
      .where(eq(certificatesTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "not-found" });
    await logActivity(req, "update", "certificate", row.id, `Updated certificate ${row.code} (${row.fullName})`);
    res.json({ certificate: row });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "23505") {
      return res.status(409).json({
        error: "duplicate-code",
        message: "هذا الرقم مستخدم بالفعل لشهادة أخرى.",
      });
    }
    req.log.error({ err, id }, "update certificate failed");
    res.status(500).json({ error: "Failed to update certificate" });
  }
});

// ── ADMIN: delete (super admin only) ─────────────────────────────────────
router.delete("/admin/certificates/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  if (!(await isSuperAdmin(req))) {
    return res.status(403).json({
      error: "super-admin-only",
      message: "حذف الشهادات متاح فقط للمدير العام (Super Admin).",
    });
  }
  const { id } = req.params;
  try {
    const [row] = await db
      .delete(certificatesTable)
      .where(eq(certificatesTable.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "not-found" });
    await logActivity(req, "delete", "certificate", row.id, `Deleted certificate ${row.code} (${row.fullName})`);
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err, id }, "delete certificate failed");
    res.status(500).json({ error: "Failed to delete certificate" });
  }
});

// ── STUDENT (any authed user): own certificates ──────────────────────────
router.get("/me/certificates", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const rows = await db
      .select()
      .from(certificatesTable)
      .where(or(
        eq(certificatesTable.userId, req.user.id),
        eq(certificatesTable.email, req.user.email),
      ))
      .orderBy(desc(certificatesTable.issueDate));
    res.json({
      certificates: rows.map((r) => ({
        ...toPublic(r),
        id: r.id,
        email: r.email,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "my certificates failed");
    res.status(500).json({ error: "Failed to load your certificates" });
  }
});

export default router;
