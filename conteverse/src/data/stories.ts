import type { Story } from "../types/content.ts";
import { frTypo } from "../lib/utils/typo.ts";

// Toutes les histoires ci-dessous sont des textes ORIGINAUX écrits pour
// CONTEVERSE. Les récits inspirés de traditions orales sont réécrits avec nos
// propres mots et clairement présentés comme des contes ou des épopées.

export const stories: Story[] = frTypo<Story[]>([
  {
    slug: "le-secret-de-la-source",
    title: "Le secret de la source",
    genre: "fiction",
    disclaimer: "Histoire inventée. Les paysages du Fouta-Djalon et le rôle de ses sources, eux, sont bien réels.",
    scope: "GN",
    ageMin: 7,
    readingMinutes: 6,
    scene: "fouta",
    summary: "Près de Labé, Aïssatou remarque que le ruisseau du village s'affaiblit. Elle décide de remonter jusqu'à la source. C'est toi qui choisis son chemin !",
    interactive: true,
    start: "debut",
    credits: "Texte original CONTEVERSE.",
    nodes: {
      debut: {
        id: "debut",
        scene: "fouta",
        paragraphs: [
          "Chaque matin, Aïssatou, dix ans, va chercher de l'eau au ruisseau qui coule près de son village, non loin de Labé.",
          "Mais ce matin, l'eau ne chante plus : elle murmure à peine entre les pierres. « Pourquoi le ruisseau devient-il si petit ? » se demande-t-elle.",
          "Sa grand-mère lui répond : « Le ruisseau naît là-haut, sur le plateau. Va voir la source, et tu comprendras. »",
        ],
        choices: [
          { label: "Prendre le sentier des cascades", next: "cascades" },
          { label: "Demander à son ami Mamadou de l'accompagner", next: "mamadou" },
        ],
      },
      cascades: {
        id: "cascades",
        scene: "fleuve",
        paragraphs: [
          "Aïssatou grimpe le long des cascades. L'air devient plus frais, les fougères brillent de rosée.",
          "Au détour du chemin, elle découvre une colline toute noire : un feu de brousse a brûlé les arbres. Sans leurs racines, la terre s'est envolée avec la pluie.",
        ],
        choices: [
          { label: "Continuer jusqu'à la source", next: "source" },
          { label: "Redescendre prévenir le village", next: "village" },
        ],
      },
      mamadou: {
        id: "mamadou",
        scene: "savane",
        paragraphs: [
          "Mamadou adore les cartes. Il dessine le chemin sur un cahier : « Si on suit le ruisseau vers l'amont, on arrivera forcément à la source ! »",
          "En marchant, ils comptent les arbres. Plus ils montent, moins il y en a. « Regarde, dit Mamadou, ici, le sol est tout sec et craquelé. »",
        ],
        choices: [
          { label: "Noter tout dans le cahier et continuer", next: "source" },
          { label: "Interroger un vieil éleveur sur le chemin", next: "eleveur" },
        ],
      },
      eleveur: {
        id: "eleveur",
        scene: "fouta",
        paragraphs: [
          "Un vieil éleveur fait boire ses vaches. Il leur raconte : « Quand j'étais petit, cette colline était une forêt. La forêt gardait la pluie comme une éponge, et la source coulait toute l'année. »",
          "Aïssatou comprend : les arbres sont les gardiens de l'eau.",
        ],
        choices: [{ label: "Aller jusqu'à la source", next: "source" }],
      },
      source: {
        id: "source",
        scene: "foret",
        paragraphs: [
          "Enfin, voici la source : un mince filet d'eau sort de la roche, à l'ombre de quelques arbres survivants.",
          "Aïssatou pose la main dans l'eau glacée. Cette petite source nourrit son ruisseau, qui rejoint une rivière, qui rejoint un fleuve qui traverse plusieurs pays. « Tout commence ici », murmure-t-elle.",
        ],
        choices: [{ label: "Rentrer avec une idée", next: "village" }],
      },
      village: {
        id: "village",
        scene: "savane",
        paragraphs: [
          "Au village, Aïssatou raconte tout. Les enfants de l'école décident de planter des arbres autour de la source avant la saison des pluies, et les adultes s'organisent pour éviter les feux de brousse.",
        ],
        choices: [
          { label: "Planter des arbres avec l'école", next: "fin-arbres" },
          { label: "Écrire un poème pour la radio locale", next: "fin-radio" },
        ],
      },
      "fin-arbres": {
        id: "fin-arbres",
        scene: "foret",
        paragraphs: ["Les années passent. Les jeunes arbres grandissent, et le ruisseau se remet doucement à chanter."],
        ending: { title: "Gardienne de la source", message: "Tu as compris que les arbres protègent l'eau. Le Fouta-Djalon est le « château d'eau » de l'Afrique de l'Ouest : le protéger aide des millions de personnes." },
      },
      "fin-radio": {
        id: "fin-radio",
        scene: "ville",
        paragraphs: ["Le poème d'Aïssatou passe à la radio. Dans d'autres villages, des enfants l'entendent et plantent eux aussi des arbres."],
        ending: { title: "La voix de l'eau", message: "Les mots peuvent changer les choses ! Lire et écrire, c'est aussi agir pour sa communauté." },
      },
    },
    quiz: [
      {
        id: "src-1",
        question: "Pourquoi le ruisseau d'Aïssatou devient-il plus petit ?",
        options: ["Parce que les arbres autour de la source ont disparu", "Parce qu'il neige", "Parce que la mer est trop loin", "Parce que les vaches boivent tout"],
        answer: 0,
        explanation: "Sans arbres, la pluie ruisselle au lieu de s'infiltrer, et la source s'affaiblit.",
      },
      {
        id: "src-2",
        question: "Cette histoire est…",
        options: ["une histoire inventée qui parle d'un vrai problème", "un document historique", "une légende ancienne"],
        answer: 0,
        explanation: "Aïssatou est un personnage inventé, mais la protection des sources est un vrai enjeu.",
      },
    ],
  },
  {
    slug: "le-lievre-et-la-calebasse-de-sagesse",
    title: "Le lièvre et la calebasse de sagesse",
    genre: "conte",
    disclaimer: "Conte. Ce récit est une création originale CONTEVERSE, inspirée de la grande tradition ouest-africaine des contes du lièvre malin. Ce n'est pas un fait réel.",
    scope: "AF",
    ageMin: 7,
    readingMinutes: 4,
    scene: "savane",
    summary: "Le lièvre veut garder toute la sagesse du monde pour lui seul. Mais la sagesse a-t-elle envie d'être enfermée ?",
    interactive: true,
    start: "debut",
    credits: "Texte original CONTEVERSE, inspiré des contes traditionnels de lièvre d'Afrique de l'Ouest.",
    nodes: {
      debut: {
        id: "debut",
        scene: "savane",
        paragraphs: [
          "Il était une fois, dans la savane, un lièvre très malin qui voulait devenir le plus sage de tous les animaux.",
          "Un jour, il trouve une calebasse magique. Une voix en sort : « Je contiens toute la sagesse du monde. Que veux-tu faire de moi ? »",
        ],
        choices: [
          { label: "La cacher en haut du grand baobab", next: "baobab" },
          { label: "La montrer aux autres animaux", next: "partage" },
        ],
      },
      baobab: {
        id: "baobab",
        scene: "savane",
        paragraphs: [
          "Le lièvre attache la calebasse devant son ventre et essaie de grimper au baobab. Mais la calebasse le gêne : il glisse, tombe, recommence.",
          "Un petit margouillat le regarde et rit : « Lièvre, pourquoi ne la mets-tu pas sur ton dos ? Tu grimperais facilement ! »",
        ],
        choices: [
          { label: "Écouter le margouillat", next: "lecon" },
          { label: "Se vexer et continuer seul", next: "chute" },
        ],
      },
      chute: {
        id: "chute",
        scene: "savane",
        paragraphs: [
          "Le lièvre, vexé, refuse le conseil. Il grimpe encore… et la calebasse se brise au pied de l'arbre ! La sagesse s'envole et se pose un peu partout : sur l'oiseau, l'éléphant, la fourmi et le margouillat.",
        ],
        ending: { title: "La sagesse éparpillée", message: "Personne ne possède toute la sagesse : chacun en a un peu. Écouter les autres, même les plus petits, rend plus sage." },
      },
      lecon: {
        id: "lecon",
        scene: "savane",
        paragraphs: [
          "Le lièvre s'arrête. « Ce petit margouillat vient de me donner un conseil que je n'avais pas trouvé… Alors je ne possède pas toute la sagesse ! »",
          "Il redescend et ouvre la calebasse devant tous les animaux.",
        ],
        choices: [{ label: "Voir ce qui se passe", next: "partage" }],
      },
      partage: {
        id: "partage",
        scene: "nuit",
        paragraphs: [
          "Le soir, autour du feu, chaque animal pose une question à la calebasse, et chacun raconte aussi ce qu'il sait : l'oiseau parle du ciel, la tortue du temps qui passe, la fourmi du travail en équipe.",
          "La calebasse se met à briller : plus on partage la sagesse, plus elle grandit !",
        ],
        ending: { title: "La sagesse partagée", message: "Le savoir grandit quand on le partage. C'est pour cela qu'on raconte des contes et qu'on écrit des livres." },
      },
    },
    quiz: [
      {
        id: "lie-1",
        question: "Quelle est la leçon de ce conte ?",
        options: ["La sagesse grandit quand on la partage", "Il faut toujours grimper aux arbres", "Les lièvres sont méchants"],
        answer: 0,
        explanation: "Personne ne possède toute la sagesse ; on apprend les uns des autres.",
      },
      {
        id: "lie-2",
        question: "Qui donne un conseil au lièvre ?",
        options: ["Un éléphant", "Un margouillat", "Un lion", "Un poisson"],
        answer: 1,
        explanation: "Le petit margouillat lui conseille de porter la calebasse sur son dos.",
      },
    ],
  },
  {
    slug: "soundiata-l-enfant-qui-se-leva",
    title: "Soundiata, l'enfant qui se leva",
    genre: "epopee",
    disclaimer:
      "Récit inspiré de l'épopée mandingue, transmise par les griots. L'épopée mêle histoire et merveilleux : Soundiata Keïta a bien existé et fondé l'Empire du Mali au XIIIe siècle, mais certains épisodes relèvent de la légende.",
    scope: "ML",
    ageMin: 8,
    readingMinutes: 5,
    scene: "sahel",
    summary: "Moqué parce qu'il ne pouvait pas marcher, le jeune Soundiata va devenir le fondateur d'un empire. Une histoire de courage et de persévérance.",
    interactive: false,
    start: "1",
    credits: "Réécriture originale CONTEVERSE à partir des grandes lignes de l'épopée mandingue (tradition orale).",
    sources: [{ title: "Soundjata ou l'épopée mandingue", publisher: "Djibril Tamsir Niane, Présence africaine, 1960" }],
    nodes: {
      "1": {
        id: "1",
        scene: "sahel",
        paragraphs: [
          "Il y a très longtemps, au pays du Manding, naquit un enfant nommé Soundiata. Sa mère s'appelait Sogolon. Les griots racontent que l'enfant ne parvenait pas à marcher et qu'il se déplaçait à quatre pattes, même à sept ans.",
          "Certains se moquaient de lui et de sa mère. Sogolon pleurait souvent, mais elle ne cessait pas de croire en son fils.",
        ],
        choices: [{ label: "Continuer", next: "2" }],
      },
      "2": {
        id: "2",
        scene: "sahel",
        paragraphs: [
          "Un jour, après une moquerie de trop, Soundiata déclara : « Aujourd'hui, je vais marcher. » On lui apporta une grande barre de fer forgée par les forgerons.",
          "S'appuyant de toutes ses forces, il se redressa. La barre se courba comme un arc… et Soundiata se tint debout ! Les griots chantent encore ce moment.",
        ],
        choices: [{ label: "Continuer", next: "3" }],
      },
      "3": {
        id: "3",
        scene: "savane",
        paragraphs: [
          "Plus tard, Soundiata dut partir en exil avec sa mère et ses frères et sœurs. Pendant ces années loin de chez lui, il apprit la chasse, la patience et l'art de diriger.",
          "Pendant ce temps, le roi du Sosso, Soumaoro Kanté, avait pris le pouvoir sur le Manding.",
        ],
        choices: [{ label: "Continuer", next: "4" }],
      },
      "4": {
        id: "4",
        scene: "sahel",
        paragraphs: [
          "Les habitants du Manding vinrent chercher Soundiata. Il rassembla une alliance et affronta Soumaoro lors de la bataille de Kirina, que la tradition situe vers 1235.",
          "Victorieux, Soundiata réunit les chefs et donna naissance à l'Empire du Mali, qui deviendra l'un des plus grands empires de l'histoire de l'Afrique.",
        ],
        ending: {
          title: "Le courage de se lever",
          message: "Soundiata montre que la persévérance peut tout changer. Pour aller plus loin, lis l'article « Soundiata Keïta et l'Empire du Mali » : tu y découvriras ce que disent les historiens.",
        },
      },
    },
    quiz: [
      {
        id: "sou-1",
        question: "Comment s'appelait la mère de Soundiata ?",
        options: ["Sogolon", "Aïssatou", "Yaa Asantewaa", "Mafory"],
        answer: 0,
        explanation: "Dans l'épopée, sa mère s'appelle Sogolon.",
      },
      {
        id: "sou-2",
        question: "L'épopée de Soundiata est…",
        options: ["entièrement inventée", "un mélange d'histoire et de merveilleux transmis par les griots", "un article de journal"],
        answer: 1,
        explanation: "Soundiata a existé, mais certains épisodes de l'épopée relèvent de la légende.",
      },
      {
        id: "sou-3",
        question: "Quelle bataille a opposé Soundiata à Soumaoro ?",
        options: ["Kirina", "Waterloo", "Kankan", "Gorée"],
        answer: 0,
        explanation: "La bataille de Kirina est traditionnellement datée vers 1235.",
      },
    ],
  },
  {
    slug: "fatou-et-le-village-lumiere",
    title: "Fatou et le village lumière",
    genre: "fiction",
    disclaimer: "Histoire inventée qui se passe dans un futur proche. Les technologies décrites (panneaux solaires, batteries) existent déjà.",
    scope: "AF",
    ageMin: 8,
    readingMinutes: 5,
    scene: "techno",
    summary: "Dans le village de Fatou, il n'y a pas d'électricité le soir. Avec son club de sciences, elle a une idée lumineuse. À toi de choisir ce qu'elle va construire !",
    interactive: true,
    start: "debut",
    credits: "Texte original CONTEVERSE.",
    nodes: {
      debut: {
        id: "debut",
        scene: "nuit",
        paragraphs: [
          "Dans le village de Fatou, quand le soleil se couche, tout devient noir. Les enfants font leurs devoirs à la lampe à pétrole, qui sent mauvais et fait tousser.",
          "Au club de sciences, la maîtresse montre un petit panneau solaire : « Le soleil nous donne de la lumière gratuite toute la journée. Comment la garder pour la nuit ? »",
        ],
        choices: [
          { label: "Fabriquer des lampes solaires pour les élèves", next: "lampes" },
          { label: "Éclairer d'abord la case de santé", next: "sante" },
        ],
      },
      lampes: {
        id: "lampes",
        scene: "techno",
        paragraphs: [
          "Fatou et ses amis apprennent à relier un panneau, une petite batterie et une ampoule LED. Il faut lire la notice très attentivement : un fil mal branché, et rien ne s'allume !",
          "Le premier soir, dix lampes s'allument. Les enfants peuvent lire leurs livres dehors, sous la véranda.",
        ],
        choices: [
          { label: "Créer une bibliothèque du soir", next: "fin-biblio" },
          { label: "Apprendre aux adultes à réparer les lampes", next: "fin-atelier" },
        ],
      },
      sante: {
        id: "sante",
        scene: "techno",
        paragraphs: [
          "L'infirmière du village explique qu'elle doit parfois soigner la nuit avec une simple torche. Le club installe des panneaux sur le toit de la case de santé.",
          "Désormais, un réfrigérateur solaire garde les vaccins au frais.",
        ],
        choices: [{ label: "Continuer avec les lampes pour l'école", next: "lampes" }],
      },
      "fin-biblio": {
        id: "fin-biblio",
        scene: "nuit",
        paragraphs: ["Chaque soir, la bibliothèque du soir accueille les enfants et les parents. On y lit des contes, des livres de sciences, et même des articles de CONTEVERSE !"],
        ending: { title: "Le village lumière", message: "La lumière aide à apprendre. L'énergie solaire peut éclairer les écoles et les maisons partout en Afrique." },
      },
      "fin-atelier": {
        id: "fin-atelier",
        scene: "techno",
        paragraphs: ["L'atelier de réparation devient un vrai petit métier pour des jeunes du village. Fatou rêve maintenant de devenir ingénieure en énergie."],
        ending: { title: "Ingénieure de demain", message: "Les métiers de l'énergie solaire sont des métiers d'avenir. Et tout commence par la curiosité et la lecture !" },
      },
    },
    quiz: [
      {
        id: "fat-1",
        question: "Quels éléments faut-il pour une lampe solaire ?",
        options: ["Un panneau, une batterie et une ampoule", "Du bois et du feu", "Seulement de l'eau", "Un téléphone"],
        answer: 0,
        explanation: "Le panneau produit l'électricité, la batterie la stocke, l'ampoule éclaire.",
      },
      {
        id: "fat-2",
        question: "Pourquoi un réfrigérateur est-il utile dans la case de santé ?",
        options: ["Pour garder les vaccins au frais", "Pour faire de la glace", "Pour décorer"],
        answer: 0,
        explanation: "Beaucoup de vaccins doivent être conservés au froid.",
      },
    ],
  },
]);

export const storyBySlug = Object.fromEntries(stories.map((s) => [s.slug, s])) as Record<string, Story>;
