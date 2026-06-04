import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const waitingListTable = pgTable("waiting_list", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  wilayaId: integer("wilaya_id"),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  notifiedAt: timestamp("notified_at", { withTimezone: true }),
});
