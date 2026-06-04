import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const portfoliosTable = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  images: text("images").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
