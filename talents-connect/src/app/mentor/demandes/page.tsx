import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RequestActions } from "@/components/mentorship/request-actions";
import { RequestBadge } from "@/components/shared/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { EDUCATION_LEVELS } from "@/lib/labels";
import { getPeople } from "@/lib/queries";
import { cn, fullName } from "@/lib/utils";
import type { MenteeProfile, MentorRequest } from "@/types/db";

export const metadata: Metadata = { title: "Demandes de mentorat" };

export default async function MentorRequestsPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const { supabase, profile } = await requireRole(["mentor"]);
  const showAll = statut === "toutes";
  let q = supabase.from("mentor_requests").select("*").eq("mentor_id", profile.id).order("created_at", { ascending: false });
  if (!showAll) q = q.eq("status", "pending");
  const { data } = await q;
  const requests = (data ?? []) as MentorRequest[];
  const ids = requests.map((r) => r.mentee_id);
  const [people, mps] = await Promise.all([
    getPeople(supabase, ids),
    ids.length ? supabase.from("mentee_profiles").select("*").in("user_id", ids) : Promise.resolve({ data: [] }),
  ]);
  const menteeProfiles = new Map(((mps.data ?? []) as MenteeProfile[]).map((m) => [m.user_id, m]));

  return (
    <>
      <PageHeader title="Demandes de mentorat" description="Consultez le profil et la motivation de chaque jeune avant de répondre." />
      <div className="mb-5 flex gap-2">
        <Link href="/mentor/demandes" className={cn("rounded-full px-3 py-1.5 text-sm", !showAll ? "bg-navy text-white" : "bg-subtle text-slate-700")}>En attente</Link>
        <Link href="/mentor/demandes?statut=toutes" className={cn("rounded-full px-3 py-1.5 text-sm", showAll ? "bg-navy text-white" : "bg-subtle text-slate-700")}>Historique</Link>
      </div>
      {requests.length === 0 ? <EmptyState icon={ClipboardList} title={showAll ? "Aucune demande reçue" : "Aucune demande en attente"} description="Les demandes apparaissent ici dès qu'un mentoré vous sollicite." /> : (
        <ul className="space-y-4">
          {requests.map((r) => {
            const person = people.get(r.mentee_id);
            const mp = menteeProfiles.get(r.mentee_id);
            return (
              <li key={r.id}>
                <Card className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <Avatar person={person} size="lg" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-navy">{fullName(person)}</p>
                          <RequestBadge status={r.status} />
                          {r.match_score != null && <Badge tone="primary">Compatibilité {r.match_score}/100</Badge>}
                        </div>
                        <p className="text-xs text-muted">
                          {[mp?.education_level ? EDUCATION_LEVELS[mp.education_level] : null, mp?.field_of_study, mp?.institution].filter(Boolean).join(" · ") || "Profil peu renseigné"} · reçue le {formatDate(r.created_at)}
                        </p>
                        <div className="mt-3 space-y-2 text-sm text-slate-700">
                          <p><span className="font-medium text-navy">Motivation : </span>{r.motivation}</p>
                          <p><span className="font-medium text-navy">Objectifs : </span>{r.objectives}</p>
                          {mp?.professional_goals && <p className="text-muted"><span className="font-medium">Objectifs du profil : </span>{mp.professional_goals}</p>}
                          {r.response_message && <p className="rounded-md bg-subtle p-2.5"><span className="font-medium">Votre réponse : </span>{r.response_message}</p>}
                        </div>
                      </div>
                    </div>
                    {r.status === "pending" && <div className="lg:w-72"><RequestActions requestId={r.id} /></div>}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
