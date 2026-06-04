import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, paymentsTable, ordersTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

router.post("/api/payments/receipt", requireAuth, async (req, res): Promise<void> => {
  try {
    const { order_id, method, amount, transaction_ref, receipt_image } = req.body;
    if (!order_id || !method || !amount) {
      res.status(400).json({ error: "order_id, method et amount requis" });
      return;
    }
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, Number(order_id)));
    if (!order) { res.status(404).json({ error: "Commande introuvable" }); return; }
    const [payment] = await db.insert(paymentsTable).values({
      orderId: order.id,
      method,
      amount: String(amount),
      status: "pending",
      transactionRef: transaction_ref ?? null,
      receiptImage: receipt_image ?? null,
    }).returning();
    res.status(201).json({ data: payment });
  } catch (error) {
    res.status(500).json({ error: "Impossible de soumettre le reçu" });
  }
});

router.get("/api/payments/:orderId", requireAuth, async (req, res): Promise<void> => {
  try {
    const orderId = Number(req.params.orderId);
    const user = (req as any).user;
    const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.orderId, orderId));
    if (!payments.length) {
      res.status(404).json({ error: "Aucun paiement trouvé" });
      return;
    }
    const payment = payments[0];
    // Access control is based on order ownership or admin
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
    if (!order || (order.clientId !== user.id && order.sellerId !== user.id && user.role !== "admin")) {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }
    res.json({ data: payments });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer le paiement" });
  }
});

router.put("/api/payments/:id/confirm", requireAdmin, async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const [payment] = await db.update(paymentsTable).set({ status: "confirmed", confirmedAt: new Date().toISOString() }).where(eq(paymentsTable.id, id)).returning();
    if (!payment) {
      res.status(404).json({ error: "Paiement introuvable" });
      return;
    }
    res.json({ data: payment });
  } catch (error) {
    res.status(500).json({ error: "Impossible de confirmer le paiement" });
  }
});

router.put("/api/payments/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const [payment] = await db.update(paymentsTable).set({ status: "rejected" }).where(eq(paymentsTable.id, id)).returning();
    if (!payment) {
      res.status(404).json({ error: "Paiement introuvable" });
      return;
    }
    res.json({ data: payment });
  } catch (error) {
    res.status(500).json({ error: "Impossible de rejeter le paiement" });
  }
});

export default router;

