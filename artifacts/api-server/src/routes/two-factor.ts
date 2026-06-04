import { Router } from "express";
import { db } from "@workspace/db";
import { twoFactorTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

const router = Router();

router.post("/api/2fa/setup", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    const secret = speakeasy.generateSecret({ name: `UnivMarket (${user.email})` });
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    const existing = await db.select().from(twoFactorTable).where(eq(twoFactorTable.userId, userId));
    if (existing.length) {
      await db.update(twoFactorTable)
        .set({ secret: secret.base32, isEnabled: false, updatedAt: new Date() })
        .where(eq(twoFactorTable.userId, userId));
    } else {
      await db.insert(twoFactorTable).values({ userId, secret: secret.base32, isEnabled: false });
    }

    res.json({ secret: secret.base32, qrCode });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/api/2fa/verify", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { token } = req.body;

    const [tf] = await db.select().from(twoFactorTable).where(eq(twoFactorTable.userId, userId));
    if (!tf) return res.status(404).json({ error: "2FA non configur�" });

    const isValid = speakeasy.totp.verify({
      secret: tf.secret,
      encoding: "base32",
      token,
      window: 1,
    });
    if (!isValid) return res.status(400).json({ error: "Code invalide" });

    const backupCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).slice(2, 10).toUpperCase()
    );

    await db.update(twoFactorTable)
      .set({ isEnabled: true, backupCodes, updatedAt: new Date() })
      .where(eq(twoFactorTable.userId, userId));

    res.json({ ok: true, backupCodes });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/api/2fa/disable", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { token } = req.body;

    const [tf] = await db.select().from(twoFactorTable).where(eq(twoFactorTable.userId, userId));
    if (!tf) return res.status(404).json({ error: "2FA non configur�" });

    const isValid = speakeasy.totp.verify({
      secret: tf.secret,
      encoding: "base32",
      token,
      window: 1,
    });
    if (!isValid) return res.status(400).json({ error: "Code invalide" });

    await db.update(twoFactorTable)
      .set({ isEnabled: false, updatedAt: new Date() })
      .where(eq(twoFactorTable.userId, userId));

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/api/2fa/status", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const [tf] = await db.select().from(twoFactorTable).where(eq(twoFactorTable.userId, userId));
    res.json({ enabled: tf?.isEnabled || false });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;

