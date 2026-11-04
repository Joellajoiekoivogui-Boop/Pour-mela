import type { Metadata } from "next";
import { Search, Users } from "lucide-react";
import { PageHero } from "@/components/public/section";
import { MentorCard } from "@/components/shared/mentor-card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/misc";
import { getCatalog, listVerifiedMentors, toCatalog } from "@/lib/queries";
import { getServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Découvrir les mentors" };

export default async function MentorsPage({ searchParams }: { searchParams: Promise<{ domaine?: string; q?: string }> }) {
  const { domaine, q } = await searchParams;
  const supabase = await getServerSupabase();
  const { domains, skills } = await getCatalog();
  const catalog = toCatalog(domains, skills);
  const domain = domains.find((d) => d.slug === domaine);
  const mentors = supabase ? await listVerifiedMentors(supabase, { domainId: domain?.id, search: q?.slice(0, 80) }) : [];

  return (
    <>
      <PageHero eyebrow="Annuaire" title="Découvrir les mentors" description="Des professionnels vérifiés, prêts à partager leur expérience. Connectez-vous pour obtenir des recommandations personnalisées." />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <form className="mb-8 grid gap-3 sm:grid-cols-[1fr_260px_auto]" role="search">
          <label className="sr-only" htmlFor="q">Rechercher</label>
          <Input id="q" name="q" defaultValue={q} placeholder="Nom, poste, entreprise…" />
          <label className="sr-only" htmlFor="domaine">Domaine</label>
          <Select id="domaine" name="domaine" defaultValue={domaine ?? ""}>
            <option value="">Tous les domaines</option>
            {domains.map((d) => <option key={d.id} value={d.slug}>{d.name}</option>)}
          </Select>
          <Button type="submit" variant="navy"><Search /> Rechercher</Button>
        </form>
        {mentors.length === 0 ? (
          <EmptyState icon={Users} title="Aucun mentor trouvé" description={supabase ? "Modifiez vos filtres ou revenez bientôt : de nouveaux mentors sont vérifiés régulièrement." : "La base de données n'est pas encore configurée."} />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted">{mentors.length} mentor{mentors.length > 1 ? "s" : ""}{domain ? ` en ${domain.name}` : ""}</p>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {mentors.map((m) => (
                <MentorCard key={m.profile.id} item={m} domainName={catalog.domainName} skillName={catalog.skillName} profileHref={`/mentors/${m.profile.id}`} requestHref={`/mentore/mentors/${m.profile.id}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
