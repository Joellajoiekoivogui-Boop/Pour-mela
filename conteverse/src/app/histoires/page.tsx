import type { Metadata } from "next";
import { BookOpen, GitBranch, Landmark, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/SectionTitle";
import { StoryCard } from "@/components/stories/StoryCard";
import { stories } from "@/data/stories";

export const metadata: Metadata = { title: "StoryVerse — Histoires interactives" };

const LEGEND = [
  { icon: Sparkles, title: "Conte", text: "Une histoire imaginée qui transmet une sagesse. Ce n'est pas un fait réel." },
  { icon: Landmark, title: "Épopée", text: "Un récit de la tradition orale sur des personnages qui ont existé, mêlé de merveilleux." },
  { icon: BookOpen, title: "Histoire inventée", text: "Une fiction écrite pour CONTEVERSE, inspirée de vrais lieux ou de vrais problèmes." },
  { icon: GitBranch, title: "Interactive", text: "Tu choisis ce que fait le personnage : chaque choix mène à une fin différente." },
];

export default function StoriesPage() {
  return (
    <>
      <PageHeader eyebrow="StoryVerse" title="Histoires, contes et épopées">
        Lis, écoute et choisis la suite. Chaque histoire est accompagnée d&apos;un petit quiz.
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ul className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Types d'histoires">
          {LEGEND.map(({ icon: I, title, text }) => (
            <li key={title} className="rounded-2xl bg-violet-50 p-4">
              <p className="flex items-center gap-2 font-black text-violet-700">
                <I className="size-4" aria-hidden /> {title}
              </p>
              <p className="mt-1 text-sm">{text}</p>
            </li>
          ))}
        </ul>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stories.map((s) => (
            <StoryCard key={s.slug} story={s} />
          ))}
        </div>
        <p className="mt-10 text-sm text-encre-doux">
          Toutes les histoires de StoryVerse sont des textes originaux écrits pour CONTEVERSE. Les contes traditionnels protégés ne sont publiés qu&apos;avec l&apos;autorisation de leurs ayants droit.
        </p>
      </div>
    </>
  );
}
