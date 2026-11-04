import type { Metadata } from "next";
import Link from "next/link";
import { Target } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { GoalForm } from "@/components/goals/goal-form";
import { GoalBadge, PriorityBadge } from "@/components/shared/status-badges";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Progress } from "@/components/ui/misc";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { goalProgress } from "@/lib/goals";
import { activeMentorshipOptions, type GoalWithMilestones } from "@/lib/mentorship";

export const metadata: Metadata = { title: "Mes objectifs" };

export default async function MenteeGoalsPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  const { supabase, profile } = await requireRole(["mentee"]);
  const [goals, mentorships] = await Promise.all([
    supabase.from("mentorship_goals").select("*, milestones:goal_milestones(*)").eq("mentee_id", profile.id).order("created_at", { ascending: false }),
    activeMentorshipOptions(supabase, profile.id, "mentee"),
  ]);
  const list = (goals.data ?? []) as GoalWithMilestones[];
  let initial: { title: string; description?: string; milestones: string[] } | undefined;
  if (plan) {
    try {
      const parsed = JSON.parse(plan) as { title?: unknown; steps?: unknown };
      if (typeof parsed.title === "string" && Array.isArray(parsed.steps)) {
        initial = { title: parsed.title.slice(0, 160), milestones: parsed.steps.filter((s): s is string => typeof s === "string").map((s) => s.slice(0, 200)).slice(0, 30) };
      }
    } catch { /* paramètre ignoré s'il est invalide */ }
  }

  return (
    <>
      <PageHeader title="Mes objectifs" description="Découpez chaque objectif en étapes concrètes : votre progression est calculée sur les étapes accomplies." actions={<ButtonLink href="/mentore/assistant?mode=path" variant="secondary">Générer un parcours avec l&apos;IA</ButtonLink>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-3">
          {list.length === 0 ? (
            <EmptyState icon={Target} title="Aucun objectif" description="Exemple : « Devenir développeur Full Stack », avec les étapes HTML/CSS, JavaScript, React, projet, portfolio, entretiens." />
          ) : list.map((g) => {
            const p = goalProgress(g.milestones);
            return (
              <Link key={g.id} href={`/mentore/objectifs/${g.id}`} className="block">
                <Card className="p-5 transition-shadow hover:shadow-[var(--shadow-raised)]">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold text-navy">{g.title}</p>
                    <div className="flex gap-1.5"><PriorityBadge priority={g.priority} /><GoalBadge status={g.status} /></div>
                  </div>
                  {g.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{g.description}</p>}
                  <div className="mt-3 flex items-center gap-3"><Progress value={p} tone={p === 100 ? "success" : "primary"} label={g.title} /><span className="w-24 shrink-0 text-right text-xs text-muted">{g.milestones.filter((m) => m.is_done).length}/{g.milestones.length} étapes</span></div>
                  {g.due_date && <p className="mt-2 text-xs text-muted">Échéance : {formatDate(g.due_date)}</p>}
                </Card>
              </Link>
            );
          })}
        </div>
        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader><CardTitle>{initial ? "Parcours proposé par l'assistant" : "Nouvel objectif"}</CardTitle></CardHeader>
          <CardContent><GoalForm mentorships={mentorships} initial={initial} /></CardContent>
        </Card>
      </div>
    </>
  );
}
