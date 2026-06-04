import { Router, type IRouter } from "express";
import { createHash } from "crypto";
import { eq, desc } from "drizzle-orm";
import { db, apiKeysTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

router.get("/api/api-keys", requireAuth, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const keys = await db.select().from(apiKeysTable).where(eq(apiKeysTable.userId, user.id)).orderBy(desc(apiKeysTable.createdAt));
    res.json({ data: keys });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer les clés API" });
  }
});

router.post("/api/api-keys", requireAuth, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const { name, permissions, rate_limit, expires_at } = req.body;
    if (!name) {
      res.status(400).json({ error: "name requis" });
      return;
    }
    const rawKey = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    const [key] = await db.insert(apiKeysTable).values({
      userId: user.id,
      name,
      keyHash,
      permissions: Array.isArray(permissions) ? permissions : [],
      rateLimit: rate_limit ?? 1000,
      expiresAt: expires_at ? new Date(expires_at).toISOString() : null,
      isActive: true,
    }).returning();
    res.status(201).json({ data: { ...key, key: rawKey } });
  } catch (error) {
    res.status(500).json({ error: "Impossible de générer la clé API" });
  }
});

router.delete("/api/api-keys/:id", requireAuth, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const id = Number(req.params.id);
    const [key] = await db.select().from(apiKeysTable).where(eq(apiKeysTable.id, id));
    if (!key || key.userId !== user.id) {
      res.status(404).json({ error: "Clé API introuvable" });
      return;
    }
    await db.delete(apiKeysTable).where(eq(apiKeysTable.id, id));
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: "Impossible de supprimer la clé API" });
  }
});

router.put("/api/api-keys/:id/revoke", requireAuth, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const id = Number(req.params.id);
    const [key] = await db.update(apiKeysTable).set({ isActive: false }).where(eq(apiKeysTable.id, id)).returning();
    if (!key || key.userId !== user.id) {
      res.status(404).json({ error: "Clé API introuvable" });
      return;
    }
    res.json({ data: key });
  } catch (error) {
    res.status(500).json({ error: "Impossible de révoquer la clé API" });
  }
});

export default router;

