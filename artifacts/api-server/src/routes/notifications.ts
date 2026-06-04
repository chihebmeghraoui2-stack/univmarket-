import { Router, type IRouter } from "express";
import { eq, and, desc, count } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

// GET /notifications
router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const page = parseInt(req.query.page as string ?? "1", 10);
  const limit = Math.min(parseInt(req.query.limit as string ?? "20", 10), 50);
  const offset = (page - 1) * limit;
  const unreadOnly = req.query.unread_only === "true";

  const conditions: any[] = [eq(notificationsTable.userId, user.id)];
  if (unreadOnly) conditions.push(eq(notificationsTable.isRead, false));

  const rows = await db.select().from(notificationsTable).where(and(...conditions)).orderBy(desc(notificationsTable.createdAt)).limit(limit).offset(offset);
  const [{ total }] = await db.select({ total: count() }).from(notificationsTable).where(and(...conditions));
  const [{ unread_count }] = await db.select({ unread_count: count() }).from(notificationsTable).where(and(eq(notificationsTable.userId, user.id), eq(notificationsTable.isRead, false)));

  res.json({
    data: rows.map(n => ({
      id: n.id, type: n.type, title: n.title, body: n.body, link: n.link,
      is_read: n.isRead, created_at: n.createdAt,
    })),
    total: Number(total), page, limit,
    unread_count: Number(unread_count),
  });
});

// PATCH /notifications/:id/read
router.post("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.update(notificationsTable).set({ isRead: true }).where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, user.id)));
  res.json({ success: true });
});


// DELETE /notifications/:id — supprimer une notification (si lue)
router.delete("/notifications/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user?.id;
  const id = parseInt(req.params.id, 10);
  const [notif] = await db.select().from(notificationsTable).where(eq(notificationsTable.id, id));
  if (!notif || notif.userId !== userId) { res.status(404).json({ error: "Introuvable" }); return; }
  if (!notif.isRead) { res.status(400).json({ error: "Marquez la notification comme lue avant de la supprimer" }); return; }
  await db.delete(notificationsTable).where(eq(notificationsTable.id, id));
  res.json({ success: true });
});

// DELETE /notifications — supprimer toutes les notifications lues
router.delete("/notifications", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user?.id;
  await db.delete(notificationsTable).where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, true)));
  res.json({ success: true });
});

export default router;

