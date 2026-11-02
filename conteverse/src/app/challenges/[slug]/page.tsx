import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { allQuizzes, quizBySlug } from "@/data/quizzes";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";

export function generateStaticParams() {
  return allQuizzes.map((q) => ({ slug: q.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const q = quizBySlug[slug];
  return q ? { title: q.title } : {};
}

export default async function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const q = quizBySlug[slug];
  if (!q) notFound();
  const back = q.kind === "pays" ? `/explorer/${q.scope.toLowerCase()}` : "/challenges";
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/challenges" className="inline-flex items-center gap-1 text-sm font-bold text-encre-doux hover:text-encre">
        <ArrowLeft className="size-4" aria-hidden /> Tous les défis
      </Link>
      <h1 className="mt-6 text-4xl font-black">{q.title}</h1>
      <p className="mt-2 text-lg text-encre-doux">{q.description}</p>
      <div className="mt-8">
        <QuizPlayer
          quizSlug={q.slug}
          title={q.title}
          questions={q.questions}
          next={[
            { href: back, label: q.kind === "pays" ? "Revoir la fiche pays" : "Autres défis" },
            { href: "/passeport", label: "Mon passeport" },
          ]}
        />
      </div>
    </div>
  );
}
