# 🎬 Joël Koïkoï Koivogui — vidéo motion design

**La vidéo : [`joel-koivogui-motion.mp4`](joel-koivogui-motion.mp4)**
(1920 × 1080, 30 images/s, 1 min 32, avec musique).

Elle raconte le manifeste de Joël en dix temps :

| Temps | Scène |
|---|---|
| 0:00 | Intro : le nom se forme dans la lumière, les trois rôles |
| 0:09 | « Le numérique est bien plus qu'un ensemble d'outils » |
| 0:17 | 01 · Le développement : éditeur de code animé, stack React / Next.js / Node.js / Supabase |
| 0:25 | 01 · Comprendre, concevoir, construire |
| 0:32 | 02 · Entrepreneuriat : Digiterra, de l'idée à la valeur |
| 0:42 | 03 · IA et robotique : réseau de neurones vivant |
| 0:52 | 04 · Formation : fata.school, le talent existe partout |
| 1:01 | 05 · L'Afrique numérique : carte qui naît depuis la Guinée |
| 1:12 | Apprendre. Construire. Évoluer. |
| 1:20 | « Je travaille à le construire. » et signature |

## Modifier et refaire la vidéo

- `animation.html` : toute l'animation (canvas). Ouverte dans un navigateur,
  elle se joue en direct ; les textes et les couleurs sont dans ce fichier.
- `musique.py` : la bande-son, synthétisée (numpy).
- `rendu.js` : fabrique le MP4 (Playwright + ffmpeg).

```bash
node video/rendu.js                     # refait joel-koivogui-motion.mp4 (≈ 3 min)
node video/rendu.js --apercu 5,30,70    # images PNG de ces instants, dans video/apercu/
```
