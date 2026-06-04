import { Router } from "express";
import { db } from "@workspace/db";
import { contractsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/api/contracts/:id", requireAuth, async (req, res) => {
  try {
    const [contract] = await db.select().from(contractsTable)
      .where(eq(contractsTable.id, parseInt(req.params.id)));
    if (!contract) return res.status(404).json({ error: "Contrat introuvable" });
    res.json(contract);
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/api/contracts", requireAuth, async (req, res) => {
  try {
    const { orderId, clientId, sellerId, title, description, amount, deliveryDays, terms } = req.body;
    const [contract] = await db.insert(contractsTable)
      .values({ orderId, clientId, sellerId, title, description, amount, deliveryDays, terms })
      .returning();
    res.json(contract);
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/api/contracts/:id/sign", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const [contract] = await db.select().from(contractsTable)
      .where(eq(contractsTable.id, parseInt(req.params.id)));
    if (!contract) return res.status(404).json({ error: "Contrat introuvable" });

    const isClient = contract.clientId === userId;
    const isSeller = contract.sellerId === userId;
    if (!isClient && !isSeller) return res.status(403).json({ error: "Non autorisé" });

    const update: any = isClient
      ? { clientSignedAt: new Date() }
      : { sellerSignedAt: new Date() };

    const nowClient = isClient ? new Date() : contract.clientSignedAt;
    const nowSeller = isSeller ? new Date() : contract.sellerSignedAt;
    if (nowClient && nowSeller) update.status = "signed";

    const [updated] = await db.update(contractsTable)
      .set(update)
      .where(eq(contractsTable.id, parseInt(req.params.id)))
      .returning();
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
