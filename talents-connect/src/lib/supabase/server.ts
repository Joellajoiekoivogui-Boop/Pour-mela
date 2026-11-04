import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Client serveur lié aux cookies de session de l'utilisateur.
 * Renvoie null si Supabase n'est pas configuré.
 */
export async function getServerSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return null;
  const store = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Appelé depuis un Server Component : le proxy rafraîchit déjà la session.
        }
      },
    },
  });
}
