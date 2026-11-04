import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, FilterBar, PAGE_SIZE, Pagination, Td, pageFrom } from "@/components/admin/table";
import { OpportunityForm } from "@/components/admin/opportunity-form";
import { ActionButton } from "@/components/shared/action-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteOpportunityAction } from "@/lib/actions/content";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { OPPORTUNITY_CATEGORY_LABELS } from "@/lib/labels";
import { getCatalog } from "@/lib/queries";
import type { Opportunity, OpportunityCategory } from "@/types/db";

export const metadata: Metadata = { title: "Opportunités" };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; categorie?: string; page?: string; modifier?: string }> }) {
  const params = await searchParams;
  const page = pageFrom(params.page);
  const { supabase } = await requireRole(["admin", "super_admin"]);
  const { domains } = await getCatalog();
  let q = supabase.from("opportunities").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (params.categorie && params.categorie in OPPORTUNITY_CATEGORY_LABELS) q = q.eq("category", params.categorie as OpportunityCategory);
  if (params.q) q = q.ilike("title", `%${params.q.replace(/[%,()]/g, " ").slice(0, 80)}%`);
  const [{ data, count }, editing] = await Promise.all([
    q,
    params.modifier && /^[0-9a-f-]{36}$/i.test(params.modifier) ? supabase.from("opportunities").select("*").eq("id", params.modifier).maybeSingle<Opportunity>() : Promise.resolve({ data: null }),
  ]);
  const rows = (data ?? []) as Opportunity[];
  const edit = editing.data as Opportunity | null;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader title="Opportunités" description="Stages, emplois, bourses, hackathons… publiés pour les mentorés." />
      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <div>
          <FilterBar search={{ value: params.q, placeholder: "Titre…" }} selects={[{ name: "categorie", value: params.categorie, label: "Catégorie", options: Object.entries(OPPORTUNITY_CATEGORY_LABELS) }]} />
          <DataTable head={["Opportunité", "Catégorie", "Date limite", "Statut", "Actions"]} empty={rows.length === 0}>
            {rows.map((o) => (
              <tr key={o.id}>
                <Td><p className="font-medium text-navy">{o.title}</p><p className="text-xs text-muted">{o.organization}</p></Td>
                <Td>{OPPORTUNITY_CATEGORY_LABELS[o.category]}</Td>
                <Td className="whitespace-nowrap">{o.deadline ? formatDate(o.deadline) : "—"}</Td>
                <Td>{!o.is_published ? <Badge tone="warning">Brouillon</Badge> : o.deadline && o.deadline < today ? <Badge>Expirée</Badge> : <Badge tone="success">Publiée</Badge>}</Td>
                <Td className="whitespace-nowrap">
                  <Link href={`/admin/opportunites?modifier=${o.id}`} className="mr-2 text-sm font-medium text-primary hover:underline">Modifier</Link>
                  <ActionButton size="sm" variant="danger-ghost" confirm="Supprimer cette opportunité ?" action={() => deleteOpportunityAction(o.id)}>Supprimer</ActionButton>
                </Td>
              </tr>
            ))}
          </DataTable>
          <Pagination page={page} total={count ?? 0} params={params} basePath="/admin/opportunites" />
        </div>
        <Card className="h-fit">
          <CardHeader className="flex-row items-center justify-between"><CardTitle>{edit ? "Modifier l'opportunité" : "Nouvelle opportunité"}</CardTitle>{edit && <Link href="/admin/opportunites" className="text-sm text-muted hover:underline">Annuler</Link>}</CardHeader>
          <CardContent><OpportunityForm key={edit?.id ?? "new"} domains={domains} opportunity={edit ?? undefined} /></CardContent>
        </Card>
      </div>
    </>
  );
}
