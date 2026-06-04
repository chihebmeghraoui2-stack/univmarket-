import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, sellerOnboardingProgressTable } from "@workspace/db";
import { requireSeller } from "../middleware/auth";

const router: IRouter = Router();

router.get("/api/onboarding/progress", requireSeller, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const [progress] = await db.select().from(sellerOnboardingProgressTable).where(eq(sellerOnboardingProgressTable.sellerId, user.id));
    res.json({ data: progress ?? null });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer le progrès onboarding" });
  }
});

router.put("/api/onboarding/step", requireSeller, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const { step } = req.body;
    if (!step) {
      res.status(400).json({ error: "step requis" });
      return;
    }
    const [existing] = await db.select().from(sellerOnboardingProgressTable).where(eq(sellerOnboardingProgressTable.sellerId, user.id));
    if (existing) {
      const steps = Array.isArray(existing.stepsCompleted) ? Array.from(new Set([...existing.stepsCompleted, step])) : [step];
      const [updated] = await db.update(sellerOnboardingProgressTable).set({ stepsCompleted: steps, updatedAt: new Date().toISOString() }).where(eq(sellerOnboardingProgressTable.sellerId, user.id)).returning();
      res.json({ data: updated });
      return;
    }
    const [created] = await db.insert(sellerOnboardingProgressTable).values({
      sellerId: user.id,
      stepsCompleted: [step],
      updatedAt: new Date().toISOString(),
    }).returning();
    res.status(201).json({ data: created });
  } catch (error) {
    res.status(500).json({ error: "Impossible de mettre à jour le onboarding" });
  }
});

export default router;
