import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const deliveryCertificatesTable = pgTable("delivery_certificates", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  pdfUrl: text("pdf_url").notNull(),
  qrCode: text("qr_code"),
  verificationUrl: text("verification_url"),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  verifiedCount: integer("verified_count").notNull().default(0),
});
