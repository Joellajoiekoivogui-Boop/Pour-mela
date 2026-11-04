import Link from "next/link";
import { ArrowRight, Briefcase, CalendarDays, Handshake, Search, Target, TrendingUp, UserCircle } from "lucide-react";
import { PageHeader, StatCard } from "@/components/layout/page-header";
import { MentorCard } from "@/components/shared/mentor-card";
import { AppointmentBadge } from "@/components/shared/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, EmptyState, Progress } from "@/components/ui/misc";
import { requireRole } from "@/lib/auth";
import { formatDateTime, timeAgo } from "@/lib/dates";
import { goalProgress, overallProgress } from "@/lib/goals";
import { OPPORTUNITY_CATEGORY_LABELS, SESSION_TYPE_LABELS } from "@/lib/labels";
import { getPeople } from "@/lib/queries";
import { getRecommendations } from "@/lib/recommendations";
import { fullName } from "@/lib/utils";
import type { AppNotification, Appointment, Goal, Milestone, Opportunity } from "@/types/db";

export default async function MenteeDashboard() {
  const { supabase, profile } = await requireRole(["mentee"]);
  const now = new Date().toISOString();
  const [mentorships, appointments, goals, activity, opportunities, reco] = await Promise.all([
    supabase.from("mentorships").select("id, mentor_id").eq("mentee_id", profile.id).eq("status", "active"),
    supabase.from("appointments").select("*").eq("mentee_id", profile.id).in("status", ["pending", "confirmed"]).gt("starts_at", now).order("starts_at").limit(3),
    supabase.from("mentorship_goals").select("*, milestones:goal_milestones(id, is_done)").eq("mentee_id", profile.id).neq("status", "abandoned").order("created_at", { ascending: false }),
    supabase.from("notifications").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("opportunities").select("*").eq("is_published", true).or(`deadline.is.null,deadline.gte.${now.slice(0, 10)}`).order("created_at", { ascending: false }).limit(3),
    getRecommendations(supabase, profile.id, { limit: 3 }),
  ]);
  const appts = (appointments.data ?? []) as Appointment[];
  const goalList = (goals.data ?? []) as (Goal & { milestones: Pick<Milestone, "id" | "is_done">[] })[];
  const people = await getPeople(supabase, appts.map((a) => a.mentor_id));
  const activeGoals = goalList.filter((g) => g.status !== "completed");
  const progress = overallProgress(goalList);

  return (
    <>
      <PageHeader
        title={`Bonjour ${profile.first_name || ""} 👋`}
        description="Voici où en est votre parcours aujourd'hui."
        actions={<ButtonLink href="/mentore/trouver"><Search /> Trouver un mentor</ButtonLink>}
      />
      {!reco.enough && (
        <Alert tone="info" title="Complétez votre profil pour des recommandations pertinentes" className="mb-6">
          Indiquez vos domaines, compétences recherchées et objectifs. <Link href="/mentore/profil" className="font-medium underline">Compléter mon profil</Link>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Mentorats actifs" value={mentorships.data?.length ?? 0} icon={Handshake} />
        <StatCard label="Prochains rendez-vous" value={appts.length} icon={CalendarDays} tone="violet" />
        <StatCard label="Objectifs en cours" value={activeGoals.length} icon={Target} tone="warning" />
        <StatCard label="Progression globale" value={`${progress} %`} hint="Étapes accomplies / étapes prévues" icon={TrendingUp} tone="success" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Prochains rendez-vous</CardTitle><Link href="/mentore/rendez-vous" className="text-sm text-primary hover:underline">Tout voir</Link></CardHeader>
          <CardContent>
            {appts.length === 0 ? <p className="text-sm text-muted">Aucune séance prévue. Réservez un créneau depuis un mentorat actif.</p> : (
              <ul className="space-y-3">
                {appts.map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <Avatar person={people.get(a.mentor_id)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.topic || "Séance de mentorat"} · {fullName(people.get(a.mentor_id))}</p>
                      <p className="text-xs text-muted">{formatDateTime(a.starts_at)} · {SESSION_TYPE_LABELS[a.session_type]}</p>
                    </div>
                    <AppointmentBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Objectifs en cours</CardTitle><Link href="/mentore/objectifs" className="text-sm text-primary hover:underline">Gérer</Link></CardHeader>
          <CardContent>
            {activeGoals.length === 0 ? <p className="text-sm text-muted">Aucun objectif en cours. <Link href="/mentore/objectifs" className="text-primary underline">Définir un objectif</Link></p> : (
              <ul className="space-y-4">
                {activeGoals.slice(0, 4).map((g) => {
                  const p = goalProgress(g.milestones);
                  return (
                    <li key={g.id}>
                      <div className="flex justify-between gap-2 text-sm"><Link href={`/mentore/objectifs/${g.id}`} className="truncate font-medium hover:text-primary">{g.title}</Link><span className="text-muted">{p} %</span></div>
                      <Progress value={p} className="mt-1.5" label={g.title} />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-navy">Mentors recommandés pour vous</h2><Link href="/mentore/trouver" className="text-sm text-primary hover:underline">Voir plus</Link></div>
        {reco.results.length === 0 ? (
          <EmptyState icon={UserCircle} title="Aucun mentor vérifié pour le moment" description="Revenez bientôt : de nouveaux mentors rejoignent la plateforme." />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {reco.results.map(({ item, match }) => (
              <MentorCard key={item.profile.id} item={item} match={match} domainName={reco.catalog.domainName} skillName={reco.catalog.skillName} profileHref={`/mentore/mentors/${item.profile.id}`} requestHref={`/mentore/mentors/${item.profile.id}#demande`} />
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Dernières activités</CardTitle></CardHeader>
          <CardContent>
            {(activity.data ?? []).length === 0 ? <p className="text-sm text-muted">Rien de nouveau pour l&apos;instant.</p> : (
              <ul className="space-y-3">
                {((activity.data ?? []) as AppNotification[]).map((n) => (
                  <li key={n.id} className="text-sm">
                    {n.link ? <Link href={n.link} className="font-medium hover:text-primary">{n.title}</Link> : <span className="font-medium">{n.title}</span>}
                    {n.body && <span className="text-muted"> — {n.body}</span>}
                    <p className="text-xs text-muted">{timeAgo(n.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Opportunités récentes</CardTitle><Link href="/mentore/opportunites" className="text-sm text-primary hover:underline">Tout voir</Link></CardHeader>
          <CardContent>
            {(opportunities.data ?? []).length === 0 ? <p className="text-sm text-muted">Aucune opportunité publiée pour le moment.</p> : (
              <ul className="space-y-3">
                {((opportunities.data ?? []) as Opportunity[]).map((o) => (
                  <li key={o.id} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-soft text-violet"><Briefcase className="size-4" /></span>
                    <div className="min-w-0 text-sm">
                      <Link href="/mentore/opportunites" className="font-medium hover:text-primary">{o.title}</Link>
                      <p className="text-xs text-muted">{OPPORTUNITY_CATEGORY_LABELS[o.category]} · {o.organization}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <ButtonLink href="/mentore/assistant" variant="ghost" size="sm" className="mt-4 -ml-3">Préparer ma candidature avec l&apos;assistant <ArrowRight /></ButtonLink>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
