import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, FilterBar, PAGE_SIZE, Pagination, Td, pageFrom } from "@/components/admin/table";
import { RequestBadge } from "@/components/shared/status-badges";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { REQUEST_STATUS_LABELS } from "@/lib/labels";
import { getPeople } from "@/lib/queries";
import { fullName } from "@/lib/utils";
import type { MentorRequest, RequestStatus } from "@/types/db";

export const metadata: Metadata = { title: "Demandes" };

export default async function Page({ searchParams }: { searchParams: Promise<{ statut?: string; page?: string }> }) {
  const params = await searchParams;
  const page = pageFrom(params.page);
  const { supabase } = await requireRole(["admin", "super_admin"]);
  let q = supabase.from("mentor_requests").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (params.statut && params.statut in REQUEST_STATUS_LABELS) q = q.eq("status", params.statut as RequestStatus);
  const { data, count } = await q;
  const rows = (data ?? []) as MentorRequest[];
  const people = await getPeople(supabase, rows.flatMap((r) => [r.mentee_id, r.mentor_id]));
  return (
    <>
      <PageHeader title="Demandes de mentorat" description="Toutes les demandes envoyées sur la plateforme." />
      <FilterBar selects={[{ name: "statut", value: params.statut, label: "Statut", options: Object.entries(REQUEST_STATUS_LABELS) }]} />
      <DataTable head={["Mentoré", "Mentor", "Score", "Statut", "Date"]} empty={rows.length === 0}>
        {rows.map((r) => (
          <tr key={r.id}>
            <Td className="font-medium">{fullName(people.get(r.mentee_id))}</Td>
            <Td>{fullName(people.get(r.mentor_id))}</Td>
            <Td>{r.match_score ?? "—"}</Td>
            <Td><RequestBadge status={r.status} /></Td>
            <Td className="whitespace-nowrap text-muted">{formatDate(r.created_at)}</Td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={page} total={count ?? 0} params={params} basePath="/admin/demandes" />
    </>
  );
}
