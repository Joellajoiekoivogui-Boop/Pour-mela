import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/forms/auth-card";
import { ForgotPasswordForm } from "@/components/forms/auth-forms";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Mot de passe oublié" description="Saisissez votre adresse : nous vous enverrons un lien pour choisir un nouveau mot de passe." footer={<Link href="/connexion" className="font-medium text-primary hover:underline">Retour à la connexion</Link>}>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
