import type { Metadata } from "next";
import { PageHero } from "@/components/public/section";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WEIGHTS } from "@/lib/matching/engine";

export const metadata: Metadata = { title: "Comment ça marche" };

const MENTEE_STEPS = [
  ["Inscription", "Choisissez « Je souhaite être accompagné » et confirmez votre adresse e-mail."],
  ["Profil", "Formation, niveau d'études, compétences actuelles et recherchées, domaines d'intérêt, objectifs."],
  ["Recommandations", "Le moteur classe les mentors vérifiés et affiche le détail de chaque score."],
  ["Demande", "Expliquez votre motivation et vos objectifs. Le mentor accepte ou décline."],
  ["Mentorat", "Un espace de suivi s'ouvre : messagerie privée, réservation de séances, objectifs partagés."],
  ["Progression", "Cochez les étapes accomplies : la progression est calculée sur ce qui est réellement fait."],
];
const MENTOR_STEPS = [
  ["Inscription", "Choisissez « Je souhaite devenir mentor » et complétez votre parcours."],
  ["Vérification", "L'équipe valide votre profil : il devient alors visible des mentorés."],
  ["Disponibilités", "Publiez des créneaux (présentiel, visio, audio, écrit) à l'heure de Conakry."],
  ["Accompagnement", "Acceptez les demandes, confirmez les séances, commentez les objectifs, partagez des ressources."],
];
const CRITERIA: [keyof typeof WEIGHTS, string, string][] = [
  ["domains", "Domaines d'expertise", "Les domaines du mentor couvrent-ils ceux que vous recherchez ?"],
  ["skills", "Compétences recherchées", "Le mentor transmet-il les compétences que vous voulez acquérir ? (proximité partielle si même domaine)"],
  ["goals", "Objectifs", "Mots-clés communs entre vos objectifs et le parcours du mentor (poste, expériences, présentation)."],
  ["availability", "Disponibilités", "Créneaux libres à venir et capacité d'accueil du mentor."],
  ["experience", "Expérience", "Années d'expérience professionnelle."],
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero eyebrow="Fonctionnement" title="Comment ça marche" description="Du premier profil à l'objectif atteint, voici le parcours sur TALENTS CONNECT." />
      <div className="mx-auto max-w-5xl space-y-16 px-4 py-14 sm:px-6">
        <section>
          <h2 className="text-xl font-semibold text-navy">Pour les jeunes talents</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MENTEE_STEPS.map(([t, d], i) => (
              <li key={t}><Card className="h-full p-5"><p className="text-xs font-semibold text-primary">Étape {i + 1}</p><p className="mt-1 font-semibold text-navy">{t}</p><p className="mt-1.5 text-sm text-muted">{d}</p></Card></li>
            ))}
          </ol>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-navy">Le score de compatibilité, critère par critère</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted">Le score est calculé par un algorithme transparent, sans intelligence artificielle : il fonctionne toujours, et chaque point est justifié sur la carte du mentor.</p>
          <div className="mt-6 overflow-hidden rounded-[var(--radius-card)] border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-subtle text-slate-600"><tr><th className="px-4 py-3 font-medium">Critère</th><th className="hidden px-4 py-3 font-medium sm:table-cell">Ce qui est évalué</th><th className="px-4 py-3 text-right font-medium">Points</th></tr></thead>
              <tbody className="divide-y divide-border bg-surface">
                {CRITERIA.map(([k, t, d]) => (
                  <tr key={k}><td className="px-4 py-3 font-medium text-navy">{t}<p className="mt-1 text-xs font-normal text-muted sm:hidden">{d}</p></td><td className="hidden px-4 py-3 text-muted sm:table-cell">{d}</td><td className="px-4 py-3 text-right font-semibold">{WEIGHTS[k]}</td></tr>
                ))}
                <tr className="bg-subtle/60"><td className="px-4 py-3 font-semibold" colSpan={1}>Total</td><td className="hidden sm:table-cell" /><td className="px-4 py-3 text-right font-semibold">100</td></tr>
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-navy">Pour les mentors</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MENTOR_STEPS.map(([t, d], i) => (
              <li key={t}><Card className="h-full p-5"><p className="text-xs font-semibold text-violet">Étape {i + 1}</p><p className="mt-1 font-semibold text-navy">{t}</p><p className="mt-1.5 text-sm text-muted">{d}</p></Card></li>
            ))}
          </ol>
        </section>
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink href="/inscription?profil=mentore">Trouver un mentor</ButtonLink>
          <ButtonLink href="/inscription?profil=mentor" variant="secondary">Devenir mentor</ButtonLink>
        </div>
      </div>
    </>
  );
}
