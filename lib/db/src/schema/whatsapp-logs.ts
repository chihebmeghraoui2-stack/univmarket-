import { pgTable, serial, integer, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const whatsappLogsTable = pgTable("whatsapp_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  phone: text("phone").notNull(),
  template: text("template").notNull(),
  paramsJson: jsonb("params_json").notNull().default({}),
  status: text("status").notNull().default("pending"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
