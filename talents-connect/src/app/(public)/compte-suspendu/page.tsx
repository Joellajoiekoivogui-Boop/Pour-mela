import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";

export const metadata: Metadata = { title: "Compte suspendu" };

export default function SuspendedPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger"><ShieldAlert className="size-6" /></span>
      <h1 className="mt-5 text-2xl font-semibold text-navy">Compte suspendu</h1>
      <p className="mt-3 text-muted">Votre compte a été suspendu par l&apos;administration. Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez l&apos;équipe organisatrice du programme.</p>
      <form action={signOutAction} className="mt-8"><Button type="submit" variant="secondary">Se déconnecter</Button></form>
    </div>
  );
}
