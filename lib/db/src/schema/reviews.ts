import { pgTable, serial, text, boolean, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  clientId: integer("client_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  serviceId: integer("service_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  body: text("body"),
  sentimentScore: real("sentiment_score"),
  toxicityScore: real("toxicity_score"),
  isFlagged: boolean("is_flagged").notNull().default(false),
  sellerReply: text("seller_reply"),
  replyAt: text("reply_at"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
