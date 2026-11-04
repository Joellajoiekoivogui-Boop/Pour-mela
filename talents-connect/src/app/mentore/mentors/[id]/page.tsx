import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MentorRequestForm } from "@/components/forms/request-form";
import { ReportButton } from "@/components/shared/report-button";
import { MentorProfileView } from "@/components/shared/mentor-profile-view";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, Progress } from "@/components/ui/misc";
import { requireRole } from "@/lib/auth";
import { scoreMentor } from "@/lib/matching/engine";
import { getMentorDetail } from "@/lib/mentor-detail";
import { getCatalog, getMenteeNeeds, toCandidate, toCatalog } from "@/lib/queries";

export default async function MenteeMentorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireRole(["mentee"], `/mentore/mentors/${id}`);
  const [detail, { domains, skills }, { needs, profile: menteeProfile }] = await Promise.all([
    getMentorDetail(supabase, id), getCatalog(), getMenteeNeeds(supabase, profile.id),
  ]);
  if (!detail) notFound();
  const catalog = toCatalog(domains, skills);
  const match = scoreMentor(needs, toCandidate(detail.item), catalog);

  const [pending, active] = await Promise.all([
    supabase.from("mentor_requests").select("id").eq("mentee_id", profile.id).eq("mentor_id", id).eq("status", "pending").maybeSingle(),
    supabase.from("mentorships").select("id").eq("mentee_id", profile.id).eq("mentor_id", id).eq("status", "active").maybeSingle<{ id: string }>(),
  ]);

  let requestBlock: React.ReactNode;
  if (active.data) requestBlock = <><Alert tone="success">Vous êtes accompagné(e) par ce mentor.</Alert><ButtonLink href={`/mentore/mentorats/${active.data.id}`} className="mt-3 w-full">Ouvrir le mentorat</ButtonLink></>;
  else if (pending.data) requestBlock = <Alert tone="info" title="Demande en attente">Le mentor n&apos;a pas encore répondu. <Link href="/mentore/demandes" className="underline">Voir mes demandes</Link></Alert>;
  else if (match.isFull) requestBlock = <Alert tone="warning">Ce mentor accompagne déjà le nombre maximal de mentorés. Réessayez plus tard.</Alert>;
  else requestBlock = <MentorRequestForm mentorId={id} matchScore={match.score} defaultObjectives={menteeProfile?.professional_goals ?? ""} />;

  return (
    <>
      <Link href="/mentore/trouver" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"><ArrowLeft className="size-4" /> Retour aux recommandations</Link>
      <MentorProfileView
        item={detail.item} reviews={detail.reviews} domainName={catalog.domainName} skillName={catalog.skillName}
        aside={
          <>
            <Card>
              <CardHeader><CardTitle>Compatibilité : {match.score}/100</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {match.criteria.map((c) => (
                  <div key={c.key}>
                    <div className="flex justify-between text-sm"><span>{c.label}</span><span className="font-medium">{c.points}/{c.max}</span></div>
                    <Progress value={(c.points / c.max) * 100} className="mt-1 h-1.5" label={c.label} />
                    <p className="mt-0.5 text-xs text-muted">{c.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card id="demande" className="scroll-mt-24">
              <CardHeader><CardTitle>Demander un mentorat</CardTitle></CardHeader>
              <CardContent>{requestBlock}</CardContent>
            </Card>
            <div className="text-right"><ReportButton targetType="user" targetUserId={id} /></div>
          </>
        }
      />
    </>
  );
}
