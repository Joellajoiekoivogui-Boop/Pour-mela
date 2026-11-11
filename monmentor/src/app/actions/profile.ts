"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { destroyLoginSession, requireUser } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { DOMAIN_IDS, isDomain, LANGUAGES } from "@/lib/domains";
import type { Channel, Slot } from "@/db/schema";

const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const channel = str(formData, "preferredChannel") as Channel;
  await db.update(schema.users).set({
    name: str(formData, "name", 80) || user.name,
    city: str(formData, "city", 60) || user.city,
    country: str(formData, "country", 60) || user.country,
    bio: str(formData, "bio", 800) || null,
    preferredChannel: ["whatsapp", "sms", "email"].includes(channel) ? channel : user.preferredChannel,
  }).where(eq(schema.users.id, user.id));
  if (user.role === "MENTEE") {
    const domains = formData.getAll("domains").map(String).filter(isDomain);
    await db.update(schema.menteeProfiles).set({ situation: str(formData, "situation", 60) || null, need: str(formData, "need", 2000) || null, domains })
      .where(eq(schema.menteeProfiles.userId, user.id));
  }
  revalidatePath("/profil");
  redirect("/profil?ok=1");
}

export async function updateMentorProfile(formData: FormData) {
  const user = await requireUser(["MENTOR"]);
  const primaryDomain = str(formData, "primaryDomain");
  const domains = [...new Set([primaryDomain, ...formData.getAll("domains").map(String)])].filter(isDomain);
  const languages = formData.getAll("languages").map(String).filter((l) => (LANGUAGES as readonly string[]).includes(l));
  const formats = formData.getAll("formats").map(String).filter((f) => ["visio", "chat", "presentiel"].includes(f));
  const skills = str(formData, "skills", 600).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 12);
  const slots: Slot[] = formData.getAll("slots").map(String).map((s) => { const [d, h] = s.split("-").map(Number); return { day: d!, hour: h! }; })
    .filter((s) => s.day >= 1 && s.day <= 7 && s.hour >= 6 && s.hour <= 22);
  const newSlot = { day: Number(formData.get("newDay")), hour: Number(formData.get("newHour")) };
  if (newSlot.day >= 1 && newSlot.day <= 7 && newSlot.hour >= 6 && newSlot.hour <= 22 && !slots.some((s) => s.day === newSlot.day && s.hour === newSlot.hour)) slots.push(newSlot);
  slots.sort((a, b) => a.day - b.day || a.hour - b.hour);
  await db.update(schema.mentorProfiles).set({
    title: str(formData, "title", 100) || "Mentor",
    organization: str(formData, "organization", 100) || null,
    yearsExperience: Math.max(0, Math.min(60, Number(formData.get("yearsExperience")) || 0)),
    primaryDomain: isDomain(primaryDomain) ? primaryDomain : DOMAIN_IDS[0],
    domains, skills, slots,
    languages: languages.length ? languages : ["Français"],
    formats: formats.length ? formats : ["visio"],
    capacity: Math.max(1, Math.min(10, Number(formData.get("capacity")) || 3)),
    linkedinUrl: str(formData, "linkedinUrl", 200) || null,
  }).where(eq(schema.mentorProfiles.userId, user.id));
  revalidatePath("/profil");
  revalidatePath(`/mentors/${user.id}`);
  redirect("/profil?ok=1#mentor");
}

export async function requestVerification(formData: FormData) {
  const user = await requireUser(["MENTOR"]);
  const level = Math.max(1, Math.min(3, Number(formData.get("level")) || 1));
  const evidence = str(formData, "evidence", 500);
  if (!evidence) redirect("/profil?erreur=preuve#verification");
  const [pending] = await db.select().from(schema.verifications)
    .where(and(eq(schema.verifications.userId, user.id), eq(schema.verifications.status, "PENDING"))).limit(1);
  if (pending) redirect("/profil?erreur=attente#verification");
  await db.insert(schema.verifications).values({ id: newId(), userId: user.id, level, evidence, status: "PENDING", createdAt: Date.now() });
  redirect("/profil?ok=verification#verification");
}

export async function deleteAccount(formData: FormData) {
  const user = await requireUser();
  if (str(formData, "confirm") !== "SUPPRIMER") redirect("/profil?erreur=suppression#donnees");
  await destroyLoginSession();
  // Suppression en cascade : profils, séances, messages, objectifs, CV, notifications.
  await db.delete(schema.users).where(eq(schema.users.id, user.id));
  redirect("/?compte=supprime");
}
