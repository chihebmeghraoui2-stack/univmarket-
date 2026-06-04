import { Router, type IRouter } from "express";
import { eq, and, desc, count, avg } from "drizzle-orm";
import { db, reviewsTable, ordersTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

// GET /reviews/list
router.get("/reviews/list", async (req, res): Promise<void> => {
  const { service_id, seller_id, page = "1", limit = "10" } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = Math.min(parseInt(limit as string, 10), 50);
  const offset = (pageNum - 1) * limitNum;

  const conditions: any[] = [];
  if (service_id) conditions.push(eq(reviewsTable.serviceId, Number(service_id)));
  if (seller_id) conditions.push(eq(reviewsTable.sellerId, Number(seller_id)));

  const rows = await db
    .select({ r: reviewsTable, client: { name: usersTable.name, avatar: usersTable.avatar } })
    .from(reviewsTable)
    .leftJoin(usersTable, eq(reviewsTable.clientId, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(reviewsTable.createdAt))
    .limit(limitNum).offset(offset);

  const [{ total }] = await db.select({ total: count() }).from(reviewsTable).where(conditions.length > 0 ? and(...conditions) : undefined);
  const [ratingRow] = conditions.length > 0
    ? await db.select({ avg: avg(reviewsTable.rating) }).from(reviewsTable).where(and(...conditions))
    : [{ avg: null }];

  res.json({
    data: rows.map(r => ({
      id: r.r.id, order_id: r.r.orderId, client_id: r.r.clientId,
      client_name: r.client.name, client_avatar: r.client.avatar,
      seller_id: r.r.sellerId, service_id: r.r.serviceId,
      rating: r.r.rating, body: r.r.body,
      seller_reply: r.r.sellerReply, reply_at: r.r.replyAt,
      created_at: r.r.createdAt,
    })),
    total: Number(total), page: pageNum, limit: limitNum,
    avg_rating: ratingRow?.avg ? parseFloat(String(ratingRow.avg)) : null,
  });
});

// POST /reviews
router.post("/reviews", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const { order_id, rating, body } = req.body;
  if (!order_id || !rating) { res.status(400).json({ error: "order_id et rating requis" }); return; }

  const [order] = await db.select().from(ordersTable).where(and(eq(ordersTable.id, Number(order_id)), eq(ordersTable.clientId, user.id), eq(ordersTable.status, "completed")));
  if (!order) { res.status(400).json({ error: "Commande non éligible" }); return; }

  const [review] = await db.insert(reviewsTable).values({
    orderId: order.id, clientId: user.id, sellerId: order.sellerId,
    serviceId: order.serviceId, rating: Number(rating), body: body ?? null,
  }).returning();

  res.status(201).json({ id: review.id, rating: review.rating, body: review.body, created_at: review.createdAt });
});

// POST /reviews/:id/reply
router.post("/reviews/:id/reply", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { reply } = req.body;
  if (!reply) { res.status(400).json({ error: "Réponse requise" }); return; }

  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, id));
  if (!review) { res.status(404).json({ error: "Avis introuvable" }); return; }
  if (review.sellerId !== user.id && user.role !== "admin") { res.status(403).json({ error: "Non autorisé" }); return; }

  const [updated] = await db.update(reviewsTable).set({ sellerReply: reply, replyAt: new Date().toISOString() }).where(eq(reviewsTable.id, id)).returning();
  res.json({ id: updated.id, rating: updated.rating, seller_reply: updated.sellerReply });
});

export default router;
