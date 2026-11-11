import type { Metadata } from "next";
import { LegalPage, ToFill } from "@/components/legal-page";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalNotice() {
  return (
    <LegalPage eyebrow="Cadre" title="Mentions légales" updated="10 novembre 2026">
      <h2>Éditeur</h2>
      <p><ToFill>raison sociale ou nom de l&apos;association, forme juridique, numéro d&apos;immatriculation (RCCM ou équivalent), adresse du siège</ToFill></p>
      <h2>Directeur de la publication</h2>
      <p><ToFill>nom et fonction</ToFill></p>
      <h2>Contact</h2>
      <p><ToFill>adresse e-mail et téléphone de la coordination</ToFill></p>
      <h2>Hébergement</h2>
      <p><ToFill>nom, adresse et site de l&apos;hébergeur de l&apos;application et de la base de données</ToFill></p>
      <h2>Origine du projet</h2>
      <p>MonMentor est né au hackathon « Talents connect » du Salon international du livre de jeunesse de Conakry (10ᵉ édition), pendant le Mois du Numérique 2026.</p>
    </LegalPage>
  );
}
