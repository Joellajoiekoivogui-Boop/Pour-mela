import type { Metadata } from "next";
import { PageHero, Prose } from "@/components/public/section";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "À propos" };

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="À propos" title="Connecter les talents, transmettre les expériences" description="TALENTS CONNECT est né du programme de mentorat et du hackathon d'innovation numérique du Salon international du livre de jeunesse de Conakry, 10ᵉ édition, sur le thème « Talents Connect »." />
      <Prose>
        <h2>Le constat</h2>
        <p>De nombreux jeunes ont des ambitions, des compétences et des projets. Ce qui leur manque souvent, c&apos;est l&apos;accès à des professionnels expérimentés : quelqu&apos;un pour relire un CV, conseiller une orientation, ouvrir un réseau ou simplement partager ce qu&apos;il a appris.</p>
        <h2>Notre réponse</h2>
        <p>Une plateforme qui rend la rencontre simple et le suivi concret :</p>
        <ul>
          <li>un annuaire de mentors <strong>vérifiés</strong> par l&apos;équipe ;</li>
          <li>un moteur de matching qui <strong>explique</strong> chacune de ses recommandations ;</li>
          <li>des outils de suivi : séances, messagerie, objectifs découpés en étapes ;</li>
          <li>une bibliothèque de ressources et des opportunités (stages, bourses, concours…) publiées par l&apos;équipe.</li>
        </ul>
        <h2>Notre vision</h2>
        <p>Un écosystème où chaque jeune peut trouver un mentor, développer ses compétences et accéder à des opportunités. Pensé d&apos;abord pour la Guinée, conçu pour s&apos;étendre au reste du continent : fuseaux horaires gérés, contenus en français, interface légère pour mobile.</p>
        <h2>Nos principes</h2>
        <ul>
          <li><strong>Transparence</strong> : aucun score fictif, aucune donnée inventée. Les contenus de démonstration sont signalés comme tels.</li>
          <li><strong>Confidentialité</strong> : les échanges ne sont visibles que des participants.</li>
          <li><strong>Utilité</strong> : chaque fonctionnalité sert un parcours réel, du premier contact à l&apos;objectif atteint.</li>
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/inscription">Rejoindre la plateforme</ButtonLink>
          <ButtonLink href="/comment-ca-marche" variant="secondary">Comment ça marche</ButtonLink>
        </div>
      </Prose>
    </>
  );
}
