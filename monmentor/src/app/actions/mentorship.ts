"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { notify } from "@/lib/notify";
import { activeMenteeCount, mentorLevel, needsParentalConsent } from "@/lib/guards";
import { isMinor } from "@/lib/format";

export async function requestMentorship(formData: FormData) {
  const user = await requireUser(["MENTEE"]);
  const mentorId = String(formData.get("mentorId") ?? "");
  const message = String(formData.get("message") ?? "").trim().slice(0, 800);
  const back = `/mentors/${mentorId}`;
  if (needsParentalConsent(user)) redirect(`${back}?erreur=consentement`);
  const [mentor] = await db.select().from(schema.mentorProfiles).where(eq(schema.mentorProfiles.userId, mentorId)).limit(1);
  if (!mentor || mentor.verificationLevel < 2) redirect(`${back}?erreur=introuvable`);
  if (isMinor(user.birthDate) && mentor.verificationLevel < 3) redirect(`${back}?erreur=niveau`);
  if ((await activeMenteeCount(mentorId)) >= mentor.capacity) redirect(`${back}?erreur=complet`);
  const [existing] = await db.select().from(schema.mentorships)
    .where(and(eq(schema.mentorships.mentorId, mentorId), eq(schema.mentorships.menteeId, user.id))).limit(1);
  if (existing) {
    if (existing.status === "PENDING" || existing.status === "ACTIVE") redirect(`${back}?ok=deja`);
    await db.update(schema.mentorships).set({ status: "PENDING", message, createdAt: Date.now() }).where(eq(schema.mentorships.id, existing.id));
  } else {
    await db.insert(schema.mentorships).values({ id: newId(), mentorId, menteeId: user.id, status: "PENDING", message, createdAt: Date.now() });
  }
  await db.insert(schema.matchEvents).values({ id: newId(), menteeId: user.id, mentorId, event: "CONTACTED", createdAt: Date.now() });
  await notify(mentorId, "mentorship_request", `${user.name} souhaite être accompagné·e par vous. Répondez depuis MonMentor.`, { link: "/mentores" });
  revalidatePath(back);
  redirect(`${back}?ok=demande`);
}

export async function respondMentorship(formData: FormData) {
  const user = await requireUser(["MENTOR"]);
  const id = String(formData.get("id"));
  const accept = formData.get("decision") === "accept";
  const [m] = await db.select().from(schema.mentorships).where(and(eq(schema.mentorships.id, id), eq(schema.mentorships.mentorId, user.id))).limit(1);
  if (!m || m.status !== "PENDING") return;
  if (accept) {
    const level = await mentorLevel(user.id);
    if (level < 2) redirect("/mentores?erreur=verification");
    const [p] = await db.select().from(schema.mentorProfiles).where(eq(schema.mentorProfiles.userId, user.id)).limit(1);
    if ((await activeMenteeCount(user.id)) >= (p?.capacity ?? 0)) redirect("/mentores?erreur=complet");
  }
  await db.update(schema.mentorships).set({ status: accept ? "ACTIVE" : "DECLINED" }).where(eq(schema.mentorships.id, id));
  if (accept) await db.insert(schema.matchEvents).values({ id: newId(), menteeId: m.menteeId, mentorId: user.id, event: "ACCEPTED", createdAt: Date.now() });
  await notify(
    m.menteeId,
    accept ? "mentorship_accepted" : "mentorship_declined",
    accept ? `${user.name} a accepté de vous accompagner. Proposez une première séance !` : `${user.name} ne peut pas vous accompagner pour le moment. D'autres mentors vous attendent.`,
    { link: accept ? `/seances/nouvelle?mentor=${user.id}` : "/trouver" },
  );
  revalidatePath("/mentores");
}

export async function endMentorship(formData: FormData) {
  const user = await requireUser(["MENTOR", "MENTEE"]);
  const id = String(formData.get("id"));
  const [m] = await db.select().from(schema.mentorships).where(eq(schema.mentorships.id, id)).limit(1);
  if (!m || (m.mentorId !== user.id && m.menteeId !== user.id)) return;
  await db.update(schema.mentorships).set({ status: "ENDED" }).where(eq(schema.mentorships.id, id));
  revalidatePath("/mentores");
  revalidatePath("/accueil");
}
