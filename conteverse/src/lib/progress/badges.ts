import type { ProgressState } from "./types.ts";
import { articleBySlug } from "../../data/articles/index.ts";
import { PASS_RATIO } from "../../data/quizzes.ts";

export interface Badge {
  id: string;
  name: string;
  description: string;
  /** Comment l'obtenir, affiché tant que le badge n'est pas gagné. */
  hint: string;
  icon: string;
  color: "orange" | "vert" | "jaune" | "violet" | "bleu";
  earned: (s: ProgressState) => boolean;
}

const passed = (s: ProgressState, slug: string) => {
  const r = s.quizResults[slug];
  return !!r && r.total > 0 && r.best / r.total >= PASS_RATIO;
};
const passedSlugs = (s: ProgressState) => Object.keys(s.quizResults).filter((k) => passed(s, k));
const readIn = (s: ProgressState, pred: (slug: string) => boolean) => Object.keys(s.articlesRead).filter(pred).length;

export const BADGES: Badge[] = [
  {
    id: "petit-explorateur",
    name: "Petit explorateur",
    description: "Tu as découvert ton premier pays sur la carte de l'Afrique.",
    hint: "Ouvre la fiche d'un pays dans Africa Explorer.",
    icon: "compass",
    color: "orange",
    earned: (s) => Object.keys(s.countries).length >= 1,
  },
  {
    id: "premier-quiz",
    name: "Premier quiz réussi",
    description: "Tu as réussi ton premier quiz. Bravo pour ta lecture attentive !",
    hint: "Réussis un quiz avec au moins 60 % de bonnes réponses.",
    icon: "check-circle",
    color: "vert",
    earned: (s) => passedSlugs(s).length >= 1,
  },
  {
    id: "ambassadeur-guinee",
    name: "Ambassadeur de la Guinée",
    description: "Tu connais bien la Guinée : son histoire, sa géographie et sa culture.",
    hint: "Lis 2 articles sur la Guinée et réussis le quiz « Champion de la Guinée ».",
    icon: "flag",
    color: "orange",
    earned: (s) => readIn(s, (slug) => articleBySlug[slug]?.scope === "GN") >= 2 && passed(s, "quiz-guinee"),
  },
  {
    id: "passionne-histoire",
    name: "Passionné d'histoire",
    description: "Royaumes, empires, indépendances : l'histoire n'a plus de secret pour toi.",
    hint: "Lis 2 articles d'histoire ou réussis le quiz d'histoire africaine.",
    icon: "landmark",
    color: "jaune",
    earned: (s) => readIn(s, (slug) => articleBySlug[slug]?.category === "histoire") >= 2 || passed(s, "quiz-histoire-afrique"),
  },
  {
    id: "explorateur-langues",
    name: "Explorateur des langues",
    description: "Tu sais que l'Afrique parle des centaines de langues.",
    hint: "Lis l'article sur les langues de Guinée ou réussis le quiz des langues.",
    icon: "languages",
    color: "violet",
    earned: (s) => !!s.articlesRead["langues-de-guinee"] || passed(s, "quiz-langues"),
  },
  {
    id: "genie-sciences",
    name: "Génie des sciences",
    description: "Ordinateurs, énergie solaire, mathématiques anciennes : quel esprit scientifique !",
    hint: "Réussis le quiz des sciences ou lis 2 articles de sciences ou d'Afrique de demain.",
    icon: "atom",
    color: "bleu",
    earned: (s) =>
      passed(s, "quiz-sciences") ||
      readIn(s, (slug) => ["sciences", "demain"].includes(articleBySlug[slug]?.category ?? "")) >= 2,
  },
  {
    id: "conteur-en-herbe",
    name: "Conteur en herbe",
    description: "Tu as terminé deux histoires de StoryVerse.",
    hint: "Termine 2 histoires dans StoryVerse.",
    icon: "book-heart",
    color: "violet",
    earned: (s) => Object.keys(s.storiesDone).length >= 2,
  },
  {
    id: "lecteur-curieux",
    name: "Lecteur curieux",
    description: "Cinq articles lus jusqu'au bout. La lecture te fait voyager !",
    hint: "Lis 5 articles de la bibliothèque.",
    icon: "book-open",
    color: "bleu",
    earned: (s) => Object.keys(s.articlesRead).length >= 5,
  },
  {
    id: "grand-voyageur",
    name: "Grand voyageur",
    description: "Tu as exploré les cinq pays de CONTEVERSE.",
    hint: "Découvre les 5 fiches pays : Guinée, Sénégal, Côte d'Ivoire, Mali, Ghana.",
    icon: "plane",
    color: "vert",
    earned: (s) => Object.keys(s.countries).length >= 5,
  },
  {
    id: "oeil-de-lynx",
    name: "Œil de lynx",
    description: "Tu reconnais les drapeaux africains comme un vrai géographe.",
    hint: "Réussis le quiz « Reconnais les drapeaux ».",
    icon: "eye",
    color: "jaune",
    earned: (s) => passed(s, "quiz-drapeaux"),
  },
];

export const badgeById = Object.fromEntries(BADGES.map((b) => [b.id, b])) as Record<string, Badge>;

/** Retourne les identifiants des badges nouvellement gagnés. */
export function newlyEarnedBadges(s: ProgressState): string[] {
  return BADGES.filter((b) => !s.badges[b.id] && b.earned(s)).map((b) => b.id);
}

export { passed as isQuizPassed };
