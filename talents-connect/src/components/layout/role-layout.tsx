import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth";
import { countUnreadNotifications } from "@/lib/queries";
import type { UserRole } from "@/types/db";

/** Layout commun des espaces connectés : contrôle du rôle (côté serveur) et coque de l'application. */
export async function RoleLayout({ roles, basePath, children }: { roles: UserRole[]; basePath: string; children: React.ReactNode }) {
  const { supabase, profile } = await requireRole(roles, basePath);
  const unread = await countUnreadNotifications(supabase, profile.id);
  return <AppShell person={profile} unreadCount={unread}>{children}</AppShell>;
}
