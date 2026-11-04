import type { Metadata } from "next";
import { PageHero, Prose } from "@/components/public/section";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <>
      <PageHero title="Politique de confidentialité" description="Version du 4 novembre 2026 — document de travail à faire valider avant une mise en production publique." />
      <Prose>
        <h2>Données collectées</h2>
        <ul>
          <li><strong>Compte</strong> : e-mail, nom, prénom, mot de passe (chiffré par Supabase Auth, jamais visible).</li>
          <li><strong>Profil</strong> : photo, localisation, formation, compétences, objectifs, parcours professionnel (mentors).</li>
          <li><strong>Activité</strong> : demandes, séances, messages, objectifs, évaluations, notifications.</li>
        </ul>
        <h2>Qui voit quoi ?</h2>
        <ul>
          <li>Le profil d&apos;un <strong>mentor vérifié</strong> est public (annuaire).</li>
          <li>Le profil d&apos;un <strong>mentoré</strong> n&apos;est visible que des mentors à qui il a envoyé une demande, et de l&apos;administration.</li>
          <li>Les <strong>messages</strong> ne sont lisibles que par les deux participants du mentorat — l&apos;administration n&apos;y a pas accès.</li>
          <li>Votre adresse e-mail n&apos;est visible que de vous et de l&apos;administration.</li>
        </ul>
        <p>Ces règles sont appliquées directement dans la base de données (Row Level Security), et pas seulement dans l&apos;interface.</p>
        <h2>Assistant IA</h2>
        <p>Lorsque vous utilisez l&apos;assistant, votre question est transmise au fournisseur de modèle de langage configuré par la plateforme, sans votre nom ni votre e-mail. Évitez d&apos;y saisir des informations sensibles.</p>
        <h2>Hébergement</h2>
        <p>Application hébergée sur Vercel, données sur Supabase (PostgreSQL). Les fichiers (photos, documents) sont stockés dans Supabase Storage.</p>
        <h2>Vos droits</h2>
        <p>Vous pouvez modifier votre profil à tout moment et demander la suppression de votre compte depuis vos paramètres ; la suppression efface vos données associées.</p>
      </Prose>
    </>
  );
}
