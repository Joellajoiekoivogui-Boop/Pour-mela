import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ResourceForm } from "@/components/resources/resource-form";
import { ResourceLibrary } from "@/components/resources/library";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getCatalog } from "@/lib/queries";

export const metadata: Metadata = { title: "Mes ressources" };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; domaine?: string; type?: string; vue?: string }> }) {
  const filters = await searchParams;
  const session = await requireRole(["mentor"]);
  const { domains } = await getCatalog();
  const all = filters.vue === "toutes";
  return (
    <>
      <PageHeader title={all ? "Bibliothèque" : "Mes ressources"} description="Partagez des ressources utiles : elles sont visibles de tous les mentorés." actions={
        <Link href={all ? "/mentor/ressources" : "/mentor/ressources?vue=toutes"} className="text-sm font-medium text-primary hover:underline">{all ? "Voir mes ressources" : "Voir toute la bibliothèque"}</Link>
      } />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <ResourceLibrary session={session} mode={all ? "browse" : "mine"} filters={filters} />
        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader><CardTitle>Publier une ressource</CardTitle></CardHeader>
          <CardContent><ResourceForm domains={domains} /></CardContent>
        </Card>
      </div>
    </>
  );
}
