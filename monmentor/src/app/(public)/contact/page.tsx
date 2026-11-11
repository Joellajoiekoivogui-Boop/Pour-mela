import type { Metadata } from "next";
import Link from "next/link";
import { ToFill } from "@/components/legal-page";

export const metadata: Metadata = { title: "Contact" };

export default function Contact() {
  return (
    <div className="mx-auto grid max-w-2xl gap-5 px-4 py-12">
      <p className="eyebrow">Nous joindre</p>
      <h1 className="text-3xl font-bold">Contact</h1>
      <p className="text-ink-2">La coordination de MonMentor répond aux jeunes, aux parents, aux mentors et aux partenaires.</p>
      <div className="card grid gap-2 p-5">
        <p><strong>E-mail :</strong> <ToFill>adresse de la coordination</ToFill></p>
        <p><strong>Téléphone / WhatsApp :</strong> <ToFill>numéro</ToFill></p>
        <p><strong>Adresse :</strong> <ToFill>adresse à Conakry</ToFill></p>
      </div>
      <p className="text-sm text-ink-2">Un problème avec un membre ? Utilisez plutôt le bouton « Signaler » sur son profil ou son message : votre signalement arrive directement à la coordination. <Link href="/charte" className="link">Lire la charte</Link></p>
    </div>
  );
}
