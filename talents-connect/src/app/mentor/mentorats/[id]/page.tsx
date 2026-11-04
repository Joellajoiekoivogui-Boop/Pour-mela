import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AppointmentItem } from "@/components/mentorship/appointment-item";
import { GoalForm } from "@/components/goals/goal-form";
import { ActionButton } from "@/components/shared/action-button";
import { GoalBadge, MentorshipBadge } from "@/components/shared/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/misc";
import { completeMentorshipAction } from "@/lib/actions/requests";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { goalProgress } from "@/lib/goals";
import { EDUCATION_LEVELS } from "@/lib/labels";
import { loadMentorship } from "@/lib/mentorship";
import { getCatalog } from "@/lib/queries";
import { fullName } from "@/lib/utils";
import type { MenteeProfile, MentorRequest } from "@/types/db";

export default async function MentorMentorshipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireRole(["mentor"]);
  const data = await loadMentorship(supabase, id);
  if (!data || data.mentorship.mentor_id !== profile.id) notFound();
  const { mentorship: m, mentee, appointments, goals, conversationId, review } = data;
  const [mp, request, skills, { skills: allSkills }] = await Promise.all([
    supabase.from("mentee_profiles").select("*").eq("user_id", m.mentee_id).maybeSingle<MenteeProfile>(),
    m.request_id ? supabase.from("mentor_requests").select("*").eq("id", m.request_id).maybeSingle<MentorRequest>() : Promise.resolve({ data: null }),
    supabase.from("user_skills").select("skill_id, relation").eq("user_id", m.mentee_id),
    getCatalog(),
  ]);
  const skillName = new Map(allSkills.map((s) => [s.id, s.name]));
  const menteeSkills = (skills.data ?? []) as { skill_id: number; relation: string }[];
  const active = m.status === "active";
  const now = new Date();
  const upcoming = appointments.filter((a) => new Date(a.starts_at) > now && ["pending", "confirmed"].includes(a.status)).reverse();
  const history = appointments.filter((a) => !upcoming.includes(a));
  const menteeProfile = mp.data;
  const req = request.data as MentorRequest | null;

  return (
    <>
      <Link href="/mentor/mentores" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"><ArrowLeft className="size-4" /> Mes mentorés</Link>
      <PageHeader
        title={`Mentorat de ${fullName(mentee)}`}
        description={<span className="inline-flex flex-wrap items-center gap-2">Depuis le {formatDate(m.started_at)} <MentorshipBadge status={m.status} /></span>}
        actions={<>
          {conversationId && <ButtonLink href={`/mentor/messages/${conversationId}`} variant="secondary"><MessageSquare /> Messagerie</ButtonLink>}
          {active && <ActionButton variant="ghost" confirm="Clôturer ce mentorat ? Les séances à venir seront annulées." action={() => completeMentorshipAction(m.id)}>Clôturer</ActionButton>}
        </>}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between"><CardTitle>Objectifs du mentoré</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {goals.length === 0 && <p className="text-sm text-muted">Aucun objectif lié à ce mentorat. Définissez-en un ensemble ci-dessous.</p>}
              {goals.map((g) => (
                <Link key={g.id} href={`/mentor/objectifs/${g.id}`} className="block rounded-lg border border-border p-4 hover:bg-subtle/60">
                  <div className="flex items-center justify-between gap-2"><p className="font-medium text-navy">{g.title}</p><GoalBadge status={g.status} /></div>
                  <div className="mt-2 flex items-center gap-3"><Progress value={goalProgress(g.milestones)} label={g.title} /><span className="shrink-0 text-xs text-muted">{g.milestones.filter((x) => x.is_done).length}/{g.milestones.length}</span></div>
                </Link>
              ))}
              {active && (
                <details className="rounded-lg border border-dashed border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium text-primary">Définir un objectif avec {mentee?.first_name || "le mentoré"}</summary>
                  <div className="mt-4"><GoalForm mentorships={[{ id: m.id, label: `Pour ${fullName(mentee)}` }]} menteeId={m.mentee_id} /></div>
                </details>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between"><CardTitle>Séances à venir</CardTitle><Link href="/mentor/rendez-vous" className="text-sm text-primary hover:underline">Publier des créneaux</Link></CardHeader>
            <CardContent className="space-y-3">{upcoming.length === 0 ? <p className="text-sm text-muted">Aucune séance à venir. Le mentoré réserve parmi vos créneaux libres.</p> : upcoming.map((a) => <AppointmentItem key={a.id} appointment={a} viewer="mentor" />)}</CardContent>
          </Card>
          {history.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Historique des séances</CardTitle></CardHeader>
              <CardContent className="space-y-3">{history.map((a) => <AppointmentItem key={a.id} appointment={a} viewer="mentor" />)}</CardContent>
            </Card>
          )}
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><div className="flex items-center gap-3"><Avatar person={mentee} size="lg" /><div><CardTitle>{fullName(mentee)}</CardTitle><p className="text-xs text-muted">Profil du mentoré</p></div></div></CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              {menteeProfile?.education_level && <p><span className="text-muted">Niveau : </span>{EDUCATION_LEVELS[menteeProfile.education_level]}</p>}
              {menteeProfile?.field_of_study && <p><span className="text-muted">Formation : </span>{menteeProfile.field_of_study}{menteeProfile.institution ? ` — ${menteeProfile.institution}` : ""}</p>}
              {menteeProfile?.professional_goals && <p><span className="text-muted">Objectifs : </span>{menteeProfile.professional_goals}</p>}
              {menteeProfile?.project_needs && <p><span className="text-muted">Projet : </span>{menteeProfile.project_needs}</p>}
              {menteeSkills.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-muted">Compétences recherchées :</p>
                  <div className="flex flex-wrap gap-1">{menteeSkills.filter((s) => s.relation === "wants").map((s) => <Badge key={s.skill_id} tone="primary">{skillName.get(s.skill_id)}</Badge>)}</div>
                  <p className="text-muted">Compétences actuelles :</p>
                  <div className="flex flex-wrap gap-1">{menteeSkills.filter((s) => s.relation === "has").map((s) => <Badge key={s.skill_id}>{skillName.get(s.skill_id)}</Badge>)}</div>
                </div>
              )}
              {req && <p className="rounded-md bg-subtle p-3"><span className="font-medium">Motivation initiale : </span>{req.motivation}</p>}
            </CardContent>
          </Card>
          {review && (
            <Card>
              <CardHeader><CardTitle>Évaluation reçue</CardTitle></CardHeader>
              <CardContent className="text-sm"><p className="text-amber-500">{"★".repeat(review.rating)}<span className="text-slate-300">{"★".repeat(5 - review.rating)}</span></p>{review.comment && <p className="mt-1 text-slate-700">{review.comment}</p>}</CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
