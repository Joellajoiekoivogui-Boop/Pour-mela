import Link from "next/link";
import { CalendarCheck, CalendarDays, CheckCircle2, ClipboardList, Clock, Users } from "lucide-react";
import { PageHeader, StatCard } from "@/components/layout/page-header";
import { VerificationBadge } from "@/components/shared/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/misc";
import { requireRole } from "@/lib/auth";
import { formatDateTime, timeAgo } from "@/lib/dates";
import { SESSION_TYPE_LABELS } from "@/lib/labels";
import { getPeople } from "@/lib/queries";
import { fullName } from "@/lib/utils";
import type { AppNotification, Appointment, MentorProfile } from "@/types/db";

export default async function MentorDashboard() {
  const { supabase, profile } = await requireRole(["mentor"]);
  const now = new Date().toISOString();
  const [mp, mentees, pending, done, upcoming, slots, activity] = await Promise.all([
    supabase.from("mentor_profiles").select("*").eq("user_id", profile.id).maybeSingle<MentorProfile>(),
    supabase.from("mentorships").select("id, status").eq("mentor_id", profile.id),
    supabase.from("mentor_requests").select("id", { count: "exact", head: true }).eq("mentor_id", profile.id).eq("status", "pending"),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("mentor_id", profile.id).eq("status", "completed"),
    supabase.from("appointments").select("*").eq("mentor_id", profile.id).in("status", ["pending", "confirmed"]).gt("starts_at", now).order("starts_at").limit(5),
    supabase.from("availability_slots").select("id", { count: "exact", head: true }).eq("mentor_id", profile.id).eq("is_booked", false).gt("starts_at", now),
    supabase.from("notifications").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(6),
  ]);
  const mentor = mp.data;
  const ships = (mentees.data ?? []) as { id: string; status: string }[];
  const appts = (upcoming.data ?? []) as Appointment[];
  const people = await getPeople(supabase, appts.map((a) => a.mentee_id));
  const profileIncomplete = !mentor?.job_title || !profile.bio;

  return (
    <>
      <PageHeader title={`Bonjour ${profile.first_name || ""} 👋`} description="Votre espace de mentor." actions={<ButtonLink href="/mentor/rendez-vous"><CalendarDays /> Publier des créneaux</ButtonLink>} />
      {mentor && mentor.verification_status !== "verified" && (
        <Alert tone={mentor.verification_status === "rejected" ? "danger" : "warning"} className="mb-6" title={mentor.verification_status === "rejected" ? "Profil non validé" : "Profil en attente de vérification"}>
          {mentor.verification_status === "rejected"
            ? <>Motif : {mentor.rejection_reason ?? "non précisé"}. Mettez à jour votre profil ; l&apos;équipe pourra le réexaminer.</>
            : <>Votre profil n&apos;est pas encore visible des mentorés. {profileIncomplete ? "Complétez-le pour accélérer la vérification. " : "L'équipe va l'examiner. "}<Link href="/mentor/profil" className="font-medium underline">Mon profil</Link></>}
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Mentorés accompagnés" value={ships.filter((s) => s.status === "active").length} hint={`${ships.length} au total`} icon={Users} />
        <StatCard label="Demandes en attente" value={pending.count ?? 0} icon={ClipboardList} tone="warning" />
        <StatCard label="Séances réalisées" value={done.count ?? 0} icon={CheckCircle2} tone="success" />
        <StatCard label="Créneaux libres à venir" value={slots.count ?? 0} icon={CalendarCheck} tone="violet" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Prochains rendez-vous</CardTitle><Link href="/mentor/rendez-vous" className="text-sm text-primary hover:underline">Calendrier</Link></CardHeader>
          <CardContent>
            {appts.length === 0 ? <p className="text-sm text-muted">Aucune séance à venir.</p> : (
              <ul className="space-y-3">
                {appts.map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <Avatar person={people.get(a.mentee_id)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{fullName(people.get(a.mentee_id))} · {a.topic || "Séance"}</p>
                      <p className="text-xs text-muted">{formatDateTime(a.starts_at)} · {SESSION_TYPE_LABELS[a.session_type]}</p>
                    </div>
                    {a.status === "pending" ? <span className="inline-flex items-center gap-1 text-xs font-medium text-warning"><Clock className="size-3" />À confirmer</span> : <span className="text-xs text-success">Confirmée</span>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Disponibilités et profil</CardTitle>{mentor && <VerificationBadge status={mentor.verification_status} />}</CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="text-muted">Disponibilités indicatives : </span>{mentor?.availability_note || "non renseignées"}</p>
            <p><span className="text-muted">Capacité : </span>{ships.filter((s) => s.status === "active").length}/{mentor?.max_mentees ?? 5} mentorés</p>
            <p><span className="text-muted">Créneaux publiés à venir : </span>{slots.count ?? 0}</p>
            <div className="flex flex-wrap gap-2 pt-2"><ButtonLink href="/mentor/rendez-vous" size="sm" variant="secondary">Gérer mes créneaux</ButtonLink><ButtonLink href="/mentor/profil" size="sm" variant="ghost">Modifier mon profil</ButtonLink></div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Activités récentes</CardTitle></CardHeader>
          <CardContent>
            {(activity.data ?? []).length === 0 ? <p className="text-sm text-muted">Aucune activité pour l&apos;instant.</p> : (
              <ul className="divide-y divide-border">
                {((activity.data ?? []) as AppNotification[]).map((n) => (
                  <li key={n.id} className="py-2.5 text-sm">
                    {n.link ? <Link href={n.link} className="font-medium hover:text-primary">{n.title}</Link> : <span className="font-medium">{n.title}</span>}
                    {n.body && <span className="text-muted"> — {n.body}</span>}
                    <span className="ml-2 text-xs text-muted">{timeAgo(n.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
