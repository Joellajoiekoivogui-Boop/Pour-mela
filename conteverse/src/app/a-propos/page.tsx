import type { Metadata } from "next";
import { BadgeCheck, BookOpen, HeartHandshake, Languages, Scale, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/SectionTitle";
import { articles } from "@/data/articles";

export const metadata: Metadata = { title: "Notre charte éditoriale et nos sources" };

const RULES = [
  { icon: BadgeCheck, title: "Aucun fait inventé", text: "Pas de date, de personnalité, de tradition ou de citation inventée. Chaque article indique ses sources." },
  { icon: BookOpen, title: "Contes ≠ histoire", text: "Les contes, légendes et épopées sont toujours signalés comme tels, distinctement des faits historiques." },
  { icon: Scale, title: "Les incertitudes sont dites", text: "Quand les historiens débattent, l'encadré « Ce qu'on ne sait pas encore » l'explique aux enfants." },
  { icon: HeartHandshake, title: "Respect des communautés", text: "Aucune communauté n'est présentée comme un bloc homogène. Les textes sur les cultures sont relus avec des représentants concernés." },
  { icon: Languages, title: "Langues vérifiées", text: "Les mots en langues guinéennes et africaines sont validés par des locuteurs compétents avant publication officielle." },
  { icon: ShieldCheck, title: "Droits respectés", text: "Les histoires de StoryVerse sont des créations originales. Les contes, textes et médias protégés ne sont publiés qu'avec autorisation." },
];

export default function AboutPage() {
  const toValidate = articles.filter((a) => a.status === "a-valider");
  const allSources = Array.from(new Map(articles.flatMap((a) => a.sources).map((s) => [s.title + s.publisher, s])).values());
  return (
    <>
      <PageHeader eyebrow="Fiabilité" title="Notre charte éditoriale">
        CONTEVERSE veut être une plateforme éducative de confiance. Voici les règles que nous suivons.
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RULES.map(({ icon: I, title, text }) => (
            <div key={title} className="rounded-3xl bg-white p-6 shadow-carte ring-1 ring-encre/5">
              <I className="size-7 text-vert-600" aria-hidden />
              <h2 className="mt-3 font-black">{title}</h2>
              <p className="mt-1 text-sm text-encre-doux">{text}</p>
            </div>
          ))}
        </div>
        <section className="mt-12 rounded-3xl bg-jaune-50 p-6">
          <h2 className="text-xl font-black">Contenus de démonstration encore à valider</h2>
          <p className="mt-1 text-sm text-encre-doux">Ce MVP a été préparé pour le Hackathon Lire Demain 2026. Les contenus marqués « à valider » doivent être relus par un comité pédagogique et des spécialistes guinéens.</p>
          <ul className="mt-3 grid gap-2 text-sm">
            {toValidate.map((a) => (
              <li key={a.slug}>
                <strong>{a.title}</strong> — {a.validationNote}
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-12">
          <h2 className="text-2xl font-black">Sources utilisées</h2>
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {allSources.map((s) => (
              <li key={s.title + s.publisher} className="rounded-2xl bg-white p-3 shadow-carte">
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-bold text-bleu-700 hover:underline">
                    {s.title}
                  </a>
                ) : (
                  <span className="font-bold">{s.title}</span>
                )}
                {s.publisher && <span className="text-encre-doux"> — {s.publisher}</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
