import { Router } from "express";
import { db } from "@workspace/db";
import { blogPostsTable, usersTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Liste articles publiés
router.get("/api/blog", async (req, res) => {
  try {
    const posts = await db.select().from(blogPostsTable)
      .where(eq(blogPostsTable.status, "published"))
      .orderBy(desc(blogPostsTable.publishedAt));
    res.json(posts);
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Détail article
router.get("/api/blog/:slug", async (req, res) => {
  try {
    const [post] = await db.select().from(blogPostsTable)
      .where(and(
        eq(blogPostsTable.slugFr, req.params.slug),
        eq(blogPostsTable.status, "published")
      ));
    if (!post) return res.status(404).json({ error: "Article introuvable" });

    // Incrémenter vues
    await db.update(blogPostsTable)
      .set({ views: (post.views || 0) + 1 })
      .where(eq(blogPostsTable.id, post.id));

    res.json(post);
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Créer article (admin)
router.post("/api/blog", requireAuth, async (req, res) => {
  try {
    const authorId = (req as any).user.id;
    const { titleFr, titleAr, slugFr, contentFr, contentAr, excerpt, tags } = req.body;
    const [post] = await db.insert(blogPostsTable)
      .values({ authorId, titleFr, titleAr, slugFr, contentFr, contentAr, excerpt, tags })
      .returning();
    res.json(post);
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Publier article (admin)
router.patch("/api/blog/:id/publish", requireAuth, async (req, res) => {
  try {
    const [post] = await db.update(blogPostsTable)
      .set({ status: "published", publishedAt: new Date() })
      .where(eq(blogPostsTable.id, parseInt(req.params.id)))
      .returning();
    res.json(post);
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Modifier article
router.put("/api/blog/:id", requireAuth, async (req, res) => {
  try {
    const { titleFr, titleAr, contentFr, contentAr, excerpt, tags } = req.body;
    const [post] = await db.update(blogPostsTable)
      .set({ titleFr, titleAr, contentFr, contentAr, excerpt, tags, updatedAt: new Date() })
      .where(eq(blogPostsTable.id, parseInt(req.params.id)))
      .returning();
    res.json(post);
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Supprimer article
router.delete("/api/blog/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(blogPostsTable).where(eq(blogPostsTable.id, parseInt(req.params.id)));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
