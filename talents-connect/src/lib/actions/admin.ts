"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromDb, fromZod, type ActionResult } from "./result";
import { actionSession, ADMIN_ROLES } from "./session";

const uuid = z.string().uuid();

export async function verifyMentorAction(input: unknown): Promise<ActionResult> {
  const { session, error } = await actionSession(ADMIN_ROLES);
  if (error) return error;
  const parsed = z.object({ userId: uuid, approve: z.boolean(), reason: z.string().trim().max(500).optional() }).safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  if (!parsed.data.approve && !parsed.data.reason) return { ok: false, error: "Indiquez le motif du refus : il sera transmis au mentor." };
  const { error: dbError } = await session.supabase.rpc("admin_verify_mentor", {
    p_user_id: parsed.data.userId, p_approve: parsed.data.approve, p_reason: parsed.data.reason || null,
  });
  if (dbError) return fromDb(dbError);
  revalidatePath("/admin", "layout");
  revalidatePath("/mentors");
  return { ok: true, message: parsed.data.approve ? "Mentor vérifié : son profil est maintenant public." : "Profil refusé, le mentor a été notifié." };
}

export async function setRoleAction(userId: string, role: string): Promise<ActionResult> {
  const { session, error } = await actionSession(["super_admin"]);
  if (error) return error;
  const parsed = z.object({ userId: uuid, role: z.enum(["mentee", "mentor", "admin", "super_admin"]) }).safeParse({ userId, role });
  if (!parsed.success) return fromZod(parsed.error);
  const { error: dbError } = await session.supabase.rpc("admin_set_role", { p_user_id: parsed.data.userId, p_role: parsed.data.role });
  if (dbError) return fromDb(dbError);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Rôle mis à jour." };
}

export async function setSuspendedAction(userId: string, suspended: boolean): Promise<ActionResult> {
  const { session, error } = await actionSession(ADMIN_ROLES);
  if (error) return error;
  if (!uuid.safeParse(userId).success) return { ok: false, error: "Utilisateur invalide." };
  const { error: dbError } = await session.supabase.rpc("admin_set_suspended", { p_user_id: userId, p_suspended: suspended });
  if (dbError) return fromDb(dbError);
  revalidatePath("/admin", "layout");
  return { ok: true, message: suspended ? "Compte suspendu." : "Compte réactivé." };
}

export async function handleReportAction(reportId: string, status: string, note: string): Promise<ActionResult> {
  const { session, error } = await actionSession(ADMIN_ROLES);
  if (error) return error;
  const parsed = z.object({ reportId: uuid, status: z.enum(["open", "reviewing", "resolved", "dismissed"]), note: z.string().max(1000) }).safeParse({ reportId, status, note });
  if (!parsed.success) return fromZod(parsed.error);
  const { error: dbError } = await session.supabase.rpc("admin_handle_report", { p_report_id: reportId, p_status: status, p_note: note.trim() || null });
  if (dbError) return fromDb(dbError);
  revalidatePath("/admin/signalements");
  return { ok: true, message: "Signalement mis à jour." };
}

export async function setReviewHiddenAction(reviewId: string, hidden: boolean): Promise<ActionResult> {
  const { session, error } = await actionSession(ADMIN_ROLES);
  if (error) return error;
  if (!uuid.safeParse(reviewId).success) return { ok: false, error: "Avis invalide." };
  const { error: dbError } = await session.supabase.from("reviews").update({ is_hidden: hidden }).eq("id", reviewId);
  if (dbError) return fromDb(dbError);
  revalidatePath("/admin/evaluations");
  return { ok: true, message: hidden ? "Avis masqué." : "Avis rétabli." };
}
