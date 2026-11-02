export type AvatarId = "awa" | "kofi" | "mariama" | "sekou" | "zara" | "ibrahim";
export type AgeGroup = "7-9" | "10-12";

export interface LearnerProfile {
  pseudo: string;
  avatar: AvatarId;
  ageGroup: AgeGroup;
}

export interface QuizResult {
  best: number;
  total: number;
  attempts: number;
  lastAt: string;
}

/**
 * État de progression d'un apprenant. Volontairement minimal : aucun nom
 * réel, aucune date de naissance, aucune localisation.
 */
export interface ProgressState {
  version: 1;
  profile: LearnerProfile | null;
  articlesRead: Record<string, string>;
  storiesDone: Record<string, { at: string; ending: string }>;
  quizResults: Record<string, QuizResult>;
  countries: Record<string, string>;
  badges: Record<string, string>;
  dailyDone: Record<string, number>;
  /** Secondes de lecture active par jour (AAAA-MM-JJ). */
  readingSeconds: Record<string, number>;
}

export const emptyProgress = (): ProgressState => ({
  version: 1,
  profile: null,
  articlesRead: {},
  storiesDone: {},
  quizResults: {},
  countries: {},
  badges: {},
  dailyDone: {},
  readingSeconds: {},
});
