import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPeople } from "@/lib/queries";
import { fullName } from "@/lib/utils";
import type { Goal, GoalComment, Milestone, Mentorship, PersonSummary } from "@/types/db";

/** Objectif, étapes, commentaires et auteurs (accès contrôlé par RLS). */
export async function loadGoal(supabase: SupabaseClient, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data: goal } = await supabase.from("mentorship_goals").select("*").eq("id", id).maybeSingle<Goal>();
  if (!goal) return null;
  const [milestones, comments, ship] = await Promise.all([
    supabase.from("goal_milestones").select("*").eq("goal_id", id).order("position"),
    supabase.from("goal_comments").select("*").eq("goal_id", id).order("created_at"),
    goal.mentorship_id ? supabase.from("mentorships").select("*").eq("id", goal.mentorship_id).maybeSingle<Mentorship>() : Promise.resolve({ data: null }),
  ]);
  const commentList = (comments.data ?? []) as GoalComment[];
  const mentorship = ship.data as Mentorship | null;
  const people = await getPeople(supabase, [...commentList.map((c) => c.author_id), mentorship?.mentor_id, goal.mentee_id]);
  return {
    goal,
    milestones: (milestones.data ?? []) as Milestone[],
    comments: commentList,
    mentorship,
    mentorName: mentorship ? fullName(people.get(mentorship.mentor_id)) : null,
    menteeName: fullName(people.get(goal.mentee_id)),
    people: Object.fromEntries(people) as Record<string, PersonSummary>,
  };
}
