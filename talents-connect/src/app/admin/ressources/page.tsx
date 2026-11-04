import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ResourceForm } from "@/components/resources/resource-form";
import { ResourceLibrary } from "@/components/resources/library";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getCatalog } from "@/lib/queries";

export const metadata: Metadata = { title: "Ressources" };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; domaine?: string; type?: string }> }) {
  const session = await requireRole(["admin", "super_admin"]);
  const { domains } = await getCatalog();
  return (
    <>
      <PageHeader title="Ressources" description="Toutes les ressources de la bibliothèque, y compris masquées. Masquez ou supprimez un contenu inapproprié." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <ResourceLibrary session={session} mode="admin" filters={await searchParams} />
        <Card className="h-fit"><CardHeader><CardTitle>Publier une ressource</CardTitle></CardHeader><CardContent><ResourceForm domains={domains} /></CardContent></Card>
      </div>
    </>
  );
}
