/* ==========================================================================
   ✏️  PERSONNALISATION
   --------------------------------------------------------------------------
   Tout se règle dans ce fichier : modifie le texte entre les guillemets,
   enregistre, puis recharge la page. Rien d'autre à toucher.

   Règles simples pour ne rien casser :
   • garde les guillemets "..." autour de chaque texte ;
   • garde la virgule à la fin de chaque ligne de liste ;
   • les émojis sont permis (❤️ 💌 🌹 ✨…). Le ❤️ est remplacé à l'écran
     par un petit cœur animé aux couleurs du thème.

   Plus simple encore : ouvre « personnaliser.html » dans le navigateur,
   remplis le formulaire et copie le lien à envoyer (ou télécharge un
   nouveau config.js tout prêt).
   ========================================================================== */

window.DECLARATION = {

  /* 1. SON PRÉNOM — il s'écrit progressivement à l'écran.
        Exemple : "Aïcha", "Mariam", "Ibrahima"…                              */
  prenom: "Rama",

  /* 2. L'ÉCRAN D'ACCUEIL                                                       */
  accueil: {
    titre: "Rama, j’ai quelque chose à te dire…",
    invitation: "Clique sur le cœur ❤️",
  },

  /* 3. LE GRAND MESSAGE qui apparaît après l'explosion de cœurs               */
  grandMessage: "JE T’AIME ❤️",

  /* Les mots écrits juste avant le prénom (« Je t'aime, Prénom ❤️ »)          */
  avantPrenom: "Je t’aime,",

  /* 4. LES PETITS MESSAGES, affichés l'un après l'autre.
        Ajoute ou retire autant de lignes que tu veux.
        Le dernier est mis en valeur (grand, écrit à la main).                 */
  messages: [
    "Il y a des personnes qui passent dans une vie… et d’autres qui l’illuminent.",
    "Toi, Rama, tu fais partie de la deuxième catégorie.",
    "Depuis que tu es là, mes journées ont une autre couleur.",
    "Alors aujourd’hui, j’ai décidé de ne plus garder ça pour moi…",
    "Je t’aime ❤️",
  ],

  /* Le texte du bouton qui ouvre la lettre                                    */
  boutonLettre: "Découvrir ma lettre 💌",

  /* 5. LA LETTRE FINALE (ta déclaration personnelle)
        Elle s'ouvre comme un livre et une voix la lit, la musique derrière :
        les mots s'écrivent au rythme de la voix et chaque page lue s'envole.
        Pour qu'une voix la lise, ajoute dans « medias » lettre-voix.mp3 et
        lecture.js (voir le README) ; sans eux, la lettre s'affiche dans
        l'enveloppe classique, sans voix.                                     */
  lettre: {
    surEnveloppe: "Pour Rama",     // écrit sur l'enveloppe et sur le livre
    titre: "Ma chère Rama,",     // vide = « Prénom, » automatiquement
    paragraphes: [
      "Je cherche ces mots depuis longtemps. Je les ai écrits dans ma tête des dizaines de fois, effacés, recommencés… et ce soir, j’ai enfin trouvé le courage de te les offrir.",
      "Je ne saurais pas dire à quel moment exact tout a commencé. Je sais seulement qu’un jour, ton sourire est devenu ma lumière préférée, et que ta voix est devenue la plus douce des musiques.",
      "On m’appelle Joël la joie. Mais la vérité, c’est que ma plus grande joie, c’est toi. Chaque fois que je pense à toi, quelque chose s’allume en moi, et le monde devient un peu plus beau.",
      "J’aime ta douceur, ta force, ta façon de rire et cette manière unique que tu as de rendre les choses simples plus belles. Avec toi, même les jours ordinaires ressemblent à une fête.",
      "Quand tu es là, le temps passe trop vite. Quand tu n’es pas là, il me tarde déjà de te revoir. Un simple message de toi suffit à changer toute ma journée.",
      "Tu m’as donné envie d’être meilleur : plus patient, plus attentif, plus présent. Tu réveilles en moi le meilleur de ce que je suis.",
      "Je rêve de partager avec toi les rires et les silences, les projets et les petits riens, les beaux jours comme les plus difficiles, toujours main dans la main.",
      "Je ne t’écris pas pour te presser ni pour te demander quoi que ce soit. Je voulais seulement que tu saches, avec tout mon cœur et en toute sincérité, ce que tu représentes pour moi.",
      "Si un jour tu doutes de toi, relis ces mots : ils te rappelleront que quelqu’un t’admire, croit en toi et pense à toi bien plus souvent que tu ne l’imagines.",
      "Rama, tu es ma plus belle rencontre, ma plus douce pensée et ma plus grande joie.",
      "Je t’aime, tout simplement. ❤️",
    ],
    formule: "Avec tout mon amour,",
    signature: "Joël la joie",  // ← ton prénom
  },

  /* 6. LES PHOTOS ET VIDÉOS (facultatif)
        Dépose-les dans le dossier « medias » puis ajoute une ligne par photo.
        Une adresse web (https://…) fonctionne aussi.
        Elles forment un petit film : chaque photo naît dans un cœur qui
        bat puis s'ouvre en plein écran, et à la fin elles deviennent les
        perles d'un grand cœur de lumière. On les retrouve sous la lettre.
        cadrage (facultatif) = le point de la photo à garder au centre,
        en général le visage : "50% 20%" = au milieu, en haut de la photo.
        Pour une vidéo : video = le fichier (.mp4, ou plusieurs formats
        entre crochets), image = une image d'aperçu tirée de la vidéo.
        La vidéo passe sans le son (la musique continue) ; sous la lettre,
        on peut remettre son son avec les boutons de la vidéo.
        Laisse la liste vide pour ne pas afficher de photos.                   */
  photos: {
    titre: "Regarde comme tu es belle…",
    liste: [
      // { image: "medias/photo-1.jpg", legende: "Ton sourire, ma lumière", cadrage: "50% 25%" },
    ],
  },

  /* 7. LA COULEUR DU THÈME
        Un nom : "rose", "passion", "lavande", "or", "aurore", "nuit"
        ou n'importe quelle couleur, par exemple "#e91e63" : tout le thème
        (dégradé, cœurs, lumières) est calculé à partir d'elle.                */
  couleur: "rose",

  /* 8. LA MUSIQUE (elle démarre au clic sur le cœur)
        fichier vide  = boîte à musique intégrée (Canon de Pachelbel).
        Pour ta chanson : mets le fichier dans « medias » et écris son nom,
        par exemple "medias/notre-chanson.mp3".                                */
  musique: {
    activee: true,              // false = aucun son
    fichier: "",
    volume: 0.7,                // de 0 à 1
    debut: 0,                   // démarrer la chanson à N secondes
  },

  /* 9. RÉGLAGES                                                               */
  options: {
    avancementAuto: true,       // tout passe seul : messages, enveloppe, la lettre qui monte
    vibration: true,            // petit battement de cœur sur les téléphones Android
    personnalisationParLien: true, // autorise les liens créés avec personnaliser.html
    diaporama: true,            // le film animé des photos (false = photos seulement sous la lettre)
  },
};
