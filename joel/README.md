# 🌌 Joël · 10.10 — une nouvelle année, une nouvelle ère

Un site anniversaire cinématique pour **Joël Koivogui**, le 10 octobre :
un film interactif en huit chapitres, avec un ciel de particules, une sphère
de lumière en 3D, un compte à rebours vivant, des mots qui se forment en
milliers de particules, de la musique composée en direct et quatre secrets
cachés.

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Motion · Three.js /
React Three Fiber · Lenis · Lucide. Site **100 % statique** (dossier `out/`),
pensé d’abord pour le téléphone.

## Les huit chapitres

| | Chapitre | Ce qui s’y passe |
| --- | --- | --- |
| 01 | **Entrée dans l’univers** | Noir total, une lumière naît et éclate, le ciel s’allume ; « 10.10 », puis **JOËL** surgit du flou devant une sphère de particules en 3D qui suit la souris. *Scroll to enter*, et « 🔊 Activer l’expérience » pour la musique. |
| 02 | **Compte à rebours** | Jours, heures, minutes, secondes ; chaque chiffre glisse quand il change. Une barre montre l’avancée de son année. |
| 03 | **Une nouvelle année** | L’écran reste fixe pendant le défilement : la phrase d’ouverture s’allume mot à mot, puis chaque phrase arrive autrement (page qui tourne, idée qui s’allume, glissé, lettres qui se resserrent) jusqu’à **UNE NOUVELLE ÈRE.** |
| 04 | **Le parcours** | Frise verticale dont le fil lumineux se dessine au défilement : Apprendre, Créer, Transmettre, Entreprendre, Construire. |
| 05 | **Les ambitions** | « Et maintenant ? » : quatre cartes en verre qui s’inclinent vers la souris, avec un projecteur qui les suit. |
| 06 | **Les souvenirs** | Galerie en mosaïque (parallaxe, zoom, visionneuse plein écran : flèches, clavier, glisser du doigt), puis des cartes souvenirs posées de travers qui se redressent au survol. |
| 07 | **Le message** | « À Joël, » puis les lignes qui apparaissent mot à mot ; **LE MEILLEUR RESTE À CONSTRUIRE.** se rassemble lettre par lettre depuis tout l’écran. Puis le message d’anniversaire. |
| 08 | **La célébration** | Le noir, une lumière qui grandit, des milliers de particules qui forment **JOËL**, puis **10.10**, puis **HAPPY BIRTHDAY**, explosion de lumière, confettis, particules qui remontent. Bouton **🎉 Célébrer**. |

### Le 10 octobre

Le site lit la date (à l’heure du visiteur) :

- **avant** : « Le moment approche… » et le compte à rebours ;
- **le jour J** : « C’est aujourd’hui. », et à l’arrivée la grande fête
  (« JOYEUX ANNIVERSAIRE JOËL 🎂 » en plein écran, confettis, lumière) ;
  si quelqu’un est sur le site à minuit pile, le compte à rebours atteint
  zéro sous ses yeux et la fête se déclenche ;
- **après** (60 jours) : « Une nouvelle année vient de commencer. » et le
  compte à rebours vers le prochain 10 octobre.

Pour essayer : `?date=2026-10-10T09:00` (jour J), `?date=2026-10-09T23:59:50`
(minuit dans 10 secondes), `?date=2026-10-20T09:00` (après).

### Les secrets 🤫

1. Cliquer **cinq fois** vite sur le logo « JOËL ».
2. Dessiner **un grand cercle** avec la souris.
3. Taper **joel** au clavier (ou le code Konami ↑ ↑ ↓ ↓ ← → ← → B A) :
   « MODE SECRET ACTIVÉ 🤫 ».
4. Trouver **la petite étoile** cachée (indice : à la fin du parcours).

Le pied de page compte les secrets trouvés.

## Personnaliser

Tous les textes sont dans [`src/config/joel.ts`](src/config/joel.ts) :
prénom, date, phrases de chaque chapitre, étapes du parcours, cartes des
ambitions, photos, souvenirs, lettre, message, messages de la fête, textes
des secrets, musique.

### Les photos

La galerie et les souvenirs utilisent pour l’instant des **œuvres lumineuses
provisoires** (`public/photos/oeuvre-*.svg`). Pour mettre les vraies photos :

1. dépose-les dans `public/photos/` (`.jpg` ou `.webp`, ~1200 px de large) ;
2. dans `src/config/joel.ts`, remplace les lignes de `galerie.photos` et
   `souvenirs.liste` :

```ts
{ src: "photos/joel-plage.jpg", alt: "Joël à la plage", legende: "Un été", largeur: 1200, hauteur: 1600 },
```

`largeur` et `hauteur` servent seulement à réserver la bonne place (le ratio
suffit). Ajoute autant de lignes que tu veux.

### La musique

Par défaut, une musique douce et cinématique est composée en direct par le
navigateur (nappes, cloches) : 0 Ko, aucun droit d’auteur. Elle ne démarre
jamais toute seule : seulement au clic sur « 🔊 Activer l’expérience » ou
sur le bouton 🔇/🔊 en haut. Pour ta chanson : copie-la dans `public/` puis
`musique: { fichier: "/musique.mp3" }`.

## Performance et accessibilité

- La quantité de particules, la densité de pixels et les effets s’adaptent à
  l’appareil (forçage : `?qualite=haute|moyenne|basse`). Les canevas
  s’arrêtent quand ils ne sont pas à l’écran, la couche d’effets ne dessine
  que s’il y a des effets.
- `prefers-reduced-motion` (ou `?animations=reduites`) : animations
  remplacées par des fondus, pas de défilement doux, pas de film final.
- Curseur personnalisé et défilement doux seulement à la souris ; au doigt,
  tout reste natif. Vibration légère sur Android pendant la fête.
- Navigation au clavier (lien d’évitement, menu et visionneuse avec Échap et
  les flèches, focus visible), textes alternatifs, libellés ARIA.

## Lancer et mettre en ligne

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # site statique dans out/
```

- **Vercel** : *Add New → Project*, importe ce dépôt, règle **Root
  Directory** sur `joel`, puis *Deploy*. L’adresse du site sert
  automatiquement pour l’image d’aperçu (WhatsApp, Instagram, Facebook).
- **Netlify Drop** : `NEXT_PUBLIC_SITE_URL=https://ton-site.netlify.app npm run build`,
  puis glisse le dossier `out/` sur <https://app.netlify.com/drop>.

Vérifications : `npm run lint`, `npm run typecheck`, `npm test`.

Polices Sora, Inter et Space Grotesk (licence SIL OFL, dans `src/fonts/`),
hébergées avec le site.
