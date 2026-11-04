import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ResourceLibrary } from "@/components/resources/library";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Bibliothèque" };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; domaine?: string; type?: string }> }) {
  const session = await requireRole(["mentee"]);
  return (
    <>
      <PageHeader title="Bibliothèque de ressources" description="Guides, documents, vidéos et liens partagés par les mentors et l'équipe." />
      <ResourceLibrary session={session} mode="browse" filters={await searchParams} />
    </>
  );
}
