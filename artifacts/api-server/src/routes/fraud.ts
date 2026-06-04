import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, fraudFlagsTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

router.get("/api/fraud-flags", requireAdmin, async (req, res): Promise<void> => {
  try {
    const flags = await db.select().from(fraudFlagsTable).orderBy(desc(fraudFlagsTable.createdAt));
    res.json({ data: flags });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer les flags frauduleux" });
  }
});

router.put("/api/fraud-flags/:id/review", requireAdmin, async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { reviewed, reviewed_by } = req.body;
    const [updated] = await db.update(fraudFlagsTable).set({
      reviewed: Boolean(reviewed),
      reviewedBy: reviewed_by ? Number(reviewed_by) : null,
    }).where(eq(fraudFlagsTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "Flag frauduleux introuvable" });
      return;
    }
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: "Impossible de mettre à jour le flag frauduleux" });
  }
});

router.post("/api/fraud-flags", requireAuth, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const { flag_type, severity, details_json } = req.body;
    if (!flag_type || !severity) {
      res.status(400).json({ error: "flag_type et severity requis" });
      return;
    }
    const [flag] = await db.insert(fraudFlagsTable).values({
      userId: user.id,
      flagType: flag_type,
      severity,
      detailsJson: details_json ?? {},
    }).returning();
    res.status(201).json({ data: flag });
  } catch (error) {
    res.status(500).json({ error: "Impossible de créer le flag frauduleux" });
  }
});

export default router;
