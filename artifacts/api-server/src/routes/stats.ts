import { Router, type IRouter } from "express";
import { eq, and, count, avg, sql, desc } from "drizzle-orm";
import { db, usersTable, servicesTable, ordersTable, reviewsTable, wilayasTable, sellerWalletsTable, disputesTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

// GET /stats/platform
router.get("/stats/platform", async (_req, res): Promise<void> => {
  const [totalUsers] = await db.select({ count: count() }).from(usersTable);
  const [activeSellers] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "seller"));
  const [totalServices] = await db.select({ count: count() }).from(servicesTable).where(eq(servicesTable.status, "approved"));
  const [totalOrders] = await db.select({ count: count() }).from(ordersTable);
  const [completedOrders] = await db.select({ count: count() }).from(ordersTable).where(eq(ordersTable.status, "completed"));
  const [wilayasCovered] = await db.select({ count: count() }).from(wilayasTable).where(eq(wilayasTable.isActive, true));

  res.json({
    total_users: Number(totalUsers.count),
    active_sellers: Number(activeSellers.count),
    total_services: Number(totalServices.count),
    total_orders: Number(totalOrders.count),
    orders_completed: Number(completedOrders.count),
    wilayas_covered: Number(wilayasCovered.count),
    gmv_total: 0,
  });
});

// GET /stats/seller
router.get("/stats/seller", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  if (user.role !== "seller" && user.role !== "admin") {
    res.status(403).json({ error: "Accès vendeur requis" }); return;
  }
  const [totalOrders] = await db.select({ count: count() }).from(ordersTable).where(eq(ordersTable.sellerId, user.id));
  const [completedOrders] = await db.select({ count: count() }).from(ordersTable).where(and(eq(ordersTable.sellerId, user.id), eq(ordersTable.status, "completed")));
  const [ratingRow] = await db.select({ avgVal: avg(reviewsTable.rating) }).from(reviewsTable).where(eq(reviewsTable.sellerId, user.id));
  const [viewsRow] = await db.select({ total: sql<number>`COALESCE(SUM(${servicesTable.viewsCount}), 0)` }).from(servicesTable).where(eq(servicesTable.sellerId, user.id));
  const [totalRevenue] = await db.select({ total: sql<number>`COALESCE(SUM(${ordersTable.totalPrice}), 0)` }).from(ordersTable).where(and(eq(ordersTable.sellerId, user.id), eq(ordersTable.status, "completed")));

  const allOrders = await db.select().from(ordersTable)
    .where(eq(ordersTable.sellerId, user.id));

  const revenueChart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (6 - i));
    const monthKey = d.getMonth();
    const yearKey = d.getFullYear();
    const value = allOrders
      .filter(o => o.status === "completed" && new Date(o.createdAt).getMonth() === monthKey && new Date(o.createdAt).getFullYear() === yearKey)
      .reduce((sum, o) => sum + (Number(o.totalPrice) - Number(o.commissionAmount)), 0);
    return { label: d.toLocaleString("fr-DZ", { month: "short" }), value };
  });

  const ordersChart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (6 - i));
    const monthKey = d.getMonth();
    const yearKey = d.getFullYear();
    const value = allOrders
      .filter(o => new Date(o.createdAt).getMonth() === monthKey && new Date(o.createdAt).getFullYear() === yearKey)
      .length;
    return { label: d.toLocaleString("fr-DZ", { month: "short" }), value };
  });

  res.json({
    total_orders: Number(totalOrders.count),
    completed_orders: Number(completedOrders.count),
    avg_rating: ratingRow?.avgVal ? parseFloat(String(ratingRow.avgVal)) : null,
    total_views: Number(viewsRow?.total ?? 0),
    revenue_total: Number(totalRevenue?.total ?? 0),
    revenue_chart: revenueChart,
    orders_chart: ordersChart,
    top_services: [],
  });
});

// GET /stats/leaderboard
router.get("/leaderboard", async (req, res): Promise<void> => {
  const limit = parseInt(req.query.limit as string ?? "20", 10);
  const wilayaId = req.query.wilaya_id ? Number(req.query.wilaya_id) : null;

  const sellers = await db
    .select({ u: usersTable, wilaya: { nameFr: wilayasTable.nameFr } })
    .from(usersTable)
    .leftJoin(wilayasTable, eq(usersTable.wilayaId, wilayasTable.id))
    .where(and(
      eq(usersTable.role, "seller"),
      wilayaId ? eq(usersTable.wilayaId, wilayaId) : undefined,
    ))
    .limit(limit * 3);

  const leaderboard = await Promise.all(sellers.map(async ({ u, wilaya }) => {
    const [revenue] = await db.select({ total: sql<number>`COALESCE(SUM(${ordersTable.totalPrice}), 0)` }).from(ordersTable).where(and(eq(ordersTable.sellerId, u.id), eq(ordersTable.status, "completed")));
    const [ordersCount] = await db.select({ cnt: count() }).from(ordersTable).where(and(eq(ordersTable.sellerId, u.id), eq(ordersTable.status, "completed")));
    const [rating] = await db.select({ avgVal: avg(reviewsTable.rating) }).from(reviewsTable).where(eq(reviewsTable.sellerId, u.id));
    return {
      seller_id: u.id, name: u.name, avatar: u.avatar, verified: u.verifiedAt != null,
      wilaya_name_fr: wilaya?.nameFr ?? null, trust_score: u.trustScore,
      total_revenue: Number(revenue?.total ?? 0),
      orders_count: Number(ordersCount?.cnt ?? 0),
      avg_rating: rating?.avgVal ? parseFloat(String(rating.avgVal)) : null,
      badges: [],
    };
  }));

  leaderboard.sort((a, b) => b.total_revenue - a.total_revenue);
  res.json(leaderboard.slice(0, limit));
});

router.post("/analytics/track", async (req, res) => {
  try {
    console.log("[Analytics Event]", req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Erreur" });
  }
});

export default router;

