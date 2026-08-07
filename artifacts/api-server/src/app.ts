import "dotenv/config";
import compression from "compression";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

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

app.use(compression());
app.use(cors({ origin: ["https://univmarket-dz.vercel.app", "http://localhost:5173"], credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/api/docs", (_req, res) => {
  res.json({
    version: "1.0.0",
    name: "UnivMarket API",
    endpoints: [
      "GET /api/health",
      "POST /auth/register",
      "POST /auth/login",
      "GET /auth/me",
      "GET /api/wilayas",
      "GET /api/services",
      "GET /api/blog",
      "GET /api/sellers/:id",
      "GET /api/stats/leaderboard",
      "GET /api/affiliations/my-network",
      "GET /api/2fa/status",
      "GET /api/contracts/:id",
      "GET /api/files/:token"
    ]
  });
});

app.use("/api", router);

export default app;


