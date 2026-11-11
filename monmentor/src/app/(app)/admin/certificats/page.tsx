import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { issueCertificate, revokeCertificate } from "@/app/actions/admin";
import { Badge, Notice, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Certificats" };

export default async function AdminCertificates({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const sp = await searchParams;
  const rows = await db.select({ c: schema.certificates, name: schema.users.name }).from(schema.certificates)
    .innerJoin(schema.users, eq(schema.users.id, schema.certificates.userId)).orderBy(desc(schema.certificates.issuedAt)).limit(200);
  return (
    <>
      <PageHeader title="Certificats" lead="Les certificats des programmes sont délivrés automatiquement. Vous pouvez en délivrer pour un atelier ou un événement, et révoquer un certificat délivré par erreur." />
      {sp.ok && <Notice tone="ok">Certificat {sp.ok} délivré.</Notice>}
      {sp.erreur && <Notice tone="bad">Membre introuvable : indiquez son e-mail, son téléphone au format +224… ou son identifiant.</Notice>}
      <form action={issueCertificate} className="card grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="field"><span className="label">Membre (e-mail ou téléphone)</span><input name="who" required className="input" /></label>
        <label className="field"><span className="label">Intitulé</span><input name="title" required maxLength={120} className="input" placeholder="Atelier « Pitcher son projet »" /></label>
        <SubmitButton>Délivrer</SubmitButton>
      </form>
      <ul className="grid gap-2">
        {rows.map(({ c, name }) => (
          <li key={c.id} className="card flex flex-wrap items-center gap-3 p-4 text-sm">
            <Link href={`/verif/${c.code}`} className="font-mono link">{c.code}</Link>
            <span><strong>{name}</strong> · {c.title} · {formatDate(c.issuedAt)}</span>
            {c.revokedAt ? <Badge tone="bad">Révoqué</Badge> : (
              <form action={revokeCertificate} className="ml-auto"><input type="hidden" name="code" value={c.code} /><button className="btn-danger btn-sm">Révoquer</button></form>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
