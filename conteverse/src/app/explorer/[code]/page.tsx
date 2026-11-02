import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Coins, Gamepad2, Landmark, Languages, Leaf, MapPin, Microscope, Sparkles, Star, Users } from "lucide-react";
import type { ReactNode } from "react";
import { countries, countryByCode, isCountryCode } from "@/data/countries";
import { articleBySlug } from "@/data/articles";
import { Flag } from "@/components/ui/Flag";
import { ButtonLink } from "@/components/ui/Button";
import { EditorialNote } from "@/components/ui/EditorialNote";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { DiscoverOnView } from "@/components/explorer/DiscoverOnView";
import { SourceList } from "@/components/articles/SourceList";

export function generateStaticParams() {
  return countries.map((c) => ({ code: c.code.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const up = code.toUpperCase();
  return isCountryCode(up) ? { title: `${countryByCode[up].name} — fiche pays` } : {};
}

function Block({ icon, title, items, className = "" }: { icon: ReactNode; title: string; items: string[]; className?: string }) {
  return (
    <section className={`rounded-3xl bg-white p-6 shadow-carte ring-1 ring-encre/5 ${className}`}>
      <h2 className="flex items-center gap-2 text-xl font-black">
        {icon} {title}
      </h2>
      <ul className="mt-3 grid gap-2">
        {items.map((t) => (
          <li key={t} className="flex gap-2 text-encre-doux">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-400" aria-hidden />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function CountryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const up = code.toUpperCase();
  if (!isCountryCode(up)) notFound();
  const c = countryByCode[up];
  const related = c.articles.map((s) => articleBySlug[s]).filter(Boolean);

  return (
    <>
      <DiscoverOnView code={c.code} />
      <header className="motif border-b border-encre/5">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Link href="/explorer" className="inline-flex items-center gap-1 text-sm font-bold text-encre-doux hover:text-encre">
            <ArrowLeft className="size-4" aria-hidden /> Retour à la carte
          </Link>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
            <Flag code={c.code} className="h-20 w-32 shrink-0" title={`Drapeau : ${c.name}`} />
            <div>
              <h1 className="text-4xl font-black sm:text-5xl">{c.name}</h1>
              <p className="mt-2 text-encre-doux">{c.flagNote}</p>
            </div>
          </div>
          <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Capitale", c.capital],
              ["Population", c.population],
              ["Monnaie", c.currency],
              ["Langue officielle", c.officialLanguage],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white p-4 shadow-carte">
                <dt className="text-xs font-extrabold uppercase tracking-wider text-orange-600">{k}</dt>
                <dd className="mt-1 font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-10 lg:grid-cols-2">
        <section className="rounded-3xl bg-bleu-50 p-6 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-xl font-black text-bleu-700">
            <MapPin className="size-5" aria-hidden /> Où se trouve ce pays ?
          </h2>
          <p className="mt-2 text-lg">{c.location}</p>
          {c.motto && <p className="mt-2 text-sm font-bold text-bleu-700">Devise : « {c.motto} »</p>}
        </section>

        {c.independence && (
          <section className="rounded-3xl bg-orange-500 p-6 text-white lg:col-span-2">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-orange-100">Indépendance</h2>
            <p className="mt-1 text-3xl font-black">{c.independence.date}</p>
            <p className="mt-2 text-lg text-white/90">{c.independence.text}</p>
          </section>
        )}

        <Block icon={<Landmark className="size-5 text-orange-600" aria-hidden />} title="Histoire" items={c.history} />
        <Block icon={<Languages className="size-5 text-violet-600" aria-hidden />} title="Langues" items={c.languages} />
        <Block icon={<Users className="size-5 text-violet-600" aria-hidden />} title="Cultures et traditions" items={c.cultures} />
        <section className="rounded-3xl bg-white p-6 shadow-carte ring-1 ring-encre/5">
          <h2 className="flex items-center gap-2 text-xl font-black">
            <Star className="size-5 text-jaune-600" aria-hidden /> Personnalités
          </h2>
          <ul className="mt-3 grid gap-3">
            {c.personalities.map((p) => (
              <li key={p.name}>
                <p className="font-extrabold">{p.name}</p>
                <p className="text-sm text-encre-doux">{p.role}</p>
              </li>
            ))}
          </ul>
        </section>
        <Block icon={<Landmark className="size-5 text-jaune-600" aria-hidden />} title="Patrimoine" items={c.heritage} />
        <Block icon={<Leaf className="size-5 text-vert-600" aria-hidden />} title="Nature et environnement" items={c.nature} />
        <Block icon={<Coins className="size-5 text-vert-600" aria-hidden />} title="Économie et activités" items={c.economy} />
        <Block icon={<Microscope className="size-5 text-bleu-600" aria-hidden />} title="Sciences et innovations" items={c.sciences} />

        <section className="flex items-start gap-4 rounded-3xl bg-jaune-50 p-6 lg:col-span-2">
          <Sparkles className="size-8 shrink-0 text-jaune-600" aria-hidden />
          <div>
            <h2 className="font-black">Le savais-tu ?</h2>
            <p className="mt-1 text-lg">{c.funFact}</p>
          </div>
        </section>

        <section className="rounded-3xl bg-violet-500 p-6 text-white lg:col-span-2 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h2 className="text-2xl font-black">Quiz : {c.name}</h2>
            <p className="mt-1 text-white/85">Teste ce que tu viens d&apos;apprendre et gagne des XP.</p>
          </div>
          <ButtonLink href={`/challenges/${c.quizSlug}`} variant="secondary" className="mt-4 sm:mt-0">
            <Gamepad2 className="size-5" aria-hidden /> Lancer le quiz
          </ButtonLink>
        </section>

        {related.length > 0 && (
          <section className="lg:col-span-2">
            <h2 className="flex items-center gap-2 text-2xl font-black">
              <BookOpen className="size-6 text-orange-600" aria-hidden /> À lire sur ce pays
            </h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-4 lg:col-span-2">
          <EditorialNote status={c.status} note={c.validationNote} />
          <SourceList sources={c.sources} />
          {c.code === "GN" && (
            <ButtonLink href="/guinee" className="w-fit">
              Aller plus loin dans l&apos;espace Guinée
            </ButtonLink>
          )}
        </div>
      </div>
    </>
  );
}
