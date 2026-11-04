"use server";

import { revalidatePath } from "next/cache";
import { menteeProfileSchema, mentorProfileSchema } from "@/lib/validation/schemas";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fromDb, fromZod, type ActionResult } from "./result";
import { actionSession } from "./session";
import type { SkillRelation } from "@/types/db";

/** Remplace les domaines et compétences d'un utilisateur (ses propres lignes, via RLS). */
async function replaceTags(supabase: SupabaseClient, userId: string, domainIds: number[], skills: { id: number; relation: SkillRelation }[], relations: SkillRelation[]) {
  const d1 = await supabase.from("user_domains").delete().eq("user_id", userId);
  if (d1.error) return d1.error;
  if (domainIds.length) {
    const r = await supabase.from("user_domains").insert([...new Set(domainIds)].map((domain_id) => ({ user_id: userId, domain_id })));
    if (r.error) return r.error;
  }
  const d2 = await supabase.from("user_skills").delete().eq("user_id", userId).in("relation", relations);
  if (d2.error) return d2.error;
  const unique = [...new Map(skills.map((s) => [`${s.id}:${s.relation}`, s])).values()];
  if (unique.length) {
    const r = await supabase.from("user_skills").insert(unique.map((s) => ({ user_id: userId, skill_id: s.id, relation: s.relation })));
    if (r.error) return r.error;
  }
  return null;
}

export async function saveMenteeProfileAction(input: unknown): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentee"]);
  if (error) return error;
  const parsed = menteeProfileSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  const { supabase, user } = session;

  const p = await supabase.from("profiles").update({ first_name: v.firstName, last_name: v.lastName, location: v.location, bio: v.bio }).eq("id", user.id);
  if (p.error) return fromDb(p.error);
  const m = await supabase.from("mentee_profiles").update({
    birth_date: v.birthDate, education_level: v.educationLevel, institution: v.institution, field_of_study: v.fieldOfStudy,
    interests: v.interests, professional_goals: v.professionalGoals, project_needs: v.projectNeeds,
  }).eq("user_id", user.id);
  if (m.error) return fromDb(m.error);
  const tagError = await replaceTags(supabase, user.id, v.domainIds, [
    ...v.skillIds.map((id) => ({ id, relation: "wants" as const })),
    ...v.hasSkillIds.map((id) => ({ id, relation: "has" as const })),
  ], ["wants", "has"]);
  if (tagError) return fromDb(tagError);

  revalidatePath("/mentore", "layout");
  return { ok: true, message: "Profil enregistré." };
}

export async function saveMentorProfileAction(input: unknown): Promise<ActionResult> {
  const { session, error } = await actionSession(["mentor"]);
  if (error) return error;
  const parsed = mentorProfileSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const v = parsed.data;
  const { supabase, user } = session;

  const p = await supabase.from("profiles").update({ first_name: v.firstName, last_name: v.lastName, location: v.location, bio: v.bio }).eq("id", user.id);
  if (p.error) return fromDb(p.error);
  const m = await supabase.from("mentor_profiles").update({
    job_title: v.jobTitle, organization: v.organization, years_experience: v.yearsExperience, education: v.education,
    experiences: v.experiences, languages: v.languages, availability_note: v.availabilityNote, support_types: v.supportTypes,
    max_mentees: v.maxMentees,
  }).eq("user_id", user.id);
  if (m.error) return fromDb(m.error);
  const tagError = await replaceTags(supabase, user.id, v.domainIds, v.skillIds.map((id) => ({ id, relation: "teaches" as const })), ["teaches"]);
  if (tagError) return fromDb(tagError);

  revalidatePath("/mentor", "layout");
  revalidatePath("/mentors");
  return { ok: true, message: "Profil enregistré." };
}

const AVATAR_TYPES = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);

/** Téléverse la photo de profil dans Storage (dossier de l'utilisateur) et met à jour le profil. */
export async function uploadAvatarAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const { session, error } = await actionSession();
  if (error) return error;
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Aucun fichier reçu." };
  const ext = AVATAR_TYPES.get(file.type);
  if (!ext) return { ok: false, error: "Format accepté : JPG, PNG ou WebP." };
  if (file.size > 2 * 1024 * 1024) return { ok: false, error: "Image trop lourde (2 Mo maximum)." };

  const { supabase, user } = session;
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;
  const up = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) return { ok: false, error: "Échec du téléversement. Réessayez." };
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const p = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
  if (p.error) return fromDb(p.error);
  revalidatePath("/", "layout");
  return { ok: true, message: "Photo mise à jour.", data: { url: data.publicUrl } };
}
