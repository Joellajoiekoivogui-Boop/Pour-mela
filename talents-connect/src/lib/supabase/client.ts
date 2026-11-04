"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

let client: SupabaseClient | null = null;

/**
 * Client navigateur : utilise uniquement la clé publique « anon ».
 * Toutes les données restent protégées par les politiques RLS.
 */
export function getBrowserSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  client ??= createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
