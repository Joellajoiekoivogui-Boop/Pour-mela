import "server-only";
import { and, avg, count, desc, eq, gte, inArray, isNull, or, sql, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { DEMO_MODE } from "./env";
import type { MentorCandidate } from "./matching";

const { users, mentorProfiles, mentorships, sessions } = schema;

/** Mentors visibles du public : vérifiés au niveau 2 ou plus, non suspendus ; comptes de démo seulement en mode démo. */
export function publicMentorWhere() {
  return and(
    gte(mentorProfiles.verificationLevel, 2),
    isNull(users.suspendedAt),
    DEMO_MODE ? undefined : eq(users.isDemo, false),
  );
}

export type MentorListItem = {
  id: string; name: string; city: string; country: string; isDemo: boolean; gender: string | null;
  title: string; organization: string | null; yearsExperience: number; primaryDomain: string;
  domains: string[]; skills: string[]; languages: string[]; formats: string[];
  capacity: number; verificationLevel: number; activeMentees: number;
  ratingAvg: number | null; ratingCount: number; bio: string | null;
};

export async function listPublicMentors(ids?: string[]): Promise<MentorListItem[]> {
  const ratings = db
    .select({ mentorId: sessions.mentorId, ratingAvg: avg(sessions.rating).as("rating_avg"), ratingCount: count(sessions.rating).as("rating_count") })
    .from(sessions)
    .groupBy(sessions.mentorId)
    .as("r");
  const active = db
    .select({ mentorId: mentorships.mentorId, n: count().as("n") })
    .from(mentorships)
    .where(eq(mentorships.status, "ACTIVE"))
    .groupBy(mentorships.mentorId)
    .as("a");
  const rows = await db
    .select({ u: users, p: mentorProfiles, ratingAvg: ratings.ratingAvg, ratingCount: ratings.ratingCount, active: active.n })
    .from(mentorProfiles)
    .innerJoin(users, eq(users.id, mentorProfiles.userId))
    .leftJoin(ratings, eq(ratings.mentorId, users.id))
    .leftJoin(active, eq(active.mentorId, users.id))
    .where(and(publicMentorWhere(), ids ? inArray(users.id, ids) : undefined))
    .orderBy(desc(mentorProfiles.verificationLevel), users.name);
  return rows.map(({ u, p, ratingAvg, ratingCount, active }) => ({
    id: u.id, name: u.name, city: u.city, country: u.country, isDemo: u.isDemo, gender: u.gender, bio: u.bio,
    title: p.title, organization: p.organization, yearsExperience: p.yearsExperience, primaryDomain: p.primaryDomain,
    domains: p.domains, skills: p.skills, languages: p.languages, formats: p.formats, capacity: p.capacity,
    verificationLevel: p.verificationLevel, activeMentees: Number(active ?? 0),
    ratingAvg: ratingAvg == null ? null : Number(ratingAvg), ratingCount: Number(ratingCount ?? 0),
  }));
}

export async function getPublicMentor(id: string) {
  const [m] = await listPublicMentors([id]);
  return m ?? null;
}

export async function matchingCandidates(menteeId?: string): Promise<MentorCandidate[]> {
  const mentors = await listPublicMentors();
  const related = menteeId
    ? new Set(
        (await db.select({ id: mentorships.mentorId }).from(mentorships)
          .where(and(eq(mentorships.menteeId, menteeId), inArray(mentorships.status, ["ACTIVE", "PENDING"])))).map((r) => r.id),
      )
    : new Set<string>();
  return mentors.map((m) => ({
    id: m.id, name: m.name, city: m.city, country: m.country, primaryDomain: m.primaryDomain,
    domains: m.domains, skills: m.skills, languages: m.languages, formats: m.formats,
    capacity: m.capacity, activeMentees: m.activeMentees, ratingAvg: m.ratingAvg, ratingCount: m.ratingCount,
    alreadyRelated: related.has(m.id),
  }));
}

/** Profil d'impact d'un mentor (spécification F1). */
export async function mentorImpact(mentorId: string) {
  const [s] = await db
    .select({
      done: count(),
      minutes: sum(sessions.durationMin),
      mentees: sql<number>`count(distinct ${sessions.menteeId})`,
    })
    .from(sessions)
    .where(and(eq(sessions.mentorId, mentorId), eq(sessions.status, "COMPLETED")));
  const [r] = await db.select({ n: count() }).from(schema.resources).where(and(eq(schema.resources.authorId, mentorId), eq(schema.resources.hidden, false)));
  const [o] = await db.select({ n: count() }).from(schema.opportunities).where(eq(schema.opportunities.authorId, mentorId));
  const [rec] = await db.select({ n: count() }).from(schema.recommendations).where(and(eq(schema.recommendations.mentorId, mentorId), eq(schema.recommendations.status, "APPROVED")));
  return {
    sessionsDone: Number(s?.done ?? 0),
    hours: Math.round((Number(s?.minutes ?? 0) / 60) * 10) / 10,
    mentees: Number(s?.mentees ?? 0),
    resources: Number(r?.n ?? 0),
    opportunities: Number(o?.n ?? 0),
    recommendations: Number(rec?.n ?? 0),
  };
}

/** Nombre de séances terminées entre un mentor et un mentoré (condition des validations et recommandations). */
export async function completedSessionsBetween(mentorId: string, menteeId: string): Promise<number> {
  const [r] = await db
    .select({ n: count() })
    .from(sessions)
    .where(and(eq(sessions.mentorId, mentorId), eq(sessions.menteeId, menteeId), or(eq(sessions.status, "COMPLETED"), eq(sessions.status, "TO_REVIEW"))));
  return Number(r?.n ?? 0);
}

export async function activeMentorship(a: string, b: string) {
  const [m] = await db
    .select()
    .from(mentorships)
    .where(and(
      eq(mentorships.status, "ACTIVE"),
      or(and(eq(mentorships.mentorId, a), eq(mentorships.menteeId, b)), and(eq(mentorships.mentorId, b), eq(mentorships.menteeId, a))),
    ))
    .limit(1);
  return m ?? null;
}

export async function unreadCounts(userId: string) {
  const [n] = await db.select({ n: count() }).from(schema.notifications)
    .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.channel, "inapp"), isNull(schema.notifications.readAt)));
  const [m] = await db.select({ n: count() }).from(schema.messages)
    .where(and(eq(schema.messages.recipientId, userId), isNull(schema.messages.readAt)));
  return { notifications: Number(n?.n ?? 0), messages: Number(m?.n ?? 0) };
}

export type SessionRow = typeof schema.sessions.$inferSelect & { mentorName: string; menteeName: string | null };

export async function sessionsFor(userId: string, role: "MENTOR" | "MENTEE" | "ADMIN"): Promise<SessionRow[]> {
  const mentee = sql<string | null>`(select name from users where users.id = ${sessions.menteeId})`;
  const rows = await db
    .select({ s: sessions, mentorName: users.name, menteeName: mentee })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.mentorId))
    .where(role === "MENTOR" ? eq(sessions.mentorId, userId) : eq(sessions.menteeId, userId))
    .orderBy(sessions.startsAt);
  return rows.map((r) => ({ ...r.s, mentorName: r.mentorName, menteeName: r.menteeName }));
}

export async function objectivesWithSteps(menteeIds: string[]) {
  if (!menteeIds.length) return [];
  const objs = await db.select().from(schema.objectives).where(inArray(schema.objectives.menteeId, menteeIds)).orderBy(schema.objectives.dueDate);
  const steps = objs.length
    ? await db.select().from(schema.objectiveSteps).where(inArray(schema.objectiveSteps.objectiveId, objs.map((o) => o.id))).orderBy(schema.objectiveSteps.position)
    : [];
  return objs.map((o) => {
    const st = steps.filter((s) => s.objectiveId === o.id);
    const done = st.filter((s) => s.done).length;
    return { ...o, steps: st, progress: st.length ? Math.round((done / st.length) * 100) : 0, next: st.find((s) => !s.done)?.title ?? null };
  });
}

export async function relationsOf(userId: string, role: "MENTOR" | "MENTEE") {
  const other = role === "MENTOR" ? mentorships.menteeId : mentorships.mentorId;
  return db
    .select({ m: mentorships, person: users })
    .from(mentorships)
    .innerJoin(users, eq(users.id, other))
    .where(role === "MENTOR" ? eq(mentorships.mentorId, userId) : eq(mentorships.menteeId, userId))
    .orderBy(desc(mentorships.createdAt));
}
