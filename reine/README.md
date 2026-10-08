# 👑 Le royaume de Bhama

Une expérience interactive et cinématographique pour **Bhama Jeanne Kolié** :
une déclaration à une reine et à une amie, racontée en cinq chapitres, avec
des dizaines de milliers de particules de lumière, des pétales de rose, une
musique composée en direct et des interactions à chaque toucher.

Pensée d’abord pour le téléphone, elle reste fluide sur les appareils
modestes et respecte le réglage « réduire les animations ».

## Le parcours

1. **L’introduction** : des phrases mystérieuses s’écrivent lettre par
   lettre dans un ciel étoilé, puis se dissolvent en poussière d’or.
   *« Certaines personnes entrent dans notre vie par hasard… »* Les étoiles
   convergent ensuite pour former son prénom, en milliers de particules
   dorées. Un toucher accélère.
2. **L’entrée** : le bouton magnétique *« Entrer dans son royaume »*
   déclenche le saut : le prénom explose, les étoiles s’étirent en traînées
   (vitesse lumière), un éclair d’or, et la musique démarre.
3. **Chapitre I — Ma Reine** : une couronne de lumière en 3D se forme au-dessus
   de son prénom, qui s’élève lettre par lettre. Plus bas, son portrait dans
   une fenêtre en arche (cadre qui s’incline au toucher, halo qui ondule,
   anneaux en orbite) : la couronne descend se poser au-dessus.
4. **Chapitre II — La déclaration** : chaque phrase s’allume mot après mot au
   rythme du défilement, en trois styles typographiques, pendant qu’une
   galaxie spirale pivote derrière.
5. **Chapitre III — Souvenirs** : une frise dont le fil d’or se dessine au
   défilement ; chaque souvenir apparaît en 3D et allume son étoile.
6. **Chapitre IV — Son royaume** : une constellation à allumer étoile par
   étoile (chacune joue une note) qui dessine une couronne et s’embrase ;
   puis un espace où dessiner avec la lumière (cœurs, étoiles, or ; un appui
   long lance une supernova) et, sur téléphone, le ciel qui suit
   l’inclinaison.
7. **Chapitre V — La révélation** : un cœur de lumière bat au rythme de la
   musique pendant que le message s’écrit ligne après ligne ; puis tout
   s’embrase (feux d’artifice, pluie de pétales) et son prénom renaît des
   étincelles. Signature, *« Faire un vœu »* et *« Revivre l’histoire »*.

## Personnaliser

Tous les textes sont dans [`src/config/reine.ts`](src/config/reine.ts),
commentés en français : prénom, phrases de l’introduction, déclaration,
souvenirs, textes du jeu, message final, vœux, signature, musique.

| Réglage | Ce qu’il change |
| --- | --- |
| `prenom`, `suiteDuNom` | Le prénom en particules, et la suite du nom |
| `signature` | Ta signature sous la révélation (vide = aucune) |
| `intro.phrases` | Les phrases mystérieuses du début |
| `maReine.photo.src` | Sa photo (voir ci-dessous) |
| `declaration.paragraphes` | La déclaration ; `style` : `texte`, `grand` ou `plume` |
| `souvenirs.liste` | Les souvenirs ; `icone` : `etoile`, `sourire`, `main`, `rire`, `couronne`, `coeur`, `rose`, `infini` |
| `final.lignes` | Le message de la révélation, ligne par ligne |
| `final.voeux` | Les vœux qui s’affichent à chaque clic |
| `musique.fichier` | Ta chanson au lieu de la musique composée en direct |

Le ❤️ des textes devient un petit cœur animé.

### La photo

Dépose-la dans `public/photos/` (par exemple `public/photos/bhama.jpg`), puis
dans la configuration :

```ts
photo: { src: "/photos/bhama.jpg", alt: "…", cadrage: "50% 30%", legende: "…" },
```

`cadrage` place le visage au centre de l’arche (largeur puis hauteur, en %).
Une photo verticale d’environ 1000 px de large, en `.jpg` ou `.webp`, se
charge vite. Sans photo, un médaillon doré à son initiale la remplace.

### La musique

Par défaut, une musique originale est composée en direct par le navigateur
(Web Audio) : nappe de cordes, boîte à musique, cloches, et une basse qui bat
comme un cœur. 0 Ko à télécharger, aucun droit d’auteur. Chaque accent fait
pulser la lumière ; chaque étoile allumée joue une note.

Pour ta chanson : copie-la dans `public/` puis `fichier: "/musique.mp3"`. Les
particules réagissent alors à son volume. Le bouton en haut à droite coupe ou
relance le son.

## Lancer, construire, mettre en ligne

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # site statique dans out/
```

- **Vercel** : *Add New → Project*, importe ce dépôt, règle **Root
  Directory** sur `reine`, puis *Deploy*. Vercel reconnaît Next.js tout seul.
  L’adresse du site sert automatiquement pour l’image d’aperçu (WhatsApp).
- **Netlify Drop** : `npm run build`, puis glisse le dossier `out/` sur
  <https://app.netlify.com/drop>. Pour l’image d’aperçu, construis avec
  l’adresse du site : `NEXT_PUBLIC_SITE_URL=https://ton-site.netlify.app npm run build`.
- N’importe quel hébergement de fichiers statiques convient pour `out/`.

Vérifications : `npm run lint`, `npm run typecheck`, `npm test`.

## Sous le capot

**Stack** : Next.js (export statique), React, TypeScript, Tailwind CSS,
Motion, Three.js via React Three Fiber, Web Audio.

**Des millions de mouvements, peu de travail pour le processeur.**

- **Un seul nuage de particules** (jusqu’à 72 000 sur ordinateur) dessiné en
  *un seul appel* WebGL. Chaque particule connaît d’avance sa place dans
  chaque forme (ciel, prénom, couronne, galaxie, cœur) ; le *vertex shader*
  calcule sur la carte graphique le morphing, la dérive, le scintillement,
  le battement, l’explosion et la répulsion autour du doigt. Le processeur
  n’envoie qu’une vingtaine de valeurs par image.
- **Étincelles** (cœurs, étoiles, anneaux, feux d’artifice) : un anneau de
  milliers d’emplacements sur le GPU. Chaque étincelle est écrite une fois
  (seule la plage modifiée est renvoyée) ; tout son vol est calculé par le
  shader. Les formes de cœur et d’étoile sont dessinées par le shader, sans
  texture.
- **Pétales de rose** : une géométrie instanciée des centaines de fois ;
  chute, tournoiement et courbure sur le GPU.
- **Aucun composant React par particule** : la scène lit un petit état
  partagé (`src/lib/director.ts`) à chaque image, sans rendu React.
- **Le texte reste du vrai texte** (lisible, sélectionnable, accessible) ;
  le mot-à-mot au défilement ne met à jour qu’une variable CSS par phrase.
- **Détection de l’appareil** (`src/lib/quality.ts`) : processeur, mémoire,
  GPU, économie de données, taille d’écran → trois niveaux (72 000, 30 000
  ou 11 000 particules ; densité de pixels plafonnée). Pendant l’expérience,
  si les images par seconde baissent, le nombre de particules puis la
  résolution diminuent tout seuls.
- **Code splitting** : Three.js et les chapitres se chargent pendant
  l’introduction, qui s’affiche aussitôt. Polices hébergées avec le site.
- **Batterie** : la musique se met en pause quand l’onglet est caché, le
  rendu aussi (requestAnimationFrame).
- **Animations réduites** : si le téléphone le demande, pas de WebGL ni de
  mouvements ; les textes apparaissent en fondu sur un ciel fixe. Sans
  WebGL, même repli.

Réglages pour tester : `?qualite=haute|moyenne|basse`, `?animations=reduites`
(ou `?animations=completes` pour ignorer le réglage du système).

## Structure

```
src/
  config/reine.ts          ✏️ tous les textes
  app/                     page, polices, styles, icône
  components/
    Experience.tsx         le chef d'orchestre : intro, saut, chapitres
    intro/Intro.tsx        phrases, prénom en particules, bouton d'entrée
    sections/              Ma Reine, portrait, déclaration, souvenirs,
                           royaume (jeu + pad de lumière), révélation
    gl/                    la scène WebGL : pilote, univers, pétales,
                           étincelles, traînées, shaders
    ui/                    texte lettre à lettre, bouton magnétique, carte 3D,
                           curseur, bouton son, icônes, progression
  lib/
    director.ts            état partagé DOM ↔ WebGL
    shapes.ts              formes des particules (+ tests)
    music.ts               musique générative et effets sonores
    quality.ts             détection des capacités de l'appareil
    device.ts              vibration, inclinaison du téléphone
  fonts/                   Cinzel, Cormorant Garamond, Great Vibes (SIL OFL)
public/photos/             sa photo
```

## Vie privée

Aucune statistique, aucun cookie, aucun service externe : tout est servi
avec le site. La balise `noindex` demande aux moteurs de recherche de ne pas
référencer la page.
