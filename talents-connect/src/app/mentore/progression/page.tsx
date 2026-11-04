import type { Metadata } from "next";
import { CheckCircle2, ListChecks, Target, TrendingUp } from "lucide-react";
import { startOfWeek } from "date-fns";
import { PageHeader, StatCard } from "@/components/layout/page-header";
import { GoalsBarChart, MilestonesTimeline, StatusDonut } from "@/components/charts/progress-charts";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { requireRole } from "@/lib/auth";
import { formatShortDate } from "@/lib/dates";
import { goalProgress, overallProgress } from "@/lib/goals";
import type { GoalWithMilestones } from "@/lib/mentorship";

export const metadata: Metadata = { title: "Ma progression" };

export default async function ProgressPage() {
  const { supabase, profile } = await requireRole(["mentee"]);
  const [goalsRes, sessions] = await Promise.all([
    supabase.from("mentorship_goals").select("*, milestones:goal_milestones(*)").eq("mentee_id", profile.id),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("mentee_id", profile.id).eq("status", "completed"),
  ]);
  const goals = (goalsRes.data ?? []) as GoalWithMilestones[];
  if (goals.length === 0) {
    return (
      <>
        <PageHeader title="Ma progression" />
        <EmptyState icon={TrendingUp} title="Pas encore de données" description="Créez un objectif et cochez ses étapes : vos graphiques de progression apparaîtront ici." action={<ButtonLink href="/mentore/objectifs">Définir un objectif</ButtonLink>} />
      </>
    );
  }
  const milestones = goals.filter((g) => g.status !== "abandoned").flatMap((g) => g.milestones);
  const done = milestones.filter((m) => m.is_done && m.done_at);

  // Cumul hebdomadaire des étapes accomplies (calculé à partir des dates réelles).
  const weeks = new Map<number, number>();
  for (const m of done) {
    const w = startOfWeek(new Date(m.done_at!), { weekStartsOn: 1 }).getTime();
    weeks.set(w, (weeks.get(w) ?? 0) + 1);
  }
  const timeline: { week: string; total: number }[] = [];
  for (const [w, n] of [...weeks.entries()].sort((a, b) => a[0] - b[0])) {
    timeline.push({ week: formatShortDate(new Date(w)), total: (timeline.at(-1)?.total ?? 0) + n });
  }

  return (
    <>
      <PageHeader title="Ma progression" description="Tous les chiffres sont calculés à partir des étapes que vous avez réellement accomplies." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Progression globale" value={`${overallProgress(goals)} %`} icon={TrendingUp} tone="success" />
        <StatCard label="Objectifs atteints" value={`${goals.filter((g) => g.status === "completed").length}/${goals.length}`} icon={Target} />
        <StatCard label="Étapes accomplies" value={`${milestones.filter((m) => m.is_done).length}/${milestones.length}`} icon={ListChecks} tone="violet" />
        <StatCard label="Séances réalisées" value={sessions.count ?? 0} icon={CheckCircle2} tone="warning" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Progression par objectif</CardTitle></CardHeader>
          <CardContent><GoalsBarChart data={goals.filter((g) => g.status !== "abandoned").map((g) => ({ name: g.title.length > 22 ? `${g.title.slice(0, 21)}…` : g.title, progress: goalProgress(g.milestones) }))} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Statut des objectifs</CardTitle></CardHeader>
          <CardContent>
            <StatusDonut data={[
              { name: "Atteints", value: goals.filter((g) => g.status === "completed").length, tone: "success" },
              { name: "En cours", value: goals.filter((g) => g.status === "in_progress").length, tone: "primary" },
              { name: "À démarrer", value: goals.filter((g) => g.status === "not_started").length, tone: "muted" },
              { name: "Abandonnés", value: goals.filter((g) => g.status === "abandoned").length, tone: "warning" },
            ]} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Étapes accomplies au fil du temps</CardTitle><CardDescription>Cumul par semaine</CardDescription></CardHeader>
          <CardContent>{timeline.length > 0 ? <MilestonesTimeline data={timeline} /> : <p className="text-sm text-muted">Cochez une première étape pour démarrer la courbe.</p>}</CardContent>
        </Card>
      </div>
    </>
  );
}
