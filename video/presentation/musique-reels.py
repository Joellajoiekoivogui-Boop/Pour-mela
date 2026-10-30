# Musique rythmée pour la version verticale (réseaux sociaux) : grosse
# caisse, claps, charleston, basse syncopée, nappes et arpèges, à 112 BPM.
# Passe sous la voix grâce au mixage de rendu.js.
#   python3 musique-reels.py sortie.wav 120
import sys
import wave

import numpy as np

SR = 44100
sortie, duree = sys.argv[1], float(sys.argv[2])
n = int(SR * duree)
son = np.zeros((n, 2))
rng = np.random.default_rng(3)

BPM = 112
TEMPS = 60 / BPM
MESURE = TEMPS * 4
INTRO = MESURE * 2            # nappe et montée avant le premier temps fort
FIN_GROOVE = duree - MESURE * 2

def note(m):
    return 440 * 2 ** ((m - 69) / 12)

# Fa mineur, Ré bémol, La bémol, Mi bémol
ACCORDS = [[65, 68, 72], [61, 65, 68], [56, 60, 63], [63, 67, 70]]
BASSES = [41, 37, 44, 39]

def ajoute(debut, x, g=1.0, d=1.0):
    i = int(debut * SR)
    if i >= n or i < 0:
        return
    x = x[: n - i]
    son[i:i + len(x), 0] += x * g
    son[i:i + len(x), 1] += x * d

def env(L, a, r):
    e = np.ones(L)
    a, r = min(L, max(1, int(a * SR))), min(L, max(1, int(r * SR)))
    e[:a] = np.linspace(0, 1, a)
    e[-r:] *= np.linspace(1, 0, r)
    return e

def grosse_caisse():
    L = int(.35 * SR); t = np.arange(L) / SR
    f = 45 + 110 * np.exp(-t * 35)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)

def clap():
    L = int(.25 * SR); t = np.arange(L) / SR
    b = rng.standard_normal(L)
    b = b - np.convolve(b, np.ones(6) / 6, mode='same')
    return b * (np.exp(-t * 22) + .5 * np.exp(-((t - .012) ** 2) / 2e-6))

def charleston(ouvert=False):
    L = int((.18 if ouvert else .05) * SR); t = np.arange(L) / SR
    b = rng.standard_normal(L)
    b = b - np.convolve(b, np.ones(3) / 3, mode='same')
    return b * np.exp(-t * (14 if ouvert else 70))

def pluck(m, duree=.3):
    L = int(duree * SR); t = np.arange(L) / SR
    x = sum(np.sin(2 * np.pi * note(m) * k * t) / k for k in (1, 2, 3)) * np.exp(-t * 9)
    x[:80] *= np.linspace(0, 1, 80)
    return x

GC, CL = grosse_caisse(), clap()
k = 0
while k * MESURE < duree:
    d0 = k * MESURE
    acc, b = ACCORDS[k % 4], BASSES[k % 4]
    groove = INTRO <= d0 < FIN_GROOVE
    # nappe
    L = int((MESURE + 1) * SR); t = np.arange(L) / SR
    nappe = sum(np.sin(2 * np.pi * note(m) * t) + .5 * np.sin(2 * np.pi * note(m) * 1.005 * t) for m in acc)
    ajoute(d0, .028 * nappe * env(L, .4, .9), 1, .85)
    for j in range(4):
        dj = d0 + j * TEMPS
        if groove:
            ajoute(dj, .55 * GC)
            if j in (1, 3):
                ajoute(dj, .22 * CL, .9, 1)
            ajoute(dj, .06 * charleston(), .7, 1)
            ajoute(dj + TEMPS / 2, .08 * charleston(ouvert=True), 1, .7)
            # basse syncopée
            for dec in (0, .75, 1.5) if j % 2 == 0 else (.5,):
                Lb = int(TEMPS * .45 * SR); tb = np.arange(Lb) / SR
                basse = np.sin(2 * np.pi * note(b) * tb) + .3 * np.sign(np.sin(2 * np.pi * note(b) * tb))
                ajoute(dj + dec * TEMPS / 2, .12 * basse * env(Lb, .005, .08))
        # arpège en doubles croches
        if d0 >= INTRO / 2:
            for s in range(4):
                m = acc[(j * 4 + s) % 3] + 12 * (1 + (s == 3))
                ajoute(dj + s * TEMPS / 4, .035 * pluck(m), .6 + .4 * (s % 2), 1 - .4 * (s % 2))
    k += 1

# montée de bruit avant le premier temps fort
Lr = int(INTRO * SR); tr = np.arange(Lr) / SR
montee = rng.standard_normal(Lr) * (tr / INTRO) ** 2
ajoute(0, .12 * montee)

t = np.arange(n) / SR
son *= np.clip(t / .5, 0, 1)[:, None]
son *= np.clip((duree - t) / 3.0, 0, 1)[:, None]
son /= np.max(np.abs(son)) / 0.85
with wave.open(sortie, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((son * 32767).astype(np.int16).tobytes())
