import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { Notice } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Vérification d'un certificat", robots: { index: false } };

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [row] = await db.select({ c: schema.certificates, name: schema.users.name }).from(schema.certificates)
    .innerJoin(schema.users, eq(schema.users.id, schema.certificates.userId))
    .where(eq(schema.certificates.code, code.toUpperCase())).limit(1);
  return (
    <div className="mx-auto grid max-w-xl gap-5 px-4 py-12">
      <p className="eyebrow">Vérification</p>
      <h1 className="text-2xl font-bold">Certificat n° {code.toUpperCase()}</h1>
      {!row ? (
        <Notice tone="bad">Aucun certificat ne porte ce numéro. Vérifiez la saisie ou contactez la coordination de MonMentor.</Notice>
      ) : row.c.revokedAt ? (
        <Notice tone="bad">Ce certificat a été révoqué le {formatDate(row.c.revokedAt)}. Il n&apos;est plus valable.</Notice>
      ) : (
        <div className="card grid gap-2 p-5">
          <Notice tone="ok">✓ Certificat valide, délivré par MonMentor.</Notice>
          <p><span className="text-ink-3">Titulaire :</span> <strong>{row.name}</strong></p>
          <p><span className="text-ink-3">Intitulé :</span> {row.c.title}</p>
          <p><span className="text-ink-3">Délivré le :</span> {formatDate(row.c.issuedAt)}</p>
        </div>
      )}
    </div>
  );
}
