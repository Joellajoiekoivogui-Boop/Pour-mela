import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui";
import { DOMAINS, domainLabel } from "@/lib/domains";
import { plural } from "@/lib/format";

export const metadata: Metadata = { title: "Bibliothèque" };
const TYPES: Record<string, string> = { guide: "Guide", checklist: "Check-list", modele: "Modèle", livre: "Livre conseillé", video: "Vidéo" };

export default async function Library({ searchParams }: { searchParams: Promise<{ domaine?: string; type?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const rows = await db.select({ r: schema.resources, author: schema.users.name }).from(schema.resources)
    .innerJoin(schema.users, eq(schema.users.id, schema.resources.authorId))
    .where(and(eq(schema.resources.hidden, false), sp.domaine ? eq(schema.resources.domain, sp.domaine) : undefined, sp.type ? eq(schema.resources.type, sp.type as "guide") : undefined))
    .orderBy(desc(schema.resources.createdAt));
  const chip = (href: string, label: string, on: boolean) => <Link key={href} href={href} className={`rounded-full px-3 py-1 text-sm font-semibold ${on ? "bg-brand text-brand-ink" : "bg-surface-2 text-ink-2"}`}>{label}</Link>;
  return (
    <>
      <PageHeader eyebrow={plural(rows.length, "ressource partagée", "ressources partagées")} title="Bibliothèque" lead="Guides, modèles, check-lists et livres conseillés : l'expérience des mentors, accessible à tout moment."
        actions={user.role !== "MENTEE" ? <Link href="/contribuer" className="btn-primary">Partager une ressource</Link> : undefined} />
      <div className="mb-3 flex flex-wrap gap-2">{chip("/ressources", "Tous les domaines", !sp.domaine)}{DOMAINS.map((d) => chip(`/ressources?domaine=${d.id}`, d.short, sp.domaine === d.id))}</div>
      <div className="mb-6 flex flex-wrap gap-2">{Object.entries(TYPES).map(([k, l]) => chip(`/ressources?${new URLSearchParams({ ...(sp.domaine ? { domaine: sp.domaine } : {}), type: k })}`, l, sp.type === k))}</div>
      {rows.length === 0 ? <EmptyState title="Aucune ressource dans cette catégorie." /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ r, author }) => (
            <Link key={r.id} href={`/ressources/${r.id}`} className="card grid content-start gap-2 p-4 hover:border-accent">
              <span className="text-xs font-bold uppercase tracking-wide text-accent">{TYPES[r.type]} · {domainLabel(r.domain, true)}</span>
              <span className="font-semibold">{r.title}</span>
              <span className="text-sm text-ink-2">{r.summary}</span>
              <span className="text-xs text-ink-3">{author} · {r.minutes} min</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
