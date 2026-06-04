import { pgTable, serial, text, decimal, integer, timestamp } from "drizzle-orm/pg-core";

export const backupLogsTable = pgTable("backup_logs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  fileUrl: text("file_url"),
  sizeMb: decimal("size_mb", { precision: 10, scale: 2 }).default("0"),
  durationSeconds: integer("duration_seconds").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
