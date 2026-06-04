import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const clientRatingsTable = pgTable("client_ratings", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  clientId: integer("client_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
