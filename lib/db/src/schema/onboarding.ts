import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const sellerOnboardingProgressTable = pgTable("seller_onboarding_progress", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull(),
  stepsCompleted: text("steps_completed").array().notNull().default([]),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  mentorId: integer("mentor_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
