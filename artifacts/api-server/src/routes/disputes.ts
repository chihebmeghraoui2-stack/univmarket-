import { Router, type IRouter } from "express";
import { eq, and, desc, count, or } from "drizzle-orm";
import { db, disputesTable, ordersTable, notificationsTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

// GET /disputes
router.get("/disputes", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const page = parseInt(req.query.page as string ?? "1", 10);
  const limit = Math.min(parseInt(req.query.limit as string ?? "20", 10), 50);
  const offset = (page - 1) * limit;

  const conditions = user.role === "admin"
    ? []
    : [or(eq(disputesTable.clientId, user.id), eq(disputesTable.sellerId, user.id))];

  const rows = await db.select().from(disputesTable).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(disputesTable.createdAt)).limit(limit).offset(offset);
  const [{ total }] = await db.select({ total: count() }).from(disputesTable).where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json({
    data: rows.map(d => ({
      id: d.id, order_id: d.orderId, client_id: d.clientId, seller_id: d.sellerId,
      reason: d.reason, status: d.status, admin_decision: d.adminDecision,
      refund_amount: d.refundAmount, created_at: d.createdAt,
    })),
    total: Number(total), page, limit,
  });
});

// POST /disputes
router.post("/disputes", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const { order_id, reason } = req.body;
  if (!order_id || !reason) { res.status(400).json({ error: "order_id et reason requis" }); return; }

  const [order] = await db.select().from(ordersTable).where(and(eq(ordersTable.id, Number(order_id)), eq(ordersTable.clientId, user.id)));
  if (!order) { res.status(404).json({ error: "Commande introuvable" }); return; }

  const [dispute] = await db.insert(disputesTable).values({
    orderId: order.id, clientId: user.id, sellerId: order.sellerId, reason,
  }).returning();

  // Update order status
  await db.update(ordersTable).set({ status: "disputed" }).where(eq(ordersTable.id, order.id));

  // Notify seller
  await db.insert(notificationsTable).values({
    userId: order.sellerId,
    type: "dispute_opened",
    title: "Litige ouvert",
    body: `Un litige a été ouvert pour la commande #${order.id}`,
    link: `/orders/${order.id}`,
  });

  res.status(201).json({ id: dispute.id, order_id: dispute.orderId, status: dispute.status, created_at: dispute.createdAt });
});

// GET /disputes/:id
router.get("/disputes/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [d] = await db.select().from(disputesTable).where(eq(disputesTable.id, id));
  if (!d) { res.status(404).json({ error: "Litige introuvable" }); return; }
  if (d.clientId !== user.id && d.sellerId !== user.id && user.role !== "admin") {
    res.status(403).json({ error: "Accès refusé" }); return;
  }
  res.json({
    id: d.id, order_id: d.orderId, client_id: d.clientId, seller_id: d.sellerId,
    reason: d.reason, status: d.status, seller_reply: d.sellerReply,
    admin_decision: d.adminDecision, refund_amount: d.refundAmount, created_at: d.createdAt,
  });
});

// POST /disputes/:id/reply
router.post("/disputes/:id/reply", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { reply } = req.body;
  if (!reply) { res.status(400).json({ error: "Réponse requise" }); return; }
  const [d] = await db.select().from(disputesTable).where(eq(disputesTable.id, id));
  if (!d) { res.status(404).json({ error: "Litige introuvable" }); return; }
  if (d.sellerId !== user.id) { res.status(403).json({ error: "Non autorisé" }); return; }
  const [updated] = await db.update(disputesTable).set({ sellerReply: reply, status: "seller_replied" }).where(eq(disputesTable.id, id)).returning();
  res.json({ id: updated.id, status: updated.status, seller_reply: updated.sellerReply });
});

export default router;
