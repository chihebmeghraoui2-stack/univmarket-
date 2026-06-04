import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, portfoliosTable } from "@workspace/db";
import { requireAuth, requireSeller } from "../middleware/auth";

const router: IRouter = Router();

router.get("/api/sellers/:id/portfolio", async (req, res): Promise<void> => {
  try {
    const sellerId = Number(req.params.id);
    const portfolio = await db.select().from(portfoliosTable).where(eq(portfoliosTable.sellerId, sellerId)).orderBy(desc(portfoliosTable.createdAt));
    res.json({ data: portfolio });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer le portfolio" });
  }
});

router.post("/api/portfolio", requireSeller, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const { title, description, images } = req.body;
    if (!title) {
      res.status(400).json({ error: "title requis" });
      return;
    }
    const [item] = await db.insert(portfoliosTable).values({
      sellerId: user.id,
      title,
      description: description ?? null,
      images: Array.isArray(images) ? images : [],
    }).returning();
    res.status(201).json({ data: item });
  } catch (error) {
    res.status(500).json({ error: "Impossible de créer l'élément de portfolio" });
  }
});

router.delete("/api/portfolio/:id", requireSeller, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const id = Number(req.params.id);
    const [entry] = await db.select().from(portfoliosTable).where(eq(portfoliosTable.id, id));
    if (!entry || entry.sellerId !== user.id) {
      res.status(404).json({ error: "Portfolio introuvable" });
      return;
    }
    await db.delete(portfoliosTable).where(eq(portfoliosTable.id, id));
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: "Impossible de supprimer l'élément de portfolio" });
  }
});

export default router;

