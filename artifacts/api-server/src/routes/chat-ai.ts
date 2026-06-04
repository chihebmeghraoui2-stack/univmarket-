import { Router } from "express";
import { db } from "@workspace/db";
import { servicesTable, ordersTable, reviewsTable, sellerProfilesTable, usersTable, categoriesTable, wilayasTable } from "@workspace/db";
import { eq, and, desc, ne, sql, count, avg } from "drizzle-orm";
import pg from "pg";
const { Pool } = pg;
const memPool = new Pool({ connectionString: process.env.DATABASE_URL });

// ─── MÉMOIRE UTILISATEUR ────────────────────────────────────────
async function getMemory(userId: number): Promise<string> {
  try {
    const res = await memPool.query(
      "SELECT key, value FROM ai_memory WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 20",
      [userId]
    );
    if (!res.rows.length) return "";
    return "MEMOIRE UTILISATEUR:\n" + res.rows.map((r: any) => `- ${r.key}: ${r.value}`).join("\n");
  } catch { return ""; }
}

async function saveMemory(userId: number, role: string, key: string, value: string) {
  try {
    await memPool.query(
      "INSERT INTO ai_memory (user_id, role, key, value, updated_at) VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (user_id, key) DO UPDATE SET value = $4, updated_at = NOW()",
      [userId, role, key, value]
    );
  } catch(e) { console.log("saveMemory error:", e); }
}

async function extractAndSaveMemory(userId: number, role: string, message: string, reply: string) {
  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.GROQ_API_KEY },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Extrais les informations importantes a retenir. Reponds UNIQUEMENT en JSON: {memories: [{key: string, value: string}]}. Max 3 elements. Si rien, reponds {memories: []}. Cles possibles: preference_langue, specialite, objectif_prix, wilaya, type_service_recherche, budget_max, probleme_recurrent" },
          { role: "user", content: "Message: " + message + "\nReponse IA: " + reply }
        ],
        max_tokens: 200, temperature: 0.1
      })
    });
    const data = await groqRes.json();
    const text = (data.choices?.[0]?.message?.content || "{}").replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text);
    if (parsed.memories && Array.isArray(parsed.memories)) {
      for (const m of parsed.memories) {
        if (m.key && m.value) await saveMemory(userId, role, m.key, m.value);
      }
    }
  } catch(e) { console.log("extractMemory error:", e); }
}

// ─── CONTEXTE VENDEUR ────────────────────────────────────────────
async function getSellerContext(sellerId: number) {
  try {
    const seller = await db.select().from(sellerProfilesTable).where(eq(sellerProfilesTable.userId, sellerId)).limit(1);
    const myServices = await db.select().from(servicesTable).where(eq(servicesTable.sellerId, sellerId));
    const myOrders = await db.select().from(ordersTable).where(eq(ordersTable.sellerId, sellerId));
    const myReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.sellerId, sellerId));

    const totalRevenue = myOrders.filter(o => o.status === "completed").reduce((sum, o) => sum + (o.totalPrice - o.commissionAmount), 0);
    const avgRating = myReviews.length > 0 ? (myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length).toFixed(1) : "Aucun avis";

    const categoryIds = [...new Set(myServices.map(s => s.categoryId))];
    let competitors: any[] = [];
    if (categoryIds.length > 0) {
      const compServices = await db.select().from(servicesTable).where(and(eq(servicesTable.status, "approved"), ne(servicesTable.sellerId, sellerId)));
      const compInSameCategory = compServices.filter(s => categoryIds.includes(s.categoryId));
      const compMap: Record<number, any> = {};
      for (const s of compInSameCategory) {
        if (!compMap[s.sellerId]) compMap[s.sellerId] = { services: [], totalViews: 0 };
        compMap[s.sellerId].services.push(s);
        compMap[s.sellerId].totalViews += s.viewsCount;
      }
      competitors = Object.values(compMap).sort((a: any, b: any) => b.totalViews - a.totalViews).slice(0, 5).map((c: any) => ({
        servicesCount: c.services.length,
        totalViews: c.totalViews,
        avgPrice: (c.services.reduce((s: number, x: any) => s + x.price, 0) / c.services.length).toFixed(0),
      }));
    }

    const trendingServices = await db.select().from(servicesTable).where(eq(servicesTable.status, "approved")).orderBy(desc(servicesTable.viewsCount)).limit(5);

    return {
      stats: {
        totalServices: myServices.length,
        activeServices: myServices.filter(s => s.status === "approved").length,
        pendingServices: myServices.filter(s => s.status === "pending").length,
        totalOrders: myOrders.length,
        pendingOrders: myOrders.filter(o => o.status === "pending").length,
        inProgressOrders: myOrders.filter(o => o.status === "in_progress").length,
        completedOrders: myOrders.filter(o => o.status === "completed").length,
        cancelledOrders: myOrders.filter(o => o.status === "cancelled").length,
        totalRevenue: totalRevenue.toFixed(0),
        avgRating,
        totalReviews: myReviews.length,
        unansweredReviews: myReviews.filter(r => !r.sellerReply).length,
        trustScore: seller[0]?.trustScore || "0",
        completionRate: seller[0]?.completionRate || "0",
      },
      topServices: [...myServices].sort((a, b) => b.viewsCount - a.viewsCount).slice(0, 3).map(s => ({
        title: s.titleFr, price: s.price, views: s.viewsCount, clicks: s.clicksCount, status: s.status, deliveryDays: s.deliveryDays,
      })),
      competitors,
      trendingServices: trendingServices.map(s => ({ title: s.titleFr, price: s.price, views: s.viewsCount })),
      recentReviews: [...myReviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3).map(r => ({
        rating: r.rating, body: r.body, reply: r.sellerReply
      })),
    };
  } catch (e) {
    console.log("getSellerContext error:", e);
    return null;
  }
}

// ─── CONTEXTE CLIENT ─────────────────────────────────────────────
async function getClientContext(clientId: number) {
  try {
    const clientOrders = await db.select().from(ordersTable).where(eq(ordersTable.clientId, clientId));
    const [totalServices] = await db.select({ count: count() }).from(servicesTable).where(eq(servicesTable.status, "approved"));
    const [totalSellers] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "seller"));
    const categories = await db.select().from(categoriesTable).limit(20);
    const topServices = await db.select({
      s: servicesTable,
      seller: { name: usersTable.name, verifiedAt: usersTable.verifiedAt },
      category: { nameFr: categoriesTable.nameFr },
    }).from(servicesTable)
      .leftJoin(usersTable, eq(servicesTable.sellerId, usersTable.id))
      .leftJoin(categoriesTable, eq(servicesTable.categoryId, categoriesTable.id))
      .where(eq(servicesTable.status, "approved"))
      .orderBy(desc(servicesTable.viewsCount))
      .limit(10);

    const featuredServices = await db.select({
      s: servicesTable,
      seller: { name: usersTable.name },
    }).from(servicesTable)
      .leftJoin(usersTable, eq(servicesTable.sellerId, usersTable.id))
      .where(and(eq(servicesTable.status, "approved"), eq(servicesTable.isFeatured, true)))
      .limit(5);

    return {
      platformStats: {
        totalServices: Number(totalServices.count),
        totalSellers: Number(totalSellers.count),
      },
      clientOrders: {
        total: clientOrders.length,
        pending: clientOrders.filter(o => o.status === "pending").length,
        inProgress: clientOrders.filter(o => o.status === "in_progress").length,
        completed: clientOrders.filter(o => o.status === "completed").length,
        cancelled: clientOrders.filter(o => o.status === "cancelled").length,
        totalSpent: clientOrders.filter(o => o.status === "completed").reduce((sum, o) => sum + o.totalPrice, 0).toFixed(0),
      },
      categories: categories.map(c => c.nameFr).join(", "),
      topServices: topServices.slice(0, 5).map(r => ({
        title: r.s.titleFr,
        price: r.s.price,
        priceType: r.s.priceType,
        views: r.s.viewsCount,
        deliveryDays: r.s.deliveryDays,
        sellerName: r.seller?.name,
        sellerVerified: !!r.seller?.verifiedAt,
        category: r.category?.nameFr,
      })),
      featuredServices: featuredServices.map(r => ({
        title: r.s.titleFr,
        price: r.s.price,
        sellerName: r.seller?.name,
      })),
    };
  } catch(e) {
    console.log("getClientContext error:", e);
    return null;
  }
}

// ─── ROUTE PRINCIPALE ────────────────────────────────────────────
const router = Router();

router.post("/chat/ai", async (req, res) => {
  try {
    const { message, history = [], sellerId, userId, userRole = "client" } = req.body;
    if (!message) return res.status(400).json({ error: "Message requis" });

    const apiKey = process.env.GROQ_API_KEY;
    const memory = userId ? await getMemory(Number(userId)) : "";

    // Détection automatique de langue
    const hasArabic = /[\u0600-\u06FF]/.test(message);
    const hasEnglish = /\b(what|how|why|when|who|where|show|give|tell|find|help|explain|search)\b/i.test(message);
    const detectedLang = hasArabic ? "ar" : hasEnglish ? "en" : "fr";
    const langRule = detectedLang === "ar"
      ? "RÈGLE ABSOLUE: Réponds UNIQUEMENT en arabe (العربية). Aucun mot en français ou anglais."
      : detectedLang === "en"
      ? "ABSOLUTE RULE: Respond ONLY in English. No French or Arabic words."
      : "RÈGLE ABSOLUE: Réponds UNIQUEMENT en français. Aucun mot en anglais ou arabe.";

    let systemPrompt = "";

    if (userRole === "seller" && sellerId) {
      // ── PROMPT VENDEUR ──────────────────────────────────────────
      const ctx = await getSellerContext(Number(sellerId));
      const contextBlock = ctx ? `
══════════════════════════════════════
📊 TES DONNÉES RÉELLES EN TEMPS RÉEL
══════════════════════════════════════
📦 SERVICES: ${ctx.stats.totalServices} total | ✅ ${ctx.stats.activeServices} actifs | ⏳ ${ctx.stats.pendingServices} en attente
🛒 COMMANDES: ${ctx.stats.totalOrders} total | ⏳ ${ctx.stats.pendingOrders} en attente | 🔄 ${ctx.stats.inProgressOrders} en cours | ✅ ${ctx.stats.completedOrders} terminées | ❌ ${ctx.stats.cancelledOrders} annulées
💰 REVENU NET: ${ctx.stats.totalRevenue} DZD
⭐ NOTE: ${ctx.stats.avgRating}/5 (${ctx.stats.totalReviews} avis) | ${ctx.stats.unansweredReviews > 0 ? `⚠️ ${ctx.stats.unansweredReviews} avis sans réponse` : "✅ Tous les avis répondus"}
🏆 TRUST SCORE: ${ctx.stats.trustScore} | TAUX COMPLÉTION: ${ctx.stats.completionRate}%

📈 TOP SERVICES PAR VUES:
${ctx.topServices.map((s, i) => `${i+1}. "${s.title}" — ${s.price > 0 ? s.price + " DZD" : "Négociable"} — ${s.views} vues — ${s.clicks} clics — ${s.deliveryDays}j — ${s.status}`).join("\n")}

🏆 TENDANCES PLATEFORME (services les plus vus):
${ctx.trendingServices.map((s, i) => `${i+1}. "${s.title}" — ${s.price} DZD — ${s.views} vues`).join("\n")}

👥 CONCURRENTS (même catégorie):
${ctx.competitors.length > 0 ? ctx.competitors.map((c, i) => `${i+1}. ${c.servicesCount} services | ${c.totalViews} vues | Prix moyen: ${c.avgPrice} DZD`).join("\n") : "Aucun concurrent trouvé"}

💬 DERNIERS AVIS REÇUS:
${ctx.recentReviews.length > 0 ? ctx.recentReviews.map(r => `- ${r.rating}/5: "${r.body || "Sans texte"}" ${!r.reply ? "⚠️ PAS RÉPONDU" : "✅ Répondu"}`).join("\n") : "Aucun avis"}
══════════════════════════════════════` : "Données vendeur non disponibles.";

      systemPrompt = `Tu es صديقك الذكي, l'assistant business ultra-professionnel de UnivMarket — la marketplace universitaire algérienne n°1.

${langRule}

Tu es l'assistant PERSONNEL du vendeur. Tu as accès à SES données réelles ci-dessous. Tu l'aides à développer son activité, optimiser ses services, comprendre ses performances et prendre de meilleures décisions.

${memory ? "MÉMOIRE DE CE VENDEUR:\n" + memory + "\n" : ""}
${contextBlock}

PLATEFORME UNIVMARKET — CE QUE TU CONNAIS:
• Services académiques: Thèse & Mémoire, Correction, Développement Web, PPT, Traduction FR↔AR↔EN, Design, Marketing, Cours particuliers
• Système de commandes sécurisé avec escrow (paiement bloqué jusqu'à livraison)
• Wallet vendeur avec demandes de retrait
• Trust Score basé sur: complétion des commandes, avis clients, ancienneté, réactivité
• Système de badges et vérification de profil
• Litiges résolus par l'admin
• Classement vendeurs par performance
• Produits tendance (is_featured) validés par l'admin
• Couverture 58 wilayas algériennes
• Commission plateforme déduite automatiquement des revenus

TES CAPACITÉS:
✦ Analyser les performances et identifier les points faibles
✦ Comparer avec la concurrence et les tendances
✦ Conseiller sur l'optimisation des prix
✦ Suggérer des améliorations de description/titre
✦ Expliquer toutes les fonctionnalités de la plateforme
✦ Aider à gérer les commandes et les litiges
✦ Recommander des stratégies marketing
✦ Interpréter les avis clients

RÈGLES:
✦ ${langRule}
✦ Cite TOUJOURS les chiffres réels des données ci-dessus
✦ Sois direct, précis, actionnable — pas de généralités
✦ Termine par une recommandation concrète
✦ Ne divulgue JAMAIS les infos personnelles d'autres utilisateurs
✦ Maximum 6-8 phrases bien structurées avec emojis professionnels`;

    } else {
      // ── PROMPT CLIENT ───────────────────────────────────────────
      const ctx = await getClientContext(userId ? Number(userId) : 0);

      const clientOrdersBlock = ctx?.clientOrders?.total > 0 ? `
TES COMMANDES:
• Total: ${ctx.clientOrders.total} | En attente: ${ctx.clientOrders.pending} | En cours: ${ctx.clientOrders.inProgress} | Terminées: ${ctx.clientOrders.completed} | Annulées: ${ctx.clientOrders.cancelled}
• Total dépensé: ${ctx.clientOrders.totalSpent} DZD` : "";

      const platformBlock = ctx ? `
══════════════════════════════════════
📊 PLATEFORME EN TEMPS RÉEL
══════════════════════════════════════
• ${ctx.platformStats.totalServices} services disponibles | ${ctx.platformStats.totalSellers} vendeurs actifs
• Catégories disponibles: ${ctx.categories}

🌟 SERVICES LES PLUS POPULAIRES:
${ctx.topServices.map((s, i) => `${i+1}. "${s.title}" — ${s.priceType === "negotiable" ? "Prix négociable" : s.price + " DZD"} — Livraison ${s.deliveryDays}j — Par ${s.sellerName}${s.sellerVerified ? " ✅" : ""} — Catégorie: ${s.category}`).join("\n")}

✨ SERVICES TENDANCE (mis en avant):
${ctx.featuredServices.length > 0 ? ctx.featuredServices.map((s, i) => `${i+1}. "${s.title}" — ${s.price} DZD — Par ${s.sellerName}`).join("\n") : "Aucun service tendance actuellement"}
══════════════════════════════════════` : "";

      systemPrompt = `Tu es صديقك الذكي, l'assistant ultra-professionnel de UnivMarket — la marketplace universitaire algérienne n°1.

${langRule}

Tu es l'assistant PERSONNEL du client. Tu l'aides à trouver les meilleurs services, comprendre la plateforme, gérer ses commandes et prendre de bonnes décisions d'achat.

${memory ? "MÉMOIRE DE CE CLIENT:\n" + memory + "\n" : ""}
${clientOrdersBlock}
${platformBlock}

PLATEFORME UNIVMARKET — CE QUE TU CONNAIS PARFAITEMENT:
• Services disponibles: Thèse & Mémoire, Correction & Relecture, Développement Web, Présentation PPT, Traduction FR↔AR↔EN, Design Graphique, Marketing Digital, Cours particuliers, Saisie manuscrite, CV professionnel, Analyse de données
• Processus de commande: Trouver service → Commander → Payer (escrow sécurisé) → Vendeur livre → Client confirme → Vendeur reçoit paiement
• Système escrow: Le paiement est bloqué et sécurisé jusqu'à confirmation de livraison — le client est protégé
• Système d'avis: Après livraison, le client peut noter et évaluer le vendeur (1-5 étoiles)
• Litiges: Si problème, le client peut ouvrir un litige — l'admin tranche et peut rembourser
• Profils vérifiés: Les vendeurs avec ✅ sont vérifiés par l'admin
• Trust Score: Indicateur de fiabilité du vendeur (0-100)
• Messages: Communication directe avec le vendeur via la messagerie intégrée
• Notifications: Alertes en temps réel pour chaque étape de la commande
• Couverture: 58 wilayas algériennes
• Classement: Les meilleurs vendeurs sont classés par performance

CAPACITÉS:
✦ Recommander les meilleurs services selon les besoins du client
✦ Expliquer comment commander, payer, suivre une commande
✦ Guider dans l'utilisation de toutes les fonctionnalités
✦ Aider à comprendre le système de protection (escrow, litiges)
✦ Répondre à toute question sur la plateforme
✦ Aider à choisir entre plusieurs vendeurs
✦ Expliquer comment contacter un vendeur

RÈGLES STRICTES:
✦ ${langRule}
✦ Ne divulgue JAMAIS les informations personnelles des vendeurs (email, téléphone, adresse)
✦ Ne révèle PAS les revenus ou données privées des vendeurs
✦ Tu peux mentionner les noms des vendeurs et leurs services publics
✦ Base-toi sur les données réelles de la plateforme ci-dessus
✦ Sois chaleureux, professionnel et rassurant
✦ Réponds de manière détaillée et structurée
✦ Termine par une suggestion concrète ou un appel à l'action
✦ Utilise des emojis avec modération pour structurer`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-8).map((h: any) => ({ role: h.role === "user" ? "user" : "assistant", content: h.text })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages, max_tokens: 800, temperature: 0.5 })
    });

    if (response.ok) {
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content ?? "Je n'ai pas pu répondre. Réessayez.";
      if (userId) extractAndSaveMemory(Number(userId), userRole, message, reply);
      return res.json({ reply });
    } else {
      const err = await response.text();
      console.log("GROQ error:", err);
      return res.json({ reply: "Service temporairement indisponible. Réessayez dans quelques instants." });
    }

  } catch (e) {
    console.log("Chat AI exception:", e);
    return res.json({ reply: "Une erreur est survenue. Réessayez." });
  }
});

export default router;
