import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, FilterBar, PAGE_SIZE, Pagination, Td, pageFrom } from "@/components/admin/table";
import { AppointmentBadge } from "@/components/shared/status-badges";
import { requireRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { APPOINTMENT_STATUS_LABELS, SESSION_TYPE_LABELS } from "@/lib/labels";
import { getPeople } from "@/lib/queries";
import { fullName } from "@/lib/utils";
import type { Appointment, AppointmentStatus } from "@/types/db";

export const metadata: Metadata = { title: "Rendez-vous" };

export default async function Page({ searchParams }: { searchParams: Promise<{ statut?: string; page?: string }> }) {
  const params = await searchParams;
  const page = pageFrom(params.page);
  const { supabase } = await requireRole(["admin", "super_admin"]);
  let q = supabase.from("appointments").select("*", { count: "exact" }).order("starts_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (params.statut && params.statut in APPOINTMENT_STATUS_LABELS) q = q.eq("status", params.statut as AppointmentStatus);
  const { data, count } = await q;
  const rows = (data ?? []) as Appointment[];
  const people = await getPeople(supabase, rows.flatMap((r) => [r.mentee_id, r.mentor_id]));
  return (
    <>
      <PageHeader title="Rendez-vous" description="Séances planifiées et réalisées (heure de Conakry)." />
      <FilterBar selects={[{ name: "statut", value: params.statut, label: "Statut", options: Object.entries(APPOINTMENT_STATUS_LABELS) }]} />
      <DataTable head={["Date", "Mentor", "Mentoré", "Type", "Sujet", "Statut"]} empty={rows.length === 0}>
        {rows.map((r) => (
          <tr key={r.id}>
            <Td className="whitespace-nowrap">{formatDateTime(r.starts_at)}</Td>
            <Td className="font-medium">{fullName(people.get(r.mentor_id))}</Td>
            <Td>{fullName(people.get(r.mentee_id))}</Td>
            <Td>{SESSION_TYPE_LABELS[r.session_type]}</Td>
            <Td className="max-w-56 truncate text-muted">{r.topic ?? "—"}</Td>
            <Td><AppointmentBadge status={r.status} /></Td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={page} total={count ?? 0} params={params} basePath="/admin/rendez-vous" />
    </>
  );
}
