import { Router } from "express";
import { callAI } from "../lib/ai";
const router = Router();
const typescriptrouter = router;

router.post("/ai/analyze-thesis", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Texte requis" });

    const prompt = `Tu es un expert academique algerien specialise dans les memoires et theses universitaires.
Analyse ce texte et fournis une analyse structuree professionnelle avec exactement ces 3 sections.
N'utilise AUCUN emoji, AUCUN symbole special. Utilise uniquement du texte simple et des tirets.

1. RESUME STRUCTURE (5 points cles)
- Point 1
- Point 2
- Point 3
- Point 4
- Point 5

2. CHAPITRES IDENTIFIES
- Chapitre identifie 1

3. CONSEILS POUR LA SOUTENANCE
- Conseil 1
- Conseil 2
- Conseil 3

Texte a analyser:
${text.slice(0, 3000)}`;

    const analysis = await callAI(prompt, 600);
    res.json({ analysis });
  } catch (e) {
    console.log("ai-analyze error:", e);
    res.status(500).json({ error: "Tous les services IA sont indisponibles" });
  }
});


typescriptrouter.post("/ai/moderate-review", async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment) return res.status(400).json({ error: "Commentaire requis" });

    const systemPrompt = `Tu es un système de modération de commentaires ultra-précis pour UnivMarket, plateforme universitaire algérienne.

MISSION: Analyser un commentaire et déterminer s'il est acceptable ou non pour une plateforme professionnelle universitaire.

ANALYSE EN 4 LANGUES: Français, English, العربية, Darija algérienne (latin et arabe)

═══════════════════════════════════════
CATÉGORIE 1 — GROSSIÈRETÉS ET INSULTES
═══════════════════════════════════════
Français: connard, merde, putain, salope, enculé, bâtard, fdp, niquer, bite, con, cul, idiot, crétin, imbécile, débile, nul, incompétent, escroc, voleur, menteur, arnaqueur
English: fuck, shit, bitch, asshole, damn, bastard, dick, cunt, whore, nigger, idiot, moron, stupid, loser, scammer, liar, cheater, thief
Arabe standard: يلعن، كلب، حمار، زبالة، منيوك، قحبة، وليد الحرام، عاهرة، كس، غبي، أحمق، نصاب، كذاب، حرامي، سارق
Darija latin: kahba, zemel, hmar, weld el kahba, tboun, qahba, zob, nyak, ntayak, bezdek, la3net, 7mar, 9a7ba, ghabi, 7mar, nssab, kaddab, serrak, ma3ndouch, bhal, 3erse

VARIANTES ET FAUTES VOLONTAIRES À DÉTECTER:
- Remplacement de lettres: k@hba, k4hba, f*ck, sh1t, c0nnard, m3rde, 7mar, 9ahba
- Espaces entre lettres: "k a h b a", "f u c k", "m e r d e"
- Répétitions: "meerdeee", "fuuuck", "7maaaar"
- Séparation par points: "m.e.r.d.e", "f.u.c.k"
- Ajout de chiffres: "m3rd3", "f4ck", "sh1t"
- Mots phonétiquement proches: "mèrde", "putaing", "connar", "fuk", "sheit"
- Darija masquée: "ka7ba", "q@hba", "7mr", "zml", "tb9un"

═══════════════════════════════════════
CATÉGORIE 2 — CONTENU INAPPROPRIÉ
═══════════════════════════════════════
- Menaces: "je vais te", "t'as intérêt", "gare à toi", "tu vas le regretter", "ndir fik", "dir lik"
- Harcèlement: attaques personnelles répétées, humiliation
- Contenu discriminatoire: racisme, sexisme, régionalisme offensant
- Spam: liens externes, publicité, répétitions inutiles
- Fausses informations manifestement malveillantes

═══════════════════════════════════════
CATÉGORIE 3 — CE QUI EST ACCEPTABLE
═══════════════════════════════════════
- Critique constructive même sévère: "travail médiocre", "très déçu", "pas du tout satisfait", "mauvaise qualité"
- Feedback négatif honnête: "ne recommande pas", "délai non respecté", "résultat insuffisant"
- Expressions d'insatisfaction normales: "nul", "mauvais", "décevant" SANS insulte directe
- Commentaires positifs: toujours acceptables
- Questions et demandes de clarification

═══════════════════════════════════════
CORRECTION ORTHOGRAPHIQUE INTELLIGENTE
═══════════════════════════════════════
Comprendre les fautes d'orthographe courantes:
- "ecsilent" → "excellent" ✅ acceptable
- "serfis" → "service" ✅ acceptable
- "meci" → "merci" ✅ acceptable
- "bien fai" → "bien fait" ✅ acceptable
- "tres bon" → "très bon" ✅ acceptable
- "vendur" → "vendeur" ✅ acceptable
- "travayi" → "travail" ✅ acceptable
NE PAS rejeter un commentaire à cause de fautes d'orthographe normales.

RÈGLES IMPORTANTES:
1. Comprendre le CONTEXTE: "ce service est nul" = critique acceptable / "t'es un nul" = insulte
2. Même intention négative masquée doit être détectée
3. Les fautes d'orthographe normales NE sont PAS des raisons de rejet
4. Donner un score de confiance précis

Répondre UNIQUEMENT en JSON valide:
{
  "isAcceptable": true/false,
  "confidence": 0.0 à 1.0,
  "category": "clean/mild_inappropriate/grossier/insulte/menace/spam",
  "detectedWords": ["mot1", "mot2"],
  "correctedText": "version corrigée orthographiquement si fautes normales",
  "reason": "explication courte en français",
  "suggestion": "suggestion d'amélioration pour l'utilisateur si rejeté",
  "language": "fr/en/ar/darija/mixed"
}`;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyse ce commentaire: "${comment}"` }
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: "json_object" }
      }),
    });

    if (!groqResponse.ok) {
      // Fallback sur la détection locale si Groq échoue
      const { containsProfanity } = await import("../services/profanity");
      const check = containsProfanity(comment);
      return res.json({
        isAcceptable: !check.found,
        confidence: check.confidence || 0.8,
        category: check.found ? "grossier" : "clean",
        detectedWords: check.word ? [check.word] : [],
        reason: check.found ? `Mot inapproprié détecté: "${check.word}"` : "Commentaire acceptable",
        suggestion: check.found ? "Veuillez reformuler votre commentaire de manière respectueuse." : null,
        language: "fr",
        fallback: true,
      });
    }

    const data = await groqResponse.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    let result;
    try { result = JSON.parse(text); } catch {
      result = { isAcceptable: true, confidence: 0.5, category: "clean", reason: "Analyse incomplète" };
    }

    res.json(result);
  } catch (e) {
    console.error("moderate-review error:", e);
    // Fallback local en cas d'erreur
    try {
      const { containsProfanity } = await import("../services/profanity");
      const check = containsProfanity(req.body.comment || "");
      res.json({
        isAcceptable: !check.found,
        confidence: 0.75,
        category: check.found ? "grossier" : "clean",
        detectedWords: check.word ? [check.word] : [],
        reason: check.found ? `Mot inapproprié: "${check.word}"` : "Commentaire acceptable",
        fallback: true,
      });
    } catch {
      res.status(500).json({ error: "Erreur serveur" });
    }
  }
});

export default router;

