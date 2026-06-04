import { Router, type IRouter } from "express";
import { eq, and, count, desc } from "drizzle-orm";
import { db, categoriesTable, servicesTable } from "@workspace/db";

const router: IRouter = Router();

// GET /categories
router.get("/categories", async (req, res): Promise<void> => {
  const { parent_id } = req.query;
  const conditions: any[] = [eq(categoriesTable.isActive, true)];
  if (parent_id) conditions.push(eq(categoriesTable.parentId, Number(parent_id)));

  const cats = await db.select().from(categoriesTable)
    .where(and(...conditions))
    .orderBy(categoriesTable.sortOrder, categoriesTable.nameFr);
  res.json(cats.map(c => ({
    id: c.id, name_fr: c.nameFr, name_ar: c.nameAr, slug: c.slug,
    icon: c.icon, parent_id: c.parentId, sort_order: c.sortOrder,
  })));
});

// GET /categories/popular  — MUST be before /:id
router.get("/categories/popular", async (req, res): Promise<void> => {
  const limit = parseInt(req.query.limit as string ?? "10", 10);
  const cats = await db
    .select({
      id: categoriesTable.id,
      name_fr: categoriesTable.nameFr,
      name_ar: categoriesTable.nameAr,
      slug: categoriesTable.slug,
      icon: categoriesTable.icon,
      services_count: count(servicesTable.id),
    })
    .from(categoriesTable)
    .leftJoin(servicesTable, and(eq(servicesTable.categoryId, categoriesTable.id), eq(servicesTable.status, "approved")))
    .where(eq(categoriesTable.isActive, true))
    .groupBy(categoriesTable.id)
    .orderBy(desc(count(servicesTable.id)))
    .limit(limit);
  res.json(cats);
});

// GET /categories/:id
router.get("/categories/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }
  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
  if (!cat) { res.status(404).json({ error: "Catégorie introuvable" }); return; }
  res.json({ id: cat.id, name_fr: cat.nameFr, name_ar: cat.nameAr, slug: cat.slug, icon: cat.icon });
});

export default router;
