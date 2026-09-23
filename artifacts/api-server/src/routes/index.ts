import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import farmerAuthRouter from "./farmer-auth";
import smartQueueRouter from "./smartqueue";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(farmerAuthRouter);
router.use(smartQueueRouter);

export default router;
