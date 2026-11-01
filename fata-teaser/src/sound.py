"""Bande-son du teaser, synthétisée de A à Z (aucun échantillon externe).

Calée sur src/timeline.json, la même chronologie que l'image :
  0–3 s    battements graves, drone, souffle sur le texte
  3–6 s    impacts sur « COLLÉGIENS. » et « LYCÉENS. », whooshs, aspiration
  6–9,75 s montée : rythme qui accélère, riser, roulement
  9,75 s   coupure nette, silence
  10 s     impact massif + « braam », nappe, ponctuations, signature finale

Sortie : build/sound.wav (48 kHz, stéréo, 24 bits).
"""
import json
import wave
from pathlib import Path

import numpy as np
from scipy import signal

ROOT = Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "src" / "timeline.json").read_text())
SR = 48000
DUR = TL["duration"]
N = int(SR * DUR)
rs = np.random.default_rng(2026)

L = np.zeros(N)
R = np.zeros(N)
REV = np.zeros(N)  # envoi vers la réverbération (mono)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def add(x, at, gain=1.0, pan=0.0, rev=0.0):
    """Place un son à l'instant `at` (s). pan -1..1, rev = envoi réverb."""
    i = int(at * SR)
    if i >= N:
        return
    x = x[: N - i]
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(x)] += x * gain * gl * 1.414
    R[i:i + len(x)] += x * gain * gr * 1.414
    REV[i:i + len(x)] += x * gain * rev


def filt(x, kind, f, order=2):
    sos = signal.butter(order, f, btype=kind, fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def noise(d):
    return rs.standard_normal(int(d * SR))


def kick(f0=160, f1=42, d=0.6, punch=0.012, decay=6.0):
    t = t_axis(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.045)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * decay)
    click = filt(noise(d), "highpass", 2500) * np.exp(-t / punch) * 0.25
    return np.tanh((body + click) * 1.6)


def sub_boom(d=3.0, f0=70, f1=32):
    t = t_axis(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.25)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.4)


def crash(d=2.5, decay=2.2, lo=1500):
    t = t_axis(d)
    return filt(noise(d), "highpass", lo) * np.exp(-t * decay) * 0.35


def metal(d=1.5, base=180):
    t = t_axis(d)
    x = sum(np.sin(2 * np.pi * base * r * t + k) * np.exp(-t * (2.5 + k)) / (k + 1)
            for k, r in enumerate([1.0, 1.593, 2.135, 2.653, 3.471]))
    return x * 0.35


def whoosh(d=0.8, f0=300, f1=4000, peak=0.6):
    """Bruit filtré dont la fréquence balaye f0→f1, enveloppe en cloche."""
    n = int(d * SR)
    x = noise(d)
    out = np.zeros(n)
    blk = 256
    zi = None
    for s in range(0, n, blk):
        p = s / n
        fc = f0 * (f1 / f0) ** p
        sos = signal.butter(2, [fc * 0.7, min(fc * 1.4, SR / 2 - 100)], btype="bandpass", fs=SR, output="sos")
        if zi is None:
            zi = signal.sosfilt_zi(sos) * 0
        out[s:s + blk], zi = signal.sosfilt(sos, x[s:s + blk], zi=zi)
    t = np.linspace(0, 1, n)
    env = np.where(t < peak, (t / peak) ** 2, np.exp(-np.clip(t - peak, 0, None) / (1 - peak) * 4))
    return out * env * 1.6


def saw(freq, t):
    return 2 * ((freq * t) % 1) - 1


def pad(freqs, d, attack=0.8, release=2.0, cutoff=1800):
    t = t_axis(d)
    x = sum(saw(f * (1 + 0.003 * k), t) + saw(f * (1 - 0.004 * k), t) for k, f in enumerate(freqs))
    x = filt(x, "lowpass", cutoff, 2) / (2 * len(freqs))
    env = np.minimum(1, t / attack) * np.minimum(1, (d - t) / release)
    return x * np.clip(env, 0, 1)


def snare(d=0.25):
    t = t_axis(d)
    n = filt(noise(d), "bandpass", [1200, 7000]) * np.exp(-t * 18)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25) * 0.5
    return n * 0.7 + tone


def hat(d=0.06):
    t = t_axis(d)
    return filt(noise(d), "highpass", 7000) * np.exp(-t * 70) * 0.5


def tick(f=2400, d=0.05):
    t = t_axis(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 90)


# ------------------------------------------------------------ 0–3 s : mystère
t = t_axis(3.05)
drone = (np.sin(2 * np.pi * 41.2 * t) * 0.6 + np.sin(2 * np.pi * 61.7 * t + 1) * 0.25
         + filt(noise(3.05), "lowpass", 220) * 0.5)
drone *= np.minimum(1, t / 1.2) * (1 + 0.25 * np.sin(2 * np.pi * 0.6 * t))
drone *= np.clip((2.98 - t) / 0.05, 0, 1)
add(drone, 0.0, 0.35, rev=0.1)
air = filt(noise(3.0), "bandpass", [2500, 9000]) * np.minimum(1, t_axis(3.0) / 2.5) * 0.04
add(air, 0.0, 1.0, pan=0.0, rev=0.2)
for b in TL["heart"]:
    add(filt(kick(110, 38, 0.7, decay=5), "lowpass", 300), b, 0.9, rev=0.15)
    add(filt(kick(95, 36, 0.5, decay=7), "lowpass", 260), b + 0.19, 0.5, rev=0.15)
# souffle inversé qui accompagne l'apparition du texte
add(whoosh(1.0, 800, 5000, peak=0.85), TL["textIn"] - 0.4, 0.22, rev=0.3)
add(whoosh(0.9, 600, 3500, peak=0.9), TL["textIn"] + 0.45, 0.18, pan=0.3, rev=0.3)
add(metal(1.2, 520) * 0.5, TL["textIn"] + 0.78, 0.25, pan=-0.2, rev=0.6)
# glitchs
for g in (2.2, 2.86):
    add(filt(noise(0.09), "bandpass", [900, 5000]) * np.sign(np.sin(2 * np.pi * 37 * t_axis(0.09))), g, 0.12)
# aspiration avant l'impact
add(whoosh(0.5, 3000, 200, peak=0.95), 2.5, 0.35, rev=0.2)

# ------------------------------------------------------------ 3–6 s : destinataires
def big_hit(at, gain=1.0, pitch=1.0, pan=0.0):
    add(kick(170 * pitch, 44 * pitch, 0.9, decay=4.5), at, 1.0 * gain, rev=0.25)
    add(sub_boom(1.6, 80 * pitch, 34 * pitch), at, 0.55 * gain)
    add(crash(1.4, 3.5, 2500), at, 0.45 * gain, pan=pan, rev=0.6)
    add(metal(1.2, 160 * pitch), at, 0.35 * gain, pan=-pan, rev=0.7)


add(whoosh(0.6, 400, 6000, peak=0.5), TL["hit1"] - 0.05, 0.55, pan=-0.5, rev=0.2)
big_hit(TL["hit1"], 1.0)
add(tick(1800), TL["tick"], 0.35, rev=0.4)
add(tick(2400), TL["tick"] + 0.06, 0.2, rev=0.4)
add(whoosh(0.5, 300, 7000, peak=0.75), TL["wipe"] - 0.1, 0.6, pan=0.6, rev=0.2)
big_hit(TL["hit2"], 1.05, pitch=0.9, pan=0.3)
add(snare(), TL["hit2"], 0.45, rev=0.5)
add(kick(140, 50, 0.4), TL["hit3"], 0.55, rev=0.3)
add(metal(0.9, 240), TL["hit3"], 0.25, rev=0.6)
# pulsation discrète entre les impacts
for k in np.arange(3.5, 5.5, 0.5):
    add(filt(kick(90, 40, 0.3, decay=9), "lowpass", 200), k, 0.35)
# aspiration vers le tunnel (son inversé)
suck = whoosh(0.5, 200, 6000, peak=0.98)
add(suck, TL["suck"], 0.6, rev=0.1)
rev_crash = crash(0.45, 0, 800) * np.linspace(0, 1, int(0.45 * SR)) ** 3
add(rev_crash, TL["tunnel"] - 0.45, 0.6)

# ------------------------------------------------------------ 6–9,75 s : montée
t0, t1 = TL["tunnel"], TL["stop"]
d = t1 - t0
tt = t_axis(d)
prog = tt / d
# riser : scie qui monte + bruit filtré qui s'ouvre
f = 55 * 2 ** (prog * 2.5)
riser = (saw(1, np.cumsum(f) / SR) + saw(1, np.cumsum(f * 1.5) / SR) * 0.5)
riser = filt(riser, "lowpass", 3000) * (0.1 + 0.9 * prog ** 2) * 0.22
n_rise = whoosh(d, 200, 9000, peak=0.999) * 0.5
lfo = 0.6 + 0.4 * np.sign(np.sin(2 * np.pi * np.cumsum(2 + 14 * prog ** 2) / SR))  # trémolo qui s'emballe
add(riser * lfo, t0, 1.0, rev=0.2)
add(n_rise, t0, 0.6, rev=0.2)
# basse pulsée
bass = np.sin(2 * np.pi * 41.2 * tt) * 0.6 + np.sin(2 * np.pi * 82.4 * tt) * 0.25
add(bass * (0.3 + 0.7 * prog), t0, 0.35)
build = TL["build"]
for i, b in enumerate(build):
    g = 1.0 if i < 8 else 0.85
    add(kick(165, 45, 0.45, decay=7), b, 0.95 * g, rev=0.15)
    if i < 8:
        add(snare(), b + (build[i + 1] - b) / 2 if i + 1 < len(build) else b, 0.35, rev=0.3)
    else:
        add(snare(0.12), b, 0.45 * (0.6 + 0.4 * i / len(build)), rev=0.25)
    add(hat(), b + 0.03, 0.25, pan=0.4)
# charleston en doubles croches continues
for h in np.arange(t0, t1, 0.125):
    add(hat(0.04), h + 0.0625, 0.18 * (0.4 + 0.6 * (h - t0) / d), pan=-0.4)
# impacts des phrases
big_hit(TL["q1"], 0.6, pitch=1.1)
big_hit(TL["q2"], 1.0, pitch=0.95)
add(metal(1.0, 300), TL["q2"], 0.35, rev=0.8)

# ------------------------------------------------------------ coupure + silence
stop = int(t1 * SR)
fade = int(0.004 * SR)
env = np.ones(N)
env[stop:stop + fade] = np.linspace(1, 0, fade)
env[stop + fade:int(TL["reveal"] * SR)] = 0
env[int(TL["tunnel"] * SR):stop] *= 0.72  # laisse de la place à l'impact final
L *= env
R *= env
REV *= env

# ------------------------------------------------------------ 10–15 s : signature
rv = TL["reveal"]
add(kick(200, 40, 1.4, decay=2.5), rv, 1.2, rev=0.4)
add(sub_boom(3.5, 75, 30), rv, 0.95)
add(crash(3.5, 1.2, 1200), rv, 0.7, rev=1.0)
add(metal(3.0, 110), rv, 0.45, rev=1.0)
# « braam » : accord grave cuivré (La mineur ajouté de quinte)
braam = pad([55.0, 82.41, 110.0, 130.81, 164.81], 3.2, attack=0.02, release=2.6, cutoff=900)
add(braam, rv, 1.1, rev=0.6)
# nappe lumineuse qui porte la fin
glow = pad([220.0, 329.63, 440.0, 493.88, 659.25], 4.9, attack=1.2, release=1.6, cutoff=2600)
add(glow, rv + 0.1, 0.35, rev=0.8)
# ponctuations des phrases
for at in (TL["line1"], TL["line2"]):
    add(filt(kick(120, 45, 0.5, decay=6), "lowpass", 400), at, 0.6, rev=0.3)
    add(whoosh(0.35, 1500, 6000, peak=0.3), at - 0.05, 0.2, rev=0.3)
    for k in range(4):
        add(tick(2000 + 300 * k), at + 0.02 + k * 0.05, 0.12, pan=-0.3 + 0.2 * k, rev=0.4)
# points de chargement : petits bips
for k in range(3):
    add(tick(1760 + 220 * k, 0.08), TL["line1"] + 0.6 + k * 0.12, 0.12, rev=0.5)
# signature finale : deux notes claires sur la respiration des accolades
st = TL["sting"]
for k, fr in enumerate((880.0, 1318.5)):
    tb = t_axis(1.6)
    bell = (np.sin(2 * np.pi * fr * tb) + 0.35 * np.sin(2 * np.pi * fr * 2.01 * tb)) * np.exp(-tb * 3.2)
    add(bell, st + k * 0.12, 0.22, pan=-0.2 + 0.4 * k, rev=0.9)
add(sub_boom(1.2, 60, 38), st, 0.45)

# ------------------------------------------------------------ réverbération
ir_d = 2.6
ti = t_axis(ir_d)
irL = rs.standard_normal(len(ti)) * np.exp(-ti * 2.6)
irR = rs.standard_normal(len(ti)) * np.exp(-ti * 2.6)
irL, irR = filt(irL, "lowpass", 5000), filt(irR, "lowpass", 5000)
wet_src = filt(REV, "highpass", 150)
wetL = signal.fftconvolve(wet_src, irL)[:N]
wetR = signal.fftconvolve(wet_src, irR)[:N]
wn = max(np.abs(wetL).max(), np.abs(wetR).max()) + 1e-9
dry_n = max(np.abs(L).max(), np.abs(R).max())
L += wetL / wn * dry_n * 0.22
R += wetR / wn * dry_n * 0.22
# le silence de la coupure doit rester total
L *= env
R *= env

# ------------------------------------------------------------ master
mix = np.stack([L, R], 1)
mix = filt(mix.T, "highpass", 25).T
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.8) / np.tanh(1.8)  # saturation douce
silence = slice(int(TL["stop"] * SR) + fade, int(TL["reveal"] * SR))
mix[silence] = 0
end_fade = np.ones(N)
end_fade[-int(0.6 * SR):] = np.linspace(1, 0, int(0.6 * SR)) ** 2
mix *= end_fade[:, None]
mix *= 0.89 / (np.abs(mix).max() + 1e-9)

out = ROOT / "build" / "sound.wav"
out.parent.mkdir(exist_ok=True)
pcm = (np.clip(mix, -1, 1) * (2 ** 23 - 1)).astype(np.int32)
b = pcm.astype("<i4").tobytes()
b24 = np.frombuffer(b, np.uint8).reshape(-1, 4)[:, :3].tobytes()  # 32 → 24 bits
with wave.open(str(out), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(3)
    w.setframerate(SR)
    w.writeframes(b24)
print(f"{out} — {DUR} s")
