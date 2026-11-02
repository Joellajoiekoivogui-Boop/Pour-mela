import type { Article } from "../../types/content.ts";

export const afriqueArticles: Article[] = [
  {
    slug: "empire-du-mali-soundiata",
    title: "Soundiata Keïta et l'Empire du Mali",
    category: "histoire",
    scope: "ML",
    difficulty: "moyen",
    ageMin: 8,
    ageMax: 12,
    readingMinutes: 5,
    contentType: "documentaire",
    scene: "sahel",
    intro:
      "Au XIIIe siècle, un grand empire naît en Afrique de l'Ouest : l'Empire du Mali. Il s'étendait sur une partie des actuels Mali, Guinée, Sénégal, Gambie et Mauritanie. Son fondateur, selon la tradition, s'appelait Soundiata Keïta.",
    sections: [
      {
        heading: "Ce que raconte la tradition orale",
        paragraphs: [
          "L'histoire de Soundiata nous est parvenue surtout grâce aux griots, qui la racontent et la chantent depuis des siècles : c'est l'épopée de Soundiata.",
          "D'après elle, Soundiata était un enfant qui ne pouvait pas marcher. Moqué, il finit par se lever, grandit, puis part en exil avant de revenir libérer le Manding du roi du Sosso, Soumaoro Kanté.",
        ],
        uncertainty:
          "L'épopée mêle des faits historiques et des éléments merveilleux. Elle est précieuse, mais on ne peut pas tout prendre au pied de la lettre. La bataille de Kirina est traditionnellement datée vers 1235.",
      },
      {
        heading: "Un empire organisé",
        paragraphs: [
          "Après sa victoire, Soundiata réunit les chefs du Manding. La tradition rapporte qu'une assemblée tenue à Kouroukan Fouga fixa des règles de vie commune, transmises sous le nom de Charte du Manden.",
          "L'empire était riche grâce à l'or, au commerce à travers le Sahara, au sel et à l'agriculture le long du fleuve Niger.",
        ],
        didYouKnow: "La Charte du Manden est inscrite au patrimoine culturel immatériel de l'UNESCO depuis 2009.",
      },
      {
        heading: "Mansa Moussa, le souverain le plus célèbre",
        paragraphs: [
          "Au XIVe siècle, Mansa Moussa, un descendant de la famille de Soundiata, fait un pèlerinage à La Mecque en 1324. Des voyageurs et historiens de l'époque racontent qu'il emporta tellement d'or que le prix de ce métal baissa au Caire.",
          "Il fit aussi construire des mosquées, dont celle de Djingareyber à Tombouctou, selon la tradition.",
        ],
      },
    ],
    glossary: [
      { word: "Épopée", definition: "Long récit qui raconte les exploits de héros, souvent avec du merveilleux." },
      { word: "Exil", definition: "Fait de devoir vivre loin de son pays." },
      { word: "Mansa", definition: "Titre du souverain de l'Empire du Mali, qui veut dire « roi des rois »." },
    ],
    sources: [
      { title: "Soundjata ou l'épopée mandingue", publisher: "Djibril Tamsir Niane, Présence africaine, 1960" },
      { title: "Histoire générale de l'Afrique, volume IV", publisher: "UNESCO" },
      { title: "La Charte du Manden", publisher: "UNESCO", url: "https://ich.unesco.org/fr/RL/la-charte-du-manden-proclamee-a-kouroukan-fouga-00290" },
    ],
    status: "verifie",
    quiz: [
      {
        id: "mali-1",
        question: "Qui a fondé l'Empire du Mali selon la tradition ?",
        options: ["Mansa Moussa", "Soundiata Keïta", "Samory Touré", "Soumaoro Kanté"],
        answer: 1,
        explanation: "La tradition orale attribue la fondation de l'empire à Soundiata Keïta au XIIIe siècle.",
      },
      {
        id: "mali-2",
        question: "Qui transmet l'épopée de Soundiata depuis des siècles ?",
        options: ["Les griots", "Les journalistes", "Les navigateurs", "Les ordinateurs"],
        answer: 0,
        explanation: "Les griots sont les gardiens de la mémoire et de la parole.",
      },
      {
        id: "mali-3",
        question: "En quelle année Mansa Moussa fit-il son célèbre pèlerinage ?",
        options: ["1066", "1324", "1789", "1958"],
        answer: 1,
        explanation: "En 1324, il traversa le Sahara jusqu'à La Mecque en passant par Le Caire.",
      },
    ],
    related: ["sosso-bala", "tombouctou-djenne", "griots-oralite"],
    tags: ["Soundiata", "Empire du Mali", "Mansa Moussa", "Kirina"],
  },
  {
    slug: "afrique-54-pays",
    title: "L'Afrique, un continent de 54 pays",
    category: "geographie",
    scope: "AF",
    difficulty: "facile",
    ageMin: 7,
    ageMax: 12,
    readingMinutes: 3,
    contentType: "fiche",
    scene: "savane",
    intro:
      "L'Afrique est le deuxième continent le plus grand du monde après l'Asie, et le deuxième le plus peuplé. On y compte 54 pays membres de l'Organisation des Nations unies.",
    sections: [
      {
        heading: "Un continent immense",
        paragraphs: [
          "L'Afrique couvre environ 30 millions de kilomètres carrés. On pourrait y faire entrer à la fois les États-Unis, la Chine, l'Inde et une bonne partie de l'Europe !",
          "Elle est entourée par l'océan Atlantique, l'océan Indien, la mer Méditerranée et la mer Rouge.",
        ],
      },
      {
        heading: "Des paysages records",
        paragraphs: [
          "Le Sahara est le plus grand désert chaud du monde. Le Nil est l'un des plus longs fleuves de la planète. Le Kilimandjaro, en Tanzanie, est la plus haute montagne d'Afrique (environ 5 895 m).",
          "On y trouve aussi de grandes forêts tropicales, comme celle du bassin du Congo, et d'immenses savanes.",
        ],
      },
      {
        heading: "54 pays, et une Union",
        paragraphs: [
          "Le plus grand pays d'Afrique par la superficie est l'Algérie. Le plus peuplé est le Nigeria.",
          "Les pays africains sont réunis dans l'Union africaine, créée en 2002 pour succéder à l'Organisation de l'unité africaine (OUA), fondée en 1963 à Addis-Abeba.",
        ],
        didYouKnow: "Sur la carte, tu verras aussi le Sahara occidental : son statut n'est pas réglé, il n'est pas compté parmi les 54 pays membres de l'ONU.",
      },
    ],
    glossary: [
      { word: "Continent", definition: "Très grande étendue de terre, comme l'Afrique, l'Asie ou l'Europe." },
      { word: "Superficie", definition: "Taille d'une surface, mesurée par exemple en kilomètres carrés." },
    ],
    sources: [{ title: "États membres", publisher: "Organisation des Nations unies", url: "https://www.un.org/fr/about-us/member-states" }, { title: "Union africaine", url: "https://au.int/fr" }],
    status: "verifie",
    quiz: [
      {
        id: "af54-1",
        question: "Combien de pays africains sont membres de l'ONU ?",
        options: ["27", "48", "54", "100"],
        answer: 2,
        explanation: "On compte 54 États africains membres des Nations unies.",
      },
      {
        id: "af54-2",
        question: "Quel est le plus grand désert chaud du monde ?",
        options: ["Le Kalahari", "Le Sahara", "Le Namib", "Le Gobi"],
        answer: 1,
        explanation: "Le Sahara s'étend sur une grande partie du nord de l'Afrique.",
      },
      {
        id: "af54-3",
        question: "Quel est le pays le plus peuplé d'Afrique ?",
        options: ["L'Égypte", "Le Nigeria", "L'Éthiopie", "La Guinée"],
        answer: 1,
        explanation: "Le Nigeria compte plus de 200 millions d'habitants.",
      },
    ],
    related: ["pourquoi-nom-guinee", "quatre-regions-naturelles"],
    tags: ["continent", "pays", "Union africaine", "Sahara"],
  },
  {
    slug: "comment-fonctionne-un-ordinateur",
    title: "Comment fonctionne un ordinateur ?",
    category: "sciences",
    scope: "MONDE",
    difficulty: "facile",
    ageMin: 7,
    ageMax: 12,
    readingMinutes: 4,
    contentType: "explication",
    scene: "techno",
    intro:
      "Un ordinateur peut afficher des images, jouer de la musique ou t'aider à lire. Pourtant, au fond, il ne comprend qu'une seule chose : des 0 et des 1 !",
    sections: [
      {
        heading: "Entrer, calculer, sortir",
        paragraphs: [
          "Un ordinateur fonctionne en trois temps. D'abord, il reçoit des informations : c'est l'entrée (clavier, souris, écran tactile, micro).",
          "Ensuite, il les traite grâce à son processeur, le « cerveau » de la machine, qui fait des milliards de petits calculs chaque seconde.",
          "Enfin, il donne un résultat : c'est la sortie (écran, haut-parleur, imprimante).",
        ],
      },
      {
        heading: "La mémoire",
        paragraphs: [
          "La mémoire vive sert au travail du moment, comme un tableau qu'on efface. Le stockage (disque ou carte mémoire) garde les fichiers même quand l'ordinateur est éteint, comme un cahier.",
        ],
      },
      {
        heading: "Le langage binaire",
        paragraphs: [
          "À l'intérieur, des milliards de minuscules interrupteurs, appelés transistors, sont soit allumés (1), soit éteints (0). En combinant ces 0 et ces 1, on peut représenter des lettres, des nombres, des couleurs et des sons.",
          "Les programmes sont des listes d'instructions écrites par des humains : les programmeurs. Toi aussi, tu peux apprendre à programmer !",
        ],
        didYouKnow: "Ton téléphone est aussi un ordinateur : il a un processeur, une mémoire et un stockage.",
      },
    ],
    glossary: [
      { word: "Processeur", definition: "Composant qui fait les calculs dans un ordinateur." },
      { word: "Binaire", definition: "Système qui n'utilise que deux chiffres : 0 et 1." },
      { word: "Programme", definition: "Suite d'instructions qui dit à l'ordinateur quoi faire." },
    ],
    sources: [{ title: "Comment fonctionne un ordinateur", publisher: "Ressources pédagogiques numériques (programme d'informatique du primaire)" }],
    status: "verifie",
    quiz: [
      {
        id: "ordi-1",
        question: "Comment appelle-t-on le « cerveau » de l'ordinateur ?",
        options: ["L'écran", "Le processeur", "La souris", "Le câble"],
        answer: 1,
        explanation: "Le processeur effectue les calculs.",
      },
      {
        id: "ordi-2",
        question: "Quels chiffres utilise le langage binaire ?",
        options: ["1 et 2", "0 et 1", "0 à 9", "Aucun"],
        answer: 1,
        explanation: "Le binaire n'utilise que 0 et 1.",
      },
      {
        id: "ordi-3",
        question: "L'écran est un appareil…",
        options: ["d'entrée", "de sortie", "de stockage", "de calcul"],
        answer: 1,
        explanation: "L'écran affiche les résultats : c'est une sortie.",
      },
    ],
    related: ["os-ishango", "energie-solaire-afrique"],
    tags: ["ordinateur", "informatique", "binaire"],
  },
  {
    slug: "os-ishango",
    title: "L'os d'Ishango : compter il y a 20 000 ans",
    category: "sciences",
    scope: "AF",
    difficulty: "moyen",
    ageMin: 8,
    ageMax: 12,
    readingMinutes: 3,
    contentType: "documentaire",
    scene: "fleuve",
    intro:
      "Au bord d'un lac, au cœur de l'Afrique, des chercheurs ont trouvé un petit os couvert d'encoches. Il pourrait être l'un des plus anciens objets mathématiques du monde.",
    sections: [
      {
        heading: "Une découverte au Congo",
        paragraphs: [
          "L'os d'Ishango a été découvert en 1950 par le géologue belge Jean de Heinzelin, sur le site d'Ishango, près du lac Édouard, dans l'actuelle République démocratique du Congo.",
          "Il est daté d'environ 20 000 ans. Il est aujourd'hui conservé à Bruxelles, en Belgique.",
        ],
      },
      {
        heading: "Des encoches mystérieuses",
        paragraphs: [
          "L'os porte des groupes d'encoches gravées en colonnes. Certains chercheurs pensent qu'il servait à compter, d'autres qu'il notait les phases de la Lune.",
        ],
        uncertainty: "On ne sait pas avec certitude à quoi servait cet objet. Les scientifiques en débattent encore.",
      },
      {
        heading: "Les mathématiques ont une longue histoire africaine",
        paragraphs: [
          "Des mathématiques ont été pratiquées très tôt en Afrique : en Égypte ancienne pour mesurer les champs et construire, ou dans les manuscrits de Tombouctou. Les jeux comme l'awalé demandent aussi du calcul et de la stratégie.",
        ],
      },
    ],
    glossary: [
      { word: "Encoche", definition: "Petite entaille faite dans un objet." },
      { word: "Géologue", definition: "Scientifique qui étudie les roches et la Terre." },
    ],
    sources: [{ title: "L'os d'Ishango", publisher: "Institut royal des sciences naturelles de Belgique", url: "https://www.naturalsciences.be" }],
    status: "verifie",
    quiz: [
      {
        id: "ish-1",
        question: "Dans quel pays actuel a été trouvé l'os d'Ishango ?",
        options: ["Égypte", "République démocratique du Congo", "Guinée", "Maroc"],
        answer: 1,
        explanation: "Il a été trouvé près du lac Édouard, en RDC.",
      },
      {
        id: "ish-2",
        question: "Sait-on avec certitude à quoi servait l'os d'Ishango ?",
        options: ["Oui", "Non, les chercheurs en débattent"],
        answer: 1,
        explanation: "Compter ? Suivre la Lune ? Les hypothèses restent discutées.",
      },
    ],
    related: ["comment-fonctionne-un-ordinateur", "tombouctou-djenne"],
    tags: ["mathématiques", "préhistoire", "Ishango"],
  },
  {
    slug: "kora-balafon-djembe",
    title: "Kora, balafon, djembé : les instruments mandingues",
    category: "musique",
    scope: "AF",
    difficulty: "facile",
    ageMin: 7,
    ageMax: 12,
    readingMinutes: 3,
    contentType: "fiche",
    scene: "musique",
    intro: "Trois instruments sont devenus des ambassadeurs de la musique d'Afrique de l'Ouest dans le monde entier. Apprends à les reconnaître !",
    sections: [
      {
        heading: "La kora, la harpe des griots",
        paragraphs: [
          "La kora est faite d'une grande calebasse recouverte de peau, d'un long manche et d'environ 21 cordes. On la joue avec les pouces et les index.",
          "Elle accompagne les chants des griots. Des musiciens comme Mory Kanté (Guinée) ou Toumani Diabaté (Mali) l'ont fait connaître partout.",
        ],
      },
      {
        heading: "Le balafon, l'ancêtre du xylophone",
        paragraphs: ["Le balafon possède des lames de bois et des calebasses qui résonnent. On joue souvent plusieurs balafons ensemble."],
      },
      {
        heading: "Le djembé, le tambour qui parle",
        paragraphs: [
          "Le djembé est un tambour en bois en forme de calice, recouvert d'une peau de chèvre. Selon la façon de frapper, il produit des sons graves ou aigus.",
          "Le grand percussionniste guinéen Mamady Keïta a enseigné le djembé dans le monde entier.",
        ],
        didYouKnow: "Les Ballets africains de Guinée, fondés par Fodéba Keïta, ont fait découvrir ces musiques et ces danses dans de nombreux pays.",
      },
    ],
    glossary: [
      { word: "Percussion", definition: "Instrument dont on joue en le frappant." },
      { word: "Calice", definition: "Forme de coupe avec un pied." },
    ],
    sources: [{ title: "Instruments de musique d'Afrique de l'Ouest", publisher: "Musée du quai Branly – Jacques Chirac (ressources pédagogiques)" }],
    status: "verifie",
    quiz: [
      {
        id: "instr-1",
        question: "Combien de cordes a environ une kora ?",
        options: ["3", "21", "100", "Aucune"],
        answer: 1,
        explanation: "La kora a généralement 21 cordes.",
      },
      {
        id: "instr-2",
        question: "Le djembé est…",
        options: ["une flûte", "un tambour", "une guitare", "un piano"],
        answer: 1,
        explanation: "C'est un tambour qu'on frappe avec les mains.",
      },
    ],
    related: ["sosso-bala", "griots-oralite"],
    tags: ["kora", "balafon", "djembé", "musique"],
  },
  {
    slug: "griots-oralite",
    title: "Les griots, bibliothèques vivantes",
    category: "litterature",
    scope: "AF",
    difficulty: "facile",
    ageMin: 7,
    ageMax: 12,
    readingMinutes: 3,
    contentType: "explication",
    scene: "nuit",
    intro:
      "« En Afrique, un vieillard qui meurt, c'est une bibliothèque qui brûle. » Cette phrase célèbre de l'écrivain malien Amadou Hampâté Bâ rappelle l'importance de la parole.",
    sections: [
      {
        heading: "La parole qui transmet",
        paragraphs: [
          "Pendant des siècles, une grande partie de l'histoire de l'Afrique de l'Ouest a été transmise oralement, c'est-à-dire par la parole, de génération en génération.",
          "Les griots (on dit aussi « djéli » en langues mandingues) apprennent par cœur les généalogies, les épopées et les chants. Ils conseillent aussi les familles et aident à régler les disputes.",
        ],
      },
      {
        heading: "Contes, proverbes et devinettes",
        paragraphs: [
          "Le soir, on raconte des contes. Ils font rire, peur ou réfléchir, et transmettent souvent une leçon. Les animaux comme le lièvre, l'hyène ou l'araignée y sont souvent les héros.",
          "Attention : un conte n'est pas un fait historique. C'est une histoire imaginée pour apprendre et se divertir.",
        ],
      },
      {
        heading: "Les écrits aussi",
        paragraphs: [
          "L'Afrique a aussi une longue tradition d'écriture : hiéroglyphes égyptiens, manuscrits de Tombouctou en arabe et en langues africaines, alphabet N'Ko créé en Guinée…",
        ],
      },
    ],
    glossary: [
      { word: "Oral", definition: "Qui se transmet par la parole." },
      { word: "Généalogie", definition: "Liste des ancêtres d'une famille." },
      { word: "Proverbe", definition: "Courte phrase qui exprime une sagesse populaire." },
    ],
    sources: [{ title: "Amkoullel, l'enfant peul", publisher: "Amadou Hampâté Bâ, Actes Sud, 1991" }],
    status: "verifie",
    validationNote: "La citation d'Amadou Hampâté Bâ est connue sous plusieurs formulations ; celle-ci est la plus répandue.",
    quiz: [
      {
        id: "griot-1",
        question: "Que fait un griot ?",
        options: ["Il construit des maisons", "Il transmet l'histoire par la parole et la musique", "Il conduit des camions", "Il pêche"],
        answer: 1,
        explanation: "Le griot est un gardien de la mémoire.",
      },
      {
        id: "griot-2",
        question: "Un conte est-il un fait historique ?",
        options: ["Oui", "Non, c'est une histoire imaginée qui transmet une leçon"],
        answer: 1,
        explanation: "Les contes sont des récits imaginaires, même s'ils transmettent des valeurs.",
      },
    ],
    related: ["camara-laye-enfant-noir", "empire-du-mali-soundiata", "sosso-bala"],
    tags: ["griots", "oralité", "contes", "proverbes"],
  },
  {
    slug: "kente-adinkra",
    title: "Kente et adinkra : les tissus qui parlent",
    category: "cultures",
    scope: "GH",
    difficulty: "facile",
    ageMin: 7,
    ageMax: 12,
    readingMinutes: 3,
    contentType: "documentaire",
    scene: "ville",
    intro: "Au Ghana, certains tissus racontent des histoires. Leurs couleurs et leurs motifs portent des messages.",
    sections: [
      {
        heading: "Le kente",
        paragraphs: [
          "Le kente est tissé en bandes étroites sur des métiers à tisser, puis les bandes sont cousues ensemble. Il est surtout associé aux peuples ashanti et éwé.",
          "Chaque couleur a un sens : par exemple, l'or évoque souvent la richesse, le vert la croissance.",
        ],
        uncertainty: "La signification des couleurs et des motifs peut varier selon les tisserands et les régions.",
      },
      {
        heading: "Les symboles adinkra",
        paragraphs: [
          "Les adinkra sont des symboles imprimés ou dessinés. Chacun correspond à une idée ou à un proverbe. Le plus connu, « Gye Nyame », exprime la toute-puissance de Dieu. « Sankofa », un oiseau qui regarde en arrière, rappelle qu'il faut connaître son passé pour avancer.",
        ],
      },
    ],
    glossary: [
      { word: "Métier à tisser", definition: "Machine pour fabriquer du tissu en croisant des fils." },
      { word: "Symbole", definition: "Dessin ou signe qui représente une idée." },
    ],
    sources: [{ title: "Adinkra symbols", publisher: "Musées nationaux du Ghana (référence à préciser)" }],
    status: "verifie",
    quiz: [
      {
        id: "kente-1",
        question: "Que rappelle le symbole Sankofa ?",
        options: ["Qu'il faut courir vite", "Qu'il faut connaître son passé pour avancer", "Qu'il va pleuvoir", "Qu'il faut dormir"],
        answer: 1,
        explanation: "Sankofa, l'oiseau qui regarde en arrière, invite à apprendre du passé.",
      },
      {
        id: "kente-2",
        question: "Dans quel pays le kente est-il surtout fabriqué ?",
        options: ["Le Ghana", "L'Égypte", "Madagascar", "Le Maroc"],
        answer: 0,
        explanation: "Le kente est associé aux peuples ashanti et éwé du Ghana (et du Togo pour les Éwés).",
      },
    ],
    related: ["griots-oralite"],
    tags: ["Ghana", "tissu", "kente", "adinkra", "Sankofa"],
  },
  {
    slug: "cacao-cote-ivoire-ghana",
    title: "Le voyage d'une fève de cacao",
    category: "economie",
    scope: "CI",
    difficulty: "facile",
    ageMin: 7,
    ageMax: 12,
    readingMinutes: 3,
    contentType: "explication",
    scene: "foret",
    intro: "Le chocolat que mangent les enfants du monde entier commence souvent sa vie en Afrique de l'Ouest. La Côte d'Ivoire et le Ghana produisent plus de la moitié du cacao mondial.",
    sections: [
      {
        heading: "De la cabosse à la fève",
        paragraphs: [
          "Le cacaoyer est un arbre des forêts chaudes et humides. Ses fruits, les cabosses, poussent directement sur le tronc.",
          "Les agriculteurs ouvrent les cabosses, récupèrent les fèves, les laissent fermenter quelques jours puis les font sécher au soleil.",
        ],
      },
      {
        heading: "Un produit qui voyage",
        paragraphs: [
          "Les fèves séchées sont souvent exportées vers d'autres continents, où elles sont transformées en chocolat. Une part de plus en plus importante est désormais transformée sur place.",
          "Transformer le cacao dans le pays permet de créer plus d'emplois et de mieux payer les producteurs.",
        ],
        didYouKnow: "La Côte d'Ivoire est le premier producteur mondial de cacao ; le Ghana est l'un des tout premiers.",
      },
      {
        heading: "Protéger les forêts et les enfants",
        paragraphs: [
          "La culture du cacao a fait reculer des forêts. Aujourd'hui, on plante des arbres à côté des cacaoyers (agroforesterie). Les enfants, eux, ont leur place à l'école, pas dans les plantations : des lois les protègent.",
        ],
      },
    ],
    glossary: [
      { word: "Cabosse", definition: "Fruit du cacaoyer, qui contient les fèves." },
      { word: "Fermenter", definition: "Se transformer grâce à de minuscules êtres vivants, comme les levures." },
      { word: "Agroforesterie", definition: "Façon de cultiver en gardant ou en plantant des arbres dans les champs." },
    ],
    sources: [{ title: "Statistiques de production", publisher: "Organisation internationale du cacao (ICCO)", url: "https://www.icco.org" }],
    status: "verifie",
    quiz: [
      {
        id: "cacao-1",
        question: "Comment s'appelle le fruit du cacaoyer ?",
        options: ["La cabosse", "La datte", "La noix", "La mangue"],
        answer: 0,
        explanation: "Les fèves de cacao se trouvent dans la cabosse.",
      },
      {
        id: "cacao-2",
        question: "Quel pays est le premier producteur mondial de cacao ?",
        options: ["Le Brésil", "La Côte d'Ivoire", "La France", "Le Mali"],
        answer: 1,
        explanation: "La Côte d'Ivoire produit environ 40 % du cacao mondial.",
      },
    ],
    related: ["fonio-cereale", "bauxite-guinee"],
    tags: ["cacao", "agriculture", "Côte d'Ivoire", "Ghana"],
  },
  {
    slug: "fonio-cereale",
    title: "Le fonio, petite graine aux grands pouvoirs",
    category: "economie",
    scope: "GN",
    difficulty: "facile",
    ageMin: 7,
    ageMax: 12,
    readingMinutes: 3,
    contentType: "documentaire",
    scene: "fouta",
    intro: "Ses grains sont minuscules, mais le fonio est l'une des plus anciennes céréales cultivées en Afrique de l'Ouest. La Guinée en est le premier producteur mondial.",
    sections: [
      {
        heading: "Une céréale très ancienne",
        paragraphs: [
          "Le fonio est cultivé depuis des milliers d'années en Afrique de l'Ouest. En Guinée, on le cultive beaucoup dans le Fouta-Djalon.",
          "Il pousse vite, même sur des sols pauvres et avec peu d'eau : c'est une céréale précieuse face au changement climatique.",
        ],
      },
      {
        heading: "Bon pour la santé",
        paragraphs: [
          "Le fonio est nourrissant et ne contient pas de gluten. On le prépare en couscous, en bouillie ou avec des sauces.",
          "Le travail le plus difficile est le décorticage : enlever l'enveloppe de grains si petits ! Des ingénieurs africains ont inventé des machines pour faciliter ce travail, longtemps fait à la main, surtout par les femmes.",
        ],
      },
    ],
    glossary: [
      { word: "Céréale", definition: "Plante dont on mange les grains, comme le riz, le mil ou le maïs." },
      { word: "Décorticage", definition: "Fait d'enlever l'enveloppe d'un grain." },
      { word: "Gluten", definition: "Protéine présente dans le blé, que certaines personnes ne digèrent pas." },
    ],
    sources: [{ title: "Le fonio", publisher: "FAO et CIRAD (fiches techniques)", url: "https://www.fao.org" }],
    status: "verifie",
    validationNote: "Classement de la Guinée comme premier producteur à confirmer avec les statistiques FAO les plus récentes.",
    quiz: [
      {
        id: "fonio-1",
        question: "Dans quelle région de Guinée cultive-t-on beaucoup le fonio ?",
        options: ["Le Fouta-Djalon", "Les îles de Loos", "Le Sahara", "Conakry"],
        answer: 0,
        explanation: "Le fonio est très cultivé dans le Fouta-Djalon.",
      },
      {
        id: "fonio-2",
        question: "Pourquoi le fonio est-il utile face au changement climatique ?",
        options: ["Il pousse vite avec peu d'eau", "Il fait tomber la pluie", "Il pousse seulement dans la neige", "Il ne pousse plus"],
        answer: 0,
        explanation: "Il résiste bien aux sols pauvres et au manque d'eau.",
      },
    ],
    related: ["cacao-cote-ivoire-ghana", "fouta-djalon-chateau-eau"],
    tags: ["fonio", "agriculture", "alimentation"],
  },
  {
    slug: "tombouctou-djenne",
    title: "Tombouctou et Djenné, villes de savoir et de terre",
    category: "monuments",
    scope: "ML",
    difficulty: "moyen",
    ageMin: 8,
    ageMax: 12,
    readingMinutes: 4,
    contentType: "documentaire",
    scene: "monument",
    intro: "Au Mali, deux villes célèbres racontent la grandeur des empires d'Afrique de l'Ouest : Tombouctou, la ville des manuscrits, et Djenné, la ville de la grande mosquée de terre.",
    sections: [
      {
        heading: "Tombouctou, la cité des livres",
        paragraphs: [
          "Aux XVe et XVIe siècles, Tombouctou est un grand centre de commerce et d'études. Des savants y enseignent le droit, l'astronomie, les mathématiques et la médecine.",
          "Des familles y conservent des milliers de manuscrits anciens. Pendant les violences de 2012, des habitants ont caché et sauvé une grande partie de ces trésors.",
        ],
      },
      {
        heading: "Djenné et sa grande mosquée",
        paragraphs: [
          "La grande mosquée de Djenné est l'un des plus grands bâtiments en terre crue du monde. Le bâtiment actuel a été reconstruit en 1907.",
          "Chaque année, les habitants se réunissent pour recouvrir ses murs d'une nouvelle couche de banco (terre mélangée à de l'eau et de la paille) : c'est une grande fête collective.",
        ],
      },
      {
        heading: "Un patrimoine mondial",
        paragraphs: [
          "Tombouctou et les villes anciennes de Djenné sont inscrites au patrimoine mondial de l'UNESCO depuis 1988. Les protéger, c'est protéger une partie de la mémoire de l'humanité.",
        ],
      },
    ],
    glossary: [
      { word: "Manuscrit", definition: "Texte écrit à la main." },
      { word: "Banco", definition: "Mélange de terre, d'eau et de paille utilisé pour construire." },
    ],
    sources: [
      { title: "Tombouctou", publisher: "UNESCO", url: "https://whc.unesco.org/fr/list/119" },
      { title: "Villes anciennes de Djenné", publisher: "UNESCO", url: "https://whc.unesco.org/fr/list/116" },
    ],
    status: "verifie",
    quiz: [
      {
        id: "tomb-1",
        question: "De quoi est faite la grande mosquée de Djenné ?",
        options: ["De verre", "De terre crue (banco)", "De métal", "De plastique"],
        answer: 1,
        explanation: "Elle est construite en banco, recrépi chaque année.",
      },
      {
        id: "tomb-2",
        question: "Pourquoi Tombouctou est-elle célèbre ?",
        options: ["Pour ses gratte-ciel", "Pour ses manuscrits et ses savants", "Pour sa neige", "Pour son port de mer"],
        answer: 1,
        explanation: "C'était un grand centre de savoir aux XVe et XVIe siècles.",
      },
    ],
    related: ["empire-du-mali-soundiata", "ile-de-goree"],
    tags: ["Mali", "UNESCO", "manuscrits", "architecture"],
  },
  {
    slug: "ile-de-goree",
    title: "L'île de Gorée, un lieu pour se souvenir",
    category: "monuments",
    scope: "SN",
    difficulty: "avance",
    ageMin: 10,
    ageMax: 12,
    readingMinutes: 3,
    contentType: "documentaire",
    scene: "mer",
    intro: "Face à Dakar, une petite île aux maisons colorées est devenue un lieu de mémoire pour le monde entier. Elle rappelle une page douloureuse de l'histoire : la traite des esclaves.",
    sections: [
      {
        heading: "Une page difficile de l'histoire",
        paragraphs: [
          "Entre le XVe et le XIXe siècle, des millions d'Africains ont été capturés, vendus et déportés de force vers les Amériques à travers l'océan Atlantique. C'est ce qu'on appelle la traite transatlantique.",
          "Cette histoire est triste, mais il est important de la connaître pour honorer les victimes et défendre la dignité de chaque être humain.",
        ],
      },
      {
        heading: "Gorée, symbole de mémoire",
        paragraphs: [
          "L'île de Gorée a été inscrite au patrimoine mondial de l'UNESCO en 1978. On y visite notamment la Maison des Esclaves, devenue un musée et un lieu de recueillement.",
        ],
        uncertainty: "Les historiens discutent du nombre de captifs réellement passés par Gorée : l'île est avant tout un symbole de toute la traite.",
      },
      {
        heading: "Se souvenir pour construire",
        paragraphs: ["Des chefs d'État, des artistes et des millions de visiteurs viennent à Gorée. Le souvenir aide à construire un monde plus juste."],
      },
    ],
    glossary: [
      { word: "Traite", definition: "Commerce d'êtres humains réduits en esclavage." },
      { word: "Déporter", definition: "Emmener quelqu'un de force loin de chez lui." },
      { word: "Mémoire", definition: "Souvenir collectif d'un événement passé." },
    ],
    sources: [{ title: "Île de Gorée", publisher: "UNESCO", url: "https://whc.unesco.org/fr/list/26" }],
    status: "verifie",
    validationNote: "Sujet sensible : prévoir une lecture accompagnée par un adulte pour les plus jeunes.",
    quiz: [
      {
        id: "goree-1",
        question: "Près de quelle ville se trouve l'île de Gorée ?",
        options: ["Dakar", "Accra", "Conakry", "Le Caire"],
        answer: 0,
        explanation: "Gorée est située face à Dakar, au Sénégal.",
      },
      {
        id: "goree-2",
        question: "Pourquoi visite-t-on Gorée aujourd'hui ?",
        options: ["Pour se souvenir des victimes de la traite", "Pour faire du ski", "Pour voir des volcans", "Pour acheter des voitures"],
        answer: 0,
        explanation: "C'est un lieu de mémoire de la traite transatlantique.",
      },
    ],
    related: ["tombouctou-djenne"],
    tags: ["Sénégal", "mémoire", "UNESCO", "traite"],
  },
  {
    slug: "wangari-maathai",
    title: "Wangari Maathai, la femme qui plantait des arbres",
    category: "personnalites",
    scope: "AF",
    difficulty: "facile",
    ageMin: 7,
    ageMax: 12,
    readingMinutes: 3,
    contentType: "portrait",
    scene: "foret",
    intro: "Au Kenya, une femme a aidé à planter des dizaines de millions d'arbres. En 2004, elle est devenue la première femme africaine à recevoir le prix Nobel de la paix.",
    sections: [
      {
        heading: "Une scientifique",
        paragraphs: [
          "Wangari Maathai est née en 1940 au Kenya. Elle a étudié la biologie et est devenue la première femme d'Afrique de l'Est et centrale à obtenir un doctorat.",
        ],
      },
      {
        heading: "Le mouvement de la ceinture verte",
        paragraphs: [
          "En 1977, elle fonde le Green Belt Movement (mouvement de la ceinture verte). Des femmes plantent des arbres pour lutter contre l'érosion, avoir du bois et de l'eau, et gagner un revenu.",
          "Elle s'est aussi battue pour la démocratie et les droits des femmes, ce qui lui a valu d'être arrêtée plusieurs fois.",
        ],
        didYouKnow: "Elle aimait raconter l'histoire du colibri qui, face à un incendie, transporte l'eau goutte par goutte : « Je fais ce que je peux. »",
      },
      {
        heading: "Le prix Nobel de la paix",
        paragraphs: ["En 2004, elle reçoit le prix Nobel de la paix « pour sa contribution au développement durable, à la démocratie et à la paix ». Elle est morte en 2011."],
      },
    ],
    glossary: [
      { word: "Doctorat", definition: "Le plus haut diplôme universitaire." },
      { word: "Développement durable", definition: "Façon de répondre à nos besoins sans abîmer la planète pour les générations futures." },
    ],
    sources: [{ title: "Wangari Maathai — Facts", publisher: "The Nobel Prize", url: "https://www.nobelprize.org/prizes/peace/2004/maathai/facts/" }],
    status: "verifie",
    quiz: [
      {
        id: "wanga-1",
        question: "De quel pays était Wangari Maathai ?",
        options: ["Kenya", "Guinée", "Ghana", "Mali"],
        answer: 0,
        explanation: "Elle était kényane.",
      },
      {
        id: "wanga-2",
        question: "Qu'a fait le mouvement de la ceinture verte ?",
        options: ["Construire des routes", "Planter des arbres", "Fabriquer des voitures", "Vendre du pétrole"],
        answer: 1,
        explanation: "Des dizaines de millions d'arbres ont été plantés.",
      },
    ],
    related: ["energie-solaire-afrique", "fouta-djalon-chateau-eau"],
    tags: ["Kenya", "Nobel", "environnement", "femmes"],
  },
  {
    slug: "kwame-nkrumah",
    title: "Kwame Nkrumah et le rêve d'une Afrique unie",
    category: "personnalites",
    scope: "GH",
    difficulty: "moyen",
    ageMin: 9,
    ageMax: 12,
    readingMinutes: 3,
    contentType: "portrait",
    scene: "ville",
    intro: "En 1957, la Côte-de-l'Or devient le Ghana indépendant. À sa tête, Kwame Nkrumah, un homme qui rêvait d'une Afrique unie.",
    sections: [
      {
        heading: "Le chemin vers l'indépendance",
        paragraphs: [
          "Kwame Nkrumah est né en 1909. Après des études aux États-Unis et en Angleterre, il revient en Gold Coast et mène la lutte pour l'indépendance.",
          "Le 6 mars 1957, il proclame l'indépendance du Ghana : « Le Ghana, notre pays bien-aimé, est libre pour toujours ! »",
        ],
      },
      {
        heading: "Le panafricanisme",
        paragraphs: [
          "Nkrumah pensait que l'Afrique serait plus forte unie. Il a participé à la création de l'Organisation de l'unité africaine en 1963.",
          "Il était très proche de la Guinée : après son renversement en 1966, il a vécu en exil à Conakry, où Sékou Touré l'a nommé co-président de la Guinée à titre honorifique.",
        ],
      },
      {
        heading: "Un héritage discuté",
        paragraphs: ["Son pouvoir est aussi devenu autoritaire. Comme pour beaucoup de dirigeants, les historiens étudient à la fois ses réussites et ses erreurs."],
      },
    ],
    glossary: [
      { word: "Panafricanisme", definition: "Idée selon laquelle les peuples africains doivent s'unir." },
      { word: "Autoritaire", definition: "Qui impose ses décisions sans laisser de place aux opposants." },
    ],
    sources: [{ title: "Histoire générale de l'Afrique, volume VIII", publisher: "UNESCO" }],
    status: "verifie",
    quiz: [
      {
        id: "nkru-1",
        question: "En quelle année le Ghana est-il devenu indépendant ?",
        options: ["1957", "1960", "1963", "1990"],
        answer: 0,
        explanation: "Le 6 mars 1957.",
      },
      {
        id: "nkru-2",
        question: "Qu'est-ce que le panafricanisme ?",
        options: ["Un sport", "L'idée d'unir les peuples africains", "Une recette", "Un instrument"],
        answer: 1,
        explanation: "Nkrumah en était l'un des grands défenseurs.",
      },
    ],
    related: ["independance-guinee-1958", "afrique-54-pays"],
    tags: ["Ghana", "indépendance", "panafricanisme"],
  },
  {
    slug: "sport-en-afrique",
    title: "La Coupe d'Afrique des nations, une grande fête du sport",
    category: "sports",
    scope: "AF",
    difficulty: "facile",
    ageMin: 7,
    ageMax: 12,
    readingMinutes: 3,
    contentType: "documentaire",
    scene: "savane",
    intro: "Tous les deux ans environ, les meilleures équipes de football du continent s'affrontent lors de la Coupe d'Afrique des nations (CAN). Des millions de supporters vibrent ensemble !",
    sections: [
      {
        heading: "Une compétition née en 1957",
        paragraphs: [
          "La première CAN s'est jouée en 1957 au Soudan, avec seulement trois équipes : l'Égypte, le Soudan et l'Éthiopie. Aujourd'hui, 24 équipes participent à la phase finale.",
        ],
      },
      {
        heading: "Les équipes de nos pays",
        paragraphs: [
          "Le Ghana a remporté la CAN quatre fois. La Côte d'Ivoire l'a gagnée trois fois, dont l'édition jouée à domicile début 2024. Le Sénégal l'a remportée pour la première fois en 2022.",
          "Le Syli national de Guinée a terminé deuxième en 1976. Le Mali a atteint la finale en 1972.",
        ],
        didYouKnow: "« Syli » veut dire « éléphant » en susu : c'est le surnom de l'équipe de Guinée.",
      },
      {
        heading: "Plus qu'un jeu",
        paragraphs: ["Le sport apprend l'esprit d'équipe, le respect des règles et de l'adversaire, et la persévérance. Et il se pratique aussi à l'école, entre amis, filles et garçons !"],
      },
    ],
    glossary: [
      { word: "Phase finale", definition: "Dernière partie d'une compétition, avec les équipes qualifiées." },
      { word: "Persévérance", definition: "Qualité de quelqu'un qui continue malgré les difficultés." },
    ],
    sources: [{ title: "Palmarès de la Coupe d'Afrique des nations", publisher: "Confédération africaine de football (CAF)", url: "https://www.cafonline.com" }],
    status: "a-valider",
    validationNote: "Palmarès à revérifier après chaque édition de la CAN ; traduction de « Syli » à confirmer par des locuteurs susu.",
    quiz: [
      {
        id: "can-1",
        question: "Combien de fois le Ghana a-t-il remporté la CAN ?",
        options: ["Une fois", "Quatre fois", "Jamais", "Dix fois"],
        answer: 1,
        explanation: "Le Ghana a gagné la CAN en 1963, 1965, 1978 et 1982.",
      },
      {
        id: "can-2",
        question: "Quel est le surnom de l'équipe de Guinée ?",
        options: ["Les Lions", "Le Syli national", "Les Éléphants", "Les Aigles"],
        answer: 1,
        explanation: "Le Syli national, « syli » signifiant « éléphant ».",
      },
    ],
    related: ["afrique-54-pays"],
    tags: ["football", "CAN", "sport"],
  },
  {
    slug: "energie-solaire-afrique",
    title: "Le soleil, l'énergie de l'Afrique de demain",
    category: "demain",
    scope: "AF",
    difficulty: "facile",
    ageMin: 7,
    ageMax: 12,
    readingMinutes: 3,
    contentType: "explication",
    scene: "techno",
    intro: "L'Afrique reçoit énormément de soleil. Grâce aux panneaux solaires, cette lumière peut devenir de l'électricité pour les écoles, les maisons et les centres de santé.",
    sections: [
      {
        heading: "Comment marche un panneau solaire ?",
        paragraphs: [
          "Un panneau solaire est fait de cellules qui transforment la lumière en électricité : c'est l'effet photovoltaïque. L'électricité peut être utilisée tout de suite ou stockée dans une batterie pour la nuit.",
        ],
      },
      {
        heading: "Pourquoi c'est important",
        paragraphs: [
          "Des centaines de millions de personnes en Afrique n'ont pas encore accès à l'électricité. Les mini-réseaux et les kits solaires permettent d'éclairer des villages éloignés des grandes lignes électriques.",
          "L'énergie solaire ne rejette pas de fumée et aide à lutter contre le changement climatique.",
        ],
      },
      {
        heading: "Les métiers de demain",
        paragraphs: ["Installer, réparer, inventer : l'énergie solaire crée de nouveaux métiers. Peut-être le tien ?"],
      },
    ],
    glossary: [
      { word: "Photovoltaïque", definition: "Qui transforme la lumière en électricité." },
      { word: "Batterie", definition: "Réserve qui stocke l'électricité pour plus tard." },
    ],
    sources: [{ title: "Africa Energy Outlook", publisher: "Agence internationale de l'énergie", url: "https://www.iea.org" }],
    status: "verifie",
    quiz: [
      {
        id: "sol-1",
        question: "Que transforme un panneau solaire ?",
        options: ["Le vent en eau", "La lumière en électricité", "Le bois en métal", "Le son en lumière"],
        answer: 1,
        explanation: "C'est l'effet photovoltaïque.",
      },
      {
        id: "sol-2",
        question: "À quoi sert une batterie ?",
        options: ["À stocker l'électricité", "À faire pleuvoir", "À refroidir le soleil", "À rien"],
        answer: 0,
        explanation: "Elle permet d'avoir de l'électricité la nuit.",
      },
    ],
    related: ["comment-fonctionne-un-ordinateur", "numerique-afrique"],
    tags: ["énergie", "solaire", "climat", "avenir"],
  },
  {
    slug: "numerique-afrique",
    title: "Le téléphone qui a changé la vie : l'Afrique et le numérique",
    category: "demain",
    scope: "AF",
    difficulty: "moyen",
    ageMin: 9,
    ageMax: 12,
    readingMinutes: 3,
    contentType: "explication",
    scene: "techno",
    intro: "En Afrique, beaucoup de gens ont découvert Internet directement sur le téléphone portable. Et des inventions africaines ont changé le quotidien de millions de personnes.",
    sections: [
      {
        heading: "L'argent dans le téléphone",
        paragraphs: [
          "En 2007, au Kenya, un service appelé M-Pesa permet d'envoyer de l'argent avec un simple SMS. Depuis, le « mobile money » s'est répandu dans de nombreux pays africains, y compris en Guinée.",
        ],
      },
      {
        heading: "Apprendre et créer",
        paragraphs: [
          "Des jeunes Africains créent des applications pour l'agriculture, la santé ou l'éducation. Des écoles de programmation ouvrent dans de nombreuses villes.",
          "Pour réussir dans le numérique, il faut… savoir bien lire ! Comprendre un texte, c'est la première compétence du programmeur.",
        ],
      },
      {
        heading: "Utiliser les écrans avec sagesse",
        paragraphs: ["Le numérique est un outil formidable, mais il faut aussi faire des pauses, jouer dehors et ne jamais partager ses informations personnelles avec des inconnus."],
      },
    ],
    glossary: [
      { word: "Application", definition: "Programme installé sur un téléphone ou un ordinateur." },
      { word: "Mobile money", definition: "Argent qu'on envoie et reçoit avec son téléphone." },
    ],
    sources: [{ title: "The Mobile Economy Sub-Saharan Africa", publisher: "GSMA", url: "https://www.gsma.com" }],
    status: "verifie",
    quiz: [
      {
        id: "num-1",
        question: "Dans quel pays est né le service M-Pesa ?",
        options: ["Kenya", "Guinée", "Égypte", "Maroc"],
        answer: 0,
        explanation: "M-Pesa a été lancé au Kenya en 2007.",
      },
      {
        id: "num-2",
        question: "Que faut-il éviter de partager en ligne ?",
        options: ["Ses informations personnelles", "Ses connaissances", "Ses dessins avec sa classe", "Rien"],
        answer: 0,
        explanation: "Ton adresse, ton téléphone ou ton école ne doivent pas être donnés à des inconnus.",
      },
    ],
    related: ["energie-solaire-afrique", "comment-fonctionne-un-ordinateur"],
    tags: ["numérique", "mobile", "innovation"],
  },
];

