import type { ContentType, Difficulty, Scope, StoryGenre } from "@/types/content";
import { countryByCode } from "@/data/countries";

export const difficultyLabel: Record<Difficulty, string> = { facile: "Facile", moyen: "Moyen", avance: "Avancé" };
export const contentTypeLabel: Record<ContentType, string> = {
  documentaire: "Documentaire",
  portrait: "Portrait",
  explication: "Explication",
  fiche: "Fiche",
};
export const genreLabel: Record<StoryGenre, string> = {
  conte: "Conte",
  epopee: "Épopée (tradition orale)",
  fiction: "Histoire inventée",
  "recit-historique": "Récit historique",
};
export const scopeLabel = (s: Scope) => (s === "AF" ? "Afrique" : s === "MONDE" ? "Monde" : countryByCode[s].name);
