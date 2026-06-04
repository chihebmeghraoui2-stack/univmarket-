import { Router, type IRouter } from "express";
import { eq, and, count, avg } from "drizzle-orm";
import { db, wilayasTable, usersTable, servicesTable, ordersTable } from "@workspace/db";

const router: IRouter = Router();

// GET /wilayas
router.get("/wilayas", async (req, res): Promise<void> => {
  const { pilot_only } = req.query;
  const conditions = pilot_only === "true" ? [eq(wilayasTable.isActive, true), eq(wilayasTable.isPilot, true)] : [eq(wilayasTable.isActive, true)];
  const wilayas = await db.select().from(wilayasTable).where(and(...conditions)).orderBy(wilayasTable.code);
  res.json(wilayas.map(w => ({
    id: w.id, code: w.code, name_fr: w.nameFr, name_ar: w.nameAr,
    region: w.region, is_pilot: w.isPilot, is_active: w.isActive,
  })));
});

// GET /wilayas/:id
router.get("/wilayas/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [w] = await db.select().from(wilayasTable).where(eq(wilayasTable.id, id));
  if (!w) { res.status(404).json({ error: "Wilaya introuvable" }); return; }
  res.json({ id: w.id, code: w.code, name_fr: w.nameFr, name_ar: w.nameAr, region: w.region, is_pilot: w.isPilot, is_active: w.isActive });
});

// GET /wilayas/:id/stats
router.get("/wilayas/:id/stats", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [activeServices] = await db.select({ count: count() }).from(servicesTable).where(and(eq(servicesTable.wilayaId, id), eq(servicesTable.status, "approved")));
  const [sellersCount] = await db.select({ count: count() }).from(usersTable).where(and(eq(usersTable.wilayaId, id), eq(usersTable.role, "seller")));
  const [totalOrders] = await db.select({ count: count() }).from(ordersTable).where(eq(ordersTable.wilayaId, id));
  res.json({
    wilaya_id: id,
    active_services: activeServices.count,
    sellers_count: sellersCount.count,
    total_orders: totalOrders.count,
    avg_rating: null,
    total_revenue: 0,
  });
});

export default router;
