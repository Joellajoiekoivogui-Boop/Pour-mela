import { articles } from "../../data/articles/index.ts";
import type { Article } from "../../types/content.ts";

export type AgeLevel = "7-9" | "10-12";

export interface LumoAnswer {
  text: string;
  /** Articles CONTEVERSE à lire pour aller plus loin. */
  suggestions: { slug: string; title: string }[];
  mode: "demo" | "ai" | "safety";
  /** Vrai si la réponse ne s'appuie sur aucun contenu vérifié. */
  uncertain?: boolean;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9' ]/g, " ");

const STOP = new Set(
  "le la les un une des de du d l et ou a au aux en est ce qui que quoi qu comment pourquoi quel quelle quels quelles combien c s se sa son ses il elle on je tu ma mon me te pour par sur dans avec pas plus tres bien faire fait sont etait etre avoir".split(" "),
);

export const keywords = (s: string) => normalize(s).split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

/** Réponses prédéfinies et vérifiées pour les questions les plus fréquentes. */
interface Canned {
  triggers: string[][]; // chaque groupe : tous les mots doivent être présents
  short: string; // 7-9 ans
  long: string; // 10-12 ans
  articles: string[];
}

const CANNED: Canned[] = [
  {
    triggers: [["guinee", "appelle"], ["nom", "guinee"], ["pourquoi", "guinee"]],
    short:
      "Le mot « Guinée » était utilisé par les navigateurs européens, dès le XVe siècle, pour parler de la côte de l'Afrique de l'Ouest. Personne ne sait exactement d'où vient ce mot : les chercheurs ont plusieurs idées, mais aucune n'est prouvée.",
    long:
      "À partir du XVe siècle, les navigateurs portugais puis d'autres Européens appellent « Guinée » une grande partie de la côte ouest-africaine — d'où le nom du golfe de Guinée. La colonie française a ensuite pris le nom de « Guinée française », et le pays indépendant a gardé « Guinée » en 1958. L'origine exacte du mot est discutée : une hypothèse le relie à une expression berbère signifiant « pays des Noirs », une autre au nom de la ville de Djenné. Aucune n'est prouvée.",
    articles: ["pourquoi-nom-guinee", "independance-guinee-1958"],
  },
  {
    triggers: [["soundiata"], ["sundiata"], ["sunjata"]],
    short:
      "Soundiata Keïta est, selon la tradition orale, le fondateur de l'Empire du Mali au XIIIe siècle. Les griots racontent qu'enfant, il ne pouvait pas marcher, puis qu'il se leva et devint un grand chef. Il vainquit le roi Soumaoro Kanté à la bataille de Kirina.",
    long:
      "Soundiata Keïta est le fondateur de l'Empire du Mali au XIIIe siècle. Son histoire nous vient surtout de l'épopée mandingue transmise par les griots : on y raconte son enfance difficile, son exil, puis sa victoire sur Soumaoro Kanté, roi du Sosso, à la bataille de Kirina (traditionnellement datée vers 1235). L'épopée mêle histoire et merveilleux : Soundiata a bien existé, mais tous les épisodes ne sont pas des faits prouvés.",
    articles: ["empire-du-mali-soundiata", "sosso-bala"],
  },
  {
    triggers: [["fouta"], ["foutah"], ["djallon"], ["djalon"]],
    short:
      "Le Fouta-Djalon est une région de plateaux et de montagnes au centre de la Guinée. On l'appelle le « château d'eau de l'Afrique de l'Ouest », parce que de grands fleuves y prennent leur source, comme la Gambie et le Sénégal.",
    long:
      "Le Fouta-Djalon est un massif de hauts plateaux de grès en Moyenne-Guinée, avec des villes comme Labé, Mamou, Pita et Dalaba. Très arrosé, il est surnommé le « château d'eau de l'Afrique de l'Ouest » : la Gambie et le Bafing (branche principale du fleuve Sénégal) y naissent, et le Niger prend sa source dans les hauteurs guinéennes voisines. C'est aussi une région d'histoire, avec l'Imamat du Fouta-Djalon fondé au XVIIIe siècle, dont Timbo était la capitale.",
    articles: ["fouta-djalon-chateau-eau", "quatre-regions-naturelles"],
  },
  {
    triggers: [["combien", "pays", "afrique"], ["nombre", "pays", "afrique"]],
    short: "L'Afrique compte 54 pays membres de l'Organisation des Nations unies. C'est le deuxième plus grand continent du monde !",
    long:
      "On compte 54 États africains membres de l'ONU. Sur les cartes, on voit aussi le Sahara occidental, un territoire dont le statut n'est pas réglé. Les pays africains sont réunis dans l'Union africaine, créée en 2002 pour succéder à l'Organisation de l'unité africaine (fondée en 1963).",
    articles: ["afrique-54-pays"],
  },
  {
    triggers: [["ordinateur"], ["processeur"], ["binaire"]],
    short:
      "Un ordinateur reçoit des informations (clavier, souris), les calcule avec son processeur, puis montre le résultat (écran, son). À l'intérieur, tout est écrit avec seulement deux chiffres : 0 et 1 !",
    long:
      "Un ordinateur fonctionne en trois étapes : l'entrée (clavier, écran tactile, micro), le traitement par le processeur qui fait des milliards de calculs par seconde, et la sortie (écran, haut-parleur). La mémoire vive sert au travail du moment, le stockage garde les fichiers. Tout est codé en binaire, avec des 0 et des 1 représentés par des milliards de minuscules interrupteurs appelés transistors.",
    articles: ["comment-fonctionne-un-ordinateur"],
  },
  {
    triggers: [["independance", "guinee"], ["1958"], ["sekou", "toure"]],
    short:
      "La Guinée est devenue indépendante le 2 octobre 1958, après avoir voté « non » au référendum proposé par la France le 28 septembre. Ahmed Sékou Touré est devenu le premier président.",
    long:
      "Le 28 septembre 1958, les Guinéens votent massivement « non » au référendum qui proposait de rester dans une Communauté avec la France. La Guinée proclame son indépendance le 2 octobre 1958 : c'est la première colonie française d'Afrique subsaharienne à devenir indépendante. Ahmed Sékou Touré en devient le premier président, jusqu'en 1984. Son régime a aussi été marqué par une forte répression, que les historiens étudient.",
    articles: ["independance-guinee-1958"],
  },
  {
    triggers: [["capitale", "guinee"]],
    short: "La capitale de la Guinée est Conakry, une ville au bord de l'océan Atlantique.",
    long: "La capitale de la Guinée est Conakry. La ville est née sur l'île de Tombo et s'étend sur la presqu'île de Kaloum, au bord de l'océan Atlantique. C'est aussi le principal port du pays.",
    articles: ["quatre-regions-naturelles"],
  },
  {
    triggers: [["mansa", "moussa"], ["mansa", "musa"]],
    short: "Mansa Moussa était un souverain de l'Empire du Mali au XIVe siècle. En 1324, il fit un pèlerinage à La Mecque avec tellement d'or que tout le monde en parla !",
    long:
      "Mansa Moussa a régné sur l'Empire du Mali au XIVe siècle. Son pèlerinage à La Mecque, en 1324, est resté célèbre : des auteurs de l'époque racontent qu'il distribua tant d'or au Caire que le prix de ce métal y baissa. Il a aussi développé Tombouctou comme centre d'études.",
    articles: ["empire-du-mali-soundiata", "tombouctou-djenne"],
  },
];

export function findCanned(question: string, level: AgeLevel): LumoAnswer | null {
  const n = normalize(question);
  const words = new Set(n.split(/\s+/));
  const has = (w: string) => words.has(w) || n.includes(w);
  for (const c of CANNED) {
    if (c.triggers.some((group) => group.every(has))) {
      return {
        text: level === "7-9" ? c.short : c.long,
        suggestions: c.articles.map((slug) => ({ slug, title: articles.find((a) => a.slug === slug)?.title ?? slug })),
        mode: "demo",
      };
    }
  }
  return null;
}

function articleText(a: Article) {
  return [a.title, a.intro, ...(a.tags ?? []), ...a.sections.flatMap((s) => [s.heading, ...s.paragraphs]), ...a.glossary.map((g) => g.word)].join(" ");
}

/** Recherche simple par mots-clés dans les contenus vérifiés. */
export function searchArticles(question: string, limit = 3): { article: Article; score: number }[] {
  const kws = keywords(question);
  if (!kws.length) return [];
  return articles
    .map((article) => {
      const title = normalize(article.title + " " + (article.tags ?? []).join(" "));
      const body = normalize(articleText(article));
      let score = 0;
      for (const k of kws) {
        if (title.includes(k)) score += 3;
        else if (body.includes(k)) score += 1;
      }
      return { article, score };
    })
    .filter((r) => r.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Cherche un mot du glossaire (« que veut dire… », « c'est quoi… »). */
export function findDefinition(question: string): { word: string; definition: string; slug: string } | null {
  const n = normalize(question);
  for (const a of articles)
    for (const g of a.glossary) {
      const w = normalize(g.word).trim();
      if (w.length > 3 && new RegExp(`\\b${w}s?\\b`).test(n)) return { word: g.word, definition: g.definition, slug: a.slug };
    }
  return null;
}

/** Réponse du mode démonstration : uniquement à partir des contenus CONTEVERSE. */
export function demoAnswer(question: string, level: AgeLevel): LumoAnswer {
  const canned = findCanned(question, level);
  if (canned) return canned;

  const def = findDefinition(question);
  if (def && /(veut dire|signifie|definition|c'est quoi|c est quoi|qu'est-ce|explique)/.test(normalize(question)))
    return {
      text: `« ${def.word} » : ${def.definition} Tu trouveras ce mot dans un article de la bibliothèque.`,
      suggestions: [{ slug: def.slug, title: articles.find((a) => a.slug === def.slug)?.title ?? def.slug }],
      mode: "demo",
    };

  const hits = searchArticles(question);
  if (hits.length) {
    const top = hits[0].article;
    return {
      text: `Bonne question ! Voici ce que dit CONTEVERSE : ${top.intro} Lis l'article pour en savoir plus, puis teste-toi avec le quiz.`,
      suggestions: hits.map((h) => ({ slug: h.article.slug, title: h.article.title })),
      mode: "demo",
    };
  }
  return {
    text: "Je n'ai pas encore de réponse vérifiée à cette question, et je préfère ne pas inventer. Tu peux la poser à ton enseignant ou chercher dans un livre. En attendant, explore la bibliothèque ou essaie une question sur la Guinée, l'histoire africaine ou les sciences !",
    suggestions: [],
    mode: "demo",
    uncertain: true,
  };
}

/** Extraits de contenus vérifiés fournis au modèle de langage (RAG simple). */
export function contextFor(question: string): string {
  const hits = searchArticles(question, 3);
  return hits
    .map(({ article }) =>
      [
        `### ${article.title} (statut : ${article.status === "verifie" ? "vérifié" : "à valider"})`,
        article.intro,
        ...article.sections.map((s) => `${s.heading} : ${s.paragraphs.join(" ")}${s.uncertainty ? ` [Incertitude : ${s.uncertainty}]` : ""}`),
      ].join("\n"),
    )
    .join("\n\n");
}
