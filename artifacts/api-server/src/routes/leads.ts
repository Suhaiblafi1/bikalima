import { Router, type IRouter, type Request, type Response } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  db,
  leadsTable,
  leadActivitiesTable,
  tasksTable,
  usersTable,
  enrollmentRequestsTable,
  workbookOrdersTable,
  speechEvaluationsTable,
  consultationBookingsTable,
  chatThreadsTable,
  LEAD_STATUSES,
  LEAD_SOURCES,
} from "@workspace/db";
import { requireRole } from "../lib/admin.js";
import {
  recordLeadActivity,
  setLeadStatus,
  upsertLeadFromContact,
  normalizePhone,
  normalizeEmail,
} from "../lib/leads.js";

const router: IRouter = Router();

function gate(req: Request, res: Response): boolean {
  return requireRole(req, res, "sales", "trainer");
}

// ── List leads with filters ────────────────────────────────────────────
router.get("/admin/leads", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const source = typeof req.query.source === "string" ? req.query.source : "";
    const owner = typeof req.query.owner === "string" ? req.query.owner : "";
    const search = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10) || 100, 500);

    const conds = [] as ReturnType<typeof eq>[];
    if (status && LEAD_STATUSES.includes(status as never)) {
      conds.push(eq(leadsTable.status, status));
    }
    if (source && LEAD_SOURCES.includes(source as never)) {
      conds.push(eq(leadsTable.source, source));
    }
    if (owner === "unassigned") {
      conds.push(sql`${leadsTable.ownerUserId} is null` as never);
    } else if (owner) {
      conds.push(eq(leadsTable.ownerUserId, owner));
    }

    let where = conds.length > 0 ? and(...conds) : undefined;
    if (search) {
      const term = `%${search}%`;
      const searchCond = or(
        ilike(leadsTable.fullName, term),
        ilike(leadsTable.phone, term),
        ilike(leadsTable.email, term),
        ilike(leadsTable.interestProgramTitle, term),
      );
      where = where ? and(where, searchCond) : searchCond;
    }

    const baseQuery = db.select().from(leadsTable);
    const rows = await (where ? baseQuery.where(where) : baseQuery)
      .orderBy(desc(leadsTable.lastContactAt), desc(leadsTable.createdAt))
      .limit(limit);

    const counts = await db
      .select({
        status: leadsTable.status,
        c: sql<number>`count(*)::int`,
      })
      .from(leadsTable)
      .groupBy(leadsTable.status);

    res.set("Cache-Control", "no-store");
    res.json({ leads: rows, statusCounts: counts });
  } catch (err) {
    req.log.error({ err }, "[leads] list failed");
    res.status(500).json({ error: "server_error" });
  }
});

// ── Manual create ──────────────────────────────────────────────────────
router.post("/admin/leads", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    const body = req.body ?? {};
    const fullName = String(body.fullName ?? "").trim();
    if (!fullName) {
      return res.status(400).json({ error: "fullName_required" });
    }
    const { lead, created } = await upsertLeadFromContact({
      fullName,
      phone: body.phone ?? null,
      email: body.email ?? null,
      country: body.country ?? null,
      source: (body.source as never) ?? "other",
      interestProgramId: body.interestProgramId ?? null,
      interestProgramTitle: body.interestProgramTitle ?? null,
      ownerUserId: body.ownerUserId ?? req.user?.id ?? null,
    });
    res.json({ lead, created });
  } catch (err) {
    req.log.error({ err }, "[leads] create failed");
    res.status(500).json({ error: "server_error" });
  }
});

// ── Pipeline (kanban grouping) — must be BEFORE /:id route ──────────
router.get("/admin/leads/pipeline", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    const rows = await db
      .select({
        id: leadsTable.id,
        fullName: leadsTable.fullName,
        phone: leadsTable.phone,
        email: leadsTable.email,
        status: leadsTable.status,
        source: leadsTable.source,
        interestProgramTitle: leadsTable.interestProgramTitle,
        interestScore: leadsTable.interestScore,
        ownerUserId: leadsTable.ownerUserId,
        nextFollowUpAt: leadsTable.nextFollowUpAt,
        lastContactAt: leadsTable.lastContactAt,
        createdAt: leadsTable.createdAt,
      })
      .from(leadsTable)
      .orderBy(desc(leadsTable.createdAt))
      .limit(500);
    const byStatus: Record<string, typeof rows> = {};
    for (const r of rows) {
      const k = r.status || "new";
      (byStatus[k] = byStatus[k] || []).push(r);
    }
    res.set("Cache-Control", "no-store");
    res.json({ byStatus, total: rows.length });
  } catch (err) {
    req.log.error({ err }, "[leads] pipeline failed");
    res.status(500).json({ error: "server_error" });
  }
});

// ── Get one lead with timeline + linked records + tasks ────────────────
router.get("/admin/leads/:id", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    const id = req.params.id;
    const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, id)).limit(1);
    if (!lead) return res.status(404).json({ error: "not_found" });

    const activities = await db
      .select()
      .from(leadActivitiesTable)
      .where(eq(leadActivitiesTable.leadId, id))
      .orderBy(desc(leadActivitiesTable.createdAt))
      .limit(200);

    const tasks = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.leadId, id))
      .orderBy(desc(tasksTable.createdAt));

    // Linked records, looked up loosely via contact info.
    const phoneNorm = normalizePhone(lead.phone);
    const emailLower = normalizeEmail(lead.email);

    const linked = {
      enrollments: [] as unknown[],
      workbookOrders: [] as unknown[],
      speechEvaluations: [] as unknown[],
      consultations: [] as unknown[],
      chatThreads: [] as unknown[],
    };

    if (emailLower) {
      linked.enrollments = await db
        .select({
          id: enrollmentRequestsTable.id,
          program: enrollmentRequestsTable.program,
          mode: enrollmentRequestsTable.mode,
          createdAt: enrollmentRequestsTable.createdAt,
        })
        .from(enrollmentRequestsTable)
        .where(sql`lower(${enrollmentRequestsTable.email}) = ${emailLower}`)
        .orderBy(desc(enrollmentRequestsTable.createdAt))
        .limit(20);

      linked.workbookOrders = await db
        .select({
          id: workbookOrdersTable.id,
          workbookId: workbookOrdersTable.workbookId,
          quantity: workbookOrdersTable.quantity,
          format: workbookOrdersTable.format,
          createdAt: workbookOrdersTable.createdAt,
        })
        .from(workbookOrdersTable)
        .where(sql`lower(${workbookOrdersTable.buyerEmail}) = ${emailLower}`)
        .orderBy(desc(workbookOrdersTable.createdAt))
        .limit(20);

      linked.speechEvaluations = await db
        .select({
          id: speechEvaluationsTable.id,
          status: speechEvaluationsTable.status,
          createdAt: speechEvaluationsTable.createdAt,
        })
        .from(speechEvaluationsTable)
        .where(sql`lower(${speechEvaluationsTable.email}) = ${emailLower}`)
        .orderBy(desc(speechEvaluationsTable.createdAt))
        .limit(20);

      linked.consultations = await db
        .select({
          id: consultationBookingsTable.id,
          consultationType: consultationBookingsTable.consultationType,
          preferredDate: consultationBookingsTable.preferredDate,
          preferredTime: consultationBookingsTable.preferredTime,
          status: consultationBookingsTable.status,
          createdAt: consultationBookingsTable.createdAt,
        })
        .from(consultationBookingsTable)
        .where(sql`lower(${consultationBookingsTable.email}) = ${emailLower}`)
        .orderBy(desc(consultationBookingsTable.createdAt))
        .limit(20);
    }
    if (phoneNorm) {
      linked.chatThreads = await db
        .select({
          id: chatThreadsTable.id,
          visitorName: chatThreadsTable.visitorName,
          status: chatThreadsTable.status,
          lastMessageAt: chatThreadsTable.lastMessageAt,
          createdAt: chatThreadsTable.createdAt,
        })
        .from(chatThreadsTable)
        .where(sql`regexp_replace(coalesce(${chatThreadsTable.visitorWhatsapp}, ''), '\\D', '', 'g') = ${phoneNorm}`)
        .orderBy(desc(chatThreadsTable.lastMessageAt))
        .limit(20);
    }

    res.set("Cache-Control", "no-store");
    res.json({ lead, activities, tasks, linked });
  } catch (err) {
    req.log.error({ err }, "[leads] get failed");
    res.status(500).json({ error: "server_error" });
  }
});

// ── Update lead (status, score, owner, notes, follow-up, etc.) ────────
router.patch("/admin/leads/:id", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    const id = req.params.id;
    const body = req.body ?? {};
    const [current] = await db.select().from(leadsTable).where(eq(leadsTable.id, id)).limit(1);
    if (!current) return res.status(404).json({ error: "not_found" });

    if (body.status && body.status !== current.status) {
      await setLeadStatus(id, body.status, {
        userId: req.user?.id,
        email: req.user?.email,
      });
    }

    const patch: Partial<typeof leadsTable.$inferInsert> = {};
    if (typeof body.fullName === "string") patch.fullName = body.fullName;
    if (typeof body.phone === "string") {
      patch.phone = body.phone;
      patch.phoneNormalized = normalizePhone(body.phone);
    }
    if (typeof body.email === "string") {
      patch.email = body.email;
      patch.emailLower = normalizeEmail(body.email);
    }
    if (typeof body.country === "string") patch.country = body.country;
    if (typeof body.interestScore === "string") patch.interestScore = body.interestScore as never;
    if ("ownerUserId" in body) patch.ownerUserId = body.ownerUserId ?? null;
    if (typeof body.internalNotes === "string") patch.internalNotes = body.internalNotes;
    if (typeof body.interestProgramId === "string") patch.interestProgramId = body.interestProgramId;
    if (typeof body.interestProgramTitle === "string") patch.interestProgramTitle = body.interestProgramTitle;
    if ("nextFollowUpAt" in body) {
      patch.nextFollowUpAt = body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null;
    }

    if (Object.keys(patch).length > 0) {
      await db.update(leadsTable).set(patch).where(eq(leadsTable.id, id));
    }

    const [updated] = await db.select().from(leadsTable).where(eq(leadsTable.id, id)).limit(1);
    res.json({ lead: updated });
  } catch (err) {
    req.log.error({ err }, "[leads] patch failed");
    res.status(500).json({ error: "server_error" });
  }
});

// ── Add activity (note / whatsapp_opened / etc.) ───────────────────────
router.post("/admin/leads/:id/activities", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    const id = req.params.id;
    const body = req.body ?? {};
    const type = String(body.type ?? "note_added");
    const summary = String(body.summaryAr ?? body.text ?? "").trim();
    if (!summary && type === "note_added") {
      return res.status(400).json({ error: "summary_required" });
    }
    await recordLeadActivity({
      leadId: id,
      type,
      summaryAr: summary || undefined,
      payload: body.payload ?? undefined,
      actorUserId: req.user?.id,
      actorEmail: req.user?.email,
    });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "[leads] activity failed");
    res.status(500).json({ error: "server_error" });
  }
});

// ── Convert lead to student (link to existing user by email) ───────────
router.post("/admin/leads/:id/convert", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    const id = req.params.id;
    const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.id, id)).limit(1);
    if (!lead) return res.status(404).json({ error: "not_found" });
    const emailLower = normalizeEmail(lead.email);
    let userId: string | null = null;
    if (emailLower) {
      const [user] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(sql`lower(${usersTable.email}) = ${emailLower}`)
        .limit(1);
      if (user) userId = user.id;
    }
    await db
      .update(leadsTable)
      .set({
        convertedToUserId: userId,
        convertedAt: new Date(),
      })
      .where(eq(leadsTable.id, id));
    await setLeadStatus(id, "student", {
      userId: req.user?.id,
      email: req.user?.email,
    });
    await recordLeadActivity({
      leadId: id,
      type: "converted_to_student",
      summaryAr: userId
        ? "تم تحويل العميل إلى طالب وربطه بالحساب الموجود"
        : "تم تحويل العميل إلى طالب (لا يوجد حساب مطابق بالبريد)",
      actorUserId: req.user?.id,
      actorEmail: req.user?.email,
    });
    res.json({ ok: true, linkedUserId: userId });
  } catch (err) {
    req.log.error({ err }, "[leads] convert failed");
    res.status(500).json({ error: "server_error" });
  }
});

// ── Owners list (sales/admin/trainers) for assignment dropdown ─────────
router.get("/admin/leads-meta/owners", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    const rows = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        fullName: usersTable.fullName,
        role: usersTable.role,
      })
      .from(usersTable)
      .where(sql`${usersTable.role} in ('admin', 'sales', 'trainer')`)
      .orderBy(usersTable.email);
    res.json({ owners: rows });
  } catch (err) {
    req.log.error({ err }, "[leads] owners failed");
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
