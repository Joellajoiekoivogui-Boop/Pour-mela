import type { Metadata } from "next";
import Link from "next/link";
import { Atom, Flag as FlagIcon, Globe, Landmark, Languages, Map, Star, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/SectionTitle";
import { DailyChallenge } from "@/components/quiz/DailyChallenge";
import { QuizStatus } from "@/components/quiz/QuizStatus";
import { Flag } from "@/components/ui/Flag";
import { challengeQuizzes } from "@/data/quizzes";
import type { QuizKind } from "@/types/content";

export const metadata: Metadata = { title: "Africa Challenge — Quiz et défis" };

const KIND: Partial<Record<QuizKind, { label: string; icon: typeof Globe; cls: string }>> = {
  pays: { label: "Pays", icon: Globe, cls: "bg-orange-100 text-orange-700" },
  drapeaux: { label: "Drapeaux", icon: FlagIcon, cls: "bg-jaune-100 text-jaune-600" },
  histoire: { label: "Histoire", icon: Landmark, cls: "bg-orange-100 text-orange-700" },
  geographie: { label: "Géographie", icon: Map, cls: "bg-bleu-100 text-bleu-700" },
  culture: { label: "Culture", icon: Users, cls: "bg-violet-100 text-violet-700" },
  personnalites: { label: "Personnalités", icon: Star, cls: "bg-jaune-100 text-jaune-600" },
  sciences: { label: "Sciences", icon: Atom, cls: "bg-bleu-100 text-bleu-700" },
  langues: { label: "Langues", icon: Languages, cls: "bg-violet-100 text-violet-700" },
};

export default function ChallengesPage() {
  const total = challengeQuizzes.reduce((n, q) => n + q.questions.length, 0);
  return (
    <>
      <PageHeader eyebrow="Africa Challenge" title="Quiz et défis">
        {challengeQuizzes.length} défis et {total} questions, chacune avec son explication. Tu gagnes 10 XP par bonne réponse — seul ton meilleur score compte.
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <DailyChallenge />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challengeQuizzes.map((q) => {
            const k = KIND[q.kind]!;
            const I = k.icon;
            return (
              <Link key={q.slug} href={`/challenges/${q.slug}`} className="group flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-carte ring-1 ring-encre/5 transition hover:-translate-y-1 hover:ring-violet-300">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${k.cls}`}>
                    <I className="size-3" aria-hidden /> {k.label}
                  </span>
                  {q.kind === "pays" && <Flag code={q.scope} className="h-6 w-9" title="" />}
                </div>
                <h2 className="text-lg font-black group-hover:text-violet-700">{q.title}</h2>
                <p className="text-sm text-encre-doux">{q.description}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-sm font-bold text-encre-doux">{q.questions.length} questions</span>
                  <QuizStatus slug={q.slug} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
