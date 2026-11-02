import { test } from "node:test";
import assert from "node:assert/strict";
import { applyEvent, computeXp, mergeProgress } from "../progress/engine.ts";
import { emptyProgress } from "../progress/types.ts";
import { levelFor } from "../progress/levels.ts";
import { dailyQuestions } from "../progress/daily.ts";

test("découvrir un pays donne le badge Petit explorateur et 15 XP", () => {
  const { state, newBadges } = applyEvent(emptyProgress(), { type: "discoverCountry", code: "GN" });
  assert.deepEqual(newBadges, ["petit-explorateur"]);
  assert.equal(computeXp(state), 15);
  // Rejouer l'événement ne redonne ni badge ni XP.
  const again = applyEvent(state, { type: "discoverCountry", code: "GN" });
  assert.deepEqual(again.newBadges, []);
  assert.equal(computeXp(again.state), 15);
});

test("le parcours du jury attribue des badges : lire, réussir un quiz", () => {
  let s = emptyProgress();
  s = applyEvent(s, { type: "discoverCountry", code: "GN" }).state;
  s = applyEvent(s, { type: "readArticle", slug: "independance-guinee-1958" }).state;
  const r = applyEvent(s, { type: "recordQuiz", slug: "article-independance-guinee-1958", score: 3, total: 3 });
  assert.ok(r.newBadges.includes("premier-quiz"));
  assert.equal(computeXp(r.state), 15 + 20 + 30);
});

test("seul le meilleur score d'un quiz compte (pas de farm d'XP)", () => {
  let s = emptyProgress();
  s = applyEvent(s, { type: "recordQuiz", slug: "quiz-guinee", score: 2, total: 5 }).state;
  s = applyEvent(s, { type: "recordQuiz", slug: "quiz-guinee", score: 4, total: 5 }).state;
  s = applyEvent(s, { type: "recordQuiz", slug: "quiz-guinee", score: 1, total: 5 }).state;
  assert.equal(s.quizResults["quiz-guinee"].best, 4);
  assert.equal(s.quizResults["quiz-guinee"].attempts, 3);
  assert.equal(computeXp(s), 40);
});

test("Ambassadeur de la Guinée : 2 articles guinéens + quiz Guinée réussi", () => {
  let s = emptyProgress();
  s = applyEvent(s, { type: "readArticle", slug: "fouta-djalon-chateau-eau" }).state;
  s = applyEvent(s, { type: "readArticle", slug: "sosso-bala" }).state;
  assert.equal(s.badges["ambassadeur-guinee"], undefined);
  s = applyEvent(s, { type: "recordQuiz", slug: "quiz-guinee", score: 3, total: 5 }).state;
  assert.ok(s.badges["ambassadeur-guinee"]);
});

test("le temps de lecture est plafonné par événement", () => {
  const s = applyEvent(emptyProgress(), { type: "addReading", day: "2026-11-02", seconds: 99999 }).state;
  assert.equal(s.readingSeconds["2026-11-02"], 600);
});

test("niveaux", () => {
  assert.equal(levelFor(0).current.name, "Petit curieux");
  assert.equal(levelFor(100).current.name, "Explorateur");
  assert.equal(levelFor(5000).current.name, "Gardien du patrimoine");
  assert.equal(levelFor(5000).next, null);
});

test("fusion locale + compte : on garde le meilleur des deux", () => {
  const a = applyEvent(emptyProgress(), { type: "recordQuiz", slug: "quiz-mali", score: 1, total: 3 }).state;
  const b = applyEvent(emptyProgress(), { type: "recordQuiz", slug: "quiz-mali", score: 3, total: 3 }).state;
  const m = mergeProgress(a, applyEvent(b, { type: "discoverCountry", code: "ML" }).state);
  assert.equal(m.quizResults["quiz-mali"].best, 3);
  assert.ok(m.countries.ML);
});

test("le défi du jour est stable pour une date donnée", () => {
  assert.deepEqual(dailyQuestions("2026-11-02").map((q) => q.id), dailyQuestions("2026-11-02").map((q) => q.id));
  assert.equal(dailyQuestions("2026-11-02").length, 3);
});
