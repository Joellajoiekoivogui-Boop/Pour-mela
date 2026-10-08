/* ==========================================================================
   ✏️  PERSONNALISATION
   --------------------------------------------------------------------------
   Tous les textes de l'expérience sont ici. Modifie ce qui est entre les
   guillemets, enregistre : la page se met à jour toute seule (npm run dev).

   Règles simples pour ne rien casser :
   • garde les guillemets "..." autour de chaque texte ;
   • garde la virgule à la fin de chaque ligne de liste ;
   • les émojis sont permis (👑 ✨ ❤️ 🌹).
   ========================================================================== */

export const reine = {
  /* 1. SON NOM
        `prenom` est formé en milliers de particules dorées : garde-le court.
        `suiteDuNom` s'écrit juste en dessous, en lettres capitales.        */
  prenom: "Bhama",
  suiteDuNom: "Jeanne Kolié",

  /* Ta signature, en bas de la révélation finale (vide = pas de signature). */
  signature: "Joël",

  /* 2. L'INTRODUCTION
        Les phrases apparaissent lettre par lettre, l'une après l'autre,
        puis le prénom se forme dans les étoiles.                           */
  intro: {
    phrases: [
      "Certaines personnes entrent dans notre vie par hasard…",
      "d’autres y entrent comme une lumière qu’on n’attendait plus.",
      "Et cette lumière-là porte un nom.",
    ],
    sousLePrenom: "Une reine. Une amie. Une évidence.",
    bouton: "Entrer dans son royaume",
    conseilSon: "Monte le son, c’est mieux avec la musique",
  },

  /* 3. CHAPITRE I — MA REINE                                                */
  maReine: {
    chapitre: "Chapitre I",
    titre: "Ma Reine",
    accroche:
      "Il y a des couronnes qui ne se portent pas sur la tête. Elles se voient dans un regard, dans une façon d’aimer, dans une manière de rester digne quand tout vacille.",
    /* La photo (facultative).
       Dépose-la dans le dossier « public/photos/ », par exemple
       public/photos/bhama.jpg, puis écris :  src: "photos/bhama.jpg"
       `cadrage` = où se trouve le visage (largeur puis hauteur, en %).
       Conseil : une photo verticale d'environ 1000 px de large (.jpg/.webp).
       Laisse src vide ("") : un médaillon à son initiale la remplace.     */
    photo: {
      src: "photos/bhama-portrait.jpg",
      alt: "Bhama, la reine de cette histoire",
      cadrage: "44% 30%",
      legende: "Celle qui illumine sans même le savoir.",
    },
  },

  /* 4. CHAPITRE II — LA DÉCLARATION
        Chaque ligne s'allume mot après mot pendant qu'on fait défiler.
        style : "texte" (normal), "grand" (en très grand), "plume" (écrit à
        la main, en or).                                                     */
  declaration: {
    chapitre: "Chapitre II",
    titre: "Ce que je voulais te dire",
    paragraphes: [
      { style: "grand", texte: "Il y a des rencontres qui ne font aucun bruit." },
      { style: "texte", texte: "Elles arrivent doucement, sans prévenir. Et puis un jour, on se rend compte qu’elles ont tout illuminé." },
      { style: "plume", texte: "Toi, Bhama, tu fais partie de ces rencontres-là." },
      { style: "texte", texte: "Tu as cette façon unique d’éclairer un endroit sans même t’en rendre compte. Ta présence apaise, ton rire est contagieux, et ta force inspire tous ceux qui ont la chance de croiser ton chemin." },
      { style: "grand", texte: "On dit qu’une reine se reconnaît à sa couronne. Moi, je t’ai reconnue à ton cœur." },
      { style: "texte", texte: "À ta manière d’écouter vraiment. À ta loyauté qui ne fléchit jamais. À cette élégance tranquille que tu portes partout où tu vas." },
      { style: "texte", texte: "Tu es une amie rare. De celles qu’on garde précieusement, comme un trésor qu’on ne montre pas à tout le monde." },
      { style: "plume", texte: "Alors merci. Merci d’être exactement toi." },
    ],
  },

  /* 5. CHAPITRE III — SOUVENIRS & AMITIÉ
        Une ligne par souvenir ou par qualité. Ajoutes-en autant que tu veux.
        icone : "etoile", "sourire", "main", "rire", "couronne", "coeur",
                "rose" ou "infini".
        photo (facultative) : une image de public/photos/, et son `cadrage`
                (où se trouve le visage, largeur puis hauteur en %).          */
  souvenirs: {
    chapitre: "Chapitre III",
    titre: "Nos souvenirs, tes merveilles",
    liste: [
      { moment: "Le commencement", titre: "Notre rencontre", texte: "Un jour comme les autres… qui ne l’était pas du tout. Ce jour-là, sans le savoir, j’ai rencontré quelqu’un d’exceptionnel.", icone: "etoile", photo: "photos/souvenir-rencontre.jpg", cadrage: "48% 30%" },
      { moment: "Chaque jour", titre: "Ton sourire", texte: "Celui qui transforme une journée grise en souvenir lumineux. Il devrait être classé trésor national.", icone: "sourire", photo: "photos/souvenir-sourire.jpg", cadrage: "55% 28%" },
      { moment: "Dans les moments durs", titre: "Ta loyauté", texte: "Tu es de celles qui restent. Qui écoutent. Qui tiennent la main quand le monde tremble.", icone: "main", photo: "photos/souvenir-loyaute.jpg", cadrage: "55% 22%" },
      { moment: "Nos fous rires", titre: "Ta joie", texte: "Ces rires qui arrivent sans prévenir, qui font mal au ventre et qu’on se raconte encore des jours après.", icone: "rire", photo: "photos/souvenir-joie.jpg", cadrage: "20% 40%" },
      { moment: "Toujours", titre: "Ta force", texte: "Tu avances la tête haute, fière de tes couleurs, avec grâce, même quand c’est difficile. C’est ça, la vraie couronne.", icone: "couronne", photo: "photos/souvenir-force.jpg", cadrage: "45% 30%" },
      { moment: "Pour longtemps", titre: "Notre amitié", texte: "Un lien rare et précieux, que je compte bien garder longtemps. Très longtemps.", icone: "infini", photo: "photos/souvenir-amitie.jpg", cadrage: "50% 32%" },
    ],
  },

  /* 5 bis. LA GALERIE DE LUMIÈRE
        Un anneau de photos en 3D qui tourne seul ; on le fait pivoter du
        doigt, un toucher sur une photo l'amène devant.                    */
  galerie: {
    surtitre: "Interlude",
    titre: "Ta lumière en images",
    consigne: "Fais tourner l’anneau du doigt, touche une photo.",
    photos: [
      { src: "photos/bhama-portrait.jpg", cadrage: "44% 30%" },
      { src: "photos/souvenir-sourire.jpg", cadrage: "55% 28%" },
      { src: "photos/souvenir-rencontre.jpg", cadrage: "48% 30%" },
      { src: "photos/souvenir-force.jpg", cadrage: "45% 30%" },
      { src: "photos/souvenir-amitie.jpg", cadrage: "50% 32%" },
      { src: "photos/souvenir-loyaute.jpg", cadrage: "55% 22%" },
      { src: "photos/souvenir-joie.jpg", cadrage: "20% 40%" },
    ],
  },

  /* 6. CHAPITRE IV — SON ROYAUME (la partie interactive)                    */
  royaume: {
    chapitre: "Chapitre IV",
    titre: "Ton royaume, tes étoiles",
    consigne: "Allume chaque étoile pour dessiner ta couronne.",
    jeuTermine: "Tu illumines tout ce que tu touches.",
    libre: "Puis touche l’écran, glisse ton doigt : la lumière t’obéit.",
  },

  /* 7. CHAPITRE V — LA RÉVÉLATION FINALE
        Les lignes apparaissent l'une après l'autre au-dessus d'un cœur de
        lumière, puis tout s'embrase.                                       */
  final: {
    chapitre: "Chapitre V",
    lignes: [
      "Tu n’es peut-être pas seulement une reine dans cette histoire…",
      "tu es l’une des plus belles personnes",
      "que j’ai eu la chance de connaître. ❤️",
    ],
    /* Après l'embrasement, les étoiles dessinent son visage à partir de
       cette photo, avant de former son prénom. `centre` = le milieu du
       visage (largeur puis hauteur, en %), `taille` = la part de la largeur
       de la photo à garder autour. Laisse src vide pour passer ce moment. */
    portrait: {
      src: "photos/bhama-portrait.jpg",
      centre: [44, 30],
      taille: 0.6,
      legende: "Telle que je te vois : faite de lumière.",
    },
    apresLeNom: "Ma reine, mon amie, ma lumière.",
    /* L'étoile à son nom : une image souvenir à garder ou partager.        */
    etoile: {
      annonce: "Une étoile porte désormais ton nom",
      bouton: "Garder ton étoile",
    },
    rejouer: "Revivre l’histoire",
    voeu: "Faire un vœu",
    /* Un vœu s'affiche à chaque clic sur « Faire un vœu ».                 */
    voeux: [
      "Que ta couronne brille toujours, même les jours de pluie.",
      "Que ton sourire ne s’éteigne jamais.",
      "Que chaque jour te ressemble : lumineux.",
      "Que la vie te rende tout l’amour que tu donnes.",
      "Que notre amitié traverse le temps.",
    ],
  },

  /* 8. LA MUSIQUE
        Par défaut, une musique originale est composée en direct par le
        navigateur (rien à télécharger). Pour mettre ta chanson : copie le
        fichier dans « public/ » (par exemple public/musique.mp3) puis
        écris fichier: "/musique.mp3".                                       */
  musique: {
    fichier: "",
    volume: 0.8,
  },
} as const;

export type ConfigReine = typeof reine;
export type StyleParagraphe = ConfigReine["declaration"]["paragraphes"][number]["style"];
export type NomIcone = ConfigReine["souvenirs"]["liste"][number]["icone"];
