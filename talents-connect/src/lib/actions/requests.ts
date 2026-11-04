"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { mentorRequestSchema } from "@/lib/validation/schemas";
import { fromDb, fromZod, type ActionResult } from "./result";
import { actionSession } from "./session";

/** Envoi d'une demande de mentorat (la RLS vérifie le rôle et la vérification du mentor). */
export async function sendMentorRequestAction(input: unknown, matchScore: number | null): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentee"]);
  if (error) return error;
  const parsed = mentorRequestSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const score = matchScore != null && Number.isInteger(matchScore) && matchScore >= 0 && matchScore <= 100 ? matchScore : null;

  const { supabase, user } = session;
  const active = await supabase.from("mentorships").select("id").eq("mentee_id", user.id).eq("mentor_id", parsed.data.mentorId).eq("status", "active").maybeSingle();
  if (active.data) return { ok: false, error: "Vous êtes déjà accompagné(e) par ce mentor." };

  const { error: dbError } = await supabase.from("mentor_requests").insert({
    mentee_id: user.id, mentor_id: parsed.data.mentorId, motivation: parsed.data.motivation, objectives: parsed.data.objectives, match_score: score,
  });
  if (dbError) {
    if (dbError.code === "23505") return { ok: false, error: "Vous avez déjà une demande en attente auprès de ce mentor." };
    return fromDb(dbError, "La demande n'a pas pu être envoyée.");
  }
  revalidatePath("/mentore", "layout");
  return { ok: true, message: "Demande envoyée. Vous serez notifié(e) de la réponse." };
}

const respondSchema = z.object({ requestId: z.string().uuid(), accept: z.boolean(), message: z.string().trim().max(1000).optional() });

export async function respondToRequestAction(input: unknown): Promise<ActionResult<{ mentorshipId: string | null }>> {
  const { session, error } = await actionSession(["mentor"]);
  if (error) return error;
  const parsed = respondSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const { data, error: dbError } = await session.supabase.rpc("respond_to_request", {
    p_request_id: parsed.data.requestId, p_accept: parsed.data.accept, p_message: parsed.data.message || null,
  });
  if (dbError) return fromDb(dbError);
  revalidatePath("/mentor", "layout");
  return { ok: true, message: parsed.data.accept ? "Demande acceptée : le mentorat est ouvert." : "Demande refusée.", data: { mentorshipId: (data as string | null) ?? null } };
}

export async function cancelRequestAction(requestId: string): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentee"]);
  if (error) return error;
  if (!z.string().uuid().safeParse(requestId).success) return { ok: false, error: "Demande invalide." };
  const { error: dbError } = await session.supabase.rpc("cancel_request", { p_request_id: requestId });
  if (dbError) return fromDb(dbError);
  revalidatePath("/mentore/demandes");
  return { ok: true, message: "Demande annulée." };
}

export async function completeMentorshipAction(mentorshipId: string): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentee", "mentor"]);
  if (error) return error;
  if (!z.string().uuid().safeParse(mentorshipId).success) return { ok: false, error: "Mentorat invalide." };
  const { error: dbError } = await session.supabase.rpc("complete_mentorship", { p_mentorship_id: mentorshipId });
  if (dbError) return fromDb(dbError);
  revalidatePath("/", "layout");
  return { ok: true, message: "Mentorat clôturé." };
}
