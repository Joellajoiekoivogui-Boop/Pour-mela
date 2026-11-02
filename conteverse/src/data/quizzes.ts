import type { Quiz, QuizQuestion } from "../types/content.ts";
import { articles } from "./articles/index.ts";
import { stories } from "./stories.ts";
import { frTypo } from "../lib/utils/typo.ts";

const countryQuizzes: Quiz[] = [
  {
    slug: "quiz-guinee",
    title: "Champion de la Guinée",
    description: "Capitale, régions, fleuves, histoire : que sais-tu de la Guinée ?",
    kind: "pays",
    scope: "GN",
    questions: [
      { id: "gn-1", question: "Quelle est la capitale de la Guinée ?", options: ["Kankan", "Conakry", "Labé", "Kindia"], answer: 1, explanation: "Conakry est la capitale, sur la presqu'île de Kaloum et au bord de l'Atlantique." },
      { id: "gn-2", question: "Quelles sont les couleurs du drapeau guinéen, de gauche à droite ?", options: ["Vert, jaune, rouge", "Rouge, jaune, vert", "Orange, blanc, vert", "Rouge, blanc, vert"], answer: 1, explanation: "Rouge, jaune et vert, en bandes verticales." },
      { id: "gn-3", question: "Combien de régions naturelles compte la Guinée ?", options: ["Deux", "Quatre", "Huit", "Douze"], answer: 1, explanation: "Guinée maritime, Moyenne-Guinée, Haute-Guinée et Guinée forestière." },
      { id: "gn-4", question: "Quel est le point culminant de la Guinée ?", options: ["Le mont Nimba", "Le Kilimandjaro", "Le mont Loura", "Le mont Cameroun"], answer: 0, explanation: "Le mont Nimba culmine à environ 1 752 m." },
      { id: "gn-5", question: "Quelle est la devise de la Guinée ?", options: ["Liberté, Égalité, Fraternité", "Travail, Justice, Solidarité", "Un Peuple, Un But, Une Foi", "Union, Discipline, Travail"], answer: 1, explanation: "« Travail, Justice, Solidarité »." },
    ],
  },
  {
    slug: "quiz-senegal",
    title: "Découverte du Sénégal",
    description: "Teranga, Gorée, Dakar : teste tes connaissances sur le Sénégal.",
    kind: "pays",
    scope: "SN",
    questions: [
      { id: "sn-1", question: "Quelle est la capitale du Sénégal ?", options: ["Saint-Louis", "Dakar", "Thiès", "Ziguinchor"], answer: 1, explanation: "Dakar est la capitale." },
      { id: "sn-2", question: "Que veut dire « teranga » ?", options: ["L'hospitalité", "La mer", "Le soleil", "Le marché"], answer: 0, explanation: "La teranga, l'hospitalité, est une valeur centrale au Sénégal." },
      { id: "sn-3", question: "Qui fut le premier président du Sénégal ?", options: ["Léopold Sédar Senghor", "Kwame Nkrumah", "Modibo Keïta", "Félix Houphouët-Boigny"], answer: 0, explanation: "Senghor était aussi un grand poète." },
    ],
  },
  {
    slug: "quiz-cote-ivoire",
    title: "Découverte de la Côte d'Ivoire",
    description: "Cacao, forêts et capitales : en route pour la Côte d'Ivoire.",
    kind: "pays",
    scope: "CI",
    questions: [
      { id: "ci-1", question: "Quelle est la capitale politique de la Côte d'Ivoire ?", options: ["Abidjan", "Yamoussoukro", "Bouaké", "Grand-Bassam"], answer: 1, explanation: "Yamoussoukro est la capitale politique ; Abidjan est la capitale économique." },
      { id: "ci-2", question: "De quelle production la Côte d'Ivoire est-elle championne du monde ?", options: ["Le cacao", "Le blé", "Le pétrole", "Le riz"], answer: 0, explanation: "Elle est le premier producteur mondial de cacao." },
      { id: "ci-3", question: "Quel parc national abrite une grande forêt primaire ?", options: ["Taï", "Djoudj", "Kakum", "Niokolo-Koba"], answer: 0, explanation: "Le parc national de Taï est inscrit au patrimoine mondial." },
    ],
  },
  {
    slug: "quiz-mali",
    title: "Découverte du Mali",
    description: "Empires, fleuve Niger et villes de terre : cap sur le Mali.",
    kind: "pays",
    scope: "ML",
    questions: [
      { id: "ml-1", question: "Quelle est la capitale du Mali ?", options: ["Tombouctou", "Bamako", "Gao", "Mopti"], answer: 1, explanation: "Bamako, sur le fleuve Niger." },
      { id: "ml-2", question: "Quel grand fleuve traverse le Mali ?", options: ["Le Nil", "Le Niger", "Le Congo", "L'Orange"], answer: 1, explanation: "Le Niger forme une grande boucle au Mali." },
      { id: "ml-3", question: "Quelle ville malienne est célèbre pour ses manuscrits ?", options: ["Tombouctou", "Kayes", "Sikasso", "Ségou"], answer: 0, explanation: "Tombouctou conserve des milliers de manuscrits anciens." },
    ],
  },
  {
    slug: "quiz-ghana",
    title: "Découverte du Ghana",
    description: "Kente, cacao et indépendance : explore le Ghana.",
    kind: "pays",
    scope: "GH",
    questions: [
      { id: "gh-1", question: "Quelle est la capitale du Ghana ?", options: ["Kumasi", "Accra", "Tamale", "Lomé"], answer: 1, explanation: "Accra est la capitale." },
      { id: "gh-2", question: "Comment s'appelait le Ghana avant l'indépendance ?", options: ["La Côte-de-l'Or (Gold Coast)", "La Côte d'Ivoire", "Le Soudan français", "La Haute-Volta"], answer: 0, explanation: "La colonie britannique s'appelait Gold Coast." },
      { id: "gh-3", question: "Quelle est la langue officielle du Ghana ?", options: ["Le français", "L'anglais", "Le portugais", "L'arabe"], answer: 1, explanation: "L'anglais, à côté de nombreuses langues ghanéennes." },
    ],
  },
];

const themeQuizzes: Quiz[] = [
  {
    slug: "quiz-drapeaux",
    title: "Reconnais les drapeaux",
    description: "Observe bien les couleurs et les symboles : à quel pays appartient chaque drapeau ?",
    kind: "drapeaux",
    scope: "AF",
    category: "geographie",
    questions: [
      { id: "fl-1", flag: "GN", question: "À quel pays appartient ce drapeau ?", options: ["Mali", "Guinée", "Cameroun", "Sénégal"], answer: 1, explanation: "Rouge, jaune, vert : c'est la Guinée. Attention, le Mali a les mêmes couleurs dans l'ordre inverse !" },
      { id: "fl-2", flag: "ML", question: "À quel pays appartient ce drapeau ?", options: ["Mali", "Guinée", "Tchad", "Ghana"], answer: 0, explanation: "Vert, jaune, rouge : c'est le Mali." },
      { id: "fl-3", flag: "SN", question: "À quel pays appartient ce drapeau ?", options: ["Cameroun", "Sénégal", "Ghana", "Burkina Faso"], answer: 1, explanation: "Vert, jaune, rouge avec une étoile verte : le Sénégal." },
      { id: "fl-4", flag: "GH", question: "À quel pays appartient ce drapeau ?", options: ["Ghana", "Burkina Faso", "Bénin", "Guinée"], answer: 0, explanation: "Bandes horizontales rouge, or, vert et étoile noire : le Ghana." },
      { id: "fl-5", flag: "CI", question: "À quel pays appartient ce drapeau ?", options: ["Niger", "Côte d'Ivoire", "Nigeria", "Guinée"], answer: 1, explanation: "Orange, blanc, vert en bandes verticales : la Côte d'Ivoire." },
      { id: "fl-6", flag: "NE", question: "À quel pays appartient ce drapeau ?", options: ["Côte d'Ivoire", "Inde", "Niger", "Sierra Leone"], answer: 2, explanation: "Orange, blanc, vert en bandes horizontales avec un disque orange : le Niger." },
      { id: "fl-7", flag: "CM", question: "À quel pays appartient ce drapeau ?", options: ["Cameroun", "Sénégal", "Mali", "Togo"], answer: 0, explanation: "Vert, rouge, jaune avec une étoile jaune : le Cameroun." },
      { id: "fl-8", flag: "BJ", question: "À quel pays appartient ce drapeau ?", options: ["Bénin", "Gabon", "Guinée", "Ghana"], answer: 0, explanation: "Une bande verte verticale, puis jaune et rouge : le Bénin." },
    ],
  },
  {
    slug: "quiz-histoire-afrique",
    title: "Voyage dans l'histoire africaine",
    description: "Empires, indépendances et grandes figures du passé.",
    kind: "histoire",
    scope: "AF",
    category: "histoire",
    questions: [
      { id: "hi-1", question: "Quel souverain du Mali fit un célèbre pèlerinage en 1324 ?", options: ["Mansa Moussa", "Samory Touré", "Soumaoro Kanté", "Askia Mohammed"], answer: 0, explanation: "Mansa Moussa traversa le Sahara jusqu'à La Mecque." },
      { id: "hi-2", question: "Quel pays est devenu indépendant le 6 mars 1957 ?", options: ["La Guinée", "Le Ghana", "Le Sénégal", "Le Mali"], answer: 1, explanation: "Le Ghana, sous la conduite de Kwame Nkrumah." },
      { id: "hi-3", question: "Où se trouvait la capitale de l'Imamat du Fouta-Djalon ?", options: ["Timbo", "Kankan", "Conakry", "Tombouctou"], answer: 0, explanation: "Timbo était la capitale de l'Imamat du Fouta-Djalon." },
      { id: "hi-4", question: "Quel chef a longtemps résisté à la conquête coloniale française à la fin du XIXe siècle ?", options: ["Samory Touré", "Kofi Annan", "Camara Laye", "Mory Kanté"], answer: 0, explanation: "Samory Touré fut capturé en 1898." },
      { id: "hi-5", question: "En quelle année a été fondée l'Organisation de l'unité africaine ?", options: ["1900", "1963", "2002", "2020"], answer: 1, explanation: "L'OUA a été fondée en 1963 à Addis-Abeba ; l'Union africaine lui a succédé en 2002." },
    ],
  },
  {
    slug: "quiz-geographie-afrique",
    title: "Géographe de l'Afrique",
    description: "Fleuves, montagnes, déserts et capitales.",
    kind: "geographie",
    scope: "AF",
    category: "geographie",
    questions: [
      { id: "ge-1", question: "Quelle est la plus haute montagne d'Afrique ?", options: ["Le mont Nimba", "Le Kilimandjaro", "Le mont Kenya", "Le Ras Dashen"], answer: 1, explanation: "Le Kilimandjaro, en Tanzanie, culmine à environ 5 895 m." },
      { id: "ge-2", question: "Quel est le plus grand pays d'Afrique par la superficie ?", options: ["Le Nigeria", "L'Algérie", "La Guinée", "L'Égypte"], answer: 1, explanation: "L'Algérie est le plus vaste pays du continent." },
      { id: "ge-3", question: "Quelle est la capitale du Kenya ?", options: ["Nairobi", "Kampala", "Addis-Abeba", "Dodoma"], answer: 0, explanation: "Nairobi est la capitale du Kenya." },
      { id: "ge-4", question: "Quel océan borde la Guinée ?", options: ["L'océan Indien", "L'océan Atlantique", "L'océan Pacifique", "L'océan Arctique"], answer: 1, explanation: "La Guinée a une façade sur l'océan Atlantique." },
    ],
  },
  {
    slug: "quiz-culture-afrique",
    title: "Culture générale africaine",
    description: "Musique, tissus, littérature et patrimoine.",
    kind: "culture",
    scope: "AF",
    category: "cultures",
    questions: [
      { id: "cu-1", question: "Quel instrument possède environ 21 cordes ?", options: ["Le djembé", "La kora", "Le balafon", "Le tam-tam"], answer: 1, explanation: "La kora est la harpe-luth des griots." },
      { id: "cu-2", question: "De quel pays vient le tissu kente ?", options: ["Ghana", "Maroc", "Kenya", "Guinée"], answer: 0, explanation: "Le kente est tissé par les Ashantis et les Éwés." },
      { id: "cu-3", question: "Qui a écrit « L'Enfant noir » ?", options: ["Camara Laye", "Léopold Sédar Senghor", "Amadou Hampâté Bâ", "Bernard Dadié"], answer: 0, explanation: "Camara Laye, écrivain guinéen, en 1953." },
      { id: "cu-4", question: "Quel plat sénégalais est inscrit au patrimoine immatériel de l'UNESCO ?", options: ["Le thiéboudiène", "Le couscous de fonio", "L'attiéké", "Le fufu"], answer: 0, explanation: "Le ceebu jën (thiéboudiène), riz au poisson." },
    ],
  },
  {
    slug: "quiz-personnalites",
    title: "Personnalités qui inspirent",
    description: "Écrivains, scientifiques, dirigeants et militantes.",
    kind: "personnalites",
    scope: "AF",
    category: "personnalites",
    questions: [
      { id: "pe-1", question: "Qui fut la première femme africaine à recevoir le prix Nobel de la paix ?", options: ["Wangari Maathai", "Yaa Asantewaa", "Miriam Makeba", "Ellen Johnson Sirleaf"], answer: 0, explanation: "Wangari Maathai, en 2004." },
      { id: "pe-2", question: "Qui fut secrétaire général des Nations unies de 1997 à 2006 ?", options: ["Kofi Annan", "Kwame Nkrumah", "Nelson Mandela", "Boutros Boutros-Ghali"], answer: 0, explanation: "Le Ghanéen Kofi Annan." },
      { id: "pe-3", question: "Quel écrivain guinéen a reçu le prix Renaudot en 2008 ?", options: ["Tierno Monénembo", "Camara Laye", "Williams Sassine", "Djibril Tamsir Niane"], answer: 0, explanation: "Pour son roman « Le Roi de Kahel »." },
    ],
  },
  {
    slug: "quiz-sciences",
    title: "Petit génie des sciences",
    description: "Ordinateurs, énergie, nature : la science en questions.",
    kind: "sciences",
    scope: "MONDE",
    category: "sciences",
    questions: [
      { id: "sc-1", question: "Quel composant fait les calculs dans un ordinateur ?", options: ["Le processeur", "L'écran", "Le clavier", "Le haut-parleur"], answer: 0, explanation: "Le processeur est le « cerveau » de l'ordinateur." },
      { id: "sc-2", question: "Que fabrique-t-on avec la bauxite ?", options: ["De l'aluminium", "Du verre", "Du papier", "Du chocolat"], answer: 0, explanation: "La bauxite donne l'alumine, puis l'aluminium." },
      { id: "sc-3", question: "Qu'est-ce que l'effet photovoltaïque ?", options: ["La transformation de la lumière en électricité", "La pluie", "La digestion", "Le vent"], answer: 0, explanation: "C'est le principe des panneaux solaires." },
      { id: "sc-4", question: "Pourquoi les arbres aident-ils les sources ?", options: ["Ils aident l'eau à s'infiltrer dans le sol", "Ils boivent toute l'eau", "Ils font fondre la neige", "Ils n'ont aucun effet"], answer: 0, explanation: "Les racines et l'ombre retiennent l'eau et protègent les sols." },
    ],
  },
  {
    slug: "quiz-langues",
    title: "Explorateur des langues",
    description: "Les langues d'Afrique de l'Ouest et leurs écritures.",
    kind: "langues",
    scope: "AF",
    category: "cultures",
    questions: [
      { id: "la-1", question: "Quelle est la langue officielle du Ghana ?", options: ["L'anglais", "Le français", "Le twi", "Le wolof"], answer: 0, explanation: "L'anglais, à côté de nombreuses langues ghanéennes comme le twi." },
      { id: "la-2", question: "Quelle langue est très largement parlée au Sénégal ?", options: ["Le wolof", "Le kissi", "Le zoulou", "Le swahili"], answer: 0, explanation: "Le wolof est la langue la plus parlée au Sénégal." },
      { id: "la-3", question: "Quel alphabet a été créé par Solomana Kanté ?", options: ["Le N'Ko", "Le latin", "Le tifinagh", "Le grec"], answer: 0, explanation: "Le N'Ko, créé en 1949 pour les langues mandingues." },
      { id: "la-4", question: "En Guinée forestière, le loma est aussi appelé…", options: ["Le toma", "Le susu", "Le pular", "Le baga"], answer: 0, explanation: "Le loma est aussi appelé toma." },
    ],
  },
];

const articleQuizzes: Quiz[] = articles.map((a) => ({
  slug: `article-${a.slug}`,
  title: `Quiz : ${a.title}`,
  description: "As-tu bien compris ta lecture ?",
  kind: "article",
  scope: a.scope,
  category: a.category,
  questions: a.quiz,
}));

const storyQuizzes: Quiz[] = stories.map((s) => ({
  slug: `histoire-${s.slug}`,
  title: `Quiz : ${s.title}`,
  description: "As-tu bien suivi l'histoire ?",
  kind: "histoire-lue",
  scope: s.scope,
  category: "litterature",
  questions: s.quiz,
}));

/** Quiz affichés dans l'espace « Africa Challenge ». */
export const challengeQuizzes: Quiz[] = frTypo([...countryQuizzes, ...themeQuizzes]);

export const allQuizzes: Quiz[] = [...challengeQuizzes, ...articleQuizzes, ...storyQuizzes];

export const quizBySlug = Object.fromEntries(allQuizzes.map((q) => [q.slug, q])) as Record<string, Quiz>;

/** Seuil de réussite d'un quiz (proportion de bonnes réponses). */
export const PASS_RATIO = 0.6;

/** Toutes les questions des défis, pour le défi du jour. */
export const questionPool: QuizQuestion[] = challengeQuizzes.flatMap((q) => q.questions);
