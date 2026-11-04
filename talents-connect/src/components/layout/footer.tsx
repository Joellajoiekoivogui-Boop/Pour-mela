import Link from "next/link";
import { Logo } from "./logo";

const COLUMNS = [
  { title: "Plateforme", links: [["/mentors", "Découvrir les mentors"], ["/domaines", "Domaines d'expertise"], ["/comment-ca-marche", "Comment ça marche"], ["/devenir-mentor", "Devenir mentor"]] },
  { title: "Compte", links: [["/inscription", "Créer un compte"], ["/connexion", "Connexion"], ["/mot-de-passe-oublie", "Mot de passe oublié"]] },
  { title: "Informations", links: [["/a-propos", "À propos"], ["/conditions", "Conditions d'utilisation"], ["/confidentialite", "Politique de confidentialité"]] },
] as const;

export function Footer() {
  return (
    <footer className="bg-navy text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Logo light />
          <p className="max-w-xs text-sm leading-relaxed text-slate-400">
            Connecter les talents, transmettre les expériences, construire les carrières de demain.
          </p>
          <p className="text-xs text-slate-500">
            Projet du programme de mentorat et hackathon d&apos;innovation numérique — Salon international du livre de jeunesse de Conakry, 10ᵉ édition.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="mb-3 text-sm font-semibold text-white">{col.title}</p>
            <ul className="space-y-2.5 text-sm">
              {col.links.map(([href, label]) => (
                <li key={href}><Link href={href} className="text-slate-400 transition-colors hover:text-white">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-slate-500 sm:px-6">© {new Date().getFullYear()} TALENTS CONNECT · Conakry, Guinée</p>
      </div>
    </footer>
  );
}
