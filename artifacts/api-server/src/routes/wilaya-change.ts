import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, wilayaChangeRequestsTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

router.post("/api/wilaya-change-requests", requireAuth, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const { current_wilaya_id, requested_wilaya_id, reason } = req.body;
    if (!current_wilaya_id || !requested_wilaya_id || !reason) {
      res.status(400).json({ error: "current_wilaya_id, requested_wilaya_id et reason requis" });
      return;
    }
    const [request] = await db.insert(wilayaChangeRequestsTable).values({
      sellerId: user.id,
      currentWilayaId: Number(current_wilaya_id),
      requestedWilayaId: Number(requested_wilaya_id),
      reason,
    }).returning();
    res.status(201).json({ data: request });
  } catch (error) {
    res.status(500).json({ error: "Impossible de créer la demande de changement de wilaya" });
  }
});

router.get("/api/wilaya-change-requests", requireAdmin, async (req, res): Promise<void> => {
  try {
    const requests = await db.select().from(wilayaChangeRequestsTable);
    res.json({ data: requests });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer les demandes de changement" });
  }
});

router.put("/api/wilaya-change-requests/:id", requireAdmin, async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { status, admin_note } = req.body;
    const [updated] = await db.update(wilayaChangeRequestsTable).set({
      status: status ?? "pending",
      adminNote: admin_note ?? null,
      decidedAt: new Date().toISOString(),
    }).where(eq(wilayaChangeRequestsTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "Demande introuvable" });
      return;
    }
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: "Impossible de mettre à jour la demande" });
  }
});

export default router;

