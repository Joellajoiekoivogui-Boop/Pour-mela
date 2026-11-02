import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { categories, categoryBySlug } from "@/data/categories";
import { articlesByCategory } from "@/data/articles";
import { challengeQuizzes } from "@/data/quizzes";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { Scene } from "@/components/ui/Scene";
import { Icon } from "@/components/ui/CategoryIcon";
import { ButtonLink } from "@/components/ui/Button";
import { tone } from "@/lib/utils/colors";
import type { CategorySlug } from "@/types/content";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = categoryBySlug[slug as CategorySlug];
  return c ? { title: c.name, description: c.description } : {};
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = categoryBySlug[slug as CategorySlug];
  if (!c) notFound();
  const list = articlesByCategory(c.slug);
  const quizzes = challengeQuizzes.filter((q) => q.category === c.slug);
  const t = tone[c.color];
  return (
    <>
      <header className="relative overflow-hidden">
        <Scene name={c.scene} className="absolute inset-0 h-full w-full opacity-50" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <Link href="/univers" className="inline-flex items-center gap-1 text-sm font-bold text-encre-doux hover:text-encre">
            <ArrowLeft className="size-4" aria-hidden /> Tous les univers
          </Link>
          <span className={`mt-6 grid size-14 place-items-center rounded-2xl ${t.solid}`}>
            <Icon name={c.icon} className="size-7" />
          </span>
          <h1 className="mt-4 text-4xl font-black sm:text-5xl">{c.name}</h1>
          <p className="mt-3 max-w-2xl text-lg font-semibold text-encre-doux">{c.description}</p>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-10">
        {list.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        ) : (
          <p className="rounded-3xl bg-white p-8 text-center text-encre-doux shadow-carte">De nouvelles lectures arrivent bientôt dans cet univers.</p>
        )}
        {quizzes.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-3">
            {quizzes.map((q) => (
              <ButtonLink key={q.slug} href={`/challenges/${q.slug}`} variant="violet">
                Défi : {q.title}
              </ButtonLink>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
