import { Router, type IRouter } from "express";
import { eq, or, desc } from "drizzle-orm";
import { db, appointmentsTable, availabilitySlotsTable } from "@workspace/db";
import { requireAuth, requireSeller } from "../middleware/auth";

const router: IRouter = Router();

router.get("/api/appointments", requireAuth, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const appointments = await db.select().from(appointmentsTable).where(or(eq(appointmentsTable.clientId, user.id), eq(appointmentsTable.sellerId, user.id))).orderBy(desc(appointmentsTable.scheduledAt));
    res.json({ data: appointments });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer les rendez-vous" });
  }
});

router.post("/api/appointments", requireAuth, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const { seller_id, service_id, scheduled_at, duration_minutes, notes } = req.body;
    if (!seller_id || !service_id || !scheduled_at || !duration_minutes) {
      res.status(400).json({ error: "seller_id, service_id, scheduled_at et duration_minutes requis" });
      return;
    }
    const [appointment] = await db.insert(appointmentsTable).values({
      sellerId: Number(seller_id),
      clientId: user.id,
      serviceId: Number(service_id),
      scheduledAt: new Date(scheduled_at).toISOString(),
      durationMinutes: Number(duration_minutes),
      status: "pending",
      notes: notes ?? null,
    }).returning();
    res.status(201).json({ data: appointment });
  } catch (error) {
    res.status(500).json({ error: "Impossible de créer le rendez-vous" });
  }
});

router.put("/api/appointments/:id/status", requireAuth, async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: "status requis" });
      return;
    }
    const [updated] = await db.update(appointmentsTable).set({ status }).where(eq(appointmentsTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "Rendez-vous introuvable" });
      return;
    }
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: "Impossible de mettre à jour le rendez-vous" });
  }
});

router.get("/api/sellers/:id/availability", async (req, res): Promise<void> => {
  try {
    const sellerId = Number(req.params.id);
    const slots = await db.select().from(availabilitySlotsTable).where(eq(availabilitySlotsTable.sellerId, sellerId));
    res.json({ data: slots });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer la disponibilité" });
  }
});

router.put("/api/sellers/availability", requireSeller, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const { slots } = req.body;
    if (!Array.isArray(slots)) {
      res.status(400).json({ error: "slots requis" });
      return;
    }
    await db.delete(availabilitySlotsTable).where(eq(availabilitySlotsTable.sellerId, user.id));
    const inserted = await db.insert(availabilitySlotsTable).values(
      slots.map((slot: any) => ({
        sellerId: user.id,
        dayOfWeek: Number(slot.day_of_week),
        startTime: slot.start_time,
        endTime: slot.end_time,
        isActive: slot.is_active ?? true,
      })),
    ).returning();
    res.json({ data: inserted });
  } catch (error) {
    res.status(500).json({ error: "Impossible de mettre à jour la disponibilité" });
  }
});

export default router;

