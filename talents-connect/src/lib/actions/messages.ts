"use server";

import { z } from "zod";
import { fromDb, type ActionResult } from "./result";
import { actionSession } from "./session";
import type { Message } from "@/types/db";

const ATTACHMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
const MAX_ATTACHMENT = 5 * 1024 * 1024;

/**
 * Envoi d'un message (texte et/ou fichier). La RLS n'autorise que les membres
 * de la conversation d'un mentorat actif. Les fichiers vont dans le bucket
 * privé « attachments », dossier <conversation_id>/.
 */
export async function sendMessageAction(formData: FormData): Promise<ActionResult<{ message: Message }>> {
  const { session, error } = await actionSession(["mentee", "mentor"]);
  if (error) return error;
  const conversationId = String(formData.get("conversationId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const file = formData.get("file");
  if (!z.string().uuid().safeParse(conversationId).success) return { ok: false, error: "Conversation invalide." };
  if (body.length > 4000) return { ok: false, error: "Message trop long (4000 caractères maximum)." };

  let attachment_path: string | null = null;
  let attachment_name: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (!ATTACHMENT_TYPES.has(file.type)) return { ok: false, error: "Type de fichier non autorisé (PDF, image, Word ou texte)." };
    if (file.size > MAX_ATTACHMENT) return { ok: false, error: "Fichier trop lourd (5 Mo maximum)." };
    const safeName = file.name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-80);
    attachment_path = `${conversationId}/${Date.now()}-${safeName}`;
    attachment_name = file.name.slice(0, 200);
    const up = await session.supabase.storage.from("attachments").upload(attachment_path, file, { contentType: file.type });
    if (up.error) return { ok: false, error: "Le fichier n'a pas pu être envoyé." };
  }
  if (!body && !attachment_path) return { ok: false, error: "Message vide." };

  const { data, error: dbError } = await session.supabase.from("messages")
    .insert({ conversation_id: conversationId, sender_id: session.user.id, body, attachment_path, attachment_name })
    .select("*").single<Message>();
  if (dbError || !data) return fromDb(dbError, "Message non envoyé. Le mentorat est peut-être terminé.");
  return { ok: true, data: { message: data } };
}

/** Lien temporaire (10 min) vers une pièce jointe, uniquement pour un membre. */
export async function attachmentUrlAction(path: string): Promise<ActionResult<{ url: string }>> {
  const { session, error } = await actionSession();
  if (error) return error;
  if (!/^[0-9a-f-]{36}\/[\w.-]+$/i.test(path)) return { ok: false, error: "Fichier invalide." };
  const { data, error: sErr } = await session.supabase.storage.from("attachments").createSignedUrl(path, 600);
  if (sErr || !data) return { ok: false, error: "Fichier inaccessible." };
  return { ok: true, data: { url: data.signedUrl } };
}

export async function markConversationReadAction(conversationId: string): Promise<void> {
  const { session } = await actionSession();
  if (!session || !z.string().uuid().safeParse(conversationId).success) return;
  await session.supabase.rpc("mark_conversation_read", { p_conversation: conversationId });
}
