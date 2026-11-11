import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Compteur à fenêtre fixe stocké en base (fonctionne aussi en hébergement sans serveur).
 * Renvoie false quand la limite est atteinte.
 */
export async function hit(key: string, limit: number, windowMs: number, now = Date.now()): Promise<boolean> {
  const res = await db.run(sql`
    INSERT INTO rate_limits (key, count, window_start) VALUES (${key}, 1, ${now})
    ON CONFLICT(key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start <= ${now - windowMs} THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start <= ${now - windowMs} THEN ${now} ELSE rate_limits.window_start END
    RETURNING count`);
  const count = Number((res.rows[0] as unknown as { count: number } | undefined)?.count ?? 1);
  return count <= limit;
}
