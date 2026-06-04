import { Router, type IRouter } from "express";
import { eq, and, or, desc, count } from "drizzle-orm";
import { db, ordersTable, servicesTable, usersTable, sellerWalletsTable, walletTransactionsTable, escrowTransactionsTable, notificationsTable, categoriesTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

const COMMISSION_RATE = 0.10;
const ZERO_COMMISSION_SLUGS = ["marketing"]; // categories avec 0% commission

// GET /orders
router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const { status, role = "client", page = "1", limit = "20" } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = Math.min(parseInt(limit as string, 10), 50);
  const offset = (pageNum - 1) * limitNum;

  const roleCondition = role === "seller"
    ? eq(ordersTable.sellerId, user.id)
    : eq(ordersTable.clientId, user.id);

  const conditions: any[] = [roleCondition];
  if (status) conditions.push(eq(ordersTable.status, status as string));

  const rows = await db.select().from(ordersTable).where(and(...conditions)).orderBy(desc(ordersTable.createdAt)).limit(limitNum).offset(offset);
  const [{ total }] = await db.select({ total: count() }).from(ordersTable).where(and(...conditions));

  res.json({
    data: rows.map(o => ({
      id: o.id, client_id: o.clientId, seller_id: o.sellerId, service_id: o.serviceId,
      wilaya_id: o.wilayaId, status: o.status, total_price: o.totalPrice,
      commission_amount: o.commissionAmount, payment_method: o.paymentMethod,
      payment_status: o.paymentStatus, notes: o.notes, created_at: o.createdAt,
      has_review: false,
    })),
    total: Number(total), page: pageNum, limit: limitNum,
  });
});

// POST /orders
router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const { service_id, payment_method, notes } = req.body;

  if (!service_id || !payment_method) {
    res.status(400).json({ error: "service_id et payment_method requis" });
    return;
  }

  const [svc] = await db.select().from(servicesTable).where(and(eq(servicesTable.id, Number(service_id)), eq(servicesTable.status, "approved")));
  if (!svc) { res.status(404).json({ error: "Service introuvable" }); return; }
  if (svc.sellerId === user.id) { res.status(400).json({ error: "Vous ne pouvez pas commander votre propre service" }); return; }

  // Commission 0% pour Marketing Digital
  const svcCategory = svc.categoryId ? await db.select().from(categoriesTable).where(eq(categoriesTable.id, svc.categoryId)).limit(1) : [];
  const categorySlug = svcCategory[0]?.slug ?? "";
  const commissionRate = ZERO_COMMISSION_SLUGS.includes(categorySlug) ? 0 : COMMISSION_RATE;
  const commissionAmount = svc.price * commissionRate;
  const [order] = await db.insert(ordersTable).values({
    clientId: user.id,
    serviceId: svc.id,
    sellerId: svc.sellerId,
    wilayaId: svc.wilayaId,
    totalPrice: svc.price,
    commissionAmount,
    paymentMethod: payment_method,
    notes: notes ?? null,
  }).returning();

  // Create escrow entry
  await db.insert(escrowTransactionsTable).values({
    orderId: order.id,
    amount: svc.price,
    commissionAmount,
    status: "held",
    heldAt: new Date().toISOString(),
  });

  // Notify seller
  await db.insert(notificationsTable).values({
    userId: svc.sellerId,
    type: "new_order",
    title: "Nouvelle commande reçue",
    body: `${user.name} a commandé votre service "${svc.titleFr}"`,
    link: `/orders/${order.id}`,
  });

  res.status(201).json({
    id: order.id, client_id: order.clientId, seller_id: order.sellerId,
    service_id: order.serviceId, status: order.status, total_price: order.totalPrice,
    commission_amount: order.commissionAmount, payment_method: order.paymentMethod,
    payment_status: order.paymentStatus, notes: order.notes, created_at: order.createdAt,
  });
});

// GET /orders/:id
router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Commande introuvable" }); return; }
  if (order.clientId !== user.id && order.sellerId !== user.id && user.role !== "admin") {
    res.status(403).json({ error: "Accès refusé" }); return;
  }
  res.json({
    id: order.id, client_id: order.clientId, seller_id: order.sellerId,
    service_id: order.serviceId, wilaya_id: order.wilayaId, status: order.status,
    total_price: order.totalPrice, commission_amount: order.commissionAmount,
    payment_method: order.paymentMethod, payment_status: order.paymentStatus,
    notes: order.notes, delivered_at: order.deliveredAt,
    cancellation_reason: order.cancellationReason, created_at: order.createdAt,
    has_review: false,
  });
});

// PATCH /orders/:id/status
router.patch("/orders/:id/status", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { status, cancellation_reason } = req.body;

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Commande introuvable" }); return; }

  const isSeller = order.sellerId === user.id;
  const isClient = order.clientId === user.id;
  const isAdmin = user.role === "admin";

  const updates: Record<string, unknown> = { status, updatedAt: new Date() };
  if (status === "delivered") updates.deliveredAt = new Date().toISOString();
  if (cancellation_reason) updates.cancellationReason = cancellation_reason;

  // When completed, release escrow to seller
  if (status === "completed" && isClient) {
    const netAmount = order.totalPrice - order.commissionAmount;
    const [wallet] = await db.select().from(sellerWalletsTable).where(eq(sellerWalletsTable.sellerId, order.sellerId));
    if (wallet) {
      await db.update(sellerWalletsTable).set({
        balance: wallet.balance + netAmount,
        totalEarned: wallet.totalEarned + netAmount,
      }).where(eq(sellerWalletsTable.sellerId, order.sellerId));
      await db.insert(walletTransactionsTable).values({
        walletId: wallet.id,
        type: "credit",
        amount: netAmount,
        referenceId: order.id,
        description: `Paiement commande #${order.id}`,
      });
    }
    await db.update(escrowTransactionsTable).set({ status: "released", releasedAt: new Date().toISOString() }).where(eq(escrowTransactionsTable.orderId, order.id));
    await db.insert(notificationsTable).values({
      userId: order.sellerId,
      type: "order_completed",
      title: "Commande complétée",
      body: `La commande #${order.id} a été confirmée. Paiement libéré!`,
      link: `/orders/${order.id}`,
    });
  }

  const [updated] = await db.update(ordersTable).set(updates).where(eq(ordersTable.id, id)).returning();
  res.json({ id: updated.id, status: updated.status, updated_at: updated.updatedAt });
});

export default router;

