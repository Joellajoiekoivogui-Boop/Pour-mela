import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Charte de conduite" };

export default function Charter() {
  return (
    <LegalPage eyebrow="Cadre" title="Charte de conduite" updated="10 novembre 2026">
      <p>MonMentor met en relation des jeunes et des professionnels bénévoles. Cette charte, acceptée par chaque membre à l&apos;inscription, protège tout le monde. Tout manquement peut être signalé avec le bouton « Signaler », présent sur chaque profil, message, séance et contenu.</p>
      <h2>Pour tous</h2>
      <ul>
        <li>Les échanges se font sur MonMentor : messagerie, séances en visio, en audio ou par chat.</li>
        <li>Respect, bienveillance et confidentialité de ce qui est partagé en séance.</li>
        <li>Aucune demande d&apos;argent, de cadeau ou de service personnel, dans un sens comme dans l&apos;autre. Le mentorat est gratuit.</li>
        <li>Aucun propos ou contenu à caractère sexuel, discriminatoire, violent ou humiliant.</li>
        <li>Prévenir au moins deux heures à l&apos;avance en cas d&apos;empêchement, en annulant la séance.</li>
      </ul>
      <h2>Pour les mentors</h2>
      <ul>
        <li>Le mentor guide, il ne fait pas à la place : il aide le jeune à devenir autonome.</li>
        <li>Il ne promet ni emploi, ni admission, ni financement.</li>
        <li>Les séances en présentiel ont lieu dans un lieu public.</li>
        <li>Il accepte la vérification de son identité et de son parcours par la coordination.</li>
      </ul>
      <h2>Protection des moins de 18 ans</h2>
      <ul>
        <li>Inscription avec l&apos;accord d&apos;un parent ou tuteur, confirmé par SMS.</li>
        <li>Séances en visio uniquement, avec des mentors au badge « Vérifié·e » (entretien avec la coordination).</li>
        <li>Messagerie fermée de 22 h à 6 h ; CV jamais public.</li>
      </ul>
      <h2>En cas de manquement</h2>
      <p>La coordination examine chaque signalement sous 48 heures, et immédiatement pour un harcèlement ou une arnaque. Elle peut avertir, retirer un contenu, suspendre ou fermer un compte. Trois signalements ouverts sur une même personne suspendent son compte en attendant l&apos;examen. La personne signalée ne connaît jamais l&apos;auteur du signalement.</p>
    </LegalPage>
  );
}
