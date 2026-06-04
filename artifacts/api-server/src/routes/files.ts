import { Router } from "express";
import { db } from "@workspace/db";
import { fileDeliveriesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import crypto from "crypto";

const router = Router();

router.get("/api/files/:token", async (req, res) => {
  try {
    const [file] = await db.select().from(fileDeliveriesTable)
      .where(eq(fileDeliveriesTable.downloadToken, req.params.token));
    if (!file) return res.status(404).json({ error: "Fichier introuvable" });
    const { storagePath, ...safeFile } = file as any;
    res.json(safeFile);
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/api/files/upload", requireAuth, async (req, res) => {
  try {
    const sellerId = (req as any).user.id;
    const { orderId, fileName, fileSize, mimeType, storagePath } = req.body;
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    const [file] = await db.insert(fileDeliveriesTable)
      .values({ orderId, sellerId, fileName, fileSize, mimeType, storagePath, downloadToken: token, expiresAt })
      .returning();
    res.json({ ...file, downloadUrl: `/files/${token}` });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
