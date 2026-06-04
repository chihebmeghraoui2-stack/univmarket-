import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const wishlistsTable = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  serviceId: integer("service_id").notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Wishlist = typeof wishlistsTable.$inferSelect;
