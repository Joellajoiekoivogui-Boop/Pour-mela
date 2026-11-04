import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { UsersTable } from "@/components/admin/users-table";
import { Alert } from "@/components/ui/misc";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Administrateurs" };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; page?: string }> }) {
  const session = await requireRole(["admin", "super_admin"]);
  return (
    <>
      <PageHeader title="Administrateurs" description="Les rôles d'administration sont attribués uniquement par un super administrateur, jamais à l'inscription." />
      <Alert tone="info" className="mb-4">Pour nommer un nouvel administrateur, recherchez son compte dans <Link href="/admin/utilisateurs" className="font-medium underline">Utilisateurs</Link> et changez son rôle. Chaque changement est inscrit au journal.</Alert>
      <UsersTable session={session} basePath="/admin/administrateurs" params={await searchParams} roles={["admin", "super_admin"]} />
    </>
  );
}
