import { Router, type IRouter, type Request, type Response } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, tasksTable, leadsTable, usersTable } from "@workspace/db";
import { requireRole } from "../lib/admin.js";
import { recordLeadActivity } from "../lib/leads.js";

const router: IRouter = Router();

function gate(req: Request, res: Response): boolean {
  return requireRole(req, res, "sales", "trainer");
}

router.get("/admin/tasks", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    const filter = typeof req.query.filter === "string" ? req.query.filter : "all";
    const assignee = typeof req.query.assignee === "string" ? req.query.assignee : "";
    const userId = req.user?.id ?? null;

    const conds = [] as ReturnType<typeof eq>[];
    if (assignee === "mine" && userId) {
      conds.push(eq(tasksTable.assigneeUserId, userId));
    } else if (assignee === "unassigned") {
      conds.push(sql`${tasksTable.assigneeUserId} is null` as never);
    } else if (assignee && assignee !== "all") {
      conds.push(eq(tasksTable.assigneeUserId, assignee));
    }

    if (filter === "open") conds.push(sql`${tasksTable.status} in ('open','in_progress')` as never);
    if (filter === "done") conds.push(eq(tasksTable.status, "done"));
    if (filter === "today") {
      conds.push(sql`${tasksTable.dueAt}::date = current_date` as never);
      conds.push(sql`${tasksTable.status} <> 'done'` as never);
    }
    if (filter === "overdue") {
      conds.push(sql`${tasksTable.dueAt} < now()` as never);
      conds.push(sql`${tasksTable.status} <> 'done'` as never);
    }

    const where = conds.length > 0 ? and(...conds) : undefined;
    const base = db
      .select({
        id: tasksTable.id,
        title: tasksTable.title,
        description: tasksTable.description,
        leadId: tasksTable.leadId,
        leadName: leadsTable.fullName,
        leadStatus: leadsTable.status,
        assigneeUserId: tasksTable.assigneeUserId,
        assigneeEmail: usersTable.email,
        assigneeFirstName: usersTable.firstName,
        assigneeLastName: usersTable.lastName,
        priority: tasksTable.priority,
        status: tasksTable.status,
        dueAt: tasksTable.dueAt,
        completedAt: tasksTable.completedAt,
        sourceType: tasksTable.sourceType,
        createdAt: tasksTable.createdAt,
      })
      .from(tasksTable)
      .leftJoin(leadsTable, eq(leadsTable.id, tasksTable.leadId))
      .leftJoin(usersTable, eq(usersTable.id, tasksTable.assigneeUserId));

    const rows = await (where ? base.where(where) : base)
      .orderBy(
        sql`case ${tasksTable.status} when 'open' then 0 when 'in_progress' then 1 when 'snoozed' then 2 else 3 end`,
        sql`${tasksTable.dueAt} asc nulls last`,
        desc(tasksTable.createdAt),
      )
      .limit(500);

    res.set("Cache-Control", "no-store");
    res.json({ tasks: rows });
  } catch (err) {
    req.log.error({ err }, "[tasks] list failed");
    res.status(500).json({ error: "server_error" });
  }
});

router.post("/admin/tasks", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    const body = req.body ?? {};
    const title = String(body.title ?? "").trim();
    if (!title) return res.status(400).json({ error: "title_required" });
    const [task] = await db
      .insert(tasksTable)
      .values({
        title,
        description: body.description ?? null,
        leadId: body.leadId ?? null,
        assigneeUserId: body.assigneeUserId ?? null,
        createdByUserId: req.user?.id ?? null,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        priority: body.priority ?? "medium",
        status: "open",
        sourceType: "manual",
      })
      .returning();
    if (task.leadId) {
      await recordLeadActivity({
        leadId: task.leadId,
        type: "task_created",
        summaryAr: `تم إنشاء مهمة: ${title}`,
        relatedEntityType: "task",
        relatedEntityId: task.id,
        actorUserId: req.user?.id,
        actorEmail: req.user?.email,
      });
    }
    res.json({ task });
  } catch (err) {
    req.log.error({ err }, "[tasks] create failed");
    res.status(500).json({ error: "server_error" });
  }
});

router.patch("/admin/tasks/:id", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    const id = req.params.id;
    const body = req.body ?? {};
    const [current] = await db.select().from(tasksTable).where(eq(tasksTable.id, id)).limit(1);
    if (!current) return res.status(404).json({ error: "not_found" });

    const patch: Partial<typeof tasksTable.$inferInsert> = {};
    if (typeof body.title === "string") patch.title = body.title;
    if (typeof body.description === "string") patch.description = body.description;
    if ("assigneeUserId" in body) patch.assigneeUserId = body.assigneeUserId ?? null;
    if ("dueAt" in body) patch.dueAt = body.dueAt ? new Date(body.dueAt) : null;
    if (typeof body.priority === "string") patch.priority = body.priority as never;
    if (typeof body.status === "string") {
      patch.status = body.status;
      if (body.status === "done") patch.completedAt = new Date();
      if (body.status !== "done") patch.completedAt = null;
    }
    if ("snoozedUntil" in body) {
      patch.snoozedUntil = body.snoozedUntil ? new Date(body.snoozedUntil) : null;
    }

    if (Object.keys(patch).length === 0) {
      return res.json({ task: current });
    }

    const [updated] = await db
      .update(tasksTable)
      .set(patch)
      .where(eq(tasksTable.id, id))
      .returning();

    if (current.leadId && body.status === "done" && current.status !== "done") {
      await recordLeadActivity({
        leadId: current.leadId,
        type: "task_completed",
        summaryAr: `تم إنجاز المهمة: ${current.title}`,
        relatedEntityType: "task",
        relatedEntityId: id,
        actorUserId: req.user?.id,
        actorEmail: req.user?.email,
      });
    }

    res.json({ task: updated });
  } catch (err) {
    req.log.error({ err }, "[tasks] update failed");
    res.status(500).json({ error: "server_error" });
  }
});

router.delete("/admin/tasks/:id", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    await db.delete(tasksTable).where(eq(tasksTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "[tasks] delete failed");
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
