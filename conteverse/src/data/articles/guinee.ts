import type { Article } from "../../types/content.ts";

const UNESCO_ICH = { title: "Patrimoine culturel immatériel", publisher: "UNESCO", url: "https://ich.unesco.org/fr/listes" };
const UNESCO_WH = { title: "Liste du patrimoine mondial", publisher: "UNESCO", url: "https://whc.unesco.org/fr/list/" };

export const guineeArticles: Article[] = [
  {
    slug: "independance-guinee-1958",
    title: "1958 : le « non » qui fit naître la Guinée indépendante",
    category: "histoire",
    scope: "GN",
    difficulty: "facile",
    ageMin: 8,
    ageMax: 12,
    readingMinutes: 4,
    contentType: "documentaire",
    scene: "ville",
    intro:
      "Le 2 octobre 1958, la Guinée devient un pays indépendant. Elle est la première colonie française d'Afrique subsaharienne à faire ce choix. Comment est-ce arrivé ?",
    sections: [
      {
        heading: "Une colonie de l'Afrique-Occidentale française",
        paragraphs: [
          "À la fin du XIXe siècle, la France conquiert le territoire de l'actuelle Guinée, malgré la résistance de plusieurs chefs, dont Samory Touré. Le pays devient la colonie de la « Guinée française ».",
          "Elle fait partie d'un grand ensemble appelé l'Afrique-Occidentale française (AOF), qui regroupe plusieurs colonies gouvernées depuis Dakar.",
        ],
      },
      {
        heading: "Le référendum du 28 septembre 1958",
        paragraphs: [
          "En 1958, le gouvernement français propose aux colonies un référendum : voter « oui » signifie rester dans une « Communauté » avec la France, voter « non » signifie devenir indépendant tout de suite.",
          "Les Guinéens votent massivement « non ». Le leader politique Ahmed Sékou Touré avait déclaré : « Nous préférons la pauvreté dans la liberté à la richesse dans l'esclavage. »",
        ],
        didYouKnow: "La Guinée est le seul territoire de l'AOF à avoir voté « non » à ce référendum.",
      },
      {
        heading: "Le 2 octobre 1958, naissance d'un pays",
        paragraphs: [
          "Quatre jours après le vote, l'indépendance est proclamée. Ahmed Sékou Touré devient le premier président de la République de Guinée.",
          "Le départ de l'administration française est très brutal : de nombreux équipements et documents sont emportés. Le jeune pays doit tout organiser rapidement.",
          "En 1960, beaucoup d'autres pays africains deviennent indépendants à leur tour. Le choix de la Guinée a montré que c'était possible.",
        ],
      },
      {
        heading: "Une histoire à regarder en entier",
        paragraphs: [
          "L'histoire d'un pays a des pages joyeuses et des pages difficiles. Après l'indépendance, le régime de Sékou Touré a aussi été marqué par la répression de ses opposants, par exemple au camp Boiro. Les historiens continuent d'étudier cette période.",
        ],
        uncertainty: "Certains détails (chiffres du vote, circonstances du départ français) varient selon les sources : demande à ton enseignant de les comparer avec toi.",
      },
    ],
    glossary: [
      { word: "Colonie", definition: "Territoire dirigé par un pays étranger qui l'a conquis." },
      { word: "Référendum", definition: "Vote où les citoyens répondent par « oui » ou par « non » à une question." },
      { word: "Indépendance", definition: "Situation d'un pays qui se gouverne lui-même." },
    ],
    sources: [
      { title: "Histoire de la Guinée contemporaine", publisher: "Manuels scolaires guinéens d'histoire (à compléter par le comité pédagogique)" },
      { title: "Guinée : histoire", publisher: "Encyclopædia Universalis" },
    ],
    status: "verifie",
    validationNote: "Faits principaux largement documentés. La partie sur la période 1958-1984 doit être relue par des historiens guinéens pour le ton et la formulation destinée aux enfants.",
    quiz: [
      {
        id: "gn58-1",
        question: "En quelle année la Guinée est-elle devenue indépendante ?",
        options: ["1945", "1958", "1960", "1975"],
        answer: 1,
        explanation: "L'indépendance a été proclamée le 2 octobre 1958, après le vote du 28 septembre.",
      },
      {
        id: "gn58-2",
        question: "Qu'ont voté les Guinéens au référendum de 1958 ?",
        options: ["Oui", "Non", "Ils n'ont pas voté", "Peut-être"],
        answer: 1,
        explanation: "Voter « non » signifiait choisir l'indépendance immédiate.",
      },
      {
        id: "gn58-3",
        question: "Qui fut le premier président de la Guinée ?",
        options: ["Samory Touré", "Ahmed Sékou Touré", "Camara Laye", "Lansana Conté"],
        answer: 1,
        explanation: "Ahmed Sékou Touré a dirigé le pays de 1958 à sa mort en 1984.",
      },
    ],
    related: ["pourquoi-nom-guinee", "quatre-regions-naturelles", "empire-du-mali-soundiata"],
    tags: ["indépendance", "1958", "Sékou Touré", "référendum"],
  },
  {
    slug: "pourquoi-nom-guinee",
    title: "Pourquoi la Guinée s'appelle-t-elle Guinée ?",
    category: "histoire",
    scope: "GN",
    difficulty: "facile",
    ageMin: 7,
    ageMax: 12,
    readingMinutes: 3,
    contentType: "explication",
    scene: "mer",
    intro:
      "Il existe plusieurs pays qui portent le nom « Guinée » : la Guinée, la Guinée-Bissau, la Guinée équatoriale… et même la Papouasie-Nouvelle-Guinée, en Océanie ! D'où vient ce mot ?",
    sections: [
      {
        heading: "Un nom donné à une grande côte",
        paragraphs: [
          "À partir du XVe siècle, les navigateurs européens, d'abord portugais, appellent « Guinée » une grande partie de la côte de l'Afrique de l'Ouest. Le grand golfe au sud de l'Afrique de l'Ouest s'appelle d'ailleurs toujours le « golfe de Guinée ».",
          "Plus tard, plusieurs colonies reçoivent ce nom : la Guinée française, la Guinée portugaise (aujourd'hui Guinée-Bissau) et la Guinée espagnole (aujourd'hui Guinée équatoriale).",
        ],
      },
      {
        heading: "Une origine encore discutée",
        paragraphs: [
          "Personne ne sait avec certitude d'où vient le mot « Guinée ». Les chercheurs proposent plusieurs explications.",
          "Une hypothèse souvent citée le rattache à une expression berbère désignant « le pays des Noirs ». Une autre le rapproche du nom de la ville de Djenné, au Mali. Aucune n'est prouvée.",
        ],
        uncertainty: "Ici, les spécialistes ne sont pas d'accord : c'est une question ouverte. Un bon lecteur sait reconnaître quand on ne sait pas encore.",
      },
      {
        heading: "Et la Papouasie-Nouvelle-Guinée ?",
        paragraphs: [
          "Au XVIe siècle, un navigateur espagnol a trouvé que les habitants de cette grande île d'Océanie ressemblaient à ceux de la côte de Guinée qu'il connaissait. Il l'a appelée « Nouvelle-Guinée ».",
        ],
      },
    ],
    glossary: [
      { word: "Hypothèse", definition: "Explication possible qu'on n'a pas encore prouvée." },
      { word: "Golfe", definition: "Grande partie de mer qui entre dans les terres." },
    ],
    sources: [{ title: "Dictionnaire historique de la langue française", publisher: "Le Robert", note: "Article « Guinée » (étymologie discutée)" }],
    status: "verifie",
    quiz: [
      {
        id: "nom-1",
        question: "Comment s'appelle le grand golfe de l'Afrique de l'Ouest ?",
        options: ["Golfe d'Aden", "Golfe de Guinée", "Golfe du Mexique", "Golfe Persique"],
        answer: 1,
        explanation: "Le golfe de Guinée garde le nom donné autrefois à cette côte.",
      },
      {
        id: "nom-2",
        question: "Connaît-on avec certitude l'origine du mot « Guinée » ?",
        options: ["Oui, elle est prouvée", "Non, plusieurs hypothèses existent"],
        answer: 1,
        explanation: "Les spécialistes proposent plusieurs explications, mais aucune n'est prouvée.",
      },
      {
        id: "nom-3",
        question: "Quel pays d'Océanie porte aussi le nom de Guinée ?",
        options: ["L'Australie", "La Papouasie-Nouvelle-Guinée", "Les Fidji", "La Nouvelle-Zélande"],
        answer: 1,
        explanation: "Un navigateur espagnol l'a nommée « Nouvelle-Guinée » au XVIe siècle.",
      },
    ],
    related: ["independance-guinee-1958", "afrique-54-pays"],
    tags: ["nom", "étymologie", "golfe de Guinée"],
  },
  {
    slug: "quatre-regions-naturelles",
    title: "Les quatre régions naturelles de la Guinée",
    category: "geographie",
    scope: "GN",
    difficulty: "facile",
    ageMin: 7,
    ageMax: 12,
    readingMinutes: 4,
    contentType: "fiche",
    scene: "fouta",
    intro:
      "De l'océan aux forêts, en passant par les plateaux et les savanes, la Guinée change de paysage d'une région à l'autre. Les géographes la divisent en quatre régions naturelles.",
    sections: [
      {
        heading: "La Guinée maritime (Basse-Guinée)",
        paragraphs: [
          "C'est la région côtière, le long de l'océan Atlantique. Il y fait chaud et humide, et il pleut beaucoup pendant la saison des pluies.",
          "On y trouve Conakry, la capitale, ainsi que Boké et Kindia. Les mangroves, ces forêts qui poussent dans l'eau salée, bordent la côte. On y cultive beaucoup de riz.",
        ],
      },
      {
        heading: "La Moyenne-Guinée (le Fouta-Djalon)",
        paragraphs: [
          "C'est une région de plateaux et de montagnes, avec des cascades et un climat plus frais. Labé et Mamou en sont des villes importantes.",
          "De nombreux fleuves y prennent leur source : on surnomme le Fouta-Djalon le « château d'eau de l'Afrique de l'Ouest ».",
        ],
      },
      {
        heading: "La Haute-Guinée",
        paragraphs: [
          "C'est une région de savanes, plus sèche, traversée par le fleuve Niger et ses affluents. Kankan et Faranah s'y trouvent.",
          "Elle fait partie de l'ancien pays mandingue, au cœur de l'histoire de l'Empire du Mali.",
        ],
      },
      {
        heading: "La Guinée forestière",
        paragraphs: [
          "Au sud-est, c'est le pays des forêts humides et des montagnes, comme le mont Nimba, point culminant du pays. N'Zérékoré en est la plus grande ville.",
          "On y cultive notamment le café, le cacao et le palmier à huile.",
        ],
        didYouKnow: "La Guinée compte aussi huit régions administratives : Boké, Conakry, Faranah, Kankan, Kindia, Labé, Mamou et N'Zérékoré.",
      },
    ],
    glossary: [
      { word: "Mangrove", definition: "Forêt de palétuviers qui pousse au bord de la mer, dans l'eau salée." },
      { word: "Plateau", definition: "Grande étendue de terrain plat située en hauteur." },
      { word: "Savane", definition: "Paysage d'herbes hautes avec quelques arbres." },
    ],
    sources: [{ title: "Atlas de la Guinée", publisher: "Éditions Jeune Afrique / manuels de géographie guinéens (référence à préciser)" }],
    status: "verifie",
    quiz: [
      {
        id: "reg-1",
        question: "Dans quelle région naturelle se trouve Conakry ?",
        options: ["Guinée forestière", "Haute-Guinée", "Guinée maritime", "Moyenne-Guinée"],
        answer: 2,
        explanation: "Conakry est sur la côte atlantique, en Guinée maritime.",
      },
      {
        id: "reg-2",
        question: "Quel est le surnom du Fouta-Djalon ?",
        options: ["Le château d'eau de l'Afrique de l'Ouest", "Le désert vert", "La porte du Sahara", "Le pays des lacs"],
        answer: 0,
        explanation: "De grands fleuves y prennent leur source.",
      },
      {
        id: "reg-3",
        question: "Quelle ville est la plus grande de la Guinée forestière ?",
        options: ["Labé", "N'Zérékoré", "Boké", "Kankan"],
        answer: 1,
        explanation: "N'Zérékoré est la grande ville de la Guinée forestière, non loin du mont Nimba.",
      },
    ],
    related: ["fouta-djalon-chateau-eau", "mont-nimba", "langues-de-guinee"],
    tags: ["régions", "géographie", "Conakry", "Labé", "Kankan", "N'Zérékoré"],
  },
  {
    slug: "fouta-djalon-chateau-eau",
    title: "Le Fouta-Djalon, château d'eau de l'Afrique de l'Ouest",
    category: "nature",
    scope: "GN",
    difficulty: "moyen",
    ageMin: 8,
    ageMax: 12,
    readingMinutes: 4,
    contentType: "documentaire",
    scene: "fouta",
    intro:
      "Imagine un massif de plateaux verts, de falaises et de cascades d'où partent des fleuves qui traversent plusieurs pays. C'est le Fouta-Djalon, au cœur de la Guinée.",
    sections: [
      {
        heading: "Pourquoi « château d'eau » ?",
        paragraphs: [
          "Un château d'eau est un réservoir placé en hauteur qui distribue l'eau. Le Fouta-Djalon joue un rôle semblable : il reçoit beaucoup de pluie, et de nombreux cours d'eau y naissent.",
          "Le fleuve Gambie et le Bafing, la principale branche du fleuve Sénégal, y prennent leur source. Le grand fleuve Niger, lui, naît un peu plus au sud-est, dans les hauteurs guinéennes proches de la frontière avec la Sierra Leone.",
        ],
        didYouKnow: "L'eau qui naît en Guinée traverse ensuite le Mali, le Niger, le Sénégal, la Gambie, la Mauritanie… Des millions de personnes en dépendent.",
      },
      {
        heading: "Un paysage de plateaux et de cascades",
        paragraphs: [
          "Le Fouta-Djalon est formé de hauts plateaux de grès, entaillés par des vallées profondes. On y trouve de nombreuses chutes d'eau.",
          "Le climat y est plus frais que sur la côte, surtout la nuit. Des villes comme Labé, Mamou, Pita ou Dalaba s'y trouvent.",
        ],
      },
      {
        heading: "Un patrimoine à protéger",
        paragraphs: [
          "Les feux de brousse, la coupe des arbres et l'érosion des sols menacent les sources. Quand les arbres disparaissent, l'eau ruisselle au lieu de s'infiltrer dans le sol.",
          "Protéger le Fouta-Djalon, c'est protéger l'eau de toute l'Afrique de l'Ouest. Des pays voisins coopèrent pour cela.",
        ],
      },
    ],
    glossary: [
      { word: "Source", definition: "Endroit où l'eau sort de terre et où commence un cours d'eau." },
      { word: "Érosion", definition: "Usure lente des sols et des roches par l'eau ou le vent." },
      { word: "Grès", definition: "Roche formée de grains de sable collés entre eux." },
    ],
    sources: [{ title: "Fouta-Djalon", publisher: "Encyclopædia Universalis" }, UNESCO_WH],
    status: "verifie",
    quiz: [
      {
        id: "fouta-1",
        question: "Quel fleuve prend sa source dans le Fouta-Djalon ?",
        options: ["Le Nil", "La Gambie", "Le Congo", "Le Zambèze"],
        answer: 1,
        explanation: "La Gambie et le Bafing (fleuve Sénégal) naissent dans le Fouta-Djalon.",
      },
      {
        id: "fouta-2",
        question: "Pourquoi faut-il protéger les arbres autour des sources ?",
        options: [
          "Parce qu'ils font du bruit",
          "Parce qu'ils aident l'eau à s'infiltrer dans le sol",
          "Parce qu'ils empêchent la pluie",
          "Ce n'est pas nécessaire",
        ],
        answer: 1,
        explanation: "Sans arbres, l'eau ruisselle, les sols s'abîment et les sources peuvent s'affaiblir.",
      },
      {
        id: "fouta-3",
        question: "Quelle ville se trouve dans le Fouta-Djalon ?",
        options: ["Labé", "Conakry", "Kankan", "Boké"],
        answer: 0,
        explanation: "Labé est une grande ville du Fouta-Djalon, en Moyenne-Guinée.",
      },
    ],
    related: ["quatre-regions-naturelles", "mont-nimba"],
    tags: ["Fouta-Djalon", "fleuves", "eau", "Niger", "Gambie", "Sénégal"],
  },
  {
    slug: "mont-nimba",
    title: "Le mont Nimba, une montagne-trésor",
    category: "nature",
    scope: "GN",
    difficulty: "moyen",
    ageMin: 8,
    ageMax: 12,
    readingMinutes: 3,
    contentType: "documentaire",
    scene: "montagne",
    intro:
      "Le mont Nimba est le plus haut sommet de la Guinée. Partagé avec la Côte d'Ivoire et le Liberia, il abrite des animaux et des plantes qu'on ne trouve nulle part ailleurs.",
    sections: [
      {
        heading: "Le toit de la Guinée",
        paragraphs: [
          "Le sommet du mont Nimba atteint environ 1 752 mètres. Il se trouve en Guinée forestière, au sud-est du pays, là où se rejoignent les frontières de la Guinée, de la Côte d'Ivoire et du Liberia.",
        ],
      },
      {
        heading: "Un patrimoine mondial",
        paragraphs: [
          "En 1981, la Réserve naturelle intégrale du mont Nimba a été inscrite sur la Liste du patrimoine mondial de l'UNESCO. La partie ivoirienne a été ajoutée ensuite.",
          "On y trouve des forêts, des prairies de montagne et de nombreuses espèces rares, comme le crapaud vivipare du Nimba, un petit amphibien qui met au monde des petits déjà formés au lieu de pondre des œufs.",
        ],
        didYouKnow: "Le site figure aussi sur la liste du patrimoine mondial en péril, car il est menacé, notamment par les projets miniers.",
      },
      {
        heading: "Concilier richesse et protection",
        paragraphs: [
          "La montagne contient aussi du minerai de fer. Les pays doivent trouver comment exploiter leurs ressources sans détruire un milieu unique.",
        ],
      },
    ],
    glossary: [
      { word: "Espèce", definition: "Groupe d'êtres vivants semblables qui peuvent se reproduire entre eux." },
      { word: "Vivipare", definition: "Se dit d'un animal qui met au monde des petits vivants au lieu de pondre des œufs." },
    ],
    sources: [{ title: "Réserve naturelle intégrale du mont Nimba", publisher: "UNESCO", url: "https://whc.unesco.org/fr/list/155" }],
    status: "verifie",
    quiz: [
      {
        id: "nimba-1",
        question: "Quelle est la hauteur approximative du mont Nimba ?",
        options: ["500 m", "1 752 m", "4 000 m", "8 848 m"],
        answer: 1,
        explanation: "Il culmine à environ 1 752 mètres, c'est le point le plus haut de la Guinée.",
      },
      {
        id: "nimba-2",
        question: "Avec quels pays la Guinée partage-t-elle le mont Nimba ?",
        options: ["Mali et Sénégal", "Côte d'Ivoire et Liberia", "Ghana et Togo", "Sierra Leone et Gambie"],
        answer: 1,
        explanation: "Les frontières de la Guinée, de la Côte d'Ivoire et du Liberia s'y rejoignent.",
      },
      {
        id: "nimba-3",
        question: "Que signifie « vivipare » ?",
        options: ["Qui vit la nuit", "Qui met au monde des petits vivants", "Qui vit dans l'eau", "Qui mange des plantes"],
        answer: 1,
        explanation: "Le crapaud vivipare du Nimba met au monde des petits déjà formés.",
      },
    ],
    related: ["fouta-djalon-chateau-eau", "quatre-regions-naturelles"],
    tags: ["Nimba", "UNESCO", "biodiversité", "Guinée forestière"],
  },
  {
    slug: "sosso-bala",
    title: "Le Sosso-Bala, un balafon de huit siècles",
    category: "musique",
    scope: "GN",
    difficulty: "moyen",
    ageMin: 8,
    ageMax: 12,
    readingMinutes: 4,
    contentType: "documentaire",
    scene: "musique",
    intro:
      "Dans le village de Niagassola, en Haute-Guinée, une famille veille sur un balafon très ancien et sacré : le Sosso-Bala. La tradition raconte qu'il remonte à l'époque de Soundiata Keïta.",
    sections: [
      {
        heading: "Qu'est-ce qu'un balafon ?",
        paragraphs: [
          "Le balafon est un instrument de musique fait de lames de bois posées sur un cadre. Sous chaque lame est accrochée une calebasse qui fait résonner le son. On le joue avec des baguettes.",
        ],
      },
      {
        heading: "Le balafon de Soumaoro",
        paragraphs: [
          "Selon la tradition orale mandingue, le Sosso-Bala appartenait à Soumaoro Kanté, roi du Sosso, avant de revenir aux Mandingues après la bataille de Kirina, au XIIIe siècle.",
          "Depuis, la famille des Kouyaté, une famille de griots, en est la gardienne. Le balafon n'est joué qu'en de rares occasions.",
        ],
        uncertainty: "L'âge exact de l'instrument ne peut pas être prouvé : c'est la tradition orale qui le rattache au XIIIe siècle.",
      },
      {
        heading: "Un patrimoine reconnu par le monde",
        paragraphs: [
          "En 2001, l'UNESCO a proclamé l'Espace culturel du Sosso-Bala chef-d'œuvre du patrimoine oral et immatériel de l'humanité. Il est aujourd'hui inscrit sur la liste représentative du patrimoine culturel immatériel.",
          "Ce qui est protégé, ce n'est pas seulement l'objet : c'est aussi tout le savoir des griots, la musique et les récits qui l'accompagnent.",
        ],
      },
    ],
    glossary: [
      { word: "Griot", definition: "Gardien de la mémoire, musicien et conteur qui transmet l'histoire par la parole." },
      { word: "Calebasse", definition: "Fruit séché et vidé, utilisé comme récipient ou pour faire résonner un instrument." },
      { word: "Patrimoine immatériel", definition: "Savoirs, musiques, fêtes ou récits qu'on transmet, et qu'on ne peut pas toucher." },
    ],
    sources: [
      { title: "L'Espace culturel du Sosso-Bala", publisher: "UNESCO", url: "https://ich.unesco.org/fr/RL/lespace-culturel-du-sosso-bala-00009" },
      UNESCO_ICH,
    ],
    status: "verifie",
    quiz: [
      {
        id: "bala-1",
        question: "Dans quel village est conservé le Sosso-Bala ?",
        options: ["Niagassola", "Kindia", "Timbo", "Boké"],
        answer: 0,
        explanation: "Il est conservé à Niagassola, en Haute-Guinée.",
      },
      {
        id: "bala-2",
        question: "Qu'est-ce qui fait résonner le son du balafon ?",
        options: ["Des calebasses", "Des cordes", "Un tambour", "Un moteur"],
        answer: 0,
        explanation: "Sous chaque lame de bois, une calebasse amplifie le son.",
      },
      {
        id: "bala-3",
        question: "Quelle famille de griots garde le Sosso-Bala ?",
        options: ["Les Kouyaté", "Les Keïta", "Les Touré", "Les Diallo"],
        answer: 0,
        explanation: "La famille Kouyaté en est la gardienne depuis des siècles, selon la tradition.",
      },
    ],
    related: ["kora-balafon-djembe", "empire-du-mali-soundiata", "griots-oralite"],
    tags: ["balafon", "UNESCO", "griots", "Niagassola"],
  },
  {
    slug: "langues-de-guinee",
    title: "Bonjour en plusieurs langues : les langues de Guinée",
    category: "cultures",
    scope: "GN",
    difficulty: "facile",
    ageMin: 7,
    ageMax: 12,
    readingMinutes: 3,
    contentType: "fiche",
    scene: "ville",
    intro:
      "En Guinée, beaucoup d'enfants parlent deux, trois langues ou plus ! À côté du français, langue officielle, de nombreuses langues nationales sont parlées chaque jour.",
    sections: [
      {
        heading: "Des langues très diverses",
        paragraphs: [
          "Parmi les langues les plus parlées, on trouve le pular (ou peul), le maninka (ou malinké) et le susu (ou soussou). En Guinée forestière, on parle notamment le kissi, le kpelle (aussi appelé guerzé) et le loma (aussi appelé toma).",
          "Il existe bien d'autres langues, comme le baga, le nalu, le landuma, le coniagui ou le bassari. Chaque langue porte une manière de voir le monde.",
        ],
      },
      {
        heading: "Des langues qui voyagent",
        paragraphs: [
          "Ces langues ne s'arrêtent pas aux frontières : le pular est parlé dans de nombreux pays d'Afrique de l'Ouest et du Centre, et le maninka est proche du bambara du Mali et du dioula de Côte d'Ivoire.",
        ],
        didYouKnow: "L'écriture N'Ko a été inventée en 1949 par Solomana Kanté, un savant guinéen, pour écrire les langues mandingues.",
      },
      {
        heading: "Quelques mots pour commencer",
        paragraphs: [
          "En pular, on dit « A jaraama » pour remercier. En maninka, « I ni ce » est une salutation qui sert aussi à remercier.",
          "Demande à tes parents, à tes grands-parents ou à tes voisins comment on dit « bonjour » et « merci » dans leurs langues !",
        ],
        uncertainty: "L'orthographe des langues guinéennes peut varier. Ces exemples doivent être vérifiés par des locuteurs et des linguistes avant publication officielle.",
      },
    ],
    glossary: [
      { word: "Langue officielle", definition: "Langue utilisée par l'État, l'administration et l'école." },
      { word: "Langue nationale", definition: "Langue parlée par une partie de la population d'un pays et reconnue par lui." },
      { word: "Locuteur", definition: "Personne qui parle une langue." },
    ],
    sources: [{ title: "Ethnologue — Langues de Guinée", publisher: "SIL International", url: "https://www.ethnologue.com/country/GN/" }],
    status: "a-valider",
    validationNote: "Exemples de vocabulaire et orthographes à faire valider par des locuteurs natifs et l'Académie des langues de Guinée.",
    quiz: [
      {
        id: "lang-1",
        question: "Quelle est la langue officielle de la Guinée ?",
        options: ["Le pular", "Le français", "L'anglais", "Le susu"],
        answer: 1,
        explanation: "Le français est la langue officielle ; les langues nationales sont parlées partout au quotidien.",
      },
      {
        id: "lang-2",
        question: "Qui a inventé l'écriture N'Ko ?",
        options: ["Camara Laye", "Solomana Kanté", "Samory Touré", "Mory Kanté"],
        answer: 1,
        explanation: "Solomana Kanté a créé l'alphabet N'Ko en 1949.",
      },
      {
        id: "lang-3",
        question: "Comment appelle-t-on aussi le kpelle en Guinée ?",
        options: ["Le guerzé", "Le baga", "Le wolof", "Le twi"],
        answer: 0,
        explanation: "Le kpelle est aussi appelé guerzé en Guinée forestière.",
      },
    ],
    related: ["diversite-culturelle-guinee", "quatre-regions-naturelles"],
    tags: ["langues", "pular", "maninka", "susu", "N'Ko"],
  },
  {
    slug: "diversite-culturelle-guinee",
    title: "Une Guinée, mille façons de vivre",
    category: "cultures",
    scope: "GN",
    difficulty: "facile",
    ageMin: 7,
    ageMax: 12,
    readingMinutes: 3,
    contentType: "explication",
    scene: "savane",
    intro:
      "Peuls, Malinkés, Soussous, Kissis, Tomas, Guerzés, Bagas, Nalus et bien d'autres : la Guinée réunit de nombreuses communautés. Leur diversité est une richesse.",
    sections: [
      {
        heading: "Aucune communauté n'est « toute pareille »",
        paragraphs: [
          "On parle souvent d'une communauté comme si tout le monde y vivait de la même façon. En réalité, à l'intérieur d'un même groupe, les habitudes changent d'un village à l'autre, d'une ville à l'autre et d'une famille à l'autre.",
          "Un enfant de Conakry et un enfant d'un village du Fouta peuvent parler la même langue et avoir pourtant des quotidiens très différents.",
        ],
      },
      {
        heading: "Des liens qui rapprochent",
        paragraphs: [
          "Les communautés de Guinée vivent ensemble depuis très longtemps. Elles se marient entre elles, commercent, partagent des fêtes.",
          "Il existe aussi en Afrique de l'Ouest une tradition de « parenté à plaisanterie » : des familles ou des groupes ont le droit de se taquiner gentiment, ce qui aide à éviter les conflits.",
        ],
      },
      {
        heading: "Apprendre à respecter",
        paragraphs: [
          "Connaître les autres cultures aide à mieux les respecter. Poser des questions avec curiosité et politesse est la meilleure façon d'apprendre.",
        ],
      },
    ],
    glossary: [
      { word: "Communauté", definition: "Groupe de personnes qui partagent une langue, une histoire ou des traditions." },
      { word: "Parenté à plaisanterie", definition: "Coutume qui permet à certains groupes de se taquiner pour renforcer l'amitié." },
    ],
    sources: [{ title: "Parenté à plaisanterie (sanankuya)", publisher: "Travaux d'anthropologie ouest-africaine (référence à préciser)" }],
    status: "a-valider",
    validationNote: "À relire avec des représentants de différentes communautés et régions pour garantir un ton juste et respectueux.",
    quiz: [
      {
        id: "div-1",
        question: "Tous les membres d'une même communauté vivent-ils exactement de la même façon ?",
        options: ["Oui, toujours", "Non, les habitudes varient selon les lieux et les familles"],
        answer: 1,
        explanation: "Il y a beaucoup de diversité à l'intérieur de chaque communauté.",
      },
      {
        id: "div-2",
        question: "À quoi sert la parenté à plaisanterie ?",
        options: ["À se disputer", "À renforcer l'amitié et éviter les conflits", "À faire peur", "À rien"],
        answer: 1,
        explanation: "Les taquineries permises rapprochent les groupes.",
      },
    ],
    related: ["langues-de-guinee", "griots-oralite"],
    tags: ["cultures", "communautés", "respect"],
  },
  {
    slug: "bauxite-guinee",
    title: "La bauxite : du sol guinéen à la canette en aluminium",
    category: "economie",
    scope: "GN",
    difficulty: "moyen",
    ageMin: 9,
    ageMax: 12,
    readingMinutes: 4,
    contentType: "explication",
    scene: "savane",
    intro:
      "As-tu déjà tenu une canette, une casserole ou une fenêtre en aluminium ? Ce métal léger vient souvent d'une roche rouge appelée bauxite. Et la Guinée en possède énormément.",
    sections: [
      {
        heading: "Une roche rouge très précieuse",
        paragraphs: [
          "La bauxite est une roche riche en aluminium. La Guinée possède parmi les plus grandes réserves de bauxite du monde, notamment dans la région de Boké.",
          "La Guinée est aujourd'hui l'un des tout premiers pays exportateurs de bauxite au monde.",
        ],
      },
      {
        heading: "De la roche au métal",
        paragraphs: [
          "D'abord, on extrait la bauxite dans des mines. Ensuite, on la transforme en une poudre blanche, l'alumine. Enfin, grâce à beaucoup d'électricité, on transforme l'alumine en aluminium.",
          "Plus ces étapes sont réalisées dans le pays, plus elles créent d'emplois et de richesses sur place.",
        ],
      },
      {
        heading: "Les défis",
        paragraphs: [
          "Les mines peuvent abîmer les terres agricoles, la poussière gêne les habitants et l'eau peut être polluée. Il faut donc des règles pour protéger l'environnement et les populations.",
          "L'aluminium a un grand avantage : il peut être recyclé presque à l'infini !",
        ],
      },
    ],
    glossary: [
      { word: "Minerai", definition: "Roche qui contient un métal qu'on peut extraire." },
      { word: "Exporter", definition: "Vendre des produits à un autre pays." },
      { word: "Recycler", definition: "Transformer un objet usagé pour en fabriquer un nouveau." },
    ],
    sources: [{ title: "Mineral Commodity Summaries — Bauxite and Alumina", publisher: "U.S. Geological Survey", url: "https://www.usgs.gov/centers/national-minerals-information-center/bauxite-and-alumina-statistics-and-information" }],
    status: "verifie",
    quiz: [
      {
        id: "baux-1",
        question: "Quel métal fabrique-t-on à partir de la bauxite ?",
        options: ["Le fer", "L'or", "L'aluminium", "Le cuivre"],
        answer: 2,
        explanation: "La bauxite est transformée en alumine, puis en aluminium.",
      },
      {
        id: "baux-2",
        question: "Quelle région guinéenne est connue pour ses mines de bauxite ?",
        options: ["Boké", "N'Zérékoré", "Labé", "Kankan"],
        answer: 0,
        explanation: "La région de Boké contient d'immenses gisements.",
      },
      {
        id: "baux-3",
        question: "Quel est un grand avantage de l'aluminium ?",
        options: ["Il est très lourd", "Il se recycle très bien", "Il fond au soleil", "Il est comestible"],
        answer: 1,
        explanation: "L'aluminium se recycle presque indéfiniment.",
      },
    ],
    related: ["energie-solaire-afrique", "fonio-cereale"],
    tags: ["bauxite", "aluminium", "mines", "Boké"],
  },
  {
    slug: "camara-laye-enfant-noir",
    title: "Camara Laye et « L'Enfant noir »",
    category: "litterature",
    scope: "GN",
    difficulty: "moyen",
    ageMin: 9,
    ageMax: 12,
    readingMinutes: 3,
    contentType: "portrait",
    scene: "nuit",
    intro:
      "En 1953, un jeune Guinéen publie un livre qui raconte son enfance à Kouroussa. Ce livre, « L'Enfant noir », est devenu l'un des romans africains les plus lus au monde.",
    sections: [
      {
        heading: "Un enfant de Kouroussa",
        paragraphs: [
          "Camara Laye est né en 1928 à Kouroussa, en Haute-Guinée. Son père était forgeron et orfèvre, un métier entouré de respect et de savoirs secrets.",
          "Il part ensuite étudier à Conakry, puis en France, où il écrit le récit de son enfance.",
        ],
      },
      {
        heading: "Ce que raconte le livre",
        paragraphs: [
          "Dans « L'Enfant noir », il décrit l'atelier de son père, la vie chez ses grands-parents, l'école, les cérémonies et le moment où il doit quitter sa famille pour étudier.",
          "Le livre a reçu le prix Charles-Veillon en 1954. Il est étudié dans de nombreuses écoles d'Afrique et d'ailleurs.",
        ],
      },
      {
        heading: "Un écrivain de la mémoire",
        paragraphs: [
          "Plus tard, Camara Laye a aussi recueilli la parole des griots, dans « Le Maître de la parole », consacré à l'épopée de Soundiata. Il est mort en 1980.",
        ],
      },
    ],
    glossary: [
      { word: "Orfèvre", definition: "Artisan qui fabrique des objets en or ou en argent." },
      { word: "Récit autobiographique", definition: "Histoire où l'auteur raconte sa propre vie." },
    ],
    sources: [{ title: "L'Enfant noir", publisher: "Camara Laye, Plon, 1953" }],
    status: "verifie",
    quiz: [
      {
        id: "laye-1",
        question: "Dans quelle ville Camara Laye a-t-il grandi ?",
        options: ["Kouroussa", "Dakar", "Bamako", "Accra"],
        answer: 0,
        explanation: "Il est né et a grandi à Kouroussa, en Haute-Guinée.",
      },
      {
        id: "laye-2",
        question: "Quel métier exerçait son père ?",
        options: ["Pêcheur", "Forgeron et orfèvre", "Médecin", "Commerçant"],
        answer: 1,
        explanation: "Son père était forgeron et travaillait l'or.",
      },
      {
        id: "laye-3",
        question: "« L'Enfant noir » raconte…",
        options: ["Un voyage dans l'espace", "L'enfance de l'auteur", "Une guerre", "La vie d'un roi"],
        answer: 1,
        explanation: "C'est un récit autobiographique sur son enfance en Guinée.",
      },
    ],
    related: ["griots-oralite", "empire-du-mali-soundiata"],
    tags: ["littérature", "roman", "Kouroussa"],
  },
];
