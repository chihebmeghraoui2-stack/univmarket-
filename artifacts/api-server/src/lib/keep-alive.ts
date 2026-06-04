// keep-alive.ts — Empêche Neon de se mettre en veille
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const INTERVAL_MS = 3 * 60 * 1000; // 3 minutes // 4 minutes

export function startKeepAlive() {
  setInterval(async () => {
    try {
      await db.execute(sql`SELECT 1`);
      console.log("[keep-alive] DB ping OK");
    } catch (e) {
      console.warn("[keep-alive] ping failed:", e);
    }
  }, INTERVAL_MS);
  console.log("[keep-alive] started — ping toutes les 4 minutes");
}

