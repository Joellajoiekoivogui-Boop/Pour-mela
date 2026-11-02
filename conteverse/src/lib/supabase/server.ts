import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

/** Client serveur lié aux cookies de session de l'utilisateur. Null en mode démo. */
export async function getServerSupabase() {
  if (!isSupabaseConfigured) return null;
  const store = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Appelé depuis un Server Component : le proxy rafraîchit la session.
        }
      },
    },
  });
}

export type AppRole = "admin" | "editeur" | "utilisateur";

/** Utilisateur courant et son rôle le plus élevé (lu via RLS dans user_roles). */
export async function getCurrentUserWithRole() {
  const supabase = await getServerSupabase();
  if (!supabase) return { supabase: null, user: null, role: null as AppRole | null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: null as AppRole | null };
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const roles = (data ?? []).map((r) => r.role as AppRole);
  const role: AppRole = roles.includes("admin") ? "admin" : roles.includes("editeur") ? "editeur" : "utilisateur";
  return { supabase, user, role };
}
