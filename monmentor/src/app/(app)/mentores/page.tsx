import type { Metadata } from "next";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { relationsOf } from "@/lib/queries";
import { respondMentorship } from "@/app/actions/mentorship";
import { Avatar, EmptyState, Notice, PageHeader } from "@/components/ui";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Mes mentorés" };

const ERR: Record<string, string> = {
  verification: "Votre profil doit être vérifié (niveau 2) avant d'accepter un mentoré.",
  complet: "Vous avez atteint le nombre de mentorés que vous avez fixé. Augmentez-le dans votre profil pour en accepter un autre.",
};

export default async function MyMentees({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const user = await requireUser(["MENTOR"]);
  const { erreur } = await searchParams;
  const rel = await relationsOf(user.id, "MENTOR");
  const pending = rel.filter((r) => r.m.status === "PENDING");
  const active = rel.filter((r) => r.m.status === "ACTIVE");
  const cohorts = await db.select({ c: schema.cohorts, p: schema.programs }).from(schema.cohorts)
    .innerJoin(schema.programs, eq(schema.programs.id, schema.cohorts.programId))
    .where(and(eq(schema.cohorts.mentorId, user.id)));
  return (
    <>
      <PageHeader eyebrow="Espace mentor" title="Mes mentorés" />
      {erreur && ERR[erreur] && <div className="mb-4"><Notice tone="bad">{ERR[erreur]}</Notice></div>}
      <section className="mb-8 grid gap-3">
        <h2 className="text-lg font-bold">Demandes ({pending.length})</h2>
        {pending.length === 0 ? <p className="text-sm text-ink-2">Aucune demande en attente.</p> : pending.map(({ m, person }) => (
          <div key={m.id} className="card grid gap-3 p-4">
            <div className="flex items-center gap-3"><Avatar name={person.name} /><div><p className="font-semibold">{person.name}</p><p className="text-xs text-ink-3">{person.city} · {relativeTime(m.createdAt)}</p></div></div>
            {m.message && <p className="rounded-lg bg-surface-2 p-3 text-sm">« {m.message} »</p>}
            <form action={respondMentorship} className="flex gap-2"><input type="hidden" name="id" value={m.id} />
              <button name="decision" value="accept" className="btn-primary btn-sm">Accepter</button><button name="decision" value="decline" className="btn-ghost btn-sm">Décliner</button></form>
          </div>
        ))}
      </section>
      <section className="mb-8 grid gap-3">
        <h2 className="text-lg font-bold">Accompagnements en cours ({active.length})</h2>
        {active.length === 0 ? <EmptyState title="Aucun mentoré pour le moment." /> : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {active.map(({ person }) => (
              <li key={person.id}><Link href={`/mentores/${person.id}`} className="card flex items-center gap-3 p-4 hover:border-accent"><Avatar name={person.name} /><span><span className="block font-semibold">{person.name}</span><span className="text-xs text-ink-3">{person.city}</span></span><span className="ml-auto text-sm link">Ouvrir sa fiche</span></Link></li>
            ))}
          </ul>
        )}
      </section>
      <section className="grid gap-3">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Mes cohortes</h2><Link href="/programmes" className="link text-sm">Ouvrir une cohorte</Link></div>
        {cohorts.length === 0 ? <p className="text-sm text-ink-2">Accompagnez 5 à 10 jeunes à la fois sur un programme de 6 à 8 semaines.</p> : cohorts.map(({ c, p }) => (
          <Link key={c.id} href={`/cohortes/${c.id}`} className="card flex justify-between gap-3 p-4 hover:border-accent"><span className="font-semibold">{p.title}</span><span className="text-sm text-ink-2">début le {c.startsOn}</span></Link>
        ))}
      </section>
    </>
  );
}
