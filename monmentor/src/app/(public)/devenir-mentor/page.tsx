import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Devenir mentor", description: "Une heure par semaine, depuis chez vous : partagez votre expérience avec un jeune talent." };

export default function BecomeMentor() {
  return (
    <div className="mx-auto grid max-w-4xl gap-10 px-4 py-12">
      <header className="grid gap-3">
        <p className="eyebrow">Devenir mentor</p>
        <h1 className="text-3xl font-bold sm:text-4xl">Une heure par semaine peut changer une trajectoire</h1>
        <p className="max-w-2xl text-lg text-ink-2">Entrepreneurs, cadres, experts, enseignants, en Guinée ou dans la diaspora : vous choisissez vos domaines, vos créneaux et le nombre de jeunes que vous accompagnez.</p>
        <div className="flex flex-wrap gap-3"><Link href="/inscription?role=mentor" className="btn-primary">Je deviens mentor</Link><Link href="/charte" className="btn-ghost">Lire la charte</Link></div>
      </header>
      <section className="grid gap-4">
        <h2 className="text-xl font-bold">Comment ça se passe</h2>
        <ol className="grid gap-3 md:grid-cols-2">
          {[
            ["Inscription en 2 minutes", "Votre fonction, votre domaine principal et votre profil LinkedIn."],
            ["Vérification", "La coordination vérifie votre identité et votre parcours, puis vous rencontre 20 minutes. Votre profil devient alors visible."],
            ["Vos règles", "Vos créneaux, vos formats (visio, audio, chat, présentiel), et de 1 à 10 mentorés en parallèle."],
            ["Des outils simples", "Rappels automatiques, compte rendu de séance en 2 minutes, suivi des objectifs, validation des compétences et recommandations pour le CV de vos mentorés."],
          ].map(([t, d], i) => (
            <li key={t} className="card flex gap-4 p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft font-bold text-accent">{i + 1}</span><span><strong className="block">{t}</strong><span className="text-sm text-ink-2">{d}</span></span></li>
          ))}
        </ol>
      </section>
      <section className="grid gap-3 rounded-2xl bg-accent-soft p-6">
        <h2 className="text-xl font-bold">Ce que vous y gagnez</h2>
        <ul className="grid gap-2 text-ink-2">
          <li>· Un <strong className="text-ink">profil d&apos;impact</strong> partageable sur LinkedIn : jeunes accompagnés, heures données, ressources publiées.</li>
          <li>· Le plaisir de transmettre, et un regard neuf sur votre métier.</li>
          <li>· Une communauté de professionnels engagés.</li>
        </ul>
      </section>
    </div>
  );
}
