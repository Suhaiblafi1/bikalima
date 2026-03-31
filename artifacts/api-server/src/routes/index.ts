import { Router, type IRouter } from "express";
import healthRouter from "./health";
import enrollRouter from "./enroll";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(enrollRouter);

export default router;
