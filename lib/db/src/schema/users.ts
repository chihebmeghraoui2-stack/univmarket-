import { pgTable, serial, text, varchar, boolean, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("client"), // client, seller, admin
  wilayaId: integer("wilaya_id").notNull(),
  avatar: text("avatar"),
  phone: text("phone"),
  bio: text("bio"),
  verifiedAt: text("verified_at"),
  bannedAt: text("banned_at"),
  bannedReason: text("banned_reason"),
  languagePreference: text("language_preference").notNull().default("fr"),
  trustScore: real("trust_score"),
  referralCode: text("referral_code"),
  whatsappPhone: text("whatsapp_phone"),
  resetCode: varchar("reset_code", { length: 5 }),
  resetCodeExpires: timestamp("reset_code_expires", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

// Badges
export const badgesTable = pgTable("badges", {
  id: serial("id").primaryKey(),
  nameFr: text("name_fr").notNull(),
  nameAr: text("name_ar"),
  icon: text("icon").notNull(),
  conditionType: text("condition_type").notNull(),
  conditionValue: integer("condition_value"),
  color: text("color").notNull().default("gold"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Badge = typeof badgesTable.$inferSelect;

export const userBadgesTable = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeId: integer("badge_id").notNull(),
  awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserBadge = typeof userBadgesTable.$inferSelect;

// Sessions (simple token-based)
export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export type Session = typeof sessionsTable.$inferSelect;
