import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth-forms";
import { readVerifiedPhone } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Créer mon compte", robots: { index: false } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ role?: string; suite?: string }> }) {
  const sp = await searchParams;
  if (await getCurrentUser()) redirect("/accueil");
  return (
    <div className="mx-auto grid max-w-2xl gap-6 px-4 py-12">
      <div className="grid gap-2">
        <p className="eyebrow">Gratuit pour les jeunes</p>
        <h1 className="text-2xl font-bold">Rejoindre MonMentor</h1>
        <p className="text-ink-2">Une minute suffit. Vous pourrez compléter votre profil ensuite.</p>
      </div>
      <div className="card p-5 sm:p-6">
        <SignupForm initialRole={sp.role === "mentor" ? "MENTOR" : "MENTEE"} suite={sp.suite ?? "/accueil"} verifiedPhone={await readVerifiedPhone()} />
      </div>
      <p className="text-center text-sm text-ink-2">Déjà membre ? <Link href="/connexion" className="link">Se connecter</Link></p>
    </div>
  );
}
