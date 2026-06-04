import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  productsTable,
  servicesTable,
  productChatsTable,
  productChatMessagesTable,
  productChatArchivesTable,
  notificationsTable,
  sellerTrustScoresTable,
  usersTable,
  ordersTable,
  wilayasTable,
  categoriesTable,
} from "@workspace/db";
import { eq, and, or, desc, sql, lt } from "drizzle-orm";
import { requireAuth, requireSeller, requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

async function cleanupExpiredArchives() {
  await db.delete(productChatArchivesTable).where(lt(productChatArchivesTable.deleteAt, new Date()));
}

router.use(async (req, res, next) => {
  await cleanupExpiredArchives();
  next();
});

router.get("/products", async (req, res): Promise<void> => {
  try {
    const { categoryId, wilayaId, minPrice, maxPrice, sellerId } = req.query;
    const conditions = [eq(productsTable.status, "active")];

    if (categoryId) conditions.push(eq(productsTable.categoryId, Number(categoryId)));
    if (wilayaId) conditions.push(eq(productsTable.wilayaId, Number(wilayaId)));
    if (sellerId) conditions.push(eq(productsTable.sellerId, Number(sellerId)));
    if (minPrice) conditions.push(productsTable.price.gte(Number(minPrice)));
    if (maxPrice) conditions.push(productsTable.price.lte(Number(maxPrice)));

    let query = db
      .select({
        id: productsTable.id,
        title: productsTable.title,
        coverPhoto: productsTable.coverPhoto,
        price: productsTable.price,
        wilaya: {
          id: wilayasTable.id,
          nameFr: wilayasTable.nameFr,
        },
        seller: {
          id: usersTable.id,
          name: usersTable.name,
          avatar: usersTable.avatar,
          verifiedAt: usersTable.verifiedAt,
        },
      })
      .from(productsTable)
      .leftJoin(usersTable, eq(usersTable.id, productsTable.sellerId))
      .leftJoin(wilayasTable, eq(wilayasTable.id, productsTable.wilayaId))
      .orderBy(desc(productsTable.createdAt));

    if (conditions.length) {
      query = query.where(and(...conditions));
    }

    const products = await query;
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/seller/products", requireSeller, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const products = await db
      .select({
        id: productsTable.id,
        title: productsTable.title,
        description: productsTable.description,
        price: productsTable.price,
        coverPhoto: productsTable.coverPhoto,
        photos: productsTable.photos,
        status: productsTable.status,
        categoryId: productsTable.categoryId,
        wilayaId: productsTable.wilayaId,
        views: productsTable.views,
        createdAt: productsTable.createdAt,
      })
      .from(productsTable)
      .where(eq(productsTable.sellerId, userId))
      .orderBy(desc(productsTable.createdAt));

    res.json(products);
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/products/:id", async (req, res): Promise<void> => {
  try {
    const productId = Number(req.params.id);
    const [product] = await db
      .select({
        id: productsTable.id,
        title: productsTable.title,
        description: productsTable.description,
        price: productsTable.price,
        coverPhoto: productsTable.coverPhoto,
        photos: productsTable.photos,
        views: productsTable.views,
        status: productsTable.status,
        categoryId: productsTable.categoryId,
        wilaya: {
          id: wilayasTable.id,
          nameFr: wilayasTable.nameFr,
        },
        seller: {
          id: usersTable.id,
          name: usersTable.name,
          avatar: usersTable.avatar,
          phone: usersTable.phone,
          bio: usersTable.bio,
          verifiedAt: usersTable.verifiedAt,
          trustScore: usersTable.trustScore,
        },
      })
      .from(productsTable)
      .leftJoin(usersTable, eq(usersTable.id, productsTable.sellerId))
      .leftJoin(wilayasTable, eq(wilayasTable.id, productsTable.wilayaId))
      .where(and(eq(productsTable.id, productId), eq(productsTable.status, "active")))
      .limit(1);

    if (!product) {
      res.status(404).json({ error: "Produit introuvable" });
      return;
    }

    await db
      .update(productsTable)
      .set({ views: sql`${productsTable.views} + 1` })
      .where(eq(productsTable.id, productId));

    res.json(product);
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/products", requireSeller, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { title, description, price, coverPhoto, photos, categoryId, wilayaId, location } = req.body;

    if (!title || !description || !price || !coverPhoto || !Array.isArray(photos)) {
      res.status(400).json({ error: "Champs requis manquants" });
      return;
    }

    if (photos.length < 3 || photos.length > 5) {
      res.status(400).json({ error: "Photos : minimum 3, maximum 5" });
      return;
    }

    if (!photos.includes(coverPhoto)) {
      res.status(400).json({ error: "La photo de couverture doit figurer dans les photos" });
      return;
    }

    const [product] = await db
      .insert(productsTable)
      .values({
        sellerId: userId,
        title,
        description,
        price: Number(price),
        coverPhoto,
        photos,
        categoryId: categoryId ? Number(categoryId) : null,
        wilayaId: Number(wilayaId),
      })
      .returning();

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: "Erreur création produit" });
  }
});

router.put("/products/:id", requireSeller, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const productId = Number(req.params.id);
    const { title, description, price, coverPhoto, photos, categoryId, wilayaId, status, location } = req.body;

    if (!title || !description || !price || !coverPhoto || !Array.isArray(photos)) {
      res.status(400).json({ error: "Champs requis manquants" });
      return;
    }

    if (photos.length < 3 || photos.length > 5) {
      res.status(400).json({ error: "Photos : minimum 3, maximum 5" });
      return;
    }

    if (!photos.includes(coverPhoto)) {
      res.status(400).json({ error: "La photo de couverture doit figurer dans les photos" });
      return;
    }

    const [existing] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (!existing || existing.sellerId !== userId) {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }

    const [product] = await db
      .update(productsTable)
      .set({
        title,
        description,
        price: Number(price),
        coverPhoto,
        photos,
        categoryId: categoryId ? Number(categoryId) : null,
        wilayaId: Number(wilayaId),
        status: status || existing.status,
        updatedAt: new Date(),
      })
      .where(eq(productsTable.id, productId))
      .returning();

    res.json(product[0] || existing);
  } catch {
    res.status(500).json({ error: "Erreur mise à jour produit" });
  }
});

router.delete("/products/:id", requireSeller, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const productId = Number(req.params.id);
    const [existing] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (!existing || existing.sellerId !== userId) {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }

    await db.delete(productsTable).where(eq(productsTable.id, productId));
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Erreur suppression produit" });
  }
});

router.post("/product-chats/service/:serviceId/contact", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const serviceId = Number(req.params.serviceId);
    const [service] = await db
      .select({ sellerId: servicesTable.sellerId, status: servicesTable.status })
      .from(servicesTable)
      .where(eq(servicesTable.id, serviceId))
      .limit(1);

    if (!service || service.status !== "approved") {
      res.status(404).json({ error: "Service introuvable" });
      return;
    }

    if (service.sellerId === userId) {
      res.status(400).json({ error: "Vous ne pouvez pas contacter votre propre service" });
      return;
    }

    const [existingChat] = await db
      .select()
      .from(productChatsTable)
      .where(
        and(
          eq(productChatsTable.productId, serviceId),
          eq(productChatsTable.clientId, userId),
          eq(productChatsTable.sellerId, service.sellerId),
          eq(productChatsTable.status, "active"),
        ),
      )
      .limit(1);

    if (existingChat) {
      res.json({ chatId: existingChat.id, existing: true });
      return;
    }

    const [chat] = await db
      .insert(productChatsTable)
      .values({
        productId: serviceId,
        clientId: userId,
        sellerId: service.sellerId,
      })
      .returning();

    res.status(201).json({ chatId: chat.id, existing: false });
  } catch {
    res.status(500).json({ error: "Erreur création chat" });
  }
});

router.post("/products/:id/contact", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const productId = Number(req.params.id);
    const [product] = await db
      .select({ sellerId: productsTable.sellerId })
      .from(productsTable)
      .where(and(eq(productsTable.id, productId), eq(productsTable.status, "active")))
      .limit(1);

    if (!product) {
      res.status(404).json({ error: "Produit introuvable" });
      return;
    }

    if (product.sellerId === userId) {
      res.status(400).json({ error: "Vous ne pouvez pas contacter votre propre produit" });
      return;
    }

    const [existingChat] = await db
      .select()
      .from(productChatsTable)
      .where(
        and(
          eq(productChatsTable.productId, productId),
          eq(productChatsTable.clientId, userId),
          eq(productChatsTable.sellerId, product.sellerId),
          eq(productChatsTable.status, "active"),
        ),
      )
      .limit(1);

    if (existingChat) {
      res.json({ chatId: existingChat.id, existing: true });
      return;
    }

    const [chat] = await db
      .insert(productChatsTable)
      .values({
        productId,
        clientId: userId,
        sellerId: product.sellerId,
      })
      .returning();

    res.status(201).json({ chatId: chat.id, existing: false });
  } catch {
    res.status(500).json({ error: "Erreur création chat" });
  }
});

router.get("/product-chats", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const chats = await db
      .select()
      .from(productChatsTable)
      .where(or(eq(productChatsTable.clientId, userId), eq(productChatsTable.sellerId, userId)))
      .orderBy(desc(productChatsTable.createdAt));

    const results = await Promise.all(
      chats.map(async (chat) => {
        const otherUserId = chat.clientId === userId ? chat.sellerId : chat.clientId;
        const [otherUser] = await db
          .select({ id: usersTable.id, name: usersTable.name, avatar: usersTable.avatar })
          .from(usersTable)
          .where(eq(usersTable.id, otherUserId))
          .limit(1);

        const [product] = await db
          .select({ id: productsTable.id, title: productsTable.title, coverPhoto: productsTable.coverPhoto, price: productsTable.price })
          .from(productsTable)
          .where(eq(productsTable.id, chat.productId))
          .limit(1);

        return {
          id: chat.id,
          product,
          otherUser,
          status: chat.status,
          clientValidated: chat.clientValidated,
          sellerAccepted: chat.sellerAccepted,
          clientRefused: chat.clientRefused,
          sellerRefused: chat.sellerRefused,
          createdAt: chat.createdAt,
        };
      }),
    );

    res.json(results);
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/product-chats/:id/messages", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const chatId = Number(req.params.id);

    const [chat] = await db
      .select()
      .from(productChatsTable)
      .where(
        and(
          eq(productChatsTable.id, chatId),
          or(eq(productChatsTable.clientId, userId), eq(productChatsTable.sellerId, userId)),
        ),
      )
      .limit(1);

    if (!chat) {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }

    const messages = await db
      .select({
        id: productChatMessagesTable.id,
        senderId: productChatMessagesTable.senderId,
        body: productChatMessagesTable.body,
        createdAt: productChatMessagesTable.createdAt,
        sender: {
          id: usersTable.id,
          name: usersTable.name,
          avatar: usersTable.avatar,
        },
      })
      .from(productChatMessagesTable)
      .leftJoin(usersTable, eq(usersTable.id, productChatMessagesTable.senderId))
      .where(eq(productChatMessagesTable.chatId, chatId))
      .orderBy(productChatMessagesTable.createdAt);

    const [product] = await db
      .select({ id: productsTable.id, title: productsTable.title, coverPhoto: productsTable.coverPhoto, price: productsTable.price })
      .from(productsTable)
      .where(eq(productsTable.id, chat.productId))
      .limit(1);

    let service = null;
    if (!product) {
      const serviceRows = await db
        .select({ id: servicesTable.id, title: servicesTable.titleFr, images: servicesTable.images, price: servicesTable.price })
        .from(servicesTable)
        .where(eq(servicesTable.id, chat.productId))
        .limit(1);
      service = serviceRows[0] || null;
    }

    const item = product
      ? product
      : service
        ? {
            id: service.id,
            title: service.title,
            coverPhoto: Array.isArray(service.images) ? service.images[0] ?? null : null,
            price: service.price,
          }
        : null;

    res.json({
      chat: {
        id: chat.id,
        product: product ?? item,
        serviceId: service ? service.id : undefined,
        clientId: chat.clientId,
        sellerId: chat.sellerId,
        status: chat.status,
        clientValidated: chat.clientValidated,
        sellerAccepted: chat.sellerAccepted,
        clientRefused: chat.clientRefused,
        sellerRefused: chat.sellerRefused,
      },
      messages,
    });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/product-chats/:id/messages", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const chatId = Number(req.params.id);
    const { body } = req.body;

    if (!body || !body.trim()) {
      res.status(400).json({ error: "Message vide" });
      return;
    }

    const [chat] = await db
      .select()
      .from(productChatsTable)
      .where(
        and(
          eq(productChatsTable.id, chatId),
          or(eq(productChatsTable.clientId, userId), eq(productChatsTable.sellerId, userId)),
        ),
      )
      .limit(1);

    if (!chat || chat.status !== "active") {
      res.status(403).json({ error: "Chat fermé ou introuvable" });
      return;
    }

    const [message] = await db
      .insert(productChatMessagesTable)
      .values({ chatId, senderId: userId, body: body.trim() })
      .returning();

    const [sender] = await db
      .select({ id: usersTable.id, name: usersTable.name, avatar: usersTable.avatar })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const recipientId = userId === chat.clientId ? chat.sellerId : chat.clientId;
    try {
      await db.insert(notificationsTable).values({
        userId: recipientId,
        type: "new_message",
        title: "Nouveau message de " + (sender?.name || "quelqu un"),
        body: body.trim().slice(0, 100),
        link: "/product-chat/" + chatId,
      });
    } catch(e) { console.error("NOTIF ERROR DETAILS:", JSON.stringify(e, Object.getOwnPropertyNames(e))); }
    res.status(201).json({ ...message, sender: sender || null });
  } catch {
    res.status(500).json({ error: "Erreur envoi message" });
  }
});

async function archiveChat(chat: any, status: "accepted" | "refused") {
  const messages = await db
    .select({ senderId: productChatMessagesTable.senderId, body: productChatMessagesTable.body, createdAt: productChatMessagesTable.createdAt })
    .from(productChatMessagesTable)
    .where(eq(productChatMessagesTable.chatId, chat.id))
    .orderBy(productChatMessagesTable.createdAt);

  const archivePayload = {
    chatId: chat.id,
    productId: chat.productId,
    clientId: chat.clientId,
    sellerId: chat.sellerId,
    messages,
    status,
    archivedAt: new Date(),
    deleteAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  await db.insert(productChatArchivesTable).values(archivePayload);
  await db.delete(productChatMessagesTable).where(eq(productChatMessagesTable.chatId, chat.id));
  await db.delete(productChatsTable).where(eq(productChatsTable.id, chat.id));

  if (status === "accepted") {
    const [currentScore] = await db
      .select()
      .from(sellerTrustScoresTable)
      .where(eq(sellerTrustScoresTable.sellerId, chat.sellerId))
      .limit(1);

    if (currentScore) {
      await db
        .update(sellerTrustScoresTable)
        .set({ score: Number(currentScore.score) + 1, updatedAt: new Date() })
        .where(eq(sellerTrustScoresTable.id, currentScore.id));
    } else {
      await db.insert(sellerTrustScoresTable).values({ sellerId: chat.sellerId, score: 1 });
    }
    // Mettre a jour aussi usersTable.trustScore
    const newScore = currentScore ? Number(currentScore.score) + 1 : 1;
    await db.update(usersTable).set({ trustScore: newScore }).where(eq(usersTable.id, chat.sellerId));

    try {
      // Chercher dans servicesTable d abord, puis productsTable
      const [svcInfo] = await db
        .select({ price: servicesTable.price, titleFr: servicesTable.titleFr, wilayaId: servicesTable.wilayaId })
        .from(servicesTable)
        .where(eq(servicesTable.id, chat.productId))
        .limit(1);
      const [prodInfo] = !svcInfo ? await db
        .select({ price: productsTable.price, title: productsTable.title, wilayaId: productsTable.wilayaId })
        .from(productsTable)
        .where(eq(productsTable.id, chat.productId))
        .limit(1) : [null];
      const info = svcInfo ? { price: svcInfo.price, title: svcInfo.titleFr, wilayaId: svcInfo.wilayaId } : prodInfo ? { price: prodInfo.price, title: prodInfo.title, wilayaId: prodInfo.wilayaId } : null;
      if (info && Number(info.price) > 0) {
        const price = Number(info.price);
        const commission = Math.round(price * 0.05);
        await db.insert(ordersTable).values({
          clientId: chat.clientId,
          sellerId: chat.sellerId,
          serviceId: chat.productId,
          wilayaId: info.wilayaId ?? 1,
          totalPrice: String(price),
          commissionAmount: String(commission),
          status: "completed",
          paymentMethod: "escrow",
          notes: "Commande: " + (info.title ?? ""),
        });
        console.log("Order created:", info.title, price, "DZD");
      }
    } catch(e) { console.log("order insert error:", e); }

    // Creer une commande dans ordersTable pour les stats
    try {
      const [productInfo] = await db.select({ price: productsTable.price, title: productsTable.title })
        .from(productsTable).where(eq(productsTable.id, chat.productId)).limit(1);
      const price = productInfo?.price ?? 0;
      const commission = Math.round(price * 0.05);
      await db.insert(ordersTable).values({
        clientId: chat.clientId,
        sellerId: chat.sellerId,
        serviceId: chat.productId,
        wilayaId: 1,
        totalPrice: String(price),
        commissionAmount: String(commission),
        status: "completed",
        paymentMethod: "escrow",
        notes: "Commande produit: " + (productInfo?.title ?? ""),
      });
    } catch(e) { console.log("order insert error:", e); }

    const [seller] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, chat.sellerId))
      .limit(1);

    const [client] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, chat.clientId))
      .limit(1);

    const [product] = await db
      .select({ title: productsTable.title })
      .from(productsTable)
      .where(eq(productsTable.id, chat.productId))
      .limit(1);

    const admins = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, "admin"));

    const notifications = [
      {
        userId: chat.sellerId,
        type: "product-chat",
        title: `Commande acceptée pour ${product?.title ?? "un produit"}`,
        body: `Votre commande a été validée avec ${client?.name ?? "un client"}. Score vendeur +1`,
        link: `/product-chat/${chat.id}`,
      },
      {
        userId: chat.clientId,
        type: "product-chat",
        title: `Commande confirmée pour ${product?.title ?? "un produit"}`,
        body: `Le vendeur ${seller?.name ?? "a confirmé"} a accepté la commande.`,
        link: `/product-chat/${chat.id}`,
      },
      ...admins.map((admin) => ({
        userId: admin.id,
        type: "admin",
        title: `Commande acceptée entre ${client?.name ?? "client"} et ${seller?.name ?? "vendeur"}`,
        body: `Commande acceptée pour ${product?.title ?? "un produit"} — Score vendeur +1`,
        link: "/admin/product-archives",
      })),
    ];

    await db.insert(notificationsTable).values(notifications);
  } else {
    const [seller] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, chat.sellerId))
      .limit(1);

    const [client] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, chat.clientId))
      .limit(1);

    const [product] = await db
      .select({ title: productsTable.title })
      .from(productsTable)
      .where(eq(productsTable.id, chat.productId))
      .limit(1);

    await db.insert(notificationsTable).values([
      {
        userId: chat.sellerId,
        type: "product-chat",
        title: `Commande refusée pour ${product?.title ?? "un produit"}`,
        body: `La discussion a été archivée en refusé.`,
        link: "/admin/product-archives",
      },
      {
        userId: chat.clientId,
        type: "product-chat",
        title: `Commande refusée pour ${product?.title ?? "un produit"}`,
        body: `La discussion a été archivée en refusé.`,
        link: "/admin/product-archives",
      },
    ]);
  }
}

router.post("/product-chats/:id/validate", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const chatId = Number(req.params.id);

    const [chat] = await db
      .select()
      .from(productChatsTable)
      .where(eq(productChatsTable.id, chatId))
      .limit(1);

    if (!chat || chat.clientId !== userId) {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }

    if (chat.clientValidated) {
      res.json({ message: "Commande déjà validée" });
      return;
    }

    await db
      .update(productChatsTable)
      .set({ clientValidated: true })
      .where(eq(productChatsTable.id, chatId));

    if (chat.sellerAccepted) {
      await archiveChat({ ...chat, clientValidated: true }, "accepted");
      res.json({ message: "Commande acceptée et archivée" });
      return;
    }

    res.json({ message: "Commande validée par le client" });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/product-chats/:id/accept", requireSeller, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const chatId = Number(req.params.id);

    const [chat] = await db
      .select()
      .from(productChatsTable)
      .where(eq(productChatsTable.id, chatId))
      .limit(1);

    if (!chat || chat.sellerId !== userId) {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }

    if (chat.sellerAccepted) {
      res.json({ message: "Commande déjà acceptée" });
      return;
    }

    await db
      .update(productChatsTable)
      .set({ sellerAccepted: true })
      .where(eq(productChatsTable.id, chatId));

    if (chat.clientValidated) {
      await archiveChat({ ...chat, sellerAccepted: true }, "accepted");
      res.json({ message: "Commande acceptée et archivée" });
      return;
    }

    res.json({ message: "Commande acceptée par le vendeur" });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/product-chats/:id/refuse", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const chatId = Number(req.params.id);

    const [chat] = await db
      .select()
      .from(productChatsTable)
      .where(eq(productChatsTable.id, chatId))
      .limit(1);

    if (!chat) {
      res.status(404).json({ error: "Chat introuvable" });
      return;
    }

    let update: any = {};
    if (chat.clientId === userId) {
      update.clientRefused = true;
    } else if (chat.sellerId === userId) {
      update.sellerRefused = true;
    } else {
      res.status(403).json({ error: "Accès refusé" });
      return;
    }

    await db.update(productChatsTable).set(update).where(eq(productChatsTable.id, chatId));
    await archiveChat({ ...chat, ...update }, "refused");

    res.json({ message: "Commande refusée et archivée" });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/admin/product-chat-archives", requireAdmin, async (req, res): Promise<void> => {
  try {
    const { status } = req.query;
    const conditions: any[] = [];
    if (status === "accepted" || status === "refused") {
      conditions.push(eq(productChatArchivesTable.status, status));
    }

    let query = db.select().from(productChatArchivesTable).orderBy(desc(productChatArchivesTable.archivedAt));
    if (conditions.length) query = query.where(and(...conditions));

    const archives = await query;

    const results = await Promise.all(
      archives.map(async (archive) => {
        const [client] = await db
          .select({ id: usersTable.id, name: usersTable.name, avatar: usersTable.avatar })
          .from(usersTable)
          .where(eq(usersTable.id, archive.clientId))
          .limit(1);

        const [seller] = await db
          .select({ id: usersTable.id, name: usersTable.name, avatar: usersTable.avatar })
          .from(usersTable)
          .where(eq(usersTable.id, archive.sellerId))
          .limit(1);

        const [product] = await db
          .select({ id: productsTable.id, title: productsTable.title, coverPhoto: productsTable.coverPhoto, price: productsTable.price })
          .from(productsTable)
          .where(eq(productsTable.id, archive.productId))
          .limit(1);

        return {
          ...archive,
          client,
          seller,
          product,
        };
      }),
    );

    res.json(results);
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/admin/product-chat-archives/:id/analyze", requireAdmin, async (req, res): Promise<void> => {
  try {
    const archiveId = parseInt(req.params.id);
    const [archive] = await db
      .select()
      .from(productChatArchivesTable)
      .where(eq(productChatArchivesTable.id, archiveId))
      .limit(1);

    if (!archive) {
      return res.status(404).json({ error: "Archive introuvable" });
    }

    const messages = (archive.messages ?? []) as any[];
    const conversationText = messages.map((m: any) => `[${m.senderId}]: ${m.body}`).join("\n");

    const [client] = await db
      .select({ name: usersTable.name, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, archive.clientId))
      .limit(1);

    const [seller] = await db
      .select({ name: usersTable.name, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, archive.sellerId))
      .limit(1);

    const systemPrompt = `Tu es un système de détection de fraude ultra-précis pour UnivMarket, plateforme universitaire algérienne.

MISSION: Analyser UNIQUEMENT les messages écrits par les utilisateurs dans la discussion. Ignorer complètement les noms, emails de profil et métadonnées système.

═══════════════════════════════════════
CATÉGORIE 1 — NUMÉROS DE TÉLÉPHONE
═══════════════════════════════════════
Formats algériens directs:
- 05xx xxxxxx, 06xx xxxxxx, 07xx xxxxxx
- +213 xxx xxx xxx, 00213 xxx xxx xxx
- Avec espaces: "05 55 12 34 56"
- Avec tirets: "05-55-12-34-56"
- Avec points: "05.55.12.34.56"

Formats masqués en français:
- "zero cinq cinq cinq", "zéro six", "05 cinq cinq douze"
- "mon numéro c'est le ...", "appelle-moi au ..."

Formats masqués en arabe/darija:
- "raqmi", "numroti", "numro dyali", "3andi numro"
- "whassbni", "klemni", "dir lik missed call", "3tini numrok"
- "راسلني", "رقمي", "نمرتي", "نمرو", "كلمني", "اتصل بي"

═══════════════════════════════════════
CATÉGORIE 2 — CONTACTS EXTERNES ET RÉSEAUX SOCIAUX
═══════════════════════════════════════
En français:
- Facebook: "sur facebook", "fb moi", "ma page fb", "facebook.com", "fb.com"
- Instagram: "sur insta", "mon insta", "@nom", "instagram.com"
- Gmail/Email: "@gmail.com", "@yahoo.fr", "@hotmail.com", "@outlook.com", toute adresse email
- Telegram: "sur telegram", "mon telegram", "t.me", "telegram.me"
- WhatsApp: "whatsapp moi", "wa moi", "sur whatsapp", "mon wa", "watsap"
- Tout lien: "http", "https", "www", ".com", ".dz", ".net", ".org"

En anglais:
- "call me", "my number", "phone me", "text me", "contact me on"
- "add me on", "follow me", "my instagram", "my facebook", "dm me", "message me on"
- "outside the platform", "directly", "without the app", "cash payment"

En arabe standard:
- "على الفايسبوك", "على الانستغرام", "تيليغرام", "واتساب", "الواتس"
- "فيسبوكي", "انستاي", "على الانستا", "ابعتلي على", "حسابي على"
- "بلا التطبيق", "بدون المنصة", "مباشرة", "برا التطبيق"

En darija algérienne (arabe):
- "الواتساب", "الواتس", "صيفطلي على", "روح راسلني", "عندي نمرة"

En darija algérienne (latin):
- "3la facebook", "3la insta", "3la telegram", "3la whatsapp", "3la wats"
- "instagrami", "fbki", "dir request", "add moi", "hasbabi"
- "bla application", "bla platform", "direct", "b cash", "bla wasita", "men barra"

Emails masqués:
- "chiheb [at] gmail", "chiheb arobase gmail", "chiheb @ gmail"
- "facebook point com", "insta point com slash mon_nom"

═══════════════════════════════════════
CATÉGORIE 3 — LIEUX GÉOGRAPHIQUES ALGÉRIENS
═══════════════════════════════════════
58 wilayas (détecter même partiellement):
Tlemcen, Oran, Alger, Constantine, Annaba, Sétif, Batna, Blida, Béjaïa, Tizi Ouzou, Skikda, Djelfa, Biskra, Médéa, Mostaganem, Mascara, Ouargla, Laghouat, Tiaret, Saïda, Sidi Bel Abbès, Relizane, Chlef, Boumerdès, Tipaza, Jijel, Guelma, Souk Ahras, El Oued, Khenchela, Mila, Bordj Bou Arréridj, Aïn Defla, Tissemsilt, Naâma, El Bayadh, Ghardaïa, Bouira, Illizi, Tamanrasset, Adrar, Béchar, Tindouf, Djanet, Touggourt, El Meniaa, El M'Ghair, In Salah, In Guezzam, Timimoun, Bordj Badji Mokhtar, Ouled Djellal, Béni Abbès

Communes et lieux précis:
Remchi, Hennaya, Maghnia, Ghazaouet, Sebdou, Nedroma, Bab El Oued, Kouba, Hydra, El Harrach, Rouiba, Ain Taya, Birtouta, Zeralda, Cheraga, Draria, Hussein Dey, El Biar, Bordj El Kiffan, Dar El Beïda, Baraki, Ain Beida, Khroub, El Eulma, Aïn Mlila, Bordj Bou Arreridj, Meftah, Larbaa, Bougara, Blida centre, Boufarik, Bouinan, Chebli, Birkhadem, Saoula, Dely Ibrahim, Ben Aknoun, Bouzareah, Bordj El Bahri, Reghaia

Expressions de lieu à détecter dans toutes les langues:
- Français: "je suis à", "habite à", "on se retrouve à", "viens à", "passe à", "quartier", "rue", "boulevard", "cité", "rendez-vous à"
- Anglais: "meet me at", "come to", "i live in", "i am in", "located in"
- Arabe: "عندي في", "نلتقي في", "جي عندي", "تعال لي", "في الحي", "في الشارع", "في البلاصة", "بلاصتي", "عند الدار", "في الدوار"
- Darija latin: "3andi f", "nji liya", "ta3la liya", "f tlemcen", "f wahran", "f dzayer", "fi bladi", "fi hay", "niltaqi m3ak fi", "ji liya"

IMPORTANT: Un lieu dans un contexte UNIQUEMENT académique (ex: "université de Tlemcen", "bibliothèque d'Oran") n'est une violation QUE si accompagné d'une proposition de rencontre physique.

═══════════════════════════════════════
CATÉGORIE 4 — TENTATIVES DE CONTOURNEMENT
═══════════════════════════════════════
- "sans la plateforme", "en dehors", "paye-moi directement", "cash", "virement direct"
- "on peut s'arranger", "entre nous", "sans commission", "je te fais un prix"
- "bla wasita", "men barra", "b cash", "direct", "bla platform"
- "بلا المنصة", "مباشرة", "بالكاش", "من برا"

═══════════════════════════════════════
RÈGLES STRICTES
═══════════════════════════════════════
1. Analyser UNIQUEMENT le contenu des messages, pas les métadonnées
2. Un numéro dans un contexte purement académique (numéro de page, référence) n'est PAS une violation
3. Si aucune violation → riskLevel = "none" et hasViolations = false
4. Être précis: copier le texte EXACT détecté dans "detected"

Répondre UNIQUEMENT en JSON valide:
{
  "hasViolations": true/false,
  "riskLevel": "none/low/medium/high/critical",
  "violations": [
    {
      "type": "phone/social_media/location/bypass",
      "severity": "low/medium/high/critical",
      "detected": "texte exact copié du message",
      "messageContext": "phrase complète du message contenant la violation",
      "description": "explication courte en français",
      "language": "fr/ar/darija/en"
    }
  ],
  "phoneDetected": true/false,
  "socialMediaDetected": true/false,
  "locationDetected": true/false,
  "bypassAttempt": true/false,
  "summary": "résumé en 1-2 phrases en français. Si aucune violation: Aucune violation détectée dans les messages.",
  "recommendation": "action recommandée à l'admin en français"
}`;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyse UNIQUEMENT les messages suivants écrits par les utilisateurs. Ignore les noms, emails de profil et toute métadonnée système affichée avant les messages.\n\nMessages de la discussion:\n${conversationText}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 2048,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqResponse.ok) {
      const err = await groqResponse.text();
      console.error("Groq error:", err);
      return res.status(500).json({ error: "Erreur IA" });
    }

    const groqData = await groqResponse.json();
    const analysisText = typeof groqData.choices?.[0]?.message?.content === "string"
      ? groqData.choices[0].message.content
      : "{}";

    let analysis: any;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      analysis = {
        hasViolations: false,
        riskLevel: "low",
        violations: [],
        summary: "Analyse échouée",
        recommendation: "Impossible de lire la réponse de l'IA.",
        bypassRisk: false,
        contactExchanged: false,
        locationShared: false,
      };
    }

    if (analysis.hasViolations && (analysis.phoneDetected || analysis.socialMediaDetected || analysis.locationDetected || analysis.bypassAttempt)) {
      const violationDetails = [];
      if (analysis.phoneDetected) violationDetails.push("📞 Numéro de téléphone");
      if (analysis.socialMediaDetected) violationDetails.push("📱 Contact externe");
      if (analysis.locationDetected) violationDetails.push("📍 Lieu géographique");
      if (analysis.bypassAttempt) violationDetails.push("⚠️ Contournement plateforme");
      const [admin] = await db.select().from(usersTable).where(eq(usersTable.role, "admin")).limit(1);
      if (admin) {
        await db.insert(notificationsTable).values({
          userId: admin.id,
          type: "fraud_detected",
          title: `⚠️ Violation détectée — Risque ${analysis.riskLevel?.toUpperCase()}`,
          body: `Discussion refusée entre ${client?.name} et ${seller?.name}: ${violationDetails.join(", ")}. Détecté: "${analysis.violations?.map((v: any) => v.detected).join('", "')}"`,
          isRead: false,
        });
      }
    }

    res.json({
      archiveId,
      client: client?.name,
      seller: seller?.name,
      analysis,
      analyzedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


// Initier chat depuis page service
router.post("/product-chats/service/:serviceId/contact", requireAuth, async (req, res) => {
  try {
    const clientId = (req as any).user.id;
    const serviceId = parseInt(req.params.serviceId);

    // Chercher le service pour avoir le sellerId
    const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, serviceId));
    if (!service) return res.status(404).json({ error: "Service introuvable" });
    if (service.sellerId === clientId) return res.status(400).json({ error: "Vous ne pouvez pas discuter avec vous-m�me" });

    // Chercher chat actif existant
    const [existing] = await db.select().from(productChatsTable).where(
      and(
        eq(productChatsTable.productId, serviceId),
        eq(productChatsTable.clientId, clientId),
        eq(productChatsTable.sellerId, service.sellerId),
        eq(productChatsTable.status, "active")
      )
    );

    if (existing) return res.json({ chatId: existing.id, existing: true });

    // Cr�er nouveau chat
    const [newChat] = await db.insert(productChatsTable).values({
      productId: serviceId,
      clientId,
      sellerId: service.sellerId,
      status: "active",
    }).returning();

    res.json({ chatId: newChat.id, existing: false });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


// ??? PRODUCT CHAT ROUTES ???

// GET messages d'un chat
router.get("/product-chats/:id/messages", requireAuth, async (req, res) => {
  try {
    const chatId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    const [chat] = await db.select().from(productChatsTable)
      .where(eq(productChatsTable.id, chatId));
    if (!chat) return res.status(404).json({ error: "Chat introuvable" });
    if (chat.clientId !== userId && chat.sellerId !== userId) {
      return res.status(403).json({ error: "Non autoris�" });
    }

    const messages = await db.select().from(productChatMessagesTable)
      .where(eq(productChatMessagesTable.chatId, chatId))
      .orderBy(productChatMessagesTable.createdAt);

    res.json({ chat, messages });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST envoyer un message
router.post("/product-chats/:id/messages", requireAuth, async (req, res) => {
  try {
    const chatId = parseInt(req.params.id);
    const userId = (req as any).user.id;
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: "Message vide" });

    const [chat] = await db.select().from(productChatsTable)
      .where(eq(productChatsTable.id, chatId));
    if (!chat) return res.status(404).json({ error: "Chat introuvable" });
    if (chat.clientId !== userId && chat.sellerId !== userId) {
      return res.status(403).json({ error: "Non autoris�" });
    }

    const [message] = await db.insert(productChatMessagesTable)
      .values({ chatId, senderId: userId, body })
      .returning();

    const recipientId = userId === chat.clientId ? chat.sellerId : chat.clientId;
    const [sender] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    try {
      await db.insert(notificationsTable).values({
        userId: recipientId,
        type: "new_message",
        title: "Nouveau message de " + (sender?.name || "quelqu un"),
        body: body.slice(0, 100),
        link: "/product-chat/" + chatId,
      });
    } catch(e) { console.error("notif error:", e); }

    res.json(message);
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST client valide la commande
router.post("/product-chats/:id/validate", requireAuth, async (req, res) => {
  try {
    const chatId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    const [chat] = await db.select().from(productChatsTable)
      .where(and(eq(productChatsTable.id, chatId), eq(productChatsTable.clientId, userId)));
    if (!chat) return res.status(404).json({ error: "Chat introuvable" });

    const [updated] = await db.update(productChatsTable)
      .set({ clientValidated: true })
      .where(eq(productChatsTable.id, chatId))
      .returning();

    if (updated.sellerAccepted) {
      // Archiver le chat
      const messages = await db.select().from(productChatMessagesTable)
        .where(eq(productChatMessagesTable.chatId, chatId));
      const deleteAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.insert(productChatArchivesTable).values({
        chatId, productId: chat.productId, clientId: chat.clientId,
        sellerId: chat.sellerId, messages: messages, status: "accepted",
        deleteAt,
      });
      await db.delete(productChatMessagesTable).where(eq(productChatMessagesTable.chatId, chatId));
      await db.delete(productChatsTable).where(eq(productChatsTable.id, chatId));

      // Notification admin
      const [admin] = await db.select().from(usersTable).where(eq(usersTable.role, "admin")).limit(1);
      if (admin) {
        await db.insert(notificationsTable).values({
          userId: admin.id, type: "order_accepted",
          title: "Commande confirm�e",
          body: `Commande accept�e entre client #${chat.clientId} et vendeur #${chat.sellerId} � Score vendeur +1`,
          isRead: false,
        });
      }

      return res.json({ status: "completed", archived: true });
    }

    res.json({ status: "waiting_seller", chat: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST vendeur accepte la commande
router.post("/product-chats/:id/accept", requireAuth, async (req, res) => {
  try {
    const chatId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    const [chat] = await db.select().from(productChatsTable)
      .where(and(eq(productChatsTable.id, chatId), eq(productChatsTable.sellerId, userId)));
    if (!chat) return res.status(404).json({ error: "Chat introuvable" });

    const [updated] = await db.update(productChatsTable)
      .set({ sellerAccepted: true })
      .where(eq(productChatsTable.id, chatId))
      .returning();

    if (updated.clientValidated) {
      const messages = await db.select().from(productChatMessagesTable)
        .where(eq(productChatMessagesTable.chatId, chatId));
      const deleteAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.insert(productChatArchivesTable).values({
        chatId, productId: chat.productId, clientId: chat.clientId,
        sellerId: chat.sellerId, messages: messages, status: "accepted",
        deleteAt,
      });
      await db.delete(productChatMessagesTable).where(eq(productChatMessagesTable.chatId, chatId));
      await db.delete(productChatsTable).where(eq(productChatsTable.id, chatId));

      const [admin] = await db.select().from(usersTable).where(eq(usersTable.role, "admin")).limit(1);
      if (admin) {
        await db.insert(notificationsTable).values({
          userId: admin.id, type: "order_accepted",
          title: "Commande confirm�e",
          body: `Commande accept�e � Score vendeur #${chat.sellerId} +1`,
          isRead: false,
        });
      }

      return res.json({ status: "completed", archived: true });
    }

    res.json({ status: "waiting_client", chat: updated });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST refuser la commande
router.post("/product-chats/:id/refuse", requireAuth, async (req, res) => {
  try {
    const chatId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    const [chat] = await db.select().from(productChatsTable)
      .where(eq(productChatsTable.id, chatId));
    if (!chat) return res.status(404).json({ error: "Chat introuvable" });
    if (chat.clientId !== userId && chat.sellerId !== userId) {
      return res.status(403).json({ error: "Non autoris�" });
    }

    const messages = await db.select().from(productChatMessagesTable)
      .where(eq(productChatMessagesTable.chatId, chatId));
    const deleteAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(productChatArchivesTable).values({
      chatId, productId: chat.productId, clientId: chat.clientId,
      sellerId: chat.sellerId, messages: messages, status: "refused",
      deleteAt,
    });
    await db.delete(productChatMessagesTable).where(eq(productChatMessagesTable.chatId, chatId));
    await db.delete(productChatsTable).where(eq(productChatsTable.id, chatId));

    res.json({ status: "refused", archived: true });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
