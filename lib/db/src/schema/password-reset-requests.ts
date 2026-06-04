import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const passwordResetRequestsTable = pgTable("password_reset_requests", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull(),
  email: text("email").notNull(),
  status: text("status").notNull().default("pending"),
  newPassword: text("new_password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
});

export const insertPasswordResetRequestSchema = createInsertSchema(passwordResetRequestsTable).omit({ id: true, createdAt: true, decidedAt: true });
export type PasswordResetRequest = typeof passwordResetRequestsTable.$inferSelect;
