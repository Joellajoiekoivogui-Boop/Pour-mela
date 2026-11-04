import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPeople } from "@/lib/queries";
import type { Appointment, AvailabilitySlot, Goal, Milestone, Mentorship, Review } from "@/types/db";

export type GoalWithMilestones = Goal & { milestones: Milestone[] };

/**
 * Espace de suivi d'un mentorat : participants, séances, créneaux libres du
 * mentor, objectifs associés, conversation et évaluation. La RLS garantit que
 * seuls les deux participants (et l'administration) y accèdent.
 */
export async function loadMentorship(supabase: SupabaseClient, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data: m } = await supabase.from("mentorships").select("*").eq("id", id).maybeSingle<Mentorship>();
  if (!m) return null;
  const now = new Date().toISOString();
  const [appointments, slots, goals, conversation, review, people] = await Promise.all([
    supabase.from("appointments").select("*").eq("mentorship_id", id).order("starts_at", { ascending: false }),
    supabase.from("availability_slots").select("*").eq("mentor_id", m.mentor_id).eq("is_booked", false).gt("starts_at", now).order("starts_at").limit(40),
    supabase.from("mentorship_goals").select("*, milestones:goal_milestones(*)").eq("mentorship_id", id).order("created_at", { ascending: false }),
    supabase.from("conversations").select("id").eq("mentorship_id", id).maybeSingle<{ id: string }>(),
    supabase.from("reviews").select("*").eq("mentorship_id", id).maybeSingle<Review>(),
    getPeople(supabase, [m.mentor_id, m.mentee_id]),
  ]);
  const goalList = ((goals.data ?? []) as GoalWithMilestones[]).map((g) => ({ ...g, milestones: [...g.milestones].sort((a, b) => a.position - b.position) }));
  return {
    mentorship: m,
    mentor: people.get(m.mentor_id),
    mentee: people.get(m.mentee_id),
    appointments: (appointments.data ?? []) as Appointment[],
    freeSlots: (slots.data ?? []) as AvailabilitySlot[],
    goals: goalList,
    conversationId: conversation.data?.id ?? null,
    review: review.data ?? null,
  };
}

/** Mentorats actifs d'un utilisateur, avec le nom de l'autre participant (pour les listes déroulantes). */
export async function activeMentorshipOptions(supabase: SupabaseClient, userId: string, as: "mentee" | "mentor") {
  const { data } = await supabase.from("mentorships").select("id, mentor_id, mentee_id").eq(as === "mentee" ? "mentee_id" : "mentor_id", userId).eq("status", "active");
  const rows = (data ?? []) as Pick<Mentorship, "id" | "mentor_id" | "mentee_id">[];
  const people = await getPeople(supabase, rows.map((r) => (as === "mentee" ? r.mentor_id : r.mentee_id)));
  return rows.map((r) => {
    const other = people.get(as === "mentee" ? r.mentor_id : r.mentee_id);
    return { id: r.id, menteeId: r.mentee_id, label: `${as === "mentee" ? "Avec" : "Pour"} ${`${other?.first_name ?? ""} ${other?.last_name ?? ""}`.trim() || "—"}` };
  });
}
