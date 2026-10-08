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

  longue.musique = musiqueLongue();
  courte.musique = musiqueCourte();

  return { versions: { longue, courte }, ACCORDS };
});
