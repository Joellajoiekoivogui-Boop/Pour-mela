import "server-only";
import { and, inArray, lte } from "drizzle-orm";
import { db, schema } from "@/db";
import { nextStoredStatus } from "./session-status";
import { dispatchDue } from "./notify";
import { eq } from "drizzle-orm";

/** Tâche planifiée : cycle de vie des séances (F5) puis envoi des notifications en file (F4). */
export async function runJobs(now = Date.now()) {
  const candidates = await db.select().from(schema.sessions)
    .where(and(inArray(schema.sessions.status, ["REQUESTED", "CONFIRMED", "TO_REVIEW"]), lte(schema.sessions.startsAt, now)));
  let transitions = 0;
  for (const s of candidates) {
    const next = nextStoredStatus(s, now);
    if (!next) continue;
    await db.update(schema.sessions).set({ status: next, ...(next === "COMPLETED" ? { closedAt: now } : {}) }).where(eq(schema.sessions.id, s.id));
    transitions++;
  }
  await db.delete(schema.otpCodes).where(lte(schema.otpCodes.expiresAt, now - 86_400_000));
  await db.delete(schema.authSessions).where(lte(schema.authSessions.expiresAt, now));
  const notifications = await dispatchDue(now);
  return { transitions, ...notifications };
}
