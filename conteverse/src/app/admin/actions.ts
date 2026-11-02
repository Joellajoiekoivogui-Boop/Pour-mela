"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserWithRole } from "@/lib/supabase/server";

const ARTICLE_STATUSES = ["brouillon", "relecture", "publie", "archive"] as const;
const ROLES = ["admin", "editeur", "utilisateur"] as const;

// Chaque action revérifie le rôle côté serveur ; les politiques RLS de
// Supabase l'imposent une seconde fois au niveau de la base.

export async function setArticleStatus(formData: FormData) {
  const { supabase, user, role } = await getCurrentUserWithRole();
  if (!supabase || !user || (role !== "admin" && role !== "editeur")) throw new Error("Accès refusé.");
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!ARTICLE_STATUSES.includes(status as (typeof ARTICLE_STATUSES)[number])) throw new Error("Statut invalide.");
  const { error } = await supabase.from("articles").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("moderation_logs").insert({ actor_id: user.id, action: "article.status", target_table: "articles", target_id: id, details: { status } });
  revalidatePath("/admin");
}

export async function setUserRole(formData: FormData) {
  const { supabase, user, role } = await getCurrentUserWithRole();
  if (!supabase || !user || role !== "admin") throw new Error("Accès refusé.");
  const target = String(formData.get("user_id"));
  const newRole = String(formData.get("role"));
  if (!ROLES.includes(newRole as (typeof ROLES)[number])) throw new Error("Rôle invalide.");
  if (target === user.id) throw new Error("Vous ne pouvez pas modifier votre propre rôle.");
  await supabase.from("user_roles").delete().eq("user_id", target);
  const { error } = await supabase.from("user_roles").insert({ user_id: target, role: newRole });
  if (error) throw new Error(error.message);
  await supabase.from("moderation_logs").insert({ actor_id: user.id, action: "user.role", target_table: "user_roles", target_id: target, details: { role: newRole } });
  revalidatePath("/admin");
}

export async function resolveReview(formData: FormData) {
  const { supabase, user, role } = await getCurrentUserWithRole();
  if (!supabase || !user || (role !== "admin" && role !== "editeur")) throw new Error("Accès refusé.");
  const id = String(formData.get("id"));
  const decision = String(formData.get("decision")) === "approuve" ? "approuve" : "rejete";
  const { error } = await supabase.from("content_reviews").update({ status: decision, reviewer_id: user.id }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
