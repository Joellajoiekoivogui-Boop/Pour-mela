import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MentorshipBadge } from "@/components/shared/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { EmptyState, Progress } from "@/components/ui/misc";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { goalProgress } from "@/lib/goals";
import { getPeople } from "@/lib/queries";
import { fullName } from "@/lib/utils";
import type { Mentorship } from "@/types/db";

export const metadata: Metadata = { title: "Mes mentorés" };

export default async function MentorMenteesPage() {
  const { supabase, profile } = await requireRole(["mentor"]);
  const { data } = await supabase.from("mentorships").select("*").eq("mentor_id", profile.id).order("status").order("started_at", { ascending: false });
  const list = (data ?? []) as Mentorship[];
  const ids = list.map((m) => m.id);
  const [people, goals] = await Promise.all([
    getPeople(supabase, list.map((m) => m.mentee_id)),
    ids.length ? supabase.from("mentorship_goals").select("mentorship_id, status, milestones:goal_milestones(is_done)").in("mentorship_id", ids) : Promise.resolve({ data: [] }),
  ]);
  const goalsByShip = new Map<string, { is_done: boolean }[]>();
  for (const g of (goals.data ?? []) as { mentorship_id: string; status: string; milestones: { is_done: boolean }[] }[]) {
    if (g.status !== "abandoned") goalsByShip.set(g.mentorship_id, [...(goalsByShip.get(g.mentorship_id) ?? []), ...g.milestones]);
  }

  return (
    <>
      <PageHeader title="Mes mentorés" description="Suivez la progression de chaque mentoré et accédez à son espace de mentorat." />
      {list.length === 0 ? <EmptyState icon={Users} title="Aucun mentoré pour l'instant" description="Acceptez une demande pour ouvrir votre premier mentorat." /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((m) => {
            const p = goalProgress(goalsByShip.get(m.id) ?? []);
            return (
              <Link key={m.id} href={`/mentor/mentorats/${m.id}`}>
                <Card className="p-5 transition-shadow hover:shadow-[var(--shadow-raised)]">
                  <div className="flex items-center gap-4">
                    <Avatar person={people.get(m.mentee_id)} size="lg" />
                    <div className="min-w-0 flex-1"><p className="font-semibold text-navy">{fullName(people.get(m.mentee_id))}</p><p className="text-xs text-muted">Depuis le {formatDate(m.started_at)}</p></div>
                    <MentorshipBadge status={m.status} />
                  </div>
                  <div className="mt-4 flex items-center gap-3"><Progress value={p} label="Progression des objectifs" /><span className="shrink-0 text-xs text-muted">{p} %</span></div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
