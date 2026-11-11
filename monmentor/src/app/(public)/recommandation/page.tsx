import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Recommendation } from "@/components/recommendation";
import { PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Trouver mon mentor", robots: { index: false } };

export default async function PublicRecommendation({ searchParams }: { searchParams: Promise<{ besoin?: string; d?: string | string[]; ajuste?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (user?.role === "MENTEE") {
    const q = new URLSearchParams();
    if (sp.besoin) q.set("besoin", sp.besoin);
    redirect(`/trouver?${q.toString()}`);
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader eyebrow="Recommandation guidée" title="Trouver mon mentor" lead="Décrivez votre situation : MonMentor repère les domaines et compétences concernés et vous propose les mentors les plus adaptés, en expliquant pourquoi." />
      <Recommendation
        action="/recommandation"
        besoin={sp.besoin ?? ""}
        ajuste={sp.ajuste === "1"}
        domainesForces={[sp.d ?? []].flat()}
        anonymous
      />
    </div>
  );
}
