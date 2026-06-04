import { pgTable, serial, integer, text, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull(),
  wilayaId: integer("wilaya_id").notNull(),
  categoryId: integer("category_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  coverPhoto: text("cover_photo"),
  location: text("location"),
  photos: text("photos").array(),
  status: text("status").notNull().default("active"),
  views: integer("views").notNull().default(0),
  isApproved: boolean("is_approved").notNull().default(true),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productChatsTable = pgTable("product_chats", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  clientId: integer("client_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  status: text("status").notNull().default("active"),
  clientValidated: boolean("client_validated").notNull().default(false),
  sellerAccepted: boolean("seller_accepted").notNull().default(false),
  clientRefused: boolean("client_refused").notNull().default(false),
  sellerRefused: boolean("seller_refused").notNull().default(false),
  orderId: integer("order_id"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  deleteAt: timestamp("delete_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productChatMessagesTable = pgTable("product_chat_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  senderId: integer("sender_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productChatArchivesTable = pgTable("product_chat_archives", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  productId: integer("product_id").notNull(),
  clientId: integer("client_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  messages: jsonb("messages").notNull(),
  status: text("status").notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }).notNull().defaultNow(),
  deleteAt: timestamp("delete_at", { withTimezone: true }).notNull(),
});
