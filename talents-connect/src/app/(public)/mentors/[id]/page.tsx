import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MentorProfileView } from "@/components/shared/mentor-profile-view";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMentorDetail } from "@/lib/mentor-detail";
import { getCatalog, toCatalog } from "@/lib/queries";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function PublicMentorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  if (!supabase) notFound();
  const [detail, { domains, skills }] = await Promise.all([getMentorDetail(supabase, id), getCatalog()]);
  if (!detail) notFound();
  const catalog = toCatalog(domains, skills);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/mentors" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"><ArrowLeft className="size-4" /> Tous les mentors</Link>
      <MentorProfileView
        item={detail.item} reviews={detail.reviews} domainName={catalog.domainName} skillName={catalog.skillName}
        aside={
          <Card className="border-primary/30 bg-primary-soft/40">
            <CardContent>
              <p className="font-semibold text-navy">Être accompagné par ce mentor</p>
              <p className="mt-1 text-sm text-muted">Connectez-vous pour voir votre score de compatibilité et envoyer une demande.</p>
              <ButtonLink href={`/mentore/mentors/${id}`} className="mt-4 w-full">Demander un mentorat</ButtonLink>
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}
