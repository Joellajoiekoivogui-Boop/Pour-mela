import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleAlert, Gamepad2, MapPin } from "lucide-react";
import { Flag } from "@/components/ui/Flag";
import { Scene } from "@/components/ui/Scene";
import { ButtonLink } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { DiscoverOnView } from "@/components/explorer/DiscoverOnView";
import { cities, communities, languages, naturalRegions, naturalSites, timeline } from "@/data/guinee";
import { articleBySlug } from "@/data/articles";
import { countryByCode } from "@/data/countries";

export const metadata: Metadata = { title: "Espace Guinée", description: "Géographie, histoire, cultures, langues et nature de la Guinée, pour les enfants." };

const DOMAINS = [
  { title: "Musique", slugs: ["sosso-bala", "kora-balafon-djembe"] },
  { title: "Littérature", slugs: ["camara-laye-enfant-noir", "griots-oralite"] },
  { title: "Économie et agriculture", slugs: ["bauxite-guinee", "fonio-cereale"] },
  { title: "Histoire", slugs: ["independance-guinee-1958", "pourquoi-nom-guinee"] },
];

const ANCHORS = [
  ["regions", "Géographie"],
  ["histoire", "Histoire"],
  ["cultures", "Cultures"],
  ["langues", "Langues"],
  ["nature", "Nature"],
  ["domaines", "Arts, savoirs et économie"],
];

export default function GuineePage() {
  const gn = countryByCode.GN;
  return (
    <>
      <DiscoverOnView code="GN" />
      <header className="relative overflow-hidden">
        <Scene name="fouta" className="absolute inset-0 h-full w-full opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <Flag code="GN" className="h-14 w-24" title="Drapeau de la Guinée" />
          <p className="mt-6 text-sm font-extrabold uppercase tracking-widest text-orange-700">Espace spécial</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">La Guinée, point de départ de l&apos;aventure</h1>
          <p className="mt-4 max-w-2xl text-lg font-semibold text-encre-doux sm:text-xl">
            Un pays d&apos;eau, de montagnes et de forêts, de langues et de musiques, qui a choisi sa liberté en 1958. Prends ton sac d&apos;explorateur !
          </p>
          <nav aria-label="Sommaire de l'espace Guinée" className="mt-8 flex flex-wrap gap-2">
            {ANCHORS.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="rounded-full bg-white px-4 py-2 text-sm font-extrabold shadow-carte hover:bg-orange-50">
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4">
        {/* Géographie */}
        <section id="regions" className="scroll-mt-20 py-14">
          <SectionTitle eyebrow="Géographie" title="Quatre régions naturelles, huit régions administratives">
            {gn.location}
          </SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {naturalRegions.map((r) => (
              <article key={r.id} className="overflow-hidden rounded-3xl bg-white shadow-carte ring-1 ring-encre/5">
                <Scene name={r.scene} className="h-32 w-full" />
                <div className="p-5">
                  <h3 className="text-lg font-black">{r.name}</h3>
                  {r.also && <p className="text-xs font-bold text-orange-700">aussi appelée {r.also}</p>}
                  <p className="mt-2 text-sm text-encre-doux">{r.text}</p>
                  <ul className="mt-3 flex flex-wrap gap-1">
                    {cities
                      .filter((c) => c.region === r.id)
                      .map((c) => (
                        <li key={c.name} className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-700">
                          {c.name}
                        </li>
                      ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
          <h3 className="mt-10 text-2xl font-black">Les villes-régions</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cities.map((c) => (
              <article key={c.name} className="rounded-2xl bg-white p-4 shadow-carte ring-1 ring-encre/5">
                <h4 className="flex items-center gap-1 font-black">
                  <MapPin className="size-4 text-orange-600" aria-hidden /> {c.name}
                </h4>
                <p className="mt-1 text-sm text-encre-doux">{c.text}</p>
              </article>
            ))}
          </div>
          <ButtonLink href="/bibliotheque/quatre-regions-naturelles" variant="secondary" className="mt-6">
            Lire la fiche « Les quatre régions naturelles » <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
        </section>

        {/* Histoire */}
        <section id="histoire" className="scroll-mt-20 py-14">
          <SectionTitle eyebrow="Histoire" title="Les grandes étapes de l'histoire guinéenne">
            Une frise pour se repérer dans le temps. Les dates les plus anciennes viennent souvent de la tradition orale : elles sont signalées quand elles sont discutées.
          </SectionTitle>
          <ol className="relative ml-3 border-l-4 border-orange-200">
            {timeline.map((t) => (
              <li key={t.when + t.title} className="relative mb-6 ml-6">
                <span className="absolute -left-[2.15rem] top-1 size-5 rounded-full border-4 border-white bg-orange-500 shadow" aria-hidden />
                <p className="text-sm font-extrabold text-orange-700">{t.when}</p>
                <h3 className="text-lg font-black">{t.title}</h3>
                <p className="text-encre-doux">{t.text}</p>
                {t.uncertain && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-jaune-600">
                    <CircleAlert className="size-3" aria-hidden /> Date discutée par les historiens
                  </p>
                )}
              </li>
            ))}
          </ol>
          <ButtonLink href="/bibliotheque/independance-guinee-1958" className="mt-2">
            Lire : 1958, le « non » qui fit naître la Guinée <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
        </section>

        {/* Cultures */}
        <section id="cultures" className="scroll-mt-20 py-14">
          <SectionTitle eyebrow="Cultures" title="Une mosaïque de communautés">
            Chaque communauté a son histoire, ses langues et ses traditions — et, à l&apos;intérieur de chacune, les façons de vivre changent d&apos;une région, d&apos;une ville et d&apos;une famille à l&apos;autre.
          </SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map((c) => (
              <article key={c.name} className="rounded-3xl bg-violet-50 p-5">
                <h3 className="font-black text-violet-700">{c.name}</h3>
                <p className="mt-2 text-sm">{c.text}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-jaune-50 p-4 text-sm text-jaune-600">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> Ces présentations sont volontairement courtes. Elles sont en cours de relecture avec des représentants des différentes communautés.
          </p>
          <ButtonLink href="/bibliotheque/diversite-culturelle-guinee" variant="secondary" className="mt-6">
            Lire : Une Guinée, mille façons de vivre <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
        </section>

        {/* Langues */}
        <section id="langues" className="scroll-mt-20 py-14">
          <SectionTitle eyebrow="Langues" title="Le français et de nombreuses langues nationales">
            Le français est la langue officielle. Mais au marché, à la maison ou entre amis, on parle souvent plusieurs langues guinéennes.
          </SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {languages.map((l) => (
              <article key={l.name} className="rounded-2xl bg-white p-4 shadow-carte ring-1 ring-encre/5">
                <h3 className="text-lg font-black">{l.name}</h3>
                {l.also && <p className="text-xs font-bold text-violet-600">aussi : {l.also}</p>}
                <p className="mt-1 text-sm text-encre-doux">{l.where}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-white p-4 text-sm shadow-carte">
            ✍️ <strong>Le savais-tu ?</strong> L&apos;alphabet N&apos;Ko a été inventé en 1949 par le savant guinéen Solomana Kanté pour écrire les langues mandingues.
          </p>
          <ButtonLink href="/bibliotheque/langues-de-guinee" variant="secondary" className="mt-6">
            Lire : Bonjour en plusieurs langues <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
        </section>

        {/* Nature */}
        <section id="nature" className="scroll-mt-20 py-14">
          <SectionTitle eyebrow="Nature" title="Un pays d'eau, de montagnes et de forêts" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {naturalSites.map((s) => (
              <article key={s.name} className="overflow-hidden rounded-3xl bg-white shadow-carte ring-1 ring-encre/5">
                <Scene name={s.scene} className="h-28 w-full" />
                <div className="p-5">
                  <h3 className="font-black">{s.name}</h3>
                  <p className="mt-1 text-sm text-encre-doux">{s.text}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/bibliotheque/fouta-djalon-chateau-eau" variant="vert">Le Fouta-Djalon</ButtonLink>
            <ButtonLink href="/bibliotheque/mont-nimba" variant="vert">Le mont Nimba</ButtonLink>
          </div>
        </section>

        {/* Domaines */}
        <section id="domaines" className="scroll-mt-20 py-14">
          <SectionTitle eyebrow="Arts, savoirs et économie" title="Musique, littérature, personnalités, sciences…" />
          {DOMAINS.map((d) => (
            <div key={d.title} className="mb-10">
              <h3 className="mb-4 text-2xl font-black">{d.title}</h3>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {d.slugs.map((s) => (
                  <ArticleCard key={s} article={articleBySlug[s]} />
                ))}
              </div>
            </div>
          ))}
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl bg-white p-6 shadow-carte ring-1 ring-encre/5">
              <h3 className="text-xl font-black">Personnalités</h3>
              <ul className="mt-3 grid gap-3">
                {gn.personalities.map((p) => (
                  <li key={p.name}>
                    <p className="font-extrabold">{p.name}</p>
                    <p className="text-sm text-encre-doux">{p.role}</p>
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-3xl bg-bleu-50 p-6">
              <h3 className="text-xl font-black text-bleu-700">Sciences et innovations</h3>
              <ul className="mt-3 grid gap-2 text-sm">
                <li>⚡ {gn.sciences[0]}</li>
                <li>✍️ L&apos;alphabet N&apos;Ko (1949), une invention guinéenne au service des langues.</li>
                <li>📱 Le paiement mobile s&apos;est largement répandu en Guinée.</li>
                <li>🌾 Des machines à décortiquer le fonio facilitent un travail longtemps fait à la main.</li>
              </ul>
              <Link href="/univers/demain" className="mt-4 inline-block text-sm font-extrabold text-bleu-700 hover:underline">
                Explorer l&apos;univers « Afrique de demain » →
              </Link>
            </article>
          </div>
        </section>

        <section className="mb-6 rounded-[2rem] bg-orange-500 p-8 text-white sm:flex sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 className="text-3xl font-black">Deviens Ambassadeur de la Guinée</h2>
            <p className="mt-2 text-white/90">Lis deux articles sur la Guinée et réussis le quiz pour gagner le badge.</p>
          </div>
          <ButtonLink href="/challenges/quiz-guinee" variant="secondary" className="mt-6 sm:mt-0">
            <Gamepad2 className="size-5" aria-hidden /> Quiz « Champion de la Guinée »
          </ButtonLink>
        </section>
      </div>
    </>
  );
}
