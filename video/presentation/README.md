# 🎤 Présentation professionnelle — Joël Koïkoï Koïvogui

Vidéos motion design avec voix off française, sous-titres et musique
d'ambiance. Les animations sont calées phrase par phrase sur la voix.

| Version | Texte | Page | Vidéo |
|---|---|---|---|
| **2 minutes** | `texte-2min.json` | `courte.html` | `sortie/presentation-2min.mp4` |
| Complète (8 min 53) | `texte.json` | `presentation.html` | `sortie/presentation-joel-koivogui.mp4` |

Les deux pages partagent `commun.js` (outils, fond, sous-titres, carte,
maquettes des réalisations…). Scènes de la version complète :

| Scène | Contenu à l'écran |
|---|---|
| Introduction | Le nom, les rôles, Conakry sur la carte, l'ambition, « créer, innover, entreprendre, contribuer » |
| 01 · Parcours | AUTODIDACTE, frise depuis 2022, études à l'UNC |
| 02 · Compétences | Tuiles React, Next.js, Node.js, Express, MongoDB, Supabase, React Native, Expo, Electron.js, Python, Arduino, ESP32 |
| 03 · De l'idée au produit | Idée → réflexion → produit, puis éditeur de code avec suggestion de l'IA |
| 04 · Réalisations | NABELE, SmartStock Guinée, SGS, SolarBox, AST Media, Orange Money → WhatsApp |
| 05 · IA · ML · Robotique · IoT | Réseau de neurones, Arduino, ESP32, SolarBox, données → ML |
| 06 · Entrepreneuriat | Comprendre, imaginer, réaliser ; les cinq dimensions |
| 07 · Éducation numérique | {fata}, ELITECH ACADEMY, frise FataDev → Ambassadeur → Country Lead, photos |
| 08 · Insertion professionnelle | YEN, formation → emploi, la plateforme talents ⇄ opportunités |
| 09 · Vision | Pratique, expérimentation, progression ; « Je ne prétends pas tout maîtriser » |
| 10 · Afrique | Carte qui naît depuis la Guinée |
| Conclusion | Portrait, nom, titres, « Merci. » |

## Les médias (`medias/`, non publiés)

Le dépôt est public : les photos et la vidéo finale ne sont **pas** versionnées
(voir `.gitignore`). Mets les fichiers dans `medias/` avec ces noms exacts :

| Fichier | Utilisation | Si absent |
|---|---|---|
| `portrait-joel.jpg` | Portrait de fin (carré, visage centré) | Monogramme « JK » |
| `photo-joel.jpg` | Country Lead FATA.SCHOOL Guinée | Cadre absent |
| `joel-scene.jpg`, `ev-micro.jpg` | Prises de parole | Cadre absent |
| `ev-presentation.jpg` | Présentation de FATA.SCHOOL | Cadre absent |
| `ev-remise.jpg`, `affiche-fata.jpg` | Événements FATA | Cadre absent |
| `ev-stand.jpg`, `ev-stand2.jpg` | Stand FATA.SCHOOL, Afrinov Tech Expo | Cadre absent |
| `ev-cloud-unc.jpg`, `ev-odc.jpg` | UNC et Orange Digital Center (parcours) | Cadre absent |
| `ev-foire.jpg` | Foire technologique de Guinée et d'Afrique | Carte seule |
| `logo-fata.png` | Logo {fata} | Logo redessiné |
| `logo-elitech.png` | Logo ELITECH ACADEMY | Logo typographique |
| `logo-yen.png` | Logo Youth Engineers Network | « YEN » en grand |
| `capture-nabele.png`, `capture-smartstock.png`, `capture-sgs.png`, `capture-solarbox.png`, `capture-ast.png`, `capture-om.png` | Vraies captures d'écran des produits | Maquettes animées |

Il suffit d'ajouter un fichier puis de relancer le rendu : il remplace
automatiquement la maquette.

## Refaire la vidéo

### Voix ElevenLabs (recommandé)

Il faut que l'environnement autorise `api.elevenlabs.io` (réseau) et
fournisse la clé dans la variable `ELEVENLABS_API_KEY`. Facultatif :
`ELEVENLABS_VOICE_ID` pour choisir une autre voix que « George » (par
défaut). Chaque phrase est mise en cache dans `sortie/cache-elevenlabs/` :
relancer ne consomme pas de crédits pour les phrases inchangées.

```bash
pip install elevenlabs numpy                                    # une fois
python3 video/presentation/voix.py --texte texte-2min.json --moteur elevenlabs
node video/presentation/rendu.js --courte                       # ≈ 5 min
```

### Voix locale Piper (gratuite)

```bash
pip install piper-tts numpy
curl -L https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-fr_FR-tom-medium.tar.bz2 | tar xj
python3 video/presentation/voix.py --texte texte-2min.json --moteur piper --modele vits-piper-fr_FR-tom-medium/fr_FR-tom-medium.onnx
node video/presentation/rendu.js --courte
```

Pour la version complète : `--texte texte.json`, puis `rendu.js` sans
`--courte` (≈ 20 min). Aperçus PNG : `rendu.js [--courte] --apercu c-sgs+2,c-merci+3`
(instant = id du segment + secondes). Pour voir l'animation en direct, ouvre
la page dans un navigateur et clique.

- **Durée** : dans `texte-2min.json`, `reglages.duree_cible` (120 s) ajuste
  automatiquement les pauses entre scènes, quel que soit le débit de la voix.
- **Changer le texte** : modifie le fichier de texte puis relance `voix.py` :
  toute l'animation se recale. `voix_el` aide la prononciation d'ElevenLabs
  (« Koy-koy Koyvogui »), `voix` celle de Piper (`[[ … ]]` = phonèmes).
- **Ta propre voix** : enregistre une phrase dans `voix-perso/<id>.wav` ;
  elle remplace la voix de synthèse pour ce segment.
- **Voix locale** : Piper « tom » (fr_FR), jeu de données sous licence
  AGPLv3 ; musique synthétisée par `musique.py`.
