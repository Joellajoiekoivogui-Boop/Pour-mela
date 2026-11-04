import type { Metadata } from "next";
import { PageHero, Prose } from "@/components/public/section";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function TermsPage() {
  return (
    <>
      <PageHero title="Conditions d'utilisation" description="Version du 4 novembre 2026 — document de travail à faire valider juridiquement avant une mise en production publique." />
      <Prose>
        <h2>1. Objet</h2>
        <p>TALENTS CONNECT est une plateforme de mise en relation entre des jeunes (« mentorés ») et des professionnels bénévoles (« mentors »). Elle fournit des outils d&apos;organisation : profils, demandes, séances, messagerie, objectifs, ressources et opportunités.</p>
        <h2>2. Inscription</h2>
        <ul>
          <li>Les informations fournies doivent être exactes. Un compte est personnel.</li>
          <li>Les mineurs doivent disposer de l&apos;accord de leur représentant légal.</li>
          <li>Les profils mentors sont soumis à vérification avant d&apos;être visibles.</li>
        </ul>
        <h2>3. Comportement attendu</h2>
        <ul>
          <li>Respect, bienveillance et confidentialité des échanges.</li>
          <li>Aucune sollicitation commerciale, aucun contenu illicite, haineux ou à caractère sexuel.</li>
          <li>Le mentorat est gratuit : aucune contrepartie financière ne peut être exigée d&apos;un mentoré.</li>
        </ul>
        <h2>4. Signalement et modération</h2>
        <p>Tout utilisateur peut signaler un profil ou un contenu. L&apos;administration peut suspendre un compte en cas de manquement.</p>
        <h2>5. Assistant IA</h2>
        <p>Les réponses de l&apos;assistant sont des suggestions générales. Elles ne constituent ni un conseil juridique, ni une promesse d&apos;emploi, et doivent être vérifiées. L&apos;assistant n&apos;a pas accès à vos conversations privées.</p>
        <h2>6. Responsabilité</h2>
        <p>TALENTS CONNECT met en relation et fournit des outils ; les conseils échangés relèvent de la responsabilité de leurs auteurs. Les opportunités publiées renvoient vers leurs organisateurs.</p>
        <h2>7. Contact</h2>
        <p>Pour toute question, utilisez la fonction de signalement ou contactez l&apos;équipe organisatrice du programme.</p>
      </Prose>
    </>
  );
}
