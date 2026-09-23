import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { requireAuth } from "./lib/auth";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Do not rely on the browser's sessionStorage flag for access control. Every
// farmer data endpoint must have a server-issued session for a verified farmer.
const farmerDataGuard = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === "/auth/me" || req.path === "/auth/logout") {
    next();
    return;
  }
  requireAuth("farmer")(req, res, next);
};

app.use("/api", router);

export default app;
