import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const betaInvitationsTable = pgTable("beta_invitations", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull().unique(),
  wilayaId: integer("wilaya_id"),
  usedAt: timestamp("used_at", { withTimezone: true }),
  invitedBy: integer("invited_by"),
  role: text("role"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
