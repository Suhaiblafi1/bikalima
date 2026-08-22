import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { analyticsEventsTable, db } from "@workspace/db";
import { desc, gte, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/admin.js";
import { applyAdHocLimit } from "../middlewares/security.js";

const router: IRouter = Router();
const ALLOWED_EVENTS = [
  "click_whatsapp", "submit_interest_form", "click_zoom_booking", "click_program_details",
  "click_external_registration", "reserve_seat_click", "question_before_booking_click", "tab_change",
  "page_view", "checkout_started", "discount_applied", "payment_redirect", "in_person_registration",
] as const;

const schema = z.object({
  anonymousId: z.string().uuid().max(64),
  eventName: z.enum(ALLOWED_EVENTS),
  path: z.string().trim().startsWith("/").max(500),
  properties: z.record(z.string(), z.union([z.string().max(160), z.number(), z.boolean(), z.null()])).optional(),
}).superRefine((data, ctx) => {
  const sensitiveKey = Object.keys(data.properties ?? {}).find((key) =>
    /(^|_)(email|phone|mobile|whatsapp|name|full_name|video_url|audio_url)($|_)/i.test(key),
  );
  if (sensitiveKey) ctx.addIssue({ code: "custom", path: ["properties", sensitiveKey], message: "Personal data is not allowed in analytics" });
});

router.post("/analytics/events", async (req: Request, res: Response) => {
  if (!applyAdHocLimit(res, `analytics:${req.ip ?? "unknown"}`, 120, 60 * 60_000)) return;
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid analytics event" });
  await db.insert(analyticsEventsTable).values(parsed.data);
  res.status(202).json({ accepted: true });
});

router.get("/admin/analytics/summary", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const days = Math.min(90, Math.max(1, Number(req.query.days ?? 30)));
  const since = new Date(Date.now() - days * 24 * 60 * 60_000);
  const byEvent = await db.select({ eventName: analyticsEventsTable.eventName, count: sql<number>`count(*)::int` })
    .from(analyticsEventsTable).where(gte(analyticsEventsTable.createdAt, since))
    .groupBy(analyticsEventsTable.eventName).orderBy(desc(sql`count(*)`));
  const byPath = await db.select({ path: analyticsEventsTable.path, count: sql<number>`count(*)::int` })
    .from(analyticsEventsTable).where(gte(analyticsEventsTable.createdAt, since))
    .groupBy(analyticsEventsTable.path).orderBy(desc(sql`count(*)`)).limit(20);
  const [visitors] = await db.select({ count: sql<number>`count(distinct ${analyticsEventsTable.anonymousId})::int` })
    .from(analyticsEventsTable).where(gte(analyticsEventsTable.createdAt, since));
  res.json({ days, uniqueVisitors: visitors?.count ?? 0, byEvent, byPath });
});

export default router;
