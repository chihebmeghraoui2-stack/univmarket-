import { pgTable, serial, text, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const wilayasTable = pgTable("wilayas", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  nameFr: text("name_fr").notNull(),
  nameAr: text("name_ar").notNull(),
  region: text("region"),
  isPilot: boolean("is_pilot").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertWilayaSchema = createInsertSchema(wilayasTable).omit({ id: true });
export type InsertWilaya = z.infer<typeof insertWilayaSchema>;
export type Wilaya = typeof wilayasTable.$inferSelect;

// Wilaya change requests
export const wilayaChangeRequestsTable = pgTable("wilaya_change_requests", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull(),
  currentWilayaId: integer("current_wilaya_id").notNull(),
  requestedWilayaId: integer("requested_wilaya_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  adminNote: text("admin_note"),
  decidedAt: text("decided_at"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export type WilayaChangeRequest = typeof wilayaChangeRequestsTable.$inferSelect;
