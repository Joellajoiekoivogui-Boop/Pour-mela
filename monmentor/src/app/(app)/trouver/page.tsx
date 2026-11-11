import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Recommendation } from "@/components/recommendation";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Trouver un mentor" };

export default async function FindMentor({ searchParams }: { searchParams: Promise<{ besoin?: string; d?: string | string[]; ajuste?: string }> }) {
  const user = await requireUser(["MENTEE"]);
  const sp = await searchParams;
  const [mp] = await db.select().from(schema.menteeProfiles).where(eq(schema.menteeProfiles.userId, user.id)).limit(1);
  const besoin = sp.besoin ?? mp?.need ?? "";
  if (sp.besoin && sp.besoin !== mp?.need) {
    await db.update(schema.menteeProfiles).set({ need: sp.besoin.slice(0, 2000) }).where(eq(schema.menteeProfiles.userId, user.id));
  }
  return (
    <>
      <PageHeader eyebrow="Recommandation guidée" title="De quoi avez-vous besoin ?" lead="Expliquez votre situation comme vous le feriez à un ami. MonMentor repère les domaines concernés et vous propose les mentors les plus adaptés, en expliquant pourquoi." />
      <Recommendation action="/trouver" besoin={besoin} ajuste={sp.ajuste === "1"} domainesForces={[sp.d ?? []].flat()} menteeId={user.id} city={user.city} country={user.country} />
    </>
  );
}
