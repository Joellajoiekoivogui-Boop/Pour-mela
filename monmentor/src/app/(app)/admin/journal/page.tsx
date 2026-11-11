import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Journal" };

export default async function AuditJournal() {
  const rows = await db.select({ a: schema.auditLog, name: schema.users.name }).from(schema.auditLog)
    .leftJoin(schema.users, eq(schema.users.id, schema.auditLog.actorId)).orderBy(desc(schema.auditLog.createdAt)).limit(200);
  return (
    <>
      <PageHeader title="Journal des actions" lead="Chaque décision de la coordination est horodatée avec son auteur." />
      {rows.length === 0 ? <p className="text-sm text-ink-2">Aucune action enregistrée.</p> : (
        <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
          <thead><tr className="text-left text-ink-3"><th className="py-2">Date</th><th>Auteur</th><th>Action</th><th>Cible</th></tr></thead>
          <tbody>{rows.map(({ a, name }) => <tr key={a.id} className="border-t border-line"><td className="py-2">{formatDateTime(a.createdAt)}</td><td>{name ?? a.actorId}</td><td className="font-mono text-xs">{a.action}</td><td className="text-xs">{a.target}</td></tr>)}</tbody>
        </table></div>
      )}
    </>
  );
}
