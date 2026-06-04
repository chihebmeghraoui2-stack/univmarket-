import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, servicesTable, reviewsTable, wilayasTable } from "@workspace/db";
import { count, avg } from "drizzle-orm";

const router: IRouter = Router();

// GET /users/:id
router.get("/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [row] = await db
    .select({ u: usersTable, wilaya: { nameFr: wilayasTable.nameFr } })
    .from(usersTable)
    .leftJoin(wilayasTable, eq(usersTable.wilayaId, wilayasTable.id))
    .where(eq(usersTable.id, id));

  if (!row) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }

  const [serviceCount] = await db.select({ count: count() }).from(servicesTable).where(eq(servicesTable.sellerId, id));
  const [ratingRow] = await db.select({ avg: avg(reviewsTable.rating), count: count() }).from(reviewsTable).where(eq(reviewsTable.sellerId, id));

  res.json({
    id: row.u.id, name: row.u.name, email: row.u.email, role: row.u.role,
    wilaya_id: row.u.wilayaId, wilaya_name_fr: row.wilaya?.nameFr ?? null,
    avatar: row.u.avatar, bio: row.u.bio, phone: row.u.phone,
    verified_at: row.u.verifiedAt, trust_score: row.u.trustScore,
    language_preference: row.u.languagePreference, created_at: row.u.createdAt,
    services_count: Number(serviceCount.count),
    avg_rating: ratingRow?.avg ? parseFloat(String(ratingRow.avg)) : null,
    reviews_count: Number(ratingRow?.count ?? 0),
    badges: [],
  });
});

export default router;

