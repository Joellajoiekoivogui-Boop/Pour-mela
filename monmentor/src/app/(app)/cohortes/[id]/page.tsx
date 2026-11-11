import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { promoteWaitlist, updateMember } from "@/app/actions/programs";
import { Avatar, Badge, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Cohorte" };

export default async function CohortPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [row] = await db.select({ c: schema.cohorts, p: schema.programs }).from(schema.cohorts)
    .innerJoin(schema.programs, eq(schema.programs.id, schema.cohorts.programId)).where(eq(schema.cohorts.id, id)).limit(1);
  if (!row) notFound();
  const members = await db.select({ m: schema.cohortMembers, u: schema.users }).from(schema.cohortMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.cohortMembers.userId)).where(eq(schema.cohortMembers.cohortId, id));
  const isMentor = row.c.mentorId === user.id;
  if (!isMentor && user.role !== "ADMIN" && !members.some((m) => m.u.id === user.id)) notFound();
  const threshold = Math.ceil(row.p.sessionsCount * 0.75);
  return (
    <div className="grid gap-6">
      <Link href={isMentor ? "/mentores" : "/programmes"} className="text-sm text-ink-2 hover:text-ink">← Retour</Link>
      <PageHeader eyebrow={`Cohorte · début le ${formatDate(row.c.startsOn)}`} title={row.p.title} lead={`Certificat avec ${threshold} séances suivies sur ${row.p.sessionsCount} et le livrable validé : ${row.p.deliverable}.`}
        actions={isMentor ? <Link href="/seances/nouvelle" className="btn-ghost">Programmer une séance</Link> : undefined} />
      <ul className="grid gap-2">
        {members.map(({ m, u }) => (
          <li key={u.id} className="card flex flex-wrap items-center gap-3 p-4">
            <Avatar name={u.name} size={36} />
            <span className="min-w-40 font-semibold">{u.name}</span>
            {m.status === "WAITLIST" ? (
              <>
                <Badge tone="warn">Liste d&apos;attente</Badge>
                {isMentor && <form action={promoteWaitlist} className="ml-auto"><input type="hidden" name="cohortId" value={id} /><input type="hidden" name="userId" value={u.id} /><button className="btn-ghost btn-sm">Inscrire</button></form>}
              </>
            ) : m.completed ? (
              <Badge tone="ok">🏅 Certificat délivré</Badge>
            ) : isMentor ? (
              <form action={updateMember} className="ml-auto flex flex-wrap items-center gap-3 text-sm">
                <input type="hidden" name="cohortId" value={id} /><input type="hidden" name="userId" value={u.id} />
                <label className="flex items-center gap-2">Séances suivies <input name="attendance" type="number" min={0} max={row.p.sessionsCount} defaultValue={m.attendance} className="input w-20 min-h-9 py-1" /></label>
                <label className="flex items-center gap-2"><input type="checkbox" name="deliverable" defaultChecked={m.deliverableValidated} className="accent-[var(--accent)]" />Livrable validé</label>
                <button className="btn-ghost btn-sm">Enregistrer</button>
              </form>
            ) : <span className="ml-auto text-sm text-ink-2">{m.attendance}/{row.p.sessionsCount} séances</span>}
          </li>
        ))}
        {members.length === 0 && <li className="text-sm text-ink-2">Pas encore d&apos;inscrit. Partagez le lien du programme : /programmes/{row.p.slug}</li>}
      </ul>
    </div>
  );
}
