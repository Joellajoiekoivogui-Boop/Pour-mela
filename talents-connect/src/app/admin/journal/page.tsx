import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, PAGE_SIZE, Pagination, Td, pageFrom } from "@/components/admin/table";
import { requireRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { getPeople } from "@/lib/queries";
import { fullName } from "@/lib/utils";

export const metadata: Metadata = { title: "Journal d'activité" };

type Log = { id: number; admin_id: string | null; action: string; target_type: string | null; target_id: string | null; details: Record<string, unknown>; created_at: string };

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = pageFrom(params.page);
  const { supabase } = await requireRole(["admin", "super_admin"]);
  const { data, count } = await supabase.from("admin_activity_logs").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const rows = (data ?? []) as Log[];
  const people = await getPeople(supabase, rows.flatMap((r) => [r.admin_id, r.target_type === "user" ? r.target_id : null]));
  return (
    <>
      <PageHeader title="Journal d'activité" description="Toutes les actions sensibles d'administration, enregistrées automatiquement par la base de données." />
      <DataTable head={["Date", "Administrateur", "Action", "Cible", "Détails"]} empty={rows.length === 0}>
        {rows.map((r) => (
          <tr key={r.id}>
            <Td className="whitespace-nowrap text-muted">{formatDateTime(r.created_at)}</Td>
            <Td className="font-medium">{fullName(people.get(r.admin_id ?? ""))}</Td>
            <Td><code className="rounded bg-subtle px-1.5 py-0.5 text-xs">{r.action}</code></Td>
            <Td>{r.target_type === "user" && r.target_id ? fullName(people.get(r.target_id)) : r.target_type ?? "—"}</Td>
            <Td className="max-w-72 text-xs text-muted">{Object.entries(r.details ?? {}).filter(([, v]) => v != null).map(([k, v]) => `${k} : ${String(v)}`).join(" · ") || "—"}</Td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={page} total={count ?? 0} params={params} basePath="/admin/journal" />
    </>
  );
}
