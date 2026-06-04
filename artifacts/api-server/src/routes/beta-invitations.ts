import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, betaInvitationsTable } from "@workspace/db";
import { requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

router.post("/api/beta-invitations", requireAdmin, async (req, res): Promise<void> => {
  try {
    const { email, wilaya_id, role } = req.body;
    if (!email || !role) {
      res.status(400).json({ error: "email et role requis" });
      return;
    }
    const code = `BETA-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const [entry] = await db.insert(betaInvitationsTable).values({
      email,
      code,
      wilayaId: wilaya_id ?? null,
      role,
    }).returning();
    res.status(201).json({ data: entry });
  } catch (error) {
    res.status(500).json({ error: "Impossible de créer l'invitation beta" });
  }
});

router.get("/api/beta-invitations", requireAdmin, async (req, res): Promise<void> => {
  try {
    const invitations = await db.select().from(betaInvitationsTable).orderBy(desc(betaInvitationsTable.createdAt));
    res.json({ data: invitations });
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer les invitations" });
  }
});

router.post("/api/beta-invitations/validate", async (req, res): Promise<void> => {
  try {
    const { code, email } = req.body;
    if (!code) {
      res.status(400).json({ error: "code requis" });
      return;
    }
    const [invitation] = await db.select().from(betaInvitationsTable).where(eq(betaInvitationsTable.code, code));
    if (!invitation) {
      res.status(404).json({ error: "Code invalide" });
      return;
    }
    res.json({ data: invitation, valid: !invitation.usedAt });
  } catch (error) {
    res.status(500).json({ error: "Impossible de valider l'invitation" });
  }
});

export default router;

