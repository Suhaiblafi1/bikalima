import { Router, type IRouter, type Request, type Response } from "express";
import { getAllIntegrationStatuses } from "../integrations/index.js";
import { requireAdmin } from "../lib/admin.js";

const router: IRouter = Router();

router.get("/admin/integrations/status", (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const statuses = getAllIntegrationStatuses();
  res.json({
    integrations: statuses,
    activeCount: statuses.filter((s) => s.enabled).length,
    totalCount: statuses.length,
  });
});

export default router;
