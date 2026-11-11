import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { reviewVerification, setLevel } from "@/app/actions/admin";
import { Badge, PageHeader, VerifiedBadge } from "@/components/ui";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Vérifications" };

export default async function AdminMentors() {
  const pending = await db.select({ v: schema.verifications, u: schema.users, p: schema.mentorProfiles }).from(schema.verifications)
    .innerJoin(schema.users, eq(schema.users.id, schema.verifications.userId))
    .leftJoin(schema.mentorProfiles, eq(schema.mentorProfiles.userId, schema.verifications.userId))
    .where(eq(schema.verifications.status, "PENDING")).orderBy(schema.verifications.createdAt);
  const mentors = await db.select({ u: schema.users, p: schema.mentorProfiles }).from(schema.mentorProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.mentorProfiles.userId)).orderBy(desc(schema.users.createdAt));
  return (
    <>
      <PageHeader title="Vérification des mentors" lead="Niveau 2 : visible des jeunes majeurs. Niveau 3 : badge « Vérifié·e » et accompagnement des mineurs. Les justificatifs sont effacés après décision." />
      <section className="grid gap-3">
        <h2 className="text-lg font-bold">En attente ({pending.length})</h2>
        {pending.length === 0 && <p className="text-sm text-ink-2">Aucune demande.</p>}
        {pending.map(({ v, u, p }) => (
          <form key={v.id} action={reviewVerification} className="card grid gap-3 p-4">
            <input type="hidden" name="id" value={v.id} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span><strong>{u.name}</strong> · {p?.title ?? "—"} · demande le niveau {v.level}</span>
              <span className="text-xs text-ink-3">{relativeTime(v.createdAt)}</span>
            </div>
            <p className="rounded-lg bg-surface-2 p-3 text-sm">{v.evidence}</p>
            {p?.linkedinUrl && <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer" className="link text-sm">Profil LinkedIn ↗</a>}
            <input name="note" maxLength={300} placeholder="Note (motif en cas de refus)" className="input min-h-9 text-sm" />
            <div className="flex gap-2"><button name="decision" value="approve" className="btn-primary btn-sm">Valider</button><button name="decision" value="reject" className="btn-ghost btn-sm">Refuser</button></div>
          </form>
        ))}
      </section>
      <section className="grid gap-2">
        <h2 className="text-lg font-bold">Tous les mentors ({mentors.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="text-left text-ink-3"><th className="py-2">Mentor</th><th>Fonction</th><th>Niveau</th><th>Modifier</th></tr></thead>
            <tbody>
              {mentors.map(({ u, p }) => (
                <tr key={u.id} className="border-t border-line">
                  <td className="py-2"><Link href={`/mentors/${u.id}`} className="link">{u.name}</Link> {u.isDemo && <Badge tone="warn">Démo</Badge>} {u.suspendedAt && <Badge tone="bad">Suspendu</Badge>}</td>
                  <td>{p.title}</td>
                  <td><VerifiedBadge level={p.verificationLevel} /></td>
                  <td>
                    <form action={setLevel} className="flex gap-1"><input type="hidden" name="userId" value={u.id} />
                      <select name="level" defaultValue={p.verificationLevel} className="input min-h-8 w-auto py-0 text-sm" aria-label={`Niveau de ${u.name}`}>{[0, 1, 2, 3].map((l) => <option key={l} value={l}>{l}</option>)}</select>
                      <button className="btn-ghost btn-sm">OK</button></form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
