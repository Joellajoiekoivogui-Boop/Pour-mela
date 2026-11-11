"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { newId, newToken } from "@/lib/ids";
import { notify } from "@/lib/notify";
import { activeMentorship, completedSessionsBetween } from "@/lib/queries";
import { isMinor } from "@/lib/format";
import type { Visibility } from "@/db/schema";

const MIN_SESSIONS = 2;

async function canVouch(mentorId: string, menteeId: string) {
  return !!(await activeMentorship(mentorId, menteeId)) && (await completedSessionsBetween(mentorId, menteeId)) >= MIN_SESSIONS;
}

export async function endorseSkill(formData: FormData) {
  const user = await requireUser(["MENTOR"]);
  const menteeId = String(formData.get("menteeId"));
  const skill = String(formData.get("skill") ?? "").trim().slice(0, 60);
  if (!skill || !(await canVouch(user.id, menteeId))) redirect(`/mentores/${menteeId}?erreur=seances`);
  await db.insert(schema.skillEndorsements).values({ id: newId(), menteeId, mentorId: user.id, skill, createdAt: Date.now() }).onConflictDoNothing();
  await notify(menteeId, "endorsement", `${user.name} a validé votre compétence « ${skill} ». Elle apparaît sur votre CV.`, { link: "/profil/cv" });
  revalidatePath(`/mentores/${menteeId}`);
}

export async function writeRecommendation(formData: FormData) {
  const user = await requireUser(["MENTOR"]);
  const menteeId = String(formData.get("menteeId"));
  const body = String(formData.get("body") ?? "").trim().slice(0, 600);
  if (body.length < 40 || !(await canVouch(user.id, menteeId))) redirect(`/mentores/${menteeId}?erreur=recommandation`);
  await db.insert(schema.recommendations).values({ id: newId(), menteeId, mentorId: user.id, body, status: "PENDING", createdAt: Date.now() });
  await notify(menteeId, "recommendation", `${user.name} a écrit une recommandation pour votre CV. Relisez-la et approuvez-la.`, { link: "/profil/cv" });
  revalidatePath(`/mentores/${menteeId}`);
  redirect(`/mentores/${menteeId}?ok=recommandation`);
}

export async function setRecommendationStatus(formData: FormData) {
  const user = await requireUser(["MENTEE", "MENTOR"]);
  const status = formData.get("status") === "APPROVED" ? "APPROVED" : "HIDDEN";
  await db.update(schema.recommendations).set({ status })
    .where(and(eq(schema.recommendations.id, String(formData.get("id"))), eq(schema.recommendations.menteeId, user.id)));
  revalidatePath("/profil/cv");
}

export async function updateCv(formData: FormData) {
  const user = await requireUser();
  let visibility = String(formData.get("visibility") ?? "PRIVATE") as Visibility;
  if (!["PRIVATE", "LINK", "PUBLIC"].includes(visibility)) visibility = "PRIVATE";
  // Avant 18 ans : jamais public ; partage par lien seulement avec l'accord parental.
  if (isMinor(user.birthDate)) {
    if (visibility === "PUBLIC") visibility = "LINK";
    if (visibility === "LINK" && !user.parentConsentAt) visibility = "PRIVATE";
  }
  const hidden = ["photo", "city", "goals", "ratings", "sessions"].filter((k) => formData.get(`hide_${k}`) === "on");
  const language = formData.get("language") === "en" ? "en" : "fr";
  const tpl = String(formData.get("template"));
  const template = tpl === "academique" || tpl === "entrepreneur" ? tpl : "sobre";
  await db.update(schema.careerProfiles).set({
    visibility, hidden, language, template,
    headline: String(formData.get("headline") ?? "").trim().slice(0, 140) || null,
    summary: String(formData.get("summary") ?? "").trim().slice(0, 800) || null,
    updatedAt: Date.now(),
  }).where(eq(schema.careerProfiles.userId, user.id));
  revalidatePath("/profil/cv");
  redirect("/profil/cv?ok=enregistre");
}

export async function addExperience(formData: FormData) {
  const user = await requireUser();
  const kind = formData.get("kind") === "EDUCATION" ? "EDUCATION" : "EXPERIENCE";
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const organization = String(formData.get("organization") ?? "").trim().slice(0, 120);
  const start = String(formData.get("start") ?? "").trim().slice(0, 7);
  if (!title || !organization || !start) redirect("/profil/cv?erreur=experience");
  await db.insert(schema.experiences).values({
    id: newId(), userId: user.id, kind, title, organization, start,
    end: String(formData.get("end") ?? "").trim().slice(0, 7) || null,
    description: String(formData.get("description") ?? "").trim().slice(0, 400) || null,
  });
  revalidatePath("/profil/cv");
}

export async function deleteExperience(formData: FormData) {
  const user = await requireUser();
  await db.delete(schema.experiences).where(and(eq(schema.experiences.id, String(formData.get("id"))), eq(schema.experiences.userId, user.id)));
  revalidatePath("/profil/cv");
}

export async function resetShareLink() {
  const user = await requireUser();
  await db.update(schema.careerProfiles).set({ shareToken: newToken(16), updatedAt: Date.now() }).where(eq(schema.careerProfiles.userId, user.id));
  revalidatePath("/profil/cv");
  redirect("/profil/cv?ok=lien");
}

/** Journalise un partage (statistiques par canal, spécification F1). */
export async function logShare(channel: string) {
  const user = await requireUser();
  const c = ["linkedin", "facebook", "whatsapp", "copy", "native", "certificate"].includes(channel) ? channel : "autre";
  await db.insert(schema.shareEvents).values({ id: newId(), userId: user.id, channel: c, createdAt: Date.now() });
}
