"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold text-navy">Une erreur est survenue</h1>
      <p className="mt-2 text-sm text-muted">La page n&apos;a pas pu être chargée. Vérifiez votre connexion puis réessayez.</p>
      <Button className="mt-6" onClick={reset}>Réessayer</Button>
    </div>
  );
}
