import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const disputesTable = pgTable("disputes", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  clientId: integer("client_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  reason: text("reason").notNull(),
  evidenceFiles: text("evidence_files").array().notNull().default([]),
  status: text("status").notNull().default("open"), // open, seller_replied, admin_review, resolved
  sellerReply: text("seller_reply"),
  sellerEvidenceFiles: text("seller_evidence_files").array().notNull().default([]),
  adminDecision: text("admin_decision"),
  refundAmount: real("refund_amount"),
  resolvedAt: text("resolved_at"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDisputeSchema = createInsertSchema(disputesTable).omit({ id: true, createdAt: true });
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Dispute = typeof disputesTable.$inferSelect;
