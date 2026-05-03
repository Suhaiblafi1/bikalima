import { Router, type IRouter, type Request, type Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db, automationsTable } from "@workspace/db";
import { requireAdmin } from "../lib/admin.js";
import { ensureDefaultAutomationsSeeded, runAutomations, executeAutomationRow } from "../lib/automations.js";

const router: IRouter = Router();

router.get("/admin/automations", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    await ensureDefaultAutomationsSeeded();
    const rows = await db
      .select()
      .from(automationsTable)
      .orderBy(desc(automationsTable.isActive), desc(automationsTable.createdAt));
    res.set("Cache-Control", "no-store");
    res.json({
      automations: rows,
      triggers: [
        "lead.created",
        "lead.status_changed",
        "lead.stale_7d",
        "speech_evaluation.created",
        "workbook_order.created",
        "consultation.created",
        "enrollment.created",
        "chat.message_received",
      ],
    });
  } catch (err) {
    req.log.error({ err }, "[automations] list failed");
    res.status(500).json({ error: "server_error" });
  }
});

router.post("/admin/automations", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const body = req.body ?? {};
    const name = String(body.name ?? "").trim();
    const trigger = String(body.trigger ?? "").trim();
    const actions = Array.isArray(body.actions) ? body.actions : [];
    if (!name || !trigger || actions.length === 0) {
      return res.status(400).json({ error: "name_trigger_actions_required" });
    }
    const [created] = await db
      .insert(automationsTable)
      .values({
        name,
        descriptionAr: body.descriptionAr ?? null,
        trigger,
        conditions: body.conditions ?? null,
        actions,
        isActive: body.isActive !== false,
      })
      .returning();
    res.json({ automation: created });
  } catch (err) {
    req.log.error({ err }, "[automations] create failed");
    res.status(500).json({ error: "server_error" });
  }
});

router.patch("/admin/automations/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const id = req.params.id;
    const body = req.body ?? {};
    const patch: Partial<typeof automationsTable.$inferInsert> = {};
    if (typeof body.name === "string") patch.name = body.name;
    if (typeof body.descriptionAr === "string") patch.descriptionAr = body.descriptionAr;
    if (typeof body.trigger === "string") patch.trigger = body.trigger;
    if ("conditions" in body) patch.conditions = body.conditions ?? null;
    if (Array.isArray(body.actions)) patch.actions = body.actions;
    if (typeof body.isActive === "boolean") patch.isActive = body.isActive;
    const [updated] = await db
      .update(automationsTable)
      .set(patch)
      .where(eq(automationsTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "not_found" });
    res.json({ automation: updated });
  } catch (err) {
    req.log.error({ err }, "[automations] update failed");
    res.status(500).json({ error: "server_error" });
  }
});

router.delete("/admin/automations/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    await db.delete(automationsTable).where(eq(automationsTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "[automations] delete failed");
    res.status(500).json({ error: "server_error" });
  }
});

// Manual test runner for an automation against a sample payload.
router.post("/admin/automations/:id/test", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    const [row] = await db
      .select()
      .from(automationsTable)
      .where(eq(automationsTable.id, req.params.id))
      .limit(1);
    if (!row) return res.status(404).json({ error: "not_found" });
    await executeAutomationRow(row, req.body ?? {});
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "[automations] test failed");
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
