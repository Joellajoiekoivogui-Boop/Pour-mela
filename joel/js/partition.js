// La partition du film : tous les instants clés, partagés par l'image
// (film.js) et le son (bande-son.js). Changer un temps ici le change partout,
// pour que chaque mot, chaque impact et chaque whoosh restent synchronisés.
(function (racine, fabrique) {
  const api = fabrique();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else racine.JoelPartition = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Accords (notes MIDI) : la basse, puis les voix du pad.
  const ACCORDS = {
    Dm: [38, 50, 53, 57, 62],
    D: [38, 50, 54, 57, 62],
    Bb: [34, 50, 53, 58, 62],
    F: [41, 48, 53, 57, 60],
    C: [36, 48, 52, 55, 60],
    Gm: [43, 50, 55, 58, 62],
    A: [33, 49, 52, 57, 61],
    Bm: [35, 50, 54, 59, 62],
    G: [43, 50, 55, 59, 62],
    Em: [40, 52, 55, 59, 64],
  };

  // Le compteur de la scène 2 : les nombres défilent de plus en plus vite.
  function compteur(debut, fin) {
    const temps = [];
    let t = debut;
    let pas = 0.42;
    while (t < fin - 0.03) {
      temps.push(Math.round(t * 1000) / 1000);
      t += pas;
      pas = Math.max(0.045, pas * 0.86);
    }
    return temps;
  }

  // ---------------------------------------------------------------- 90 s
  const longue = {
    nom: 'longue',
    duree: 90,
    compteur: compteur(8.6, 14.6),
    battements: [1.6, 2.75, 3.85, 4.9, 5.9, 6.6],
    silences: [[14.6, 15.0], [79.6, 80.0]],
    // Le parcours : 4 mots, chacun avec son univers.
    parcours: [
      { mot: 'APPRENDRE', t: 35.0, theme: 'code' },
      { mot: 'CRÉER', t: 38.25, theme: 'formes' },
      { mot: 'INNOVER', t: 41.5, theme: 'circuits' },
      { mot: 'TRANSMETTRE', t: 44.75, theme: 'reseau' },
    ],
    // Les rêves : 5 mots faits de particules.
    reves: [
      { mot: 'RÊVER', t: 48.0 },
      { mot: 'APPRENDRE', t: 50.0 },
      { mot: 'CRÉER', t: 52.0 },
      { mot: 'CONSTRUIRE', t: 54.0 },
      { mot: 'IMPACTER', t: 56.0 },
    ],
    // Le message, mot par mot.
    message: [
      { texte: 'Une année de plus…', t: 58.6, fin: 61.9 },
      { texte: 'Ce n’est pas seulement une année qui passe.', t: 62.3, fin: 65.9 },
      { texte: 'C’est une nouvelle page qui commence.', t: 66.3, fin: 69.7 },
    ],
    // Les secousses de caméra (impacts visuels).
    secousses: [[15.3, 1], [17.0, 0.4], [31.0, 0.5], [35.0, 0.35], [38.25, 0.35], [41.5, 0.35], [44.75, 0.35], [80.0, 1.2], [81.4, 0.3], [82.4, 0.3]],
    // Vitesse de la caméra dans l'espace (pour le champ d'étoiles).
    vitesse: [
      [0, 0.12], [6.5, 0.25], [7.2, 0.9], [12, 1.8], [14.6, 3.2], [14.61, 0], [15, 0.15],
      [25, 0.22], [35, 0.5], [48, 0.8], [58, 0.12], [70, 0.5], [74, 2.2], [77, 6], [79.6, 14],
      [79.61, 0.1], [80, 0.35], [90, 0.2],
    ],
  };

  // ---------------------------------------------------------------- 15 s
  const courte = {
    nom: 'courte',
    duree: 15,
    silences: [[11.9, 12.0]],
    secousses: [[0.15, 1], [3.0, 0.5], [6.0, 0.6], [9.0, 0.9], [12.0, 1.3]],
    vitesse: [[0, 0.3], [2.8, 1.2], [3.0, 0.3], [5.8, 1.6], [6.0, 0.3], [8.6, 2], [9, 0.4], [11.9, 8], [12, 0.25], [15, 0.15]],
  };

  // ------------------------------------------------------------ la musique
  // Chaque entrée : { i: instrument, t: début (s), ...réglages }.
  function musiqueLongue() {
    const m = [];
    const P = longue;
    const pad = (t, d, accord, gain, coupe, att, rel) =>
      m.push({ i: 'pad', t, d, notes: ACCORDS[accord].slice(1), gain, coupe, att: att || 1.2, rel: rel || 1.5 });
    const basse = (t, d, accord, gain) => m.push({ i: 'basse', t, d, note: ACCORDS[accord][0], gain });
    const arp = (t, d, accord, gain, c0, c1, pas) =>
      m.push({ i: 'arp', t, d, notes: ACCORDS[accord].slice(1), gain, c0, c1, pas: pas || 0.125 });
    const kicks = (a, b, pas, gain) => { for (let t = a; t < b - 0.01; t += pas) m.push({ i: 'kick', t, gain }); };
    const hats = (a, b, pas, gain, decal) => { for (let t = a + (decal || 0); t < b - 0.01; t += pas) m.push({ i: 'hat', t, gain }); };

    // 01 — l'obscurité : souffle, vibration basse, battement.
    m.push({ i: 'drone', t: 0, d: 14.6, f: 36.71, gain: 0.2, att: 4 });
    m.push({ i: 'souffle', t: 0, d: 14.6, gain: 0.05, att: 3 });
    m.push({ i: 'texture', t: 0.5, d: 6.5, gain: 0.05 });
    for (const t of P.battements) m.push({ i: 'battement', t, gain: 0.45 });
    m.push({ i: 'riser', t: 5.4, d: 1.6, gain: 0.12 });

    // 02 — le temps.
    m.push({ i: 'impact', t: 7.0, gain: 0.55 });
    m.push({ i: 'eclats', t: 7.0, d: 1.6, gain: 0.12, densite: 18 });
    pad(7.0, 4.2, 'Dm', 0.16, 900, 2.0, 0.4);
    pad(11.0, 3.6, 'Bb', 0.18, 1700, 0.6, 0.02);
    basse(7.0, 4.0, 'Dm', 0.22);
    basse(11.0, 3.6, 'Bb', 0.24);
    arp(9.0, 2.0, 'Dm', 0.08, 500, 1500);
    arp(11.0, 3.6, 'Bb', 0.1, 1500, 5000, 0.0625);
    kicks(11.0, 14.6, 0.5, 0.35);
    for (const t of P.compteur) m.push({ i: 'pulse', t, gain: 0.07, f: 1320 });
    m.push({ i: 'riser', t: 11.4, d: 3.2, gain: 0.2 });

    // 03 — 10 octobre.
    m.push({ i: 'coupBasse', t: 15.3, gain: 1 });
    m.push({ i: 'impact', t: 15.3, gain: 0.7 });
    pad(15.3, 4.9, 'Dm', 0.13, 700, 2.5, 1.0);
    basse(15.3, 9.7, 'Dm', 0.2);
    m.push({ i: 'impact', t: 17.0, gain: 0.4 });
    m.push({ i: 'whoosh', t: 18.6, d: 1.4, gain: 0.18 });
    kicks(19.0, 24.9, 1.0, 0.28);
    pad(20.0, 5.2, 'Bb', 0.14, 900, 2.0, 1.2);
    m.push({ i: 'pulse', t: 22.0, gain: 0.12, f: 880 });
    m.push({ i: 'pulse', t: 22.12, gain: 0.1, f: 1320 });
    m.push({ i: 'eclats', t: 22.0, d: 1.2, gain: 0.08, densite: 10 });

    // 04 — révélation.
    m.push({ i: 'eclats', t: 25.0, d: 3.4, gain: 0.1, densite: 12 });
    m.push({ i: 'whoosh', t: 24.7, d: 1.6, gain: 0.15 });
    pad(25.0, 4.2, 'F', 0.13, 1100, 1.5, 1.0);
    basse(25.0, 4.0, 'F', 0.18);
    pad(29.0, 2.2, 'C', 0.14, 1300, 1.0, 0.6);
    basse(29.0, 2.0, 'C', 0.2);
    m.push({ i: 'whoosh', t: 28.4, d: 1.3, gain: 0.16 });
    m.push({ i: 'riser', t: 29.0, d: 2.0, gain: 0.16 });
    m.push({ i: 'impact', t: 31.0, gain: 0.75 });
    m.push({ i: 'coupBasse', t: 31.0, gain: 0.6 });
    m.push({ i: 'eclats', t: 31.2, d: 1.5, gain: 0.12, densite: 16 });
    pad(31.0, 4.4, 'Dm', 0.15, 1400, 0.2, 1.2);
    basse(31.0, 4.0, 'Dm', 0.2);
    m.push({ i: 'riser', t: 33.4, d: 1.6, gain: 0.14 });

    // 05 — le parcours : rythme, pulsations.
    const accordsParcours = ['Dm', 'Bb', 'F', 'C'];
    P.parcours.forEach((p, k) => {
      const d = k < 3 ? P.parcours[k + 1].t - p.t : 48 - p.t;
      m.push({ i: 'impact', t: p.t, gain: 0.55 });
      m.push({ i: 'whoosh', t: p.t - 0.35, d: 0.6, gain: 0.2 });
      m.push({ i: 'glitch', t: p.t, gain: 0.08 });
      pad(p.t, d + 0.3, accordsParcours[k], 0.12, 1600, 0.15, 0.3);
      basse(p.t, d, accordsParcours[k], 0.22);
      arp(p.t, d, accordsParcours[k], 0.09, 1200 + k * 700, 2400 + k * 900);
    });
    kicks(35.0, 47.9, 0.5, 0.72);
    hats(35.0, 47.9, 0.5, 0.06, 0.25);
    hats(41.5, 47.9, 0.125, 0.025);
    for (let t = 36.0; t < 47.9; t += 1.0) m.push({ i: 'clap', t, gain: 0.16 });
    m.push({ i: 'riser', t: 46.4, d: 1.6, gain: 0.18 });

    // 06 — les rêves : plus émotionnel.
    const accordsReves = ['Bb', 'F', 'C', 'Dm', 'Bb'];
    // Une petite mélodie de cloches, une phrase par mot.
    const melodie = [
      [[74, 0], [72, 0.75], [69, 1.25]],
      [[77, 0], [76, 0.75], [72, 1.25]],
      [[76, 0], [74, 0.75], [72, 1.25]],
      [[74, 0], [69, 1.0]],
      [[74, 0], [72, 0.75], [70, 1.25]],
    ];
    P.reves.forEach((r, k) => {
      pad(r.t, 2.3, accordsReves[k], 0.16, 2000, 0.4, 0.6);
      basse(r.t, 2.0, accordsReves[k], 0.2);
      m.push({ i: 'eclats', t: r.t, d: 1.0, gain: 0.08, densite: 10 });
      m.push({ i: 'whoosh', t: r.t + 1.45, d: 0.7, gain: 0.1 });
      m.push({ i: 'kick', t: r.t, gain: 0.5 });
      m.push({ i: 'kick', t: r.t + 1.0, gain: 0.3 });
      for (const [note, dec] of melodie[k]) m.push({ i: 'cloche', t: r.t + dec, f: note, gain: 0.13, d: 2.4 });
    });

    // 07 — le message : calme.
    m.push({ i: 'battement', t: 58.25, gain: 0.3 });
    pad(58.2, 4.4, 'Dm', 0.15, 700, 2.5, 1.5);
    pad(62.2, 4.4, 'Bb', 0.15, 800, 1.5, 1.5);
    pad(66.2, 2.2, 'F', 0.15, 900, 1.0, 0.6);
    pad(68.0, 2.4, 'C', 0.16, 1000, 0.8, 0.4);
    basse(58.2, 11.8, 'Dm', 0.08);
    P.message.forEach((p) => {
      m.push({ i: 'cloche', t: p.t, f: 69, gain: 0.08, d: 3.5 });
      m.push({ i: 'cloche', t: p.t + 0.02, f: 74, gain: 0.06, d: 3.5 });
    });
    m.push({ i: 'cloche', t: 64.0, f: 77, gain: 0.05, d: 3 });
    m.push({ i: 'cloche', t: 68.0, f: 76, gain: 0.05, d: 3 });

    // 08 — montée finale.
    const montee = [['Gm', 70, 72], ['Bb', 72, 74], ['C', 74, 76], ['A', 76, 79.6]];
    for (const [a, d0, d1] of montee) {
      pad(d0, d1 - d0 + (d1 === 79.6 ? 0 : 0.2), a, 0.15, 1200 + (d0 - 70) * 300, 0.4, d1 === 79.6 ? 0.01 : 0.2);
      basse(d0, d1 - d0, a, 0.22);
      arp(d0, d1 - d0, a, 0.09, 1500 + (d0 - 70) * 400, 2500 + (d0 - 70) * 600, d0 >= 74 ? 0.0625 : 0.125);
    }
    kicks(70.0, 79.55, 0.5, 0.65);
    hats(72.0, 79.55, 0.5, 0.06, 0.25);
    hats(74.0, 79.55, 0.125, 0.03);
    let pasCaisse = 0.25;
    for (let t = 76.0; t < 79.55; t += pasCaisse) {
      m.push({ i: 'clap', t, gain: 0.08 + 0.1 * ((t - 76) / 3.6) });
      if (t > 77.6) pasCaisse = Math.max(0.0625, pasCaisse * 0.82);
    }
    m.push({ i: 'riser', t: 73.6, d: 6.0, gain: 0.45 });
    m.push({ i: 'whoosh', t: 72.8, d: 1.6, gain: 0.14 });
    m.push({ i: 'whoosh', t: 75.8, d: 1.4, gain: 0.16 });

    // 09 — joyeux anniversaire.
    m.push({ i: 'coupBasse', t: 80.0, gain: 1.1 });
    m.push({ i: 'impact', t: 80.0, gain: 1.0 });
    m.push({ i: 'eclats', t: 80.0, d: 4.0, gain: 0.16, densite: 30 });
    const fin = [['D', 80, 82.4], ['Bb', 82.4, 84.8], ['C', 84.8, 87], ['D', 87, 90]];
    for (const [a, d0, d1] of fin) {
      pad(d0, d1 - d0 + 0.25, a, d0 === 87 ? 0.15 : 0.18, 2400, d0 === 80 ? 0.05 : 0.3, d0 === 87 ? 2.5 : 0.4);
      basse(d0, d1 - d0, a, 0.22);
      if (d0 < 87) arp(d0, d1 - d0, a, 0.08, 2500, 4500);
    }
    kicks(80.0, 86.9, 0.5, 0.6);
    hats(80.0, 86.9, 0.5, 0.06, 0.25);
    for (let t = 81.0; t < 86.9; t += 1.0) m.push({ i: 'clap', t, gain: 0.14 });
    for (const t of [80.4, 81.4, 82.4]) m.push({ i: 'impact', t, gain: 0.35 });
    m.push({ i: 'whoosh', t: 83.1, d: 0.9, gain: 0.16 });
    m.push({ i: 'impact', t: 84.8, gain: 0.45 });
    m.push({ i: 'impact', t: 85.6, gain: 0.5 });
    m.push({ i: 'cloche', t: 87.0, f: 74, gain: 0.12, d: 4 });
    m.push({ i: 'cloche', t: 87.0, f: 78, gain: 0.09, d: 4 });
    m.push({ i: 'cloche', t: 87.0, f: 81, gain: 0.08, d: 4 });
    m.push({ i: 'cloche', t: 89.1, f: 86, gain: 0.07, d: 3 });
    m.push({ i: 'eclats', t: 89.1, d: 0.8, gain: 0.05, densite: 6 });
    return m;
  }

  function musiqueCourte() {
    const m = [];
    const pad = (t, d, a, gain, coupe, att, rel) => m.push({ i: 'pad', t, d, notes: ACCORDS[a].slice(1), gain, coupe, att, rel });
    const basse = (t, d, a, gain) => m.push({ i: 'basse', t, d, note: ACCORDS[a][0], gain });
    const arp = (t, d, a, gain, c0, c1, pas) => m.push({ i: 'arp', t, d, notes: ACCORDS[a].slice(1), gain, c0, c1, pas: pas || 0.125 });

    m.push({ i: 'coupBasse', t: 0.15, gain: 1 });
    m.push({ i: 'impact', t: 0.15, gain: 0.7 });
    m.push({ i: 'drone', t: 0, d: 3.2, f: 36.71, gain: 0.25, att: 0.1 });
    pad(0.15, 3.0, 'Dm', 0.13, 800, 0.8, 0.3);
    m.push({ i: 'riser', t: 1.6, d: 1.4, gain: 0.18 });

    m.push({ i: 'impact', t: 3.0, gain: 0.6 });
    m.push({ i: 'whoosh', t: 2.7, d: 0.6, gain: 0.18 });
    pad(3.0, 3.1, 'Bb', 0.14, 1300, 0.2, 0.3);
    basse(3.0, 3.0, 'Bb', 0.2);
    arp(3.0, 3.0, 'Bb', 0.08, 1200, 2600);
    for (let t = 3.0; t < 5.95; t += 0.5) m.push({ i: 'kick', t, gain: 0.5 });

    m.push({ i: 'impact', t: 6.0, gain: 0.7 });
    m.push({ i: 'whoosh', t: 5.6, d: 0.7, gain: 0.2 });
    m.push({ i: 'eclats', t: 6.0, d: 1.6, gain: 0.12, densite: 16 });
    pad(6.0, 3.1, 'F', 0.15, 1800, 0.2, 0.3);
    basse(6.0, 3.0, 'F', 0.22);
    arp(6.0, 3.0, 'F', 0.09, 1800, 3500);
    for (let t = 6.0; t < 8.95; t += 0.5) m.push({ i: 'kick', t, gain: 0.6 });
    for (let t = 6.25; t < 8.95; t += 0.5) m.push({ i: 'hat', t, gain: 0.05 });

    m.push({ i: 'coupBasse', t: 9.0, gain: 0.8 });
    m.push({ i: 'impact', t: 9.0, gain: 0.85 });
    m.push({ i: 'eclats', t: 9.0, d: 2.5, gain: 0.15, densite: 26 });
    pad(9.0, 2.95, 'C', 0.16, 2400, 0.1, 0.02);
    basse(9.0, 2.9, 'C', 0.22);
    arp(9.0, 2.9, 'C', 0.09, 2500, 5000, 0.0625);
    for (let t = 9.0; t < 11.85; t += 0.5) m.push({ i: 'kick', t, gain: 0.6 });
    for (let t = 9.0; t < 11.85; t += 0.125) m.push({ i: 'hat', t, gain: 0.03 });
    m.push({ i: 'riser', t: 10.2, d: 1.7, gain: 0.3 });

    m.push({ i: 'coupBasse', t: 12.0, gain: 1.2 });
    m.push({ i: 'impact', t: 12.0, gain: 1.0 });
    m.push({ i: 'eclats', t: 12.0, d: 2.4, gain: 0.14, densite: 22 });
    pad(12.0, 3.0, 'D', 0.18, 2400, 0.05, 2.0);
    basse(12.0, 3.0, 'D', 0.22);
    m.push({ i: 'cloche', t: 12.0, f: 74, gain: 0.12, d: 3 });
    m.push({ i: 'cloche', t: 12.0, f: 78, gain: 0.09, d: 3 });
    m.push({ i: 'cloche', t: 12.0, f: 81, gain: 0.08, d: 3 });
    return m;
  }

  // ======================================================= LA PUBLICITÉ
  // « Joyeux anniversaire Joël » façon publicité de marque (≈ 3 min 54).
  // plans   : les textes (typographie animée), listes et piles de phrases ;
  // decors  : gâteau, bougies, ballons, cadeaux, projecteurs, affiches… ;
  // fonds   : l'ambiance de chaque partie ; transitions : flash, whip, zoom.
  // Photos : indices dans la liste de config.js
  //   0 rue (casque) · 1 {fata} · 2 R-CUN · 3 remise du prix · 4 chemise à motifs
  const T = (t, fin, texte, o) => Object.assign({ type: 'texte', t, fin, texte }, o || {});
  const pub = {
    nom: 'pub',
    duree: 234,
    silences: [[151.8, 152.0], [202.3, 202.6]],
    secousses: [[23.2, 0.6], [26.4, 0.5], [41.9, 0.4], [47.8, 0.9], [82.0, 0.7], [98.8, 0.5], [141.6, 0.7], [152.0, 1.3],
      [173.0, 0.6], [193.8, 0.5], [196.0, 0.5], [198.2, 0.5], [200.3, 0.6], [202.6, 1.0], [213.6, 0.9]],
    vitesse: [[0, 0.15], [22, 0.5], [23.2, 0.2], [82, 0.6], [128.4, 0.1], [145.8, 0.6], [151.8, 4], [152, 0.4], [190.8, 0.15], [217.6, 0.2], [234, 0.15]],
    fonds: [
      [0, 26.3, 'nuit'], [26.3, 29.3, 'alerte'], [29.3, 54.3, 'scene'], [54.3, 82.0, 'lumiere'], [82.0, 102.7, 'fete'],
      [102.7, 128.4, 'lumiere'], [128.4, 139.0, 'sombre'], [139.0, 151.8, 'lumiere'], [151.8, 152.0, 'blanc'],
      [152.0, 190.6, 'fete'], [190.6, 217.5, 'cine'], [217.5, 234, 'fete'],
    ],
    transitions: [
      [23.2, 'flash'], [26.4, 'whip'], [29.4, 'zoom'], [38.4, 'whip'], [41.8, 'flash'], [47.8, 'flash'], [51.0, 'whip'],
      [54.4, 'zoom'], [66.6, 'zoom'], [82.0, 'flash'], [98.8, 'flash'], [102.8, 'zoom'], [128.6, 'zoom'], [141.6, 'flash'],
      [152.0, 'flash'], [157.6, 'whip'], [168.0, 'zoom'], [173.0, 'flash'], [185.0, 'zoom'], [190.8, 'whip'],
      [193.8, 'flash'], [196.0, 'flash'], [198.2, 'flash'], [200.3, 'flash'], [202.6, 'flash'], [206.2, 'whip'],
      [210.2, 'flash'], [211.0, 'flash'], [211.8, 'flash'], [212.6, 'flash'], [213.6, 'flash'], [217.6, 'zoom'],
    ],
    plans: [
      // 1 — INTRODUCTION
      T(2.4, 6.4, 'AUJOURD’HUI', { style: 'revele', taille: 'xl', y: -0.07, emojis: ['✨', '✨'], lueur: true }),
      T(3.5, 6.4, 'N’EST PAS UN JOUR COMME LES AUTRES…', { style: 'mots', taille: 'm', poids: 300, y: 0.07, yP: 0.06 }),
      T(6.8, 10.4, 'Une date particulière vient de s’inscrire dans le calendrier.', { style: 'glisse', taille: 'm', poids: 300, y: 0.33, yP: 0.22 }),
      T(10.8, 13.8, 'Une journée où l’on célèbre bien plus qu’une année de plus…', { style: 'masque', taille: 'm', poids: 300 }),
      T(14.0, 18.3, 'Une journée où l’on célèbre une personne,', { style: 'mots', taille: 'm', poids: 300, y: -0.14, yP: -0.1 }),
      T(15.9, 16.5, 'son parcours,', { style: 'punch', taille: 'l', y: 0.04, sortie: 'coupe', son: 'pop' }),
      T(16.5, 17.1, 'ses rêves,', { style: 'punch', taille: 'l', y: 0.04, sortie: 'coupe', son: 'pop' }),
      T(17.1, 17.7, 'ses combats,', { style: 'punch', taille: 'l', y: 0.04, sortie: 'coupe', son: 'pop' }),
      T(17.7, 18.3, 'ses réussites', { style: 'punch', taille: 'l', y: 0.04, sortie: 'coupe', son: 'pop', accent: '*' }),
      T(18.4, 19.9, 'et surtout…', { style: 'revele', taille: 'm', poids: 300 }),
      T(20.1, 23.0, '…tout ce qui reste encore à accomplir.', { style: 'revele', taille: 'l', accent: ['accomplir.'] }),
      T(23.2, 26.2, 'JOYEUX ANNIVERSAIRE !', { style: 'punch', taille: 'xl', accent: '*', emojis: ['🎉', '🎉'], rayons: true }),

      // 2 — L'ANNONCE
      T(26.4, 29.2, 'ÉVÉNEMENT EXCEPTIONNEL', { style: 'punch', taille: 'l', emojis: ['🚨', '🚨'], accent: '*' }),
      T(29.4, 32.6, 'Aujourd’hui, les projecteurs sont allumés.', { style: 'mots', taille: 'm', y: 0.3, yP: 0.24 }),
      T(32.8, 35.4, 'Les sourires sont au rendez-vous.', { style: 'glisse', taille: 'l', accent: ['sourires'] }),
      T(35.6, 38.2, 'Les bougies sont prêtes.', { style: 'revele', taille: 'l', y: -0.3, yP: -0.26, emoji: '🕯️' }),
      T(38.4, 41.6, 'Le gâteau est servi.', { style: 'punch', taille: 'l', y: -0.33, yP: -0.3, emoji: '🎂', accent: ['gâteau'] }),
      T(41.8, 44.6, 'Les confettis sont dans les airs.', { style: 'mots', taille: 'l', emoji: '🎊' }),
      T(44.8, 47.6, 'Et une seule personne est à l’honneur…', { style: 'masque', taille: 'm', y: 0.3, yP: 0.24 }),

      // 3 — LE MESSAGE
      T(54.4, 57.0, 'Une nouvelle année commence.', { style: 'revele', taille: 'l' }),
      T(57.2, 59.8, 'Une nouvelle page s’ouvre.', { style: 'masque', taille: 'l', y: 0.3, yP: 0.22, accent: ['page'] }),
      { type: 'pile', t: 60.0, fin: 66.4, taille: 'm', items: [
        { t: 60.0, texte: 'De nouveaux projets arrivent.', accent: ['projets'] },
        { t: 62.0, texte: 'De nouveaux défis attendent.', accent: ['défis'] },
        { t: 64.0, texte: 'De nouvelles opportunités se présentent.', accent: ['opportunités'] },
      ] },
      T(66.6, 72.2, 'Et derrière chaque nouvelle année se cache une nouvelle possibilité de devenir une version encore meilleure de soi-même.', { style: 'mots', taille: 'm', poids: 300, accent: ['meilleure'], largeur: 0.74 }),
      T(72.4, 77.0, 'Aujourd’hui, prends simplement le temps de regarder le chemin parcouru…', { style: 'revele', taille: 'm', poids: 300, y: -0.34, yP: -0.34, accent: ['chemin', 'parcouru…'] }),
      T(77.2, 81.6, 'Et sois fier de tout ce que tu as déjà accompli.', { style: 'mots', taille: 'l', accent: ['fier'], emoji: '❤️' }),

      // 4 — CÉLÉBRATION
      T(82.0, 85.0, 'UNE ANNÉE DE PLUS !', { style: 'punch', taille: 'xl', accent: '*', emoji: '🎈' }),
      { type: 'liste', t: 85.2, fin: 96.6, entete: 'UNE ANNÉE', items: [
        { t: 85.2, mot: 'DE DÉCOUVERTES', photo: 0 },
        { t: 86.8, mot: 'D’APPRENTISSAGE', photo: 1 },
        { t: 88.4, mot: 'DE RENCONTRES', photo: 3 },
        { t: 90.0, mot: 'DE PROJETS', photo: 2 },
        { t: 91.6, mot: 'DE MOMENTS INOUBLIABLES', photo: 4 },
        { t: 93.2, mot: 'DE DÉFIS SURMONTÉS', emoji: '💪' },
        { t: 94.8, mot: 'QUI A LAISSÉ SON EMPREINTE', emoji: '✨' },
      ] },
      T(96.8, 98.6, 'Et maintenant…', { style: 'revele', taille: 'l', poids: 300 }),
      T(98.8, 102.6, 'Place à une nouvelle aventure !', { style: 'punch', taille: 'l', accent: ['aventure', '!'], emoji: '🥂' }),

      // 5 — LES VŒUX
      T(102.8, 106.4, 'Que cette nouvelle année de ta vie soit remplie de bonheur.', { style: 'mots', taille: 'm', accent: ['bonheur.'], emoji: '❤️' }),
      T(106.95, 108.6, 'Que tes projets prennent forme.', { style: 'revele', taille: 'm', y: -0.24, yP: -0.2, accent: ['projets'] }),
      T(109.15, 110.8, 'Que tes efforts portent leurs fruits.', { style: 'revele', taille: 'm', y: -0.24, yP: -0.2, accent: ['efforts'] }),
      T(111.35, 113.0, 'Que les opportunités viennent à toi.', { style: 'revele', taille: 'm', y: -0.24, yP: -0.2, accent: ['opportunités'] }),
      T(113.55, 115.2, 'Que chaque difficulté te rende plus fort.', { style: 'revele', taille: 'm', y: -0.24, yP: -0.2, accent: ['fort.'] }),
      T(115.75, 118.0, 'Que chaque réussite te donne encore plus de motivation.', { style: 'revele', taille: 'm', y: -0.24, yP: -0.2, accent: ['motivation.'] }),
      T(118.2, 121.6, 'Que tu continues à apprendre, à créer, à rêver et à avancer.', { style: 'mots', taille: 'm', accent: ['apprendre,', 'créer,', 'rêver', 'avancer.'], y: 0.06 }),
      T(121.8, 123.2, 'Et surtout…', { style: 'revele', taille: 'l', poids: 300 }),
      T(123.4, 128.2, 'Que tu n’oublies jamais la personne que tu es devenue et celle que tu veux devenir.', { style: 'mots', taille: 'm', accent: ['devenue', 'devenir.'], emojis: ['✨', '✨'], largeur: 0.72 }),

      // 6 — MOMENT ÉMOTIONNEL
      T(128.6, 131.4, 'Il y aura sûrement encore des obstacles.', { style: 'glisse', taille: 'm', poids: 300 }),
      T(131.6, 133.6, 'Des journées difficiles.', { style: 'revele', taille: 'l', poids: 300 }),
      T(133.8, 135.8, 'Des moments de doute.', { style: 'revele', taille: 'l', poids: 300 }),
      T(136.0, 138.8, 'Des choses qui ne se passeront pas comme prévu.', { style: 'machine', taille: 'm', poids: 300, glitch: true }),
      T(139.0, 141.4, 'Mais souviens-toi d’une chose :', { style: 'masque', taille: 'm' }),
      T(141.6, 145.6, 'TON HISTOIRE NE FAIT QUE COMMENCER.', { style: 'punch', taille: 'l', accent: '*', emojis: ['🌟', '🌟'], rayons: true }),
      { type: 'pile', t: 145.8, fin: 151.6, taille: 'm', items: [
        { t: 145.8, texte: 'Il reste encore tellement de choses à découvrir.', accent: ['découvrir.'] },
        { t: 147.6, texte: 'Tellement de projets à réaliser.', accent: ['projets'] },
        { t: 149.4, texte: 'Tellement de rêves à transformer en réalité.', accent: ['rêves'] },
      ] },

      // 7 — LE GRAND MOMENT
      { type: 'grandTitre', t: 152.0, fin: 157.4 },
      T(157.6, 160.0, 'Aujourd’hui, on célèbre ton existence.', { style: 'mots', taille: 'l', accent: ['existence.'] }),
      { type: 'liste', t: 160.2, fin: 166.2, entete: 'ON CÉLÈBRE', items: [
        { t: 160.2, mot: 'TON PARCOURS', photo: 0 },
        { t: 161.7, mot: 'TES AMBITIONS', photo: 2 },
        { t: 163.2, mot: 'TON ÉNERGIE', photo: 3 },
        { t: 164.7, mot: 'TES RÊVES', photo: 1 },
      ] },
      T(166.4, 167.8, 'Et surtout…', { style: 'revele', taille: 'l', poids: 300 }),
      T(168.0, 172.8, 'On célèbre la personne exceptionnelle que tu continues de devenir.', { style: 'mots', taille: 'l', accent: ['exceptionnelle'], largeur: 0.8 }),

      // 8 — MESSAGE FINAL
      T(173.0, 175.6, 'QUE LA NOUVELLE ANNÉE COMMENCE !', { style: 'punch', taille: 'l', accent: '*', emojis: ['🎉', '🎉'] }),
      { type: 'liste', t: 175.8, fin: 183.0, entete: 'PLUS DE', items: [
        { t: 175.8, mot: 'RÊVES', emoji: '💭' },
        { t: 176.8, mot: 'PROJETS', emoji: '🚀' },
        { t: 177.8, mot: 'RÉUSSITES', emoji: '🏆' },
        { t: 178.8, mot: 'DÉCOUVERTES', emoji: '🔭' },
        { t: 179.8, mot: 'SOURIRES', emoji: '😊' },
        { t: 180.8, mot: 'BELLES RENCONTRES', emoji: '🤝' },
        { t: 181.8, mot: 'MOMENTS INOUBLIABLES', emoji: '📸' },
      ] },
      T(183.2, 184.8, 'Et surtout…', { style: 'revele', taille: 'l', poids: 300 }),
      T(185.0, 190.4, 'PLUS DE RAISONS DE DIRE MERCI À LA VIE.', { style: 'revele', taille: 'l', accent: ['MERCI'], emojis: ['✨', '✨'], rayons: true, largeur: 0.8 }),

      // 9 — FIN PUBLICITAIRE
      T(190.8, 193.6, 'MESSAGE OFFICIEL', { style: 'machine', taille: 'l', emojis: ['🚨', '🚨'] }),
      T(193.8, 195.9, 'Après plusieurs mois de préparation…', { style: 'zoom', taille: 'l', poids: 300 }),
      T(196.0, 198.1, 'Après plusieurs années d’expérience…', { style: 'zoom', taille: 'l', poids: 300 }),
      T(198.2, 200.2, 'Après de nombreux projets…', { style: 'zoom', taille: 'l', poids: 300 }),
      T(200.3, 202.3, 'Après d’innombrables aventures…', { style: 'zoom', taille: 'l', poids: 300, sortie: 'coupe' }),
      T(202.6, 206.0, 'UNE NOUVELLE SAISON VIENT DE COMMENCER.', { style: 'punch', taille: 'l', accent: ['SAISON'], emoji: '🎂' }),
      T(210.2, 211.0, 'Nouvelle énergie.', { style: 'punch', taille: 'l', sortie: 'coupe', son: 'aucun' }),
      T(211.0, 211.8, 'Nouveaux objectifs.', { style: 'punch', taille: 'l', sortie: 'coupe', son: 'aucun' }),
      T(211.8, 212.6, 'Nouveaux rêves.', { style: 'punch', taille: 'l', sortie: 'coupe', son: 'aucun' }),
      T(212.6, 213.4, 'Nouvelle histoire.', { style: 'punch', taille: 'l', sortie: 'coupe', son: 'aucun', accent: '*' }),
      T(213.6, 217.4, 'LE MEILLEUR RESTE À VENIR.', { style: 'punch', taille: 'xl', accent: '*', emojis: ['🔥', '🔥'], rayons: true }),

      // ÉCRAN FINAL
      { type: 'final', t: 217.6, fin: 234 },
    ],
    decors: [
      { type: 'calendrier', t: 6.8, fin: 10.4 },
      { type: 'feux', t: 23.3, x: 0.25, y: 0.3 }, { type: 'feux', t: 23.6, x: 0.75, y: 0.28 },
      { type: 'canons', t: 23.2, nombre: 160 },
      { type: 'badge', t: 26.4, fin: 29.2 },
      { type: 'projecteurs', t: 29.4, fin: 51.0, converge: 44.8 },
      { type: 'nuee', t: 32.8, fin: 35.4, liste: ['😊', '🥳', '😄', '😁', '🤩', '😊'] },
      { type: 'bougies', t: 35.6, fin: 38.4, allume: 36.4 },
      { type: 'gateau', t: 38.4, fin: 41.8, allume: 39.2, y: 0.18, yP: 0.16, echelle: 1 },
      { type: 'canons', t: 41.9, nombre: 320 },
      { type: 'serpentins', t: 41.8, fin: 45.2 },
      { type: 'titreJoel', t: 47.8, fin: 51.0 },
      { type: 'affiche', t: 51.0, fin: 54.3, photo: 4, titre: 'JOËL', sous: 'À l’honneur aujourd’hui', etiquette: 'ÉDITION SPÉCIALE', badge: '10.10' },
      { type: 'page', t: 57.2, fin: 59.8 },
      { type: 'chemin', t: 72.4, fin: 77.2 },
      { type: 'coeurs', t: 77.2, fin: 81.6 },
      { type: 'ballons', t: 82.0, fin: 104.0, nombre: 26 },
      { type: 'canons', t: 82.0, nombre: 220 },
      { type: 'feux', t: 98.9, x: 0.2, y: 0.25 }, { type: 'feux', t: 99.5, x: 0.8, y: 0.22 }, { type: 'feux', t: 100.2, x: 0.5, y: 0.15 },
      { type: 'coeurs', t: 102.8, fin: 106.4 },
      { type: 'cadeau', t: 106.6, fin: 108.75, ouvre: 106.95, couleur: 0 },
      { type: 'cadeau', t: 108.8, fin: 110.95, ouvre: 109.15, couleur: 1 },
      { type: 'cadeau', t: 111.0, fin: 113.15, ouvre: 111.35, couleur: 2 },
      { type: 'cadeau', t: 113.2, fin: 115.35, ouvre: 113.55, couleur: 3 },
      { type: 'cadeau', t: 115.4, fin: 118.1, ouvre: 115.75, couleur: 4 },
      { type: 'nuee', t: 118.7, fin: 121.6, liste: ['📚', '💡', '💭', '🚀'], rangee: true, pas: 0.55 },
      { type: 'pluie', t: 128.4, fin: 139.2 },
      { type: 'explosion', t: 152.0 },
      { type: 'canons', t: 152.05, nombre: 420 },
      { type: 'serpentins', t: 152.0, fin: 160.0 },
      { type: 'ballons', t: 152.0, fin: 173.0, nombre: 30 },
      { type: 'feux', t: 152.8, x: 0.18, y: 0.24 }, { type: 'feux', t: 153.4, x: 0.82, y: 0.2 }, { type: 'feux', t: 154.2, x: 0.35, y: 0.12 },
      { type: 'feux', t: 155.0, x: 0.66, y: 0.14 }, { type: 'feux', t: 155.9, x: 0.5, y: 0.1 },
      { type: 'gateau', t: 153.0, fin: 157.4, allume: 153.6, y: 0.3, yP: 0.3, echelle: 0.62, portraitSeul: true },
      { type: 'murPhotos', t: 168.0, fin: 173.0 },
      { type: 'canons', t: 173.0, nombre: 260 },
      { type: 'ballons', t: 173.0, fin: 190.6, nombre: 18 },
      { type: 'badge', t: 190.8, fin: 193.6 },
      { type: 'affiche', t: 206.2, fin: 210.1, photo: 2, titre: 'JOËL', sous: 'NOUVELLE ANNÉE.', etiquette: 'NOUVELLE SAISON · 10.10', badge: '10.10', cinema: true },
      { type: 'feux', t: 213.7, x: 0.2, y: 0.2 }, { type: 'feux', t: 214.2, x: 0.8, y: 0.22 },
      { type: 'ballons', t: 217.6, fin: 234, nombre: 26 },
      { type: 'canons', t: 218.4, nombre: 280 },
      { type: 'feux', t: 219.0, x: 0.15, y: 0.18 }, { type: 'feux', t: 219.7, x: 0.85, y: 0.16 },
      { type: 'etincelles', t: 217.6, fin: 234 },
    ],
  };

  // La musique de la publicité : intro mystérieuse → montée émotionnelle →
  // rythme énergique → explosion au « JOYEUX ANNIVERSAIRE JOËL ! » →
  // conclusion élégante (« Joyeux anniversaire » en boîte à musique).
  function musiquePub() {
    const m = [];
    const pad = (t, d, a, gain, coupe, att, rel) => m.push({ i: 'pad', t, d, notes: ACCORDS[a].slice(1), gain, coupe, att: att == null ? 0.3 : att, rel: rel == null ? 0.4 : rel });
    const basse = (t, d, a, gain) => m.push({ i: 'basse', t, d, note: ACCORDS[a][0], gain });
    const arp = (t, d, a, gain, c0, c1, pas) => m.push({ i: 'arp', t, d, notes: ACCORDS[a].slice(1), gain, c0, c1, pas: pas || 0.125 });
    const kicks = (a, b, pas, gain) => { for (let t = a; t < b - 0.01; t += pas) m.push({ i: 'kick', t, gain }); };
    const hats = (a, b, pas, gain, decal) => { for (let t = a + (decal || 0); t < b - 0.01; t += pas) m.push({ i: 'hat', t, gain }); };
    const claps = (a, b, pas, gain) => { for (let t = a; t < b - 0.01; t += pas) m.push({ i: 'clap', t, gain }); };
    // Une suite d'accords, chacun « duree » secondes.
    const suite = (t0, t1, accords, duree, o) => {
      let k = 0;
      for (let t = t0; t < t1 - 0.01; t += duree, k++) {
        const a = accords[k % accords.length], d = Math.min(duree, t1 - t);
        pad(t, d + 0.15, a, o.pad, o.coupe, o.att, o.rel);
        if (o.basse) basse(t, d, a, o.basse);
        if (o.arp) arp(t, d, a, o.arp, o.c0 || 1500, o.c1 || 3500, o.pas);
      }
    };
    const cloches = (t, notes, gain) => notes.forEach((n, k) => m.push({ i: 'cloche', t: t + k * 0.02, f: n, gain, d: 3 }));

    // 1 — intro mystérieuse
    m.push({ i: 'drone', t: 0, d: 23.2, f: 61.74, gain: 0.14, att: 3 });
    m.push({ i: 'souffle', t: 0, d: 23.2, gain: 0.045, att: 2 });
    m.push({ i: 'texture', t: 0.4, d: 22, gain: 0.04 });
    for (const t of [0.8, 1.9, 13.9, 15.0]) m.push({ i: 'battement', t, gain: 0.35 });
    pad(2.4, 8.4, 'Bm', 0.11, 700, 2.0, 1.0);
    pad(10.8, 7.6, 'G', 0.11, 800, 1.5, 1.0);
    pad(18.4, 4.8, 'A', 0.12, 1000, 1.0, 0.05);
    cloches(2.4, [71, 78], 0.07);
    for (const [t, f] of [[7.25, 74], [7.6, 76], [7.95, 78]]) m.push({ i: 'pulse', t, gain: 0.07, f: 880 + (f - 74) * 60 });
    m.push({ i: 'impact', t: 8.3, gain: 0.3 });
    m.push({ i: 'eclats', t: 8.3, d: 1.2, gain: 0.07, densite: 10 });
    m.push({ i: 'riser', t: 20.6, d: 2.6, gain: 0.22 });
    m.push({ i: 'coupBasse', t: 23.2, gain: 0.7 });
    pad(23.2, 3.1, 'D', 0.15, 2200, 0.02, 0.3);
    basse(23.2, 3.0, 'D', 0.2);
    kicks(23.2, 26.2, 0.5, 0.45);

    // 2 — l'annonce : le rythme se construit
    for (let t = 26.4; t < 29.1; t += 0.25) m.push({ i: 'pulse', t, gain: 0.05, f: Math.round((t - 26.4) / 0.25) % 2 ? 660 : 990 });
    m.push({ i: 'glitch', t: 26.4, gain: 0.08 });
    suite(29.4, 44.8, ['D', 'A', 'Bm', 'G'], 4, { pad: 0.13, coupe: 1400, basse: 0.2, arp: 0.07, c0: 1200, c1: 2600 });
    kicks(29.4, 44.7, 0.5, 0.5);
    hats(32.8, 44.7, 0.5, 0.05, 0.25);
    claps(38.5, 44.7, 1.0, 0.13);
    for (let k = 0; k < 4; k++) m.push({ i: 'clunk', t: 29.9 + k * 0.3, gain: 0.35 });
    for (let k = 0; k < 6; k++) m.push({ i: 'pop', t: 33.0 + k * 0.22, gain: 0.12 });
    for (let k = 0; k < 5; k++) m.push({ i: 'allumage', t: 36.4 + k * 0.18, gain: 0.18 });
    m.push({ i: 'whoosh', t: 38.0, d: 0.6, gain: 0.2 });
    for (let k = 0; k < 5; k++) m.push({ i: 'allumage', t: 39.2 + k * 0.15, gain: 0.12 });
    pad(44.8, 3.0, 'A', 0.13, 900, 0.3, 0.02);
    m.push({ i: 'riser', t: 45.0, d: 2.8, gain: 0.25 });
    m.push({ i: 'coupBasse', t: 47.8, gain: 1 });
    m.push({ i: 'eclats', t: 47.8, d: 2.4, gain: 0.12, densite: 20 });
    pad(47.8, 6.5, 'D', 0.15, 2000, 0.05, 1.0);
    basse(47.8, 6.4, 'D', 0.2);
    kicks(47.8, 54.2, 1.0, 0.4);
    m.push({ i: 'whoosh', t: 50.7, d: 0.6, gain: 0.2 });

    // 3 — le message : montée émotionnelle
    suite(54.4, 82.0, ['D', 'A', 'Bm', 'G'], 4, { pad: 0.14, coupe: 1100, att: 1.0, rel: 1.0, basse: 0.12 });
    const melodie = [[78, 0], [76, 1], [74, 2], [76, 3], [73, 4], [74, 6], [71, 8], [69, 9], [71, 10], [74, 11], [76, 12], [78, 14]];
    for (let cycle = 0; cycle < 2; cycle++) {
      for (const [n, b] of melodie) {
        const t = 54.4 + cycle * 16 + b;
        if (t < 81.4) m.push({ i: 'cloche', t, f: n, gain: 0.09, d: 2.6 });
      }
    }
    kicks(66.6, 81.9, 2.0, 0.3);
    m.push({ i: 'riser', t: 79.6, d: 2.4, gain: 0.22 });

    // 4 — célébration : énergique
    m.push({ i: 'coupBasse', t: 82.0, gain: 0.8 });
    suite(82.0, 96.8, ['D', 'A', 'Bm', 'G'], 2, { pad: 0.12, coupe: 2200, basse: 0.22, arp: 0.08, c0: 2000, c1: 4000 });
    kicks(82.0, 96.7, 0.5, 0.7);
    hats(82.0, 96.7, 0.5, 0.06, 0.25);
    hats(88.4, 96.7, 0.125, 0.025);
    claps(82.5, 96.7, 1.0, 0.16);
    for (let k = 0; k < 8; k++) m.push({ i: 'pop', t: 82.6 + k * 0.4, gain: 0.08 });
    pad(96.8, 2.0, 'A', 0.12, 1200, 0.2, 0.02);
    m.push({ i: 'riser', t: 97.0, d: 1.8, gain: 0.2 });
    m.push({ i: 'coupBasse', t: 98.8, gain: 0.7 });
    suite(98.8, 102.8, ['D', 'G'], 2, { pad: 0.14, coupe: 2600, basse: 0.2, arp: 0.08, c0: 2500, c1: 4500 });
    kicks(98.8, 102.7, 0.5, 0.6);
    claps(99.3, 102.7, 1.0, 0.15);

    // 5 — les vœux : groove chaleureux, un cadeau par vœu
    suite(102.8, 121.8, ['G', 'D', 'A', 'Bm'], 2.2, { pad: 0.13, coupe: 1800, basse: 0.18, arp: 0.06, c0: 1500, c1: 2500, pas: 0.25 });
    kicks(102.8, 121.7, 1.0, 0.45);
    hats(102.8, 121.7, 0.5, 0.045, 0.25);
    for (const t of [106.6, 108.8, 111.0, 113.2, 115.4]) {
      m.push({ i: 'pop', t, gain: 0.16 });
      m.push({ i: 'eclats', t: t + 0.35, d: 1.0, gain: 0.1, densite: 14 });
      cloches(t + 0.35, [81, 86], 0.06);
    }
    for (let k = 0; k < 4; k++) m.push({ i: 'pop', t: 118.7 + k * 0.55, gain: 0.12 });
    pad(121.8, 6.6, 'G', 0.15, 1500, 0.8, 1.5);
    basse(121.8, 6.4, 'G', 0.12);
    cloches(123.4, [74, 79, 83], 0.07);

    // 6 — moment émotionnel : la nuit, puis la lumière revient
    suite(128.4, 139.0, ['Bm', 'Em', 'Bm', 'G'], 2.65, { pad: 0.12, coupe: 650, att: 1.2, rel: 1.2, basse: 0.1 });
    m.push({ i: 'drone', t: 128.4, d: 10.6, f: 61.74, gain: 0.1, att: 2 });
    for (const t of [128.6, 131.6, 133.8]) m.push({ i: 'battement', t, gain: 0.3 });
    m.push({ i: 'glitch', t: 136.0, gain: 0.07 });
    for (let k = 0; k < 18; k++) m.push({ i: 'frappe', t: 136.05 + k * 0.08, gain: 0.05 });
    pad(139.0, 2.6, 'A', 0.14, 1500, 0.6, 0.02);
    m.push({ i: 'riser', t: 139.2, d: 2.4, gain: 0.2 });
    m.push({ i: 'coupBasse', t: 141.6, gain: 0.9 });
    m.push({ i: 'eclats', t: 141.6, d: 2.0, gain: 0.12, densite: 18 });
    suite(141.6, 151.8, ['D', 'A', 'Bm', 'G'], 2, { pad: 0.15, coupe: 2000, basse: 0.18, arp: 0.07, c0: 1500, c1: 5000 });
    kicks(145.8, 151.75, 0.5, 0.55);
    let pas = 0.25;
    for (let t = 149.6; t < 151.75; t += pas) { m.push({ i: 'clap', t, gain: 0.08 + 0.12 * (t - 149.6) / 2.2 }); pas = Math.max(0.0625, pas * 0.86); }
    m.push({ i: 'riser', t: 147.8, d: 4.0, gain: 0.4 });

    // 7 — LE GRAND MOMENT : explosion
    m.push({ i: 'coupBasse', t: 152.0, gain: 1.2 });
    m.push({ i: 'impact', t: 152.0, gain: 1.0 });
    m.push({ i: 'eclats', t: 152.0, d: 5, gain: 0.16, densite: 30 });
    for (const t of [152.8, 153.4, 154.2, 155.0, 155.9]) m.push({ i: 'petard', t, gain: 0.3 });
    suite(152.0, 166.4, ['D', 'G', 'A', 'D'], 2, { pad: 0.15, coupe: 2600, basse: 0.22, arp: 0.08, c0: 2500, c1: 5000, pas: 0.0625 });
    kicks(152.0, 166.3, 0.5, 0.72);
    hats(152.0, 166.3, 0.5, 0.06, 0.25);
    hats(152.0, 166.3, 0.125, 0.025);
    claps(152.5, 166.3, 1.0, 0.17);
    for (let k = 0; k < 6; k++) m.push({ i: 'allumage', t: 153.6 + k * 0.15, gain: 0.1 });
    pad(166.4, 1.6, 'A', 0.12, 1200, 0.2, 0.02);
    m.push({ i: 'riser', t: 166.5, d: 1.5, gain: 0.18 });
    suite(168.0, 173.0, ['G', 'D'], 2.5, { pad: 0.16, coupe: 1800, att: 0.4, basse: 0.16 });
    cloches(168.0, [74, 78, 81], 0.08);
    kicks(168.0, 172.9, 1.0, 0.4);

    // 8 — message final : plus énergique encore
    m.push({ i: 'coupBasse', t: 173.0, gain: 0.8 });
    suite(173.0, 183.2, ['D', 'A', 'Bm', 'G'], 2, { pad: 0.13, coupe: 2600, basse: 0.22, arp: 0.08, c0: 2500, c1: 5500, pas: 0.0625 });
    kicks(173.0, 183.1, 0.5, 0.75);
    hats(173.0, 183.1, 0.125, 0.03);
    claps(173.5, 183.1, 1.0, 0.18);
    pad(183.2, 1.8, 'A', 0.12, 1200, 0.2, 0.02);
    m.push({ i: 'riser', t: 183.3, d: 1.7, gain: 0.2 });
    m.push({ i: 'coupBasse', t: 185.0, gain: 0.6 });
    suite(185.0, 190.8, ['D', 'G'], 2.9, { pad: 0.17, coupe: 2200, att: 0.2, rel: 0.8, basse: 0.14 });
    cloches(185.0, [74, 78, 81, 86], 0.08);
    m.push({ i: 'eclats', t: 185.0, d: 4, gain: 0.08, densite: 8 });

    // 9 — fin publicitaire : bande-annonce
    m.push({ i: 'drone', t: 190.8, d: 11.5, f: 55, gain: 0.16, att: 0.5 });
    for (let t = 190.8; t < 193.6; t += 0.5) m.push({ i: 'pulse', t, gain: 0.06, f: 1500 });
    for (let k = 0; k < 16; k++) m.push({ i: 'frappe', t: 191.0 + k * 0.07, gain: 0.05 });
    for (const t of [193.8, 196.0, 198.2, 200.3]) {
      m.push({ i: 'coupBasse', t, gain: 0.8 });
      m.push({ i: 'impact', t, gain: 0.55 });
      pad(t, 1.9, t === 200.3 ? 'A' : 'Bm', 0.14, 500, 0.01, 1.0);
    }
    for (let t = 194.3; t < 202.2; t += 0.5) m.push({ i: 'pulse', t, gain: 0.04, f: 1200 });
    m.push({ i: 'riser', t: 200.6, d: 1.7, gain: 0.25 });
    m.push({ i: 'coupBasse', t: 202.6, gain: 1.1 });
    m.push({ i: 'impact', t: 202.6, gain: 0.9 });
    m.push({ i: 'eclats', t: 202.6, d: 2.0, gain: 0.1, densite: 18 });
    pad(202.6, 3.6, 'D', 0.15, 1800, 0.02, 0.6);
    basse(202.6, 3.5, 'D', 0.2);
    suite(206.2, 213.6, ['Bm', 'G', 'D', 'A'], 2, { pad: 0.14, coupe: 2200, basse: 0.22, arp: 0.08, c0: 2200, c1: 4500, pas: 0.0625 });
    kicks(206.2, 213.5, 0.5, 0.7);
    hats(206.2, 213.5, 0.125, 0.03);
    for (const t of [210.2, 211.0, 211.8, 212.6]) { m.push({ i: 'impact', t, gain: 0.45 }); m.push({ i: 'whoosh', t: t - 0.25, d: 0.35, gain: 0.15 }); }
    m.push({ i: 'coupBasse', t: 213.6, gain: 1.1 });
    m.push({ i: 'impact', t: 213.6, gain: 0.9 });
    m.push({ i: 'petard', t: 213.7, gain: 0.25 });
    m.push({ i: 'petard', t: 214.2, gain: 0.25 });
    pad(213.6, 4.0, 'D', 0.16, 2400, 0.02, 0.8);
    basse(213.6, 3.8, 'D', 0.22);
    kicks(213.6, 217.4, 0.5, 0.6);
    claps(214.1, 217.4, 1.0, 0.16);

    // ÉCRAN FINAL : « Joyeux anniversaire » en boîte à musique
    const b = 0.55, d0 = 218.4;
    const air = [[69, 0, 0.75], [69, 0.75, 0.25], [71, 1, 1], [69, 2, 1], [74, 3, 1], [73, 4, 2],
      [69, 6, 0.75], [69, 6.75, 0.25], [71, 7, 1], [69, 8, 1], [76, 9, 1], [74, 10, 2],
      [69, 12, 0.75], [69, 12.75, 0.25], [81, 13, 1], [78, 14, 1], [74, 15, 1], [73, 16, 1], [71, 17, 1],
      [79, 18, 0.75], [79, 18.75, 0.25], [78, 19, 1], [74, 20, 1], [76, 21, 1], [74, 22, 3]];
    for (const [n, temps, duree] of air) m.push({ i: 'boite', t: d0 + temps * b, f: n + 12, gain: 0.16, d: Math.max(1.2, duree * b * 2) });
    const grille = [['D', 0, 4], ['A', 4, 6], ['D', 10, 3], ['G', 13, 5], ['D', 18, 3], ['A', 21, 1], ['D', 22, 7]];
    for (const [a, deb, n] of grille) pad(d0 + deb * b, n * b + 0.1, a, 0.13, 1500, 0.3, a === 'D' && deb === 22 ? 2.0 : 0.3);
    for (const [a, deb, n] of grille) basse(d0 + deb * b, n * b, a, 0.12);
    m.push({ i: 'coupBasse', t: 217.6, gain: 0.6 });
    m.push({ i: 'eclats', t: 217.6, d: 3, gain: 0.1, densite: 14 });
    for (const t of [219.0, 219.7]) m.push({ i: 'petard', t, gain: 0.18 });
    m.push({ i: 'eclats', t: 230.5, d: 2.5, gain: 0.06, densite: 8 });

    // Les sons qui accompagnent chaque texte.
    for (const p of pub.plans) {
      if (p.type === 'liste') {
        p.items.forEach((it) => {
          m.push({ i: 'impact', t: it.t, gain: 0.32 });
          m.push({ i: 'whoosh', t: it.t - 0.28, d: 0.4, gain: 0.14 });
          if (it.emoji) m.push({ i: 'pop', t: it.t + 0.15, gain: 0.12 });
        });
        continue;
      }
      if (p.type === 'pile') { p.items.forEach((it) => m.push({ i: 'whoosh', t: it.t - 0.2, d: 0.5, gain: 0.12 })); continue; }
      if (p.type !== 'texte' || p.son === 'aucun') continue;
      if (p.son === 'pop') { m.push({ i: 'pop', t: p.t, gain: 0.14 }); m.push({ i: 'impact', t: p.t, gain: 0.25 }); continue; }
      if (p.style === 'punch') m.push({ i: 'impact', t: p.t, gain: p.taille === 'xl' ? 0.75 : 0.45 });
      else if (p.style === 'glisse' || p.style === 'masque') m.push({ i: 'whoosh', t: p.t - 0.15, d: 0.6, gain: 0.13 });
      else if (p.style === 'revele') m.push({ i: 'eclats', t: p.t, d: 0.9, gain: 0.06, densite: 9 });
      else if (p.style === 'mots') m.push({ i: 'whoosh', t: p.t - 0.1, d: 0.5, gain: 0.08 });
      if (p.emoji || p.emojis) m.push({ i: 'pop', t: p.t + 0.3, gain: 0.1 });
    }
    return m;
  }

  longue.musique = musiqueLongue();
  courte.musique = musiqueCourte();
  pub.musique = musiquePub();

  return { versions: { longue, courte, pub }, ACCORDS };
});
