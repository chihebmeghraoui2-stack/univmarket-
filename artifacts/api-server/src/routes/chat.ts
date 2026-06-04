import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { messagesTable, ordersTable, usersTable } from "@workspace/db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { containsProfanity } from "../services/profanity";

const router: IRouter = Router();

// GET /chat/conversations — liste toutes les conversations de l'utilisateur
router.get("/chat/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  try {
    // Récupère toutes les commandes où l'user est client ou vendeur
    const orders = await db
      .select({
        orderId: ordersTable.id,
        clientId: ordersTable.clientId,
        sellerId: ordersTable.sellerId,
        status: ordersTable.status,
      })
      .from(ordersTable)
      .where(or(eq(ordersTable.clientId, userId), eq(ordersTable.sellerId, userId)));

    // Pour chaque commande, récupère le dernier message
    const conversations = await Promise.all(
      orders.map(async (order) => {
        const lastMsg = await db
          .select()
          .from(messagesTable)
          .where(eq(messagesTable.orderId, order.orderId))
          .orderBy(desc(messagesTable.createdAt))
          .limit(1);

        const otherUserId = order.clientId === userId ? order.sellerId : order.clientId;
        const otherUser = await db
          .select({ id: usersTable.id, name: usersTable.name, avatar: usersTable.avatar })
          .from(usersTable)
          .where(eq(usersTable.id, otherUserId))
          .limit(1);

        const unreadCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(messagesTable)
          .where(
            and(
              eq(messagesTable.orderId, order.orderId),
              eq(messagesTable.isRead, false),
              sql`${messagesTable.senderId} != ${userId}`
            )
          );

        return {
          orderId: order.orderId,
          orderStatus: order.status,
          otherUser: otherUser[0] || null,
          lastMessage: lastMsg[0] || null,
          unreadCount: Number(unreadCount[0]?.count || 0),
        };
      })
    );

    // Trier par dernier message
    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /chat/messages/:orderId — messages d'une commande
router.get("/chat/messages/:orderId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const orderId = Number(req.params.orderId);

  try {
    // Vérifier que l'user fait partie de cette commande
    const order = await db
      .select()
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.id, orderId),
          or(eq(ordersTable.clientId, userId), eq(ordersTable.sellerId, userId))
        )
      )
      .limit(1);

    if (!order.length) {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }

    const messages = await db
      .select({
        id: messagesTable.id,
        orderId: messagesTable.orderId,
        senderId: messagesTable.senderId,
        body: messagesTable.body,
        isRead: messagesTable.isRead,
        createdAt: messagesTable.createdAt,
        sender: {
          id: usersTable.id,
          name: usersTable.name,
          avatar: usersTable.avatar,
        },
      })
      .from(messagesTable)
      .leftJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
      .where(eq(messagesTable.orderId, orderId))
      .orderBy(messagesTable.createdAt);

    // Marquer comme lus les messages de l'autre utilisateur
    await db
      .update(messagesTable)
      .set({ isRead: true })
      .where(
        and(
          eq(messagesTable.orderId, orderId),
          eq(messagesTable.isRead, false),
          sql`${messagesTable.senderId} != ${userId}`
        )
      );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /chat/messages/:orderId — envoyer un message
router.post("/chat/messages/:orderId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const orderId = Number(req.params.orderId);
  const { body } = req.body;

  if (!body || !body.trim()) {
    res.status(400).json({ error: "Message vide" });
    return;
  }

  try {
    // Vérifier que l'user fait partie de cette commande
    const order = await db
      .select()
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.id, orderId),
          or(eq(ordersTable.clientId, userId), eq(ordersTable.sellerId, userId))
        )
      )
      .limit(1);

    if (!order.length) {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }

    const [message] = await db
      .insert(messagesTable)
      .values({
        orderId,
        senderId: userId,
        body: body.trim(),
        isRead: false,
      })
      .returning();

    // Récupère les infos du sender
    const sender = await db
      .select({ id: usersTable.id, name: usersTable.name, avatar: usersTable.avatar })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    res.status(201).json({ ...message, sender: sender[0] });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});


// Route g�n�ration description IA
router.post("/api/ai/generate-description", async (req, res) => {
  try {
    const { keywords, language = "fr" } = req.body;
    if (!keywords) return res.status(400).json({ error: "Mots-cl�s requis" });

    const prompt = language === "ar"
      ? `���� ����� ��������� ����� ������ ����� ��� ��� ������� ���������: ${keywords}. ����� ��� �� ���� �� 3 ��� 5 ���.`
      : `G�n�re une description professionnelle pour un service universitaire alg�rien bas� sur ces mots-cl�s: ${keywords}. La description doit faire 3 � 5 phrases, �tre convaincante et professionnelle.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return res.json({ description: data.content?.[0]?.text || "" });
      }
    } catch {}

    // Fallback si pas de cl� API
    res.json({
      description: `Service professionnel sp�cialis� en ${keywords}. Nous offrons une expertise de qualit� adapt�e aux besoins des �tudiants et professionnels alg�riens. Notre engagement est de vous fournir un travail soign�, dans les d�lais convenus, avec un suivi personnalis�. N'h�sitez pas � nous contacter pour discuter de votre projet.`
    });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;

