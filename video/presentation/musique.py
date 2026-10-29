# Musique d'ambiance cinématographique, discrète, pour passer sous la voix :
# nappes lentes, basse tenue et notes de piano espacées. Aucune percussion.
#   python3 musique.py sortie.wav 533
import sys
import wave

import numpy as np

SR = 44100
sortie, duree = sys.argv[1], float(sys.argv[2])
n = int(SR * duree)
son = np.zeros((n, 2))

def note(m):
    return 440 * 2 ** ((m - 69) / 12)

# Ré mineur, Si bémol, Fa, Do : quatre secondes par accord
ACCORDS = [[62, 65, 69], [58, 62, 65], [53, 57, 60], [55, 60, 64]]
BASSES = [38, 34, 41, 36]
MOTIF = [0, 2, 1, 2, 0, 1]
PAS = 4.0

def ajoute(debut, x, g=1.0, d=1.0):
    i = int(debut * SR)
    if i >= n:
        return
    x = x[: n - i]
    son[i:i + len(x), 0] += x * g
    son[i:i + len(x), 1] += x * d

def env(L, a, r):
    e = np.ones(L)
    a, r = min(L, int(a * SR)), min(L, int(r * SR))
    e[:a] = np.linspace(0, 1, a)
    e[-r:] *= np.linspace(1, 0, r)
    return e

k = 0
while k * PAS < duree:
    d = k * PAS
    acc, b = ACCORDS[k % 4], BASSES[k % 4]
    L = int((PAS + 3) * SR)
    tt = np.arange(L) / SR
    vib = 1 + 0.002 * np.sin(2 * np.pi * 0.3 * tt)
    nappe = sum(np.sin(2 * np.pi * note(m) * tt * vib) + 0.6 * np.sin(2 * np.pi * note(m) * 1.004 * tt) for m in acc)
    ajoute(d, 0.03 * nappe * env(L, 2.0, 3.0), 1.0, 0.85)
    basse = np.sin(2 * np.pi * note(b) * tt) + 0.25 * np.sin(2 * np.pi * note(b + 12) * tt)
    ajoute(d, 0.07 * basse * env(L, 1.0, 3.0))
    # notes de piano : un motif doux, plus présent au début et à la fin
    if k % 2 == 0 or d < 12 or d > duree - 30:
        for j, idx in enumerate(MOTIF[: 4]):
            m = acc[idx] + 12
            Lp = int(2.5 * SR)
            tp = np.arange(Lp) / SR
            piano = (np.sin(2 * np.pi * note(m) * tp) + 0.4 * np.sin(4 * np.pi * note(m) * tp) + 0.15 * np.sin(6 * np.pi * note(m) * tp)) * np.exp(-tp * 2.2)
            piano[:200] *= np.linspace(0, 1, 200)
            ajoute(d + j * PAS / 4, 0.045 * piano, 0.7 + 0.3 * (j % 2), 1.0 - 0.3 * (j % 2))
    k += 1

t = np.arange(n) / SR
son *= np.clip(t / 3.0, 0, 1)[:, None]
son *= np.clip((duree - t) / 5.0, 0, 1)[:, None]
son /= np.max(np.abs(son)) / 0.8
with wave.open(sortie, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((son * 32767).astype(np.int16).tobytes())
