// Modèle de contenu CONTEVERSE.
// Ces types décrivent le catalogue local (src/data) ; le schéma Supabase
// (supabase/migrations) en reprend la structure pour la version connectée.

export type CategorySlug =
  | "histoire"
  | "cultures"
  | "geographie"
  | "sciences"
  | "nature"
  | "musique"
  | "litterature"
  | "sports"
  | "economie"
  | "monuments"
  | "personnalites"
  | "demain";

/** Pays disposant d'une fiche complète dans le MVP. */
export type CountryCode = "GN" | "SN" | "CI" | "ML" | "GH";
/** Portée d'un contenu : un pays, ou l'Afrique entière / un sujet général. */
export type Scope = CountryCode | "AF" | "MONDE";

export type Difficulty = "facile" | "moyen" | "avance";
export type ContentType = "documentaire" | "portrait" | "explication" | "fiche";

/**
 * Statut éditorial.
 * - "verifie" : faits largement établis, sources indiquées ; relecture par un
 *   comité pédagogique local encore recommandée avant publication officielle.
 * - "a-valider" : contient des éléments (traductions, détails régionaux…)
 *   qui doivent être validés par des spécialistes ou des locuteurs.
 */
export type EditorialStatus = "verifie" | "a-valider";

export type SceneName =
  | "savane"
  | "fouta"
  | "foret"
  | "mer"
  | "ville"
  | "sahel"
  | "nuit"
  | "montagne"
  | "fleuve"
  | "monument"
  | "techno"
  | "musique";

export interface Source {
  title: string;
  publisher?: string;
  url?: string;
  note?: string;
}

export interface GlossaryItem {
  word: string;
  definition: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  /** Index de la bonne réponse dans options. */
  answer: number;
  explanation: string;
  /** Pour les quiz de drapeaux : code du drapeau à afficher. */
  flag?: string;
}

export type QuizKind =
  | "pays"
  | "histoire"
  | "drapeaux"
  | "geographie"
  | "culture"
  | "personnalites"
  | "sciences"
  | "langues"
  | "article"
  | "histoire-lue";

export interface Quiz {
  slug: string;
  title: string;
  description: string;
  kind: QuizKind;
  scope: Scope;
  category?: CategorySlug;
  questions: QuizQuestion[];
}

export interface ArticleSection {
  heading: string;
  paragraphs: string[];
  /** Petits encadrés « Le savais-tu ? ». */
  didYouKnow?: string;
  /** Mention d'incertitude ou de débat entre historiens. */
  uncertainty?: string;
}

export interface Article {
  slug: string;
  title: string;
  category: CategorySlug;
  scope: Scope;
  difficulty: Difficulty;
  ageMin: number;
  ageMax: number;
  readingMinutes: number;
  contentType: ContentType;
  scene: SceneName;
  intro: string;
  sections: ArticleSection[];
  glossary: GlossaryItem[];
  sources: Source[];
  status: EditorialStatus;
  validationNote?: string;
  quiz: QuizQuestion[];
  related?: string[];
  tags?: string[];
}

export interface Category {
  slug: CategorySlug;
  name: string;
  short: string;
  description: string;
  icon: string; // nom d'icône lucide (voir components/ui/CategoryIcon)
  color: ColorToken;
  scene: SceneName;
}

export type ColorToken = "orange" | "vert" | "jaune" | "violet" | "bleu";

export interface FlagSpec {
  orientation: "vertical" | "horizontal" | "benin";
  stripes: string[];
  emblem?: { shape: "star" | "circle"; color: string };
}

export interface Personality {
  name: string;
  role: string;
}

export interface CountrySheet {
  code: CountryCode;
  name: string;
  capital: string;
  flagNote: string;
  location: string;
  population: string;
  currency: string;
  officialLanguage: string;
  motto?: string;
  independence?: { date: string; text: string };
  history: string[];
  languages: string[];
  cultures: string[];
  personalities: Personality[];
  heritage: string[];
  nature: string[];
  economy: string[];
  sciences: string[];
  funFact: string;
  articles: string[];
  quizSlug: string;
  sources: Source[];
  status: EditorialStatus;
  validationNote?: string;
  color: ColorToken;
}

export interface StoryChoice {
  label: string;
  next: string;
}

export interface StoryNode {
  id: string;
  paragraphs: string[];
  scene?: SceneName;
  choices?: StoryChoice[];
  ending?: { title: string; message: string };
}

export type StoryGenre = "conte" | "epopee" | "fiction" | "recit-historique";

export interface Story {
  slug: string;
  title: string;
  genre: StoryGenre;
  /** Avertissement affiché en tête : conte, légende ou fait historique. */
  disclaimer: string;
  scope: Scope;
  ageMin: number;
  readingMinutes: number;
  scene: SceneName;
  summary: string;
  interactive: boolean;
  start: string;
  nodes: Record<string, StoryNode>;
  quiz: QuizQuestion[];
  credits: string;
  sources?: Source[];
}
