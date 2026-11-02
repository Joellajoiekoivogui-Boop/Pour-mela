// Génère supabase/seed.sql à partir du catalogue local (src/data), source
// unique de vérité pour le MVP. Usage : npm run seed
import { writeFileSync } from "node:fs";
import { categories } from "../src/data/categories.ts";
import { countries } from "../src/data/countries.ts";
import { africanTerritories } from "../src/data/africa.ts";
import { articles } from "../src/data/articles/index.ts";
import { stories } from "../src/data/stories.ts";
import { allQuizzes } from "../src/data/quizzes.ts";
import { cities, naturalRegions, timeline, naturalSites, languages } from "../src/data/guinee.ts";
import { BADGES } from "../src/lib/progress/badges.ts";

const q = (v: unknown): string => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return `'${String(v).replace(/'/g, "''")}'`;
};
const arr = (a: string[] = []) => (a.length ? `array[${a.map(q).join(", ")}]::text[]` : "'{}'::text[]");
const json = (v: unknown) => `${q(JSON.stringify(v))}::jsonb`;

const out: string[] = ["-- Fichier généré par scripts/generate-seed.ts — ne pas modifier à la main.", "begin;", ""];

// Catégories
categories.forEach((c, i) =>
  out.push(
    `insert into public.categories (slug, name, short_name, description, icon, color, position) values (${[c.slug, c.name, c.short, c.description, c.icon, c.color].map(q).join(", ")}, ${i}) on conflict (slug) do update set name = excluded.name, description = excluded.description;`,
  ),
);

// Pays (les 54 + Sahara occidental), avec fiche pour le MVP
for (const t of africanTerritories) {
  const s = countries.find((c) => c.code === t.code);
  out.push(
    `insert into public.countries (code, name, capital, has_sheet, disputed, location, population_note, currency, official_language, motto, flag_note, independence_date, independence_text, fun_fact, sheet, editorial_status, validation_note) values (${[
      t.code, t.name, s?.capital ?? t.capital ?? null,
    ].map(q).join(", ")}, ${q(!!s)}, ${q(!!t.disputed)}, ${[s?.location, s?.population, s?.currency, s?.officialLanguage, s?.motto, s?.flagNote, s?.independence?.date, s?.independence?.text, s?.funFact].map(q).join(", ")}, ${json(
      s ? { history: s.history, languages: s.languages, cultures: s.cultures, heritage: s.heritage, nature: s.nature, economy: s.economy, sciences: s.sciences, sources: s.sources } : {},
    )}, ${q(s?.status ?? "a-valider")}, ${q(s?.validationNote)}) on conflict (code) do nothing;`,
  );
  for (const p of s?.personalities ?? [])
    out.push(`insert into public.personalities (country_id, name, role, editorial_status) select id, ${q(p.name)}, ${q(p.role)}, 'verifie' from public.countries where code = ${q(t.code)} on conflict do nothing;`);
}

// Guinée : régions, villes, frise, sites naturels, langues
for (const r of naturalRegions)
  out.push(`insert into public.regions (country_id, name, kind, description) select id, ${q(r.name)}, 'naturelle', ${q(r.text)} from public.countries where code = 'GN' on conflict do nothing;`);
for (const c of cities) {
  const region = naturalRegions.find((r) => r.id === c.region)!;
  out.push(`insert into public.regions (country_id, name, kind) select id, ${q(c.name)}, 'administrative' from public.countries where code = 'GN' on conflict do nothing;`);
  out.push(
    `insert into public.cities (country_id, region_id, name, description, is_capital) select c.id, r.id, ${q(c.name)}, ${q(c.text)}, ${q(c.name === "Conakry")} from public.countries c join public.regions r on r.country_id = c.id and r.kind = 'naturelle' and r.name = ${q(region.name)} where c.code = 'GN' on conflict do nothing;`,
  );
}
timeline.forEach((t, i) =>
  out.push(`insert into public.historical_events (country_id, when_label, title, description, is_uncertain, position) select id, ${[t.when, t.title, t.text].map(q).join(", ")}, ${q(!!t.uncertain)}, ${i} from public.countries where code = 'GN';`),
);
for (const s of naturalSites)
  out.push(`insert into public.natural_sites (country_id, name, description, unesco) select id, ${q(s.name)}, ${q(s.text)}, ${q(/UNESCO/.test(s.text))} from public.countries where code = 'GN';`);
for (const l of languages.filter((l) => !l.name.startsWith("Et ")))
  out.push(`insert into public.languages (name, other_names, description) values (${q(l.name)}, ${arr(l.also ? l.also.split(", ") : [])}, ${q(l.where)}) on conflict (name) do nothing;`);

// Sources
const sources = new Map<string, { title: string; publisher?: string; url?: string; note?: string }>();
for (const a of articles) for (const s of a.sources) sources.set(`${s.title}|${s.publisher ?? ""}`, s);
for (const s of sources.values())
  out.push(`insert into public.sources (title, publisher, url, note) values (${[s.title, s.publisher ?? null, s.url ?? null, s.note ?? null].map(q).join(", ")}) on conflict (title, publisher) do nothing;`);

// Articles, sections, sources
for (const a of articles) {
  const countryCode = a.scope.length === 2 ? a.scope : null;
  out.push(
    `insert into public.articles (slug, title, category_id, country_id, scope, difficulty, age_min, age_max, reading_minutes, content_type, scene, intro, glossary, tags, status, editorial_status, validation_note) select ${[a.slug, a.title].map(q).join(", ")}, (select id from public.categories where slug = ${q(a.category)}), ${countryCode ? `(select id from public.countries where code = ${q(countryCode)})` : "null"}, ${[a.scope, a.difficulty].map(q).join(", ")}, ${a.ageMin}, ${a.ageMax}, ${a.readingMinutes}, ${[a.contentType, a.scene, a.intro].map(q).join(", ")}, ${json(a.glossary)}, ${arr(a.tags)}, 'publie', ${q(a.status)}, ${q(a.validationNote)} on conflict (slug) do nothing;`,
  );
  a.sections.forEach((s, i) =>
    out.push(`insert into public.article_sections (article_id, position, heading, paragraphs, did_you_know, uncertainty) select id, ${i}, ${q(s.heading)}, ${arr(s.paragraphs)}, ${q(s.didYouKnow)}, ${q(s.uncertainty)} from public.articles where slug = ${q(a.slug)} on conflict do nothing;`),
  );
  for (const s of a.sources)
    out.push(
      `insert into public.article_sources (article_id, source_id) select a.id, s.id from public.articles a, public.sources s where a.slug = ${q(a.slug)} and s.title = ${q(s.title)} and s.publisher is not distinct from ${q(s.publisher ?? null)} on conflict do nothing;`,
    );
}

// Histoires
for (const s of stories) {
  out.push(
    `insert into public.stories (slug, title, genre, disclaimer, scope, age_min, reading_minutes, scene, summary, interactive, start_node, credits, status) values (${[s.slug, s.title, s.genre, s.disclaimer, s.scope].map(q).join(", ")}, ${s.ageMin}, ${s.readingMinutes}, ${[s.scene, s.summary].map(q).join(", ")}, ${q(s.interactive)}, ${q(s.start)}, ${q(s.credits)}, 'publie') on conflict (slug) do nothing;`,
  );
  for (const n of Object.values(s.nodes))
    out.push(
      `insert into public.story_nodes (story_id, node_key, paragraphs, scene, ending_title, ending_message) select id, ${q(n.id)}, ${arr(n.paragraphs)}, ${q(n.scene)}, ${q(n.ending?.title)}, ${q(n.ending?.message)} from public.stories where slug = ${q(s.slug)} on conflict do nothing;`,
    );
  for (const n of Object.values(s.nodes))
    (n.choices ?? []).forEach((c, i) =>
      out.push(`insert into public.story_choices (story_id, from_node, to_node, label, position) select id, ${q(n.id)}, ${q(c.next)}, ${q(c.label)}, ${i} from public.stories where slug = ${q(s.slug)};`),
    );
}

// Quiz
for (const z of allQuizzes) {
  const articleSlug = z.slug.startsWith("article-") ? z.slug.slice(8) : null;
  const storySlug = z.slug.startsWith("histoire-") ? z.slug.slice(9) : null;
  out.push(
    `insert into public.quizzes (slug, title, description, kind, scope, category_id, article_id, story_id, status) values (${[z.slug, z.title, z.description, z.kind, z.scope].map(q).join(", ")}, ${z.category ? `(select id from public.categories where slug = ${q(z.category)})` : "null"}, ${articleSlug ? `(select id from public.articles where slug = ${q(articleSlug)})` : "null"}, ${storySlug ? `(select id from public.stories where slug = ${q(storySlug)})` : "null"}, 'publie') on conflict (slug) do nothing;`,
  );
  z.questions.forEach((qq, i) => {
    out.push(
      `insert into public.quiz_questions (quiz_id, position, external_id, question, explanation, flag_code) select id, ${i}, ${[qq.id, qq.question, qq.explanation, qq.flag ?? null].map(q).join(", ")} from public.quizzes where slug = ${q(z.slug)} on conflict do nothing;`,
    );
    qq.options.forEach((o, j) =>
      out.push(
        `insert into public.quiz_answers (question_id, position, label, is_correct) select qq.id, ${j}, ${q(o)}, ${q(j === qq.answer)} from public.quiz_questions qq join public.quizzes z on z.id = qq.quiz_id where z.slug = ${q(z.slug)} and qq.position = ${i} on conflict do nothing;`,
      ),
    );
  });
}

// Badges
for (const b of BADGES)
  out.push(`insert into public.achievements (code, name, description, hint, icon, color) values (${[b.id, b.name, b.description, b.hint, b.icon, b.color].map(q).join(", ")}) on conflict (code) do nothing;`);

out.push("", "commit;", "");
writeFileSync(new URL("../supabase/seed.sql", import.meta.url), out.join("\n"));
console.log(`supabase/seed.sql : ${out.length} lignes.`);
