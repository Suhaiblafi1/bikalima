import { Router, type IRouter } from "express";
import healthRouter from "./health";
import enrollRouter from "./enroll";
import authRouter from "./auth";
import workbookOrderRouter from "./workbook-order";
import adminRouter from "./admin";
import consultationRouter from "./consultation";
import coursesRouter from "./courses";
import ordersRouter from "./orders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(enrollRouter);
router.use(workbookOrderRouter);
router.use(adminRouter);
router.use(consultationRouter);
router.use(coursesRouter);
router.use(ordersRouter);

export default router;
