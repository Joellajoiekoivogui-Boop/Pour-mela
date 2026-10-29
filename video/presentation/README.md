# 🎤 Présentation professionnelle — Joël Koïkoï Koïvogui

Vidéo motion design de 8 min 53, avec voix off française, sous-titres et
musique d'ambiance. Les animations sont calées phrase par phrase sur la voix.

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
| `photo-joel.jpg` | Portrait de fin et scène FATA | Monogramme « JK » |
| `joel-scene.jpg` | Prise de parole (FATA) | Cadre vide |
| `affiche-fata.jpg` | Événements FATA | Cadre vide |
| `logo-fata.png` | Logo {fata} | Logo redessiné |
| `logo-elitech.png` | Logo ELITECH ACADEMY | Logo typographique |
| `logo-yen.png` | Logo Youth Engineers Network | « YEN » en grand |
| `capture-nabele.png`, `capture-smartstock.png`, `capture-sgs.png`, `capture-solarbox.png`, `capture-ast.png`, `capture-om.png` | Vraies captures d'écran des produits | Maquettes animées |

Il suffit d'ajouter un fichier puis de relancer le rendu : il remplace
automatiquement la maquette.

## Refaire la vidéo

```bash
pip install piper-tts numpy        # une fois
# voix française « tom » (Piper), une fois :
curl -L https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-fr_FR-tom-medium.tar.bz2 | tar xj

python3 video/presentation/voix.py vits-piper-fr_FR-tom-medium/fr_FR-tom-medium.onnx   # voix + timeline.js
node video/presentation/rendu.js                                                         # ≈ 20 min
node video/presentation/rendu.js --apercu nom+2,sgs+5                                    # aperçus PNG
```

La vidéo sort dans `sortie/presentation-joel-koivogui.mp4`. Pour voir
l'animation en direct, ouvre `presentation.html` dans un navigateur et clique.

- **Changer le texte** : `texte.json` (le champ `voix` aide la prononciation ;
  `[[ … ]]` donne directement les phonèmes, comme pour « Koïkoï Koïvogui »),
  puis relance `voix.py` : toute l'animation se recale.
- **Ta propre voix** : enregistre une phrase dans `voix-perso/<id>.wav` (l'id
  est dans `texte.json`) ; elle remplace la voix de synthèse pour ce segment.
- **Voix utilisée** : Piper « tom » (fr_FR, qualité moyenne), jeu de données
  sous licence AGPLv3 ; musique synthétisée par `musique.py`.
