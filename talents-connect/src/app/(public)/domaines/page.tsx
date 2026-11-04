import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/public/section";
import { NamedIcon } from "@/components/shared/icon";
import { Card } from "@/components/ui/card";
import { FALLBACK_DOMAINS } from "@/content/site";
import { getCatalog } from "@/lib/queries";

export const metadata: Metadata = { title: "Domaines d'expertise" };

export default async function DomainsPage() {
  const { domains, skills } = await getCatalog();
  const list = domains.length > 0 ? domains.map((d) => ({ ...d, skills: skills.filter((s) => s.domain_id === d.id).map((s) => s.name) })) : FALLBACK_DOMAINS.map((d) => ({ ...d, skills: [] as string[] }));
  return (
    <>
      <PageHero eyebrow="Domaines" title="Découvrir les domaines d'expertise" description="Chaque domaine regroupe des compétences précises. Elles servent au moteur de matching pour vous proposer les mentors les plus pertinents." />
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-3">
        {list.map((d) => (
          <Card key={d.slug} className="flex flex-col p-6">
            <span className="inline-flex size-11 items-center justify-center rounded-lg bg-primary-soft text-primary"><NamedIcon name={d.icon} className="size-5" /></span>
            <h2 className="mt-4 font-semibold text-navy">{d.name}</h2>
            <p className="mt-1 text-sm text-muted">{d.description}</p>
            {d.skills.length > 0 && <p className="mt-3 text-xs leading-relaxed text-slate-600">{d.skills.join(" · ")}</p>}
            <Link href={`/mentors?domaine=${d.slug}`} className="mt-auto pt-5 text-sm font-medium text-primary hover:underline">Voir les mentors →</Link>
          </Card>
        ))}
      </div>
    </>
  );
}
