import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const COLS = [
  {
    title: "Découvrir",
    links: [
      { href: "/explorer", label: "Africa Explorer" },
      { href: "/guinee", label: "Espace Guinée" },
      { href: "/univers", label: "Univers de découverte" },
      { href: "/bibliotheque", label: "Bibliothèque" },
    ],
  },
  {
    title: "Apprendre",
    links: [
      { href: "/histoires", label: "StoryVerse" },
      { href: "/challenges", label: "Africa Challenge" },
      { href: "/assistant", label: "LUMO, l'assistant" },
      { href: "/passeport", label: "Mon passeport africain" },
    ],
  },
  {
    title: "Adultes",
    links: [
      { href: "/parents", label: "Parents et enseignants" },
      { href: "/connexion", label: "Créer un compte" },
      { href: "/a-propos", label: "Nos sources et notre charte" },
      { href: "/admin", label: "Administration" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 bg-encre text-white">
      <div className="bande-kente h-2" aria-hidden />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="rounded-2xl bg-white/95 p-3 w-fit">
            <Logo />
          </div>
          <p className="mt-4 font-bold text-jaune-300">Découvre l&apos;Afrique, comprends le monde, imagine demain.</p>
          <p className="mt-2 text-sm text-white/70">Une plateforme éducative née en Guinée pour donner aux enfants le goût de la lecture.</p>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <h2 className="mb-3 font-black uppercase tracking-wider text-orange-200">{col.title}</h2>
            <ul className="grid gap-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/80 hover:text-white hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-white/60 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} CONTEVERSE — Projet Hackathon Lire Demain 2026, Guinée.</p>
          <p>Cartes : Natural Earth (domaine public). Aucune publicité, aucune revente de données.</p>
        </div>
      </div>
    </footer>
  );
}
