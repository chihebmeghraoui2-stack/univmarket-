import { Router, type IRouter } from "express";
import { eq, or, desc } from "drizzle-orm";
import { db, reportsTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

router.post("/api/reports", requireAuth, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const { reported_id, type, reason } = req.body;
    if (!reported_id || !type || !reason) {
      res.status(400).json({ error: "reported_id, type et reason requis" });
      return;
    }
    const [report] = await db.insert(reportsTable).values({
      reporterId: user.id,
      reportedId: reported_id,
      type,
      reason,
    }).returning();
    res.status(201).json({ data: report });
  } catch (error) {
    res.status(500).json({ error: "Impossible de créer le signalement" });
  }
});

router.get("/api/reports", requireAdmin, async (req, res): Promise<void> => {
  try {
    const { status, type } = req.query;
    const conditions: any[] = [];
    if (status) conditions.push(eq(reportsTable.status, status as string));
    if (type) conditions.push(eq(reportsTable.type, type as string));
    const reports = conditions.length > 0
      ? await db.select().from(reportsTable).where(...conditions).orderBy(desc(reportsTable.createdAt))
      : await db.select().from(reportsTable).orderBy(desc(reportsTable.createdAt));
    res.json({ data: reports });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer les signalements" });
  }
});

router.put("/api/reports/:id", requireAdmin, async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { status, admin_note } = req.body;
    const [updated] = await db.update(reportsTable).set({
      status: status ?? "reviewed",
      adminNote: admin_note ?? null,
    }).where(eq(reportsTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "Signalement introuvable" });
      return;
    }
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: "Impossible de mettre à jour le signalement" });
  }
});

export default router;

