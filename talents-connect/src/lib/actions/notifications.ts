"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromDb, type ActionResult } from "./result";
import { actionSession } from "./session";

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  const { session, error } = await actionSession();
  if (error) return error;
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Notification invalide." };
  const { error: dbError } = await session.supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  if (dbError) return fromDb(dbError);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const { session, error } = await actionSession();
  if (error) return error;
  const { error: dbError } = await session.supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  if (dbError) return fromDb(dbError);
  revalidatePath("/", "layout");
  return { ok: true, message: "Toutes les notifications sont lues." };
}

export async function deleteReadNotificationsAction(): Promise<ActionResult> {
  const { session, error } = await actionSession();
  if (error) return error;
  const { error: dbError } = await session.supabase.from("notifications").delete().not("read_at", "is", null);
  if (dbError) return fromDb(dbError);
  revalidatePath("/", "layout");
  return { ok: true, message: "Notifications lues supprimées." };
}
