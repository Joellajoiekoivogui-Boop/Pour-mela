#!/usr/bin/env bash
# Fabrique le teaser complet : logo HD → bande-son → images → MP4 final.
set -euo pipefail
cd "$(dirname "$0")"
python3 src/prepare_logo.py
python3 src/sound.py
node src/render.js
ffmpeg -y -loglevel error -i build/frames.mp4 -i build/sound.wav \
  -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 18 -maxrate 9M -bufsize 18M -pix_fmt yuv420p -profile:v high -level 4.2 \
  -r 30 -g 30 -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -af "loudnorm=I=-14:TP=-1.0:LRA=11" -ar 48000 -c:a aac -b:a 256k \
  -movflags +faststart -t 15 \
  -metadata title="Fata School — Quelque chose arrive" \
  fata-school-teaser-1080x1920.mp4
echo "→ fata-school-teaser-1080x1920.mp4"
