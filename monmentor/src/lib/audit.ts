import "server-only";
import { db, schema } from "@/db";
import { newId } from "./ids";

export async function audit(actorId: string, action: string, target?: string) {
  await db.insert(schema.auditLog).values({ id: newId(), actorId, action, target: target ?? null, createdAt: Date.now() });
}
