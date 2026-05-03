import { Router, type IRouter, type Request, type Response } from "express";
import { sql } from "drizzle-orm";
import {
  db,
  leadsTable,
  leadActivitiesTable,
  tasksTable,
  consultationBookingsTable,
  speechEvaluationsTable,
  workbookOrdersTable,
  enrollmentRequestsTable,
  chatThreadsTable,
} from "@workspace/db";
import { requireRole } from "../lib/admin.js";

const router: IRouter = Router();

function gate(req: Request, res: Response): boolean {
  return requireRole(req, res, "sales", "trainer");
}

router.get("/admin/growth/overview", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    const [{ totalLeads }] = (await db
      .select({ totalLeads: sql<number>`count(*)::int` })
      .from(leadsTable)) as Array<{ totalLeads: number }>;

    const byStatusRows = await db
      .select({ status: leadsTable.status, c: sql<number>`count(*)::int` })
      .from(leadsTable)
      .groupBy(leadsTable.status);
    const byStatus: Record<string, number> = {};
    for (const r of byStatusRows) byStatus[r.status] = r.c;

    const bySourceRows = await db
      .select({ source: leadsTable.source, c: sql<number>`count(*)::int` })
      .from(leadsTable)
      .groupBy(leadsTable.source);
    const bySource: Record<string, number> = {};
    for (const r of bySourceRows) bySource[r.source] = r.c;

    const [{ newLeads7d }] = (await db
      .select({
        newLeads7d: sql<number>`count(*) filter (where ${leadsTable.createdAt} > now() - interval '7 days')::int`,
      })
      .from(leadsTable)) as Array<{ newLeads7d: number }>;

    const [{ newLeads30d }] = (await db
      .select({
        newLeads30d: sql<number>`count(*) filter (where ${leadsTable.createdAt} > now() - interval '30 days')::int`,
      })
      .from(leadsTable)) as Array<{ newLeads30d: number }>;

    const [{ converted30d }] = (await db
      .select({
        converted30d: sql<number>`count(*) filter (where ${leadsTable.convertedAt} > now() - interval '30 days')::int`,
      })
      .from(leadsTable)) as Array<{ converted30d: number }>;

    const conversionRate = newLeads30d > 0 ? Math.round((converted30d / newLeads30d) * 1000) / 10 : 0;

    const [{ openTasks }] = (await db
      .select({
        openTasks: sql<number>`count(*) filter (where ${tasksTable.status} in ('open','in_progress'))::int`,
      })
      .from(tasksTable)) as Array<{ openTasks: number }>;

    const [{ overdueTasks }] = (await db
      .select({
        overdueTasks: sql<number>`count(*) filter (where ${tasksTable.dueAt} < now() and ${tasksTable.status} <> 'done')::int`,
      })
      .from(tasksTable)) as Array<{ overdueTasks: number }>;

    const [{ todayTasks }] = (await db
      .select({
        todayTasks: sql<number>`count(*) filter (where ${tasksTable.dueAt}::date = current_date and ${tasksTable.status} <> 'done')::int`,
      })
      .from(tasksTable)) as Array<{ todayTasks: number }>;

    const [{ activities7d }] = (await db
      .select({
        activities7d: sql<number>`count(*) filter (where ${leadActivitiesTable.createdAt} > now() - interval '7 days')::int`,
      })
      .from(leadActivitiesTable)) as Array<{ activities7d: number }>;

    const recentActivities = await db
      .select({
        id: leadActivitiesTable.id,
        leadId: leadActivitiesTable.leadId,
        type: leadActivitiesTable.type,
        summaryAr: leadActivitiesTable.summaryAr,
        createdAt: leadActivitiesTable.createdAt,
      })
      .from(leadActivitiesTable)
      .orderBy(sql`${leadActivitiesTable.createdAt} desc`)
      .limit(15);

    const [{ totalConsultations }] = (await db
      .select({ totalConsultations: sql<number>`count(*)::int` })
      .from(consultationBookingsTable)) as Array<{ totalConsultations: number }>;
    const [{ totalSpeechEvals }] = (await db
      .select({ totalSpeechEvals: sql<number>`count(*)::int` })
      .from(speechEvaluationsTable)) as Array<{ totalSpeechEvals: number }>;
    const [{ totalWorkbookOrders }] = (await db
      .select({ totalWorkbookOrders: sql<number>`count(*)::int` })
      .from(workbookOrdersTable)) as Array<{ totalWorkbookOrders: number }>;
    const [{ totalEnrollments }] = (await db
      .select({ totalEnrollments: sql<number>`count(*)::int` })
      .from(enrollmentRequestsTable)) as Array<{ totalEnrollments: number }>;
    const [{ openChats }] = (await db
      .select({ openChats: sql<number>`count(*) filter (where ${chatThreadsTable.status} = 'open')::int` })
      .from(chatThreadsTable)) as Array<{ openChats: number }>;

    res.set("Cache-Control", "no-store");
    res.json({
      totals: {
        leads: totalLeads,
        consultations: totalConsultations,
        speechEvaluations: totalSpeechEvals,
        workbookOrders: totalWorkbookOrders,
        enrollments: totalEnrollments,
        openChats,
      },
      pipeline: {
        byStatus,
        bySource,
        newLeads7d,
        newLeads30d,
        converted30d,
        conversionRate,
      },
      tasks: {
        open: openTasks,
        overdue: overdueTasks,
        dueToday: todayTasks,
      },
      activities: {
        last7d: activities7d,
        recent: recentActivities,
      },
    });
  } catch (err) {
    req.log.error({ err }, "[growth] overview failed");
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
