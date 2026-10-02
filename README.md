# 💌 Déclaration d’amour — une petite histoire interactive

Un site romantique, animé et immersif, pensé d’abord pour le téléphone :
chaque toucher révèle un peu plus les sentiments, jusqu’à une lettre
personnelle cachée dans une enveloppe scellée.

Site **100 % statique** (HTML, CSS, JavaScript) : aucune installation, aucun
serveur, aucune dépendance. Il s’ouvre d’un double-clic et se met en ligne
gratuitement en une minute.

## Le parcours

1. **L’accueil** : ciel étoilé, cœurs qui montent, pétales qui tombent,
   poussières de lumière, étoiles filantes. Au centre, un grand cœur bat
   doucement : *« J’ai quelque chose à te dire… »* — *« Clique sur le cœur ❤️ »*.
2. **Le clic** : le cœur éclate en dizaines de petits cœurs, confettis et
   étincelles, une onde lumineuse en forme de cœur traverse l’écran, le
   téléphone bat comme un cœur (Android) et la musique démarre en douceur.
3. **« JE T’AIME ❤️ »** apparaît lettre par lettre, puis scintille.
4. **« Je t’aime, Prénom ❤️ »** : le prénom s’écrit à la main, tracé par une
   plume lumineuse qui sème des paillettes.
5. **Les petits messages** apparaissent un à un, mot par mot. Ils défilent
   seuls ; un toucher accélère. Le dernier, *« Je t’aime ❤️ »*, est mis en
   valeur.
6. **Le film des photos** (s’il y a des photos) : un titre, puis chaque
   photo naît dans un médaillon en forme de cœur, son visage au creux du
   cœur ; le cœur bat, des petits cœurs jaillissent, puis il s’ouvre jusqu’à
   remplir l’écran pendant que la caméra recule. La photo vit ensuite (lent
   zoom vers le visage, lumière chaude, poussières dorées) avec sa légende
   écrite à la main ; des barres, comme les statuts, montrent l’avancée. À la
   fin, la dernière photo se referme en cœur, bat une dernière fois et
   éclate : une plume de lumière trace alors un grand cœur dont les photos
   deviennent les perles, et son prénom s’écrit au milieu.
7. **« Découvrir mon message 💌 »** fait arriver un livre relié, son prénom
   en lettres d’or. On le touche : la couverture s’ouvre et **une voix lit la
   lettre**, la boîte à musique continue doucement derrière. Les mots
   apparaissent au rythme de la voix, et chaque page lue s’envole pour
   laisser place à la suivante. À la dernière page, la signature s’écrit à
   la main, un cœur se dessine, puis une pluie de cœurs tombe.
   *« Revoir ses photos »* rouvre les photos en grand, *« Revivre ce
   moment »* relance l’histoire.
8. **Sans la voix** (voir [La voix qui lit la lettre](#la-voix-qui-lit-la-lettre)),
   c’est une enveloppe scellée d’un cachet en cœur : le sceau saute, la
   lettre se déplie et se révèle au rythme de la lecture ; les photos
   s’affichent alors en polaroïds sous la lettre.

## Personnaliser

### Option 1 — L’atelier, sans toucher au code

Ouvre **`personnaliser.html`** : un formulaire pour tout régler (prénom,
messages, lettre, couleur, musique, photos), avec un **aperçu en direct**.

- **« Obtenir le lien »** fabrique un lien à envoyer (WhatsApp, SMS…). Le
  message est rangé dans le lien lui-même : pas de compte, pas de serveur.
  Un seul site en ligne peut ainsi servir pour plusieurs déclarations.
- **« Télécharger config.js »** crée le fichier de réglages prêt à l’emploi :
  remplace celui du site pour que la version de base soit la tienne.
- Le brouillon est gardé sur ton appareil : rien n’est perdu si la page se
  recharge.

Raccourci pour juste changer le prénom ou la couleur :
`index.html?prenom=Aïcha&couleur=lavande`

### Option 2 — Le fichier `config.js`

Tout est rassemblé et commenté dans [`config.js`](config.js). Modifie le texte
entre les guillemets, enregistre, recharge la page.

| Réglage | Ce qu’il change |
| --- | --- |
| `prenom` | Le prénom écrit à la main (« Je t’aime, Prénom ❤️ ») |
| `accueil.titre`, `accueil.invitation` | Les deux phrases de l’écran d’accueil |
| `grandMessage` | Le message après l’explosion (« JE T’AIME ❤️ ») |
| `avantPrenom` | Les mots avant le prénom (« Je t’aime, ») |
| `messages` | Les petits messages, dans l’ordre — autant que tu veux |
| `boutonLettre` | Le texte du bouton (« Découvrir mon message 💌 ») |
| `lettre` | La déclaration finale : texte sur l’enveloppe, paragraphes, formule, signature |
| `photos` | Le titre du film et de la galerie, la liste des photos avec leurs légendes et leur cadrage |
| `couleur` | Le thème : un nom ou n’importe quelle couleur `#rrggbb` |
| `musique` | Boîte à musique intégrée, ta chanson, ou aucun son |
| `options` | Défilement automatique, vibration, liens de l’atelier, film des photos |

Si `config.js` contient une faute de frappe (guillemet ou virgule oubliés),
la page l’indique en bas de l’écran au lieu de rester muette.

Dans tous les textes, **❤️ devient un petit cœur animé** aux couleurs du thème.

### Les couleurs

| Nom | Ambiance |
| --- | --- |
| `rose` | Rose tendre sur nuit prune (par défaut) |
| `passion` | Rouge passion |
| `lavande` | Violet doux |
| `or` | Or champagne |
| `aurore` | Coucher de soleil |
| `nuit` | Nuit étoilée bleue, cœurs roses |
| `#e91e63` | N’importe quelle couleur : le thème entier (dégradé, cœurs, lumières) est calculé à partir d’elle |

### Les photos

Dépose tes photos dans le dossier [`medias/`](medias/) puis ajoute-les :

```js
photos: {
  titre: "Regarde comme tu es belle…",
  liste: [
    { image: "medias/photo-1.jpg", legende: "Même le soleil t’admire…", cadrage: "44% 16%" },
    { image: "medias/photo-2.jpg", legende: "Ton sourire" },
  ],
},
```

- Le **titre** ouvre le film des photos et coiffe la galerie sous la lettre.
- **`cadrage`** (facultatif) : le point de la photo à garder au centre, en
  général le visage. `"44% 16%"` = un peu à gauche du milieu, tout en haut.
  Il guide le médaillon en cœur, le zoom lent, les perles du grand cœur et
  les polaroïds. Sans cadrage, le haut du centre est utilisé.
- Jusqu’à 10 photos passent dans le film (5 est idéal : environ 45 s avec la
  musique) ; un toucher passe à la suivante. `options.diaporama: false`
  garde seulement la galerie sous la lettre.
- Sur un écran large (ordinateur, téléphone à l’horizontale), la photo est
  présentée dans un cadre lumineux au lieu d’être trop recadrée.
- **Vidéos** : une ligne `{ video: "medias/clip.mp4", image: "medias/clip.jpg", legende: "…" }`
  (`image` = image d’aperçu, pour les médaillons et la galerie). Dans le film,
  la vidéo passe sans le son, la musique continue ; sous la lettre, un
  toucher l’ouvre, toujours sans le son : on peut le remettre avec les
  boutons de la vidéo (la musique se fait alors toute petite).
  Plusieurs formats possibles : `video: ["medias/clip.mp4", "medias/clip.webm"]`,
  le navigateur prend le premier qu’il sait lire. Garde des vidéos courtes
  (15 à 20 s, quelques Mo) pour qu’elles se chargent vite.

Une adresse web (`https://…`) fonctionne aussi. Conseil : réduis les photos à
environ 1200 pixels de large pour qu’elles s’affichent vite sur téléphone ;
elles se téléchargent pendant l’écran d’accueil. Une photo introuvable est
simplement ignorée.

### La musique

- **Par défaut** : une boîte à musique jouée en direct par le navigateur
  (Canon de Pachelbel, œuvre du domaine public) : 0 Ko à télécharger, aucun
  droit d’auteur.
- **Ta chanson** : copie le fichier dans `medias/` et indique
  `fichier: "medias/notre-chanson.mp3"`. Il faut un vrai fichier audio
  (mp3, m4a…) : un lien YouTube ne fonctionne pas. `debut` permet de démarrer
  la chanson au bon moment (en secondes).
- Les navigateurs interdisent le son avant un geste : la musique démarre donc
  au clic sur le cœur. Le bouton en haut à droite la coupe ou la relance.

### La voix qui lit la lettre

La lecture à voix haute tient dans deux fichiers du dossier `medias/` :

- `lettre-voix.mp3` : la voix (environ 2 min 50 s, 1,2 Mo, téléchargée
  seulement quand le livre arrive) ;
- `lecture.js` : la frise de lecture. Pour chaque phrase, elle donne la page
  du livre où elle s’écrit et l’instant où la voix la dit (`debut`, `fin`, en
  secondes).

Pendant la lecture, la musique baisse puis remonte à la fin. Le bouton en
haut à droite coupe la voix et la musique ensemble.

La voix est liée au texte. Si la lettre de `config.js` (titre, paragraphes,
formule, signature) ne correspond plus mot pour mot à celle de `lecture.js`,
ou si un lien de l’atelier change la lettre, le site revient tout seul à
l’enveloppe classique plutôt que de lire un autre texte.

**Mettre ta propre voix** : enregistre-toi en lisant la lettre (mêmes
phrases, dans l’ordre), remplace `lettre-voix.mp3`, puis corrige dans
`lecture.js` les instants `debut` et `fin` de chaque phrase (un logiciel
comme Audacity les affiche). Pour retirer la voix, supprime simplement
`lecture.js`.

## Mettre en ligne (gratuit)

Ce dépôt se suffit à lui-même.

- **Vercel** : *Add New → Project*, importe ce dépôt et clique sur *Deploy*,
  sans rien régler. Le fichier `vercel.json` s’occupe du reste : il copie le
  site dans `public/` (script `preparer-vercel.js`), rend absolue l’adresse
  de l’image d’aperçu pour que WhatsApp l’affiche, met les polices en cache
  et demande aux moteurs de recherche de ne pas indexer la page. Chaque
  modification poussée sur `main` est ensuite mise en ligne automatiquement.
- **Netlify Drop** : glisse le dossier du site sur
  <https://app.netlify.com/drop> ; un lien est créé aussitôt. Remplace alors
  dans `index.html` la valeur `apercu.jpg` de la balise `og:image` par
  l’adresse complète (`https://ton-site…/apercu.jpg`) pour que WhatsApp
  affiche l’image d’aperçu.
- N’importe quel hébergement de fichiers statiques convient.

Pour essayer sur ton ordinateur, un double-clic sur `index.html` suffit. Pour
tester les liens de l’atelier, sers le dossier : `npx serve .` ou
`python3 -m http.server`.

## Pensé pour les téléphones

- **Fluide** : les effets sont dessinés sur `<canvas>` avec des formes
  préparées une seule fois ; l’animation se met en pause quand l’onglet est
  caché (batterie).
- **Mode léger automatique** : si le téléphone peine (images par seconde
  mesurées au démarrage), s’il a peu de mémoire ou si l’économie de données
  est activée, les effets s’allègent tout seuls.
- **Tous les téléphones** : code compatible iOS 12+ et Android 7+
  (Chrome 64+), encoches et barres système respectées, aucun zoom ni
  défilement parasite, écrans de 320 px à l’ordinateur.
- **Léger** : environ 160 Ko transférés au premier affichage, polices
  comprises (hébergées avec le site), aucune bibliothèque externe.
- **Accessible** : textes lus par les lecteurs d’écran, navigation au clavier
  (Entrée, Espace ou → pour avancer, Échap pour fermer une photo), réglage
  « réduire les animations » respecté.

## Structure

```
./
  index.html           l’expérience
  config.js            ✏️ textes, couleur, musique, photos
  personnaliser.html   l’atelier : formulaire, aperçu, lien, config.js
  css/style.css        styles de l’expérience
  css/editeur.css      styles de l’atelier
  css/polices.css      polices (partagées)
  js/outils.js         thèmes, lecture de la configuration, liens
  js/effets.js         ciel, cœurs, explosion, confettis, plume (canvas)
  js/musique.js        boîte à musique (Web Audio) ou ta chanson, petits sons
  js/film.js           le film des photos : médaillons en cœur, zoom, lumières (canvas)
  js/livre.js          le livre : pages, mots au rythme de la voix, pages qui s’envolent
  js/app.js            le scénario, scène par scène
  js/editeur.js        l’atelier
  tests/               tests de la configuration (node --test tests/*.test.js)
  fonts/               Cormorant Garamond et Great Vibes (licence SIL OFL)
  medias/              tes photos, ta musique, la voix (lettre-voix.mp3, lecture.js)
  apercu.jpg           image affichée quand le lien est partagé
  icone.png            icône sur l’écran d’accueil du téléphone
  vercel.json          réglages Vercel (construction, cache, non-indexation)
  preparer-vercel.js   construction sur Vercel : copie dans public/, image d’aperçu
```

## Vie privée

La page n’envoie rien : ni statistiques, ni cookies, ni service externe.
Le lien de l’atelier contient le message **encodé mais pas chiffré** :
comme une lettre, toute personne qui a le lien peut la lire. La balise
`noindex` demande aux moteurs de recherche de ne pas référencer la page.
