import { pgTable, serial, integer, text, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const sellerProfilesTable = pgTable("seller_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  bio: text("bio"),
  skills: text("skills").array(),
  portfolio: jsonb("portfolio"),
  trustScore: decimal("trust_score", { precision: 3, scale: 1 }).default("0"),
  totalOrders: integer("total_orders").default(0),
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }).default("0"),
  responseTime: integer("response_time_minutes").default(0),
  isVerified: boolean("is_verified").default(false),
  verificationDocs: jsonb("verification_docs"),
  badges: text("badges").array(),
  availableDays: text("available_days").array(),
  availableHours: jsonb("available_hours"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contractsTable = pgTable("contracts", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  clientId: integer("client_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  deliveryDays: integer("delivery_days").notNull(),
  terms: text("terms"),
  clientSignedAt: timestamp("client_signed_at"),
  sellerSignedAt: timestamp("seller_signed_at"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fileDeliveriesTable = pgTable("file_deliveries", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  storagePath: text("storage_path").notNull(),
  downloadToken: text("download_token").notNull().unique(),
  downloadCount: integer("download_count").default(0),
  maxDownloads: integer("max_downloads").default(3),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
