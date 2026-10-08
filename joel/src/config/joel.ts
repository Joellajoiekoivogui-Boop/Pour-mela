// ─────────────────────────────────────────────────────────────────────
//  Tous les textes du site, rassemblés ici. Modifie entre les guillemets,
//  enregistre : la page se met à jour.
// ─────────────────────────────────────────────────────────────────────

export type IconeAmbition = "fusee" | "robot" | "globe" | "ampoule";

export interface Photo {
  /** Chemin depuis public/ (ex. "photos/joel-1.jpg"). */
  src: string;
  /** Description de la photo (lue par les lecteurs d'écran). */
  alt: string;
  /** Petite légende dans la visionneuse. */
  legende?: string;
  /** Largeur / hauteur, pour réserver la place avant le chargement. */
  largeur: number;
  hauteur: number;
}

export interface Souvenir {
  photo: Photo;
  date: string;
  titre: string;
  texte: string;
}

export const joel = {
  prenom: "Joël",
  nomComplet: "Joël Koivogui",

  /** Jour de l'anniversaire (mois de 1 à 12). */
  anniversaire: { mois: 10, jour: 10 },
  /** Après l'anniversaire, nombre de jours pendant lesquels on dit « une nouvelle année vient de commencer ». */
  joursApres: 60,

  intro: {
    sousTitre: "Une nouvelle année commence.",
    invitation: "Scroll to enter",
    son: "🔊 Activer l'expérience",
  },

  compteARebours: {
    titre: "Le compte à rebours commence",
    avant: "Le moment approche…",
    jourJ: "C'est aujourd'hui.",
    apres: "Une nouvelle année vient de commencer.",
    prochain: "Prochain 10 octobre dans",
  },

  nouvelleAnnee: {
    ouverture: "Une année de plus ne signifie pas simplement une année écoulée.",
    etapes: ["C'est une nouvelle page.", "De nouvelles idées.", "De nouveaux projets.", "De nouveaux défis."],
    final: "Une nouvelle ère.",
  },

  parcours: {
    titre: "Le parcours continue",
    etapes: [
      { titre: "Apprendre", texte: "Transformer la curiosité en compétences." },
      { titre: "Créer", texte: "Donner vie aux idées grâce au code, au design et à l'intelligence artificielle." },
      { titre: "Transmettre", texte: "Partager ses connaissances avec les autres." },
      { titre: "Entreprendre", texte: "Transformer les idées en projets réels." },
      { titre: "Construire", texte: "Créer des solutions capables d'avoir un véritable impact." },
    ],
  },

  ambitions: {
    titre: "Et maintenant\u00a0?",
    cartes: [
      { icone: "fusee", emoji: "🚀", titre: "Technologie", texte: "Continuer à progresser dans le développement web, mobile et l'intelligence artificielle." },
      { icone: "robot", emoji: "🤖", titre: "Robotique", texte: "Explorer davantage l'électronique, l'IoT et les systèmes intelligents." },
      { icone: "globe", emoji: "🌍", titre: "Impact", texte: "Participer à la transformation numérique et transmettre les compétences." },
      { icone: "ampoule", emoji: "💡", titre: "Innovation", texte: "Créer des produits et des expériences utiles." },
    ] satisfies { icone: IconeAmbition; emoji: string; titre: string; texte: string }[],
  },

  // Pour mettre ses vraies photos : dépose-les dans public/photos/ puis
  // remplace les lignes ci-dessous (garde largeur et hauteur à peu près justes).
  galerie: {
    titre: "Galerie",
    sousTitre: "Des instants, des lumières, des fragments d'une année.",
    photos: [
      { src: "photos/oeuvre-1.svg", alt: "Œuvre lumineuse : une aube violette", legende: "L'aube d'une nouvelle année", largeur: 900, hauteur: 1200 },
      { src: "photos/oeuvre-2.svg", alt: "Œuvre lumineuse : des orbites", legende: "Tout gravite autour d'une idée", largeur: 1200, hauteur: 900 },
      { src: "photos/oeuvre-3.svg", alt: "Œuvre lumineuse : une constellation", legende: "Relier les points", largeur: 900, hauteur: 900 },
      { src: "photos/oeuvre-4.svg", alt: "Œuvre lumineuse : des ondes", legende: "Le signal", largeur: 900, hauteur: 1300 },
      { src: "photos/oeuvre-5.svg", alt: "Œuvre lumineuse : une grille en perspective", legende: "Construire", largeur: 1200, hauteur: 800 },
      { src: "photos/oeuvre-6.svg", alt: "Œuvre lumineuse : un circuit", legende: "Le code, la matière", largeur: 900, hauteur: 1100 },
      { src: "photos/oeuvre-7.svg", alt: "Œuvre lumineuse : un horizon", legende: "Ce qui vient", largeur: 1200, hauteur: 900 },
      { src: "photos/oeuvre-8.svg", alt: "Œuvre lumineuse : le nombre 10", legende: "10.10", largeur: 900, hauteur: 1200 },
    ] satisfies Photo[],
  },

  souvenirs: {
    titre: "Quelques souvenirs",
    liste: [
      {
        photo: { src: "photos/oeuvre-1.svg", alt: "Souvenir : une journée particulière", largeur: 900, hauteur: 1200 },
        date: "Janvier",
        titre: "Une journée particulière.",
        texte: "De celles qu'on garde longtemps en mémoire.",
      },
      {
        photo: { src: "photos/oeuvre-3.svg", alt: "Souvenir : une nouvelle rencontre", largeur: 900, hauteur: 900 },
        date: "Avril",
        titre: "Une nouvelle rencontre.",
        texte: "Les bonnes personnes arrivent au bon moment.",
      },
      {
        photo: { src: "photos/oeuvre-6.svg", alt: "Souvenir : un projet qui commence", largeur: 900, hauteur: 1100 },
        date: "Juin",
        titre: "Un projet qui a commencé.",
        texte: "Une première ligne de code, puis mille autres.",
      },
      {
        photo: { src: "photos/oeuvre-2.svg", alt: "Souvenir : une idée devenue réalité", largeur: 1200, hauteur: 900 },
        date: "Septembre",
        titre: "Une idée devenue réalité.",
        texte: "Ce qui n'était qu'un croquis existe maintenant.",
      },
    ] satisfies Souvenir[],
  },

  lettre: {
    ouverture: "À Joël,",
    lignes: ["Continue d'apprendre.", "Continue de créer.", "Continue de rêver grand.", "Mais surtout, continue d'avancer."],
    final: "Le meilleur reste à construire.",
  },

  message: {
    titre: "Joyeux anniversaire Joël 🎂",
    paragraphes: [
      "Que cette nouvelle année soit remplie d'opportunités, de belles rencontres, de projets ambitieux et de moments dont tu seras fier.",
      "Que chaque difficulté devienne une expérience.",
      "Que chaque erreur devienne une leçon.",
      "Que chaque idée puisse trouver le moyen de devenir réalité.",
      "Et surtout, que tu continues à construire la personne que tu veux devenir.",
    ],
  },

  final: {
    formes: ["JOËL", "10.10", "HAPPY BIRTHDAY"],
    bouton: "🎉 Célébrer",
    rejouer: "Revivre la fin",
    messages: [
      "Une nouvelle année commence !",
      "Que du positif pour cette nouvelle étape.",
      "Continue de construire.",
      "Le meilleur reste à venir.",
      "Joyeux anniversaire Joël 🎂",
    ],
  },

  secrets: {
    logo: "Le logo a parlé : JOËL × 10 ✨",
    geste: "Tu as dessiné un cercle parfait. Boom. 💥",
    clavier: "MODE SECRET ACTIVÉ 🤫",
    etoile: "Tu as trouvé l'étoile cachée. Fais un vœu ✨",
  },

  /** Musique : vide = musique douce composée en direct ; sinon un fichier dans public/ (ex. "/musique.mp3"). */
  musique: { fichier: "" },

  pied: "Fait avec soin pour Joël · 10.10",
};

export const CHAPITRES = [
  { id: "accueil", numero: "01", nom: "Accueil", sousTitre: "Entrée dans l'univers" },
  { id: "compte-a-rebours", numero: "02", nom: "Compte à rebours", sousTitre: "Le compte à rebours" },
  { id: "nouvelle-annee", numero: "03", nom: "Une nouvelle année", sousTitre: "Une nouvelle année" },
  { id: "parcours", numero: "04", nom: "Parcours", sousTitre: "Le parcours" },
  { id: "ambitions", numero: "05", nom: "Ambitions", sousTitre: "Les ambitions" },
  { id: "souvenirs", numero: "06", nom: "Souvenirs", sousTitre: "Les souvenirs" },
  { id: "message", numero: "07", nom: "Message", sousTitre: "Le message" },
  { id: "celebration", numero: "08", nom: "Célébration", sousTitre: "La célébration" },
] as const;

export type ChapitreId = (typeof CHAPITRES)[number]["id"];
