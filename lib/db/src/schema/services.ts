import { pgTable, serial, text, boolean, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const servicesTable = pgTable("services", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull(),
  categoryId: integer("category_id").notNull(),
  wilayaId: integer("wilaya_id").notNull(),
  titleFr: text("title_fr").notNull(),
  titleAr: text("title_ar"),
  descriptionFr: text("description_fr"),
  descriptionAr: text("description_ar"),
  price: real("price").notNull(),
  priceType: text("price_type").notNull().default("fixed"), // fixed, hourly, negotiable
  images: text("images").array().notNull().default([]),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, banned
  deliveryDays: integer("delivery_days").notNull().default(3),
  isFeatured: boolean("is_featured").notNull().default(false),
  featuredUntil: text("featured_until"),
  viewsCount: integer("views_count").notNull().default(0),
  clicksCount: integer("clicks_count").notNull().default(0),
  rejectionReason: text("rejection_reason"),
  locationLat: real("location_lat"),
  locationLng: real("location_lng"),
  locationAddress: text("location_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertServiceSchema = createInsertSchema(servicesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof servicesTable.$inferSelect;
