import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import enrollRouter from "./enroll.js";
import workbookOrderRouter from "./workbook-order.js";
import adminRouter from "./admin.js";
import consultationRouter from "./consultation.js";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(enrollRouter);
router.use(workbookOrderRouter);
router.use(adminRouter);
router.use(consultationRouter);

export default router;
