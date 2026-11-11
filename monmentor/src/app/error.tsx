"use client";
import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-[60dvh] place-items-center px-4 text-center">
      <div className="grid justify-items-center gap-3">
        <h1 className="text-2xl font-bold">Cette page n&apos;a pas pu s&apos;afficher.</h1>
        <p className="max-w-md text-ink-2">Votre connexion a peut-être coupé, ou une erreur s&apos;est produite de notre côté. Réessayez ; si le problème continue, revenez à l&apos;accueil.</p>
        <div className="flex gap-2"><button onClick={reset} className="btn-primary">Réessayer</button><Link href="/" className="btn-ghost">Accueil</Link></div>
      </div>
    </main>
  );
}
