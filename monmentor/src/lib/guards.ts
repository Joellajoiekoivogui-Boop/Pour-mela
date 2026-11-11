import "server-only";
import { and, count, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import type { CurrentUser } from "./auth";
import { isMinor } from "./format";

/** Un mineur ne peut agir (demander un mentorat, une séance, écrire) qu'après l'accord parental. */
export function needsParentalConsent(u: CurrentUser): boolean {
  return u.role === "MENTEE" && isMinor(u.birthDate) && !u.parentConsentAt;
}

/** Messagerie fermée de 22 h à 6 h pour les mineurs (heure de Conakry, UTC+0). */
export function minorQuietHours(u: CurrentUser, now = Date.now()): boolean {
  if (!isMinor(u.birthDate)) return false;
  const h = new Date(now).getUTCHours();
  return h >= 22 || h < 6;
}

export async function mentorLevel(mentorId: string): Promise<number> {
  const [p] = await db.select({ l: schema.mentorProfiles.verificationLevel }).from(schema.mentorProfiles).where(eq(schema.mentorProfiles.userId, mentorId)).limit(1);
  return p?.l ?? 0;
}

export async function activeMenteeCount(mentorId: string): Promise<number> {
  const [r] = await db.select({ n: count() }).from(schema.mentorships)
    .where(and(eq(schema.mentorships.mentorId, mentorId), inArray(schema.mentorships.status, ["ACTIVE"])));
  return Number(r?.n ?? 0);
}
