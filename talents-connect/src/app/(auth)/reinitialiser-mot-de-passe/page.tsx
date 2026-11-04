import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/forms/auth-card";
import { ResetPasswordForm } from "@/components/forms/auth-forms";
import { Alert } from "@/components/ui/misc";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function ResetPasswordPage() {
  const session = await getSession();
  return (
    <AuthCard title="Choisir un nouveau mot de passe">
      {session ? <ResetPasswordForm /> : (
        <Alert tone="warning">Ce lien a expiré. <Link href="/mot-de-passe-oublie" className="font-medium underline">Demandez un nouveau lien</Link>.</Alert>
      )}
    </AuthCard>
  );
}
