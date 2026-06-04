import { Router, type IRouter } from "express";
import { eq, and, count, sql, desc, ilike, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, usersTable, servicesTable, ordersTable, disputesTable, withdrawalRequestsTable, wilayasTable, reviewsTable, categoriesTable, notificationsTable, passwordResetRequestsTable } from "@workspace/db";
import { requireAdmin } from "../middleware/auth";
import { logger } from "../lib/logger";
import { sendEmail } from "../lib/email";

const router: IRouter = Router();

// GET /admin/stats
router.get("/admin/stats", requireAdmin, async (req, res): Promise<void> => {
  const [totalUsers] = await db.select({ count: count() }).from(usersTable);
  const [totalServices] = await db.select({ count: count() }).from(servicesTable);
  const [totalOrders] = await db.select({ count: count() }).from(ordersTable);
  const [completedOrders] = await db.select({ count: count() }).from(ordersTable).where(eq(ordersTable.status, "completed"));
  const [openDisputes] = await db.select({ count: count() }).from(disputesTable).where(eq(disputesTable.status, "open"));
  const [pendingServices] = await db.select({ count: count() }).from(servicesTable).where(eq(servicesTable.status, "pending"));

  const allOrders = await db.select().from(ordersTable);
  const gmvTotal = allOrders.filter(o => o.status === "completed").reduce((sum, o) => sum + Number(o.totalPrice), 0);
  const commissionTotal = allOrders.filter(o => o.status === "completed").reduce((sum, o) => sum + Number(o.commissionAmount), 0);

  const today = new Date(); today.setHours(0,0,0,0);
  const allUsers = await db.select().from(usersTable);
  const newUsersToday = allUsers.filter(u => new Date(u.createdAt) >= today).length;
  const ordersToday = allOrders.filter(o => new Date(o.createdAt) >= today).length;
  const [disputesResolved] = await db.select({ count: count() }).from(disputesTable).where(eq(disputesTable.status, "resolved"));

  const revenueChart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (6 - i));
    const value = allOrders.filter(o => o.status === "completed" && new Date(o.createdAt).getMonth() === d.getMonth() && new Date(o.createdAt).getFullYear() === d.getFullYear()).reduce((sum, o) => sum + Number(o.commissionAmount), 0);
    return { label: d.toLocaleString("fr-DZ", { month: "short" }), value };
  });
  const ordersChart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (6 - i));
    const value = allOrders.filter(o => new Date(o.createdAt).getMonth() === d.getMonth() && new Date(o.createdAt).getFullYear() === d.getFullYear()).length;
    return { label: d.toLocaleString("fr-DZ", { month: "short" }), value };
  });

  const completionRate = Number(totalOrders.count) > 0 ? (Number(completedOrders.count) / Number(totalOrders.count)) * 100 : 0;

  res.json({
    total_users: Number(totalOrders.count) > 0 ? allUsers.length : Number(allUsers.length),
    total_services: Number(totalOrders.count),
    total_orders: Number(totalOrders.count),
    open_disputes: Number(openDisputes.count),
    pending_services: Number(pendingServices.count),
    gmv_total: gmvTotal,
    commission_total: commissionTotal,
    completion_rate: completionRate,
    new_users_today: newUsersToday,
    orders_today: ordersToday,
    disputes_resolved: Number(disputesResolved.count),
    revenue_chart: revenueChart,
    orders_chart: ordersChart,
  });
});

// GET /admin/users
router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const { search, role, page = "1", limit = "20" } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = Math.min(parseInt(limit as string, 10), 50);
  const offset = (pageNum - 1) * limitNum;

  const conditions: any[] = [];
  if (role && role !== "all") conditions.push(eq(usersTable.role, role as string));
  if (search) conditions.push(or(ilike(usersTable.name, `%${search}%`), ilike(usersTable.email, `%${search}%`)));

  const rows = await db.select().from(usersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(usersTable.createdAt)).limit(limitNum).offset(offset);
  const [{ total }] = await db.select({ total: count() }).from(usersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json({
    data: rows.map(u => ({
      id: u.id, name: u.name, email: u.email, role: u.role, wilaya_id: u.wilayaId,
      avatar: u.avatar, verified_at: u.verifiedAt, banned_at: u.bannedAt,
      banned_reason: u.bannedReason, trust_score: u.trustScore,
      language_preference: u.languagePreference, created_at: u.createdAt,
    })),
    total: Number(total), page: pageNum, limit: limitNum,
  });
});

// POST /admin/users/:id/ban
router.post("/admin/users/:id/ban", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { reason } = req.body;
  if (!reason) { res.status(400).json({ error: "Raison requise" }); return; }
  const [user] = await db.update(usersTable)
    .set({ bannedAt: new Date().toISOString(), bannedReason: reason })
    .where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
  await db.update(servicesTable).set({ status: "banned" }).where(and(eq(servicesTable.sellerId, id), eq(servicesTable.status, "approved")));
  await db.insert(notificationsTable).values({ userId: id, type: "account_banned", title: "Compte suspendu", body: "Votre compte a ete suspendu. Raison: " + reason, link: "/dashboard" });
  res.json({ id: user.id, name: user.name, banned_at: user.bannedAt, language_preference: user.languagePreference });
});

// POST /admin/users/:id/unban
router.post("/admin/users/:id/unban", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [user] = await db.update(usersTable)
    .set({ bannedAt: null, bannedReason: null })
    .where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
  await db.update(servicesTable).set({ status: "approved" }).where(and(eq(servicesTable.sellerId, id), eq(servicesTable.status, "banned")));
  await db.insert(notificationsTable).values({ userId: id, type: "account_unbanned", title: "Compte reactive", body: "Votre compte a ete reactive. Vos services sont de nouveau disponibles.", link: "/dashboard" });
  res.json({ id: user.id, name: user.name, banned_at: null, language_preference: user.languagePreference });
});

// GET /admin/services/pending
router.get("/admin/services/pending", requireAdmin, async (req, res): Promise<void> => {
  const page = parseInt(req.query.page as string ?? "1", 10);
  const limit = Math.min(parseInt(req.query.limit as string ?? "20", 10), 50);
  const offset = (page - 1) * limit;

  const rows = await db
    .select({
      s: servicesTable,
      seller: { name: usersTable.name },
      category: { nameFr: categoriesTable.nameFr },
      wilaya: { nameFr: wilayasTable.nameFr },
    })
    .from(servicesTable)
    .leftJoin(usersTable, eq(servicesTable.sellerId, usersTable.id))
    .leftJoin(categoriesTable, eq(servicesTable.categoryId, categoriesTable.id))
    .leftJoin(wilayasTable, eq(servicesTable.wilayaId, wilayasTable.id))
    .where(eq(servicesTable.status, "pending"))
    .orderBy(desc(servicesTable.createdAt))
    .limit(limit).offset(offset);

  const [{ total }] = await db.select({ total: count() }).from(servicesTable).where(eq(servicesTable.status, "pending"));

  res.json({
    data: rows.map(r => ({
      id: r.s.id, title_fr: r.s.titleFr, description_fr: r.s.descriptionFr,
      price: r.s.price, price_type: r.s.priceType,
      seller_name: r.seller?.name, seller_id: r.s.sellerId,
      category_name_fr: r.category?.nameFr ?? null, wilaya_name_fr: r.wilaya?.nameFr ?? null,
      images: r.s.images, status: r.s.status, created_at: r.s.createdAt,
    })),
    total: Number(total), page, limit,
  });
});

// POST /admin/services/:id/approve
router.post("/admin/services/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [svc] = await db.update(servicesTable).set({ status: "approved" }).where(eq(servicesTable.id, id)).returning();
  if (!svc) { res.status(404).json({ error: "Service introuvable" }); return; }
  await db.insert(notificationsTable).values({
    userId: svc.sellerId, type: "service_approved", title: "Service approuv",
    body: `Votre service "${svc.titleFr}" a t approuv!`, link: `/services/${svc.id}`,
  });
  res.json({ id: svc.id, status: svc.status });
});

// POST /admin/services/:id/reject
router.post("/admin/services/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { reason } = req.body;
  if (!reason) { res.status(400).json({ error: "Raison requise" }); return; }
  const [svc] = await db.update(servicesTable).set({ status: "rejected", rejectionReason: reason }).where(eq(servicesTable.id, id)).returning();
  if (!svc) { res.status(404).json({ error: "Service introuvable" }); return; }
  res.json({ id: svc.id, status: svc.status, rejection_reason: svc.rejectionReason });
});

// POST /admin/disputes/:id/resolve
router.post("/admin/disputes/:id/resolve", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { decision, refund_amount } = req.body;
  if (!decision) { res.status(400).json({ error: "Dcision requise" }); return; }
  const [d] = await db.update(disputesTable)
    .set({ adminDecision: decision, refundAmount: refund_amount ?? null, status: "resolved", resolvedAt: new Date().toISOString() })
    .where(eq(disputesTable.id, id)).returning();
  if (!d) { res.status(404).json({ error: "Litige introuvable" }); return; }
  res.json({ id: d.id, status: d.status, admin_decision: d.adminDecision });
});

// GET /admin/withdrawals
router.get("/admin/withdrawals", requireAdmin, async (req, res): Promise<void> => {
  const page = parseInt(req.query.page as string ?? "1", 10);
  const limit = Math.min(parseInt(req.query.limit as string ?? "20", 10), 50);
  const offset = (page - 1) * limit;

  const rows = await db
    .select({ w: withdrawalRequestsTable, seller: { name: usersTable.name } })
    .from(withdrawalRequestsTable)
    .leftJoin(usersTable, eq(withdrawalRequestsTable.sellerId, usersTable.id))
    .orderBy(desc(withdrawalRequestsTable.createdAt))
    .limit(limit).offset(offset);

  const [{ total }] = await db.select({ total: count() }).from(withdrawalRequestsTable);

  res.json({
    data: rows.map(r => ({
      id: r.w.id, seller_id: r.w.sellerId, seller_name: r.seller?.name,
      amount: r.w.amount, method: r.w.method, status: r.w.status,
      admin_note: r.w.adminNote, created_at: r.w.createdAt,
    })),
    total: Number(total), page, limit,
  });
});

// POST /admin/withdrawals/:id/process
router.post("/admin/withdrawals/:id/process", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { status, admin_note } = req.body;
  const [w] = await db.update(withdrawalRequestsTable)
    .set({ status, adminNote: admin_note ?? null, processedAt: new Date().toISOString() })
    .where(eq(withdrawalRequestsTable.id, id)).returning();
  if (!w) { res.status(404).json({ error: "Retrait introuvable" }); return; }
  res.json({ id: w.id, status: w.status, admin_note: w.adminNote });
});

// GET /admin/wilayas/stats
router.get("/admin/wilayas/stats", requireAdmin, async (req, res): Promise<void> => {
  const wilayas = await db.select().from(wilayasTable).where(eq(wilayasTable.isActive, true));
  const result = await Promise.all(wilayas.map(async w => {
    const [activeServices] = await db.select({ cnt: count() }).from(servicesTable)
      .where(and(eq(servicesTable.wilayaId, w.id), eq(servicesTable.status, "approved")));
    const [sellers] = await db.select({ cnt: count() }).from(usersTable)
      .where(and(eq(usersTable.wilayaId, w.id), eq(usersTable.role, "seller")));
    const [orders] = await db.select({ cnt: count() }).from(ordersTable).where(eq(ordersTable.wilayaId, w.id));
    const wilayaOrders = await db.select().from(ordersTable).where(and(eq(ordersTable.wilayaId, w.id), eq(ordersTable.status, "completed")));
    const totalRevenue = wilayaOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
    return {
      wilaya_id: w.id, wilaya_name_fr: w.nameFr, wilaya_code: w.code,
      active_services: Number(activeServices.cnt),
      sellers_count: Number(sellers.cnt),
      total_orders: Number(orders.cnt),
      total_revenue: totalRevenue,
    };
  }));
  res.json(result);
});

// GET /admin/password-reset-requests
router.get("/admin/password-reset-requests", requireAdmin, async (req, res): Promise<void> => {
  // Auto-expirer les demandes de plus de 3 jours
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  await db.update(passwordResetRequestsTable)
    .set({ status: "expired", decidedAt: new Date() })
    .where(and(eq(passwordResetRequestsTable.status, "pending"), sql`${passwordResetRequestsTable.createdAt} < ${threeDaysAgo}`));
  const rows = await db.select({ r: passwordResetRequestsTable, seller: { name: usersTable.name } })
    .from(passwordResetRequestsTable)
    .leftJoin(usersTable, eq(passwordResetRequestsTable.sellerId, usersTable.id))
    .where(eq(passwordResetRequestsTable.status, "pending"))
    .orderBy(desc(passwordResetRequestsTable.createdAt));
  res.json({ data: rows.map(r => ({
    id: r.r.id,
    seller_id: r.r.sellerId,
    email: r.r.email,
    status: r.r.status,
    created_at: r.r.createdAt,
    decided_at: r.r.decidedAt,
    seller_name: r.seller?.name ?? null,
  })) });
});
router.put("/admin/password-reset-requests/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) { res.status(400).json({ error: "Mot de passe trop court" }); return; }
  const [request] = await db.select().from(passwordResetRequestsTable).where(eq(passwordResetRequestsTable.id, id));
  if (!request || request.status !== "pending") { res.status(404).json({ error: "Demande introuvable" }); return; }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.transaction(async (tx) => {
    await tx.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, request.sellerId));
    await tx.update(passwordResetRequestsTable).set({ status: "approved", decidedAt: new Date() }).where(eq(passwordResetRequestsTable.id, id));
  });
  try {
    await sendEmail(request.email, "Mot de passe reinitialise - UnivMarket", `<div style="font-family:sans-serif;padding:32px;max-width:480px;margin:auto;border:1px solid #e5e7eb;border-radius:12px"><h2 style="color:#0f766e">UnivMarket</h2><p>Bonjour,</p><p>Votre demande a ete <strong style="color:#16a34a">approuvee</strong>.</p><div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:16px 0"><p><strong>Email :</strong> ${request.email}</p><p><strong>Nouveau mot de passe :</strong> <span style="font-size:20px;font-weight:bold;color:#0f766e;letter-spacing:2px">${newPassword}</span></p></div><a href="http://localhost:5173/login" style="display:inline-block;padding:12px 24px;background:#0f766e;color:white;border-radius:8px;text-decoration:none">Se connecter</a></div>`);
  } catch(e) { logger.warn("Email send failed"); }
  res.json({ success: true });
});

// PUT /admin/password-reset-requests/:id/reject
router.put("/admin/password-reset-requests/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [request] = await db.select().from(passwordResetRequestsTable).where(eq(passwordResetRequestsTable.id, id));
  if (!request || request.status !== "pending") {
    res.status(404).json({ error: "Demande introuvable ou dj traite" });
    return;
  }
  await db.update(passwordResetRequestsTable)
    .set({ status: "rejected", decidedAt: new Date() })
    .where(eq(passwordResetRequestsTable.id, id));
  res.json({ success: true });
});

// PUT /admin/users/:id/verify
router.put("/admin/users/:id/verify", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [user] = await db.update(usersTable)
    .set({ verifiedAt: new Date() })
    .where(eq(usersTable.id, id))
    .returning();
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
  res.json({ success: true, user });
});

// ???????????????????????????????????????????????
// ASSISTANT IA ADMIN  ARIA ULTRA v2
// Accs complet  toutes les tables en temps rel
// ???????????????????????????????????????????????

// GET /admin/ai-snapshot  donnes live pour le frontend
router.get("/admin/ai-snapshot", requireAdmin, async (req, res) => {
  try {
    const [users] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    const [orders] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable);
    const [services] = await db.select({ count: sql<number>`count(*)` }).from(servicesTable);
    const [disputes] = await db.select({ count: sql<number>`count(*)` }).from(disputesTable).where(eq(disputesTable.status, "open"));
    const [pendingSvc] = await db.select({ count: sql<number>`count(*)` }).from(servicesTable).where(eq(servicesTable.status, "pending"));
    const [withdrawals] = await db.select({ count: sql<number>`count(*)` }).from(withdrawalRequestsTable).where(eq(withdrawalRequestsTable.status, "pending"));
    const [sellers] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "seller"));
    const [clients] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "client"));
    const [banned] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(sql`${usersTable.bannedAt} IS NOT NULL`);
    const [completedOrders] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(eq(ordersTable.status, "completed"));
    const [cancelledOrders] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(eq(ordersTable.status, "cancelled"));
    const recentActivity = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(5);
    res.json({
      snapshot_at: new Date().toISOString(),
      users: { total: Number(users.count), sellers: Number(sellers.count), clients: Number(clients.count), banned: Number(banned.count) },
      orders: { total: Number(orders.count), completed: Number(completedOrders.count), cancelled: Number(cancelledOrders.count) },
      services: { total: Number(services.count), pending: Number(pendingSvc.count) },
      disputes: { open: Number(disputes.count) },
      withdrawals: { pending: Number(withdrawals.count) },
      recent_orders: recentActivity.map(o => ({ id: o.id, status: o.status, price: o.totalPrice, created_at: o.createdAt })),
    });
  } catch(e) {
    res.status(500).json({ error: "Erreur snapshot" });
  }
});

router.post("/admin/ai-assistant", requireAdmin, async (req, res) => {
  try {
    const { message, context, language = "fr", history = [] } = req.body;
    if (!message) return res.status(400).json({ error: "Message requis" });

    // Auto-detection langue depuis le message
    const hasArabic = /[؀-ۿ]/.test(message);
    const hasEnglish = /what|how|why|when|who|where|show|give|tell|list|analyze|report|help/i.test(message);
    const detectedLang = hasArabic ? "ar" : hasEnglish ? "en" : language;

    // === COLLECTE COMPLETE DE TOUTES LES DONNEES ===
    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    const [totalOrders] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable);
    const [totalServices] = await db.select({ count: sql<number>`count(*)` }).from(servicesTable);
    const [pendingDisputes] = await db.select({ count: sql<number>`count(*)` }).from(disputesTable).where(eq(disputesTable.status, "open"));
    const [resolvedDisputes] = await db.select({ count: sql<number>`count(*)` }).from(disputesTable).where(eq(disputesTable.status, "resolved"));
    const [pendingSvc] = await db.select({ count: sql<number>`count(*)` }).from(servicesTable).where(eq(servicesTable.status, "pending"));
    const [approvedSvc] = await db.select({ count: sql<number>`count(*)` }).from(servicesTable).where(eq(servicesTable.status, "approved"));
    const [rejectedSvc] = await db.select({ count: sql<number>`count(*)` }).from(servicesTable).where(eq(servicesTable.status, "rejected"));
    const [completedOrders] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(eq(ordersTable.status, "completed"));
    const [cancelledOrders] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(eq(ordersTable.status, "cancelled"));
    const [inProgressOrders] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(eq(ordersTable.status, "in_progress"));
    const [sellers] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "seller"));
    const [clients] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "client"));
    const [bannedUsers] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(sql`${usersTable.bannedAt} IS NOT NULL`);
    const [pendingWithdrawals] = await db.select({ count: sql<number>`count(*)` }).from(withdrawalRequestsTable).where(eq(withdrawalRequestsTable.status, "pending"));
    const [totalWithdrawals] = await db.select({ count: sql<number>`count(*)` }).from(withdrawalRequestsTable);
    const [totalReviews] = await db.select({ count: sql<number>`count(*)` }).from(reviewsTable);
    const [totalCategories] = await db.select({ count: sql<number>`count(*)` }).from(categoriesTable);
    const [totalWilayas] = await db.select({ count: sql<number>`count(*)` }).from(wilayasTable).where(eq(wilayasTable.isActive, true));

    // Top 5 wilayas par commandes
    const topWilayas = await db
      .select({ name: wilayasTable.nameFr, cnt: sql<number>`count(${ordersTable.id})` })
      .from(ordersTable)
      .leftJoin(wilayasTable, eq(ordersTable.wilayaId, wilayasTable.id))
      .groupBy(wilayasTable.nameFr)
      .orderBy(sql`count(${ordersTable.id}) DESC`)
      .limit(5);

    // Top 5 catgories par services
    const topCategories = await db
      .select({ name: categoriesTable.nameFr, cnt: sql<number>`count(${servicesTable.id})` })
      .from(servicesTable)
      .leftJoin(categoriesTable, eq(servicesTable.categoryId, categoriesTable.id))
      .groupBy(categoriesTable.nameFr)
      .orderBy(sql`count(${servicesTable.id}) DESC`)
      .limit(5);

    // Dernires activits (10 commandes rcentes)
    const recentOrders = await db
      .select({ id: ordersTable.id, status: ordersTable.status, price: ordersTable.totalPrice, created_at: ordersTable.createdAt })
      .from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(10);

    // Utilisateurs rcents (5)
    const recentUsers = await db
      .select({ id: usersTable.id, name: usersTable.name, role: usersTable.role, created_at: usersTable.createdAt })
      .from(usersTable).orderBy(desc(usersTable.createdAt)).limit(5);

    // Taux de compltion
    const completionRate = Number(totalOrders.count) > 0
      ? ((Number(completedOrders.count) / Number(totalOrders.count)) * 100).toFixed(1)
      : "0";

    // Contexte utilisateur spcifique si fourni
    let userContext = "";
    if (context?.userId) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, context.userId));
      const userOrders = await db.select().from(ordersTable).where(
        context.role === "seller" ? eq(ordersTable.sellerId, context.userId) : eq(ordersTable.clientId, context.userId)
      );
      const userServices = context.role === "seller"
        ? await db.select().from(servicesTable).where(eq(servicesTable.sellerId, context.userId)) : [];
      const userReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.sellerId, context.userId));
      const revenue = userOrders.filter((o: any) => o.status === "completed").reduce((a: number, o: any) => a + parseFloat(o.totalPrice || "0"), 0);
      const avgRating = userReviews.length > 0 ? (userReviews.reduce((a: number, r: any) => a + (r.rating || 0), 0) / userReviews.length).toFixed(1) : "N/A";

      userContext = `
ANALYSE UTILISATEUR ID #${context.userId}:
- Nom: ${user?.name || "Inconnu"} | Email: ${user?.email} | Role: ${user?.role}
- Wilaya ID: ${user?.wilayaId} | Inscrit le: ${user?.createdAt}
- Statut: ${user?.bannedAt ? "BANNI depuis " + user.bannedAt + "  Raison: " + user.bannedReason : "Actif"}
- Trust Score: ${user?.trustScore ?? "N/A"}
- Commandes: ${userOrders.length} total | Statuts: ${JSON.stringify(userOrders.reduce((acc: any, o: any) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {}))}
- Services publis: ${userServices.length} | Avis reus: ${userReviews.length} | Note moyenne: ${avgRating}/5
- Revenus totaux (commandes compltes): ${revenue.toFixed(0)} DZD`;
    }

    // Historique de conversation
    const conversationHistory = (history || []).slice(-6).map((m: any) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content
    }));

    const langLabel = detectedLang === "ar"
      ? "ARABE UNIQUEMENT ()         "
      : detectedLang === "en"
      ? "ENGLISH ONLY  All your responses must be exclusively in English"
      : "FRANCAIS UNIQUEMENT  Toutes tes rponses doivent tre exclusivement en franais";

    const systemPrompt = `Tu es ARIA  Assistant de Recherche et d'Intelligence Administrative de UnivMarket.
UnivMarket est la marketplace universitaire algrienne n1, connectant tudiants vendeurs et clients pour des services acadmiques.

IDENTITE: Tu es une IA experte, analytique, professionnelle et proactive. Tu bases TOUTES tes rponses sur les donnes relles de la base de donnes ci-dessous. Tu ne fais pas de suppositions  tu analyses des faits rels.

LANGUE OBLIGATOIRE: ${langLabel}
Si l'utilisateur crit en arabe ? rponds en arabe. En anglais ? rponds en anglais. Sinon ? franais.

??????????????????????????????????????????????????
?? TABLEAU DE BORD EN TEMPS REEL  ${new Date().toLocaleString("fr-DZ", { dateStyle: "full", timeStyle: "medium" })}
??????????????????????????????????????????????????

?? UTILISATEURS (${totalUsers.count} total)
    Vendeurs: ${sellers.count} | Clients: ${clients.count} | Bannis: ${bannedUsers.count}
    Rcents: ${recentUsers.map((u: any) => u.name + "(" + u.role + ")").join(", ") || "aucun"}

?? SERVICES (${totalServices.count} total)
    ? Approuvs: ${approvedSvc.count} | ? En attente: ${pendingSvc.count} | ? Rejets: ${rejectedSvc.count}
    Top catgories: ${topCategories.map((c: any) => (c.name || "?") + ":" + c.cnt).join(" | ") || "aucune donne"}

?? COMMANDES (${totalOrders.count} total)
    ? Compltes: ${completedOrders.count} (${completionRate}%) | ?? En cours: ${inProgressOrders.count} | ? Annules: ${cancelledOrders.count}
    Rcentes: ${recentOrders.slice(0,5).map((o: any) => "#" + o.id + "?" + o.status).join(", ") || "aucune"}

?? LITIGES: ${pendingDisputes.count} ouverts | ? ${resolvedDisputes.count} rsolus
?? RETRAITS: ${pendingWithdrawals.count} en attente | ${totalWithdrawals.count} total traits
? AVIS CLIENTS: ${totalReviews.count} avis publis
?? CATEGORIES: ${totalCategories.count} | ??? WILAYAS ACTIVES: ${totalWilayas.count}
?? TOP WILAYAS: ${topWilayas.map((w: any) => (w.name || "?") + "(" + w.cnt + " cmd)").join(" | ") || "aucune donne"}

??????????????????????????????????????????????????
SERVICES DE LA PLATEFORME:
 Thse & Mmoire, Correction & Relecture, Dveloppement Web, Prsentation PPT
 Traduction FR?AR?EN, Design Graphique, Marketing Digital, Cours particuliers
 Saisie manuscrite, CV professionnel, Analyse de donnes, Programmation

FONCTIONNALITES PLATEFORME:
 Systme de commandes avec escrow scuris
 Messagerie temps rel entre vendeurs et clients
 Systme d'avis et notation (1-5 toiles)
 Wallet vendeur avec demandes de retrait
 Systme de litiges avec rsolution admin
 Profils vrifis avec trust score
 Notifications temps rel
 Systme de coupons et rductions
 Classement vendeurs par performance
 Couverture 58 wilayas algriennes
 Support FR / AR / EN
 IA intgre (  pour users, ARIA pour admin)
 Systme anti-fraude et dtection contenu inappropri
 Systme de produits tendance avec validation admin
??????????????????????????????????????????????????
${userContext ? `ANALYSE UTILISATEUR SPECIFIQUE:
${userContext}
??????????????????????????????????????????????????` : ""}

TES CAPACITES ANALYTIQUES:
1. ?? Analyse comportementale utilisateur (normal/suspect/frauduleux)
2. ?? Rapports de performance: revenus, croissance, KPIs
3. ?? Dtection d'anomalies et risques de fraude
4. ?? Recommandations dcisionnelles prcises et actionnables
5. ??? Analyse gographique par wilaya
6. ?? Performance vendeurs, services, catgories
7. ?? Prvisions bases sur les tendances actuelles
8. ?? Stratgies d'amlioration de la plateforme
9. ?? Gnration de rapports complets
10. ?? Alertes et points d'attention critiques

REGLES ABSOLUES:
? Rponds TOUJOURS dans la langue dtecte: ${langLabel}
? Base-toi EXCLUSIVEMENT sur les donnes relles ci-dessus
? Structure tes rponses avec des sections claires et emojis
? Termine TOUJOURS par une recommandation concrte ??
? Signale les anomalies avec ??, le positif avec ?
? Si une donne est manquante, indique-le clairement
? Ne divulgue JAMAIS mots de passe, tokens ou donnes sensibles
? Quand l'utilisateur pose une question sur les donnes ? cite les chiffres exacts
? Les donnes sont fraches  chaque requte (mise  jour automatique)`;

    const messages_to_send = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.GROQ_API_KEY },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: messages_to_send, temperature: 0.2, max_tokens: 2048 }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq error:", err);
      return res.status(500).json({ error: "Erreur IA" });
    }
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Je n'ai pas pu gnrer une rponse.";
    res.json({ reply, model: "llama-3.3-70b-versatile", timestamp: new Date().toISOString() });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
