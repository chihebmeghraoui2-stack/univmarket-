import { Router } from "express";
import { db } from "@workspace/db";
import { sellerProfilesTable, usersTable, servicesTable } from "@workspace/db";
import { eq, or, ilike, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Recherche vendeurs
router.get("/sellers/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) return res.json([]);
    const sellers = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      avatar: usersTable.avatar,
      bio: usersTable.bio,
      wilayaId: usersTable.wilayaId,
      verifiedAt: usersTable.verifiedAt,
      trustScore: usersTable.trustScore,
    }).from(usersTable)
      .where(and(
        eq(usersTable.role, "seller"),
        or(ilike(usersTable.name, `%${q}%`), ilike(usersTable.bio, `%${q}%`))
      ))
      .limit(20);
    res.json(sellers.map(s => ({
      id: s.id, name: s.name, avatar: s.avatar, bio: s.bio,
      wilaya_id: s.wilayaId, verified: !!s.verifiedAt, trust_score: s.trustScore,
    })));
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Profil vendeur public
router.get("/sellers/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) { res.status(404).json({ error: "Vendeur introuvable" }); return; }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) return res.status(404).json({ error: "Vendeur introuvable" });

    const [profile] = await db.select().from(sellerProfilesTable)
      .where(eq(sellerProfilesTable.userId, userId));

    const { password, ...safeUser } = user as any;
    res.json({ ...safeUser, profile: profile || null });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Mettre  jour le profil vendeur
router.put("/sellers/profile", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { bio, skills, availableDays, availableHours } = req.body;

    const [existing] = await db.select().from(sellerProfilesTable)
      .where(eq(sellerProfilesTable.userId, userId));

    if (existing) {
      const [updated] = await db.update(sellerProfilesTable)
        .set({ bio, skills, availableDays, availableHours, updatedAt: new Date() })
        .where(eq(sellerProfilesTable.userId, userId))
        .returning();
      res.json(updated);
    } else {
      const [created] = await db.insert(sellerProfilesTable)
        .values({ userId, bio, skills, availableDays, availableHours })
        .returning();
      res.json(created);
    }
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;

