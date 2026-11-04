import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { UsersTable } from "@/components/admin/users-table";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Utilisateurs" };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; page?: string }> }) {
  const session = await requireRole(["admin", "super_admin"]);
  return (
    <>
      <PageHeader title="Utilisateurs" description="Mentors, mentorés et administrateurs : recherche, filtres, suspension et rôles." />
      <UsersTable session={session} basePath="/admin/utilisateurs" params={await searchParams} />
    </>
  );
}
