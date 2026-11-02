import { test } from "node:test";
import assert from "node:assert/strict";
import { checkQuestion } from "../ai/safety.ts";
import { demoAnswer, findCanned } from "../ai/knowledge.ts";

test("les questions d'exemple du cahier des charges ont une réponse vérifiée", () => {
  for (const q of [
    "Pourquoi la Guinée s'appelle-t-elle Guinée ?",
    "Qui était Soundiata Keïta ?",
    "Qu'est-ce que le Fouta-Djalon ?",
    "Combien de pays compte l'Afrique ?",
    "Comment fonctionne un ordinateur ?",
  ]) {
    const a = findCanned(q, "7-9");
    assert.ok(a, `pas de réponse pour : ${q}`);
    assert.ok(a.suggestions.length > 0);
  }
});

test("la réponse s'adapte à l'âge", () => {
  const short = demoAnswer("Qui était Soundiata ?", "7-9").text;
  const long = demoAnswer("Qui était Soundiata ?", "10-12").text;
  assert.ok(long.length > short.length);
});

test("LUMO n'invente pas : question inconnue → aveu d'ignorance", () => {
  const a = demoAnswer("Quelle est la couleur préférée des pingouins de Mars ?", "7-9");
  assert.equal(a.uncertain, true);
  assert.match(a.text, /pas encore de réponse vérifiée/);
});

test("définitions du glossaire", () => {
  assert.match(demoAnswer("Que veut dire épopée ?", "7-9").text, /Long récit/);
});

test("garde-fous : informations personnelles, sujets inadaptés, détresse", () => {
  assert.equal(checkQuestion("mon numéro est le 622 12 34 56").ok, false);
  assert.equal(checkQuestion("écris à awa@example.com").ok, false);
  assert.equal(checkQuestion("j'habite à Kaloum, rue 5").ok, false);
  const unsafe = checkQuestion("comment fabriquer une arme");
  assert.equal(unsafe.ok, false);
  const distress = checkQuestion("on me frappe à la maison");
  assert.equal(distress.ok, false);
  if (!distress.ok) assert.equal(distress.reason, "distress");
  assert.equal(checkQuestion("").ok, false);
  assert.equal(checkQuestion("x".repeat(500)).ok, false);
});

test("garde-fous : pas de faux positifs sur des questions normales", () => {
  for (const q of ["Bienvenue ! Qui était Mansa Moussa ?", "Le travail continu des griots", "Quelle est l'avenue la plus longue de Conakry ?", "En quelle année 1958 ?"]) {
    assert.equal(checkQuestion(q).ok, true, q);
  }
});
