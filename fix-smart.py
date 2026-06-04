content = open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\smart-search.ts", encoding="utf-8", errors="ignore").read()

old = """    // Construire les conditions de recherche
    const baseConditions: any[] = [eq(servicesTable.status, "approved")];
    if (wilaya_id) baseConditions.push(eq(servicesTable.wilayaId, Number(wilaya_id)));
    if (category_id) baseConditions.push(eq(servicesTable.categoryId, Number(category_id)));

    // Recherche sur chaque mot individuellement (OR entre les mots)
    let searchCondition;
    if (words.length > 0) {
      const wordConditions = words.map(word =>
        or(
          ilike(servicesTable.titleFr, `%${word}%`),
          ilike(servicesTable.descriptionFr, `%${word}%`)
        )
      );
      searchCondition = wordConditions.length === 1 ? wordConditions[0] : or(...wordConditions);
    }"""

new = """    // Construire les conditions de recherche
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
    }"""

content = content.replace(old, new)

# Fix words filter - accept 2+ chars
content = content.replace(
    "const words = correctedQuery.split(/\\s+/).filter(w => w.length >= 3);",
    "const words = correctedQuery.split(/\\s+/).filter(w => w.length >= 2);"
)

open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\smart-search.ts", "w", encoding="utf-8").write(content)
print("Done")
