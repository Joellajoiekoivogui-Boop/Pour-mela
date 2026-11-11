import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq, gte } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { toggleInterest } from "@/app/actions/content";
import { EmptyState, Notice, PageHeader } from "@/components/ui";
import { ReportButton } from "@/components/report-button";
import { DOMAINS, domainLabel } from "@/lib/domains";
import { daysUntil, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Opportunités" };
const TYPES = ["stage", "emploi", "bourse", "concours", "incubation", "evenement"];

export default async function Opportunities({ searchParams }: { searchParams: Promise<{ domaine?: string; type?: string; selection?: string; ok?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const mine = new Set((await db.select().from(schema.opportunityInterests).where(eq(schema.opportunityInterests.userId, user.id))).map((i) => i.opportunityId));
  const rows = (await db.select({ o: schema.opportunities, author: schema.users.name }).from(schema.opportunities)
    .innerJoin(schema.users, eq(schema.users.id, schema.opportunities.authorId))
    .where(and(eq(schema.opportunities.hidden, false), gte(schema.opportunities.deadline, today),
      sp.domaine ? eq(schema.opportunities.domain, sp.domaine) : undefined, sp.type ? eq(schema.opportunities.type, sp.type as "stage") : undefined))
    .orderBy(asc(schema.opportunities.deadline)))
    .filter(({ o }) => !sp.selection || mine.has(o.id));
  const counts = new Map<string, number>();
  for (const i of await db.select().from(schema.opportunityInterests)) counts.set(i.opportunityId, (counts.get(i.opportunityId) ?? 0) + 1);
  return (
    <>
      <PageHeader eyebrow="Stages, emplois, bourses, concours" title="Opportunités" lead="Partagées par les mentors et les partenaires. Repérez-les, puis préparez votre candidature avec votre mentor."
        actions={user.role !== "MENTEE" ? <Link href="/contribuer#opportunite" className="btn-primary">Publier une opportunité</Link> : undefined} />
      {sp.ok && <div className="mb-4"><Notice tone="ok">Opportunité publiée. Les mentorés intéressés par ce domaine ont été prévenus.</Notice></div>}
      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <label className="field"><span className="label">Domaine</span><select name="domaine" defaultValue={sp.domaine ?? ""} className="input"><option value="">Tous</option>{DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.short}</option>)}</select></label>
        <label className="field"><span className="label">Type</span><select name="type" defaultValue={sp.type ?? ""} className="input capitalize"><option value="">Tous</option>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
        <label className="flex items-center gap-2 pb-3 text-sm"><input type="checkbox" name="selection" value="1" defaultChecked={!!sp.selection} className="accent-[var(--accent)]" />Ma sélection</label>
        <button className="btn-dark">Filtrer</button>
      </form>
      {rows.length === 0 ? <EmptyState title="Aucune opportunité ouverte ici." /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map(({ o, author }) => {
            const left = daysUntil(o.deadline);
            return (
              <article key={o.id} className="card grid content-start gap-2 p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-accent">{o.type} · {domainLabel(o.domain, true)}</span>
                  <span className={`text-xs font-semibold ${left <= 7 ? "text-bad" : "text-ink-2"}`}>J-{left} · {formatDate(o.deadline)}</span>
                </div>
                <h2 className="text-lg font-semibold">{o.title}</h2>
                <p className="text-sm text-ink-3">{o.organization} · {o.location}</p>
                <p className="text-sm text-ink-2">{o.description}</p>
                <p className="text-xs text-ink-3">Partagé par {author}{counts.get(o.id) ? ` · ${counts.get(o.id)} intéressé·e(s)` : ""}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <form action={toggleInterest}><input type="hidden" name="opportunityId" value={o.id} />
                    <button className={mine.has(o.id) ? "btn-dark btn-sm" : "btn-ghost btn-sm"} aria-pressed={mine.has(o.id)}>{mine.has(o.id) ? "✓ Dans ma sélection" : "Ça m'intéresse"}</button></form>
                  {o.url && <a href={o.url} target="_blank" rel="noopener noreferrer" className="link text-sm">Voir l&apos;annonce ↗</a>}
                  <span className="ml-auto"><ReportButton targetType="OPPORTUNITY" targetId={o.id} /></span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
