import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ordersTable, escrowTransactionsTable, sellerWalletsTable, walletTransactionsTable, notificationsTable, servicesTable, categoriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

// GET /escrow/:orderId — voir l'escrow d'une commande
router.get("/escrow/:orderId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const orderId = Number(req.params.orderId);

  try {
    const escrow = await db
      .select()
      .from(escrowTransactionsTable)
      .where(eq(escrowTransactionsTable.orderId, orderId))
      .limit(1);

    if (!escrow.length) {
      res.status(404).json({ error: "Escrow non trouvé" });
      return;
    }

    res.json(escrow[0]);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /escrow/:orderId/hold — bloquer les fonds (à la création de commande)
router.post("/escrow/:orderId/hold", requireAuth, async (req, res): Promise<void> => {
  const orderId = Number(req.params.orderId);
  const { amount, commissionAmount } = req.body;

  try {
    // Vérifier que la commande existe
    const order = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .limit(1);

    if (!order.length) {
      res.status(404).json({ error: "Commande non trouvée" });
      return;
    }

    // Vérifier qu'il n'existe pas déjà un escrow
    const existing = await db
      .select()
      .from(escrowTransactionsTable)
      .where(eq(escrowTransactionsTable.orderId, orderId))
      .limit(1);

    if (existing.length) {
      res.status(400).json({ error: "Escrow déjà créé pour cette commande" });
      return;
    }

    // Vérifier si le service est de catégorie Marketing Digital -> commission 0%
    let finalCommission = commissionAmount || amount * 0.1;
    try {
      const serviceRow = await db
        .select({ categoryId: servicesTable.categoryId })
        .from(servicesTable)
        .where(eq(servicesTable.id, order[0].serviceId))
        .limit(1);
      if (serviceRow.length) {
        const catRow = await db
          .select({ nameFr: categoriesTable.nameFr })
          .from(categoriesTable)
          .where(eq(categoriesTable.id, serviceRow[0].categoryId))
          .limit(1);
        if (catRow.length && catRow[0].nameFr?.toLowerCase().includes("marketing")) {
          finalCommission = 0; // 0% pour Marketing Digital
        }
      }
    } catch {}

    const autoReleaseAt = new Date();
    autoReleaseAt.setHours(autoReleaseAt.getHours() + 72);

    const [escrow] = await db
      .insert(escrowTransactionsTable)
      .values({
        orderId,
        amount: String(amount),
        commissionAmount: String(finalCommission),
        status: "held",
        heldAt: new Date(),
        autoReleaseAt,
      })
      .returning();

    // Mettre à jour le pending_balance du vendeur
    const vendorId = order[0].sellerId;
    const wallet = await db
      .select()
      .from(sellerWalletsTable)
      .where(eq(sellerWalletsTable.sellerId, vendorId))
      .limit(1);

    if (wallet.length) {
      const newPending = Number(wallet[0].pendingBalance) + Number(amount) - Number(finalCommission);
      await db
        .update(sellerWalletsTable)
        .set({ pendingBalance: String(newPending) })
        .where(eq(sellerWalletsTable.sellerId, vendorId));
    }

    res.status(201).json(escrow);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /escrow/:orderId/release — libérer les fonds vers le vendeur
router.post("/escrow/:orderId/release", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const orderId = Number(req.params.orderId);

  try {
    const order = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .limit(1);

    if (!order.length) {
      res.status(404).json({ error: "Commande non trouvée" });
      return;
    }

    // Seul le client ou l'admin peut libérer
    const userRole = (req as any).user.role;
    if (order[0].clientId !== userId && userRole !== "admin") {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }

    const escrow = await db
      .select()
      .from(escrowTransactionsTable)
      .where(eq(escrowTransactionsTable.orderId, orderId))
      .limit(1);

    if (!escrow.length || escrow[0].status !== "held") {
      res.status(400).json({ error: "Escrow non disponible pour libération" });
      return;
    }

    const netAmount = Number(escrow[0].amount) - Number(escrow[0].commissionAmount);

    // Mettre à jour l'escrow
    const [updated] = await db
      .update(escrowTransactionsTable)
      .set({
        status: "released",
        releasedAt: new Date(),
        releasedBy: userId,
        releaseReason: "Client a confirmé la livraison",
      })
      .where(eq(escrowTransactionsTable.orderId, orderId))
      .returning();

    // Créditer le wallet du vendeur
    const vendorId = order[0].sellerId;
    const wallet = await db
      .select()
      .from(sellerWalletsTable)
      .where(eq(sellerWalletsTable.sellerId, vendorId))
      .limit(1);

    if (wallet.length) {
      const newBalance = Number(wallet[0].balance) + netAmount;
      const newPending = Math.max(0, Number(wallet[0].pendingBalance) - netAmount);
      const newTotalEarned = Number(wallet[0].totalEarned) + netAmount;

      await db
        .update(sellerWalletsTable)
        .set({
          balance: String(newBalance),
          pendingBalance: String(newPending),
          totalEarned: String(newTotalEarned),
          lastTransactionAt: new Date(),
        })
        .where(eq(sellerWalletsTable.sellerId, vendorId));

      // Enregistrer la transaction wallet
      await db.insert(walletTransactionsTable).values({
        walletId: wallet[0].id,
        type: "credit",
        amount: String(netAmount),
        referenceId: String(orderId),
        description: `Paiement libéré pour commande #${orderId}`,
      });
    }

    // Notifier le vendeur
    await db.insert(notificationsTable).values({
      userId: vendorId,
      type: "escrow_released",
      title: "Paiement reçu !",
      body: `${netAmount} DZD ont été crédités sur votre wallet pour la commande #${orderId}`,
      isRead: false,
    });

    res.json({ escrow: updated, netAmount });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /escrow/:orderId/refund — rembourser le client
router.post("/escrow/:orderId/refund", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;
  const orderId = Number(req.params.orderId);

  if (userRole !== "admin") {
    res.status(403).json({ error: "Admin seulement" });
    return;
  }

  try {
    const escrow = await db
      .select()
      .from(escrowTransactionsTable)
      .where(eq(escrowTransactionsTable.orderId, orderId))
      .limit(1);

    if (!escrow.length) {
      res.status(404).json({ error: "Escrow non trouvé" });
      return;
    }

    const [updated] = await db
      .update(escrowTransactionsTable)
      .set({
        status: "refunded",
        releasedAt: new Date(),
        releasedBy: userId,
        releaseReason: "Remboursement admin",
      })
      .where(eq(escrowTransactionsTable.orderId, orderId))
      .returning();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;

