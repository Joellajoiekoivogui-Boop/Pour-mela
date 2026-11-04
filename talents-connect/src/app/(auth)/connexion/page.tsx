import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/forms/auth-card";
import { SignInForm } from "@/components/forms/auth-forms";
import { Alert } from "@/components/ui/misc";
import { getSession } from "@/lib/auth";
import { homeForRole } from "@/lib/labels";

export const metadata: Metadata = { title: "Connexion" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; erreur?: string }> }) {
  const { next, erreur } = await searchParams;
  const session = await getSession();
  if (session) redirect(homeForRole(session.profile.role));
  return (
    <AuthCard title="Connexion" description="Heureux de vous revoir sur TALENTS CONNECT." footer={<>Pas encore de compte ? <Link href="/inscription" className="font-medium text-primary hover:underline">Créer un compte</Link></>}>
      {erreur === "lien" && <Alert tone="warning" className="mb-4">Ce lien est invalide ou a expiré. Connectez-vous ou demandez un nouveau lien.</Alert>}
      <SignInForm next={next} />
    </AuthCard>
  );
}
