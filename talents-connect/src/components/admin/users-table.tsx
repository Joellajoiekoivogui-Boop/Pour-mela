import { DataTable, FilterBar, PAGE_SIZE, Pagination, Td } from "@/components/admin/table";
import { RoleSelect } from "@/components/admin/role-select";
import { ActionButton } from "@/components/shared/action-button";
import { VerificationBadge } from "@/components/shared/status-badges";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/misc";
import { setSuspendedAction } from "@/lib/actions/admin";
import type { Session } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { ROLE_LABELS } from "@/lib/labels";
import type { UserRole, VerificationStatus } from "@/types/db";

type Row = { id: string; email: string; role: UserRole; first_name: string; last_name: string; is_suspended: boolean; is_demo: boolean; verification_status: VerificationStatus | null; created_at: string; total: number };

/** Tableau des utilisateurs (lecture via admin_list_users, qui vérifie le rôle en base). */
export async function UsersTable({ session, basePath, params, roles }: {
  session: Session; basePath: string; params: { q?: string; role?: string; page?: string }; roles?: UserRole[];
}) {
  const page = Math.max(1, Number(params.page) || 1);
  const allowed = roles ?? (Object.keys(ROLE_LABELS) as UserRole[]);
  const role = params.role && allowed.includes(params.role as UserRole) ? (params.role as UserRole) : null;
  const isSuper = session.profile.role === "super_admin";

  // Pour la page « administrateurs », sans filtre explicite on interroge chaque rôle autorisé.
  const roleQueries = role ? [role] : roles ?? [null];
  const results = await Promise.all(roleQueries.map((r) => session.supabase.rpc("admin_list_users", {
    p_search: params.q?.slice(0, 80) || null, p_role: r, p_limit: PAGE_SIZE, p_offset: (page - 1) * PAGE_SIZE,
  })));
  const error = results.find((r) => r.error)?.error;
  const rows = results.flatMap((r) => (r.data ?? []) as Row[]);
  const total = results.reduce((s, r) => s + Number(((r.data ?? []) as Row[])[0]?.total ?? 0), 0);

  return (
    <>
      {!isSuper && <Alert tone="info" className="mb-4">Seul un super administrateur peut modifier les rôles.</Alert>}
      <FilterBar search={{ value: params.q, placeholder: "Nom ou e-mail…" }} selects={[{ name: "role", value: params.role, label: "Rôle", options: allowed.map((r) => [r, ROLE_LABELS[r]]) }]} />
      {error ? <Alert tone="danger">Chargement impossible.</Alert> : (
        <>
          <DataTable head={["Utilisateur", "Rôle", "Statut", "Inscription", "Actions"]} empty={rows.length === 0}>
            {rows.map((u) => (
              <tr key={u.id} className={u.is_suspended ? "bg-danger-soft/40" : undefined}>
                <Td><p className="font-medium text-navy">{`${u.first_name} ${u.last_name}`.trim() || "—"}</p><p className="text-xs text-muted">{u.email}</p></Td>
                <Td>{isSuper && u.id !== session.user.id ? <RoleSelect userId={u.id} role={u.role} /> : <Badge tone={u.role === "mentee" ? "neutral" : u.role === "mentor" ? "violet" : "navy"}>{ROLE_LABELS[u.role]}</Badge>}</Td>
                <Td className="space-x-1 space-y-1">
                  {u.is_suspended && <Badge tone="danger">Suspendu</Badge>}
                  {u.is_demo && <Badge tone="warning">Démo</Badge>}
                  {u.role === "mentor" && u.verification_status && <VerificationBadge status={u.verification_status} />}
                </Td>
                <Td className="whitespace-nowrap text-muted">{formatDate(u.created_at)}</Td>
                <Td>
                  {u.id !== session.user.id && (isSuper || (u.role !== "admin" && u.role !== "super_admin")) && (
                    <ActionButton size="sm" variant={u.is_suspended ? "secondary" : "danger-ghost"} confirm={u.is_suspended ? "Réactiver ce compte ?" : "Suspendre ce compte ? L'utilisateur ne pourra plus accéder à son espace."} action={() => setSuspendedAction(u.id, !u.is_suspended)}>
                      {u.is_suspended ? "Réactiver" : "Suspendre"}
                    </ActionButton>
                  )}
                </Td>
              </tr>
            ))}
          </DataTable>
          <Pagination page={page} total={total} params={params} basePath={basePath} />
        </>
      )}
    </>
  );
}
