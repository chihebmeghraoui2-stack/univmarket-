import { pgTable, serial, integer, text, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

// ========== AFFILIATION 3 NIVEAUX ==========
export const affiliationsTable = pgTable("affiliations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  referrerId: integer("referrer_id").notNull(),
  level: integer("level").notNull(), // 1, 2, 3
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  totalEarned: decimal("total_earned", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const affiliationEarningsTable = pgTable("affiliation_earnings", {
  id: serial("id").primaryKey(),
  affiliationId: integer("affiliation_id").notNull(),
  orderId: integer("order_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, paid
  createdAt: timestamp("created_at").defaultNow(),
});

// ========== ANALYTICS VENDEUR ==========
export const sellerAnalyticsTable = pgTable("seller_analytics", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  views: integer("views").default(0),
  clicks: integer("clicks").default(0),
  orders: integer("orders").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0"),
  avgOrderValue: decimal("avg_order_value", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ========== BLOG / CMS ==========
export const blogPostsTable = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull(),
  titleFr: text("title_fr").notNull(),
  titleAr: text("title_ar"),
  slugFr: text("slug_fr").notNull().unique(),
  contentFr: text("content_fr").notNull(),
  contentAr: text("content_ar"),
  excerpt: text("excerpt"),
  coverImage: text("cover_image"),
  tags: text("tags").array(),
  status: text("status").notNull().default("draft"), // draft, published
  publishedAt: timestamp("published_at"),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ========== 2FA ==========
export const twoFactorTable = pgTable("two_factor", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  secret: text("secret").notNull(),
  isEnabled: boolean("is_enabled").default(false),
  backupCodes: text("backup_codes").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
