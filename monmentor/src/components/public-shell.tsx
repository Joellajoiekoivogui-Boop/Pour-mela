import Link from "next/link";
import { Logo } from "./logo";
import { getCurrentUser } from "@/lib/auth";

export async function PublicHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Logo />
        <nav aria-label="Navigation principale" className="ml-auto flex items-center gap-1 text-sm">
          <Link href="/mentors" className="hidden rounded-lg px-3 py-2 font-medium text-ink-2 hover:bg-surface-2 hover:text-ink sm:inline-flex">Mentors</Link>
          <Link href="/programmes" className="hidden rounded-lg px-3 py-2 font-medium text-ink-2 hover:bg-surface-2 hover:text-ink sm:inline-flex">Programmes</Link>
          <Link href="/devenir-mentor" className="hidden rounded-lg px-3 py-2 font-medium text-ink-2 hover:bg-surface-2 hover:text-ink md:inline-flex">Devenir mentor</Link>
          {user ? (
            <Link href="/accueil" className="btn-dark btn-sm">Mon espace</Link>
          ) : (
            <>
              <Link href="/connexion" className="rounded-lg px-3 py-2 font-medium text-ink-2 hover:bg-surface-2 hover:text-ink">Connexion</Link>
              <Link href="/inscription" className="btn-dark btn-sm">S&apos;inscrire</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="grid content-start gap-3">
          <Logo />
          <p className="max-w-sm text-sm text-ink-2">Apprendre de ceux qui sont passés par là. Une plateforme de mentorat pour les jeunes talents de Guinée et de la diaspora.</p>
        </div>
        <nav aria-label="Découvrir" className="grid content-start gap-2 text-sm">
          <p className="font-semibold">Découvrir</p>
          <Link className="text-ink-2 hover:text-ink" href="/mentors">Les mentors</Link>
          <Link className="text-ink-2 hover:text-ink" href="/programmes">Les programmes</Link>
          <Link className="text-ink-2 hover:text-ink" href="/devenir-mentor">Devenir mentor</Link>
          <Link className="text-ink-2 hover:text-ink" href="/contact">Contact</Link>
        </nav>
        <nav aria-label="Informations légales" className="grid content-start gap-2 text-sm">
          <p className="font-semibold">Cadre</p>
          <Link className="text-ink-2 hover:text-ink" href="/charte">Charte de conduite</Link>
          <Link className="text-ink-2 hover:text-ink" href="/confidentialite">Confidentialité</Link>
          <Link className="text-ink-2 hover:text-ink" href="/conditions">Conditions d&apos;utilisation</Link>
          <Link className="text-ink-2 hover:text-ink" href="/mentions-legales">Mentions légales</Link>
        </nav>
      </div>
      <p className="border-t border-line px-4 py-4 text-center text-xs text-ink-3">
        Né au hackathon « Talents connect » · Salon international du livre de jeunesse de Conakry · Mois du Numérique 2026
      </p>
    </footer>
  );
}
