import { Router, type IRouter } from "express";
import healthRouter from "./health";
import enrollRouter from "./enroll";

const router: IRouter = Router();

router.use(healthRouter);
router.use(enrollRouter);

export default router;
