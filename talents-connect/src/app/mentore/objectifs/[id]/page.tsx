import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { GoalDetail } from "@/components/goals/goal-detail";
import { GoalBadge, PriorityBadge } from "@/components/shared/status-badges";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { loadGoal } from "@/lib/goal-detail";

export default async function MenteeGoalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireRole(["mentee"]);
  const data = await loadGoal(supabase, id);
  if (!data || data.goal.mentee_id !== profile.id) notFound();
  const { goal } = data;
  return (
    <>
      <Link href="/mentore/objectifs" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"><ArrowLeft className="size-4" /> Mes objectifs</Link>
      <PageHeader title={goal.title} description={<span className="inline-flex flex-wrap items-center gap-2"><GoalBadge status={goal.status} /><PriorityBadge priority={goal.priority} />{goal.due_date && `Échéance : ${formatDate(goal.due_date)}`}{data.mentorName && ` · suivi par ${data.mentorName}`}</span>} />
      {goal.description && <p className="-mt-4 mb-6 max-w-3xl text-sm text-slate-700">{goal.description}</p>}
      <GoalDetail goal={goal} milestones={data.milestones} comments={data.comments} people={data.people} canEdit canDelete afterDeleteHref="/mentore/objectifs" />
    </>
  );
}
