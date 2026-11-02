import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import { stories, storyBySlug } from "@/data/stories";
import { StoryPlayer } from "@/components/stories/StoryPlayer";
import { SourceList } from "@/components/articles/SourceList";
import { genreLabel } from "@/lib/utils/labels";

export function generateStaticParams() {
  return stories.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = storyBySlug[slug];
  return s ? { title: s.title, description: s.summary } : {};
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = storyBySlug[slug];
  if (!s) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/histoires" className="inline-flex items-center gap-1 text-sm font-bold text-encre-doux hover:text-encre">
        <ArrowLeft className="size-4" aria-hidden /> StoryVerse
      </Link>
      <p className="mt-6 text-sm font-extrabold uppercase tracking-widest text-violet-600">{genreLabel[s.genre]}</p>
      <h1 className="mt-1 text-4xl font-black leading-tight sm:text-5xl">{s.title}</h1>
      <p className="mt-3 text-lg text-encre-doux">{s.summary}</p>
      <p className="my-6 flex gap-3 rounded-2xl bg-bleu-50 p-4 text-sm text-bleu-700" role="note">
        <Info className="size-5 shrink-0" aria-hidden /> {s.disclaimer}
      </p>
      <StoryPlayer story={s} />
      <p className="mt-8 text-sm text-encre-doux">{s.credits}</p>
      {s.sources && (
        <div className="mt-4">
          <SourceList sources={s.sources} />
        </div>
      )}
    </div>
  );
}
