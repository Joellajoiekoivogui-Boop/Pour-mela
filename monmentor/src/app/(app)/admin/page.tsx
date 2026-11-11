import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { impactKpis } from "@/lib/impact";
import { Notice, PageHeader, Stat } from "@/components/ui";

export const metadata: Metadata = { title: "Coordination" };
const pct = (v: number | null) => (v === null ? "—" : `${v} %`);

export default async function AdminHome() {
  const k = await impactKpis();
  const [reports] = await db.select({ n: count() }).from(schema.reports).where(eq(schema.reports.status, "OPEN"));
  const [verifs] = await db.select({ n: count() }).from(schema.verifications).where(eq(schema.verifications.status, "PENDING"));
  return (
    <>
      <PageHeader eyebrow="Coordination" title="Tableau d'impact" lead="Indicateurs du programme, recalculés à chaque visite." actions={<a href="/api/admin/impact" className="btn-ghost">Exporter (CSV)</a>} />
      {k.includesDemo && <Notice tone="warn">Mode démonstration : les comptes fictifs sont inclus dans ces chiffres. En production, ils en sont exclus.</Notice>}
      {(Number(reports?.n) > 0 || Number(verifs?.n) > 0) && <Notice tone="info">{Number(reports?.n)} signalement(s) ouvert(s) · {Number(verifs?.n)} vérification(s) en attente.</Notice>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Mentorés" value={k.members.mentees} />
        <Stat label="Mentors" value={k.members.mentors} />
        <Stat label="Jumelages actifs" value={k.activePairs} hint="≥ 2 séances sur 60 jours" />
        <Stat label="Taux de présence" value={pct(k.attendance)} hint="Cible ≥ 80 %" />
        <Stat label="Objectifs atteints" value={pct(k.objectivesRate)} hint="Avant l'échéance · cible ≥ 50 %" />
        <Stat label="Délai du 1er jumelage" value={k.medianDaysToFirstMatch === null ? "—" : `${Math.round(k.medianDaysToFirstMatch)} j`} hint="Médiane · cible ≤ 7 jours" />
        <Stat label="Rétention des mentors" value={pct(k.mentorRetention)} hint="À 3 mois · cible ≥ 70 %" />
        <Stat label="Séances terminées" value={k.sessionsDone} hint={`${k.hours.toLocaleString("fr-FR")} h d'accompagnement`} />
        <Stat label="Certificats" value={k.certificates} />
        <Stat label="CV partagés" value={Object.values(k.shares).reduce((a, b) => a + b, 0)} hint={Object.entries(k.shares).map(([c, n]) => `${c} ${n}`).join(" · ") || "aucun pour l'instant"} />
      </div>
      <section className="card grid gap-2 p-5">
        <h2 className="font-bold">Rappels envoyés (30 derniers jours)</h2>
        {Object.keys(k.notifications).length === 0 ? <p className="text-sm text-ink-2">Aucun envoi externe.</p> : (
          <table className="text-sm"><thead><tr className="text-left text-ink-3"><th className="py-1">Canal</th><th>Envoyés</th><th>Échecs</th></tr></thead>
            <tbody>{Object.entries(k.notifications).map(([c, v]) => <tr key={c}><td className="py-1 capitalize">{c}</td><td className="tabular-nums">{v.sent}</td><td className="tabular-nums">{v.failed}</td></tr>)}</tbody></table>
        )}
        <p className="hint">Le coût unitaire dépend de votre fournisseur SMS et de la tarification WhatsApp ; multipliez par le nombre d&apos;envois.</p>
      </section>
      <p className="text-sm text-ink-3">Insertion à 6 mois : à mesurer par le questionnaire envoyé aux mentorés six mois après leur premier jumelage.</p>
    </>
  );
}
