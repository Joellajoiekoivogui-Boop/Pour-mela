"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { passwordSchema, reportSchema, reviewSchema } from "@/lib/validation/schemas";
import { fromDb, fromZod, type ActionResult } from "./result";
import { actionSession } from "./session";

export async function submitReviewAction(input: unknown): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentee"]);
  if (error) return error;
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const { supabase, user } = session;
  const { data: m } = await supabase.from("mentorships").select("mentor_id").eq("id", parsed.data.mentorshipId).maybeSingle<{ mentor_id: string }>();
  if (!m) return { ok: false, error: "Mentorat introuvable." };
  const { error: dbError } = await supabase.from("reviews").insert({
    mentorship_id: parsed.data.mentorshipId, reviewer_id: user.id, mentor_id: m.mentor_id, rating: parsed.data.rating, comment: parsed.data.comment,
  });
  if (dbError) return dbError.code === "23505" ? { ok: false, error: "Vous avez déjà évalué ce mentorat." } : fromDb(dbError);
  revalidatePath("/mentore", "layout");
  return { ok: true, message: "Merci pour votre évaluation !" };
}

export async function submitReportAction(input: unknown): Promise<ActionResult> {
  const { session, error } = await actionSession();
  if (error) return error;
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  const { error: dbError } = await session.supabase.from("reports").insert({
    reporter_id: session.user.id, target_type: v.targetType, target_id: v.targetId ?? null, target_user_id: v.targetUserId ?? null,
    reason: v.reason, details: v.details,
  });
  if (dbError) return fromDb(dbError);
  return { ok: true, message: "Signalement transmis à l'équipe de modération." };
}

const changePasswordSchema = z.object({ password: passwordSchema });

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const { session, error } = await actionSession();
  if (error) return error;
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const { error: authError } = await session.supabase.auth.updateUser({ password: parsed.data.password });
  if (authError) return { ok: false, error: authError.code === "same_password" ? "Choisissez un mot de passe différent." : authError.message };
  return { ok: true, message: "Mot de passe modifié." };
}

/** Suppression définitive du compte (et de toutes ses données, par cascade). */
export async function deleteAccountAction(confirmation: string): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentee", "mentor"]);
  if (error) return error;
  if (confirmation !== "SUPPRIMER") return { ok: false, error: "Saisissez SUPPRIMER pour confirmer." };
  const { error: dbError } = await session.supabase.rpc("delete_my_account");
  if (dbError) return fromDb(dbError);
  await session.supabase.auth.signOut();
  redirect("/?compte=supprime");
}
