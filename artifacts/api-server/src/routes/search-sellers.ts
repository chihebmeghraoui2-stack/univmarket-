import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, sellerProfilesTable } from "@workspace/db";
import { eq, or, ilike, and } from "drizzle-orm";

const router = Router();

router.get("/search", async (req, res) => {
  try {
    const { q, wilaya_id, category_id, sort, min_price, max_price, min_rating, verified_only, page = "1", limit = "20" } = req.query;
    const { db } = await import("@workspace/db");
    const { servicesTable, usersTable, categoriesTable, wilayasTable } = await import("@workspace/db");
    const { eq, and, or, ilike, gte, lte, desc, asc, count } = await import("drizzle-orm");

    const conditions: any[] = [eq(servicesTable.status, "approved")];
    if (q) conditions.push(or(ilike(servicesTable.titleFr, `%${q}%`), ilike(servicesTable.descriptionFr, `%${q}%`), ilike(usersTable.name, `%${q}%`)));
    if (wilaya_id && wilaya_id !== "all") conditions.push(eq(servicesTable.wilayaId, Number(wilaya_id)));
    if (category_id && category_id !== "all") conditions.push(eq(servicesTable.categoryId, Number(category_id)));
    if (min_price) conditions.push(gte(servicesTable.price, Number(min_price)));
    if (max_price) conditions.push(lte(servicesTable.price, Number(max_price)));

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 50);
    const offset = (pageNum - 1) * limitNum;

    const rows = await db.select({
      s: servicesTable,
      seller: { name: usersTable.name, avatar: usersTable.avatar, verifiedAt: usersTable.verifiedAt },
      category: { nameFr: categoriesTable.nameFr },
      wilaya: { nameFr: wilayasTable.nameFr },
    })
    .from(servicesTable)
    .leftJoin(usersTable, eq(servicesTable.sellerId, usersTable.id))
    .leftJoin(categoriesTable, eq(servicesTable.categoryId, categoriesTable.id))
    .leftJoin(wilayasTable, eq(servicesTable.wilayaId, wilayasTable.id))
    .where(and(...conditions))
    .orderBy(sort === "price_asc" ? asc(servicesTable.price) : sort === "price_desc" ? desc(servicesTable.price) : desc(servicesTable.createdAt))
    .limit(limitNum).offset(offset);

    const [{ total }] = await db.select({ total: count() }).from(servicesTable).leftJoin(usersTable, eq(servicesTable.sellerId, usersTable.id)).where(and(...conditions));

    return res.json({
      data: rows.map(r => ({
        id: r.s.id,
        title_fr: r.s.titleFr,
        description_fr: r.s.descriptionFr,
        price: r.s.price,
        price_type: r.s.priceType,
        images: r.s.images,
        seller_id: r.s.sellerId,
        seller_name: r.seller?.name,
        seller_avatar: r.seller?.avatar,
        seller_verified: !!r.seller?.verifiedAt,
        category_name_fr: r.category?.nameFr,
        wilaya_name_fr: r.wilaya?.nameFr,
        created_at: r.s.createdAt,
      })),
      total: Number(total), page: pageNum, limit: limitNum,
    });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/sellers/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || String(q).trim().length < 2) {
      return res.json([]);
    }
    const query = `%${String(q).trim()}%`;
    const sellers = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        avatar: usersTable.avatar,
        bio: usersTable.bio,
        wilayaId: usersTable.wilayaId,
        verifiedAt: usersTable.verifiedAt,
        trustScore: usersTable.trustScore,
      })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.role, "seller"),
          or(
            ilike(usersTable.name, query),
            ilike(usersTable.email, query)
          )
        )
      )
      .limit(20);

    res.json(sellers.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      avatar: s.avatar,
      bio: s.bio,
      wilaya_id: s.wilayaId,
      verified: !!s.verifiedAt,
      trust_score: s.trustScore,
    })));
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;

