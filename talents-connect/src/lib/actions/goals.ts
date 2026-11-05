"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { goalSchema } from "@/lib/validation/schemas";
import { fromDb, fromZod, type ActionResult } from "./result";
import { actionSession } from "./session";

const uuid = z.string().uuid();

function revalidateGoals() {
  revalidatePath("/mentore", "layout");
  revalidatePath("/mentor", "layout");
}

/**
 * Création d'un objectif et de ses étapes. Le mentoré crée pour lui-même ;
 * le mentor peut créer pour un mentoré d'un mentorat actif (contrôlé par RLS).
 */
export async function createGoalAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const { session, error } = await actionSession(["mentee", "mentor"]);
  if (error) return error;
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  const { supabase, user, profile } = session;

  const menteeId = profile.role === "mentee" ? user.id : v.menteeId;
  if (!menteeId) return { ok: false, error: "Mentoré manquant." };
  if (profile.role === "mentor" && !v.mentorshipId) return { ok: false, error: "Choisissez le mentorat concerné." };

  const { data, error: dbError } = await supabase.from("mentorship_goals").insert({
    mentee_id: menteeId, mentorship_id: v.mentorshipId, created_by: user.id, title: v.title, description: v.description,
    priority: v.priority, due_date: v.dueDate,
  }).select("id").single<{ id: string }>();
  if (dbError || !data) return fromDb(dbError, "L'objectif n'a pas pu être créé.");

  if (v.milestones.length > 0) {
    const m = await supabase.from("goal_milestones").insert(v.milestones.map((title, i) => ({ goal_id: data.id, title, position: i + 1 })));
    if (m.error) return fromDb(m.error, "Objectif créé, mais les étapes n'ont pas pu être enregistrées.");
  }
  revalidateGoals();
  return { ok: true, message: "Objectif créé.", data: { id: data.id } };
}

const updateGoalSchema = z.object({
  goalId: uuid,
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]).optional(),
  abandoned: z.boolean().optional(),
});

export async function updateGoalAction(input: unknown): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentee", "mentor"]);
  if (error) return error;
  const parsed = updateGoalSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  const patch: Record<string, unknown> = { title: v.title, description: v.description || null, priority: v.priority, due_date: v.dueDate || null };
  if (v.abandoned !== undefined) patch.status = v.abandoned ? "abandoned" : "in_progress";
  const { error: dbError } = await session.supabase.from("mentorship_goals").update(patch).eq("id", v.goalId);
  if (dbError) return fromDb(dbError);
  revalidateGoals();
  return { ok: true, message: "Objectif mis à jour." };
}

export async function deleteGoalAction(goalId: string): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentee"]);
  if (error) return error;
  if (!uuid.safeParse(goalId).success) return { ok: false, error: "Objectif invalide." };
  const { error: dbError, count } = await session.supabase.from("mentorship_goals").delete({ count: "exact" }).eq("id", goalId);
  if (dbError) return fromDb(dbError);
  if (!count) return { ok: false, error: "Objectif introuvable." };
  revalidateGoals();
  return { ok: true, message: "Objectif supprimé." };
}

export async function toggleMilestoneAction(milestoneId: string, done: boolean): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentee", "mentor"]);
  if (error) return error;
  if (!uuid.safeParse(milestoneId).success) return { ok: false, error: "Étape invalide." };
  const { error: dbError, count } = await session.supabase.from("goal_milestones").update({ is_done: done }, { count: "exact" }).eq("id", milestoneId);
  if (dbError) return fromDb(dbError);
  if (!count) return { ok: false, error: "Vous ne pouvez pas modifier cette étape." };
  revalidateGoals();
  return { ok: true };
}

export async function addMilestoneAction(goalId: string, title: string): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentee", "mentor"]);
  if (error) return error;
  const t = title.trim();
  if (!uuid.safeParse(goalId).success || t.length < 2 || t.length > 200) return { ok: false, error: "Titre d'étape invalide (2 à 200 caractères)." };
  const { data: last } = await session.supabase.from("goal_milestones").select("position").eq("goal_id", goalId).order("position", { ascending: false }).limit(1).maybeSingle<{ position: number }>();
  const { error: dbError } = await session.supabase.from("goal_milestones").insert({ goal_id: goalId, title: t, position: (last?.position ?? 0) + 1 });
  if (dbError) return fromDb(dbError);
  revalidateGoals();
  return { ok: true, message: "Étape ajoutée." };
}

export async function deleteMilestoneAction(milestoneId: string): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentee", "mentor"]);
  if (error) return error;
  if (!uuid.safeParse(milestoneId).success) return { ok: false, error: "Étape invalide." };
  const { error: dbError } = await session.supabase.from("goal_milestones").delete().eq("id", milestoneId);
  if (dbError) return fromDb(dbError);
  revalidateGoals();
  return { ok: true };
}

export async function addGoalCommentAction(goalId: string, body: string): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentee", "mentor"]);
  if (error) return error;
  const text = body.trim();
  if (!uuid.safeParse(goalId).success || text.length < 1 || text.length > 2000) return { ok: false, error: "Commentaire invalide." };
  const { error: dbError } = await session.supabase.from("goal_comments").insert({ goal_id: goalId, author_id: session.user.id, body: text });
  if (dbError) return fromDb(dbError);
  revalidateGoals();
  return { ok: true, message: "Commentaire publié." };
}

/** Intention de mise en œuvre sur une étape (« Quand…, je… »). Vide = supprimée. */
export async function setMilestoneIntentionAction(milestoneId: string, intention: string): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentee", "mentor"]);
  if (error) return error;
  const text = intention.trim();
  if (!uuid.safeParse(milestoneId).success || text.length > 300) return { ok: false, error: "Intention invalide (300 caractères maximum)." };
  const { error: dbError, count } = await session.supabase.from("goal_milestones").update({ intention: text || null }, { count: "exact" }).eq("id", milestoneId);
  if (dbError) return fromDb(dbError);
  if (!count) return { ok: false, error: "Vous ne pouvez pas modifier cette étape." };
  revalidateGoals();
  return { ok: true, message: text ? "Intention enregistrée." : "Intention retirée." };
}
