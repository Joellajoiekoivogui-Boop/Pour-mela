import Link from "next/link";
import { Clock } from "lucide-react";
import type { Article } from "@/types/content";
import { Scene } from "@/components/ui/Scene";
import { Pill } from "@/components/ui/Pill";
import { categoryBySlug } from "@/data/categories";
import { difficultyLabel, scopeLabel } from "@/lib/utils/labels";
import { tone } from "@/lib/utils/colors";
import { ReadMarker } from "./ReadMarker";

export function ArticleCard({ article }: { article: Article }) {
  const cat = categoryBySlug[article.category];
  return (
    <Link href={`/bibliotheque/${article.slug}`} className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-carte ring-1 ring-encre/5 transition hover:-translate-y-1 hover:ring-orange-300">
      <div className="relative aspect-[5/3] overflow-hidden">
        <Scene name={article.scene} className="h-full w-full transition duration-500 group-hover:scale-105" />
        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-extrabold ${tone[cat.color].solid}`}>{cat.short}</span>
        <ReadMarker slug={article.slug} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg font-black leading-snug group-hover:text-orange-700">{article.title}</h3>
        <p className="line-clamp-2 text-sm text-encre-doux">{article.intro}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Pill>
            <Clock className="size-3" aria-hidden /> {article.readingMinutes} min
          </Pill>
          <Pill>{difficultyLabel[article.difficulty]}</Pill>
          <Pill>{scopeLabel(article.scope)}</Pill>
          <Pill>
            {article.ageMin}-{article.ageMax} ans
          </Pill>
        </div>
      </div>
    </Link>
  );
}
