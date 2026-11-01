# Fata School — teaser « Quelque chose arrive »

Teaser vertical de 15 s (1080 × 1920, 30 i/s, H.264 + AAC, −14 LUFS) pour
TikTok, Instagram, Facebook et WhatsApp : **`fata-school-teaser-1080x1920.mp4`**.

| Temps | Séquence |
|---|---|
| 0–3 s | Noir, point jaune qui bat comme un cœur, « ET SI QUELQUE CHOSE SE PRÉPARAIT ? » |
| 3–6 s | Formes 3D, « COLLÉGIENS. » (entrée en bandes), volet vert, « LYCÉENS. » (impact) |
| 6–9,75 s | Tunnel de cercles, éclats jaunes et verts, rythme qui accélère, « ÊTES-VOUS PRÊTS ? » |
| 9,75–10 s | Coupure : noir et silence total |
| 10–15 s | Flash blanc, logo {fata} assemblé, « QUELQUE CHOSE ARRIVE… », « RESTEZ CONNECTÉS. » |

Couleurs : #FFC400, #1E8E3E, #111111, #FFFFFF. Typo : Anton (+ Bebas Neue
pour la signature), licence SIL OFL (`assets/OFL-Anton.txt`).
Le son est entièrement synthétisé (`src/sound.py`), aucun échantillon externe.

## Refaire la vidéo

Prérequis : Python 3 (numpy, scipy, Pillow), Node + Playwright (Chromium), ffmpeg.

```bash
./make.sh
```

- `src/timeline.json` : chronologie partagée par l'image et le son (changer un
  temps décale les deux ensemble).
- `src/teaser.js` : toute l'animation ; ouvrir `src/teaser.html?play` via un
  serveur local pour un aperçu en temps réel.
- `node src/render.js --stills 3.2,10.5` : images de contrôle dans `build/`.
