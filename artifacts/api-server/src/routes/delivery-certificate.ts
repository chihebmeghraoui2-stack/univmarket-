import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, deliveryCertificatesTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

router.get("/api/certificates/:id", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const [certificate] = await db.select().from(deliveryCertificatesTable).where(eq(deliveryCertificatesTable.id, id));
    if (!certificate) { res.status(404).json({ error: "Certificat introuvable" }); return; }
    res.json({ data: certificate });
  } catch (error) {
    res.status(500).json({ error: "Impossible de vérifier le certificat" });
  }
});

router.post("/api/certificates", requireAuth, async (req, res): Promise<void> => {
  try {
    const { order_id, pdf_url, qr_code, verification_url } = req.body;
    if (!order_id || !pdf_url || !qr_code) {
      res.status(400).json({ error: "order_id, pdf_url et qr_code requis" });
      return;
    }
    const [certificate] = await db.insert(deliveryCertificatesTable).values({
      orderId: Number(order_id),
      pdfUrl: pdf_url,
      qrCode: qr_code,
      verificationUrl: verification_url ?? null,
      issuedAt: new Date().toISOString(),
    }).returning();
    res.status(201).json({ data: certificate });
  } catch (error) {
    res.status(500).json({ error: "Impossible de créer le certificat" });
  }
});

router.get("/api/certificates/:id/download", async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const [certificate] = await db.select().from(deliveryCertificatesTable).where(eq(deliveryCertificatesTable.id, id));
    if (!certificate) { res.status(404).json({ error: "Certificat introuvable" }); return; }
    res.json({ data: { pdf_url: certificate.pdfUrl, verification_url: certificate.verificationUrl } });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer le certificat" });
  }
});

export default router;
