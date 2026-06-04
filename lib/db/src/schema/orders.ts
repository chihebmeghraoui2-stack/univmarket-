import { pgTable, serial, text, boolean, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  serviceId: integer("service_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  wilayaId: integer("wilaya_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, in_progress, delivered, completed, disputed, cancelled, refunded
  totalPrice: real("total_price").notNull(),
  commissionAmount: real("commission_amount").notNull().default(0),
  paymentMethod: text("payment_method").notNull(), // paypal, cib, baridimob, dahabia
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, confirmed, rejected, refunded
  receiptImage: text("receipt_image"),
  notes: text("notes"),
  deliveredAt: text("delivered_at"),
  autoCompleteAt: text("auto_complete_at"),
  cancellationReason: text("cancellation_reason"),
  contractSignedClient: boolean("contract_signed_client").notNull().default(false),
  contractSignedSeller: boolean("contract_signed_seller").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;

// Digital contracts
export const digitalContractsTable = pgTable("digital_contracts", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  contentFr: text("content_fr"),
  clientSignedAt: text("client_signed_at"),
  sellerSignedAt: text("seller_signed_at"),
  clientIp: text("client_ip"),
  sellerIp: text("seller_ip"),
  pdfUrl: text("pdf_url"),
  qrVerificationCode: text("qr_verification_code"),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DigitalContract = typeof digitalContractsTable.$inferSelect;

// Escrow transactions
export const escrowTransactionsTable = pgTable("escrow_transactions", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  amount: real("amount").notNull(),
  commissionAmount: real("commission_amount").notNull().default(0),
  status: text("status").notNull().default("held"), // held, released, refunded, disputed, partially_refunded
  heldAt: text("held_at"),
  releasedAt: text("released_at"),
  releasedBy: integer("released_by"),
  autoReleaseAt: text("auto_release_at"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EscrowTransaction = typeof escrowTransactionsTable.$inferSelect;
