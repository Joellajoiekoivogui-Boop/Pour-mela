import type { Metadata } from "next";
import Link from "next/link";
import { Info, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MentorCard } from "@/components/shared/mentor-card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Alert, EmptyState } from "@/components/ui/misc";
import { requireRole } from "@/lib/auth";
import { getCatalog } from "@/lib/queries";
import { getRecommendations } from "@/lib/recommendations";

export const metadata: Metadata = { title: "Trouver un mentor" };

export default async function FindMentorPage({ searchParams }: { searchParams: Promise<{ domaine?: string; q?: string }> }) {
  const { domaine, q } = await searchParams;
  const { supabase, profile } = await requireRole(["mentee"]);
  const { domains: allDomains } = await getCatalog();
  const domain = allDomains.find((d) => d.slug === domaine);
  const { results, enough, catalog } = await getRecommendations(supabase, profile.id, { domainId: domain?.id, search: q?.slice(0, 80) });

  return (
    <>
      <PageHeader title="Trouver un mentor" description="Les mentors vérifiés sont classés selon leur compatibilité avec votre profil et vos objectifs." />
      <Alert tone="info" className="mb-6">
        <span className="inline-flex items-center gap-1"><Info className="size-3.5" aria-hidden /> Score calculé par un algorithme transparent (domaines 35, compétences 30, objectifs 15, disponibilités 10, expérience 10) — pas par une IA.</span>{" "}
        <Link href="/comment-ca-marche" className="font-medium underline">En savoir plus</Link>
      </Alert>
      {!enough && (
        <Alert tone="warning" className="mb-6" title="Votre profil est encore vide">
          Sans domaines, compétences ni objectifs, les mentors sont classés par disponibilité et expérience seulement. <Link href="/mentore/profil" className="font-medium underline">Compléter mon profil</Link>
        </Alert>
      )}
      <form className="mb-6 grid gap-3 sm:grid-cols-[1fr_240px_auto]" role="search">
        <Input name="q" defaultValue={q} placeholder="Nom, poste, entreprise…" aria-label="Rechercher" />
        <Select name="domaine" defaultValue={domaine ?? ""} aria-label="Domaine">
          <option value="">Tous les domaines</option>
          {allDomains.map((d) => <option key={d.id} value={d.slug}>{d.name}</option>)}
        </Select>
        <Button type="submit" variant="navy"><Search /> Filtrer</Button>
      </form>
      {results.length === 0 ? (
        <EmptyState icon={Users} title="Aucun mentor ne correspond" description="Élargissez vos filtres : de nouveaux mentors sont vérifiés régulièrement." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.map(({ item, match }) => (
            <MentorCard key={item.profile.id} item={item} match={match} domainName={catalog.domainName} skillName={catalog.skillName} profileHref={`/mentore/mentors/${item.profile.id}`} requestHref={`/mentore/mentors/${item.profile.id}#demande`} />
          ))}
        </div>
      )}
    </>
  );
}
