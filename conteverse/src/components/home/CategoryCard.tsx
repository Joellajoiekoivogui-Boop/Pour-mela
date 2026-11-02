import Link from "next/link";
import type { Category } from "@/types/content";
import { Icon } from "@/components/ui/CategoryIcon";
import { Scene } from "@/components/ui/Scene";
import { tone } from "@/lib/utils/colors";

export function CategoryCard({ category, count, compact = false }: { category: Category; count: number; compact?: boolean }) {
  const t = tone[category.color];
  return (
    <Link href={`/univers/${category.slug}`} className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-carte ring-1 ring-encre/5 transition hover:-translate-y-1 hover:ring-orange-300">
      {!compact && <Scene name={category.scene} className="h-28 w-full" />}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className={`grid size-11 place-items-center rounded-2xl ${t.solid} ${compact ? "" : "-mt-10 ring-4 ring-white"}`}>
          <Icon name={category.icon} className="size-5" />
        </span>
        <h3 className="font-black leading-snug">{category.name}</h3>
        {!compact && <p className="text-sm text-encre-doux">{category.description}</p>}
        <p className={`mt-auto text-sm font-extrabold ${t.text}`}>
          {count} {count > 1 ? "lectures" : "lecture"} →
        </p>
      </div>
    </Link>
  );
}
