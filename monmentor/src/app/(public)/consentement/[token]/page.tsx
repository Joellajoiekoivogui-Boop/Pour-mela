import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { confirmParentalConsent } from "@/app/actions/auth";
import { Notice } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = { title: "Accord parental", robots: { index: false } };

export default async function ConsentPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ etat?: string }> }) {
  const { token } = await params;
  const { etat } = await searchParams;
  const [user] = etat ? [] : await db.select({ name: schema.users.name, parentName: schema.users.parentName }).from(schema.users).where(eq(schema.users.parentConsentToken, token)).limit(1);
  return (
    <div className="mx-auto grid max-w-xl gap-5 px-4 py-12">
      <h1 className="text-2xl font-bold">Accord parental</h1>
      {etat === "merci" && <Notice tone="ok">Merci. Votre accord est enregistré : votre enfant peut maintenant demander un mentorat.</Notice>}
      {(etat === "invalide" || (!etat && !user)) && <Notice tone="bad">Ce lien n&apos;est plus valide. Il a peut-être déjà été utilisé.</Notice>}
      {user && (
        <form action={confirmParentalConsent} className="card grid gap-4 p-5">
          <input type="hidden" name="token" value={token} />
          <p><strong>{user.name}</strong> souhaite rejoindre MonMentor, une plateforme qui met en relation des jeunes avec des professionnels bénévoles vérifiés.</p>
          <ul className="list-disc pl-5 text-sm text-ink-2">
            <li>Avant 18 ans, les séances ont lieu uniquement en visio, avec des mentors vérifiés après entretien.</li>
            <li>La messagerie est fermée de 22 h à 6 h.</li>
            <li>Le CV de votre enfant ne peut pas être rendu public.</li>
            <li>Tout comportement inapproprié peut être signalé et est traité sous 48 h.</li>
          </ul>
          <SubmitButton>Je donne mon accord</SubmitButton>
        </form>
      )}
    </div>
  );
}
