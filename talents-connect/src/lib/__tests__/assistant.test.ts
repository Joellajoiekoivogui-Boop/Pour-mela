import { test } from "node:test";
import assert from "node:assert/strict";
import { fallbackAnswer, fallbackPath } from "../ai/fallback.ts";
import { videoEmbedUrl } from "../embeds.ts";

test("mode sans IA : un objectif full stack donne le parcours web attendu", () => {
  const plan = fallbackPath("Je veux devenir développeur Full Stack");
  assert.equal(plan.title, "Devenir développeur Full Stack");
  assert.ok(plan.steps.some((s) => s.includes("React")));
  assert.ok(plan.steps.length >= 6);
});

test("mode sans IA : objectif inconnu → parcours générique gardant l'intitulé", () => {
  const plan = fallbackPath("Devenir chef cuisinier");
  assert.equal(plan.title, "Devenir chef cuisinier");
  assert.ok(plan.steps.length >= 5);
});

test("mode sans IA : réponses carrière selon la demande", () => {
  assert.match(fallbackAnswer("career", "Aide-moi pour ma lettre de motivation"), /lettre de motivation/);
  assert.match(fallbackAnswer("career", "préparer un entretien"), /STAR/);
  assert.match(fallbackAnswer("mentor_prep", "séance"), /Trame de séance/);
});

test("vidéos : seuls YouTube et Vimeo sont intégrés", () => {
  assert.equal(videoEmbedUrl("https://www.youtube.com/watch?v=abc123"), "https://www.youtube-nocookie.com/embed/abc123");
  assert.equal(videoEmbedUrl("https://youtu.be/abc123"), "https://www.youtube-nocookie.com/embed/abc123");
  assert.equal(videoEmbedUrl("https://vimeo.com/12345"), "https://player.vimeo.com/video/12345");
  assert.equal(videoEmbedUrl("https://evil.example/video"), null);
});
