import Link from "next/link";
import { Clock, GitBranch } from "lucide-react";
import type { Story } from "@/types/content";
import { Scene } from "@/components/ui/Scene";
import { Pill } from "@/components/ui/Pill";
import { genreLabel } from "@/lib/utils/labels";

const GENRE_STYLE = { conte: "bg-violet-500 text-white", epopee: "bg-jaune-400 text-encre", fiction: "bg-bleu-500 text-white", "recit-historique": "bg-orange-500 text-white" } as const;

export function StoryCard({ story }: { story: Story }) {
  return (
    <Link href={`/histoires/${story.slug}`} className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-carte ring-1 ring-encre/5 transition hover:-translate-y-1 hover:ring-violet-300">
      <div className="relative aspect-[5/3] overflow-hidden">
        <Scene name={story.scene} className="h-full w-full transition duration-500 group-hover:scale-105" />
        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-extrabold ${GENRE_STYLE[story.genre]}`}>{genreLabel[story.genre]}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg font-black leading-snug group-hover:text-violet-700">{story.title}</h3>
        <p className="line-clamp-3 text-sm text-encre-doux">{story.summary}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Pill>
            <Clock className="size-3" aria-hidden /> {story.readingMinutes} min
          </Pill>
          {story.interactive && (
            <Pill className="bg-violet-50 text-violet-700">
              <GitBranch className="size-3" aria-hidden /> Tu choisis la suite
            </Pill>
          )}
          <Pill>Dès {story.ageMin} ans</Pill>
        </div>
      </div>
    </Link>
  );
}
