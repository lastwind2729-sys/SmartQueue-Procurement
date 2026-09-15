import { Router, type IRouter } from "express";
import healthRouter from "./health";
import smartQueueRouter from "./smartqueue";

const router: IRouter = Router();

router.use(healthRouter);
router.use(smartQueueRouter);

export default router;
