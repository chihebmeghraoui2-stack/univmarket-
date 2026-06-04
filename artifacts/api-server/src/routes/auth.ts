import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "../lib/email";
import { db } from "@workspace/db";
import { usersTable, sessionsTable, sellerWalletsTable, passwordResetRequestsTable } from "@workspace/db";
import { RegisterBody, LoginBody, UpdateProfileBody } from "@workspace/api-zod";
import { requireAuth } from "../middleware/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// POST /auth/register
router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password, role, wilaya_id, phone, bio } = parsed.data;
  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email déjà utilisé" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
  const [user] = await db.insert(usersTable).values({
    name, email, passwordHash, role: role as string, wilayaId: wilaya_id,
    phone, bio, referralCode,
  }).returning();

  // Create wallet for sellers
  if (user.role === "seller") {
    await db.insert(sellerWalletsTable).values({ sellerId: user.id });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: user.id, token, expiresAt });

  req.log.info({ userId: user.id }, "User registered");
  res.status(201).json({
    token,
    user: {
      id: user.id, name: user.name, email: user.email,
      role: user.role, wilaya_id: user.wilayaId,
      avatar: user.avatar, phone: user.phone, bio: user.bio,
      verified_at: user.verifiedAt, trust_score: user.trustScore,
      referral_code: user.referralCode, language_preference: user.languagePreference,
    },
  });
});

// POST /auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Identifiants invalides" });
    return;
  }
  if (user.bannedAt) {
    res.status(403).json({ error: "Compte banni: " + (user.bannedReason ?? "") });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Identifiants invalides" });
    return;
  }
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: user.id, token, expiresAt });
  req.log.info({ userId: user.id }, "User logged in");
  res.json({
    token,
    user: {
      id: user.id, name: user.name, email: user.email,
      role: user.role, wilaya_id: user.wilayaId,
      avatar: user.avatar, phone: user.phone, bio: user.bio,
      verified_at: user.verifiedAt, trust_score: user.trustScore,
      referral_code: user.referralCode, language_preference: user.languagePreference,
    },
  });
});

// POST /auth/forgot-password
router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email requis" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.role !== "client") {
    res.status(400).json({ error: "Email introuvable ou rôle invalide" });
    return;
  }
  const code = Math.floor(10000 + Math.random() * 90000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await db.update(usersTable)
    .set({ resetCode: code, resetCodeExpires: expiresAt })
    .where(eq(usersTable.id, user.id));
  try { await sendEmail(email, "Code de reinitialisation UnivMarket", `<div style="font-family:sans-serif;padding:32px;max-width:480px;margin:auto;border:1px solid #e5e7eb;border-radius:12px"><h2 style="color:#0f766e">UnivMarket</h2><p>Bonjour,</p><p>Votre code de reinitialisation :</p><div style="font-size:40px;font-weight:bold;text-align:center;padding:24px;background:#f0fdf4;border-radius:8px;letter-spacing:10px;color:#0f766e">${code}</div><p style="color:#6b7280;font-size:12px;margin-top:16px">Expire dans 15 minutes.</p></div>`); } catch(emailErr) { logger.error(emailErr, "Email send failed"); }
  res.json({ success: true, message: "Code envoyé par email" });
});

// POST /auth/reset-password
router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    res.status(400).json({ error: "Email, code et nouveau mot de passe requis" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(
    and(
      eq(usersTable.email, email),
      eq(usersTable.resetCode, code),
      gt(usersTable.resetCodeExpires, new Date()),
    ),
  );
  if (!user) {
    res.status(400).json({ error: "Code invalide ou expiré" });
    return;
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable)
    .set({ passwordHash, resetCode: null, resetCodeExpires: null })
    .where(eq(usersTable.id, user.id));
  res.json({ success: true });
});

// POST /auth/seller-forgot-password
router.post("/auth/seller-forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email requis" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.role !== "seller") {
    res.status(400).json({ error: "Email introuvable ou rôle invalide" });
    return;
  }
  await db.insert(passwordResetRequestsTable).values({ sellerId: user.id, email: user.email });
  res.json({ success: true, message: "Demande envoyée à l'administrateur" });
});

// POST /auth/admin-key-login
router.post("/auth/admin-key-login", async (req, res): Promise<void> => {
  const { secretKey } = req.body;
  if (!secretKey) {
    res.status(400).json({ error: "Clé requise" });
    return;
  }
  const adminSecret = process.env.ADMIN_SECRET_KEY || "chihebmeghraoui";
  if (secretKey !== adminSecret) {
    res.status(401).json({ error: "Clé invalide" });
    return;
  }
  const [admin] = await db.select().from(usersTable).where(eq(usersTable.role, "admin"));
  if (!admin) {
    res.status(404).json({ error: "Administrateur introuvable" });
    return;
  }
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: admin.id, token, expiresAt });
  req.log.info({ userId: admin.id }, "Admin key login");
  res.json({
    token,
    user: {
      id: admin.id, name: admin.name, email: admin.email,
      role: admin.role, wilaya_id: admin.wilayaId,
      avatar: admin.avatar, phone: admin.phone, bio: admin.bio,
      verified_at: admin.verifiedAt, trust_score: admin.trustScore,
      referral_code: admin.referralCode, language_preference: admin.languagePreference,
    },
  });
});

// POST /auth/logout
router.post("/auth/logout", requireAuth, async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  }
  res.status(200).json({ message: "Déconnecté" });
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  res.json({
    id: user.id, name: user.name, email: user.email,
    role: user.role, wilaya_id: user.wilayaId,
    avatar: user.avatar, phone: user.phone, bio: user.bio,
    verified_at: user.verifiedAt, trust_score: user.trustScore,
    referral_code: user.referralCode, language_preference: user.languagePreference,
  });
});

// PATCH /auth/me (update profile)
router.patch("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.avatar !== undefined) updates.avatar = parsed.data.avatar;
  if (parsed.data.language_preference) updates.languagePreference = parsed.data.language_preference;
  if (parsed.data.whatsapp_phone !== undefined) updates.whatsappPhone = parsed.data.whatsapp_phone;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id)).returning();
  res.json({
    id: updated.id, name: updated.name, email: updated.email,
    role: updated.role, wilaya_id: updated.wilayaId,
    avatar: updated.avatar, phone: updated.phone, bio: updated.bio,
    verified_at: updated.verifiedAt, trust_score: updated.trustScore,
    referral_code: updated.referralCode, language_preference: updated.languagePreference,
  });
});

// PUT /auth/profile
router.put("/auth/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updates: any = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.avatar !== undefined) updates.avatar = parsed.data.avatar;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  res.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role, avatar: updated.avatar, phone: updated.phone, bio: updated.bio });
});

export default router;
