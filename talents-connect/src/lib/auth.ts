import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { homeForRole } from "@/lib/labels";
import type { Profile, UserRole } from "@/types/db";

export interface Session {
  supabase: SupabaseClient;
  user: User;
  profile: Profile;
}

/**
 * Session courante : utilisateur authentifié (jeton vérifié par Supabase) et
 * son profil lu en base. Le rôle vient TOUJOURS de la table profiles, jamais
 * du navigateur. Mis en cache pour la durée d'une requête.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, first_name, last_name, avatar_url, location, bio, is_demo, is_suspended, created_at")
    .eq("id", user.id)
    .maybeSingle<Profile>();
  if (!profile) return null;
  return { supabase, user, profile };
});

/** Exige une session ; sinon redirige vers la connexion. */
export async function requireSession(next?: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion");
  if (session.profile.is_suspended) redirect("/compte-suspendu");
  return session;
}

/** Exige l'un des rôles donnés ; sinon renvoie l'utilisateur vers son propre espace. */
export async function requireRole(roles: UserRole[], next?: string): Promise<Session> {
  const session = await requireSession(next);
  if (!roles.includes(session.profile.role)) redirect(homeForRole(session.profile.role));
  return session;
}

export const isAdminRole = (role: UserRole) => role === "admin" || role === "super_admin";
