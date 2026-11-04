import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, PAGE_SIZE, Pagination, Td, pageFrom } from "@/components/admin/table";
import { ActionButton } from "@/components/shared/action-button";
import { Badge } from "@/components/ui/badge";
import { setReviewHiddenAction } from "@/lib/actions/admin";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { getPeople } from "@/lib/queries";
import { fullName } from "@/lib/utils";
import type { Review } from "@/types/db";

export const metadata: Metadata = { title: "Évaluations" };

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = pageFrom(params.page);
  const { supabase } = await requireRole(["admin", "super_admin"]);
  const { data, count } = await supabase.from("reviews").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const rows = (data ?? []) as Review[];
  const people = await getPeople(supabase, rows.flatMap((r) => [r.reviewer_id, r.mentor_id]));
  return (
    <>
      <PageHeader title="Évaluations" description="Modérez les avis publics : un avis masqué n'apparaît plus sur le profil du mentor." />
      <DataTable head={["Mentor", "Auteur", "Note", "Commentaire", "Date", "Action"]} empty={rows.length === 0}>
        {rows.map((r) => (
          <tr key={r.id} className={r.is_hidden ? "opacity-60" : undefined}>
            <Td className="font-medium">{fullName(people.get(r.mentor_id))}</Td>
            <Td>{fullName(people.get(r.reviewer_id))}</Td>
            <Td className="whitespace-nowrap text-amber-500">{"★".repeat(r.rating)}</Td>
            <Td className="max-w-72 text-slate-700">{r.comment ?? "—"} {r.is_hidden && <Badge tone="warning">Masqué</Badge>}</Td>
            <Td className="whitespace-nowrap text-muted">{formatDate(r.created_at)}</Td>
            <Td><ActionButton size="sm" variant={r.is_hidden ? "secondary" : "danger-ghost"} action={() => setReviewHiddenAction(r.id, !r.is_hidden)}>{r.is_hidden ? "Rétablir" : "Masquer"}</ActionButton></Td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={page} total={count ?? 0} params={params} basePath="/admin/evaluations" />
    </>
  );
}
