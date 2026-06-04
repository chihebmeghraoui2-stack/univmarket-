import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sellerWalletsTable = pgTable("seller_wallets", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().unique(),
  balance: real("balance").notNull().default(0),
  pendingBalance: real("pending_balance").notNull().default(0),
  totalEarned: real("total_earned").notNull().default(0),
  totalWithdrawn: real("total_withdrawn").notNull().default(0),
  lastTransactionAt: text("last_transaction_at"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SellerWallet = typeof sellerWalletsTable.$inferSelect;

export const walletTransactionsTable = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull(),
  type: text("type").notNull(), // credit, debit, hold, release, penalty
  amount: real("amount").notNull(),
  referenceId: integer("reference_id"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WalletTransaction = typeof walletTransactionsTable.$inferSelect;

export const withdrawalRequestsTable = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull(),
  amount: real("amount").notNull(),
  method: text("method").notNull(), // cib, baridimob, dahabia, paypal
  accountDetailsEncrypted: text("account_details_encrypted"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, processed
  adminNote: text("admin_note"),
  processedAt: text("processed_at"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWithdrawalSchema = createInsertSchema(withdrawalRequestsTable).omit({ id: true, createdAt: true });
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type WithdrawalRequest = typeof withdrawalRequestsTable.$inferSelect;
