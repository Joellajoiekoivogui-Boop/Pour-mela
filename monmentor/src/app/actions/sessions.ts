"use server";
import { createHmac } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, max } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { cancelSessionReminders, notify, scheduleSessionReminders } from "@/lib/notify";
import { activeMentorship } from "@/lib/queries";
import { needsParentalConsent } from "@/lib/guards";
import { formatDateTime, isMinor } from "@/lib/format";
import { VISIO_BASE_URL } from "@/lib/env";
import { endsAt } from "@/lib/session-status";

async function loadSession(id: string) {
  const [s] = await db.select().from(schema.sessions).where(eq(schema.sessions.id, id)).limit(1);
  return s ?? null;
}
const nameOf = async (id: string | null) =>
  id ? (await db.select({ n: schema.users.name }).from(schema.users).where(eq(schema.users.id, id)).limit(1))[0]?.n ?? "" : "";

export async function createSession(formData: FormData) {
  const user = await requireUser(["MENTOR", "MENTEE"]);
  const otherId = String(formData.get("otherId") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const slot = String(formData.get("slot") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const duration = Math.min(120, Math.max(30, Number(formData.get("duration") ?? 45)));
  let format = String(formData.get("format") ?? "visio") as "visio" | "chat" | "presentiel";
  const objectiveId = String(formData.get("objectiveId") ?? "") || null;
  const back = `/seances/nouvelle?${user.role === "MENTEE" ? "mentor" : "mentore"}=${otherId}`;

  const startsAt = slot ? Number(slot) : Date.parse(`${date}T${time}:00Z`); // heure de Conakry = UTC
  if (!title || !Number.isFinite(startsAt)) redirect(`${back}&erreur=champs`);
  if (startsAt < Date.now() + 30 * 60_000) redirect(`${back}&erreur=date`);
  if (!(await activeMentorship(user.id, otherId))) redirect(`${back}&erreur=relation`);
  const menteeId = user.role === "MENTEE" ? user.id : otherId;
  const mentorId = user.role === "MENTOR" ? user.id : otherId;
  const [mentee] = await db.select().from(schema.users).where(eq(schema.users.id, menteeId)).limit(1);
  if (user.role === "MENTEE" && needsParentalConsent(user)) redirect(`${back}&erreur=consentement`);
  if (mentee && isMinor(mentee.birthDate) && format === "presentiel") format = "visio"; // mineurs : visio uniquement

  const id = newId();
  const status = user.role === "MENTOR" ? "CONFIRMED" : "REQUESTED";
  await db.insert(schema.sessions).values({ id, mentorId, menteeId, title, startsAt, durationMin: duration, format, status, objectiveId, createdAt: Date.now() });
  const when = formatDateTime(startsAt);
  if (status === "REQUESTED") {
    await notify(mentorId, "session_request", `${user.name} demande une séance « ${title} », ${when}.`, { link: `/seances/${id}` });
  } else {
    await notify(menteeId, "session_confirmed", `${user.name} a programmé une séance « ${title} », ${when}.`, { link: `/seances/${id}` });
    await scheduleSessionReminders({ id, title, startsAt, durationMin: duration, mentorId, menteeId, mentorName: user.name, menteeName: mentee?.name ?? "" });
  }
  revalidatePath("/seances");
  redirect(`/seances/${id}`);
}

export async function respondSession(formData: FormData) {
  const user = await requireUser(["MENTOR"]);
  const s = await loadSession(String(formData.get("id")));
  if (!s || s.mentorId !== user.id || s.status !== "REQUESTED") return;
  const accept = formData.get("decision") === "accept";
  await db.update(schema.sessions).set({ status: accept ? "CONFIRMED" : "DECLINED" }).where(eq(schema.sessions.id, s.id));
  if (s.menteeId) {
    await notify(s.menteeId, accept ? "session_confirmed" : "session_declined",
      accept ? `Votre séance « ${s.title} » avec ${user.name} est confirmée, ${formatDateTime(s.startsAt)}.` : `${user.name} ne peut pas assurer la séance « ${s.title} ». Proposez un autre créneau.`,
      { link: `/seances/${s.id}` });
  }
  if (accept) await scheduleSessionReminders({ ...s, mentorName: user.name, menteeName: await nameOf(s.menteeId) });
  revalidatePath(`/seances/${s.id}`);
}

export async function cancelSession(formData: FormData) {
  const user = await requireUser();
  const s = await loadSession(String(formData.get("id")));
  if (!s || (s.mentorId !== user.id && s.menteeId !== user.id)) return;
  if (!["REQUESTED", "CONFIRMED"].includes(s.status) || s.startsAt <= Date.now()) return;
  await db.update(schema.sessions).set({ status: "CANCELLED" }).where(eq(schema.sessions.id, s.id));
  await cancelSessionReminders(s.id);
  const other = s.mentorId === user.id ? s.menteeId : s.mentorId;
  if (other) await notify(other, "session_cancelled", `${user.name} a annulé la séance « ${s.title} » du ${formatDateTime(s.startsAt)}.`, { link: `/seances/${s.id}` });
  revalidatePath(`/seances/${s.id}`);
}

/** Salle de visio propre à la séance, au nom impossible à deviner. */
function roomName(sessionId: string) {
  const secret = process.env.AUTH_SECRET ?? process.env.CRON_SECRET ?? "monmentor-dev-secret";
  return `MonMentor-${createHmac("sha256", secret).update(sessionId).digest("hex").slice(0, 20)}`;
}

export async function joinSession(formData: FormData) {
  const user = await requireUser();
  const s = await loadSession(String(formData.get("id")));
  if (!s || (s.mentorId !== user.id && s.menteeId !== user.id) || s.status !== "CONFIRMED") redirect("/seances");
  if (Date.now() < s.startsAt - 15 * 60_000 || Date.now() > endsAt(s) + 30 * 60_000) redirect(`/seances/${s.id}?erreur=horaire`);
  const field = s.mentorId === user.id ? { joinedAtMentor: s.joinedAtMentor ?? Date.now() } : { joinedAtMentee: s.joinedAtMentee ?? Date.now() };
  await db.update(schema.sessions).set(field).where(eq(schema.sessions.id, s.id));
  const audio = formData.get("mode") === "audio";
  const hash = audio ? "#config.startWithVideoMuted=true&config.startAudioOnly=true" : "#config.prejoinConfig.enabled=true";
  redirect(`${VISIO_BASE_URL}/${roomName(s.id)}${hash}`);
}

export async function closeSession(formData: FormData) {
  const user = await requireUser(["MENTOR"]);
  const s = await loadSession(String(formData.get("id")));
  if (!s || s.mentorId !== user.id || s.startsAt > Date.now()) return;
  const summary = String(formData.get("summary") ?? "").trim().slice(0, 2000);
  if (!summary) redirect(`/seances/${s.id}?erreur=resume`);
  const actions = String(formData.get("nextActions") ?? "").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 3);
  const skill = String(formData.get("skill") ?? "").trim().slice(0, 60) || null;
  const status = s.rating ? "COMPLETED" : "TO_REVIEW";
  await db.update(schema.sessions).set({ summary, nextActions: actions, skillWorked: skill, status, closedAt: status === "COMPLETED" ? Date.now() : null })
    .where(eq(schema.sessions.id, s.id));
  // Les prochaines actions deviennent des étapes de l'objectif lié (ou d'un objectif de suivi).
  if (actions.length && s.menteeId) {
    let objectiveId = s.objectiveId;
    if (!objectiveId) {
      const [mp] = await db.select().from(schema.mentorProfiles).where(eq(schema.mentorProfiles.userId, user.id)).limit(1);
      objectiveId = newId();
      await db.insert(schema.objectives).values({ id: objectiveId, menteeId: s.menteeId, title: `Suivi avec ${user.name}`, domain: mp?.primaryDomain ?? "insertion", createdAt: Date.now() });
      await db.update(schema.sessions).set({ objectiveId }).where(eq(schema.sessions.id, s.id));
    }
    const [pos] = await db.select({ p: max(schema.objectiveSteps.position) }).from(schema.objectiveSteps).where(eq(schema.objectiveSteps.objectiveId, objectiveId));
    const due = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);
    await db.insert(schema.objectiveSteps).values(actions.map((title, i) => ({ id: newId(), objectiveId: objectiveId!, title, position: (pos?.p ?? 0) + i + 1, dueDate: due, fromSessionId: s.id })));
    await notify(s.menteeId, "session_summary", `${user.name} a écrit le compte rendu de « ${s.title} » : ${actions.length} prochaine(s) action(s) ajoutée(s) à vos objectifs.`, { link: "/objectifs" });
  }
  revalidatePath(`/seances/${s.id}`);
  redirect(`/seances/${s.id}?ok=cloture`);
}

export async function rateSession(formData: FormData) {
  const user = await requireUser(["MENTEE"]);
  const s = await loadSession(String(formData.get("id")));
  if (!s || s.menteeId !== user.id || s.startsAt > Date.now()) return;
  const rating = Math.round(Number(formData.get("rating")));
  if (!(rating >= 1 && rating <= 5)) redirect(`/seances/${s.id}?erreur=note`);
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 600) || null;
  const status = s.summary ? "COMPLETED" : s.status === "CONFIRMED" ? "TO_REVIEW" : s.status;
  await db.update(schema.sessions).set({ rating, ratingComment: comment, status, closedAt: status === "COMPLETED" ? Date.now() : s.closedAt })
    .where(and(eq(schema.sessions.id, s.id), eq(schema.sessions.menteeId, user.id)));
  revalidatePath(`/seances/${s.id}`);
  redirect(`/seances/${s.id}?ok=avis`);
}
