import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function Terms() {
  return (
    <LegalPage eyebrow="Cadre" title="Conditions d'utilisation" updated="10 novembre 2026">
      <h2>Le service</h2>
      <p>MonMentor est une plateforme gratuite de mise en relation entre des jeunes et des professionnels bénévoles. Elle fournit un annuaire, une recommandation de mentors, l&apos;organisation de séances, une messagerie, le suivi d&apos;objectifs, une bibliothèque de ressources, des opportunités et un CV partageable.</p>
      <h2>Inscription</h2>
      <p>L&apos;inscription demande des informations exactes et l&apos;acceptation de la <Link href="/charte" className="link">charte de conduite</Link>. Les moins de 18 ans s&apos;inscrivent avec l&apos;accord d&apos;un parent ou tuteur. Les mentors doivent être majeurs et accepter la vérification de leur identité et de leur parcours.</p>
      <h2>Responsabilités</h2>
      <p>Les mentors partagent leur expérience à titre bénévole ; leurs conseils n&apos;engagent qu&apos;eux et ne constituent pas une garantie de résultat. MonMentor vérifie les mentors avec soin mais ne peut garantir l&apos;exactitude de toutes les informations publiées par les membres. Les opportunités publiées renvoient vers des organisations tierces.</p>
      <h2>Contenus</h2>
      <p>Chaque membre reste responsable des contenus qu&apos;il publie. En publiant une ressource, le mentor autorise MonMentor à l&apos;afficher aux membres. La coordination peut retirer tout contenu contraire à la charte.</p>
      <h2>Suspension et fermeture</h2>
      <p>Un compte peut être suspendu ou fermé en cas de manquement à la charte. Vous pouvez supprimer votre compte à tout moment depuis votre profil.</p>
    </LegalPage>
  );
}
