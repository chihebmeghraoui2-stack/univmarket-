import { pgTable, serial, integer, decimal, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const sellerTrustScoresTable = pgTable("seller_trust_scores", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull(),
  score: integer("score").notNull().default(0),
  verificationScore: integer("verification_score").notNull().default(0),
  ratingScore: integer("rating_score").notNull().default(0),
  completionRateScore: integer("completion_rate_score").notNull().default(0),
  disputeScore: integer("dispute_score").notNull().default(0),
  ageScore: integer("age_score").notNull().default(0),
  componentsJson: jsonb("components_json").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
