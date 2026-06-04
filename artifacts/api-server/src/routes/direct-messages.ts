import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import pg from "pg";
const { Pool } = pg;

const router = Router();

function getPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

// GET /direct-messages/contacts
router.get("/direct-messages/contacts", requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const user = (req as any).user;
    let rows;
    if (user.role === "admin") {
      const result = await pool.query(
        "SELECT id, name, email, avatar, role FROM users WHERE id != $1 ORDER BY role, name ASC",
        [user.id]
      );
      rows = result.rows;
    } else {
      const sameRole = user.role;
      const result = await pool.query(
        "SELECT id, name, email, avatar, role FROM users WHERE (role = $1 OR role = 'admin') AND id != $2 ORDER BY role, name ASC",
        [sameRole, user.id]
      );
      rows = result.rows;
    }
    res.json(rows);
  } catch (e) {
    console.log("contacts error:", e);
    res.status(500).json({ error: "Erreur serveur" });
  } finally {
    await pool.end();
  }
});

// GET /direct-messages/:userId
router.get("/direct-messages/:userId", requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const myId = (req as any).user.id;
    const myRole = (req as any).user.role;
    const otherId = Number(req.params.userId);

    const { rows: targetRows } = await pool.query(
      "SELECT role FROM users WHERE id = $1", [otherId]
    );
    const targetRole = targetRows[0]?.role;

    if (!targetRole) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }
    if (myRole !== "admin" && targetRole !== "admin" && myRole === targetRole) {
      return res.status(403).json({ error: "Contact non autorise" });
    }

    const { rows } = await pool.query(
      `SELECT dm.*, u.name as sender_name, u.avatar as sender_avatar
       FROM direct_messages dm
       JOIN users u ON u.id = dm.sender_id
       WHERE (dm.sender_id = $1 AND dm.receiver_id = $2)
          OR (dm.sender_id = $2 AND dm.receiver_id = $1)
       ORDER BY dm.created_at ASC`,
      [myId, otherId]
    );

    await pool.query(
      "UPDATE direct_messages SET is_read = true WHERE receiver_id = $1 AND sender_id = $2",
      [myId, otherId]
    );

    res.json(rows);
  } catch (e) {
    console.log("direct-messages get error:", e);
    res.status(500).json({ error: "Erreur serveur" });
  } finally {
    await pool.end();
  }
});

// POST /direct-messages/:userId
router.post("/direct-messages/:userId", requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const myId = (req as any).user.id;
    const myRole = (req as any).user.role;
    const otherId = Number(req.params.userId);
    const { body } = req.body;

    if (!body?.trim()) return res.status(400).json({ error: "Message vide" });

    const { rows: targetRows } = await pool.query(
      "SELECT role FROM users WHERE id = $1", [otherId]
    );

    if (!targetRows[0]) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    const targetRole = targetRows[0].role;
    if (myRole !== "admin" && targetRole !== "admin" && myRole === targetRole) {
      return res.status(403).json({ error: "Contact non autorise" });
    }

    await pool.query(
      `INSERT INTO direct_messages (sender_id, receiver_id, body, is_read, created_at)
       VALUES ($1, $2, $3, false, NOW())`,
      [myId, otherId, body.trim()]
    );

    res.json({ success: true });
  } catch (e) {
    console.log("direct-messages post error:", e);
    res.status(500).json({ error: "Erreur serveur" });
  } finally {
    await pool.end();
  }
});

export default router;
