"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { certificateCode, newId } from "@/lib/ids";
import { notify } from "@/lib/notify";
import { mentorLevel, needsParentalConsent } from "@/lib/guards";
import { audit } from "@/lib/audit";

export async function createCohort(formData: FormData) {
  const user = await requireUser(["MENTOR"]);
  const programId = String(formData.get("programId"));
  const startsOn = String(formData.get("startsOn") ?? "");
  const capacity = Math.max(5, Math.min(10, Number(formData.get("capacity")) || 8));
  const [p] = await db.select().from(schema.programs).where(eq(schema.programs.id, programId)).limit(1);
  if (!p || !/^\d{4}-\d{2}-\d{2}$/.test(startsOn)) redirect("/programmes");
  if ((await mentorLevel(user.id)) < 2) redirect(`/programmes/${p.slug}?erreur=verification`);
  const id = newId();
  await db.insert(schema.cohorts).values({ id, programId, mentorId: user.id, startsOn, capacity, status: "OPEN", createdAt: Date.now() });
  redirect(`/cohortes/${id}`);
}

export async function joinCohort(formData: FormData) {
  const user = await requireUser(["MENTEE"]);
  const cohortId = String(formData.get("cohortId"));
  const [c] = await db.select({ c: schema.cohorts, p: schema.programs }).from(schema.cohorts)
    .innerJoin(schema.programs, eq(schema.programs.id, schema.cohorts.programId)).where(eq(schema.cohorts.id, cohortId)).limit(1);
  if (!c || c.c.status !== "OPEN") redirect("/programmes");
  if (needsParentalConsent(user)) redirect(`/programmes/${c.p.slug}?erreur=consentement`);
  const [n] = await db.select({ n: count() }).from(schema.cohortMembers).where(and(eq(schema.cohortMembers.cohortId, cohortId), eq(schema.cohortMembers.status, "ENROLLED")));
  const status = Number(n?.n ?? 0) >= c.c.capacity ? "WAITLIST" : "ENROLLED";
  await db.insert(schema.cohortMembers).values({ cohortId, userId: user.id, status, createdAt: Date.now() }).onConflictDoNothing();
  await notify(c.c.mentorId, "cohort_join", `${user.name} ${status === "ENROLLED" ? "rejoint" : "est en liste d'attente de"} votre cohorte « ${c.p.title} ».`, { link: `/cohortes/${cohortId}` });
  redirect(`/programmes/${c.p.slug}?ok=${status === "ENROLLED" ? "inscrit" : "attente"}`);
}

export async function updateMember(formData: FormData) {
  const user = await requireUser(["MENTOR"]);
  const cohortId = String(formData.get("cohortId"));
  const memberId = String(formData.get("userId"));
  const [c] = await db.select({ c: schema.cohorts, p: schema.programs }).from(schema.cohorts)
    .innerJoin(schema.programs, eq(schema.programs.id, schema.cohorts.programId))
    .where(and(eq(schema.cohorts.id, cohortId), eq(schema.cohorts.mentorId, user.id))).limit(1);
  if (!c) return;
  const where = and(eq(schema.cohortMembers.cohortId, cohortId), eq(schema.cohortMembers.userId, memberId));
  const [m] = await db.select().from(schema.cohortMembers).where(where).limit(1);
  if (!m || m.completed) return;
  const attendance = Math.max(0, Math.min(c.p.sessionsCount, Number(formData.get("attendance")) || 0));
  const deliverableValidated = formData.get("deliverable") === "on";
  await db.update(schema.cohortMembers).set({ attendance, deliverableValidated }).where(where);
  // Certificat si présence ≥ 75 % et livrable validé (spécification F6).
  if (deliverableValidated && attendance >= Math.ceil(c.p.sessionsCount * 0.75)) {
    await db.update(schema.cohortMembers).set({ completed: true }).where(where);
    const code = certificateCode();
    await db.insert(schema.certificates).values({ id: newId(), code, userId: memberId, title: c.p.certificateTitle, programId: c.p.id, issuedBy: user.id, issuedAt: Date.now() });
    await audit(user.id, "certificate.issue", code);
    await notify(memberId, "certificate", `Félicitations ! Vous obtenez le certificat « ${c.p.certificateTitle} ». Ajoutez-le à votre profil LinkedIn depuis votre CV.`, { link: "/profil/cv" });
  }
  revalidatePath(`/cohortes/${cohortId}`);
}

export async function promoteWaitlist(formData: FormData) {
  const user = await requireUser(["MENTOR"]);
  const cohortId = String(formData.get("cohortId"));
  const memberId = String(formData.get("userId"));
  const [c] = await db.select().from(schema.cohorts).where(and(eq(schema.cohorts.id, cohortId), eq(schema.cohorts.mentorId, user.id))).limit(1);
  if (!c) return;
  const [n] = await db.select({ n: count() }).from(schema.cohortMembers).where(and(eq(schema.cohortMembers.cohortId, cohortId), eq(schema.cohortMembers.status, "ENROLLED")));
  if (Number(n?.n ?? 0) >= c.capacity) return;
  await db.update(schema.cohortMembers).set({ status: "ENROLLED" }).where(and(eq(schema.cohortMembers.cohortId, cohortId), eq(schema.cohortMembers.userId, memberId)));
  await notify(memberId, "cohort_enrolled", "Une place s'est libérée : vous rejoignez la cohorte.", { link: "/programmes" });
  revalidatePath(`/cohortes/${cohortId}`);
}
