import { test } from "node:test";
import assert from "node:assert/strict";
import { hasEnoughNeeds, keywords, rankMentors, scoreMentor, WEIGHTS, type Catalog, type MentorCandidate } from "../matching/engine.ts";
import { goalProgress, overallProgress } from "../goals.ts";
import { safeInternalPath } from "../utils.ts";
import { zonedInputToUtc } from "../dates.ts";

// Référentiel réduit : 1 = Développement, 2 = Marketing ; compétences 10-12 dev, 20 marketing.
const domains: Record<number, string> = { 1: "Développement informatique", 2: "Marketing digital" };
const skills: Record<number, [string, number]> = { 10: ["React", 1], 11: ["Node.js", 1], 12: ["SQL", 1], 20: ["SEO", 2] };
const catalog: Catalog = {
  domainName: (id) => domains[id],
  skillName: (id) => skills[id]?.[0],
  skillDomain: (id) => skills[id]?.[1],
};

const base: MentorCandidate = {
  id: "x", domainIds: [], skillIds: [], jobTitle: null, organization: null, bio: null, experiences: null,
  yearsExperience: 0, freeSlotCount: 0, availabilityNote: null, activeMentees: 0, maxMentees: 5,
};
const fullstack: MentorCandidate = {
  ...base, id: "fullstack", domainIds: [1], skillIds: [10, 11, 12], jobTitle: "Développeuse Full Stack",
  bio: "Je construis des applications web avec React et Node.js.", yearsExperience: 8, freeSlotCount: 4,
};
const marketer: MentorCandidate = {
  ...base, id: "marketing", domainIds: [2], skillIds: [20], jobTitle: "Responsable marketing", yearsExperience: 12, freeSlotCount: 4,
};
const needs = { domainIds: [1], wantedSkillIds: [10, 11], goalsText: "Je veux devenir développeur full stack avec React" };

test("un développeur full stack est classé devant un expert marketing pour un objectif full stack", () => {
  const ranked = rankMentors(needs, [marketer, fullstack], catalog);
  assert.equal(ranked[0]?.mentorId, "fullstack");
  assert.ok((ranked[0]?.score ?? 0) >= 85, `score élevé attendu, obtenu ${ranked[0]?.score}`);
  assert.ok((ranked[1]?.score ?? 100) <= 30, `score faible attendu, obtenu ${ranked[1]?.score}`);
});

test("le score est la somme exacte des critères et chaque critère respecte son maximum", () => {
  const r = scoreMentor(needs, fullstack, catalog);
  assert.equal(r.score, r.criteria.reduce((s, c) => s + c.points, 0));
  for (const c of r.criteria) assert.ok(c.points >= 0 && c.points <= c.max && c.max === WEIGHTS[c.key]);
  assert.equal(Object.values(WEIGHTS).reduce((a, b) => a + b, 0), 100);
});

test("chaque recommandation est expliquée", () => {
  const r = scoreMentor(needs, fullstack, catalog);
  assert.ok(r.reasons.some((x) => x.includes("Développement informatique")));
  assert.ok(r.reasons.some((x) => x.includes("React")));
  assert.ok(r.criteria.find((c) => c.key === "goals")?.detail.includes("fullstack"));
});

test("une compétence voisine (même domaine) rapporte des points partiels", () => {
  const sqlOnly = { ...fullstack, id: "sql", skillIds: [12] };
  const r = scoreMentor({ ...needs, goalsText: "" }, sqlOnly, catalog);
  const skillsScore = r.criteria.find((c) => c.key === "skills")!;
  assert.ok(skillsScore.points > 0 && skillsScore.points < WEIGHTS.skills);
});

test("un mentor complet est classé en dernier et ne gagne aucun point de disponibilité", () => {
  const full = { ...fullstack, id: "full", activeMentees: 5, maxMentees: 5 };
  const ranked = rankMentors(needs, [full, marketer], catalog);
  assert.equal(ranked.at(-1)?.mentorId, "full");
  assert.equal(ranked.at(-1)?.criteria.find((c) => c.key === "availability")?.points, 0);
});

test("profil vide : score nul hors disponibilité/expérience, et détection du manque d'informations", () => {
  const empty = { domainIds: [], wantedSkillIds: [], goalsText: "" };
  assert.equal(hasEnoughNeeds(empty), false);
  const r = scoreMentor(empty, fullstack, catalog);
  assert.equal(r.criteria.filter((c) => ["domains", "skills", "goals"].includes(c.key)).reduce((s, c) => s + c.points, 0), 0);
});

test("mots-clés : accents, mots vides et expressions composées", () => {
  assert.deepEqual(keywords("Devenir Développeur Full-Stack"), ["developpeur", "fullstack"]);
  assert.ok(keywords("l'intelligence artificielle").includes("ia"));
});

test("progression calculée sur les étapes réellement accomplies", () => {
  assert.equal(goalProgress([]), 0);
  assert.equal(goalProgress([{ is_done: true }, { is_done: false }, { is_done: false }]), 33);
  assert.equal(overallProgress([
    { status: "in_progress", milestones: [{ is_done: true }, { is_done: true }] },
    { status: "abandoned", milestones: [{ is_done: false }, { is_done: false }] },
    { status: "not_started", milestones: [{ is_done: false }, { is_done: false }] },
  ]), 50);
});

test("redirections : seuls les chemins internes sont acceptés", () => {
  assert.equal(safeInternalPath("/mentore/objectifs"), "/mentore/objectifs");
  assert.equal(safeInternalPath("//evil.com"), "/espace");
  assert.equal(safeInternalPath("https://evil.com"), "/espace");
  assert.equal(safeInternalPath("/\\evil.com"), "/espace");
});

test("fuseau Africa/Conakry : saisie locale convertie en UTC", () => {
  assert.equal(zonedInputToUtc("2026-11-12", "14:30"), "2026-11-12T14:30:00.000Z");
  assert.equal(zonedInputToUtc("2026-02-31", "10:00"), null);
  assert.equal(zonedInputToUtc("2026-11-12", "25:00"), null);
  assert.equal(zonedInputToUtc("2026-11-12", "14:30", "Europe/Paris"), "2026-11-12T13:30:00.000Z");
});
