import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/forms/auth-card";
import { SignUpForm } from "@/components/forms/auth-forms";
import { getSession } from "@/lib/auth";
import { homeForRole } from "@/lib/labels";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ profil?: string }> }) {
  const { profil } = await searchParams;
  const session = await getSession();
  if (session) redirect(homeForRole(session.profile.role));
  const defaultRole = profil === "mentor" ? "mentor" : profil === "mentore" ? "mentee" : undefined;
  return (
    <AuthCard title="Créer un compte" description="Gratuit, en deux minutes." footer={<>Déjà inscrit ? <Link href="/connexion" className="font-medium text-primary hover:underline">Se connecter</Link></>}>
      <SignUpForm defaultRole={defaultRole} />
    </AuthCard>
  );
}
