import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const aiMemoryTable = pgTable("ai_memory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull().default("client"),
  key: text("key").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
