// La bande-son du film, entièrement synthétisée à partir de la partition :
// aucun fichier audio, aucun droit d'auteur, et une synchronisation exacte
// avec l'image. Le même code tourne dans le navigateur (lecture du film) et
// dans Node (rendu de la vidéo MP4).
(function (racine, fabrique) {
  const api = fabrique(typeof module === 'object' && module.exports ? require('./partition.js') : racine.JoelPartition);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else racine.JoelBandeSon = api;
})(typeof self !== 'undefined' ? self : this, function (Partition) {
  'use strict';

  const DEUX_PI = Math.PI * 2;
  const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  function hasard(graine) {
    let a = graine >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Enveloppe attaque / maintien / relâchement (en secondes).
  function enveloppe(x, d, att, rel) {
    if (x < 0 || x > d) return 0;
    let v = 1;
    if (att > 0 && x < att) v = x / att;
    if (rel > 0 && x > d - rel) v = Math.min(v, (d - x) / rel);
    return v;
  }

  // ------------------------------------------------------------ instruments
  // Chaque instrument ajoute son signal dans les pistes (gauche, droite) et
  // un envoi vers la réverbération.
  const INSTRUMENTS = {
    drone(c, e) {
      const { sr } = c;
      const d = e.d;
      const i0 = Math.floor(e.t * sr);
      const n = Math.floor(d * sr);
      for (let k = 0; k < n; k++) {
        const x = k / sr;
        const env = enveloppe(x, d, e.att || 2, 0.02) * (0.75 + 0.25 * Math.sin(DEUX_PI * 0.23 * x));
        const s = Math.sin(DEUX_PI * e.f * x) + 0.45 * Math.sin(DEUX_PI * e.f * 2.003 * x) + 0.12 * Math.sin(DEUX_PI * e.f * 3.01 * x);
        const v = s * env * e.gain;
        ajouter(c, i0 + k, v * 0.98, v, 0.05);
      }
    },

    souffle(c, e) {
      const { sr } = c;
      const r = hasard(11);
      const i0 = Math.floor(e.t * sr);
      const n = Math.floor(e.d * sr);
      let bl = 0, br = 0;
      for (let k = 0; k < n; k++) {
        const x = k / sr;
        const coupe = 0.008 + 0.006 * Math.sin(DEUX_PI * 0.11 * x);
        bl += coupe * (r() * 2 - 1 - bl);
        br += coupe * (r() * 2 - 1 - br);
        const env = enveloppe(x, e.d, e.att || 2, 0.02) * (0.6 + 0.4 * Math.sin(DEUX_PI * 0.17 * x + 1));
        ajouter(c, i0 + k, bl * env * e.gain * 6, br * env * e.gain * 6, 0.3);
      }
    },

    // Texture électronique : petits grains aigus, très discrets.
    texture(c, e) {
      const r = hasard(23);
      const nb = Math.floor(e.d * 7);
      for (let k = 0; k < nb; k++) {
        const t = e.t + r() * e.d;
        const f = 2000 + r() * 4000;
        grain(c, t, f, 0.025 + r() * 0.04, e.gain * (0.4 + r() * 0.6), r() * 2 - 1, 0.7);
      }
    },

    battement(c, e) {
      cogner(c, e.t, e.gain, 62, 38, 0.16);
      cogner(c, e.t + 0.21, e.gain * 0.7, 58, 36, 0.16);
    },

    kick(c, e) {
      cogner(c, e.t, e.gain, 150, 44, 0.32);
    },

    hat(c, e) {
      const { sr } = c;
      const r = hasard(Math.floor(e.t * 1000) + 5);
      const i0 = Math.floor(e.t * sr);
      const n = Math.floor(0.06 * sr);
      let prec = 0;
      for (let k = 0; k < n; k++) {
        const x = k / sr;
        const b = r() * 2 - 1;
        const hp = b - prec;
        prec = b;
        const v = hp * Math.exp(-x / 0.012) * e.gain;
        ajouter(c, i0 + k, v * 0.8, v, 0.05);
      }
    },

    clap(c, e) {
      const { sr } = c;
      const r = hasard(Math.floor(e.t * 1000) + 9);
      const i0 = Math.floor(e.t * sr);
      const n = Math.floor(0.3 * sr);
      let lp = 0;
      for (let k = 0; k < n; k++) {
        const x = k / sr;
        const b = r() * 2 - 1;
        lp += 0.35 * (b - lp);
        const bp = b - lp;
        const env = Math.exp(-x / 0.07) * (x < 0.01 ? 0.6 + 0.4 * Math.sin(x * 900) : 1);
        const ton = Math.sin(DEUX_PI * 190 * x) * Math.exp(-x / 0.04) * 0.4;
        const v = (bp * env + ton) * e.gain;
        ajouter(c, i0 + k, v, v * 0.9, 0.35);
      }
    },

    // Le coup de basse : sous-grave qui descend, très long.
    coupBasse(c, e) {
      const { sr } = c;
      const i0 = Math.floor(e.t * sr);
      const n = Math.floor(3.2 * sr);
      let phase = 0;
      for (let k = 0; k < n; k++) {
        const x = k / sr;
        const f = 30 + 55 * Math.exp(-x / 0.25);
        phase += DEUX_PI * f / sr;
        const env = Math.min(1, x / 0.004) * Math.exp(-x / 1.1);
        let v = Math.tanh(Math.sin(phase) * 1.8) * env * e.gain * 0.75;
        ajouter(c, i0 + k, v, v, 0.12);
      }
    },

    impact(c, e) {
      const { sr } = c;
      const r = hasard(Math.floor(e.t * 1000) + 3);
      cogner(c, e.t, e.gain * 0.8, 120, 40, 0.5);
      const i0 = Math.floor(e.t * sr);
      const n = Math.floor(1.8 * sr);
      let lp = 0;
      for (let k = 0; k < n; k++) {
        const x = k / sr;
        const b = r() * 2 - 1;
        lp += (0.05 + 0.5 * Math.exp(-x / 0.08)) * (b - lp);
        const v = lp * Math.exp(-x / 0.35) * e.gain * 0.55;
        ajouter(c, i0 + k, v * (0.8 + 0.2 * r()), v * (0.8 + 0.2 * r()), 0.6);
      }
    },

    whoosh(c, e) {
      const { sr } = c;
      const r = hasard(Math.floor(e.t * 1000) + 17);
      const i0 = Math.floor(e.t * sr);
      const n = Math.floor(e.d * sr);
      let bas = 0, bande = 0;
      for (let k = 0; k < n; k++) {
        const x = k / n;
        const fc = 300 + 4200 * Math.sin(Math.PI * x) ** 2;
        const f = 2 * Math.sin(Math.PI * fc / sr);
        const entree = r() * 2 - 1;
        bas += f * bande;
        const haut = entree - bas - 0.7 * bande;
        bande += f * haut;
        const env = Math.sin(Math.PI * Math.pow(x, 0.8)) ** 2;
        const v = bande * env * e.gain * 1.6;
        const pan = x * 2 - 1;
        ajouter(c, i0 + k, v * (1 - pan) * 0.7, v * (1 + pan) * 0.7, 0.3);
      }
    },

    // La montée : souffle filtré qui s'ouvre et note qui grimpe.
    riser(c, e) {
      const { sr } = c;
      const r = hasard(Math.floor(e.t * 1000) + 29);
      const i0 = Math.floor(e.t * sr);
      const n = Math.floor(e.d * sr);
      let bas = 0, bande = 0, phase = 0;
      for (let k = 0; k < n; k++) {
        const x = k / n;
        const fc = 400 + 7000 * x * x;
        const f = 2 * Math.sin(Math.PI * Math.min(fc, sr / 6) / sr);
        bas += f * bande;
        const haut = (r() * 2 - 1) - bas - 0.5 * bande;
        bande += f * haut;
        phase += DEUX_PI * (110 * Math.pow(4, x)) / sr;
        const ton = (((phase / DEUX_PI) % 1) * 2 - 1) * 0.12 + Math.sin(phase * 2) * 0.1;
        const env = Math.pow(x, 2.2) * (k > n - sr * 0.004 ? (n - k) / (sr * 0.004) : 1);
        const v = (bande * 0.9 + ton) * env * e.gain;
        ajouter(c, i0 + k, v, v, 0.25);
      }
    },

    // Étincelles : petites cloches aiguës dispersées dans l'espace.
    eclats(c, e) {
      const r = hasard(Math.floor(e.t * 1000) + 41);
      const nb = Math.floor(e.d * e.densite);
      const notes = [86, 88, 90, 93, 95, 98, 100, 102];
      for (let k = 0; k < nb; k++) {
        const t = e.t + Math.pow(r(), 1.4) * e.d;
        const f = freq(notes[Math.floor(r() * notes.length)]);
        grain(c, t, f, 0.25 + r() * 0.5, e.gain * (0.3 + r() * 0.7), r() * 2 - 1, 0.6);
      }
    },

    pulse(c, e) {
      const { sr } = c;
      const i0 = Math.floor(e.t * sr);
      const n = Math.floor(0.05 * sr);
      for (let k = 0; k < n; k++) {
        const x = k / sr;
        const carre = Math.sin(DEUX_PI * e.f * x) > 0 ? 1 : -1;
        const v = Math.round(carre * Math.exp(-x / 0.012) * 6) / 6 * e.gain;
        ajouter(c, i0 + k, v * 0.9, v, 0.15);
      }
    },

    glitch(c, e) {
      const { sr } = c;
      const r = hasard(Math.floor(e.t * 1000) + 53);
      const i0 = Math.floor(e.t * sr);
      const n = Math.floor(0.16 * sr);
      let tenu = 0;
      for (let k = 0; k < n; k++) {
        if (k % 90 === 0) tenu = (r() * 2 - 1) * (r() < 0.6 ? 1 : 0);
        const v = tenu * e.gain * (1 - k / n);
        ajouter(c, i0 + k, v, -v, 0.05);
      }
    },

    // Cloche douce (presque un piano) pour la mélodie.
    cloche(c, e) {
      const f = freq(e.f);
      grain(c, e.t, f, e.d, e.gain, 0, 0.45, [1, 0.35, 0.12, 0.05]);
    },

    pad(c, e) {
      const { sr } = c;
      const i0 = Math.floor(e.t * sr);
      const n = Math.floor((e.d + 0.05) * sr);
      const voix = [];
      e.notes.forEach((note, j) => {
        for (const desacc of [-0.07, 0, 0.07]) {
          voix.push({ f: freq(note) * Math.pow(2, desacc / 12), phase: (j * 0.37 + desacc * 3) % 1, pan: ((j / Math.max(1, e.notes.length - 1)) * 2 - 1) * 0.6 + desacc * 4 });
        }
      });
      const g = e.gain / Math.sqrt(voix.length);
      let l1 = 0, l2 = 0, r1 = 0, r2 = 0;
      const a = 1 - Math.exp(-DEUX_PI * e.coupe / sr);
      for (let k = 0; k < n; k++) {
        const x = k / sr;
        const env = enveloppe(x, e.d, e.att, e.rel);
        if (env <= 0) continue;
        let gl = 0, gr = 0;
        for (const v of voix) {
          v.phase += v.f / sr;
          if (v.phase >= 1) v.phase -= 1;
          const s = v.phase * 2 - 1;
          gl += s * (1 - v.pan);
          gr += s * (1 + v.pan);
        }
        l1 += a * (gl - l1); l2 += a * (l1 - l2);
        r1 += a * (gr - r1); r2 += a * (r1 - r2);
        ajouter(c, i0 + k, l2 * g * env * 0.5, r2 * g * env * 0.5, 0.45);
      }
    },

    basse(c, e) {
      const { sr } = c;
      const f = freq(e.note);
      const i0 = Math.floor(e.t * sr);
      const n = Math.floor(e.d * sr);
      let phase = 0, lp = 0;
      const a = 1 - Math.exp(-DEUX_PI * 220 / sr);
      for (let k = 0; k < n; k++) {
        const x = k / sr;
        phase += f / sr;
        if (phase >= 1) phase -= 1;
        const s = Math.sin(DEUX_PI * phase) + 0.3 * (phase * 2 - 1);
        lp += a * (s - lp);
        const v = lp * enveloppe(x, e.d, 0.03, 0.15) * e.gain;
        ajouter(c, i0 + k, v, v, 0);
      }
    },

    // Arpège en doubles croches, filtre qui s'ouvre au fil de la section.
    arp(c, e) {
      const { sr } = c;
      const motif = [0, 1, 2, 3, 2, 1, 3, 2];
      const notes = e.notes.map((n) => n + 12);
      const nb = Math.floor(e.d / e.pas + 1e-6);
      for (let k = 0; k < nb; k++) {
        const t = e.t + k * e.pas;
        const avance = k / Math.max(1, nb - 1);
        const coupe = e.c0 + (e.c1 - e.c0) * avance;
        const note = notes[motif[k % motif.length] % notes.length] + (k % 16 >= 8 ? 12 : 0);
        const f = freq(note);
        const i0 = Math.floor(t * sr);
        const n = Math.floor(0.22 * sr);
        let phase = 0, lp = 0;
        const a = 1 - Math.exp(-DEUX_PI * coupe / sr);
        const pan = k % 2 ? 0.45 : -0.45;
        for (let j = 0; j < n; j++) {
          const x = j / sr;
          phase += f / sr;
          if (phase >= 1) phase -= 1;
          const s = (phase * 2 - 1) * 0.6 + (phase < 0.5 ? 0.4 : -0.4);
          lp += a * (s - lp);
          const v = lp * Math.exp(-x / 0.07) * Math.min(1, x / 0.002) * e.gain;
          ajouter(c, i0 + j, v * (1 - pan), v * (1 + pan), 0.5);
        }
      }
    },
  };

  function ajouter(c, i, gauche, droite, envoi) {
    if (i < 0 || i >= c.n) return;
    c.L[i] += gauche;
    c.R[i] += droite;
    if (envoi) {
      c.envoiL[i] += gauche * envoi;
      c.envoiR[i] += droite * envoi;
    }
  }

  // Coup sourd (grosse caisse, battement de cœur).
  function cogner(c, t, gain, f0, f1, duree) {
    const { sr } = c;
    const i0 = Math.floor(t * sr);
    const n = Math.floor(duree * 1.6 * sr);
    let phase = 0;
    for (let k = 0; k < n; k++) {
      const x = k / sr;
      const f = f1 + (f0 - f1) * Math.exp(-x / 0.035);
      phase += DEUX_PI * f / sr;
      const env = Math.min(1, x / 0.002) * Math.exp(-x / (duree * 0.45));
      const v = Math.tanh(Math.sin(phase) * 1.5) * env * gain;
      ajouter(c, i0 + k, v, v, 0.04);
    }
  }

  // Note de cloche : quelques harmoniques qui s'éteignent.
  function grain(c, t, f, duree, gain, pan, envoi, harmoniques) {
    const { sr } = c;
    const h = harmoniques || [1, 0.2];
    const i0 = Math.floor(t * sr);
    const n = Math.floor(duree * sr);
    for (let k = 0; k < n; k++) {
      const x = k / sr;
      let s = 0;
      for (let j = 0; j < h.length; j++) s += h[j] * Math.sin(DEUX_PI * f * (j + 1) * x) * Math.exp(-x * (j + 1) * 1.5 / duree);
      const v = s * Math.min(1, x / 0.003) * Math.exp(-x * 3 / duree) * gain;
      ajouter(c, i0 + k, v * (1 - pan * 0.8), v * (1 + pan * 0.8), envoi);
    }
  }

  // Réverbération (type Freeverb) : quatre peignes et deux passe-tout.
  function reverberer(entree, sr, decal) {
    const echelle = sr / 44100;
    const peignes = [1116, 1188, 1277, 1356, 1422, 1557].map((l) => ({ buf: new Float32Array(Math.floor((l + decal) * echelle)), i: 0, f: 0 }));
    const passes = [556, 441, 341, 225].map((l) => ({ buf: new Float32Array(Math.floor((l + decal) * echelle)), i: 0 }));
    const sortie = new Float32Array(entree.length);
    const retour = 0.86, amorti = 0.25;
    for (let k = 0; k < entree.length; k++) {
      const x = entree[k] * 0.12;
      let s = 0;
      for (const p of peignes) {
        const y = p.buf[p.i];
        p.f = y * (1 - amorti) + p.f * amorti;
        p.buf[p.i] = x + p.f * retour;
        p.i = (p.i + 1) % p.buf.length;
        s += y;
      }
      for (const p of passes) {
        const y = p.buf[p.i];
        p.buf[p.i] = s + y * 0.5;
        p.i = (p.i + 1) % p.buf.length;
        s = y - s;
      }
      sortie[k] = s;
    }
    return sortie;
  }

  // Fabrique la bande-son complète d'une version (« longue » ou « courte »).
  function generer(nomVersion, sr) {
    sr = sr || 48000;
    const P = Partition.versions[nomVersion];
    const n = Math.ceil(P.duree * sr);
    const c = { sr, n, L: new Float32Array(n), R: new Float32Array(n), envoiL: new Float32Array(n), envoiR: new Float32Array(n) };
    for (const e of P.musique) {
      const instrument = INSTRUMENTS[e.i];
      if (!instrument) throw new Error('Instrument inconnu : ' + e.i);
      instrument(c, e);
    }
    const wetL = reverberer(c.envoiL, sr, 0);
    const wetR = reverberer(c.envoiR, sr, 23);
    for (let k = 0; k < n; k++) {
      c.L[k] += wetL[k];
      c.R[k] += wetR[k];
    }
    // Silences francs (le souffle coupé avant l'impact).
    const rampe = Math.floor(0.004 * sr);
    for (const [a, b] of P.silences || []) {
      const i0 = Math.floor(a * sr), i1 = Math.floor(b * sr);
      for (let k = Math.max(0, i0 - rampe); k < Math.min(n, i1); k++) {
        const g = k < i0 ? (i0 - k) / rampe : 0;
        c.L[k] *= g;
        c.R[k] *= g;
      }
    }
    // Maître : saturation douce, normalisation, fondu final.
    let crete = 0;
    for (let k = 0; k < n; k++) {
      c.L[k] = Math.tanh(c.L[k] * 1.1);
      c.R[k] = Math.tanh(c.R[k] * 1.1);
      crete = Math.max(crete, Math.abs(c.L[k]), Math.abs(c.R[k]));
    }
    const g = crete > 0 ? 0.89 / crete : 1;
    const fondu = Math.floor(0.6 * sr);
    for (let k = 0; k < n; k++) {
      const f = k > n - fondu ? (n - k) / fondu : 1;
      c.L[k] *= g * f;
      c.R[k] *= g * f;
    }
    return { sampleRate: sr, gauche: c.L, droite: c.R, duree: P.duree };
  }

  // Encode en WAV 16 bits stéréo (pour ffmpeg).
  function enWav(son) {
    const n = son.gauche.length;
    const tampon = new ArrayBuffer(44 + n * 4);
    const v = new DataView(tampon);
    const ecrire = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    ecrire(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); ecrire(8, 'WAVE');
    ecrire(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
    v.setUint32(24, son.sampleRate, true); v.setUint32(28, son.sampleRate * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true);
    ecrire(36, 'data'); v.setUint32(40, n * 4, true);
    for (let k = 0; k < n; k++) {
      v.setInt16(44 + k * 4, Math.max(-1, Math.min(1, son.gauche[k])) * 32767, true);
      v.setInt16(46 + k * 4, Math.max(-1, Math.min(1, son.droite[k])) * 32767, true);
    }
    return tampon;
  }

  return { generer, enWav };
});
