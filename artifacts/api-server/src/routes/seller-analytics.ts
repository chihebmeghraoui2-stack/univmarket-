import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, servicesTable } from "@workspace/db/schema";
import { eq, gte, and, sql, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
const router = Router();

router.get("/seller/analytics/overview", requireAuth, async (req, res) => {
  try {
    const sellerId = (req as any).user.id;
    const { period = "monthly" } = req.query;

    const months = period === "weekly" ? 1 : period === "yearly" ? 12 : 7;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const orders = await db.select().from(ordersTable)
      .where(and(
        eq(ordersTable.sellerId, sellerId),
        gte(ordersTable.createdAt, startDate)
      ));

    const totalRevenue = orders.filter(o => o.status === "completed")
      .reduce((sum, o) => sum + (Number(o.totalPrice) - Number(o.commissionAmount)), 0);
    const totalOrders = orders.length;

    // Grouper par mois pour les graphiques
    const revenueByMonth: Record<string, number> = {};
    const ordersByMonth: Record<string, number> = {};

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString("fr-DZ", { month: "short", year: "numeric" });
      revenueByMonth[key] = 0;
      ordersByMonth[key] = 0;
    }

    orders.forEach(o => {
      const d = new Date(o.createdAt);
      const key = d.toLocaleString("fr-DZ", { month: "short", year: "numeric" });
      if (key in revenueByMonth) {
        if (o.status === "completed") {
          revenueByMonth[key] += Number(o.totalPrice) - Number(o.commissionAmount);
        }
        ordersByMonth[key] = (ordersByMonth[key] || 0) + 1;
      }
    });

    const revenueChart = Object.entries(revenueByMonth).map(([label, value]) => ({ label, value }));
    const ordersChart = Object.entries(ordersByMonth).map(([label, value]) => ({ label, value }));

    const services = await db.select().from(servicesTable).where(eq(servicesTable.sellerId, sellerId));
    const totalViews = services.reduce((sum, s) => sum + (s.viewsCount || 0), 0);
    const avgRating = null;

    res.json({
      totals: { orders: totalOrders, revenue: totalRevenue, views: totalViews },
      revenue_chart: revenueChart,
      orders_chart: ordersChart,
      avg_rating: avgRating,
    });
  } catch (e) {
    console.log("analytics error:", e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/seller/analytics/top-services", requireAuth, async (req, res) => {
  try {
    const sellerId = (req as any).user.id;
    const services = await db.select().from(servicesTable).where(eq(servicesTable.sellerId, sellerId));
    const sorted = services.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0)).slice(0, 5);
    res.json(sorted);
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
