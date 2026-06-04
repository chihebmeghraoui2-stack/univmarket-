import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, couponsTable } from "@workspace/db";
import { requireAuth, requireSeller } from "../middleware/auth";

const router: IRouter = Router();

// GET /coupons
router.get("/coupons", requireSeller, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const coupons = await db.select().from(couponsTable).where(eq(couponsTable.sellerId, user.id));
  res.json(coupons.map(c => ({
    id: c.id, code: c.code, discount_type: c.discountType, discount_value: c.discountValue,
    usage_limit: c.usageLimit, used_count: c.usedCount, expires_at: c.expiresAt, is_active: c.isActive,
  })));
});

// POST /coupons
router.post("/coupons", requireSeller, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const { code, discount_type, discount_value, usage_limit, expires_at } = req.body;
  if (!code || !discount_type || discount_value == null) {
    res.status(400).json({ error: "code, discount_type, discount_value requis" }); return;
  }
  const [coupon] = await db.insert(couponsTable).values({
    sellerId: user.id, code, discountType: discount_type,
    discountValue: Number(discount_value), usageLimit: usage_limit ?? null,
    expiresAt: expires_at ?? null,
  }).returning();
  res.status(201).json({ id: coupon.id, code: coupon.code, discount_type: coupon.discountType, discount_value: coupon.discountValue });
});

// POST /coupons/validate
router.post("/coupons/validate", requireAuth, async (req, res): Promise<void> => {
  const { code } = req.body;
  if (!code) { res.status(400).json({ error: "Code requis" }); return; }
  const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, code.toUpperCase()));
  if (!coupon || !coupon.isActive) {
    res.status(404).json({ error: "Coupon invalide ou expiré" }); return;
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    res.status(400).json({ error: "Coupon épuisé" }); return;
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    res.status(400).json({ error: "Coupon expiré" }); return;
  }
  res.json({
    valid: true, discount_type: coupon.discountType, discount_value: coupon.discountValue,
    code: coupon.code,
  });
});

export default router;

