import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsForms } from "@/components/account/settings-forms";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Paramètres" };

export default async function Page() {
  const { user } = await requireRole(["mentor"]);
  return (
    <>
      <PageHeader title="Paramètres" description="Sécurité et préférences de votre compte." />
      <SettingsForms email={user.email ?? ""} canDelete />
    </>
  );
}
