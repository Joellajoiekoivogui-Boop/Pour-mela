import { test } from "node:test";
import assert from "node:assert/strict";
import { articles, articleBySlug } from "../../data/articles/index.ts";
import { categories } from "../../data/categories.ts";
import { countries } from "../../data/countries.ts";
import { stories } from "../../data/stories.ts";
import { allQuizzes, challengeQuizzes, quizBySlug } from "../../data/quizzes.ts";
import { flags, africanTerritories } from "../../data/africa.ts";

test("54 pays membres de l'ONU", () => {
  assert.equal(africanTerritories.filter((t) => !t.disputed).length, 54);
});

test("chaque catégorie a au moins un article", () => {
  for (const c of categories) assert.ok(articles.some((a) => a.category === c.slug), c.slug);
  assert.equal(categories.length, 12);
});

test("articles : slugs uniques, sources, glossaire, quiz valide, liens existants", () => {
  assert.equal(new Set(articles.map((a) => a.slug)).size, articles.length);
  for (const a of articles) {
    assert.ok(a.sources.length > 0, `${a.slug} sans source`);
    assert.ok(a.glossary.length > 0, `${a.slug} sans glossaire`);
    assert.ok(a.quiz.length >= 2, `${a.slug} : quiz trop court`);
    for (const r of a.related ?? []) assert.ok(articleBySlug[r], `${a.slug} → ${r} introuvable`);
  }
});

test("quiz : réponses valides et au moins 10 questions de défis", () => {
  for (const z of allQuizzes)
    for (const q of z.questions) {
      assert.ok(q.answer >= 0 && q.answer < q.options.length, `${z.slug}/${q.id}`);
      assert.equal(new Set(q.options).size, q.options.length, `${z.slug}/${q.id} options en double`);
      if (q.flag) assert.ok(flags[q.flag], `drapeau ${q.flag}`);
    }
  assert.ok(challengeQuizzes.reduce((n, q) => n + q.questions.length, 0) >= 10);
});

test("pays : articles et quiz existants", () => {
  for (const c of countries) {
    assert.ok(quizBySlug[c.quizSlug], c.quizSlug);
    for (const s of c.articles) assert.ok(articleBySlug[s], s);
    assert.ok(flags[c.code]);
  }
});

test("histoires : chaque choix mène à un nœud, chaque nœud atteint une fin", () => {
  for (const s of stories) {
    assert.ok(s.nodes[s.start]);
    for (const n of Object.values(s.nodes)) {
      for (const c of n.choices ?? []) assert.ok(s.nodes[c.next], `${s.slug}: ${n.id} → ${c.next}`);
      assert.ok(n.ending || n.choices?.length, `${s.slug}: ${n.id} sans issue`);
    }
    assert.ok(s.disclaimer.length > 20);
  }
});
