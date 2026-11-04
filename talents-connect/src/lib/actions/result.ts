import type { PostgrestError } from "@supabase/supabase-js";
import type { z } from "zod";

/** Résultat uniforme des actions serveur, affiché par les formulaires. */
export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function fromZod(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, error: "Certains champs sont invalides.", fieldErrors };
}

/**
 * Traduit une erreur PostgreSQL/PostgREST en message compréhensible. Les
 * messages levés par nos fonctions SQL (codes P0001/P0002/42501) sont déjà en
 * français et sont renvoyés tels quels ; les autres sont masqués.
 */
export function fromDb(error: PostgrestError | null, fallback = "Une erreur est survenue. Réessayez."): ActionResult<never> {
  if (!error) return { ok: false, error: fallback };
  if (["P0001", "P0002", "42501"].includes(error.code) && error.message) return { ok: false, error: error.message };
  if (error.code === "23505") return { ok: false, error: "Cet élément existe déjà." };
  if (error.message?.includes("row-level security")) return { ok: false, error: "Action non autorisée." };
  console.error("[db]", error.code, error.message);
  return { ok: false, error: fallback };
}

export const notConfigured: ActionResult<never> = {
  ok: false,
  error: "Supabase n'est pas configuré : renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.",
};
