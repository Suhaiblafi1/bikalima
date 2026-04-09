import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import enrollRouter from "./enroll.js";
import workbookOrderRouter from "./workbook-order.js";
import adminRouter from "./admin.js";
import consultationRouter from "./consultation.js";
import coursesRouter from "./courses.js";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(enrollRouter);
router.use(workbookOrderRouter);
router.use(adminRouter);
router.use(consultationRouter);
router.use(coursesRouter);

export default router;
