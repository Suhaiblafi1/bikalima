import { Router, type IRouter } from "express";
import healthRouter from "./health";
import enrollRouter from "./enroll";
import authRouter from "./auth";
import workbookOrderRouter from "./workbook-order";
import adminRouter from "./admin";
import consultationRouter from "./consultation";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(enrollRouter);
router.use(workbookOrderRouter);
router.use(adminRouter);
router.use(consultationRouter);

export default router;
