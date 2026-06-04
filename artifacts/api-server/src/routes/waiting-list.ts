import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, waitingListTable } from "@workspace/db";
import { requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

router.post("/api/waiting-list", async (req, res): Promise<void> => {
  try {
    const { email, wilaya_id, role } = req.body;
    if (!email || !role) {
      res.status(400).json({ error: "email et role requis" });
      return;
    }
    const [entry] = await db.insert(waitingListTable).values({
      email,
      wilayaId: wilaya_id ?? null,
      role,
    }).returning();
    res.status(201).json({ data: entry });
  } catch (error) {
    res.status(500).json({ error: "Impossible d'ajouter à la liste d'attente" });
  }
});

router.get("/api/waiting-list", requireAdmin, async (req, res): Promise<void> => {
  try {
    const entries = await db.select().from(waitingListTable).orderBy(desc(waitingListTable.createdAt));
    res.json({ data: entries });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer la liste d'attente" });
  }
});

router.delete("/api/waiting-list/:id", requireAdmin, async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await db.delete(waitingListTable).where(eq(waitingListTable.id, id));
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: "Impossible de supprimer l'entrée de la liste d'attente" });
  }
});

export default router;

