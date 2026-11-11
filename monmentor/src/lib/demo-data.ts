// Jeu de données de démonstration : personnes et organisations FICTIVES.
// Tous ces comptes sont marqués is_demo : ils sont exclus des statistiques et
// n'apparaissent publiquement que lorsque DEMO_MODE=true (badge « Démo »).
import type { Slot } from "@/db/schema";

export type DemoMentor = {
  key: string;
  name: string;
  gender: "F" | "M";
  city: string;
  country: string;
  title: string;
  organization: string;
  yearsExperience: number;
  primaryDomain: string;
  domains: string[];
  skills: string[];
  languages: string[];
  formats: string[];
  capacity: number;
  verificationLevel: number;
  slots: Slot[];
  bio: string;
};

export const DEMO_MENTORS: DemoMentor[] = [
  {
    key: "fatoumata", name: "Fatoumata Bangoura", gender: "F", city: "Conakry", country: "Guinée",
    title: "Fondatrice et directrice générale", organization: "Saveurs du Fouta (démo)", yearsExperience: 11,
    primaryDomain: "agri", domains: ["agri", "entrepreneuriat", "finance"],
    skills: ["Transformation agroalimentaire", "Création d'entreprise", "Recherche de financement", "Premiers clients et vente"],
    languages: ["Français", "Pular", "Soussou"], formats: ["visio", "presentiel", "chat"], capacity: 4, verificationLevel: 3,
    slots: [{ day: 2, hour: 18 }, { day: 6, hour: 10 }],
    bio: "J'ai lancé une unité de transformation de fonio et de jus de fruits avec trois personnes. Je partage ce que j'aurais aimé savoir au départ : trouver ses premiers clients, financer ses machines, tenir ses comptes.",
  },
  {
    key: "ibrahima", name: "Ibrahima Sow", gender: "M", city: "Conakry", country: "Guinée",
    title: "Ingénieur en intelligence artificielle", organization: "Laboratoire de données (démo)", yearsExperience: 8,
    primaryDomain: "numerique", domains: ["numerique", "etudes"],
    skills: ["Intelligence artificielle", "Data science", "Portfolio GitHub", "Python"],
    languages: ["Français", "Anglais", "Pular"], formats: ["visio", "chat"], capacity: 3, verificationLevel: 3,
    slots: [{ day: 3, hour: 19 }, { day: 6, hour: 11 }],
    bio: "Formé à Conakry puis en master d'IA à Grenoble. J'aide les étudiants à construire un premier projet d'IA solide et à préparer leur poursuite d'études.",
  },
  {
    key: "mariame", name: "Mariame Touré", gender: "F", city: "Conakry", country: "Guinée",
    title: "Éditrice jeunesse", organization: "Maison d'édition (démo)", yearsExperience: 14,
    primaryDomain: "culture", domains: ["culture"],
    skills: ["Écriture et publication", "Graphisme et design"],
    languages: ["Français", "Soussou"], formats: ["visio", "presentiel"], capacity: 3, verificationLevel: 3,
    slots: [{ day: 4, hour: 17 }],
    bio: "J'accompagne les jeunes auteurs et illustrateurs, du manuscrit au livre imprimé.",
  },
  {
    key: "alseny", name: "Alseny Camara", gender: "M", city: "Paris", country: "France",
    title: "Data scientist, ancien étudiant Campus France", organization: "Cabinet de conseil (démo)", yearsExperience: 6,
    primaryDomain: "etudes", domains: ["etudes", "numerique"],
    skills: ["Dossier Campus France", "Entretien Campus France", "Lettre de motivation", "Data science"],
    languages: ["Français", "Anglais", "Malinké"], formats: ["visio", "chat"], capacity: 4, verificationLevel: 3,
    slots: [{ day: 2, hour: 20 }, { day: 7, hour: 15 }],
    bio: "Arrivé en France en 2018 pour un master, je connais chaque étape du dossier et de l'entretien Campus France.",
  },
  {
    key: "hadja", name: "Hadja Kaba", gender: "F", city: "Conakry", country: "Guinée",
    title: "Conseillère d'orientation", organization: "Centre d'orientation (démo)", yearsExperience: 17,
    primaryDomain: "etudes", domains: ["etudes", "insertion"],
    skills: ["Choix de formation", "Lettre de motivation", "CV"],
    languages: ["Français", "Malinké"], formats: ["visio", "presentiel"], capacity: 5, verificationLevel: 3,
    slots: [{ day: 1, hour: 16 }, { day: 4, hour: 16 }],
    bio: "Je reçois chaque année des centaines de bacheliers et d'étudiants pour construire leur projet d'études.",
  },
  {
    key: "sekouba", name: "Sékouba Kourouma", gender: "M", city: "Kankan", country: "Guinée",
    title: "Expert-comptable associé", organization: "Cabinet comptable (démo)", yearsExperience: 16,
    primaryDomain: "finance", domains: ["finance", "entrepreneuriat"],
    skills: ["Comptabilité", "Statut juridique et fiscalité", "Budget prévisionnel", "Business plan"],
    languages: ["Français", "Malinké"], formats: ["visio", "presentiel"], capacity: 3, verificationLevel: 3,
    slots: [{ day: 5, hour: 18 }],
    bio: "J'aide les jeunes entrepreneurs à choisir leur statut, tenir leurs comptes et bâtir un budget réaliste.",
  },
  {
    key: "aminata", name: "Aminata Diallo", gender: "F", city: "Conakry", country: "Guinée",
    title: "Coach en prise de parole", organization: "Indépendante", yearsExperience: 9,
    primaryDomain: "leadership", domains: ["leadership", "insertion"],
    skills: ["Prise de parole", "Management d'équipe", "Entretien d'embauche"],
    languages: ["Français", "Pular", "Anglais"], formats: ["visio", "presentiel"], capacity: 4, verificationLevel: 3,
    slots: [{ day: 6, hour: 9 }, { day: 6, hour: 10 }],
    bio: "Pitch, entretien, soutenance : on travaille la structure, la voix et le regard jusqu'à ce que ce soit naturel.",
  },
  {
    key: "moussa", name: "Moussa Kéïta", gender: "M", city: "Conakry", country: "Guinée",
    title: "Ingénieur en cybersécurité", organization: "Opérateur télécom (démo)", yearsExperience: 10,
    primaryDomain: "numerique", domains: ["numerique"],
    skills: ["Cybersécurité", "Développement web"],
    languages: ["Français", "Soussou"], formats: ["visio", "chat"], capacity: 2, verificationLevel: 3,
    slots: [{ day: 4, hour: 20 }],
    bio: "Je forme les jeunes développeurs aux bons réflexes de sécurité et aux métiers de la cybersécurité.",
  },
  {
    key: "nenefanta", name: "Néné Fanta Sylla", gender: "F", city: "Conakry", country: "Guinée",
    title: "Responsable des ressources humaines", organization: "Groupe industriel (démo)", yearsExperience: 12,
    primaryDomain: "insertion", domains: ["insertion", "leadership"],
    skills: ["CV", "Entretien d'embauche", "Recherche de stage", "Premier emploi"],
    languages: ["Français", "Soussou", "Anglais"], formats: ["visio", "presentiel", "chat"], capacity: 5, verificationLevel: 3,
    slots: [{ day: 2, hour: 17 }, { day: 5, hour: 17 }],
    bio: "Je recrute depuis douze ans. Je vous montre ce qu'un recruteur lit vraiment dans un CV et attend d'un entretien.",
  },
  {
    key: "ousmane", name: "Ousmane Bah", gender: "M", city: "Labé", country: "Guinée",
    title: "Développeur mobile", organization: "Studio d'applications (démo)", yearsExperience: 5,
    primaryDomain: "numerique", domains: ["numerique", "entrepreneuriat"],
    skills: ["Développement mobile", "Développement web", "Portfolio GitHub"],
    languages: ["Français", "Pular"], formats: ["visio", "chat"], capacity: 3, verificationLevel: 2,
    slots: [{ day: 3, hour: 18 }],
    bio: "J'ai publié quatre applications Android depuis Labé. Je vous aide à passer de l'idée à l'application publiée.",
  },
  {
    key: "kadiatou", name: "Kadiatou Condé", gender: "F", city: "Conakry", country: "Guinée",
    title: "Responsable marketing digital", organization: "Agence de communication (démo)", yearsExperience: 7,
    primaryDomain: "numerique", domains: ["numerique", "entrepreneuriat"],
    skills: ["Marketing digital", "Premiers clients et vente"],
    languages: ["Français", "Soussou"], formats: ["visio", "chat"], capacity: 3, verificationLevel: 2,
    slots: [{ day: 1, hour: 19 }],
    bio: "Réseaux sociaux, publicité en ligne, premiers clients : je partage des méthodes qui marchent avec un petit budget.",
  },
  {
    key: "lansana", name: "Lansana Doumbouya", gender: "M", city: "Conakry", country: "Guinée",
    title: "Agronome", organization: "Coopérative agricole (démo)", yearsExperience: 4,
    primaryDomain: "agri", domains: ["agri"],
    skills: ["Production agricole"],
    languages: ["Français", "Malinké"], formats: ["presentiel"], capacity: 2, verificationLevel: 1,
    slots: [{ day: 6, hour: 8 }],
    bio: "Profil en cours de vérification : il ne doit apparaître ni dans l'annuaire ni dans les recommandations.",
  },
];

export const DEMO_MENTEES = [
  {
    key: "mariama", name: "Mariama Camara", gender: "F" as const, city: "Conakry", birthDate: "2003-05-14",
    situation: "Étudiant·e", domains: ["numerique", "etudes"],
    need: "Je suis en licence 3 d'informatique et je veux poursuivre un master en intelligence artificielle en France. J'ai besoin d'aide pour mon dossier Campus France et pour construire un projet concret à montrer.",
  },
  {
    key: "thierno", name: "Thierno Diallo", gender: "M" as const, city: "Conakry", birthDate: "2001-11-02",
    situation: "Porteur·se de projet", domains: ["entrepreneuriat", "agri"],
    need: "Je veux créer mon entreprise de transformation agricole (jus de mangue) et trouver un financement pour les premières machines.",
  },
  {
    key: "aissata", name: "Aïssata Barry", gender: "F" as const, city: "Kindia", birthDate: "2002-02-20",
    situation: "Jeune diplômé·e", domains: ["insertion"],
    need: "Je viens de finir ma licence en gestion et je cherche mon premier emploi. Je suis timide en entretien.",
  },
];

/** Besoins de référence pour les tests de la recommandation : mentor attendu dans le top 3. */
export const REFERENCE_CASES: { need: string; city?: string; expected: string[] }[] = [
  { need: "Je veux créer mon entreprise de transformation agricole", expected: ["fatoumata"] },
  { need: "Je veux faire un master en IA en France", expected: ["ibrahima", "alseny"] },
  { need: "Je prépare mon entretien Campus France", expected: ["alseny"] },
  { need: "Je cherche un stage et je dois refaire mon CV", expected: ["nenefanta"] },
  { need: "Je suis timide, je dois pitcher mon projet devant un jury", expected: ["aminata"] },
  { need: "Je veux publier mon premier roman", expected: ["mariame"] },
  { need: "Quel statut juridique choisir et comment tenir ma comptabilité ?", expected: ["sekouba"] },
  { need: "Je veux apprendre la cybersécurité", expected: ["moussa"] },
  { need: "Je veux créer une application Android pour les commerçants", expected: ["ousmane"] },
  { need: "Comment trouver mes premiers clients sur les réseaux sociaux ?", expected: ["kadiatou"] },
  { need: "Je finis ma licence et je cherche mon premier emploi", expected: ["nenefanta"] },
  { need: "Je ne sais pas quel master choisir après ma licence", expected: ["hadja", "alseny"] },
  { need: "Je dois écrire ma lettre de motivation pour Campus France", expected: ["alseny", "hadja"] },
  { need: "Je veux construire un projet d'intelligence artificielle pour mon portfolio GitHub", expected: ["ibrahima"] },
  { need: "J'ai besoin d'un business plan et d'un budget prévisionnel pour ma boutique", expected: ["sekouba"] },
  { need: "Je veux lancer mon activité de jus de fruits et trouver des investisseurs", expected: ["fatoumata"] },
  { need: "Je dois présenter mon projet à l'oral et je manque de confiance en moi", expected: ["aminata"] },
  { need: "Je voudrais devenir développeur web", expected: ["moussa", "ousmane"] },
  { need: "J'ai un entretien d'embauche la semaine prochaine dans une banque", expected: ["nenefanta", "aminata"] },
  { need: "Je veux apprendre la data science", expected: ["ibrahima", "alseny"] },
  { need: "Je dessine et je veux devenir illustratrice", expected: ["mariame"] },
  { need: "Comment vendre plus avec un petit budget de publicité en ligne ?", expected: ["kadiatou"] },
  { need: "Je veux transformer le fonio et vendre à Conakry", expected: ["fatoumata"] },
  { need: "Je cherche une alternance en développement mobile", expected: ["ousmane"] },
  { need: "Je veux encadrer une petite équipe pour la première fois", expected: ["aminata"] },
  { need: "Je ne comprends pas les impôts de ma petite entreprise", expected: ["sekouba"] },
  { need: "Je veux étudier à l'étranger mais je ne sais pas par où commencer", expected: ["alseny", "hadja"] },
  { need: "Je veux sécuriser le site internet de mon association", expected: ["moussa"] },
  { need: "Je suis jeune diplômée en gestion, comment trouver du travail ?", expected: ["nenefanta"] },
  { need: "Je veux écrire et éditer un livre pour enfants", expected: ["mariame"] },
];
