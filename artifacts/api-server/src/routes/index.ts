import { Router, type IRouter } from "express";
import healthRouter from "./health";
import enrollRouter from "./enroll";
import authRouter from "./auth";
import workbookOrderRouter from "./workbook-order";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(enrollRouter);
router.use(workbookOrderRouter);

export default router;
