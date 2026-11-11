import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForms } from "@/components/auth-forms";
import { demoLogin } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/env";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

const DEMO_ACCOUNTS = [
  ["mariama", "Mariama", "Étudiante, mentorée"],
  ["thierno", "Thierno", "Porteur de projet, mentoré"],
  ["ibrahima", "Ibrahima", "Ingénieur IA, mentor"],
  ["fatoumata", "Fatoumata", "Entrepreneuse, mentore"],
  ["coordination", "Coordination", "Administration"],
] as const;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const { suite = "/accueil" } = await searchParams;
  if (await getCurrentUser()) redirect(suite.startsWith("/") ? suite : "/accueil");
  return (
    <div className="mx-auto grid max-w-md gap-6 px-4 py-12">
      <div className="grid gap-2">
        <p className="eyebrow">Bon retour parmi nous</p>
        <h1 className="text-2xl font-bold">Connexion</h1>
      </div>
      <div className="card p-5"><LoginForms suite={suite} /></div>
      <p className="text-center text-sm text-ink-2">Pas encore de compte ? <Link href={`/inscription?suite=${encodeURIComponent(suite)}`} className="link">Créer mon compte</Link></p>
      {DEMO_MODE && (
        <section className="card grid gap-3 border-dashed p-5">
          <h2 className="font-semibold">Jury, visiteur ? Essayez un compte de démonstration</h2>
          <p className="text-xs text-ink-3">Personnes et organisations fictives. Les données de démonstration sont remises à zéro chaque nuit.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map(([key, name, role]) => (
              <form key={key} action={demoLogin}>
                <input type="hidden" name="account" value={key} />
                <button className="btn-ghost w-full flex-col items-start !gap-0 text-left"><span>{name}</span><span className="text-xs font-normal text-ink-3">{role}</span></button>
              </form>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
