content = open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\services.ts", encoding="utf-8", errors="ignore").read()

old = """  const conditions: any[] = [eq(servicesTable.status, "approved")];
  // Expansion intelligente avec GROQ
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
if (searchTerms.length > 0) {
      const termConditions = searchTerms.flatMap(term => [
        ilike(servicesTable.titleFr, `%${term}%`),
        ilike(servicesTable.descriptionFr, `%${term}%`),
      ]);
      conditions.push(or(...termConditions));
    }      );
      conditions.push(sql\\`(\\${sql.join(termConditions, sql\\` OR \\`)})\\`);
    }"""

new = """  const conditions: any[] = [eq(servicesTable.status, "approved")];
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
    const termConditions = searchTerms.flatMap((term: string) => [
      ilike(servicesTable.titleFr, `%${term}%`),
      ilike(servicesTable.descriptionFr, `%${term}%`),
    ]);
    conditions.push(or(...termConditions));
  }"""

if old in content:
    content = content.replace(old, new)
    print("Remplacement reussi")
else:
    print("Pattern non trouve - cherche manuellement...")
    idx = content.find("if (searchTerms.length > 0) {\n      const termConditions = searchTerms.map(term =>\nif (searchTerms.length > 0)")
    print(f"Index trouve: {idx}")

open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\services.ts", "w", encoding="utf-8").write(content)
print("Fichier sauvegarde")
