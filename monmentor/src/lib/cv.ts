import "server-only";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import QRCode from "qrcode";
import { db, schema } from "@/db";
import { objectivesWithSteps, mentorImpact } from "./queries";
import { siteUrl } from "./env";
import { isMinor } from "./format";

export type CvData = NonNullable<Awaited<ReturnType<typeof loadCv>>>;

export async function loadCv(where: { userId?: string; slug?: string }) {
  const [row] = await db
    .select({ cv: schema.careerProfiles, user: schema.users })
    .from(schema.careerProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.careerProfiles.userId))
    .where(where.userId ? eq(schema.careerProfiles.userId, where.userId) : eq(schema.careerProfiles.slug, where.slug ?? ""))
    .limit(1);
  if (!row) return null;
  const { cv, user } = row;
  const id = user.id;
  const [experiences, endorsementRows, recoRows, certificates, sessions] = await Promise.all([
    db.select().from(schema.experiences).where(eq(schema.experiences.userId, id)).orderBy(desc(schema.experiences.start)),
    db.select({ e: schema.skillEndorsements, mentor: schema.users.name }).from(schema.skillEndorsements)
      .innerJoin(schema.users, eq(schema.users.id, schema.skillEndorsements.mentorId)).where(eq(schema.skillEndorsements.menteeId, id)),
    db.select({ r: schema.recommendations, mentor: schema.users, profile: schema.mentorProfiles }).from(schema.recommendations)
      .innerJoin(schema.users, eq(schema.users.id, schema.recommendations.mentorId))
      .leftJoin(schema.mentorProfiles, eq(schema.mentorProfiles.userId, schema.recommendations.mentorId))
      .where(eq(schema.recommendations.menteeId, id)).orderBy(desc(schema.recommendations.createdAt)),
    db.select().from(schema.certificates).where(and(eq(schema.certificates.userId, id), isNull(schema.certificates.revokedAt))).orderBy(desc(schema.certificates.issuedAt)),
    db.select().from(schema.sessions).where(and(
      user.role === "MENTOR" ? eq(schema.sessions.mentorId, id) : eq(schema.sessions.menteeId, id),
      inArray(schema.sessions.status, ["COMPLETED", "TO_REVIEW"]),
    )),
  ]);
  const skills = new Map<string, string[]>();
  for (const { e, mentor } of endorsementRows) skills.set(e.skill, [...(skills.get(e.skill) ?? []), mentor]);
  const objectives = user.role === "MENTEE" ? await objectivesWithSteps([id]) : [];
  const [mentorProfile] = user.role === "MENTOR" ? await db.select().from(schema.mentorProfiles).where(eq(schema.mentorProfiles.userId, id)).limit(1) : [];
  const [menteeProfile] = user.role === "MENTEE" ? await db.select().from(schema.menteeProfiles).where(eq(schema.menteeProfiles.userId, id)).limit(1) : [];
  const mentorIds = [...new Set(sessions.map((s) => s.mentorId))];
  const mentors = user.role === "MENTEE" && mentorIds.length
    ? await db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).where(inArray(schema.users.id, mentorIds))
    : [];
  return {
    cv, user, experiences, certificates, objectives, mentorProfile, menteeProfile, mentors,
    endorsed: [...skills.entries()].map(([skill, by]) => ({ skill, by })),
    recommendations: recoRows.map(({ r, mentor, profile }) => ({ ...r, mentorName: mentor.name, mentorTitle: profile ? `${profile.title}${profile.organization ? `, ${profile.organization}` : ""}` : null })),
    sessionsCount: sessions.length,
    hours: Math.round((sessions.reduce((a, s) => a + s.durationMin, 0) / 60) * 10) / 10,
    impact: user.role === "MENTOR" ? await mentorImpact(id) : null,
  };
}

/** Règles de visibilité : PRIVATE = soi seulement ; LINK = avec le jeton ; PUBLIC = tous (jamais pour un mineur). */
export function canViewCv(d: CvData, token: string | undefined, viewerId: string | undefined): boolean {
  if (viewerId === d.user.id) return true;
  if (d.user.suspendedAt) return false;
  const vis = isMinor(d.user.birthDate) && d.cv.visibility === "PUBLIC" ? "LINK" : d.cv.visibility;
  if (vis === "PUBLIC") return true;
  if (vis === "LINK") return !!token && token === d.cv.shareToken;
  return false;
}

export function cvUrl(d: Pick<CvData, "cv">): string {
  const base = `${siteUrl()}/cv/${d.cv.slug}`;
  return d.cv.visibility === "LINK" ? `${base}?t=${d.cv.shareToken}` : base;
}

export const certUrl = (code: string) => `${siteUrl()}/verif/${code}`;

export async function qrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { margin: 1, width: 240, errorCorrectionLevel: "M" });
}
