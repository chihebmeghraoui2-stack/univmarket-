import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, sessionsTable } from "@workspace/db";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Non authentifie" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
    if (!session || new Date(session.expiresAt) < new Date()) {
      res.status(401).json({ error: "Session expiree ou invalide" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
    if (!user || user.bannedAt) {
      res.status(403).json({ error: "Acces refuse" });
      return;
    }
    (req as any).user = user;
    next();
  } catch (e) {
    res.status(401).json({ error: "Token invalide ou expire" });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, async () => {
    const user = (req as any).user;
    if (user?.role !== "admin") {
      res.status(403).json({ error: "Acces administrateur requis" });
      return;
    }
    next();
  });
}

export async function requireSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, async () => {
    const user = (req as any).user;
    if (user?.role !== "seller" && user?.role !== "admin") {
      res.status(403).json({ error: "Acces vendeur requis" });
      return;
    }
    next();
  });
}
