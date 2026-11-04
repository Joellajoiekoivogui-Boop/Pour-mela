import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { RequestBadge } from "@/components/shared/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { cancelRequestAction } from "@/lib/actions/requests";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { getPeople } from "@/lib/queries";
import { fullName } from "@/lib/utils";
import type { MentorRequest } from "@/types/db";

export const metadata: Metadata = { title: "Mes demandes" };

export default async function MenteeRequestsPage() {
  const { supabase, profile } = await requireRole(["mentee"]);
  const { data } = await supabase.from("mentor_requests").select("*").eq("mentee_id", profile.id).order("created_at", { ascending: false });
  const requests = (data ?? []) as MentorRequest[];
  const [people, ships] = await Promise.all([
    getPeople(supabase, requests.map((r) => r.mentor_id)),
    supabase.from("mentorships").select("id, request_id").eq("mentee_id", profile.id),
  ]);
  const shipByRequest = new Map(((ships.data ?? []) as { id: string; request_id: string }[]).map((s) => [s.request_id, s.id]));

  return (
    <>
      <PageHeader title="Mes demandes" description="Suivez les demandes de mentorat que vous avez envoyées." actions={<ButtonLink href="/mentore/trouver">Nouvelle demande</ButtonLink>} />
      {requests.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Aucune demande pour l'instant" description="Trouvez un mentor compatible et envoyez votre première demande." action={<ButtonLink href="/mentore/trouver">Trouver un mentor</ButtonLink>} />
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => {
            const mentor = people.get(r.mentor_id);
            const ship = shipByRequest.get(r.id);
            return (
              <li key={r.id}>
                <Card className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <Avatar person={mentor} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/mentore/mentors/${r.mentor_id}`} className="font-semibold text-navy hover:text-primary">{fullName(mentor)}</Link>
                        <RequestBadge status={r.status} />
                        {r.match_score != null && <span className="text-xs text-muted">Compatibilité {r.match_score}/100</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-muted">Envoyée le {formatDate(r.created_at)}{r.responded_at ? ` · réponse le ${formatDate(r.responded_at)}` : ""}</p>
                      <p className="mt-3 line-clamp-3 text-sm text-slate-700"><span className="text-muted">Motivation : </span>{r.motivation}</p>
                      {r.response_message && <p className="mt-2 rounded-lg bg-subtle p-3 text-sm text-slate-700"><span className="font-medium">Réponse du mentor : </span>{r.response_message}</p>}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {r.status === "pending" && <ActionButton variant="secondary" size="sm" confirm="Annuler cette demande ?" action={() => cancelRequestAction(r.id)}>Annuler</ActionButton>}
                      {ship && <ButtonLink href={`/mentore/mentorats/${ship}`} size="sm">Ouvrir le mentorat</ButtonLink>}
                    </div>
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
