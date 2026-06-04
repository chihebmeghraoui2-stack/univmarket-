import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, webhookEndpointsTable } from "@workspace/db";
import { requireSeller } from "../middleware/auth";

const router: IRouter = Router();

router.get("/api/webhooks", requireSeller, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const endpoints = await db.select().from(webhookEndpointsTable).where(eq(webhookEndpointsTable.userId, user.id)).orderBy(desc(webhookEndpointsTable.createdAt));
    res.json({ data: endpoints });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer les webhooks" });
  }
});

router.post("/api/webhooks", requireSeller, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const { url, events, secret, is_active } = req.body;
    if (!url || !Array.isArray(events) || !secret) {
      res.status(400).json({ error: "url, events et secret requis" });
      return;
    }
    const [endpoint] = await db.insert(webhookEndpointsTable).values({
      userId: user.id,
      url,
      events,
      secret,
      isActive: is_active ?? true,
    }).returning();
    res.status(201).json({ data: endpoint });
  } catch (error) {
    res.status(500).json({ error: "Impossible de créer le webhook" });
  }
});

router.delete("/api/webhooks/:id", requireSeller, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const id = Number(req.params.id);
    const [endpoint] = await db.select().from(webhookEndpointsTable).where(eq(webhookEndpointsTable.id, id));
    if (!endpoint || endpoint.userId !== user.id) {
      res.status(404).json({ error: "Webhook introuvable" });
      return;
    }
    await db.delete(webhookEndpointsTable).where(eq(webhookEndpointsTable.id, id));
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: "Impossible de supprimer le webhook" });
  }
});

router.get("/api/webhooks/logs", requireSeller, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const endpoints = await db.select().from(webhookEndpointsTable).where(eq(webhookEndpointsTable.userId, user.id)).orderBy(desc(webhookEndpointsTable.updatedAt));
    res.json({ data: endpoints });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer les logs de webhooks" });
  }
});

export default router;

