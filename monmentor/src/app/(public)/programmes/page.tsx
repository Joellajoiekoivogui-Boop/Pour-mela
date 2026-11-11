import type { Metadata } from "next";
import Link from "next/link";
import { db, schema } from "@/db";
import { PageHeader } from "@/components/ui";
import { domainLabel } from "@/lib/domains";

export const metadata: Metadata = { title: "Programmes", description: "Des parcours de groupe de 6 à 8 semaines, avec un mentor et un certificat vérifiable à la clé." };
export const dynamic = "force-dynamic";

export default async function Programs() {
  const programs = await db.select().from(schema.programs);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader eyebrow="Mentorat de groupe" title="Les programmes" lead="Un mentor, 5 à 10 jeunes, 6 à 8 semaines. À la fin : un livrable concret et un certificat vérifiable, à ajouter à votre profil LinkedIn." />
      <div className="grid gap-4 md:grid-cols-2">
        {programs.map((p) => (
          <Link key={p.id} href={`/programmes/${p.slug}`} className="card grid gap-2 p-5 hover:border-accent">
            <span className="text-xs font-bold uppercase tracking-wide text-accent">{domainLabel(p.domain)} · {p.weeks} semaines</span>
            <span className="text-xl font-semibold">{p.title}</span>
            <span className="text-ink-2">{p.summary}</span>
            <span className="text-sm text-ink-3">{p.sessionsCount} séances de {p.sessionMinutes} min · Livrable : {p.deliverable}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
