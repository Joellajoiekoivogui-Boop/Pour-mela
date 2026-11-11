// Domaines d'accompagnement et référentiel de compétences.
// Le référentiel sert à la fois à lire le besoin d'un jeune et à lire les
// compétences déclarées par les mentors, pour comparer les deux sur la même base.

export const DOMAINS = [
  { id: "etudes", label: "Études à l'étranger", short: "Études" },
  { id: "numerique", label: "Numérique", short: "Numérique" },
  { id: "entrepreneuriat", label: "Entrepreneuriat", short: "Entrepreneuriat" },
  { id: "agri", label: "Agriculture et agroalimentaire", short: "Agriculture" },
  { id: "insertion", label: "Insertion professionnelle", short: "Insertion pro" },
  { id: "finance", label: "Gestion et finance", short: "Finance" },
  { id: "leadership", label: "Leadership et prise de parole", short: "Leadership" },
  { id: "culture", label: "Culture et création", short: "Culture" },
] as const;

export type DomainId = (typeof DOMAINS)[number]["id"];

export const DOMAIN_IDS = DOMAINS.map((d) => d.id) as DomainId[];

export function domainLabel(id: string, short = false): string {
  const d = DOMAINS.find((x) => x.id === id);
  return d ? (short ? d.short : d.label) : id;
}

export function isDomain(id: string): id is DomainId {
  return (DOMAIN_IDS as string[]).includes(id);
}

export type Skill = {
  /** Libellé affiché, aussi utilisé comme identifiant. */
  name: string;
  domain: DomainId;
  /** Compétences voisines : une correspondance vaut alors 0,5 au lieu de 1. */
  group: string;
  /** Expressions déclenchantes, en minuscules et sans accents. */
  patterns: string[];
};

export const SKILLS: Skill[] = [
  // Études à l'étranger
  { name: "Dossier Campus France", domain: "etudes", group: "etudes", patterns: ["campus france", "dossier campus", "etudes en france", "etudier en france", "master en france", "visa etudiant", "etudier a l'etranger", "etudes a l'etranger"] },
  { name: "Entretien Campus France", domain: "etudes", group: "etudes", patterns: ["entretien campus", "entretien pedagogique"] },
  { name: "Lettre de motivation", domain: "etudes", group: "etudes", patterns: ["lettre de motivation", "lettres de motivation", "projet d'etudes"] },
  { name: "Choix de formation", domain: "etudes", group: "etudes", patterns: ["master", "choisir ma formation", "choix de formation", "orientation", "universite", "admission", "bourse d'etudes"] },
  // Numérique
  { name: "Intelligence artificielle", domain: "numerique", group: "data", patterns: ["ia", "intelligence artificielle", "machine learning", "apprentissage automatique", "deep learning", "modele de langue"] },
  { name: "Data science", domain: "numerique", group: "data", patterns: ["data", "donnees", "analyse de donnees", "data science", "statistiques"] },
  { name: "Développement web", domain: "numerique", group: "dev", patterns: ["developpement web", "site web", "site internet", "react", "javascript", "programmation", "programmer", "coder", "developpeur", "developpeuse", "application web"] },
  { name: "Développement mobile", domain: "numerique", group: "dev", patterns: ["application mobile", "appli mobile", "developpement mobile", "android", "flutter", "ios"] },
  { name: "Portfolio GitHub", domain: "numerique", group: "dev", patterns: ["portfolio", "github", "projet a montrer", "projet concret"] },
  { name: "Cybersécurité", domain: "numerique", group: "secu", patterns: ["cybersecurite", "cyber", "securite informatique", "piratage", "hacking"] },
  { name: "Marketing digital", domain: "numerique", group: "marketing", patterns: ["marketing", "reseaux sociaux", "communication digitale", "community manager", "publicite en ligne"] },
  // Entrepreneuriat
  { name: "Création d'entreprise", domain: "entrepreneuriat", group: "creation", patterns: ["creer mon entreprise", "creer une entreprise", "creation d'entreprise", "lancer mon activite", "lancer mon entreprise", "lancer une activite", "monter mon entreprise", "startup", "start-up", "entreprendre", "entrepreneur", "entrepreneuse", "mon entreprise", "ma propre entreprise"] },
  { name: "Business plan", domain: "entrepreneuriat", group: "creation", patterns: ["business plan", "plan d'affaires", "modele economique"] },
  { name: "Recherche de financement", domain: "entrepreneuriat", group: "creation", patterns: ["financement", "financer", "investisseur", "investisseurs", "subvention", "levee de fonds", "pret bancaire", "microcredit"] },
  { name: "Premiers clients et vente", domain: "entrepreneuriat", group: "creation", patterns: ["premier client", "premiers clients", "vendre", "ventes", "prospection", "commercial", "commerciale"] },
  // Agriculture
  { name: "Transformation agroalimentaire", domain: "agri", group: "agri", patterns: ["transformation agricole", "transformation agroalimentaire", "agroalimentaire", "agro", "transformer des fruits", "jus de fruits", "fonio", "manioc", "mangue", "karite", "huile de palme"] },
  { name: "Production agricole", domain: "agri", group: "agri", patterns: ["agricole", "agriculture", "agriculteur", "maraichage", "elevage", "aviculture", "plantation", "cultiver", "ferme"] },
  // Insertion professionnelle
  { name: "CV", domain: "insertion", group: "emploi", patterns: ["cv", "curriculum"] },
  { name: "Entretien d'embauche", domain: "insertion", group: "emploi", patterns: ["entretien d'embauche", "entretien de recrutement", "entretien d'emploi", "recruteur", "recrutement"] },
  { name: "Recherche de stage", domain: "insertion", group: "emploi", patterns: ["stage", "stagiaire", "alternance"] },
  { name: "Premier emploi", domain: "insertion", group: "emploi", patterns: ["premier emploi", "trouver un emploi", "trouver du travail", "chercher un emploi", "recherche d'emploi", "job", "embauche", "jeune diplome", "jeune diplomee"] },
  // Finance
  { name: "Comptabilité", domain: "finance", group: "compta", patterns: ["comptabilite", "comptable", "bilan", "tenue des comptes"] },
  { name: "Statut juridique et fiscalité", domain: "finance", group: "compta", patterns: ["statut juridique", "impots", "fiscalite", "rccm", "enregistrer mon entreprise", "formaliser"] },
  { name: "Budget prévisionnel", domain: "finance", group: "compta", patterns: ["budget", "previsionnel", "tresorerie", "rentabilite"] },
  // Leadership
  { name: "Prise de parole", domain: "leadership", group: "parole", patterns: ["prise de parole", "parler en public", "oral", "pitch", "pitcher", "timide", "timidite", "confiance en moi", "presenter mon projet"] },
  { name: "Management d'équipe", domain: "leadership", group: "management", patterns: ["leadership", "manager", "management", "diriger une equipe", "gerer une equipe", "chef d'equipe"] },
  // Culture
  { name: "Écriture et publication", domain: "culture", group: "ecriture", patterns: ["ecrire", "ecriture", "livre", "roman", "publier", "edition", "editeur", "auteur", "autrice", "poesie"] },
  { name: "Graphisme et design", domain: "culture", group: "design", patterns: ["graphisme", "graphiste", "design", "illustration", "illustrateur", "illustratrice", "dessin", "dessine", "dessiner"] },
  { name: "Audiovisuel et musique", domain: "culture", group: "audiovisuel", patterns: ["musique", "video", "audiovisuel", "cinema", "photo", "photographie"] },
];

/** Mots qui signalent un domaine sans désigner une compétence précise. */
export const DOMAIN_KEYWORDS: Record<DomainId, string[]> = {
  etudes: ["etudes", "etudiant", "etudiante", "licence", "doctorat", "france", "canada", "belgique", "etranger"],
  numerique: ["informatique", "numerique", "digital", "tech", "logiciel", "internet"],
  entrepreneuriat: ["entreprise", "business", "commerce", "projet d'entreprise", "activite"],
  agri: ["agriculture", "agricole", "agro", "rural"],
  insertion: ["emploi", "travail", "carriere", "reconversion", "metier"],
  finance: ["finance", "argent", "gestion", "comptes"],
  leadership: ["leadership", "confiance", "communication"],
  culture: ["culture", "artiste", "art", "creation", "creatif", "creative"],
};

export function skillByName(name: string): Skill | undefined {
  return SKILLS.find((s) => s.name === name);
}

export const LANGUAGES = ["Français", "Anglais", "Soussou", "Pular", "Malinké", "Kissi", "Guerzé", "Toma"] as const;

export const FORMATS = [
  { id: "visio", label: "Visio" },
  { id: "chat", label: "Chat" },
  { id: "presentiel", label: "Présentiel" },
] as const;
