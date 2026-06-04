import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, notificationsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

// Ajouter un avertissement
router.post("/warnings", requireAuth, async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    const currentWarnings = (user as any).warningsCount || 0;
    const newCount = currentWarnings + 1;

    await db.update(usersTable)
      .set({ warningsCount: newCount } as any)
      .where(eq(usersTable.id, userId));

    // Notifier le vendeur
    await db.insert(notificationsTable).values({
      userId,
      type: "warning",
      title: "Avertissement",
      body: `Votre message contenait des propos inappropries. Avertissement ${newCount}/5.`,
    });

    // Apres 5 avertissements notifier l admin
    if (newCount >= 5) {
      const admins = await db.select().from(usersTable).where(eq(usersTable.role, "admin"));
      for (const admin of admins) {
        await db.insert(notificationsTable).values({
          userId: admin.id,
          type: "admin_alert",
          title: "Alerte � Vendeur",
          body: `Le vendeur ${user.name} (ID: ${userId}) a recu 5 avertissements pour langage inapproprie.`,
          link: `/admin/users`,
        });
      }
    }

    res.json({ warnings: newCount });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Message global admin vers tous les vendeurs
router.post("/admin/broadcast", requireAdmin, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ error: "title et body requis" });

    const sellers = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, "seller"));

    for (const seller of sellers) {
      await db.insert(notificationsTable).values({
        userId: seller.id,
        type: "broadcast",
        title,
        body,
      });
    }

    res.json({ sent: sellers.length });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;

