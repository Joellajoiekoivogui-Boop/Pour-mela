import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, FilterBar, PAGE_SIZE, Pagination, Td, pageFrom } from "@/components/admin/table";
import { MentorshipBadge } from "@/components/shared/status-badges";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { MENTORSHIP_STATUS_LABELS } from "@/lib/labels";
import { getPeople } from "@/lib/queries";
import { fullName } from "@/lib/utils";
import type { Mentorship, MentorshipStatus } from "@/types/db";

export const metadata: Metadata = { title: "Mentorats" };

export default async function Page({ searchParams }: { searchParams: Promise<{ statut?: string; page?: string }> }) {
  const params = await searchParams;
  const page = pageFrom(params.page);
  const { supabase } = await requireRole(["admin", "super_admin"]);
  let q = supabase.from("mentorships").select("*", { count: "exact" }).order("started_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (params.statut && params.statut in MENTORSHIP_STATUS_LABELS) q = q.eq("status", params.statut as MentorshipStatus);
  const { data, count } = await q;
  const rows = (data ?? []) as Mentorship[];
  const ids = rows.map((r) => r.id);
  const [people, appts] = await Promise.all([
    getPeople(supabase, rows.flatMap((r) => [r.mentee_id, r.mentor_id])),
    ids.length ? supabase.from("appointments").select("mentorship_id").eq("status", "completed").in("mentorship_id", ids) : Promise.resolve({ data: [] }),
  ]);
  const sessions = new Map<string, number>();
  for (const a of (appts.data ?? []) as { mentorship_id: string }[]) sessions.set(a.mentorship_id, (sessions.get(a.mentorship_id) ?? 0) + 1);
  return (
    <>
      <PageHeader title="Mentorats" description="Relations mentor-mentoré ouvertes sur la plateforme. Les conversations restent privées." />
      <FilterBar selects={[{ name: "statut", value: params.statut, label: "Statut", options: Object.entries(MENTORSHIP_STATUS_LABELS) }]} />
      <DataTable head={["Mentor", "Mentoré", "Statut", "Séances réalisées", "Début", "Fin"]} empty={rows.length === 0}>
        {rows.map((r) => (
          <tr key={r.id}>
            <Td className="font-medium">{fullName(people.get(r.mentor_id))}</Td>
            <Td>{fullName(people.get(r.mentee_id))}</Td>
            <Td><MentorshipBadge status={r.status} /></Td>
            <Td>{sessions.get(r.id) ?? 0}</Td>
            <Td className="whitespace-nowrap text-muted">{formatDate(r.started_at)}</Td>
            <Td className="whitespace-nowrap text-muted">{r.ended_at ? formatDate(r.ended_at) : "—"}</Td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={page} total={count ?? 0} params={params} basePath="/admin/mentorats" />
    </>
  );
}
