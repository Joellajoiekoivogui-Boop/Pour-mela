"use server";

import { revalidatePath } from "next/cache";
import { addWeeks } from "date-fns";
import { z } from "zod";
import { zonedInputToUtc } from "@/lib/dates";
import { bookingSchema, slotSchema } from "@/lib/validation/schemas";
import { fromDb, fromZod, type ActionResult } from "./result";
import { actionSession } from "./session";

const uuid = z.string().uuid();

function revalidateCalendar() {
  revalidatePath("/mentore", "layout");
  revalidatePath("/mentor", "layout");
}

/** Le mentor publie un créneau (éventuellement répété chaque semaine). Heures saisies à Conakry. */
export async function createSlotsAction(input: unknown): Promise<ActionResult<{ created: number }>> {
  const { session, error } = await actionSession(["mentor"]);
  if (error) return error;
  const parsed = slotSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  const start = zonedInputToUtc(v.date, v.startTime);
  if (!start) return { ok: false, error: "Date ou heure invalide.", fieldErrors: { date: "Date invalide" } };
  if (new Date(start) <= new Date()) return { ok: false, error: "Le créneau doit être dans le futur.", fieldErrors: { date: "Date passée" } };

  const rows = Array.from({ length: v.repeatWeeks }, (_, i) => {
    const s = addWeeks(new Date(start), i);
    return {
      mentor_id: session.user.id,
      starts_at: s.toISOString(),
      ends_at: new Date(s.getTime() + v.durationMinutes * 60_000).toISOString(),
      session_types: v.sessionTypes,
    };
  });
  const { error: dbError } = await session.supabase.from("availability_slots").insert(rows);
  if (dbError) {
    if (dbError.code === "23505") return { ok: false, error: "Vous avez déjà un créneau qui commence à cette heure." };
    return fromDb(dbError);
  }
  revalidateCalendar();
  return { ok: true, message: rows.length > 1 ? `${rows.length} créneaux publiés.` : "Créneau publié.", data: { created: rows.length } };
}

export async function deleteSlotAction(slotId: string): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentor"]);
  if (error) return error;
  if (!uuid.safeParse(slotId).success) return { ok: false, error: "Créneau invalide." };
  const { error: dbError, count } = await session.supabase.from("availability_slots").delete({ count: "exact" }).eq("id", slotId);
  if (dbError) return fromDb(dbError);
  if (!count) return { ok: false, error: "Ce créneau est réservé : annulez d'abord le rendez-vous." };
  revalidateCalendar();
  return { ok: true, message: "Créneau supprimé." };
}

export async function bookAppointmentAction(input: unknown): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentee"]);
  if (error) return error;
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  const { error: dbError } = await session.supabase.rpc("book_appointment", {
    p_slot_id: v.slotId, p_mentorship_id: v.mentorshipId, p_session_type: v.sessionType, p_topic: v.topic,
  });
  if (dbError) return fromDb(dbError);
  revalidateCalendar();
  return { ok: true, message: "Séance réservée. Votre mentor doit la confirmer." };
}

export async function confirmAppointmentAction(appointmentId: string, locationOrLink: string): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentor"]);
  if (error) return error;
  if (!uuid.safeParse(appointmentId).success || locationOrLink.length > 500) return { ok: false, error: "Données invalides." };
  const { error: dbError } = await session.supabase.rpc("confirm_appointment", { p_appointment_id: appointmentId, p_location_or_link: locationOrLink.trim() || null });
  if (dbError) return fromDb(dbError);
  revalidateCalendar();
  return { ok: true, message: "Séance confirmée." };
}

export async function cancelAppointmentAction(appointmentId: string, reason: string): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentee", "mentor"]);
  if (error) return error;
  if (!uuid.safeParse(appointmentId).success || reason.length > 500) return { ok: false, error: "Données invalides." };
  const { error: dbError } = await session.supabase.rpc("cancel_appointment", { p_appointment_id: appointmentId, p_reason: reason.trim() || null });
  if (dbError) return fromDb(dbError);
  revalidateCalendar();
  return { ok: true, message: "Séance annulée." };
}

export async function rescheduleAppointmentAction(appointmentId: string, newSlotId: string): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentee"]);
  if (error) return error;
  if (!uuid.safeParse(appointmentId).success || !uuid.safeParse(newSlotId).success) return { ok: false, error: "Données invalides." };
  const { error: dbError } = await session.supabase.rpc("reschedule_appointment", { p_appointment_id: appointmentId, p_new_slot_id: newSlotId });
  if (dbError) return fromDb(dbError);
  revalidateCalendar();
  return { ok: true, message: "Séance reprogrammée. Votre mentor doit confirmer le nouveau créneau." };
}

export async function completeAppointmentAction(appointmentId: string, notes: string): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentor"]);
  if (error) return error;
  if (!uuid.safeParse(appointmentId).success || notes.length > 3000) return { ok: false, error: "Données invalides." };
  const { error: dbError } = await session.supabase.rpc("complete_appointment", { p_appointment_id: appointmentId, p_notes: notes.trim() || null });
  if (dbError) return fromDb(dbError);
  revalidateCalendar();
  return { ok: true, message: "Séance marquée comme réalisée." };
}

/** Le mentoré note ce qu'il retient d'une séance réalisée. */
export async function saveTakeawaysAction(appointmentId: string, text: string): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentee"]);
  if (error) return error;
  if (!uuid.safeParse(appointmentId).success || text.length > 1500) return { ok: false, error: "Données invalides." };
  const { error: dbError } = await session.supabase.rpc("save_session_takeaways", { p_appointment_id: appointmentId, p_text: text });
  if (dbError) return fromDb(dbError);
  revalidateCalendar();
  return { ok: true, message: "C'est noté. Nous vous proposerons de le revoir dans quelques jours." };
}

/** Révision terminée (le mentoré a essayé de se rappeler, puis a relu ses notes). */
export async function markTakeawaysReviewedAction(appointmentId: string): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentee"]);
  if (error) return error;
  if (!uuid.safeParse(appointmentId).success) return { ok: false, error: "Séance invalide." };
  const { error: dbError } = await session.supabase.rpc("mark_takeaways_reviewed", { p_appointment_id: appointmentId });
  if (dbError) return fromDb(dbError);
  revalidateCalendar();
  return { ok: true };
}
