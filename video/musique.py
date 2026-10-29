# Bande-son synthétisée pour la vidéo : nappes d'accords, basse, pulsation
# douce et petits arpèges. Aucune dépendance à part numpy.
#   python3 musique.py sortie.wav 92
import sys
import wave
import numpy as np

SR = 44100
sortie, duree = sys.argv[1], float(sys.argv[2])
n = int(SR * duree)
t = np.arange(n) / SR
son = np.zeros((n, 2))

BPM = 96
temps = 60 / BPM
mesure = temps * 4

def note(m):
    return 440 * 2 ** ((m - 69) / 12)

# La mineur, Fa, Do, Sol : une mesure chacun (en notes MIDI)
ACCORDS = [[57, 60, 64], [53, 57, 60], [48, 55, 64], [55, 59, 62]]
BASSES = [45, 41, 36, 43]

def enveloppe(longueur, attaque, chute):
    e = np.ones(longueur)
    a = min(longueur, int(attaque * SR))
    e[:a] = np.linspace(0, 1, a)
    c = min(longueur, int(chute * SR))
    e[-c:] *= np.linspace(1, 0, c)
    return e

def ajoute(debut, signal, gauche=1.0, droite=1.0):
    i = int(debut * SR)
    if i >= n:
        return
    signal = signal[: n - i]
    son[i:i + len(signal), 0] += signal * gauche
    son[i:i + len(signal), 1] += signal * droite

nb_mesures = int(duree / mesure) + 1
for k in range(nb_mesures):
    d = k * mesure
    accord, basse = ACCORDS[k % 4], BASSES[k % 4]
    L = int((mesure + 1.5) * SR)
    tt = np.arange(L) / SR
    # nappe : sinus légèrement désaccordés
    nappe = sum(np.sin(2 * np.pi * note(m) * tt) + np.sin(2 * np.pi * note(m) * 1.003 * tt) for m in accord)
    nappe += 0.3 * sum(np.sin(2 * np.pi * note(m + 12) * tt) for m in accord)
    ajoute(d, 0.035 * nappe * enveloppe(L, 1.2, 1.6), 0.9, 1.0)
    # basse
    b = np.sin(2 * np.pi * note(basse) * tt) + 0.3 * np.sin(2 * np.pi * note(basse) * 2 * tt)
    ajoute(d, 0.09 * b * enveloppe(L, 0.05, 1.2))
    # pulsation (grosse caisse douce) à partir de 9 s, arpèges à partir de 17 s
    for j in range(4):
        dj = d + j * temps
        if 9 <= dj < duree - 4:
            Lk = int(0.35 * SR)
            tk = np.arange(Lk) / SR
            f = 50 + 90 * np.exp(-tk * 30)
            kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tk * 9)
            ajoute(dj, 0.28 * kick)
        if 17 <= dj < duree - 6:
            for s in range(2):
                m = accord[(j * 2 + s) % 3] + 24
                Ld = int(0.5 * SR)
                td = np.arange(Ld) / SR
                arp = np.sin(2 * np.pi * note(m) * td) * np.exp(-td * 7)
                pan = 0.4 + 0.6 * ((j + s) % 2)
                ajoute(dj + s * temps / 2, 0.05 * arp, pan, 1.4 - pan)

# souffles aux changements de chapitre
rng = np.random.default_rng(7)
for c in [9, 17, 25.5, 32.5, 42.5, 52, 61.5, 72.5, 80.5]:
    Lw = int(1.0 * SR)
    bruit = rng.standard_normal(Lw)
    bruit = np.convolve(bruit, np.ones(30) / 30, mode='same')
    env = np.sin(np.linspace(0, np.pi, Lw)) ** 2
    ajoute(c - 0.5, 0.25 * bruit * env)

# fondus d'entrée et de sortie, normalisation
son *= np.clip(t / 2.0, 0, 1)[:, None]
son *= np.clip((duree - t) / 4.0, 0, 1)[:, None]
son /= np.max(np.abs(son)) / 0.85
donnees = (son * 32767).astype(np.int16)
with wave.open(sortie, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(donnees.tobytes())
