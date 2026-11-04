import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AppointmentItem } from "@/components/mentorship/appointment-item";
import { BookingForm } from "@/components/mentorship/booking-form";
import { ReviewForm } from "@/components/mentorship/review-form";
import { GoalForm } from "@/components/goals/goal-form";
import { ActionButton } from "@/components/shared/action-button";
import { GoalBadge, MentorshipBadge } from "@/components/shared/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/misc";
import { completeMentorshipAction } from "@/lib/actions/requests";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { goalProgress } from "@/lib/goals";
import { loadMentorship } from "@/lib/mentorship";
import { fullName } from "@/lib/utils";

export default async function MenteeMentorshipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireRole(["mentee"]);
  const data = await loadMentorship(supabase, id);
  if (!data || data.mentorship.mentee_id !== profile.id) notFound();
  const { mentorship: m, mentor, appointments, freeSlots, goals, conversationId, review } = data;
  const active = m.status === "active";
  const upcoming = appointments.filter((a) => new Date(a.starts_at) > new Date() && ["pending", "confirmed"].includes(a.status)).reverse();
  const history = appointments.filter((a) => !upcoming.includes(a));

  return (
    <>
      <Link href="/mentore/mentorats" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"><ArrowLeft className="size-4" /> Mes mentorats</Link>
      <PageHeader
        title={`Mentorat avec ${fullName(mentor)}`}
        description={<span className="inline-flex flex-wrap items-center gap-2">Depuis le {formatDate(m.started_at)} <MentorshipBadge status={m.status} /></span>}
        actions={<>
          {conversationId && <ButtonLink href={`/mentore/messages/${conversationId}`} variant="secondary"><MessageSquare /> Messagerie</ButtonLink>}
          {active && <ActionButton variant="ghost" confirm="Clôturer ce mentorat ? Les séances à venir seront annulées." action={() => completeMentorshipAction(m.id)}>Clôturer</ActionButton>}
        </>}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {active && (
            <Card>
              <CardHeader><CardTitle>Réserver une séance</CardTitle></CardHeader>
              <CardContent><BookingForm mentorshipId={m.id} slots={freeSlots} /></CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle>Séances à venir</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {upcoming.length === 0 ? <p className="text-sm text-muted">Aucune séance à venir.</p> : upcoming.map((a) => <AppointmentItem key={a.id} appointment={a} viewer="mentee" freeSlots={freeSlots} />)}
            </CardContent>
          </Card>
          {history.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Historique</CardTitle></CardHeader>
              <CardContent className="space-y-3">{history.map((a) => <AppointmentItem key={a.id} appointment={a} viewer="mentee" />)}</CardContent>
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="flex items-center gap-3">
              <Avatar person={mentor} size="lg" />
              <div><p className="font-semibold text-navy">{fullName(mentor)}</p><Link href={`/mentore/mentors/${m.mentor_id}`} className="text-sm text-primary hover:underline">Voir le profil</Link></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Objectifs partagés</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {goals.length === 0 && <p className="text-sm text-muted">Aucun objectif lié à ce mentorat.</p>}
              {goals.map((g) => (
                <Link key={g.id} href={`/mentore/objectifs/${g.id}`} className="block rounded-lg border border-border p-3 hover:bg-subtle/60">
                  <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium">{g.title}</p><GoalBadge status={g.status} /></div>
                  <Progress value={goalProgress(g.milestones)} className="mt-2" label={g.title} />
                </Link>
              ))}
              {active && (
                <details className="rounded-lg border border-dashed border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium text-primary">Nouvel objectif pour ce mentorat</summary>
                  <div className="mt-4"><GoalForm mentorships={[{ id: m.id, label: `Avec ${fullName(mentor)}` }]} /></div>
                </details>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Évaluer le mentorat</CardTitle></CardHeader>
            <CardContent>
              {review ? <p className="text-sm text-slate-700">Votre note : <span className="text-amber-500">{"★".repeat(review.rating)}</span>{review.comment ? ` — « ${review.comment} »` : ""}</p> : <ReviewForm mentorshipId={m.id} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
