# Fabrique la voix off et la ligne de temps de la vidéo.
#
#   python3 voix.py chemin/vers/fr_FR-tom-medium.onnx
#
# Lit texte.json, fait prononcer chaque segment par la voix de synthèse
# (Piper), puis écrit :
#   sortie/voix.wav  : toute la narration, pauses comprises
#   timeline.js      : le début et la fin de chaque segment, lus par
#                      presentation.html pour caler les animations
#
# Pour remplacer la voix de synthèse par la tienne, enregistre un segment
# dans voix-perso/<id>.wav (l'id est dans texte.json) : il sera pris à la
# place, et toute l'animation se recalera dessus.
import io
import json
import os
import sys
import wave

import numpy as np
from piper import PiperVoice, SynthesisConfig

ICI = os.path.dirname(os.path.abspath(__file__))
SR = 44100
DEBUT = 2.0          # silence avant la première phrase
PAUSE = 0.45         # entre deux segments
PAUSE_SCENE = 1.6    # entre deux scènes
FIN = 7.0            # après « Merci. »


def lire_wav(octets_ou_chemin):
    w = wave.open(octets_ou_chemin)
    sr, n, c = w.getframerate(), w.getnframes(), w.getnchannels()
    x = np.frombuffer(w.readframes(n), np.int16).astype(np.float32) / 32768
    if c > 1:
        x = x.reshape(-1, c).mean(axis=1)
    if sr != SR:
        x = np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x)
    return x


def rogner(x, seuil=0.01):
    # enlève les silences au début et à la fin du segment
    i = np.where(np.abs(x) > seuil)[0]
    if not len(i):
        return x
    return x[max(0, i[0] - 400): i[-1] + 2000]


def main():
    voix = PiperVoice.load(sys.argv[1])
    reglages = SynthesisConfig(length_scale=1.08, noise_scale=0.6, noise_w_scale=0.7)
    segments = json.load(open(os.path.join(ICI, 'texte.json'), encoding='utf-8'))['segments']

    morceaux, ligne, t, scene = [], [], DEBUT, None
    morceaux.append(np.zeros(int(DEBUT * SR)))
    for s in segments:
        if scene is not None and s['scene'] != scene:
            morceaux.append(np.zeros(int((PAUSE_SCENE - PAUSE) * SR)))
            t += PAUSE_SCENE - PAUSE
        scene = s['scene']
        perso = os.path.join(ICI, 'voix-perso', s['id'] + '.wav')
        if os.path.exists(perso):
            x = lire_wav(perso)
        else:
            tampon = io.BytesIO()
            with wave.open(tampon, 'wb') as w:
                voix.synthesize_wav(s.get('voix', s['texte']), w, syn_config=reglages)
            tampon.seek(0)
            x = lire_wav(tampon)
        x = rogner(x)
        ligne.append({'id': s['id'], 'scene': s['scene'], 'texte': s['texte'], 'debut': round(t, 3), 'fin': round(t + len(x) / SR, 3)})
        morceaux.append(x)
        morceaux.append(np.zeros(int(PAUSE * SR)))
        t += len(x) / SR + PAUSE
        print(f"{ligne[-1]['debut']:7.2f}  {s['id']}")
    morceaux.append(np.zeros(int((FIN - PAUSE) * SR)))
    duree = t - PAUSE + FIN

    son = np.concatenate(morceaux)
    son = son / np.max(np.abs(son)) * 0.9
    os.makedirs(os.path.join(ICI, 'sortie'), exist_ok=True)
    with wave.open(os.path.join(ICI, 'sortie', 'voix.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((son * 32767).astype(np.int16).tobytes())

    with open(os.path.join(ICI, 'timeline.js'), 'w', encoding='utf-8') as f:
        f.write('// Fichier produit par voix.py : ne pas modifier à la main.\n')
        f.write('window.TIMELINE = ' + json.dumps({'duree': round(duree, 3), 'segments': ligne}, ensure_ascii=False, indent=1) + ';\n')
    print(f'Durée totale : {duree:.1f} s')


main()
