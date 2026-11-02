import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionTitle";
import { ParentsView } from "@/components/dashboard/ParentsView";

export const metadata: Metadata = { title: "Espace parents et enseignants" };

export default function ParentsPage() {
  return (
    <>
      <PageHeader eyebrow="Pour les adultes" title="Espace parents et enseignants">
        Suivez le temps de lecture, les articles lus, les thèmes explorés et les résultats aux quiz. Les récompenses valorisent la compréhension, jamais le temps passé devant l&apos;écran.
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ParentsView />
        <section className="mt-10 rounded-3xl bg-white p-6 shadow-carte ring-1 ring-encre/5">
          <h2 className="text-xl font-black">Pour les enseignants</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-encre-doux">
            <li>Chaque article indique un niveau, une tranche d&apos;âge, une durée et ses sources : idéal pour une lecture en classe.</li>
            <li>Les encadrés « Ce qu&apos;on ne sait pas encore » permettent de travailler l&apos;esprit critique.</li>
            <li>Les quiz expliquent chaque réponse : ils peuvent servir d&apos;évaluation formative.</li>
            <li>Avec un compte, un responsable peut être rattaché à plusieurs profils d&apos;enfants (table <code>parental_accounts</code>).</li>
          </ul>
        </section>
      </div>
    </>
  );
}
