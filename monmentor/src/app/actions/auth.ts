"use server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import {
  clientIp, createLoginSession, destroyLoginSession, hashPassword, normalizePhone, requestOtp, verifyOtp, verifyPassword,
} from "@/lib/auth";
import { CHARTER_VERSION, DEMO_MODE, siteUrl } from "@/lib/env";
import { newId, newToken, slugify } from "@/lib/ids";
import { hit } from "@/lib/rate-limit";
import { isMinor } from "@/lib/format";
import { isDomain } from "@/lib/domains";
import { sendNow } from "@/lib/notify";

export type FormState = { error?: string; info?: string; phase?: "code"; phone?: string; devCode?: string };

const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/accueil";
};

// --- Numéro vérifié par code, en attente d'inscription (cookie signé, 30 minutes) ---
const secret = () => process.env.AUTH_SECRET ?? process.env.CRON_SECRET ?? "monmentor-dev-secret";
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("base64url");

async function setVerifiedPhone(phone: string) {
  const exp = Date.now() + 30 * 60_000;
  const value = `${phone}|${exp}`;
  (await cookies()).set("mm_phone", `${value}|${sign(value)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 1800, path: "/" });
}

export async function readVerifiedPhone(): Promise<string | null> {
  const raw = (await cookies()).get("mm_phone")?.value;
  if (!raw) return null;
  const [phone, exp, sig] = raw.split("|");
  if (!phone || !exp || !sig) return null;
  const expected = Buffer.from(sign(`${phone}|${exp}`));
  const got = Buffer.from(sig);
  if (expected.length !== got.length || !timingSafeEqual(expected, got) || Number(exp) < Date.now()) return null;
  return phone;
}

// --- Connexion par e-mail et mot de passe ---
export async function loginWithPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!(await hit(`login:${await clientIp()}`, 20, 15 * 60_000)) || !(await hit(`login:${email}`, 8, 15 * 60_000))) {
    return { error: "Trop de tentatives. Réessayez dans 15 minutes." };
  }
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Adresse e-mail ou mot de passe incorrect." };
  }
  if (user.suspendedAt) return { error: "Ce compte est suspendu. Contactez la coordination." };
  await createLoginSession(user.id);
  redirect(safeNext(formData.get("suite")));
}

// --- Connexion par téléphone (code à 6 chiffres) ---
export async function phoneLogin(prev: FormState, formData: FormData): Promise<FormState> {
  const step = String(formData.get("step") ?? "send");
  if (step === "send") {
    const phone = normalizePhone(String(formData.get("phone") ?? ""));
    if (!phone) return { error: "Numéro invalide. Exemple : 622 12 34 56 ou +224 622 12 34 56." };
    const res = await requestOtp(phone);
    if (!res.ok) return { error: res.error };
    return { phase: "code", phone, devCode: res.devCode, info: "Code envoyé par WhatsApp (ou SMS). Il expire dans 10 minutes." };
  }
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (!phone) return { error: "Numéro invalide." };
  const check = await verifyOtp(phone, String(formData.get("code") ?? ""));
  if (!check.ok) return { ...prev, phase: "code", phone, error: check.error, info: undefined };
  const [user] = await db.select().from(schema.users).where(eq(schema.users.phone, phone)).limit(1);
  if (!user) {
    await setVerifiedPhone(phone);
    redirect(`/inscription?telephone=1&suite=${encodeURIComponent(safeNext(formData.get("suite")))}`);
  }
  if (user.suspendedAt) return { error: "Ce compte est suspendu. Contactez la coordination." };
  await createLoginSession(user.id);
  redirect(safeNext(formData.get("suite")));
}

// --- Comptes de démonstration (mode démo uniquement) ---
export async function demoLogin(formData: FormData) {
  if (!DEMO_MODE) redirect("/connexion");
  const key = String(formData.get("account") ?? "");
  if (!/^[a-z]+$/.test(key)) redirect("/connexion");
  const [user] = await db.select().from(schema.users)
    .where(and(eq(schema.users.email, `${key}@demo.monmentor`), eq(schema.users.isDemo, true))).limit(1);
  if (!user) redirect("/connexion?erreur=demo");
  await createLoginSession(user.id);
  redirect(user.role === "ADMIN" ? "/admin" : "/accueil");
}

export async function logout() {
  await destroyLoginSession();
  redirect("/");
}

// --- Inscription ---
const SignupSchema = z.object({
  role: z.enum(["MENTEE", "MENTOR"]),
  name: z.string().trim().min(3, "Indiquez votre prénom et votre nom.").max(80),
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide.").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  password: z.string().optional(),
  city: z.string().trim().min(2, "Indiquez votre ville.").max(60),
  country: z.string().trim().min(2).max(60),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Indiquez votre date de naissance.").optional().or(z.literal("")),
  charter: z.literal("on", { message: "Vous devez accepter la charte de conduite." }),
  parentName: z.string().trim().max(80).optional(),
  parentPhone: z.string().trim().optional(),
  situation: z.string().trim().max(60).optional(),
  need: z.string().trim().max(2000).optional(),
  title: z.string().trim().max(100).optional(),
  organization: z.string().trim().max(100).optional(),
  primaryDomain: z.string().optional(),
  linkedinUrl: z.string().trim().url("Lien LinkedIn invalide.").optional().or(z.literal("")),
});

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries([...formData.entries()].map(([k, v]) => [k, typeof v === "string" ? v : ""]));
  const parsed = SignupSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire incomplet." };
  const v = parsed.data;
  if (!(await hit(`signup:${await clientIp()}`, 10, 3_600_000))) return { error: "Trop d'inscriptions depuis cette connexion. Réessayez plus tard." };

  const verifiedPhone = await readVerifiedPhone();
  const phone = verifiedPhone ?? (v.phone ? normalizePhone(v.phone) : null);
  if (v.phone && !phone) return { error: "Numéro de téléphone invalide." };
  const email = v.email || null;
  if (!email && !phone) return { error: "Indiquez une adresse e-mail ou un numéro de téléphone." };
  // Sans numéro vérifié par code, un mot de passe est indispensable.
  if (!verifiedPhone && (!v.password || v.password.length < 8)) return { error: "Choisissez un mot de passe d'au moins 8 caractères." };
  if (v.role === "MENTEE" && !v.birthDate) return { error: "Indiquez votre date de naissance." };
  const minor = v.role === "MENTEE" && isMinor(v.birthDate);
  if (v.role === "MENTOR" && isMinor(v.birthDate)) return { error: "Les mentors doivent être majeurs." };
  let parentPhone: string | null = null;
  if (minor) {
    parentPhone = v.parentPhone ? normalizePhone(v.parentPhone) : null;
    if (!v.parentName || !parentPhone) return { error: "Avant 18 ans, indiquez le nom et le téléphone de votre parent ou tuteur." };
  }
  if (v.role === "MENTOR" && (!v.title || !v.primaryDomain || !isDomain(v.primaryDomain))) {
    return { error: "Indiquez votre fonction et votre domaine principal." };
  }
  const conflicts = await db.select({ id: schema.users.id }).from(schema.users)
    .where(or(email ? eq(schema.users.email, email) : undefined, phone ? eq(schema.users.phone, phone) : undefined)).limit(1);
  if (conflicts.length) return { error: "Un compte existe déjà avec cette adresse ou ce numéro. Connectez-vous." };

  const id = newId();
  const now = Date.now();
  const consentToken = minor ? newToken(18) : null;
  await db.insert(schema.users).values({
    id, role: v.role, name: v.name, email, phone, passwordHash: v.password ? await hashPassword(v.password) : null,
    city: v.city, country: v.country, birthDate: v.birthDate || null, preferredChannel: phone ? "whatsapp" : "email",
    charterVersion: CHARTER_VERSION, charterAcceptedAt: now,
    parentName: minor ? v.parentName! : null, parentPhone, parentConsentToken: consentToken, createdAt: now,
  });
  if (v.role === "MENTEE") {
    const domains = [formData.getAll("domains")].flat().map(String).filter(isDomain);
    await db.insert(schema.menteeProfiles).values({ userId: id, situation: v.situation || null, need: v.need || null, domains });
  } else {
    await db.insert(schema.mentorProfiles).values({
      userId: id, title: v.title!, organization: v.organization || null, primaryDomain: v.primaryDomain!,
      domains: [v.primaryDomain!], skills: [], languages: ["Français"], formats: ["visio"], capacity: 3,
      verificationLevel: 0, slots: [], linkedinUrl: v.linkedinUrl || null,
    });
    if (v.linkedinUrl) {
      await db.insert(schema.verifications).values({ id: newId(), userId: id, level: 2, evidence: `Profil LinkedIn : ${v.linkedinUrl}`, status: "PENDING", createdAt: now });
    }
  }
  // CV créé d'office, privé par défaut.
  let slug = slugify(v.name);
  const [taken] = await db.select().from(schema.careerProfiles).where(eq(schema.careerProfiles.slug, slug)).limit(1);
  if (taken) slug = `${slug}-${newToken(3).toLowerCase()}`;
  await db.insert(schema.careerProfiles).values({ userId: id, slug, visibility: "PRIVATE", hidden: [], shareToken: newToken(16), updatedAt: now });

  if (minor && parentPhone && consentToken) {
    await sendNow({ phone: parentPhone, text: `MonMentor : ${v.name} souhaite rejoindre MonMentor, une plateforme de mentorat. Pour donner votre accord : ${siteUrl()}/consentement/${consentToken}` });
  }
  if (verifiedPhone) (await cookies()).delete("mm_phone");
  await createLoginSession(id);
  if (v.role === "MENTOR") redirect("/profil?bienvenue=1");
  redirect(v.need ? `/trouver?besoin=${encodeURIComponent(v.need)}` : "/trouver");
}

export async function confirmParentalConsent(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const [user] = await db.select().from(schema.users).where(eq(schema.users.parentConsentToken, token)).limit(1);
  if (!user) redirect(`/consentement/${token}?etat=invalide`);
  await db.update(schema.users).set({ parentConsentAt: Date.now(), parentConsentToken: null }).where(eq(schema.users.id, user.id));
  redirect(`/consentement/${token}?etat=merci`);
}
