import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Client } from "@libsql/client";

/** Applique, dans l'ordre, les fichiers drizzle/NNNN_*.sql pas encore appliqués. */
export async function migrate(client: Client, dir = path.join(process.cwd(), "drizzle")) {
  await client.execute(
    "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)",
  );
  const done = new Set(
    (await client.execute("SELECT name FROM _migrations")).rows.map((r) => String(r.name)),
  );
  const files = readdirSync(dir).filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort();
  const applied: string[] = [];
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = readFileSync(path.join(dir, file), "utf8");
    await client.executeMultiple(sql);
    await client.execute({ sql: "INSERT INTO _migrations (name, applied_at) VALUES (?, ?)", args: [file, Date.now()] });
    applied.push(file);
  }
  return applied;
}
