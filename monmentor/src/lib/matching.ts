// Recommandation des mentors (spécification F3).
// Fonctions pures : aucune base de données ici, ce qui permet de les tester
// sur un jeu de besoins de référence (tests/matching.test.ts).
import { DOMAIN_KEYWORDS, DOMAIN_IDS, LANGUAGES, SKILLS, domainLabel, type DomainId } from "./domains";

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’`´]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const patternCache = new Map<string, RegExp>();
function hasPhrase(normText: string, pattern: string): boolean {
  let re = patternCache.get(pattern);
  if (!re) {
    re = new RegExp(`(^|[^a-z0-9])${escapeRegex(pattern)}($|[^a-z0-9])`);
    patternCache.set(pattern, re);
  }
  return re.test(normText);
}

export type Need = {
  domains: DomainId[];
  skills: string[];
  formats: string[];
  languages: string[];
  presentielRequired: boolean;
  city?: string | null;
  country?: string | null;
};

const FORMAT_PATTERNS: Record<string, string[]> = {
  visio: ["visio", "visioconference", "en ligne", "a distance", "appel video"],
  chat: ["chat", "par ecrit", "messages", "whatsapp"],
  presentiel: ["presentiel", "en personne", "face a face", "rencontrer", "se rencontrer", "en vrai"],
};

/** Lecture du besoin par mots-clés : sert seule, ou en complément de l'analyse par IA. */
export function extractNeedKeywords(text: string): Omit<Need, "city" | "country"> {
  const t = normalize(text);
  const skills = SKILLS.filter((s) => s.patterns.some((p) => hasPhrase(t, p)));
  const domains = new Set<DomainId>(skills.map((s) => s.domain));
  for (const id of DOMAIN_IDS) {
    if (DOMAIN_KEYWORDS[id].some((k) => hasPhrase(t, k))) domains.add(id);
  }
  const formats = Object.entries(FORMAT_PATTERNS)
    .filter(([, pats]) => pats.some((p) => hasPhrase(t, p)))
    .map(([f]) => f);
  const languages = LANGUAGES.filter((l) => l !== "Français" && hasPhrase(t, normalize(l)));
  return {
    domains: [...domains],
    skills: skills.map((s) => s.name),
    formats,
    languages,
    presentielRequired: formats.includes("presentiel"),
  };
}

/** Ramène les compétences libres d'un mentor au référentiel commun. */
export function canonicalSkills(skills: string[]): Set<string> {
  const out = new Set<string>();
  for (const raw of skills) {
    const n = normalize(raw);
    const exact = SKILLS.find((s) => normalize(s.name) === n);
    if (exact) {
      out.add(exact.name);
      continue;
    }
    for (const s of SKILLS) if (s.patterns.some((p) => hasPhrase(n, p))) out.add(s.name);
  }
  return out;
}

export type MentorCandidate = {
  id: string;
  name: string;
  city: string;
  country: string;
  primaryDomain: string;
  domains: string[];
  skills: string[];
  languages: string[];
  formats: string[];
  capacity: number;
  activeMentees: number;
  ratingAvg: number | null;
  ratingCount: number;
  alreadyRelated?: boolean;
};

export type Weights = { C: number; D: number; P: number; F: number; G: number; N: number };

export const DEFAULT_WEIGHTS: Weights = { C: 0.4, D: 0.2, P: 0.15, F: 0.1, G: 0.1, N: 0.05 };

/** Lit les poids depuis MATCH_WEIGHTS (JSON) pour les ajuster sans redéployer le code. */
export function weightsFromEnv(raw = process.env.MATCH_WEIGHTS): Weights {
  if (!raw) return DEFAULT_WEIGHTS;
  try {
    const parsed = JSON.parse(raw) as Partial<Weights>;
    const w = { ...DEFAULT_WEIGHTS, ...parsed };
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    return total > 0 ? w : DEFAULT_WEIGHTS;
  } catch {
    return DEFAULT_WEIGHTS;
  }
}

export type ScoredMentor = {
  mentor: MentorCandidate;
  score: number; // 0 à 100
  parts: Record<keyof Weights, number>;
  matchedSkills: string[];
  reasons: string[];
};

const fmt1 = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

export function scoreMentor(need: Need, m: MentorCandidate, w: Weights = DEFAULT_WEIGHTS): ScoredMentor | null {
  const places = m.capacity - m.activeMentees;
  if (places <= 0 && !m.alreadyRelated) return null; // complet : exclu

  const mentorSkills = canonicalSkills(m.skills);
  const mentorGroups = new Set([...mentorSkills].map((n) => SKILLS.find((s) => s.name === n)!.group));
  const matched: string[] = [];
  let c = 0;
  for (const name of need.skills) {
    if (mentorSkills.has(name)) {
      c += 1;
      matched.push(name);
    } else {
      const group = SKILLS.find((s) => s.name === name)?.group;
      if (group && mentorGroups.has(group)) c += 0.5;
    }
  }
  const C = need.skills.length ? c / need.skills.length : 0;

  let D = need.domains.length ? 0 : 0.5;
  for (const d of need.domains) {
    if (m.primaryDomain === d) D = Math.max(D, 1);
    else if (m.domains.includes(d)) D = Math.max(D, 0.5);
  }

  const P = m.alreadyRelated || places >= 2 ? 1 : 0.5;

  const fParts: number[] = [];
  if (need.formats.length) fParts.push(need.formats.filter((f) => m.formats.includes(f)).length / need.formats.length);
  if (need.languages.length) {
    const ml = m.languages.map(normalize);
    fParts.push(need.languages.filter((l) => ml.includes(normalize(l))).length / need.languages.length);
  }
  const F = fParts.length ? fParts.reduce((a, b) => a + b, 0) / fParts.length : 1;

  const sameCity = !!need.city && normalize(need.city) === normalize(m.city);
  const sameCountry = !need.country || normalize(need.country) === normalize(m.country);
  let G = sameCity ? 1 : sameCountry ? 0.5 : 0.3;
  if (need.presentielRequired && !sameCity) G = 0;

  const N = m.ratingCount >= 3 && m.ratingAvg != null ? m.ratingAvg / 5 : 0.8;

  const parts = { C, D, P, F, G, N };
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  const raw = (w.C * C + w.D * D + w.P * P + w.F * F + w.G * G + w.N * N) / total;

  const reasons: string[] = [];
  if (matched.length) reasons.push(`Compétences en lien avec votre besoin : ${matched.join(", ")}`);
  else if (C > 0) reasons.push("Compétences proches de votre besoin");
  if (need.domains.includes(m.primaryDomain as DomainId)) reasons.push(`Expert·e en ${domainLabel(m.primaryDomain)}`);
  if (sameCity) reasons.push(`Même ville : ${m.city}`);
  if (m.ratingCount >= 3 && m.ratingAvg != null) reasons.push(`Très bien noté·e (${fmt1(m.ratingAvg)}/5, ${m.ratingCount} avis)`);
  if (m.alreadyRelated) reasons.push("Déjà en relation avec vous");
  else reasons.push(places >= 2 ? `${places} places disponibles` : "Dernière place disponible");

  return { mentor: m, score: Math.round(raw * 100), parts, matchedSkills: matched, reasons };
}

export function recommend(need: Need, mentors: MentorCandidate[], w: Weights = DEFAULT_WEIGHTS): ScoredMentor[] {
  return mentors
    .map((m) => scoreMentor(need, m, w))
    .filter((x): x is ScoredMentor => x !== null)
    .sort((a, b) => b.score - a.score || b.parts.C - a.parts.C || a.mentor.name.localeCompare(b.mentor.name, "fr"));
}

/** Fusionne la lecture par IA et la lecture par mots-clés (l'IA peut manquer un mot, et inversement). */
export function mergeNeeds(a: Omit<Need, "city" | "country">, b: Partial<Omit<Need, "city" | "country">>) {
  const uniq = <T,>(x: T[]) => [...new Set(x)];
  return {
    domains: uniq([...(b.domains ?? []), ...a.domains]),
    skills: uniq([...(b.skills ?? []), ...a.skills]),
    formats: uniq([...(b.formats ?? []), ...a.formats]),
    languages: uniq([...(b.languages ?? []), ...a.languages]),
    presentielRequired: a.presentielRequired || !!b.presentielRequired,
  };
}
