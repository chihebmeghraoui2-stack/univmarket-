content = open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\services.ts", encoding="utf-8", errors="ignore").read()

old = """// GET /services/search
router.get("/services/search", async (req, res): Promise<void> => {
    const { q, wilaya_id, category_id, sort = "relevance", min_price, max_price, min_rating, verified_only, page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 50);
    const offset = (pageNum - 1) * limitNum;
    const conditions: any[] = [eq(servicesTable.status, "approved")];
    if (q) conditions.push(ilike(servicesTable.titleFr, `%${q}%`));"""

new = """// GET /services/search - Ultra intelligent avec GROQ
router.get("/services/search", async (req, res): Promise<void> => {
    const { q, wilaya_id, category_id, sort = "relevance", min_price, max_price, min_rating, verified_only, page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 50);
    const offset = (pageNum - 1) * limitNum;

    // Expansion intelligente de la requete avec GROQ
    let searchTerms: string[] = q ? [String(q)] : [];
    if (q && String(q).trim().length >= 2) {
      try {
        const groqKey = process.env.GROQ_API_KEY;
        if (groqKey) {
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              max_tokens: 100,
              temperature: 0.1,
              messages: [{
                role: "system",
                content: "Tu es un moteur de recherche pour une plateforme de services universitaires algeriens. Quand l utilisateur cherche quelque chose, genere une liste de 5 mots-cles pertinents en francais pour trouver des services correspondants. Reponds UNIQUEMENT avec les mots-cles separes par des virgules, sans explication. Exemple: these,memoire,redaction,these universitaire,correction these"
              }, {
                role: "user",
                content: String(q)
              }]
            })
          });
          if (groqRes.ok) {
            const groqData = await groqRes.json();
            const keywords = groqData.choices?.[0]?.message?.content?.trim() || "";
            searchTerms = [...new Set([String(q), ...keywords.split(",").map((k: string) => k.trim()).filter((k: string) => k.length >= 2)])];
          }
        }
      } catch (e) {
        console.log("GROQ search expansion failed:", e);
      }
    }

    const conditions: any[] = [eq(servicesTable.status, "approved")];
    if (searchTerms.length > 0) {
      const termConditions = searchTerms.map(term =>
        sql`(${servicesTable.titleFr} ILIKE ${`%${term}%`} OR ${servicesTable.descriptionFr} ILIKE ${`%${term}%`})`
      );
      conditions.push(sql`(${sql.join(termConditions, sql` OR `)})`);
    }"""

# Cherche et remplace
if old.split("\\n")[0] in content:
    # Approche ligne par ligne
    lines = content.split("\\n")
    start = -1
    for i, line in enumerate(lines):
        if "// GET /services/search" in line:
            start = i
            break
    if start >= 0:
        # Trouve la fin du bloc a remplacer (jusqu a la premiere condition push(ilike))
        end = start
        for i in range(start, min(start+20, len(lines))):
            if "ilike(servicesTable.titleFr" in lines[i]:
                end = i + 1
                break
        
        new_lines = lines[:start] + new.split("\\n") + lines[end:]
        content = "\\n".join(new_lines)
        open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\services.ts", "w", encoding="utf-8").write(content)
        print(f"Done - remplace lignes {start+1} a {end+1}")
    else:
        print("Pattern non trouve")
else:
    print("Recherche du pattern alternatif...")
    # Essai direct
    if "if (q) conditions.push(ilike(servicesTable.titleFr" in content:
        content = content.replace(
            "if (q) conditions.push(ilike(servicesTable.titleFr, `%${q}%`));",
            """// Expansion intelligente avec GROQ
    let searchTerms: string[] = q ? [String(q)] : [];
    if (q && String(q).trim().length >= 2) {
      try {
        const groqKey = process.env.GROQ_API_KEY;
        if (groqKey) {
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              max_tokens: 100,
              temperature: 0.1,
              messages: [
                { role: "system", content: "Tu es un moteur de recherche pour une plateforme de services universitaires algeriens. Genere 5 mots-cles pertinents en francais pour la recherche donnee. Reponds UNIQUEMENT avec les mots-cles separes par des virgules." },
                { role: "user", content: String(q) }
              ]
            })
          });
          if (groqRes.ok) {
            const groqData = await groqRes.json();
            const keywords = groqData.choices?.[0]?.message?.content?.trim() || "";
            searchTerms = [...new Set([String(q), ...keywords.split(",").map((k: string) => k.trim()).filter((k: string) => k.length >= 2)])];
          }
        }
      } catch (e) { console.log("GROQ expansion failed:", e); }
    }
    if (searchTerms.length > 0) {
      const termConditions = searchTerms.map(term =>
        sql\`(\${servicesTable.titleFr} ILIKE \${\`%\${term}%\`} OR \${servicesTable.descriptionFr} ILIKE \${\`%\${term}%\`})\`
      );
      conditions.push(sql\`(\${sql.join(termConditions, sql\` OR \`)})\`);
    }"""
        )
        open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\services.ts", "w", encoding="utf-8").write(content)
        print("Done via remplacement direct")
    else:
        print("Pattern ilike non trouve non plus")
