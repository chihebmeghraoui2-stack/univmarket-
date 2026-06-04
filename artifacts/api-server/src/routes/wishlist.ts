import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, wishlistsTable, servicesTable, usersTable, categoriesTable, wilayasTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

// GET /wishlist
router.get("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const rows = await db
    .select({
      w: wishlistsTable,
      s: servicesTable,
      seller: { name: usersTable.name, avatar: usersTable.avatar, verifiedAt: usersTable.verifiedAt },
      category: { nameFr: categoriesTable.nameFr },
      wilaya: { nameFr: wilayasTable.nameFr },
    })
    .from(wishlistsTable)
    .leftJoin(servicesTable, eq(wishlistsTable.serviceId, servicesTable.id))
    .leftJoin(usersTable, eq(servicesTable.sellerId, usersTable.id))
    .leftJoin(categoriesTable, eq(servicesTable.categoryId, categoriesTable.id))
    .leftJoin(wilayasTable, eq(servicesTable.wilayaId, wilayasTable.id))
    .where(eq(wishlistsTable.userId, user.id));

  res.json(rows.map(r => ({
    id: r.s.id, title_fr: r.s.titleFr, price: r.s.price, price_type: r.s.priceType,
    delivery_days: r.s.deliveryDays, seller_name: r.seller.name, seller_avatar: r.seller.avatar,
    seller_verified: r.seller.verifiedAt != null, wilaya_name_fr: r.wilaya.nameFr,
    category_name_fr: r.category.nameFr, images: r.s.images ?? [], added_at: r.w.addedAt,
  })));
});

// POST /wishlist/:serviceId
router.post("/wishlist/:serviceId", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const serviceId = parseInt(Array.isArray(req.params.serviceId) ? req.params.serviceId[0] : req.params.serviceId, 10);
  const existing = await db.select().from(wishlistsTable).where(and(eq(wishlistsTable.userId, user.id), eq(wishlistsTable.serviceId, serviceId)));
  if (existing.length > 0) { res.status(200).json({ success: true }); return; }
  await db.insert(wishlistsTable).values({ userId: user.id, serviceId });
  res.status(201).json({ success: true });
});

// DELETE /wishlist/:serviceId
router.delete("/wishlist/:serviceId", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const serviceId = parseInt(Array.isArray(req.params.serviceId) ? req.params.serviceId[0] : req.params.serviceId, 10);
  await db.delete(wishlistsTable).where(and(eq(wishlistsTable.userId, user.id), eq(wishlistsTable.serviceId, serviceId)));
  res.sendStatus(204);
});

export default router;

