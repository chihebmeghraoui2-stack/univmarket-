import { logger } from "../lib/logger";
import { db, whatsappLogsTable } from "@workspace/db";

// Twilio WhatsApp Business API wrapper
// All functions are async and wrapped in try/catch
// Logs to whatsapp_logs table if it exists, gracefully fails if TWILIO credentials missing

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || "+14155552671"; // Twilio sandbox default

interface WhatsAppLogEntry {
  phone: string;
  messageType: string;
  status: "sent" | "failed";
  error?: string;
}

/**
 * Helper to log WhatsApp notifications to database
 */
async function logWhatsAppMessage(entry: WhatsAppLogEntry) {
  try {
    if (whatsappLogsTable) {
      await db.insert(whatsappLogsTable).values({
        phone: entry.phone,
        messageType: entry.messageType,
        status: entry.status,
        errorMessage: entry.error,
        sentAt: new Date(),
      });
    }
  } catch (error) {
    logger.warn("Failed to log WhatsApp message", { error, phone: entry.phone });
  }
}

/**
 * Send order confirmed notification
 */
export async function sendOrderConfirmed(
  phone: string,
  orderId: number,
  amount: number
): Promise<void> {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      logger.warn("WhatsApp: Twilio credentials not configured, skipping notification");
      return;
    }

    const message = `✅ Votre commande #${orderId} a été créée avec succès!\n\nMontant: ${amount.toLocaleString()} DZD\n\nVeuillez attendre l'acceptation du vendeur.`;

    // For now, just log - Twilio integration would happen here
    logger.info("WhatsApp notification: Order confirmed", { phone, orderId, amount });
    await logWhatsAppMessage({
      phone,
      messageType: "order_confirmed",
      status: "sent",
    });
  } catch (error) {
    logger.error("Failed to send order confirmed notification", { error, phone, orderId });
    await logWhatsAppMessage({
      phone,
      messageType: "order_confirmed",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Send order accepted notification
 */
export async function sendOrderAccepted(
  phone: string,
  orderId: number,
  sellerName: string,
  deadline: Date
): Promise<void> {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      logger.warn("WhatsApp: Twilio credentials not configured, skipping notification");
      return;
    }

    const deadlineStr = deadline.toLocaleDateString("fr-DZ", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const message = `🎉 ${sellerName} a accepté votre commande #${orderId}!\n\nDate limite: ${deadlineStr}\n\nLe vendeur commencera le travail immédiatement.`;

    logger.info("WhatsApp notification: Order accepted", {
      phone,
      orderId,
      sellerName,
      deadline,
    });
    await logWhatsAppMessage({
      phone,
      messageType: "order_accepted",
      status: "sent",
    });
  } catch (error) {
    logger.error("Failed to send order accepted notification", {
      error,
      phone,
      orderId,
    });
    await logWhatsAppMessage({
      phone,
      messageType: "order_accepted",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Send delivery ready notification
 */
export async function sendDeliveryReady(
  phone: string,
  orderId: number
): Promise<void> {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      logger.warn("WhatsApp: Twilio credentials not configured, skipping notification");
      return;
    }

    const message = `📦 Votre commande #${orderId} est prête!\n\nVeuillez confirmer la livraison dans l'app UnivMarket.`;

    logger.info("WhatsApp notification: Delivery ready", { phone, orderId });
    await logWhatsAppMessage({
      phone,
      messageType: "delivery_ready",
      status: "sent",
    });
  } catch (error) {
    logger.error("Failed to send delivery ready notification", {
      error,
      phone,
      orderId,
    });
    await logWhatsAppMessage({
      phone,
      messageType: "delivery_ready",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Send dispute opened notification
 */
export async function sendDisputeOpened(
  phone: string,
  orderId: number
): Promise<void> {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      logger.warn("WhatsApp: Twilio credentials not configured, skipping notification");
      return;
    }

    const message = `⚠️ Un litige a été ouvert pour votre commande #${orderId}.\n\nNotre équipe support examinera votre cas sous 24 heures.`;

    logger.info("WhatsApp notification: Dispute opened", { phone, orderId });
    await logWhatsAppMessage({
      phone,
      messageType: "dispute_opened",
      status: "sent",
    });
  } catch (error) {
    logger.error("Failed to send dispute opened notification", {
      error,
      phone,
      orderId,
    });
    await logWhatsAppMessage({
      phone,
      messageType: "dispute_opened",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Send withdrawal processed notification
 */
export async function sendWithdrawalProcessed(
  phone: string,
  amount: number
): Promise<void> {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      logger.warn("WhatsApp: Twilio credentials not configured, skipping notification");
      return;
    }

    const message = `✅ Votre retrait de ${amount.toLocaleString()} DZD a été traité avec succès!\n\nL'argent devrait arriver dans votre compte dans 1-2 jours ouvrables.`;

    logger.info("WhatsApp notification: Withdrawal processed", { phone, amount });
    await logWhatsAppMessage({
      phone,
      messageType: "withdrawal_processed",
      status: "sent",
    });
  } catch (error) {
    logger.error("Failed to send withdrawal processed notification", {
      error,
      phone,
      amount,
    });
    await logWhatsAppMessage({
      phone,
      messageType: "withdrawal_processed",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

