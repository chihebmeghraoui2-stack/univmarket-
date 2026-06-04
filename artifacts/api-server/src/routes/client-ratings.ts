import { Router, type IRouter } from "express";
import { eq, avg } from "drizzle-orm";
import { db, clientRatingsTable } from "@workspace/db";
import { requireSeller } from "../middleware/auth";

const router: IRouter = Router();

router.post("/api/client-ratings", requireSeller, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const { order_id, client_id, rating, comment } = req.body;
    if (!order_id || !client_id || !rating) {
      res.status(400).json({ error: "order_id, client_id et rating requis" });
      return;
    }
    const [entry] = await db.insert(clientRatingsTable).values({
      orderId: Number(order_id),
      sellerId: user.id,
      clientId: Number(client_id),
      rating: Number(rating),
      comment: comment ?? null,
    }).returning();
    res.status(201).json({ data: entry });
  } catch (error) {
    res.status(500).json({ error: "Impossible de créer la note client" });
  }
});

router.get("/api/clients/:id/rating", async (req, res): Promise<void> => {
  try {
    const clientId = Number(req.params.id);
    const [{ average }] = await db.select({ average: avg(clientRatingsTable.rating) }).from(clientRatingsTable).where(eq(clientRatingsTable.clientId, clientId));
    res.json({ data: { client_id: clientId, average_rating: Number(average ?? 0) } });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer la note client" });
  }
});

export default router;

