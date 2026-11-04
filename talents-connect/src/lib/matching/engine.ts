/**
 * Moteur de matching TALENTS CONNECT.
 *
 * Calcule un score de compatibilité de 0 à 100 entre un mentoré et chaque
 * mentor, à partir de 5 critères objectifs et pondérés. Chaque point attribué
 * est justifié par une raison lisible : le score est entièrement explicable
 * et ne dépend d'aucun service d'IA (il fonctionne sans clé API).
 *
 *   Domaines d'expertise         35 pts
 *   Compétences recherchées      30 pts
 *   Objectifs (mots-clés)        15 pts
 *   Disponibilités               10 pts
 *   Expérience                   10 pts
 */

export interface MenteeNeeds {
  domainIds: number[];
  wantedSkillIds: number[];
  /** Texte libre : objectifs professionnels, besoins du projet, titres d'objectifs. */
  goalsText: string;
}

export interface MentorCandidate {
  id: string;
  domainIds: number[];
  skillIds: number[];
  jobTitle: string | null;
  organization: string | null;
  bio: string | null;
  experiences: string | null;
  yearsExperience: number;
  freeSlotCount: number;
  availabilityNote: string | null;
  activeMentees: number;
  maxMentees: number;
}

export interface Catalog {
  domainName: (id: number) => string | undefined;
  skillName: (id: number) => string | undefined;
  skillDomain: (id: number) => number | null | undefined;
}

export type CriterionKey = "domains" | "skills" | "goals" | "availability" | "experience";

export interface CriterionScore {
  key: CriterionKey;
  label: string;
  points: number;
  max: number;
  detail: string;
}

export interface MatchResult {
  mentorId: string;
  score: number;
  criteria: CriterionScore[];
  /** Raisons positives, à afficher sur la carte du mentor. */
  reasons: string[];
  isFull: boolean;
}

export const WEIGHTS: Record<CriterionKey, number> = {
  domains: 35,
  skills: 30,
  goals: 15,
  availability: 10,
  experience: 10,
};

const LABELS: Record<CriterionKey, string> = {
  domains: "Domaines d'expertise",
  skills: "Compétences recherchées",
  goals: "Objectifs",
  availability: "Disponibilités",
  experience: "Expérience",
};

// Mots trop fréquents pour être significatifs.
const STOPWORDS = new Set(
  ("les des une un le la de du et en au aux pour par sur dans avec sans mon ma mes ton ta tes son sa ses " +
    "notre nos votre vos leur leurs qui que quoi dont ou est sont etre avoir faire plus tres bien comme " +
    "afin cette ces cet ce je tu il elle nous vous ils elles me te se lui y a ai as avons avez ont souhaite " +
    "veux voudrais aimerais devenir apprendre ameliorer mieux mettre place travail travailler projet projets " +
    "objectif objectifs besoin besoins aide aider accompagnement domaine annee annees ans")
    .split(" "),
);

// Expressions composées ramenées à un seul mot-clé.
const PHRASES: [RegExp, string][] = [
  [/full[\s-]?stack/g, "fullstack"],
  [/front[\s-]?end/g, "frontend"],
  [/back[\s-]?end/g, "backend"],
  [/intelligence artificielle/g, "ia"],
  [/machine learning/g, "machinelearning"],
  [/data scien\w*/g, "datascience"],
  [/ui\s*\/\s*ux/g, "uiux"],
  [/business plan/g, "businessplan"],
  [/node\.?js/g, "nodejs"],
  [/next\.?js/g, "nextjs"],
];

function normalizeText(text: string): string {
  let t = text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  for (const [re, rep] of PHRASES) t = t.replace(re, rep);
  return t;
}

/** Mots-clés significatifs d'un texte (sans accents ni mots vides). */
export function keywords(text: string): string[] {
  const words = normalizeText(text).split(/[^a-z0-9+#]+/);
  const out = new Set<string>();
  for (const w of words) {
    if (w.length >= 3 && !STOPWORDS.has(w)) out.add(w);
    else if (w === "ia" || w === "ux" || w === "ui") out.add(w);
  }
  return [...out];
}

/** Racine grossière : « développeur » et « développement » partagent « develo ». */
function stem(word: string): string {
  return word.length > 6 ? word.slice(0, 6) : word.replace(/s$/, "");
}

function ratio(value: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(1, value / target));
}

function listNames(ids: number[], name: (id: number) => string | undefined, max = 3): string {
  const names = ids.map(name).filter((n): n is string => Boolean(n));
  if (names.length <= max) return names.join(", ");
  return `${names.slice(0, max).join(", ")} et ${names.length - max} autre(s)`;
}

export function scoreMentor(needs: MenteeNeeds, mentor: MentorCandidate, catalog: Catalog): MatchResult {
  const criteria: CriterionScore[] = [];
  const reasons: string[] = [];
  const mentorDomains = new Set(mentor.domainIds);
  const mentorSkills = new Set(mentor.skillIds);

  // 1. Domaines : part des domaines recherchés couverts (2 domaines couverts = maximum).
  {
    const common = needs.domainIds.filter((d) => mentorDomains.has(d));
    const r = ratio(common.length, Math.min(needs.domainIds.length, 2));
    const points = Math.round(WEIGHTS.domains * r);
    criteria.push({
      key: "domains", label: LABELS.domains, points, max: WEIGHTS.domains,
      detail: needs.domainIds.length === 0
        ? "Aucun domaine recherché dans votre profil"
        : common.length > 0
          ? `Expert(e) en ${listNames(common, catalog.domainName)}`
          : "Aucun de vos domaines recherchés",
    });
    if (common.length > 0) reasons.push(`Expert(e) en ${listNames(common, catalog.domainName)}, un domaine que vous recherchez`);
  }

  // 2. Compétences : correspondance exacte = 1, même domaine = 0,4 (4 compétences = maximum).
  {
    const exact = needs.wantedSkillIds.filter((s) => mentorSkills.has(s));
    const mentorSkillDomains = new Set(mentor.skillIds.map((s) => catalog.skillDomain(s)).filter((d) => d != null));
    const related = needs.wantedSkillIds.filter((s) => !mentorSkills.has(s) && mentorSkillDomains.has(catalog.skillDomain(s) ?? -1));
    const value = exact.length + related.length * 0.4;
    const r = ratio(value, Math.min(needs.wantedSkillIds.length, 4));
    const points = Math.round(WEIGHTS.skills * r);
    let detail = "Aucune compétence recherchée dans votre profil";
    if (needs.wantedSkillIds.length > 0) {
      detail = exact.length > 0
        ? `Maîtrise ${listNames(exact, catalog.skillName)} (${exact.length}/${needs.wantedSkillIds.length} compétences recherchées)`
        : related.length > 0
          ? `Compétences proches de celles que vous recherchez`
          : "Aucune des compétences recherchées";
    }
    criteria.push({ key: "skills", label: LABELS.skills, points, max: WEIGHTS.skills, detail });
    if (exact.length > 0) reasons.push(`Transmet ${listNames(exact, catalog.skillName)}`);
    else if (related.length > 0) reasons.push("Compétences proches de celles que vous recherchez");
  }

  // 3. Objectifs : mots-clés de vos objectifs présents dans le parcours du mentor (5 = maximum).
  {
    const goalWords = keywords(needs.goalsText);
    const mentorText = [
      mentor.jobTitle, mentor.organization, mentor.bio, mentor.experiences,
      ...mentor.skillIds.map(catalog.skillName), ...mentor.domainIds.map(catalog.domainName),
    ].filter(Boolean).join(" ");
    const mentorStems = new Set(keywords(mentorText).map(stem));
    const matched = goalWords.filter((w) => mentorStems.has(stem(w)));
    const r = ratio(matched.length, Math.min(goalWords.length, 5));
    const points = Math.round(WEIGHTS.goals * r);
    criteria.push({
      key: "goals", label: LABELS.goals, points, max: WEIGHTS.goals,
      detail: goalWords.length === 0
        ? "Décrivez vos objectifs pour affiner ce critère"
        : matched.length > 0
          ? `Mots-clés communs : ${matched.slice(0, 5).join(", ")}`
          : "Pas de mot-clé commun avec vos objectifs",
    });
    if (matched.length > 0) reasons.push(`Son parcours correspond à vos objectifs (${matched.slice(0, 3).join(", ")})`);
  }

  // 4. Disponibilités : créneaux libres à venir et capacité d'accueil.
  const isFull = mentor.activeMentees >= mentor.maxMentees;
  {
    let points = 0;
    let detail: string;
    if (isFull) detail = "N'accepte plus de nouveaux mentorés pour le moment";
    else if (mentor.freeSlotCount >= 3) { points = 10; detail = `${mentor.freeSlotCount} créneaux libres à venir`; }
    else if (mentor.freeSlotCount > 0) { points = 7; detail = `${mentor.freeSlotCount} créneau(x) libre(s) à venir`; }
    else if (mentor.availabilityNote) { points = 3; detail = `Disponibilités indicatives : ${mentor.availabilityNote}`; }
    else detail = "Aucun créneau publié pour le moment";
    criteria.push({ key: "availability", label: LABELS.availability, points, max: WEIGHTS.availability, detail });
    if (points >= 7) reasons.push(detail);
  }

  // 5. Expérience professionnelle.
  {
    const y = mentor.yearsExperience;
    const points = y >= 10 ? 10 : y >= 5 ? 8 : y >= 2 ? 5 : y > 0 ? 2 : 0;
    criteria.push({
      key: "experience", label: LABELS.experience, points, max: WEIGHTS.experience,
      detail: y > 0 ? `${y} an${y > 1 ? "s" : ""} d'expérience` : "Expérience non renseignée",
    });
    if (y >= 5) reasons.push(`${y} ans d'expérience professionnelle`);
  }

  const score = criteria.reduce((sum, c) => sum + c.points, 0);
  return { mentorId: mentor.id, score, criteria, reasons, isFull };
}

/** Classe les mentors par compatibilité décroissante (puis par expérience). */
export function rankMentors(needs: MenteeNeeds, mentors: MentorCandidate[], catalog: Catalog): MatchResult[] {
  const years = new Map(mentors.map((m) => [m.id, m.yearsExperience]));
  return mentors
    .map((m) => scoreMentor(needs, m, catalog))
    .sort((a, b) => Number(a.isFull) - Number(b.isFull) || b.score - a.score || (years.get(b.mentorId) ?? 0) - (years.get(a.mentorId) ?? 0));
}

/** Vrai si le profil du mentoré contient assez d'informations pour un matching utile. */
export function hasEnoughNeeds(needs: MenteeNeeds): boolean {
  return needs.domainIds.length > 0 || needs.wantedSkillIds.length > 0 || keywords(needs.goalsText).length > 0;
}
