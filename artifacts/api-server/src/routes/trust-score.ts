import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, sellerTrustScoresTable } from "@workspace/db";
import { requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

router.get("/api/sellers/:id/trust-score", async (req, res): Promise<void> => {
  try {
    const sellerId = Number(req.params.id);
    const [score] = await db.select().from(sellerTrustScoresTable).where(eq(sellerTrustScoresTable.sellerId, sellerId));
    res.json({ data: score ?? null });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer le trust score" });
  }
});

router.post("/api/trust-scores/recalculate", requireAdmin, async (req, res): Promise<void> => {
  try {
    const { seller_id } = req.body;
    if (!seller_id) {
      res.status(400).json({ error: "seller_id requis" });
      return;
    }
    const sellerId = Number(seller_id);
    const [existing] = await db.select().from(sellerTrustScoresTable).where(eq(sellerTrustScoresTable.sellerId, sellerId));
    if (existing) {
      const [updated] = await db.update(sellerTrustScoresTable).set({ updatedAt: new Date().toISOString() }).where(eq(sellerTrustScoresTable.sellerId, sellerId)).returning();
      res.json({ data: updated });
      return;
    }
    const [created] = await db.insert(sellerTrustScoresTable).values({
      sellerId,
      score: 0,
      verificationScore: 0,
      ratingScore: 0,
      completionRateScore: 0,
      disputeScore: 0,
      ageScore: 0,
      componentsJson: {},
    }).returning();
    res.status(201).json({ data: created });
  } catch (error) {
    res.status(500).json({ error: "Impossible de recalculer le trust score" });
  }
});

export default router;

