"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Article } from "@/types/content";
import { categories } from "@/data/categories";
import { countries } from "@/data/countries";
import { contentTypeLabel, difficultyLabel } from "@/lib/utils/labels";
import { ArticleCard } from "./ArticleCard";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

type Filters = { q: string; category: string; scope: string; difficulty: string; age: string; duration: string; type: string };
const EMPTY: Filters = { q: "", category: "", scope: "", difficulty: "", age: "", duration: "", type: "" };

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="grid gap-1 text-xs font-extrabold uppercase tracking-wider text-encre-doux">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="min-h-11 rounded-xl bg-white px-3 text-sm font-bold normal-case tracking-normal text-encre ring-1 ring-encre/10">
        <option value="">Tous</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LibraryBrowser({ articles, initialCategory = "" }: { articles: Article[]; initialCategory?: string }) {
  const [f, setF] = useState<Filters>({ ...EMPTY, category: initialCategory });
  const set = (k: keyof Filters) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const list = useMemo(() => {
    const q = norm(f.q.trim());
    return articles.filter((a) => {
      if (f.category && a.category !== f.category) return false;
      if (f.scope && a.scope !== f.scope) return false;
      if (f.difficulty && a.difficulty !== f.difficulty) return false;
      if (f.type && a.contentType !== f.type) return false;
      if (f.age) {
        const age = Number(f.age);
        if (age < a.ageMin || age > a.ageMax) return false;
      }
      if (f.duration === "court" && a.readingMinutes > 3) return false;
      if (f.duration === "long" && a.readingMinutes <= 3) return false;
      if (q && !norm([a.title, a.intro, ...(a.tags ?? [])].join(" ")).includes(q)) return false;
      return true;
    });
  }, [articles, f]);

  const active = Object.values(f).some(Boolean);

  return (
    <div>
      <div className="rounded-3xl bg-sable/70 p-4 sm:p-6">
        <label className="relative block">
          <span className="sr-only">Rechercher une lecture</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-encre-doux" aria-hidden />
          <input
            type="search"
            value={f.q}
            onChange={(e) => set("q")(e.target.value)}
            placeholder="Rechercher : Soundiata, fleuve, kora…"
            className="min-h-12 w-full rounded-2xl bg-white pl-12 pr-4 text-lg font-semibold ring-1 ring-encre/10 placeholder:text-encre/40"
          />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Select label="Catégorie" value={f.category} onChange={set("category")} options={categories.map((c) => [c.slug, c.short])} />
          <Select label="Pays" value={f.scope} onChange={set("scope")} options={[...countries.map((c) => [c.code, c.name] as [string, string]), ["AF", "Afrique (général)"], ["MONDE", "Monde"]]} />
          <Select label="Niveau" value={f.difficulty} onChange={set("difficulty")} options={Object.entries(difficultyLabel)} />
          <Select label="Mon âge" value={f.age} onChange={set("age")} options={[7, 8, 9, 10, 11, 12].map((a) => [String(a), `${a} ans`])} />
          <Select label="Durée" value={f.duration} onChange={set("duration")} options={[["court", "3 min ou moins"], ["long", "Plus de 3 min"]]} />
          <Select label="Type" value={f.type} onChange={set("type")} options={Object.entries(contentTypeLabel)} />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <p className="font-bold text-encre-doux" aria-live="polite">
          {list.length} {list.length > 1 ? "lectures" : "lecture"}
        </p>
        {active && (
          <button onClick={() => setF(EMPTY)} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold text-orange-700 hover:bg-orange-50">
            <X className="size-4" aria-hidden /> Effacer les filtres
          </button>
        )}
      </div>
      {list.length ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-3xl bg-white p-10 text-center shadow-carte">
          <p className="text-lg font-bold">Aucune lecture ne correspond à ces filtres.</p>
          <p className="mt-1 text-encre-doux">Essaie un autre mot ou retire un filtre.</p>
        </div>
      )}
    </div>
  );
}
