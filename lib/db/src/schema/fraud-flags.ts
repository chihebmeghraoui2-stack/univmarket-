import { pgTable, serial, integer, text, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";

export const fraudFlagsTable = pgTable("fraud_flags", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  flagType: text("flag_type").notNull(),
  severity: text("severity").notNull().default("medium"),
  detailsJson: jsonb("details_json").notNull().default({}),
  reviewed: boolean("reviewed").notNull().default(false),
  reviewedBy: integer("reviewed_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
