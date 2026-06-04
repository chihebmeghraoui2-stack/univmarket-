import { Router, type IRouter } from "express";
import { eq, or, desc } from "drizzle-orm";
import { db, invoicesTable, ordersTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

router.get("/api/invoices", requireAuth, async (req, res): Promise<void> => {
  try {
    const user = (req as any).user;
    const invoices = await db.select().from(invoicesTable).where(or(eq(invoicesTable.clientId, user.id), eq(invoicesTable.sellerId, user.id))).orderBy(desc(invoicesTable.createdAt));
    res.json({ data: invoices });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer les factures" });
  }
});

router.get("/api/invoices/:id", requireAuth, async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;
    const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
    if (!invoice) { res.status(404).json({ error: "Facture introuvable" }); return; }
    if (invoice.clientId !== user.id && invoice.sellerId !== user.id && user.role !== "admin") {
      res.status(403).json({ error: "Accès refusé" }); return;
    }
    res.json({ data: invoice });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer la facture" });
  }
});

router.post("/api/invoices", requireAuth, async (req, res): Promise<void> => {
  try {
    const { order_id, amount, commission, pdf_url } = req.body;
    if (!order_id || !amount || !commission) {
      res.status(400).json({ error: "order_id, amount et commission requis" });
      return;
    }
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, Number(order_id)));
    if (!order) { res.status(404).json({ error: "Commande introuvable" }); return; }
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const [invoice] = await db.insert(invoicesTable).values({
      orderId: order.id,
      sellerId: order.sellerId,
      clientId: order.clientId,
      invoiceNumber,
      amount: String(amount),
      commission: String(commission),
      pdfUrl: pdf_url ?? null,
    }).returning();
    res.status(201).json({ data: invoice });
  } catch (error) {
    res.status(500).json({ error: "Impossible de créer la facture" });
  }
});

export default router;

