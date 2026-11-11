import type { Metadata } from "next";
import { LegalPage, ToFill } from "@/components/legal-page";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function Privacy() {
  return (
    <LegalPage eyebrow="Vos données" title="Politique de confidentialité" updated="10 novembre 2026">
      <p>Cette politique décrit les données que MonMentor traite, pourquoi, et comment exercer vos droits. Elle s&apos;applique dans le cadre de la loi guinéenne L/2016/037/AN relative à la cybersécurité et à la protection des données à caractère personnel, et du Règlement général sur la protection des données (RGPD) pour les membres résidant dans l&apos;Union européenne.</p>
      <h2>Responsable du traitement</h2>
      <p><ToFill>nom de la structure qui porte MonMentor, adresse, contact du référent données</ToFill></p>
      <h2>Données traitées et finalités</h2>
      <ul>
        <li><strong>Compte</strong> : nom, téléphone et/ou e-mail, ville, pays, date de naissance, mot de passe chiffré. Finalité : créer et sécuriser votre compte, appliquer les règles de protection des mineurs.</li>
        <li><strong>Profil</strong> : besoin, domaines, situation ; pour les mentors, fonction, compétences, langues, créneaux, justificatifs de vérification. Finalité : recommander des mentors et vérifier leur sérieux.</li>
        <li><strong>Accompagnement</strong> : séances, comptes rendus, avis, objectifs, messages. Finalité : organiser et suivre le mentorat.</li>
        <li><strong>CV</strong> : contenu que vous choisissez d&apos;afficher. Il est privé par défaut ; vous décidez de le rendre accessible par lien ou public.</li>
        <li><strong>Accord parental</strong> : nom et téléphone du parent ou tuteur d&apos;un membre de moins de 18 ans.</li>
        <li><strong>Sécurité</strong> : journaux de connexion et compteurs anti-abus, signalements.</li>
      </ul>
      <h2>Analyse du besoin par intelligence artificielle</h2>
      <p>Lorsque la fonction est activée, le texte de votre besoin est transmis à un fournisseur de modèle de langue pour en extraire les domaines et compétences. Seul ce texte est transmis, sans votre nom ni vos coordonnées. Sans cette fonction, l&apos;analyse se fait par mots-clés sur nos serveurs. <ToFill>fournisseur retenu et conditions de conservation</ToFill></p>
      <h2>Destinataires</h2>
      <p>Vos mentors ou mentorés voient les informations utiles à l&apos;accompagnement. La coordination accède aux données nécessaires à la vérification et à la modération. Les messages de rappel transitent par nos prestataires d&apos;envoi (WhatsApp, SMS, e-mail). Aucune donnée n&apos;est vendue.</p>
      <h2>Durées de conservation</h2>
      <ul>
        <li>Compte et accompagnement : tant que le compte est actif, puis suppression à votre demande ou après 3 ans d&apos;inactivité.</li>
        <li>Justificatifs de vérification des mentors : effacés dès la décision de la coordination ; seul le résultat est conservé.</li>
        <li>Codes de connexion : 10 minutes.</li>
      </ul>
      <h2>Vos droits</h2>
      <p>Vous pouvez à tout moment télécharger toutes vos données et supprimer votre compte depuis « Mon profil », rubrique « Mes données ». Pour toute autre demande (rectification, opposition), écrivez à <ToFill>adresse de contact</ToFill>.</p>
    </LegalPage>
  );
}
