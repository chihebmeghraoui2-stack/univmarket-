
// Migration: ajouter colonnes localisation si elles n'existent pas
import pg from "pg";
const { Pool: LocationPool } = pg;
const locationPool = new LocationPool({ connectionString: process.env.DATABASE_URL });
(async () => {
  try {
    await locationPool.query(`
      ALTER TABLE services ADD COLUMN IF NOT EXISTS location_lat REAL;
      ALTER TABLE services ADD COLUMN IF NOT EXISTS location_lng REAL;
      ALTER TABLE services ADD COLUMN IF NOT EXISTS location_address TEXT;
    `);
  } catch(e) { console.error("Migration location failed:", e); }
})();

import { Router, type IRouter } from "express";
import { eq, and, desc, asc, sql, ilike, gte, lte, inArray, count, avg, or } from "drizzle-orm";
import { db, servicesTable, usersTable, categoriesTable, wilayasTable, reviewsTable, wishlistsTable, sessionsTable } from "@workspace/db";
import { CreateServiceBody } from "@workspace/api-zod";
import { requireAuth, requireSeller } from "../middleware/auth";

const router: IRouter = Router();

function mapService(s: any, seller: any, category: any, wilaya: any, avgRating?: number | null, reviewsCount?: number) {
  return {
    id: s.id,
    seller_id: s.sellerId,
    seller_name: seller?.name ?? null,
    seller_avatar: seller?.avatar ?? null,
    seller_verified: seller?.verifiedAt != null,
    seller_trust_score: seller?.trustScore ?? null,
    category_id: s.categoryId,
    category_name_fr: category?.nameFr ?? null,
    wilaya_id: s.wilayaId,
    wilaya_name_fr: wilaya?.nameFr ?? null,
    title_fr: s.titleFr,
    title_ar: s.titleAr,
    description_fr: s.descriptionFr,
    description_ar: s.descriptionAr,
    price: s.price,
    price_type: s.priceType,
    images: s.images ?? [],
    status: s.status,
    delivery_days: s.deliveryDays,
    is_featured: s.isFeatured,
    views_count: s.viewsCount,
    clicks_count: s.clicksCount,
    location_lat: s.locationLat ?? null,
    location_lng: s.locationLng ?? null,
    location_address: s.locationAddress ?? null,
    avg_rating: avgRating ?? null,
    reviews_count: reviewsCount ?? 0,
    created_at: s.createdAt,
    rejection_reason: s.rejectionReason,
  };
}

// ─── Helper: expansion de mots-clés via Groq ─────────────────────────────────
async function expandQueryWithGroq(q: string): Promise<string[]> {
  const searchTerms: string[] = [q];
  if (!q || q.trim().length < 2) return searchTerms;
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return searchTerms;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 150,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: `Tu es un moteur de recherche semantique pour une plateforme de services universitaires algeriens.
Services: theses, memoires, PowerPoint, tutoring, dev web/mobile, traduction, correction, graphisme, analyse donnees, fiches revision, saisie donnees.
L'utilisateur peut ecrire en francais, arabe, darija ou avec des fautes.
Genere 5 a 8 mots-cles pertinents en francais pour la recherche donnee.
Reponds UNIQUEMENT avec les mots-cles separes par des virgules, sans explication.
Exemples:
- "memwar" → memoire, these, PFE, redaction, master
- "nul en maths" → tutoring, cours maths, professeur, mathematiques
- "presentation demain" → PowerPoint, presentation, urgent, slides`,
          },
          { role: "user", content: q },
        ],
      }),
    });

    if (groqRes.ok) {
      const groqData = await groqRes.json();
      const keywords = groqData.choices?.[0]?.message?.content?.trim() || "";
      const expanded = keywords
        .split(",")
        .map((k: string) => k.trim())
        .filter((k: string) => k.length >= 2);
      return [...new Set([q, ...expanded])];
    }
  } catch (e) {
    console.log("GROQ expansion failed:", e);
  }
  return searchTerms;
}

// ─── Helper: construire les conditions de recherche texte ─────────────────────
function buildSearchConditions(searchTerms: string[]) {
  if (searchTerms.length === 0) return null;
  const termConditions = searchTerms.slice(0, 2).flatMap(term => [
    ilike(servicesTable.titleFr, `%${term}%`),
    ilike(servicesTable.descriptionFr, `%${term}%`),
    ilike(servicesTable.titleAr, `%${term}%`),
  ]);
  return or(...termConditions);
}

// GET /services
router.get("/services", async (req, res): Promise<void> => {
  const { seller_id, wilaya_id, category_id, status = "approved", page = "1", limit = "20" } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = Math.min(parseInt(limit as string, 10), 50);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [
    status ? eq(servicesTable.status, status as string) : undefined,
    seller_id ? eq(servicesTable.sellerId, Number(seller_id)) : undefined,
    wilaya_id ? eq(servicesTable.wilayaId, Number(wilaya_id)) : undefined,
    category_id ? eq(servicesTable.categoryId, Number(category_id)) : undefined,
  ].filter(Boolean) as any[];

  const rows = await db
    .select({
      s: servicesTable,
      seller: { id: usersTable.id, name: usersTable.name, avatar: usersTable.avatar, verifiedAt: usersTable.verifiedAt, trustScore: usersTable.trustScore },
      category: { nameFr: categoriesTable.nameFr },
      wilaya: { nameFr: wilayasTable.nameFr },
    })
    .from(servicesTable)
    .leftJoin(usersTable, eq(servicesTable.sellerId, usersTable.id))
    .leftJoin(categoriesTable, eq(servicesTable.categoryId, categoriesTable.id))
    .leftJoin(wilayasTable, eq(servicesTable.wilayaId, wilayasTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(servicesTable.createdAt))
    .limit(limitNum)
    .offset(offset);

  const [{ total }] = await db.select({ total: count() }).from(servicesTable).where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json({
    data: rows.map(r => mapService(r.s, r.seller, r.category, r.wilaya)),
    total: Number(total),
    page: pageNum,
    limit: limitNum,
  });
});

// GET /services/featured
router.get("/services/featured", async (req, res): Promise<void> => {
  const limit = parseInt(req.query.limit as string ?? "8", 10);
  await db.update(servicesTable)
    .set({ isFeatured: false, featuredUntil: null })
    .where(and(
      eq(servicesTable.isFeatured, true),
      sql`featured_until IS NOT NULL AND featured_until::timestamp < NOW()`
    ));
  const rows = await db
    .select({ s: servicesTable, seller: usersTable, category: categoriesTable, wilaya: wilayasTable })
    .from(servicesTable)
    .leftJoin(usersTable, eq(servicesTable.sellerId, usersTable.id))
    .leftJoin(categoriesTable, eq(servicesTable.categoryId, categoriesTable.id))
    .leftJoin(wilayasTable, eq(servicesTable.wilayaId, wilayasTable.id))
    .where(and(eq(servicesTable.status, "approved"), eq(servicesTable.isFeatured, true)))
    .orderBy(desc(servicesTable.createdAt))
    .limit(limit);
  res.json(rows.map(r => mapService(r.s, r.seller, r.category, r.wilaya)));
});

// GET /services/trending
router.get("/services/trending", async (req, res): Promise<void> => {
  const limit = parseInt(req.query.limit as string ?? "8", 10);
  const result = await db.execute(sql`
    SELECT
      s.id, s.seller_id, s.title_fr, s.title_ar, s.description_fr, s.description_ar,
      s.price, s.price_type, s.images, s.status, s.delivery_days, s.is_featured,
      s.views_count, s.clicks_count, s.created_at,
      s.category_id, s.wilaya_id,
      u.name as seller_name, u.avatar as seller_avatar, u.verified_at as seller_verified_at, u.trust_score as seller_trust_score,
      c.name_fr as category_name_fr,
      w.name_fr as wilaya_name_fr
    FROM services s
    LEFT JOIN users u ON u.id = s.seller_id
    LEFT JOIN categories c ON c.id = s.category_id
    LEFT JOIN wilayas w ON w.id = s.wilaya_id
    INNER JOIN trending_requests tr ON tr.service_id = s.id AND tr.status = 'approved' AND (tr.expires_at IS NULL OR tr.expires_at > NOW())
    WHERE s.status = 'approved'
    ORDER BY tr.decided_at DESC
    LIMIT ${limit}
  `);
  const rows = (result as any).rows ?? result;
  res.json(rows.map((r: any) => ({
    id: r.id,
    seller_id: r.seller_id,
    seller_name: r.seller_name ?? null,
    seller_avatar: r.seller_avatar ?? null,
    seller_verified: r.seller_verified_at != null,
    seller_trust_score: r.seller_trust_score ?? null,
    category_id: r.category_id,
    category_name_fr: r.category_name_fr ?? null,
    wilaya_id: r.wilaya_id,
    wilaya_name_fr: r.wilaya_name_fr ?? null,
    title_fr: r.title_fr,
    title_ar: r.title_ar,
    description_fr: r.description_fr,
    description_ar: r.description_ar,
    price: r.price,
    price_type: r.price_type,
    images: r.images ?? [],
    status: r.status,
    delivery_days: r.delivery_days,
    is_featured: r.is_featured,
    views_count: r.views_count,
    clicks_count: r.clicks_count,
    created_at: r.created_at,
  })));
});

// GET /services/recent
router.get("/services/recent", async (req, res): Promise<void> => {
  const limit = parseInt(req.query.limit as string ?? "20", 10);
  const page = parseInt(req.query.page as string ?? "1", 10);
  const offset = (page - 1) * limit;
  const rows = await db
    .select({ s: servicesTable, seller: usersTable, category: categoriesTable, wilaya: wilayasTable })
    .from(servicesTable)
    .leftJoin(usersTable, eq(servicesTable.sellerId, usersTable.id))
    .leftJoin(categoriesTable, eq(servicesTable.categoryId, categoriesTable.id))
    .leftJoin(wilayasTable, eq(servicesTable.wilayaId, wilayasTable.id))
    .where(eq(servicesTable.status, "approved"))
    .orderBy(desc(servicesTable.createdAt))
    .limit(limit)
    .offset(offset);
  const [{ total }] = await db.select({ total: count() }).from(servicesTable).where(eq(servicesTable.status, "approved"));
  res.json({ data: rows.map(r => mapService(r.s, r.seller, r.category, r.wilaya)), total: Number(total), page, limit });
});

// GET /services/search  ← RECHERCHE ULTRA-INTELLIGENTE GROQ
router.get("/services/search", async (req, res): Promise<void> => {
  const {
    q, wilaya_id, category_id,
    sort = "relevance",
    min_price, max_price,
    min_rating, verified_only,
    page = "1", limit = "20",
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = Math.min(parseInt(limit as string, 10), 50);
  const offset = (pageNum - 1) * limitNum;

  const conditions: any[] = [eq(servicesTable.status, "approved")];

  // ── Expansion intelligente Groq ───────────────────────────────────────────
  if (q && String(q).trim().length >= 2) {
    const searchTerms = await expandQueryWithGroq(String(q));
    const searchCond = buildSearchConditions(searchTerms);
    if (searchCond) conditions.push(searchCond);
  }

  if (wilaya_id) conditions.push(eq(servicesTable.wilayaId, Number(wilaya_id)));
  if (category_id) conditions.push(eq(servicesTable.categoryId, Number(category_id)));
  if (min_price) conditions.push(gte(servicesTable.price, Number(min_price)));
  if (max_price) conditions.push(lte(servicesTable.price, Number(max_price)));
  if (verified_only === "true") conditions.push(sql`${usersTable.verifiedAt} IS NOT NULL`);

  let orderBy;
  switch (sort) {
    case "newest":       orderBy = desc(servicesTable.createdAt); break;
    case "price_asc":    orderBy = asc(servicesTable.price); break;
    case "price_desc":   orderBy = desc(servicesTable.price); break;
    case "most_popular": orderBy = desc(servicesTable.viewsCount); break;
    default:             orderBy = desc(servicesTable.createdAt);
  }

  const rows = await db
    .select({ s: servicesTable, seller: usersTable, category: categoriesTable, wilaya: wilayasTable })
    .from(servicesTable)
    .leftJoin(usersTable, eq(servicesTable.sellerId, usersTable.id))
    .leftJoin(categoriesTable, eq(servicesTable.categoryId, categoriesTable.id))
    .leftJoin(wilayasTable, eq(servicesTable.wilayaId, wilayasTable.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limitNum)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(servicesTable)
    .leftJoin(usersTable, eq(servicesTable.sellerId, usersTable.id))
    .where(and(...conditions));

  res.json({
    data: rows.map(r => mapService(r.s, r.seller, r.category, r.wilaya)),
    total: Number(total),
    page: pageNum,
    limit: limitNum,
    query: q ?? null,
    wilaya_id: wilaya_id ? Number(wilaya_id) : null,
  });
});

// GET /services/:id
router.get("/services/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [row] = await db
    .select({ s: servicesTable, seller: usersTable, category: categoriesTable, wilaya: wilayasTable })
    .from(servicesTable)
    .leftJoin(usersTable, eq(servicesTable.sellerId, usersTable.id))
    .leftJoin(categoriesTable, eq(servicesTable.categoryId, categoriesTable.id))
    .leftJoin(wilayasTable, eq(servicesTable.wilayaId, wilayasTable.id))
    .where(eq(servicesTable.id, id));

  if (!row) { res.status(404).json({ error: "Service introuvable" }); return; }

  await db.update(servicesTable).set({ viewsCount: sql`${servicesTable.viewsCount} + 1` }).where(eq(servicesTable.id, id));

  const [ratingRow] = await db.select({ avg: avg(reviewsTable.rating), count: count() }).from(reviewsTable).where(eq(reviewsTable.serviceId, id));

  res.json(mapService(row.s, row.seller, row.category, row.wilaya, ratingRow?.avg ? parseFloat(String(ratingRow.avg)) : null, Number(ratingRow?.count ?? 0)));
});

// POST /services
router.post("/services", requireSeller, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const parsed = CreateServiceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const d = parsed.data;
  const raw = req.body as any;
  const [svc] = await db.insert(servicesTable).values({
    sellerId: user.id,
    categoryId: d.category_id,
    wilayaId: d.wilaya_id ?? user.wilayaId,
    titleFr: d.title_fr,
    titleAr: d.title_ar ?? null,
    descriptionFr: d.description_fr ?? null,
    descriptionAr: d.description_ar ?? null,
    price: d.price,
    priceType: d.price_type ?? "fixed",
    images: d.images ?? [],
    deliveryDays: d.delivery_days ?? 3,
    locationLat: raw.location_lat != null ? parseFloat(raw.location_lat) : null,
    locationLng: raw.location_lng != null ? parseFloat(raw.location_lng) : null,
    locationAddress: raw.location_address ?? null,
  }).returning();
  res.status(201).json(mapService(svc, user, null, null));
});

// PATCH /services/:id
router.patch("/services/:id", requireSeller, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [svc] = await db.select().from(servicesTable).where(eq(servicesTable.id, id));
  if (!svc) { res.status(404).json({ error: "Service introuvable" }); return; }
  if (svc.sellerId !== user.id && user.role !== "admin") { res.status(403).json({ error: "Non autorisé" }); return; }

  const updates: Record<string, unknown> = {};
  const b = req.body;
  if (b.title_fr) updates.titleFr = b.title_fr;
  if (b.description_fr !== undefined) updates.descriptionFr = b.description_fr;
  if (b.price !== undefined) updates.price = b.price;
  if (b.price_type) updates.priceType = b.price_type;
  if (b.delivery_days !== undefined) updates.deliveryDays = b.delivery_days;
  if (b.images !== undefined) updates.images = b.images;
  updates.updatedAt = new Date();

  const [updated] = await db.update(servicesTable).set(updates).where(eq(servicesTable.id, id)).returning();
  res.json(mapService(updated, user, null, null));
});

// DELETE /services/:id
router.delete("/services/:id", requireSeller, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [svc] = await db.select().from(servicesTable).where(eq(servicesTable.id, id));
  if (!svc) { res.status(404).json({ error: "Service introuvable" }); return; }
  if (svc.sellerId !== user.id && user.role !== "admin") { res.status(403).json({ error: "Non autorisé" }); return; }
  await db.delete(servicesTable).where(eq(servicesTable.id, id));
  res.sendStatus(204);
});

// PATCH /admin/services/:id/featured
router.patch("/admin/services/:id/featured", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ error: "Non authentifie" }); return; }
  const token = authHeader.slice(7);
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  if (!session || new Date(session.expiresAt) < new Date()) { res.status(401).json({ error: "Session expiree" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user || user.role !== "admin") { res.status(403).json({ error: "Admin requis" }); return; }

  const id = parseInt(req.params.id, 10);
  const { is_featured } = req.body;
  if (typeof is_featured !== "boolean") { res.status(400).json({ error: "is_featured requis (boolean)" }); return; }

  const featuredUntil = is_featured
    ? new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
    : null;
  await db.update(servicesTable)
    .set({ isFeatured: is_featured, featuredUntil })
    .where(eq(servicesTable.id, id));
  res.json({ success: true, id, is_featured, featured_until: featuredUntil });
});

// GET /admin/services/all
router.get("/admin/services/all", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ error: "Non authentifie" }); return; }
  const token = authHeader.slice(7);
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  if (!session || new Date(session.expiresAt) < new Date()) { res.status(401).json({ error: "Session expiree" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user || user.role !== "admin") { res.status(403).json({ error: "Admin requis" }); return; }

  const limit = Math.min(parseInt(req.query.limit as string ?? "100", 10), 200);
  const q = req.query.q as string ?? "";

  const conditions: any[] = [eq(servicesTable.status, "approved")];

  if (q && q.trim().length >= 2) {
    const searchTerms = await expandQueryWithGroq(q);
    const searchCond = buildSearchConditions(searchTerms);
    if (searchCond) conditions.push(searchCond);
  }

  const rows = await db
    .select({ s: servicesTable, seller: usersTable, category: categoriesTable, wilaya: wilayasTable })
    .from(servicesTable)
    .leftJoin(usersTable, eq(servicesTable.sellerId, usersTable.id))
    .leftJoin(categoriesTable, eq(servicesTable.categoryId, categoriesTable.id))
    .leftJoin(wilayasTable, eq(servicesTable.wilayaId, wilayasTable.id))
    .where(and(...conditions))
    .orderBy(desc(servicesTable.isFeatured), desc(servicesTable.createdAt))
    .limit(limit);

  res.json(rows.map(r => mapService(r.s, r.seller, r.category, r.wilaya)));
});


// PATCH /admin/services/:id/location  (admin - ajouter localisation a un service existant)
router.patch("/admin/services/:id/location", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ error: "Non authentifie" }); return; }
  const token = authHeader.slice(7);
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  if (!session || new Date(session.expiresAt) < new Date()) { res.status(401).json({ error: "Session expiree" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user || user.role !== "admin") { res.status(403).json({ error: "Admin requis" }); return; }
  const id = parseInt(req.params.id, 10);
  const { location_lat, location_lng, location_address } = req.body;
  await db.update(servicesTable).set({
    locationLat: location_lat ?? null,
    locationLng: location_lng ?? null,
    locationAddress: location_address ?? null,
  }).where(eq(servicesTable.id, id));
  res.json({ success: true, id, location_lat, location_lng, location_address });
});

export default router;
