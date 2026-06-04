import { Router } from "express";
import { db } from "@workspace/db";
import { servicesTable, usersTable, categoriesTable, wilayasTable } from "@workspace/db";
import { eq, and, ilike, or, desc } from "drizzle-orm";

const router = Router();

// Dictionnaire de corrections communes
const corrections: Record<string, string[]> = {
  "memoire": ["mmoir", "memoir", "memoiree", "mimoir", "memoyre", "memoir"],
  "these": ["thse", "tese", "theze", "theese", "theze"],
  "soutenance": ["soutnonce", "sotnose", "soutennce", "soutenanse", "soutannce", "sotenonce", "soutenence"],
  "redaction": ["redaksion", "redacton", "redaxion", "rdaction", "redactoin"],
  "correction": ["corecton", "corection", "corektoin", "correcshon"],
  "traduction": ["traduksion", "traduxion", "tradaction", "traduction"],
  "presentation": ["presentasion", "presentaton", "prezentatoin", "presentaion"],
  "powerpoint": ["pawerpnt", "powarpoint", "powerpoitn", "powerpont"],
  "developpement": ["developpmen", "develoment", "developpemnt", "develoopment"],
  "programmation": ["programation", "programmasion", "programaton"],
  "graphisme": ["grafisme", "graphism", "grafizm"],
  "marketing": ["markting", "markiting", "markatin"],
  "traitement": ["tretement", "traitment", "traitemen"],
  "analyse": ["analise", "analyz", "analize", "analse"],
  "statistiques": ["statistik", "statistiq", "statistiques", "statisticke"],
  "informatique": ["informatik", "infromatique", "informatikue"],
  "mathematiques": ["matematiques", "mathmatiques", "mathematiq"],
  "physique": ["fizique", "physiq", "phisique"],
  "chimie": ["chimi", "chimia", "chymie"],
  "biologie": ["biologi", "biologee", "biologye"],
  "economie": ["ekonomie", "economee", "economi"],
  "droit": ["droi", "droyt", "drwat"],
  "medecine": ["medsin", "medecin", "medesin"],
  "architecture": ["architekture", "architectur", "arshitecture"],
  "design": ["dezign", "dezine", "disign"],
  "photographie": ["fotografi", "fotografy", "photographi"],
  "video": ["vido", "vidoe", "viedeo"],
  "montage": ["montaj", "montaje", "montege"],
  "comptabilite": ["comptabilit", "conptabilite", "comptabiliti"],
  "gestion": ["jestion", "geston", "jeston"],
  "management": ["managment", "managemnt", "managemant"],
  "anglais": ["englis", "anglese", "angalis"],
  "francais": ["fransais", "fransas", "fransez"],
  "arabe": ["arab", "arbi", "araby"],
};

function correctQuery(q: string): string {
  const words = q.toLowerCase().trim().split(/\s+/);
  const corrected = words.map(word => {
    // Verifie si le mot correspond a une variante connue
    for (const [correct, variants] of Object.entries(corrections)) {
      if (variants.some(v => {
        // Comparaison avec distance de Levenshtein simple
        if (v === word) return true;
        if (Math.abs(v.length - word.length) > 3) return false;
        let diff = 0;
        const len = Math.max(v.length, word.length);
        for (let i = 0; i < len; i++) {
          if (v[i] !== word[i]) diff++;
        }
        return diff <= 2;
      })) {
        return correct;
      }
      // Verifie si le mot lui-meme est proche du mot correct
      if (Math.abs(correct.length - word.length) <= 2) {
        let diff = 0;
        const len = Math.max(correct.length, word.length);
        for (let i = 0; i < len; i++) {
          if (correct[i] !== word[i]) diff++;
        }
        if (diff <= 2 && word.length >= 4) return correct;
      }
    }
    return word;
  });
  return corrected.join(" ");
}

router.get("/services/smart-search", async (req, res) => {
  try {
    const { q = "", wilaya_id, category_id, page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 50);
    const offset = (pageNum - 1) * limitNum;

    const originalQuery = String(q).trim();
    const correctedQuery = correctQuery(originalQuery);
    const words = correctedQuery.split(/\s+/).filter(w => w.length >= 2);

    // Construire les conditions de recherche
    const baseConditions: any[] = [eq(servicesTable.status, "approved")];
    if (wilaya_id) baseConditions.push(eq(servicesTable.wilayaId, Number(wilaya_id)));
    if (category_id) baseConditions.push(eq(servicesTable.categoryId, Number(category_id)));

    // Recherche sur chaque mot individuellement (OR entre les mots)
    let searchCondition;
    if (words.length > 0) {
      const wordConditions = words.map(word =>
        or(
          ilike(servicesTable.titleFr, `%${word}%`),
          ilike(servicesTable.descriptionFr, `%${word}%`),
          ilike(servicesTable.titleAr, `%${word}%`)
        )
      );
      searchCondition = wordConditions.length === 1 ? wordConditions[0] : or(...wordConditions);
    }

    const conditions = searchCondition
      ? [...baseConditions, searchCondition]
      : baseConditions;

    const rows = await db
      .select({ s: servicesTable, seller: usersTable, category: categoriesTable, wilaya: wilayasTable })
      .from(servicesTable)
      .leftJoin(usersTable, eq(servicesTable.sellerId, usersTable.id))
      .leftJoin(categoriesTable, eq(servicesTable.categoryId, categoriesTable.id))
      .leftJoin(wilayasTable, eq(servicesTable.wilayaId, wilayasTable.id))
      .where(and(...conditions))
      .orderBy(desc(servicesTable.viewsCount))
      .limit(limitNum)
      .offset(offset);

    res.json({
      data: rows.map(r => ({
        id: r.s.id,
        title_fr: r.s.titleFr,
        description_fr: r.s.descriptionFr,
        price: r.s.price,
        price_type: r.s.priceType,
        delivery_days: r.s.deliveryDays,
        images: r.s.images,
        views_count: r.s.viewsCount,
        seller_name: r.seller?.name,
        seller_id: r.s.sellerId,
        category_name_fr: r.category?.nameFr,
        wilaya_name_fr: r.wilaya?.nameFr,
        status: r.s.status,
      })),
      total: rows.length,
      page: pageNum,
      limit: limitNum,
      original_query: originalQuery,
      corrected_query: correctedQuery !== originalQuery ? correctedQuery : null,
    });
  } catch (e) {
    console.log("smart-search error:", e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;