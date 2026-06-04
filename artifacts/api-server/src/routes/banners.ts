import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, bannersTable } from "@workspace/db";
import { requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

router.get("/api/banners", async (req, res): Promise<void> => {
  try {
    const { wilaya_id, active } = req.query;
    const conditions: any[] = [];
    if (wilaya_id) conditions.push(eq(bannersTable.wilayaId, Number(wilaya_id)));
    if (active === "true") conditions.push(eq(bannersTable.isActive, true));
    const banners = await db.select().from(bannersTable).where(and(...conditions)).orderBy(desc(bannersTable.position), desc(bannersTable.createdAt));
    res.json({ data: banners });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer les bannières" });
  }
});

router.post("/api/banners", requireAdmin, async (req, res): Promise<void> => {
  try {
    const { title, image, link, wilaya_id, position, is_active, starts_at, ends_at } = req.body;
    const [banner] = await db.insert(bannersTable).values({
      title,
      image,
      link: link ?? null,
      wilayaId: wilaya_id ?? null,
      position: position ?? 0,
      isActive: is_active ?? true,
      startsAt: starts_at ? new Date(starts_at).toISOString() : null,
      endsAt: ends_at ? new Date(ends_at).toISOString() : null,
    }).returning();
    res.status(201).json({ data: banner });
  } catch (error) {
    res.status(500).json({ error: "Impossible de créer la bannière" });
  }
});

router.put("/api/banners/:id", requireAdmin, async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { title, image, link, wilaya_id, position, is_active, starts_at, ends_at } = req.body;
    const [updated] = await db.update(bannersTable).set({
      title,
      image,
      link: link ?? null,
      wilayaId: wilaya_id ?? null,
      position: position ?? 0,
      isActive: is_active ?? true,
      startsAt: starts_at ? new Date(starts_at).toISOString() : null,
      endsAt: ends_at ? new Date(ends_at).toISOString() : null,
    }).where(eq(bannersTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "Bannière introuvable" });
      return;
    }
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: "Impossible de mettre à jour la bannière" });
  }
});

router.delete("/api/banners/:id", requireAdmin, async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await db.delete(bannersTable).where(eq(bannersTable.id, id));
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: "Impossible de supprimer la bannière" });
  }
});

router.post("/api/banners/:id/click", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    await db.update(bannersTable).set({ clickCount: bannersTable.clickCount.add(1) as any }).where(eq(bannersTable.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Impossible d'enregistrer le clic" });
  }
});

export default router;
