import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Role } from "@/db/schema";
import { newId, newToken, sha256 } from "./ids";
import { hit } from "./rate-limit";
import { DEMO_MODE } from "./env";
import { sendNow } from "./notify";

const COOKIE = "mm_session";
const SESSION_DAYS = 30;

export type CurrentUser = typeof schema.users.$inferSelect;

export const hashPassword = (pw: string) => bcrypt.hash(pw, 11);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export async function createLoginSession(userId: string) {
  const token = newToken();
  const now = Date.now();
  await db.insert(schema.authSessions).values({
    id: sha256(token), userId, createdAt: now, expiresAt: now + SESSION_DAYS * 86_400_000,
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: SESSION_DAYS * 86_400,
  });
}

export async function destroyLoginSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(schema.authSessions).where(eq(schema.authSessions.id, sha256(token)));
  jar.delete(COOKIE);
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: schema.users })
    .from(schema.authSessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.authSessions.userId))
    .where(and(eq(schema.authSessions.id, sha256(token)), gt(schema.authSessions.expiresAt, Date.now())))
    .limit(1);
  const user = rows[0]?.user ?? null;
  if (user?.suspendedAt) return null;
  return user;
});

/** Exige une session ; sinon renvoie vers la connexion. */
export async function requireUser(roles?: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (roles && !roles.includes(user.role)) redirect("/accueil");
  return user;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "inconnue";
}

/** Normalise un numéro au format E.164. Les numéros guinéens à 9 chiffres reçoivent +224. */
export function normalizePhone(raw: string): string | null {
  let s = raw.replace(/[\s.()-]/g, "");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  if (/^6\d{8}$/.test(s)) s = `+224${s}`;
  if (/^224\d{9}$/.test(s)) s = `+${s}`;
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;
}

const OTP_TTL_MS = 10 * 60_000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCK_MS = 15 * 60_000;

export type OtpRequestResult = { ok: true; devCode?: string } | { ok: false; error: string };

export async function requestOtp(phone: string): Promise<OtpRequestResult> {
  if (!(await hit(`otp:phone:${phone}`, 3, 3_600_000))) {
    return { ok: false, error: "Trop de codes demandés pour ce numéro. Réessayez dans une heure." };
  }
  if (!(await hit(`otp:ip:${await clientIp()}`, 10, 3_600_000))) {
    return { ok: false, error: "Trop de demandes depuis cette connexion. Réessayez dans une heure." };
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const now = Date.now();
  await db.insert(schema.otpCodes).values({
    id: newId(), phone, codeHash: sha256(`${phone}:${code}`), expiresAt: now + OTP_TTL_MS, createdAt: now,
  });
  const text = `MonMentor : votre code de connexion est ${code}. Il expire dans 10 minutes. Ne le communiquez à personne.`;
  await sendNow({ phone, text });
  return DEMO_MODE ? { ok: true, devCode: code } : { ok: true };
}

export async function verifyOtp(phone: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = Date.now();
  const [otp] = await db
    .select()
    .from(schema.otpCodes)
    .where(and(eq(schema.otpCodes.phone, phone), isNull(schema.otpCodes.consumedAt), gt(schema.otpCodes.expiresAt, now)))
    .orderBy(desc(schema.otpCodes.createdAt))
    .limit(1);
  if (!otp) return { ok: false, error: "Code expiré ou introuvable. Demandez un nouveau code." };
  // Blocage par numéro : 5 codes faux sur 15 minutes, tous codes confondus.
  const recent = await db
    .select({ attempts: schema.otpCodes.attempts })
    .from(schema.otpCodes)
    .where(and(eq(schema.otpCodes.phone, phone), gt(schema.otpCodes.createdAt, now - OTP_LOCK_MS)));
  if (recent.reduce((a, r) => a + r.attempts, 0) >= OTP_MAX_ATTEMPTS) {
    return { ok: false, error: "Trop d'essais. Réessayez dans 15 minutes." };
  }
  if (otp.codeHash !== sha256(`${phone}:${code.trim()}`)) {
    await db.update(schema.otpCodes).set({ attempts: otp.attempts + 1 }).where(eq(schema.otpCodes.id, otp.id));
    const left = OTP_MAX_ATTEMPTS - otp.attempts - 1;
    return { ok: false, error: left > 0 ? `Code incorrect. Encore ${left} essai${left > 1 ? "s" : ""}.` : "Trop d'essais. Réessayez dans 15 minutes." };
  }
  await db.update(schema.otpCodes).set({ consumedAt: now }).where(eq(schema.otpCodes.id, otp.id));
  return { ok: true };
}
