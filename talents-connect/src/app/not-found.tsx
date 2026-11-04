import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo />
      <p className="mt-10 text-sm font-semibold text-primary">Erreur 404</p>
      <h1 className="mt-2 text-2xl font-semibold text-navy">Page introuvable</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">Cette page n&apos;existe pas, ou vous n&apos;avez pas l&apos;autorisation de la consulter.</p>
      <div className="mt-6 flex gap-2"><ButtonLink href="/">Accueil</ButtonLink><ButtonLink href="/espace" variant="secondary">Mon espace</ButtonLink></div>
    </div>
  );
}
