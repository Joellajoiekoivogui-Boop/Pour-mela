import type { GlossaryItem } from "@/types/content";
import { GlossaryTerm } from "./GlossaryTerm";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Met en valeur la première apparition de chaque mot du glossaire.
 * `used` est partagé entre les paragraphes d'un même article.
 */
export function RichParagraph({ text, glossary, used }: { text: string; glossary: GlossaryItem[]; used: Set<string> }) {
  const pending = glossary.filter((g) => !used.has(g.word));
  if (!pending.length) return <p>{text}</p>;
  const re = new RegExp(`(?<![\\p{L}])(${pending.map((g) => escape(g.word)).join("|")})(s|x)?(?![\\p{L}])`, "iu");
  const parts: React.ReactNode[] = [];
  let rest = text;
  let key = 0;
  for (;;) {
    const m = re.exec(rest);
    if (!m) break;
    const item = pending.find((g) => g.word.toLowerCase() === m[1].toLowerCase());
    if (!item || used.has(item.word)) {
      parts.push(rest.slice(0, m.index + m[0].length));
      rest = rest.slice(m.index + m[0].length);
      continue;
    }
    used.add(item.word);
    parts.push(rest.slice(0, m.index));
    parts.push(
      <GlossaryTerm key={key++} word={item.word} definition={item.definition}>
        {m[0]}
      </GlossaryTerm>,
    );
    rest = rest.slice(m.index + m[0].length);
  }
  parts.push(rest);
  return <p>{parts}</p>;
}
