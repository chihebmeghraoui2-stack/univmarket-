import { pgTable, serial, integer, text, decimal, boolean, timestamp } from "drizzle-orm/pg-core";

export const cancellationLogsTable = pgTable("cancellation_logs", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  cancelledBy: integer("cancelled_by"),
  reasonType: text("reason_type"),
  reasonDetail: text("reason_detail"),
  penaltyAmount: decimal("penalty_amount", { precision: 12, scale: 2 }).default("0"),
  refundAmount: decimal("refund_amount", { precision: 12, scale: 2 }).default("0"),
  autoTriggered: boolean("auto_triggered").notNull().default(false),
  notifiedAt: timestamp("notified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
