import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type DB = LibSQLDatabase<typeof schema>;

const g = globalThis as unknown as { __mmClient?: Client; __mmDb?: DB };

export function getClient(): Client {
  if (!g.__mmClient) {
    g.__mmClient = createClient({
      url: process.env.DATABASE_URL ?? "file:./data/monmentor.db",
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }
  return g.__mmClient;
}

export const db: DB = g.__mmDb ?? (g.__mmDb = drizzle(getClient(), { schema }));

export { schema };
