import { eq, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";

// Export de toutes les données d'un membre (droit d'accès et de portabilité).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Connexion requise", { status: 401 });
  const id = user.id;
  const { passwordHash: _p, parentConsentToken: _t, ...profile } = user;
  const data = {
    exportedAt: new Date().toISOString(),
    profile,
    mentorProfile: await db.select().from(schema.mentorProfiles).where(eq(schema.mentorProfiles.userId, id)),
    menteeProfile: await db.select().from(schema.menteeProfiles).where(eq(schema.menteeProfiles.userId, id)),
    careerProfile: await db.select().from(schema.careerProfiles).where(eq(schema.careerProfiles.userId, id)),
    experiences: await db.select().from(schema.experiences).where(eq(schema.experiences.userId, id)),
    mentorships: await db.select().from(schema.mentorships).where(or(eq(schema.mentorships.mentorId, id), eq(schema.mentorships.menteeId, id))),
    sessions: await db.select().from(schema.sessions).where(or(eq(schema.sessions.mentorId, id), eq(schema.sessions.menteeId, id))),
    objectives: await db.select().from(schema.objectives).where(eq(schema.objectives.menteeId, id)),
    messages: await db.select().from(schema.messages).where(or(eq(schema.messages.senderId, id), eq(schema.messages.recipientId, id))),
    endorsements: await db.select().from(schema.skillEndorsements).where(or(eq(schema.skillEndorsements.menteeId, id), eq(schema.skillEndorsements.mentorId, id))),
    recommendations: await db.select().from(schema.recommendations).where(or(eq(schema.recommendations.menteeId, id), eq(schema.recommendations.mentorId, id))),
    certificates: await db.select().from(schema.certificates).where(eq(schema.certificates.userId, id)),
    resources: await db.select().from(schema.resources).where(eq(schema.resources.authorId, id)),
    opportunities: await db.select().from(schema.opportunities).where(eq(schema.opportunities.authorId, id)),
    notifications: await db.select().from(schema.notifications).where(eq(schema.notifications.userId, id)),
  };
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="monmentor-mes-donnees.json"`, "Cache-Control": "private, no-store" },
  });
}
