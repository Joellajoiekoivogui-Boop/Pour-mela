"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { opportunitySchema, resourceSchema } from "@/lib/validation/schemas";
import { fromDb, fromZod, type ActionResult } from "./result";
import { actionSession, ADMIN_ROLES } from "./session";

const uuid = z.string().uuid();
const RESOURCE_FILE_TYPES = new Map([["application/pdf", "pdf"], ["image/jpeg", "image"], ["image/png", "image"], ["image/webp", "image"]]);

function revalidateContent() {
  revalidatePath("/mentore", "layout");
  revalidatePath("/mentor", "layout");
  revalidatePath("/admin", "layout");
}

/**
 * Publication d'une ressource par un mentor ou un administrateur : lien
 * externe, vidéo (YouTube/Vimeo) ou fichier (PDF, image) dans Storage.
 */
export async function createResourceAction(formData: FormData): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentor", ...ADMIN_ROLES]);
  if (error) return error;
  const parsed = resourceSchema.safeParse({
    title: formData.get("title"), description: formData.get("description") ?? undefined, domainId: formData.get("domainId"),
    type: formData.get("type"), url: formData.get("url") ?? undefined,
  });
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  const file = formData.get("file");
  let file_path: string | null = null;

  if (v.type === "pdf" || v.type === "image") {
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Ajoutez le fichier.", fieldErrors: { file: "Fichier requis" } };
    if (RESOURCE_FILE_TYPES.get(file.type) !== v.type) return { ok: false, error: v.type === "pdf" ? "Le fichier doit être un PDF." : "Image JPG, PNG ou WebP attendue." };
    if (file.size > 10 * 1024 * 1024) return { ok: false, error: "Fichier trop lourd (10 Mo maximum)." };
    const safe = file.name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-80);
    file_path = `${session.user.id}/${Date.now()}-${safe}`;
    const up = await session.supabase.storage.from("resources").upload(file_path, file, { contentType: file.type });
    if (up.error) return { ok: false, error: "Le fichier n'a pas pu être téléversé." };
  } else if (!v.url) {
    return { ok: false, error: "Ajoutez l'adresse du lien.", fieldErrors: { url: "Adresse requise" } };
  } else if (v.type === "video" && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//i.test(v.url)) {
    return { ok: false, error: "Vidéo acceptée : lien YouTube ou Vimeo.", fieldErrors: { url: "Lien YouTube ou Vimeo" } };
  }

  const { error: dbError } = await session.supabase.from("resources").insert({
    author_id: session.user.id, domain_id: v.domainId, title: v.title, description: v.description, type: v.type,
    url: file_path ? null : v.url, file_path,
  });
  if (dbError) return fromDb(dbError);
  revalidateContent();
  return { ok: true, message: "Ressource publiée." };
}

export async function setResourcePublishedAction(id: string, published: boolean): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentor", ...ADMIN_ROLES]);
  if (error) return error;
  if (!uuid.safeParse(id).success) return { ok: false, error: "Ressource invalide." };
  const { error: dbError, count } = await session.supabase.from("resources").update({ is_published: published }, { count: "exact" }).eq("id", id);
  if (dbError) return fromDb(dbError);
  if (!count) return { ok: false, error: "Action non autorisée." };
  revalidateContent();
  return { ok: true, message: published ? "Ressource publiée." : "Ressource masquée." };
}

export async function deleteResourceAction(id: string): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentor", ...ADMIN_ROLES]);
  if (error) return error;
  if (!uuid.safeParse(id).success) return { ok: false, error: "Ressource invalide." };
  const { data: row } = await session.supabase.from("resources").select("file_path").eq("id", id).maybeSingle<{ file_path: string | null }>();
  const { error: dbError, count } = await session.supabase.from("resources").delete({ count: "exact" }).eq("id", id);
  if (dbError) return fromDb(dbError);
  if (!count) return { ok: false, error: "Action non autorisée." };
  if (row?.file_path) await session.supabase.storage.from("resources").remove([row.file_path]);
  revalidateContent();
  return { ok: true, message: "Ressource supprimée." };
}

export async function saveOpportunityAction(input: unknown, id?: string): Promise<ActionResult> {
  const { session, error } = await actionSession(ADMIN_ROLES);
  if (error) return error;
  const parsed = opportunitySchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  const row = {
    title: v.title, organization: v.organization, description: v.description, category: v.category, domain_id: v.domainId,
    location: v.location, deadline: v.deadline, requirements: v.requirements, apply_url: v.applyUrl, image_url: v.imageUrl,
    is_published: v.isPublished,
  };
  const { error: dbError } = id
    ? await session.supabase.from("opportunities").update(row).eq("id", id)
    : await session.supabase.from("opportunities").insert({ ...row, created_by: session.user.id });
  if (dbError) return fromDb(dbError);
  revalidateContent();
  return { ok: true, message: id ? "Opportunité mise à jour." : "Opportunité publiée." };
}

export async function deleteOpportunityAction(id: string): Promise<ActionResult> {
  const { session, error } = await actionSession(ADMIN_ROLES);
  if (error) return error;
  if (!uuid.safeParse(id).success) return { ok: false, error: "Opportunité invalide." };
  const { error: dbError } = await session.supabase.from("opportunities").delete().eq("id", id);
  if (dbError) return fromDb(dbError);
  revalidateContent();
  return { ok: true, message: "Opportunité supprimée." };
}

export async function toggleBookmarkAction(opportunityId: string, saved: boolean): Promise<ActionResult> {
  const { session, error } = await actionSession();
  if (error) return error;
  if (!uuid.safeParse(opportunityId).success) return { ok: false, error: "Opportunité invalide." };
  const { supabase, user } = session;
  const { error: dbError } = saved
    ? await supabase.from("opportunity_bookmarks").upsert({ user_id: user.id, opportunity_id: opportunityId })
    : await supabase.from("opportunity_bookmarks").delete().eq("user_id", user.id).eq("opportunity_id", opportunityId);
  if (dbError) return fromDb(dbError);
  revalidatePath("/mentore/opportunites");
  return { ok: true, message: saved ? "Ajoutée à vos favoris." : "Retirée de vos favoris." };
}
