import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/SectionTitle";
import { AuthForm } from "@/components/dashboard/AuthForm";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <>
      <PageHeader eyebrow="Compte" title="Connexion">
        Un compte permet de retrouver la progression de l&apos;enfant sur plusieurs appareils. Il est créé par un adulte responsable.
      </PageHeader>
      <div className="mx-auto max-w-lg px-4 py-10">
        <AuthForm />
      </div>
    </>
  );
}
