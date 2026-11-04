import type { Metadata } from "next";
import Link from "next/link";
import { Handshake } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MentorshipBadge } from "@/components/shared/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { getPeople } from "@/lib/queries";
import { fullName } from "@/lib/utils";
import type { Mentorship } from "@/types/db";

export const metadata: Metadata = { title: "Mes mentorats" };

export default async function MenteeMentorshipsPage() {
  const { supabase, profile } = await requireRole(["mentee"]);
  const { data } = await supabase.from("mentorships").select("*").eq("mentee_id", profile.id).order("status").order("started_at", { ascending: false });
  const list = (data ?? []) as Mentorship[];
  const people = await getPeople(supabase, list.map((m) => m.mentor_id));
  return (
    <>
      <PageHeader title="Mes mentorats" description="Chaque mentorat dispose de son espace de suivi : séances, objectifs et messagerie." />
      {list.length === 0 ? (
        <EmptyState icon={Handshake} title="Pas encore de mentorat" description="Lorsqu'un mentor accepte votre demande, le mentorat apparaît ici." action={<ButtonLink href="/mentore/trouver">Trouver un mentor</ButtonLink>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((m) => {
            const mentor = people.get(m.mentor_id);
            return (
              <Link key={m.id} href={`/mentore/mentorats/${m.id}`}>
                <Card className="flex items-center gap-4 p-5 transition-shadow hover:shadow-[var(--shadow-raised)]">
                  <Avatar person={mentor} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy">{fullName(mentor)}</p>
                    <p className="text-xs text-muted">Depuis le {formatDate(m.started_at)}{m.ended_at ? ` · terminé le ${formatDate(m.ended_at)}` : ""}</p>
                  </div>
                  <MentorshipBadge status={m.status} />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
