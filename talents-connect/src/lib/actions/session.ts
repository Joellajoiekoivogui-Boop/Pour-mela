import "server-only";
import { getSession, type Session } from "@/lib/auth";
import type { UserRole } from "@/types/db";
import type { ActionResult } from "./result";

/**
 * Session pour une action serveur : renvoie une erreur (au lieu de rediriger)
 * si l'utilisateur n'est pas connecté, est suspendu ou n'a pas le bon rôle.
 * Ce contrôle s'ajoute aux politiques RLS, qui restent la vraie barrière.
 */
export async function actionSession(roles?: UserRole[]): Promise<{ session: Session; error?: never } | { session?: never; error: ActionResult<never> }> {
  const session = await getSession();
  if (!session) return { error: { ok: false, error: "Votre session a expiré. Reconnectez-vous." } };
  if (session.profile.is_suspended) return { error: { ok: false, error: "Compte suspendu." } };
  if (roles && !roles.includes(session.profile.role)) return { error: { ok: false, error: "Action non autorisée pour votre profil." } };
  return { session };
}

export const ADMIN_ROLES: UserRole[] = ["admin", "super_admin"];
