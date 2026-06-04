const fs = require('fs');
let content = fs.readFileSync('E:/proget uni/projet2/artifacts/api-server/src/routes/chat.ts', 'utf8');

const profanityCheck = `
import { containsProfanity } from "../services/profanity";
`;

const permCheck = `
    // Regles de contact
    const senderRole = (req as any).user.role;
    const [orderData] = await db.select({
      clientId: ordersTable.clientId,
      sellerId: ordersTable.sellerId,
    }).from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);

    if (!orderData) { res.status(404).json({ error: "Commande introuvable" }); return; }

    const clientId = orderData.clientId;
    const sellerId = orderData.sellerId;

    // Client ne peut pas contacter autre client
    if (senderRole === "client" && userId !== clientId) {
      res.status(403).json({ error: "Les clients ne peuvent pas contacter d'autres clients" });
      return;
    }

    // Verification gros mots
    if (containsProfanity(body)) {
      await fetch("http://localhost:3000/api/warnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reason: "Langage inapproprie dans le chat" })
      });
      res.status(400).json({ error: "Message contient des propos inappropries. Avertissement envoye." });
      return;
    }
`;

// Ajouter import profanity en haut
if (!content.includes('containsProfanity')) {
  content = content.replace(
    'import { requireAuth } from "../middleware/auth";',
    'import { requireAuth } from "../middleware/auth";\nimport { containsProfanity } from "../services/profanity";'
  );
}

fs.writeFileSync('E:/proget uni/projet2/artifacts/api-server/src/routes/chat.ts', content, 'utf8');
console.log('Done chat.ts');
