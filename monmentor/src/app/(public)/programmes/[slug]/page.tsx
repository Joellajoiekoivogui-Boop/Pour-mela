import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { createCohort, joinCohort } from "@/app/actions/programs";
import { Notice } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { domainLabel } from "@/lib/domains";
import { formatDate } from "@/lib/format";

const FLASH: Record<string, [string, "ok" | "warn" | "bad"]> = {
  inscrit: ["Inscription confirmée. Votre mentor vous contactera avant la première séance.", "ok"],
  attente: ["La cohorte est complète : vous êtes en liste d'attente.", "warn"],
  verification: ["Votre profil doit être vérifié avant d'ouvrir une cohorte.", "bad"],
  consentement: ["L'accord de votre parent ou tuteur est nécessaire avant de vous inscrire.", "bad"],
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [p] = await db.select().from(schema.programs).where(eq(schema.programs.slug, (await params).slug)).limit(1);
  return p ? { title: p.title, description: p.summary } : {};
}

export default async function ProgramPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const [p] = await db.select().from(schema.programs).where(eq(schema.programs.slug, slug)).limit(1);
  if (!p) notFound();
  const user = await getCurrentUser();
  const cohorts = await db.select({ c: schema.cohorts, mentor: schema.users }).from(schema.cohorts)
    .innerJoin(schema.users, eq(schema.users.id, schema.cohorts.mentorId))
    .where(and(eq(schema.cohorts.programId, p.id), inArray(schema.cohorts.status, ["OPEN", "RUNNING"])));
  const members = cohorts.length ? await db.select().from(schema.cohortMembers).where(inArray(schema.cohortMembers.cohortId, cohorts.map((c) => c.c.id))) : [];
  const flash = FLASH[sp.ok ?? sp.erreur ?? ""];
  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-10">
      <Link href="/programmes" className="text-sm text-ink-2 hover:text-ink">← Programmes</Link>
      <header className="grid gap-2">
        <p className="eyebrow">{domainLabel(p.domain)} · {p.weeks} semaines · {p.sessionsCount} séances de {p.sessionMinutes} min</p>
        <h1 className="text-3xl font-bold">{p.title}</h1>
        <p className="text-lg text-ink-2">{p.summary}</p>
      </header>
      {flash && <Notice tone={flash[1]}>{flash[0]}</Notice>}
      <section className="card grid gap-3 p-5">
        <h2 className="font-bold">Le parcours, semaine après semaine</h2>
        <ol className="grid gap-1.5 pl-5 [list-style:decimal]">{p.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        <p className="text-sm text-ink-2">Livrable final : <strong>{p.deliverable}</strong>. Certificat « {p.certificateTitle} » délivré avec au moins 75 % de présence et le livrable validé par le mentor.</p>
      </section>
      <section className="grid gap-3">
        <h2 className="text-lg font-bold">Cohortes ouvertes</h2>
        {cohorts.length === 0 && <p className="text-sm text-ink-2">Aucune cohorte ouverte pour le moment.</p>}
        {cohorts.map(({ c, mentor }) => {
          const enrolled = members.filter((m) => m.cohortId === c.id && m.status === "ENROLLED").length;
          const me = user && members.find((m) => m.cohortId === c.id && m.userId === user.id);
          return (
            <div key={c.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div><p className="font-semibold">Avec {mentor.name}</p><p className="text-sm text-ink-2">Début le {formatDate(c.startsOn)} · {enrolled}/{c.capacity} inscrits</p></div>
              {me ? <span className="text-sm font-semibold text-ok">{me.status === "ENROLLED" ? "✓ Inscrit·e" : "En liste d'attente"}</span>
                : user?.role === "MENTEE" ? <form action={joinCohort}><input type="hidden" name="cohortId" value={c.id} /><SubmitButton className="btn-primary btn-sm">{enrolled >= c.capacity ? "Liste d'attente" : "Rejoindre"}</SubmitButton></form>
                : user?.id === c.mentorId ? <Link href={`/cohortes/${c.id}`} className="btn-ghost btn-sm">Gérer</Link>
                : !user ? <Link href={`/inscription?suite=/programmes/${p.slug}`} className="btn-primary btn-sm">Créer mon compte</Link> : null}
            </div>
          );
        })}
      </section>
      {user?.role === "MENTOR" && (
        <form action={createCohort} className="card grid gap-3 p-5">
          <input type="hidden" name="programId" value={p.id} />
          <h2 className="font-bold">Ouvrir une cohorte</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field"><span className="label">Date de début</span><input type="date" name="startsOn" required min={new Date().toISOString().slice(0, 10)} className="input" /></label>
            <label className="field"><span className="label">Places (5 à 10)</span><input type="number" name="capacity" min={5} max={10} defaultValue={8} className="input" /></label>
          </div>
          <SubmitButton className="btn-primary justify-self-start">Ouvrir la cohorte</SubmitButton>
        </form>
      )}
    </div>
  );
}
