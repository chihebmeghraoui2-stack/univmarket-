import { Router } from "express";
import { db } from "@workspace/db";
import { servicesTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth, requireSeller, requireAdmin } from "../middleware/auth";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const router = Router();

// Créer la table si elle n'existe pas
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trending_requests (
      id SERIAL PRIMARY KEY,
      seller_id INTEGER NOT NULL REFERENCES users(id),
      service_id INTEGER NOT NULL REFERENCES services(id),
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_note TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      decided_at TIMESTAMP,
      expires_at TIMESTAMP
    );
    -- Ajouter expires_at si elle n existe pas encore
    ALTER TABLE trending_requests ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
  `);
}
ensureTable().catch(console.error);

// GET /trending-requests/my — vendeur voit sa demande active
router.get("/trending-requests/my", requireAuth, requireSeller, async (req: any, res) => {
  try {
    const sellerId = req.user.id;
    const result = await pool.query(`
      SELECT tr.*, s.title_fr, s.images, s.price
      FROM trending_requests tr
      JOIN services s ON s.id = tr.service_id
      WHERE tr.seller_id = $1
      ORDER BY tr.created_at DESC
      LIMIT 1
    `, [sellerId]);
    res.json(result.rows[0] ?? null);
  } catch(e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /trending-requests — vendeur soumet une demande
router.post("/trending-requests", requireAuth, requireSeller, async (req: any, res) => {
  try {
    const sellerId = req.user.id;
    const { service_id, message } = req.body;

    if (!service_id) return res.status(400).json({ error: "service_id requis" });

    // Vérifier que le service appartient au vendeur
    const svcCheck = await pool.query(
      "SELECT id, title_fr, status FROM services WHERE id = $1 AND seller_id = $2",
      [service_id, sellerId]
    );
    if (!svcCheck.rows.length) return res.status(404).json({ error: "Service introuvable" });
    if (svcCheck.rows[0].status !== "approved") return res.status(400).json({ error: "Le service doit être approuvé" });

    // Vérifier qu'il n'a pas déjà une demande pending
    const existing = await pool.query(
      "SELECT id FROM trending_requests WHERE seller_id = $1 AND status = 'pending'",
      [sellerId]
    );
    if (existing.rows.length) return res.status(400).json({ error: "Vous avez déjà une demande en attente" });

    const result = await pool.query(
      "INSERT INTO trending_requests (seller_id, service_id, message) VALUES ($1, $2, $3) RETURNING *",
      [sellerId, service_id, message ?? null]
    );

    res.json({ success: true, request: result.rows[0] });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /trending-requests/:id — vendeur annule sa demande
router.delete("/trending-requests/:id", requireAuth, requireSeller, async (req: any, res) => {
  try {
    const sellerId = req.user.id;
    const id = parseInt(req.params.id, 10);
    const result = await pool.query(
      "DELETE FROM trending_requests WHERE id = $1 AND seller_id = $2 AND status = 'pending' RETURNING id",
      [id, sellerId]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Demande introuvable" });
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /admin/trending-requests — admin voit toutes les demandes
router.get("/admin/trending-requests", requireAdmin, async (req: any, res) => {
  try {
    const { status = "pending" } = req.query;
    const result = await pool.query(`
      SELECT 
        tr.*,
        s.title_fr, s.images, s.price, s.description_fr,
        u.name as seller_name, u.email as seller_email, u.avatar as seller_avatar
      FROM trending_requests tr
      JOIN services s ON s.id = tr.service_id
      JOIN users u ON u.id = tr.seller_id
      WHERE ($1 = 'all' OR tr.status = $1)
      ORDER BY tr.created_at DESC
    `, [status]);
    res.json(result.rows);
  } catch(e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /admin/trending-requests/:id — admin accepte ou refuse
router.put("/admin/trending-requests/:id", requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { action, admin_note } = req.body; // action: "approve" | "reject"

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Action invalide" });
    }

    const reqResult = await pool.query(
      "SELECT * FROM trending_requests WHERE id = $1",
      [id]
    );
    if (!reqResult.rows.length) return res.status(404).json({ error: "Demande introuvable" });
    const treq = reqResult.rows[0];

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Mettre à jour la demande
    await pool.query(
      "UPDATE trending_requests SET status = $1, admin_note = $2, decided_at = NOW(), expires_at = CASE WHEN $1 = 'approved' THEN NOW() + INTERVAL '3 days' ELSE NULL END WHERE id = $3",
      [newStatus, admin_note ?? null, id]
    );

    if (action === "approve") {
      // Mettre is_featured = true sur le service
      await pool.query(
        "UPDATE services SET is_featured = true WHERE id = $1",
        [treq.service_id]
      );
    }

    // Notifier le vendeur
    const svc = await pool.query("SELECT title_fr FROM services WHERE id = $1", [treq.service_id]);
    const title = svc.rows[0]?.title_fr ?? "votre service";
    const notifTitle = action === "approve"
      ? "🌟 Demande tendance acceptée !"
      : "❌ Demande tendance refusée";
    const notifBody = action === "approve"
      ? `Votre service "${title}" est maintenant mis en avant comme produit tendance !`
      : `Votre demande pour "${title}" a été refusée.${admin_note ? " Note: " + admin_note : ""}`;

    await pool.query(
      "INSERT INTO notifications (user_id, type, title, body) VALUES ($1, $2, $3, $4)",
      [treq.seller_id, "trending_request_" + newStatus, notifTitle, notifBody]
    );

    res.json({ success: true, status: newStatus });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;

