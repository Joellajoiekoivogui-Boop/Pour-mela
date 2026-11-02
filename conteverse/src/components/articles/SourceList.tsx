import { Library } from "lucide-react";
import type { Source } from "@/types/content";

export function SourceList({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <section className="rounded-3xl bg-white p-6 ring-1 ring-encre/10" aria-labelledby="sources-titre">
      <h2 id="sources-titre" className="flex items-center gap-2 text-lg font-black">
        <Library className="size-5 text-encre-doux" aria-hidden /> Sources
      </h2>
      <ul className="mt-3 grid gap-2 text-sm text-encre-doux">
        {sources.map((s) => (
          <li key={s.title + (s.publisher ?? "")}>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-bold text-bleu-700 underline-offset-2 hover:underline">
                {s.title}
              </a>
            ) : (
              <span className="font-bold text-encre">{s.title}</span>
            )}
            {s.publisher && <> — {s.publisher}</>}
            {s.note && <span className="block text-xs">{s.note}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
