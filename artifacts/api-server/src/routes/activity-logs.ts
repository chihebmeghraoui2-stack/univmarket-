import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, activityLogsTable } from "@workspace/db";
import { requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

router.get("/api/activity-logs", requireAdmin, async (req, res): Promise<void> => {
  try {
    const { user_id, action, from, to } = req.query;
    const conditions: any[] = [];
    if (user_id) conditions.push(eq(activityLogsTable.userId, Number(user_id)));
    if (action) conditions.push(eq(activityLogsTable.action, action as string));
    if (from) conditions.push(eq(activityLogsTable.createdAt, new Date(from as string).toISOString()));
    if (to) conditions.push(eq(activityLogsTable.createdAt, new Date(to as string).toISOString()));
    const logs = conditions.length > 0
      ? await db.select().from(activityLogsTable).where(and(...conditions)).orderBy(desc(activityLogsTable.createdAt))
      : await db.select().from(activityLogsTable).orderBy(desc(activityLogsTable.createdAt));
    res.json({ data: logs });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer les logs d'activité" });
  }
});

export default router;
