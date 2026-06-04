﻿import { Router } from "express";
import { db } from "@workspace/db";
import { affiliationsTable, affiliationEarningsTable, usersTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Mon r�seau d affiliation
router.get("/api/affiliations/my-network", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const network = await db.select().from(affiliationsTable)
      .where(eq(affiliationsTable.referrerId, userId));

    const withUsers = await Promise.all(network.map(async (aff) => {
      const [user] = await db.select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        createdAt: usersTable.createdAt,
      }).from(usersTable).where(eq(usersTable.id, aff.userId));
      return { ...aff, user };
    }));

    const totalEarned = network.reduce((sum, a) => sum + parseFloat(a.totalEarned || "0"), 0);
    res.json({ network: withUsers, totalEarned, count: network.length });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Gains affiliation
router.get("/api/affiliations/earnings", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const affiliations = await db.select().from(affiliationsTable)
      .where(eq(affiliationsTable.referrerId, userId));
    const ids = affiliations.map(a => a.id);

    if (!ids.length) return res.json({ earnings: [], total: 0 });

    const earnings = await db.select().from(affiliationEarningsTable)
      .where(eq(affiliationEarningsTable.affiliationId, ids[0]));

    const total = earnings.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    res.json({ earnings, total });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Cr�er lien affiliation lors inscription
router.post("/api/affiliations/register", async (req, res) => {
  try {
    const { newUserId, referralCode } = req.body;
    if (!referralCode) return res.json({ ok: true });

    const [referrer] = await db.select().from(usersTable)
      .where(eq(usersTable.referralCode, referralCode));
    if (!referrer) return res.json({ ok: true });

    // Niveau 1
    await db.insert(affiliationsTable).values({
      userId: newUserId, referrerId: referrer.id,
      level: 1, commissionRate: "5.00"
    }).onConflictDoNothing();

    // Niveau 2 � parrain du parrain
    const [lvl2] = await db.select().from(affiliationsTable)
      .where(and(eq(affiliationsTable.userId, referrer.id), eq(affiliationsTable.level, 1)));
    if (lvl2) {
      await db.insert(affiliationsTable).values({
        userId: newUserId, referrerId: lvl2.referrerId,
        level: 2, commissionRate: "2.00"
      }).onConflictDoNothing();

      // Niveau 3
      const [lvl3] = await db.select().from(affiliationsTable)
        .where(and(eq(affiliationsTable.userId, lvl2.referrerId), eq(affiliationsTable.level, 1)));
      if (lvl3) {
        await db.insert(affiliationsTable).values({
          userId: newUserId, referrerId: lvl3.referrerId,
          level: 3, commissionRate: "1.00"
        }).onConflictDoNothing();
      }
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;


