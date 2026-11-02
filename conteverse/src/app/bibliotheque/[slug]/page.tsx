import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleAlert, Clock, Lightbulb } from "lucide-react";
import { articleBySlug, articles } from "@/data/articles";
import { categoryBySlug } from "@/data/categories";
import { Scene } from "@/components/ui/Scene";
import { Pill } from "@/components/ui/Pill";
import { EditorialNote } from "@/components/ui/EditorialNote";
import { SourceList } from "@/components/articles/SourceList";
import { RichParagraph } from "@/components/articles/RichParagraph";
import { ArticleTools } from "@/components/articles/ArticleTools";
import { ArticleFinish } from "@/components/articles/ArticleFinish";
import { ReadingTracker } from "@/components/articles/ReadingTracker";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { contentTypeLabel, difficultyLabel, scopeLabel } from "@/lib/utils/labels";
import { tone } from "@/lib/utils/colors";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = articleBySlug[slug];
  return a ? { title: a.title, description: a.intro } : {};
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = articleBySlug[slug];
  if (!a) notFound();
  const cat = categoryBySlug[a.category];
  const used = new Set<string>();
  const speech = [a.title, a.intro, ...a.sections.flatMap((s) => [s.heading, ...s.paragraphs])].join(". ");
  const related = (a.related ?? []).map((s) => articleBySlug[s]).filter(Boolean);
  const fallback = articles.filter((x) => x.category === a.category && x.slug !== a.slug).slice(0, 3);
  const recommendations = (related.length ? related : fallback).slice(0, 3);

  return (
    <article>
      <ReadingTracker />
      <header className="mx-auto max-w-3xl px-4 pt-8">
        <Link href="/bibliotheque" className="inline-flex items-center gap-1 text-sm font-bold text-encre-doux hover:text-encre">
          <ArrowLeft className="size-4" aria-hidden /> Bibliothèque
        </Link>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/univers/${cat.slug}`} className={`rounded-full px-3 py-1 text-xs font-extrabold ${tone[cat.color].solid}`}>
            {cat.short}
          </Link>
          <Pill>
            <Clock className="size-3" aria-hidden /> {a.readingMinutes} min de lecture
          </Pill>
          <Pill>{difficultyLabel[a.difficulty]}</Pill>
          <Pill>
            {a.ageMin}-{a.ageMax} ans
          </Pill>
          <Pill>{contentTypeLabel[a.contentType]}</Pill>
          <Pill>{scopeLabel(a.scope)}</Pill>
        </div>
        <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">{a.title}</h1>
        <p className="mt-4 text-xl font-semibold leading-relaxed text-encre-doux">{a.intro}</p>
        <div className="mt-6">
          <ArticleTools text={speech} path={`/bibliotheque/${a.slug}`} />
        </div>
      </header>

      <div className="mx-auto mt-8 max-w-4xl px-4">
        <div className="overflow-hidden rounded-[2rem] shadow-carte">
          <Scene name={a.scene} className="aspect-[2/1] w-full" label={`Illustration : ${a.title}`} />
        </div>
      </div>

      <div className="lecture mx-auto max-w-3xl px-4 py-10">
        {a.sections.map((s) => (
          <section key={s.heading} className="mb-10">
            <h2 className="mb-4 text-2xl font-black">{s.heading}</h2>
            <div className="grid gap-4">
              {s.paragraphs.map((p) => (
                <RichParagraph key={p.slice(0, 40)} text={p} glossary={a.glossary} used={used} />
              ))}
            </div>
            {s.didYouKnow && (
              <aside className="mt-5 flex gap-3 rounded-2xl bg-jaune-50 p-5">
                <Lightbulb className="size-6 shrink-0 text-jaune-600" aria-hidden />
                <div>
                  <p className="font-black">Le savais-tu ?</p>
                  <p className="mt-1">{s.didYouKnow}</p>
                </div>
              </aside>
            )}
            {s.uncertainty && (
              <aside className="mt-5 flex gap-3 rounded-2xl bg-bleu-50 p-5 text-bleu-700">
                <CircleAlert className="size-6 shrink-0" aria-hidden />
                <div>
                  <p className="font-black">Ce qu&apos;on ne sait pas encore</p>
                  <p className="mt-1">{s.uncertainty}</p>
                </div>
              </aside>
            )}
          </section>
        ))}

        <section className="mb-10 rounded-3xl bg-white p-6 shadow-carte ring-1 ring-encre/5" aria-labelledby="mots">
          <h2 id="mots" className="text-xl font-black">
            📖 Les mots importants
          </h2>
          <dl className="mt-4 grid gap-3">
            {a.glossary.map((g) => (
              <div key={g.word}>
                <dt className="font-extrabold text-orange-700">{g.word}</dt>
                <dd className="text-encre-doux">{g.definition}</dd>
              </div>
            ))}
          </dl>
        </section>

        <ArticleFinish slug={a.slug} title={a.title} quiz={a.quiz} />

        <div className="mt-10 grid gap-4">
          <EditorialNote status={a.status} note={a.validationNote} />
          <SourceList sources={a.sources} />
        </div>
      </div>

      {recommendations.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-6" aria-labelledby="reco">
          <h2 id="reco" className="text-2xl font-black">
            Pour continuer ta lecture
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((r) => (
              <ArticleCard key={r.slug} article={r} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
