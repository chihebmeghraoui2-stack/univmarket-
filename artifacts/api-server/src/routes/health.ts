import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/health", async (_req, res) => {
  try {
    // Test database connection
    const connection = await pool.query("SELECT 1");
    const dbStatus = connection ? "connected" : "disconnected";
    
    const data = HealthCheckResponse.parse({
      status: "ok",
      db: dbStatus,
      timestamp: new Date().toISOString(),
    });
    res.json(data);
  } catch (error) {
    res.status(503).json({
      status: "error",
      db: "disconnected",
      timestamp: new Date().toISOString(),
      error: "Database connection failed",
    });
  }
});

export default router;
