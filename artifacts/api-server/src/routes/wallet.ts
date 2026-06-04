import { Router, type IRouter } from "express";
import { eq, desc, count } from "drizzle-orm";
import { db, sellerWalletsTable, walletTransactionsTable, withdrawalRequestsTable } from "@workspace/db";
import { requireAuth, requireSeller } from "../middleware/auth";

const router: IRouter = Router();

// GET /wallet
router.get("/wallet", requireSeller, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const [wallet] = await db.select().from(sellerWalletsTable).where(eq(sellerWalletsTable.sellerId, user.id));
  if (!wallet) {
    // Auto-create wallet
    const [newWallet] = await db.insert(sellerWalletsTable).values({ sellerId: user.id }).returning();
    res.json({ id: newWallet.id, balance: 0, pending_balance: 0, total_earned: 0, total_withdrawn: 0 });
    return;
  }
  res.json({
    id: wallet.id, balance: wallet.balance, pending_balance: wallet.pendingBalance,
    total_earned: wallet.totalEarned, total_withdrawn: wallet.totalWithdrawn,
    last_transaction_at: wallet.lastTransactionAt,
  });
});

// GET /wallet/transactions
router.get("/wallet/transactions", requireSeller, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const page = parseInt(req.query.page as string ?? "1", 10);
  const limit = Math.min(parseInt(req.query.limit as string ?? "20", 10), 50);
  const offset = (page - 1) * limit;

  const [wallet] = await db.select().from(sellerWalletsTable).where(eq(sellerWalletsTable.sellerId, user.id));
  if (!wallet) { res.json({ data: [], total: 0, page, limit }); return; }

  const rows = await db.select().from(walletTransactionsTable).where(eq(walletTransactionsTable.walletId, wallet.id)).orderBy(desc(walletTransactionsTable.createdAt)).limit(limit).offset(offset);
  const [{ total }] = await db.select({ total: count() }).from(walletTransactionsTable).where(eq(walletTransactionsTable.walletId, wallet.id));

  res.json({
    data: rows.map(t => ({ id: t.id, type: t.type, amount: t.amount, description: t.description, created_at: t.createdAt })),
    total: Number(total), page, limit,
  });
});

// POST /wallet/withdraw
router.post("/wallet/withdraw", requireSeller, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const { amount, method } = req.body;
  if (!amount || !method || Number(amount) < 1000) {
    res.status(400).json({ error: "Montant minimum 1000 DZD requis" });
    return;
  }
  const [wallet] = await db.select().from(sellerWalletsTable).where(eq(sellerWalletsTable.sellerId, user.id));
  if (!wallet || wallet.balance < Number(amount)) {
    res.status(400).json({ error: "Solde insuffisant" }); return;
  }
  const [req_] = await db.insert(withdrawalRequestsTable).values({
    sellerId: user.id, amount: Number(amount), method,
  }).returning();
  // Hold the amount
  await db.update(sellerWalletsTable).set({ balance: wallet.balance - Number(amount) }).where(eq(sellerWalletsTable.id, wallet.id));
  res.status(201).json({ id: req_.id, amount: req_.amount, method: req_.method, status: req_.status, created_at: req_.createdAt });
});

export default router;

