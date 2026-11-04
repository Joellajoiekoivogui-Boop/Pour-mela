import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, FilterBar, PAGE_SIZE, Pagination, Td, pageFrom } from "@/components/admin/table";
import { ReportActions } from "@/components/admin/report-actions";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { REPORT_STATUS_LABELS } from "@/lib/labels";
import { getPeople } from "@/lib/queries";
import { fullName } from "@/lib/utils";
import type { Report, ReportStatus } from "@/types/db";

export const metadata: Metadata = { title: "Signalements" };

export default async function Page({ searchParams }: { searchParams: Promise<{ statut?: string; page?: string }> }) {
  const params = await searchParams;
  const page = pageFrom(params.page);
  const { supabase } = await requireRole(["admin", "super_admin"]);
  let q = supabase.from("reports").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (params.statut && params.statut in REPORT_STATUS_LABELS) q = q.eq("status", params.statut as ReportStatus);
  const { data, count } = await q;
  const rows = (data ?? []) as Report[];
  const people = await getPeople(supabase, rows.flatMap((r) => [r.reporter_id, r.target_user_id]));
  return (
    <>
      <PageHeader title="Signalements" description="Signalements envoyés par les membres. Pour suspendre un compte, utilisez la page Utilisateurs." />
      <FilterBar selects={[{ name: "statut", value: params.statut, label: "Statut", options: Object.entries(REPORT_STATUS_LABELS) }]} />
      <DataTable head={["Date", "Signalé par", "Concerne", "Motif", "Statut", "Actions"]} empty={rows.length === 0}>
        {rows.map((r) => (
          <tr key={r.id}>
            <Td className="whitespace-nowrap text-muted">{formatDate(r.created_at)}</Td>
            <Td>{fullName(people.get(r.reporter_id ?? ""))}</Td>
            <Td className="font-medium">{r.target_user_id ? fullName(people.get(r.target_user_id)) : r.target_type}</Td>
            <Td className="max-w-72"><p>{r.reason}</p>{r.details && <p className="text-xs text-muted">{r.details}</p>}{r.resolution_note && <p className="mt-1 text-xs text-success">Suite : {r.resolution_note}</p>}</Td>
            <Td><Badge tone={r.status === "open" ? "danger" : r.status === "reviewing" ? "warning" : "neutral"}>{REPORT_STATUS_LABELS[r.status]}</Badge></Td>
            <Td><ReportActions id={r.id} status={r.status} /></Td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={page} total={count ?? 0} params={params} basePath="/admin/signalements" />
    </>
  );
}
