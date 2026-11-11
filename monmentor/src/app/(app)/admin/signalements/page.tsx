import type { Metadata } from "next";
import { desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { handleReport } from "@/app/actions/admin";
import { Badge, PageHeader } from "@/components/ui";
import { relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Signalements" };
const REASON: Record<string, string> = { HARASSMENT: "Harcèlement", SCAM: "Arnaque", INAPPROPRIATE: "Inapproprié", FAKE_PROFILE: "Faux profil", OTHER: "Autre" };
const SEVERITY: Record<string, number> = { HARASSMENT: 0, SCAM: 0, INAPPROPRIATE: 1, FAKE_PROFILE: 2, OTHER: 3 };

export default async function AdminReports() {
  const rows = await db.select().from(schema.reports).orderBy(desc(schema.reports.createdAt)).limit(200);
  const userIds = [...new Set(rows.flatMap((r) => [r.reporterId, r.targetUserId]).filter(Boolean))] as string[];
  const names = new Map(userIds.length ? (await db.select({ id: schema.users.id, name: schema.users.name, s: schema.users.suspendedAt }).from(schema.users).where(inArray(schema.users.id, userIds))).map((u) => [u.id, u]) : []);
  const open = rows.filter((r) => r.status === "OPEN" || r.status === "IN_REVIEW").sort((a, b) => SEVERITY[a.reason]! - SEVERITY[b.reason]! || a.createdAt - b.createdAt);
  const closed = rows.filter((r) => !open.includes(r));
  const [msg] = [await Promise.all(open.filter((r) => r.targetType === "MESSAGE").map(async (r) => [r.id, (await db.select().from(schema.messages).where(eq(schema.messages.id, r.targetId)).limit(1))[0]?.body] as const))];
  const messageBodies = new Map(msg);
  return (
    <>
      <PageHeader title="Signalements" lead="Triés par gravité. Objectif : traitement sous 48 h. La personne signalée ne connaît jamais l'auteur du signalement." />
      <section className="grid gap-3">
        <h2 className="text-lg font-bold">À traiter ({open.length})</h2>
        {open.length === 0 && <p className="text-sm text-ink-2">Aucun signalement ouvert.</p>}
        {open.map((r) => {
          const target = r.targetUserId ? names.get(r.targetUserId) : null;
          return (
            <form key={r.id} action={handleReport} className="card grid gap-3 p-4">
              <input type="hidden" name="id" value={r.id} />
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={SEVERITY[r.reason] === 0 ? "bad" : "warn"}>{REASON[r.reason]}</Badge>
                <span className="text-sm">{r.targetType.toLowerCase()} {target ? <>de <strong>{target.name}</strong>{target.s ? " (suspendu)" : ""}</> : ""}</span>
                <span className="ml-auto text-xs text-ink-3">{relativeTime(r.createdAt)} · par {names.get(r.reporterId)?.name ?? "?"}</span>
              </div>
              {r.details && <p className="text-sm">« {r.details} »</p>}
              {messageBodies.get(r.id) && <p className="rounded-lg bg-surface-2 p-3 text-sm">Message signalé : « {messageBodies.get(r.id)} »</p>}
              <div className="flex flex-wrap gap-2">
                <button name="action" value="dismiss" className="btn-ghost btn-sm">Classer sans suite</button>
                <button name="action" value="warn" className="btn-ghost btn-sm">Avertir</button>
                {["RESOURCE", "OPPORTUNITY", "MESSAGE"].includes(r.targetType) && <button name="action" value="remove" className="btn-ghost btn-sm">Retirer le contenu</button>}
                {r.targetUserId && <button name="action" value="suspend" className="btn-danger btn-sm">Suspendre le compte</button>}
                {target?.s && <button name="action" value="restore" className="btn-ghost btn-sm">Lever la suspension</button>}
              </div>
            </form>
          );
        })}
      </section>
      <section className="grid gap-2">
        <h2 className="text-lg font-bold">Historique</h2>
        <ul className="grid gap-1 text-sm text-ink-2">{closed.slice(0, 50).map((r) => <li key={r.id}>{REASON[r.reason]} · {r.targetType.toLowerCase()} · {r.action ?? r.status} · {relativeTime(r.reviewedAt ?? r.createdAt)}</li>)}</ul>
      </section>
    </>
  );
}
