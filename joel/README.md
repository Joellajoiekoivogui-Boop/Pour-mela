# 🎬 JOËL — 10.10 · « Une année de plus. Une nouvelle ère. »

Un film d’anniversaire cinématique pour Joël, construit comme une bande-annonce
de science-fiction : particules, chiffres métalliques en 3D, lumière
volumétrique, bande-son synthétisée et synchronisée à l’image près.

## Les vidéos

| Fichier | Format | Durée | Pour |
| --- | --- | --- | --- |
| `videos/joel-anniversaire-16x9.mp4` | 1920×1080 | 90 s | YouTube, TV, ordinateur |
| `videos/joel-anniversaire-9x16.mp4` | 1080×1920 | 90 s | TikTok, Reels, WhatsApp Status, Snapchat, Shorts |
| `videos/joel-15s-16x9.mp4` | 1920×1080 | 15 s | version courte |
| `videos/joel-15s-9x16.mp4` | 1080×1920 | 15 s | version courte en story |

La version verticale n’est pas un recadrage : chaque composition est repensée
pour le téléphone (titres empilés, « JOYEUX / ANNIVERSAIRE » sur deux lignes,
panneaux et réseaux redisposés, JOËL toujours en grand au centre).

Le film se regarde aussi en direct dans le navigateur : ouvre `index.html`
(ou `/joel/` sur le site en ligne) et touche « Lancer le film ».

## La publicité (3 min 54)

Une troisième version, façon publicité de marque, sur le texte « Aujourd’hui
n’est pas un jour comme les autres… » : `videos/joel-pub-16x9.mp4` et
`videos/joel-pub-9x16.mp4`.

| Temps | Partie |
| --- | --- |
| 0:00 | **Introduction** — ambiance mystérieuse, calendrier qui tourne jusqu’au 10 octobre |
| 0:26 | **L’annonce** — alerte, projecteurs qui s’allument, emojis, bougies, gâteau 3D, confettis et serpentins, puis **JOËL** en affiche |
| 0:54 | **Le message** — livre qui s’ouvre, phrases empilées, le chemin parcouru bordé des photos |
| 1:22 | **Célébration** — lâcher de ballons, « UNE ANNÉE… » avec les photos en affiches, feux d’artifice |
| 1:43 | **Les vœux** — un cadeau s’ouvre pour chaque vœu |
| 2:08 | **Moment émotionnel** — la nuit, puis « TON HISTOIRE NE FAIT QUE COMMENCER » |
| 2:32 | **Le grand moment** — explosion de confettis : JOYEUX ANNIVERSAIRE JOËL ! |
| 2:53 | **Message final** — « PLUS DE… », puis « merci à la vie » |
| 3:11 | **Fin publicitaire** — message officiel, cartes de bande-annonce, affiche de cinéma |
| 3:38 | **Écran final** — « Joyeux anniversaire » joué en boîte à musique |

Tout le texte bouge (lettres qui montent, mots qui rebondissent, phrases qui
glissent, se dévoilent ou s’écrivent), et la musique suit le récit : intro
mystérieuse, montée émotionnelle, rythme énergique, explosion au « JOYEUX
ANNIVERSAIRE JOËL ! », conclusion élégante. La mélodie de « Joyeux
anniversaire » est dans le domaine public.

Pour la refaire : `node rendre-video.js --version pub` (ajoute
`--format portrait` pour le 9:16). Les textes et leurs instants sont dans
[`js/partition.js`](js/partition.js) (section « LA PUBLICITÉ »), les visuels
dans [`js/pub.js`](js/pub.js).

## Le découpage (90 s)

| Temps | Scène |
| --- | --- |
| 0–7 s | **L’obscurité** — une lumière naît, bat comme un cœur. « Tout commence quelque part. » |
| 7–15 s | **Le temps** — la lumière explose en galaxie, le compteur 01, 02, 03… s’emballe, puis coupure nette, silence. |
| 15–25 s | **10 octobre** — un immense « 10 » métallique, reflet, orbite de caméra, puis **10.10**. |
| 25–35 s | **Révélation** — les particules forment une silhouette, puis **JOËL**. « Une nouvelle année commence. » |
| 35–48 s | **Le parcours** — APPRENDRE (code, hologrammes), CRÉER (formes 3D), INNOVER (circuits, robot), TRANSMETTRE (réseau de personnes). |
| 48–58 s | **Les rêves** — RÊVER, APPRENDRE, CRÉER, CONSTRUIRE, IMPACTER, chacun fait de particules puis désintégré. |
| 58–70 s | **Le message** — mot par mot : « Une année de plus… Ce n’est pas seulement une année qui passe. C’est une nouvelle page qui commence. » |
| 70–80 s | **Montée finale** — tunnels d’étoiles, d’anneaux et de grilles, accélération, blanc, silence. |
| 80–90 s | **Joyeux anniversaire** — explosion, confettis, JOËL · 10 OCTOBRE · JOYEUX ANNIVERSAIRE 🎂 · UNE NOUVELLE ANNÉE. UNE NOUVELLE ÈRE. · « Le meilleur reste à construire. » · **10.10.2026** |

Version 15 s : 10 → OCTOBRE → JOËL → JOYEUX ANNIVERSAIRE → 10.10.2026.

## Les photos de Joël

Cinq photos sont déjà intégrées (`photos/joel-1.jpg` à `joel-5.jpg`), une par
mot de la scène « Les rêves ». Pour en ajouter ou les changer :

1. Dépose les photos dans `photos/` (JPG ou PNG, de préférence en portrait).
2. Liste-les dans [`config.js`](config.js) : `photos: ['photos/joel-1.jpg', …]`.
3. Relance le rendu (ci-dessous).

Les photos se partagent la scène « Les rêves » (48–58 s) : chacune dans un
cadre de cinéma, avec un lent zoom, puis elle se dissout en particules et un
éclat de lumière fait naître la suivante. Elles ne sont
jamais étirées ni retouchées.

## Refaire les vidéos

```bash
cd joel
npm i -D playwright && npx playwright install chromium   # une seule fois
node rendre-video.js --tout                    # les 4 vidéos en 1080p
node rendre-video.js --4k                      # 90 s en 4K (3840×2160)
node rendre-video.js --4k --format portrait    # 90 s en 4K vertical
node rendre-video.js --version courte --format portrait
```

Il faut aussi `ffmpeg`. Le rendu calcule chaque image à partir du temps seul,
donc le résultat est identique à chaque fois.

## Comment c’est fait

- [`js/partition.js`](js/partition.js) — tous les instants clés (mots, impacts,
  accords, whooshs). Image et son lisent la même partition : changer un temps
  ici le change partout.
- [`js/film.js`](js/film.js) — l’image, en Canvas 2D : titres métalliques
  extrudés avec reflet et balayage de lumière, particules qui forment et
  défont les mots, galaxie 3D, champ d’étoiles à profondeur, confettis,
  secousses de caméra, vignette et grain.
- [`js/bande-son.js`](js/bande-son.js) — la musique, entièrement synthétisée
  (souffle, battement, pads, arpèges, basses, risers, impacts, whooshs,
  étincelles, réverbération). Aucun fichier audio, aucun droit à payer.
- Polices : Space Grotesk et Sora (licence SIL OFL, dans `fonts/`).
