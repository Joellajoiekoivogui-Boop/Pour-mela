// La version « publicité » du film de Joël : typographie animée, gâteau 3D,
// bougies, ballons, cadeaux, projecteurs, serpentins, feux d'artifice et
// photos en affiches. Elle s'appuie sur les outils du moteur (film.js) et
// sur la partition (partition.js, version « pub »). Comme le reste du film,
// chaque image ne dépend que du temps t.
(function (racine) {
  'use strict';

  function creer(O) {
    const { ctx, canvas, W, H, S, cx, cy, portrait, L, V } = O;
    const { borne, lin, melange, sortie, sortieForte, entree, douce, fenetre, hasard, toile, rgba, POLICES } = O;
    const { point, spriteListe, halo, voile, faisceau, onde, gerbe, etoiles, poussieres, fondNebuleuse } = O;
    const { police, mesurer, couper, titre, poser, photosPretes, placer } = O;
    const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

    const alea = (i, g) => { const x = Math.sin(i * 12.9898 + g * 78.233) * 43758.5453; return x - Math.floor(x); };
    const rebond = (x) => {
      const n1 = 7.5625, d1 = 2.75;
      if (x < 1 / d1) return n1 * x * x;
      if (x < 2 / d1) { x -= 1.5 / d1; return n1 * x * x + 0.75; }
      if (x < 2.5 / d1) { x -= 2.25 / d1; return n1 * x * x + 0.9375; }
      x -= 2.625 / d1; return n1 * x * x + 0.984375;
    };
    const retour = (x) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
    const TAILLES = { xl: S * 0.115, l: S * 0.08, m: S * 0.056, s: S * 0.042 };
    const visible = (t, a, b) => t >= a && t <= b;

    // ------------------------------------------------------ emojis
    const emojis = {};
    function imageEmoji(ch) {
      if (emojis[ch]) return emojis[ch];
      const c = toile(160, 160);
      const g = c.getContext('2d');
      g.font = '128px ' + EMOJI;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(ch, 80, 88);
      return (emojis[ch] = c);
    }
    // Un emoji qui surgit (rebond), flotte, oscille puis disparaît.
    function emoji(ch, x, y, taille, t, t0, t1, o) {
      o = o || {};
      if (t < t0 || t > t1) return;
      const u = t - t0;
      const pop = retour(borne(u / 0.45));
      const fin = 1 - entree(lin(t, t1 - 0.25, t1));
      const ph = o.phase || 0;
      const e = Math.max(0, pop * fin) * (1 + 0.05 * Math.sin(u * 5 + ph));
      if (e <= 0.01) return;
      ctx.save();
      ctx.translate(x, y + Math.sin(u * 2.2 + ph) * taille * 0.06);
      ctx.rotate((o.rot || 0.14) * Math.sin(u * 2.6 + ph));
      ctx.scale(e, e);
      if (o.lueur !== false) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35 * fin;
        ctx.drawImage(spriteListe[1], -taille, -taille, taille * 2, taille * 2);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = borne(u * 8) * fin * (o.alpha == null ? 1 : o.alpha);
      ctx.drawImage(imageEmoji(ch), -taille * 0.62, -taille * 0.62, taille * 1.24, taille * 1.24);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // ------------------------------------------ typographie animée
    const mises = new Map();
    function miseEnPage(texte, taille, poids, famille, esp, largeur) {
      const cle = [texte, Math.round(taille), poids, famille, esp, Math.round(largeur)].join('|');
      if (mises.has(cle)) return mises.get(cle);
      const o = { taille, poids, famille, espacement: esp };
      // Si un mot seul est trop large, on réduit la taille.
      let plusLong = 0;
      for (const m of texte.split(' ')) plusLong = Math.max(plusLong, mesurer(m, o));
      if (plusLong > largeur) { o.taille = taille * (largeur / plusLong); }
      const lignes = couper(texte, o, largeur);
      ctx.font = police(poids, o.taille, famille);
      ctx.letterSpacing = Math.round(esp * o.taille) + 'px';
      const espace = ctx.measureText(' ').width;
      let index = 0, indexMot = 0;
      const res = lignes.map((mots) => {
        const ms = mots.map((m) => {
          const lettres = [];
          let x = 0;
          for (const ch of Array.from(m)) {
            const w = ctx.measureText(ch).width;
            lettres.push({ c: ch, x, w, i: index++ });
            x += w;
          }
          return { texte: m, w: x, lettres, i: indexMot++ };
        });
        const total = ms.reduce((a, m) => a + m.w, 0) + espace * (ms.length - 1);
        let x = -total / 2;
        for (const m of ms) { m.x = x; x += m.w + espace; }
        return { mots: ms, largeur: total };
      });
      ctx.letterSpacing = '0px';
      const r = { lignes: res, taille: o.taille, nbLettres: index, nbMots: indexMot, largeur: Math.max(...res.map((l) => l.largeur)) };
      mises.set(cle, r);
      return r;
    }

    const degradeAccent = {};
    function accentPour(taille) {
      const k = Math.round(taille);
      if (degradeAccent[k]) return degradeAccent[k];
      const d = ctx.createLinearGradient(0, -taille * 0.8, 0, taille * 0.1);
      d.addColorStop(0, '#ffffff');
      d.addColorStop(0.45, '#e2ccff');
      d.addColorStop(1, '#ff9fd2');
      return (degradeAccent[k] = d);
    }

    // Dessine une phrase animée. p : { t, fin, texte, style, taille, poids,
    // accent, x, y, yP, emoji, emojis, lueur, sortie, largeur, rayons, glitch }.
    function phrase(p, t, o) {
      o = o || {};
      if (t < p.t || t > p.fin) return null;
      const taille0 = TAILLES[p.taille || 'm'];
      const poids = p.poids || (p.taille === 'm' || p.taille === 's' ? 600 : 700);
      const famille = poids === 300 || poids === 600 ? POLICES.texte : POLICES.titre;
      const esp = p.taille === 'xl' || p.taille === 'l' ? 0.02 : 0.01;
      const largeur = W * (p.largeur ? L(p.largeur, 0.86) : L(0.82, 0.86));
      const texte = p.texte.replace(/ ([!?:;])/g, '\u00a0$1');
      const M = miseEnPage(texte, taille0, poids, famille, esp, largeur);
      const taille = M.taille;
      const x = cx + (portrait && p.xP != null ? p.xP : p.x || 0) * W + (o.dx || 0);
      const y = cy + (portrait && p.yP != null ? p.yP : p.y || 0) * H + (o.dy || 0);
      const u = t - p.t;
      const dur = p.fin - p.t;
      const coupe = p.sortie === 'coupe';
      const q = coupe ? 0 : lin(t, p.fin - (p.sortie === 'explose' ? 0.4 : 0.35), p.fin);
      const hl = taille * 1.2;
      const y0 = y - ((M.lignes.length - 1) * hl) / 2;
      const derive = 1 + 0.04 * (u / Math.max(1, dur)) + (o.echelle ? o.echelle - 1 : 0);
      const base = ctx.getTransform();
      const accents = p.accent === '*' ? null : p.accent || [];
      const estAccent = (m) => p.accent === '*' || accents.some((a) => m === a || m.replace(/[\s\u00a0.,!?…:;]+$/, '') === a);
      const alphaG = o.alpha == null ? 1 : o.alpha;

      if (p.rayons) rayons(x, y, t, 0.5 * fenetre(t, p.t, p.fin, 0.3, 0.4) * alphaG);

      ctx.font = police(poids, taille, famille);
      ctx.letterSpacing = Math.round(esp * taille) + 'px';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      const nbL = M.nbLettres, nbM = M.nbMots;

      M.lignes.forEach((ligne, j) => {
        const ly = y0 + j * hl;
        for (const mot of ligne.mots) {
          const accent = estAccent(mot.texte);
          for (const le of mot.lettres) {
            let dx = 0, dy = 0, e = 1, a = 1, flou = 0, rot = 0;
            const lx = mot.x + le.x;
            switch (p.style) {
              case 'revele': {
                const k = borne((u - (le.i / Math.max(1, nbL)) * Math.min(1.1, dur * 0.35)) / 0.5);
                const s = sortieForte(k);
                dy = (1 - s) * taille * 0.55; a = s; flou = (1 - s) * taille * 0.25; e = 1 + (1 - s) * 0.25;
                break;
              }
              case 'mots': {
                const k = borne((u - mot.i * Math.min(0.13, (dur * 0.5) / Math.max(1, nbM))) / 0.35);
                const s = retour(k);
                e = 0.4 + 0.6 * s; a = borne(k * 3); flou = (1 - k) * taille * 0.2; dy = (1 - k) * taille * 0.2;
                break;
              }
              case 'punch': {
                const k = borne(u / 0.32);
                const s = sortieForte(k);
                e = melange(2.4, 1, s); a = borne(k * 4); flou = (1 - k) * taille * 0.5;
                break;
              }
              case 'glisse': {
                const k = borne((u - (le.i / Math.max(1, nbL)) * 0.35) / 0.55);
                const s = sortieForte(k);
                dx = (1 - s) * W * 0.25 * (j % 2 ? -1 : 1); a = borne(k * 2.5); flou = (1 - s) * taille * 0.8;
                break;
              }
              case 'masque': {
                const front = melange(-0.1, 1.1, sortie(borne(u / 0.9)));
                const pos = (lx + M.largeur / 2) / Math.max(1, M.largeur);
                const k = borne((front - pos) * 6);
                a = k; dy = (1 - k) * taille * 0.15;
                break;
              }
              case 'machine': {
                const vus = u * 28;
                a = le.i < vus ? 1 : 0;
                break;
              }
              case 'zoom': {
                const k = borne(u / 0.25);
                a = k; e = 1.12 - 0.12 * sortie(borne(u / dur));
                break;
              }
              case 'vole': {
                // Les lettres arrivent en volant de partout, en tournant.
                const k = borne((u - (le.i / Math.max(1, nbL)) * 0.35) / 0.6);
                const s = sortieForte(k);
                dx = (alea(le.i, 1) - 0.5) * W * 0.9 * (1 - s);
                dy = (alea(le.i, 2) - 0.5) * H * 0.9 * (1 - s);
                rot = (alea(le.i, 3) - 0.5) * 5 * (1 - s);
                e = 1 + (1 - s) * 1.2; a = borne(k * 3); flou = (1 - s) * taille * 0.6;
                break;
              }
              case 'chute': {
                // Les lettres tombent du ciel et rebondissent.
                const k = borne((u - (le.i / Math.max(1, nbL)) * 0.45) / 0.7);
                dy = -(1 - rebond(k)) * H * 0.55; a = borne(k * 5);
                rot = (1 - rebond(k)) * (alea(le.i, 4) - 0.5) * 1.5;
                break;
              }
            }
            if (p.flotte) { dy += Math.sin(t * 2.6 + le.i * 0.45) * taille * 0.07; rot += Math.sin(t * 2 + le.i) * 0.035; }
            if (q > 0 && p.sortie === 'explose') {
              // Les lettres explosent dans toutes les directions.
              const k = sortie(q);
              const dir = (lx + le.w / 2) / Math.max(1, M.largeur / 2);
              dx += (dir * 0.6 + (alea(le.i, 5) - 0.5)) * W * 0.5 * k;
              dy += ((alea(le.i, 6) - 0.5) * H * 0.7 - H * 0.08) * k;
              rot += (alea(le.i, 7) - 0.5) * 6 * k;
              e *= 1 + k * 1.2; a *= 1 - k; flou = Math.max(flou, k * taille * 0.5);
            } else if (q > 0) {
              const k = borne(q * 1.6 - (le.i / Math.max(1, nbL)) * 0.6);
              a *= 1 - k; dy -= k * taille * 0.3; flou = Math.max(flou, k * taille * 0.3);
            }
            a *= alphaG;
            if (a <= 0.01) continue;
            if (p.glitch && Math.sin(u * 23 + le.i) > 0.92) dx += (Math.sin(le.i * 7.1 + u * 40)) * taille * 0.12;
            const ex = e * derive;
            const cxL = x + (lx + le.w / 2) * derive;
            ctx.setTransform(base.a * ex, base.b, base.c, base.d * ex, base.e + cxL + dx, base.f + ly + dy + taille * 0.34);
            if (rot) ctx.rotate(rot);
            ctx.fillStyle = accent ? accentPour(taille) : '#ffffff';
            if (accent || p.lueur) { ctx.shadowColor = accent ? 'rgba(200,120,255,0.85)' : 'rgba(150,110,255,0.8)'; ctx.shadowBlur = taille * 0.35; }
            if (flou > 1) {
              ctx.globalAlpha = a * 0.3;
              ctx.fillText(le.c, -le.w / 2 - flou, 0);
              ctx.fillText(le.c, -le.w / 2 + flou, 0);
            }
            ctx.globalAlpha = a;
            ctx.fillText(le.c, -le.w / 2, 0);
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
          }
        }
      });
      ctx.setTransform(base);
      ctx.letterSpacing = '0px';
      ctx.globalAlpha = 1;

      // Emojis autour de la phrase.
      const hauteur = M.lignes.length * hl;
      const fe = p.fin - (coupe ? 0 : 0.15);
      if (p.emojis) {
        const te = taille * 1.25;
        const place = M.largeur / 2 + te * 1.1;
        if (!portrait && x + place + te < W && x - place - te > 0) {
          emoji(p.emojis[0], x - place, y, te, t, p.t + 0.2, fe, { phase: 0 });
          emoji(p.emojis[1], x + place, y, te, t, p.t + 0.32, fe, { phase: 2 });
        } else {
          const ec = Math.min(M.largeur * 0.35, W * 0.3);
          emoji(p.emojis[0], x - ec, y - hauteur / 2 - te * 0.75, te, t, p.t + 0.2, fe, { phase: 0 });
          emoji(p.emojis[1], x + ec, y - hauteur / 2 - te * 0.75, te, t, p.t + 0.32, fe, { phase: 2 });
        }
      }
      if (p.emoji) {
        const te = taille * 1.4;
        const derniere = M.lignes[M.lignes.length - 1];
        const ex = x + derniere.largeur / 2 + te * 0.85;
        if (ex + te * 0.7 < W * 0.97) emoji(p.emoji, ex, y0 + (M.lignes.length - 1) * hl, te, t, p.t + 0.35, fe, { phase: 1 });
        else emoji(p.emoji, x, y - hauteur / 2 - te * 0.8, te, t, p.t + 0.35, fe, { phase: 1 });
      }
      return { hauteur, largeur: M.largeur, taille };
    }

    // Une pile de phrases : la nouvelle arrive, les précédentes montent.
    function pile(p, t) {
      if (t < p.t || t > p.fin) return;
      const taille = TAILLES[p.taille || 'm'];
      const ecart = taille * L(1.7, 2.6);
      const n = p.items.length;
      p.items.forEach((it, i) => {
        if (t < it.t) return;
        let rang = 0;
        for (let j = i + 1; j < n; j++) rang += sortieForte(lin(t, p.items[j].t, p.items[j].t + 0.5));
        const a = (rang < 0.5 ? 1 : melange(1, 0.38, borne(rang))) * (1 - lin(t, p.fin - 0.35, p.fin));
        // La plus récente au centre, les autres au-dessus.
        const y = -rang * ecart / H;
        phrase(Object.assign({ type: 'texte', t: it.t, fin: p.fin + 1, style: 'glisse', taille: p.taille, y: y + 0.06, yP: y + 0.04, sortie: 'coupe' }, it), t, { alpha: a, echelle: 1 - 0.12 * borne(rang) });
      });
    }

    // ------------------------------------------------- rayons de lumière
    const toileRayons = (function () {
      const r = Math.ceil(S * 0.9);
      const c = toile(r * 2, r * 2);
      const g = c.getContext('2d');
      g.translate(r, r);
      const n = 18;
      for (let k = 0; k < n; k++) {
        g.beginPath();
        g.moveTo(0, 0);
        g.arc(0, 0, r, (k / n) * Math.PI * 2, ((k + 0.42) / n) * Math.PI * 2);
        g.closePath();
        g.fillStyle = k % 2 ? 'rgba(190,150,255,0.5)' : 'rgba(255,190,235,0.4)';
        g.fill();
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'destination-in';
      const d = g.createRadialGradient(r, r, 0, r, r, r);
      d.addColorStop(0, 'rgba(0,0,0,0.9)');
      d.addColorStop(0.5, 'rgba(0,0,0,0.25)');
      d.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = d;
      g.fillRect(0, 0, r * 2, r * 2);
      return c;
    })();
    function rayons(x, y, t, a) {
      if (a <= 0) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 0.12);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = borne(a);
      ctx.drawImage(toileRayons, -toileRayons.width / 2, -toileRayons.height / 2);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // Étoile scintillante à quatre branches.
    const toileEtoile = (function () {
      const c = toile(128, 128);
      const g = c.getContext('2d');
      g.globalCompositeOperation = 'lighter';
      for (const [l, ep] of [[62, 3], [40, 6]]) {
        for (const vert of [false, true]) {
          const d = vert ? g.createLinearGradient(64, 64 - l, 64, 64 + l) : g.createLinearGradient(64 - l, 64, 64 + l, 64);
          d.addColorStop(0, 'rgba(255,255,255,0)');
          d.addColorStop(0.5, 'rgba(255,255,255,0.9)');
          d.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = d;
          if (vert) g.fillRect(64 - ep / 2, 64 - l, ep, l * 2);
          else g.fillRect(64 - l, 64 - ep / 2, l * 2, ep);
        }
      }
      const r = g.createRadialGradient(64, 64, 0, 64, 64, 22);
      r.addColorStop(0, 'rgba(255,255,255,1)');
      r.addColorStop(0.4, 'rgba(220,190,255,0.5)');
      r.addColorStop(1, 'rgba(220,190,255,0)');
      g.fillStyle = r;
      g.fillRect(0, 0, 128, 128);
      return c;
    })();
    function scintille(x, y, s, a, rot) {
      if (a <= 0) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot || 0);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = borne(a);
      ctx.drawImage(toileEtoile, -s, -s, s * 2, s * 2);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    function etincelles(t, t0, t1, n, graine) {
      const r = hasard(graine || 3);
      const a0 = fenetre(t, t0, t1, 0.6, 0.6);
      for (let i = 0; i < n; i++) {
        const x = r() * W, y = r() * H, per = 1.2 + r() * 2.2, ph = r() * per, s = S * (0.012 + r() * 0.03);
        const k = ((t + ph) % per) / per;
        scintille(x, y, s * Math.sin(k * Math.PI), a0 * Math.sin(k * Math.PI), k * 1.2);
      }
    }

    // ------------------------------------------------------------ fonds
    function poids(t, a, b) { return Math.min(lin(t, a - 0.25, a + 0.25), 1 - lin(t, b - 0.25, b + 0.25)); }
    const FOND = {
      nuit(t, a) { fondNebuleuse(t, 0.35 * a); etoiles(t, 0.55 * a, { part: 0.7 }); poussieres(t, 0.35 * a, 1); },
      alerte(t, a) {
        etoiles(t, 0.3 * a, { part: 0.5 });
        for (const [px, col, ph] of [[0.12, [255, 60, 110], 0], [0.88, [124, 77, 255], Math.PI]]) {
          const ang = t * 5 + ph;
          const sx = W * px, sy = H * 0.06;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.translate(sx, sy);
          ctx.rotate(ang);
          const d = ctx.createLinearGradient(0, 0, S * 1.4, 0);
          d.addColorStop(0, rgba(col, 0.55 * a));
          d.addColorStop(1, rgba(col, 0));
          ctx.fillStyle = d;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(S * 1.4, -S * 0.25);
          ctx.lineTo(S * 1.4, S * 0.25);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          halo(sx, sy, S * 0.18, 0.7 * a * (0.6 + 0.4 * Math.sin(t * 10 + ph)), col);
        }
        ctx.globalAlpha = 0.06 * a;
        ctx.fillStyle = '#ffffff';
        for (let y = (t * 60) % 6; y < H; y += 6) ctx.fillRect(0, y, W, 1);
        ctx.globalAlpha = 1;
      },
      scene(t, a) {
        const horizon = H * L(0.7, 0.74);
        const d = ctx.createLinearGradient(0, 0, 0, H);
        d.addColorStop(0, rgba([18, 10, 40], a));
        d.addColorStop(horizon / H, rgba([30, 18, 70], a));
        d.addColorStop(1, rgba([8, 5, 20], a));
        ctx.fillStyle = d;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = rgba([150, 110, 255], 0.12 * a);
        ctx.lineWidth = 1;
        for (let k = -10; k <= 10; k++) { ctx.beginPath(); ctx.moveTo(cx + k * W * 0.02, horizon); ctx.lineTo(cx + k * W * 0.2, H); ctx.stroke(); }
        for (let k = 1; k < 8; k++) { const yy = horizon + (H - horizon) * Math.pow(k / 8, 2); ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
        ctx.globalCompositeOperation = 'source-over';
        fondNebuleuse(t, 0.25 * a);
        poussieres(t, 0.4 * a, 1);
      },
      lumiere(t, a) {
        const resp = 0.5 + 0.5 * Math.sin(t * 0.7);
        fondNebuleuse(t, 0.6 * a);
        halo(cx, cy, S * (0.8 + 0.08 * resp), (0.16 + 0.06 * resp) * a, [255, 190, 230]);
        etoiles(t, 0.35 * a, { part: 0.5 });
        poussieres(t, 0.55 * a, -1);
      },
      fete(t, a) {
        fondNebuleuse(t, 0.75 * a);
        rayons(cx, L(cy * 0.82, cy * 0.8), t, 0.18 * a);
        etoiles(t, 0.6 * a, { part: 0.8 });
        poussieres(t, 0.7 * a, 1);
      },
      sombre(t, a) {
        const d = ctx.createLinearGradient(0, 0, 0, H);
        d.addColorStop(0, rgba([10, 12, 28], a));
        d.addColorStop(1, rgba([4, 4, 12], a));
        ctx.fillStyle = d;
        ctx.fillRect(0, 0, W, H);
        poussieres(t * 0.5, 0.25 * a, -1);
      },
      cine(t, a) {
        etoiles(t, 0.2 * a, { part: 0.4 });
        ctx.globalCompositeOperation = 'lighter';
        const d = ctx.createLinearGradient(0, cy, W, cy);
        d.addColorStop(0, 'rgba(90,120,255,0)');
        d.addColorStop(0.5, rgba([140, 160, 255], 0.22 * a));
        d.addColorStop(1, 'rgba(90,120,255,0)');
        ctx.fillStyle = d;
        ctx.fillRect(0, cy - 1.5, W, 3);
        ctx.globalCompositeOperation = 'source-over';
      },
      blanc(t, a) { voile('#ffffff', a); },
    };
    function fonds(t) {
      for (const [a, b, type] of V.fonds) {
        const w = poids(t, a, b);
        if (w > 0) FOND[type](t, w);
      }
    }
    function poidsFond(t, type) {
      let w = 0;
      for (const [a, b, ty] of V.fonds) if (ty === type) w = Math.max(w, poids(t, a, b));
      return w;
    }

    // ---------------------------------------------------- les bougies
    function flamme(x, y, l, t, graine, allume, vent) {
      if (allume <= 0) return;
      const f = 1 + 0.08 * Math.sin(t * 13 + graine) + 0.05 * Math.sin(t * 23 + graine * 2);
      const h = l * 2.3 * allume * f, w = l * 0.75 * allume;
      halo(x, y - h * 0.4, l * 7 * allume, 0.45 * allume, [255, 200, 120]);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(0.06 * Math.sin(t * 7 + graine) + (vent || 0));
      const d = ctx.createRadialGradient(0, -h * 0.25, 0, 0, -h * 0.3, h * 0.8);
      d.addColorStop(0, 'rgba(255,255,240,1)');
      d.addColorStop(0.3, 'rgba(255,225,120,0.95)');
      d.addColorStop(0.7, 'rgba(255,140,60,0.7)');
      d.addColorStop(1, 'rgba(255,100,40,0)');
      ctx.fillStyle = d;
      ctx.beginPath();
      ctx.moveTo(0, -h);
      ctx.bezierCurveTo(w * 0.5, -h * 0.55, w, -h * 0.15, 0, 0);
      ctx.bezierCurveTo(-w, -h * 0.15, -w * 0.5, -h * 0.55, 0, -h);
      ctx.fill();
      ctx.fillStyle = 'rgba(120,150,255,0.55)';
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.08, w * 0.3, h * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Une bougie torsadée : corps, rayures, mèche, flamme.
    function bougie(x, y, l, h, t, allume, teinte, graine, vent) {
      const d = ctx.createLinearGradient(x - l / 2, 0, x + l / 2, 0);
      d.addColorStop(0, teinte[0]);
      d.addColorStop(0.45, teinte[1]);
      d.addColorStop(1, teinte[2]);
      ctx.fillStyle = d;
      ctx.fillRect(x - l / 2, y - h, l, h);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - l / 2, y - h, l, h);
      ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = l * 0.18;
      for (let k = -2; k < h / (l * 0.9) + 2; k++) {
        const yy = y - h + k * l * 0.9;
        ctx.beginPath();
        ctx.moveTo(x - l / 2, yy + l * 0.6);
        ctx.lineTo(x + l / 2, yy);
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = teinte[1];
      ctx.beginPath();
      ctx.ellipse(x, y - h, l / 2, l * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2a2233';
      ctx.lineWidth = Math.max(1, l * 0.08);
      ctx.beginPath();
      ctx.moveTo(x, y - h);
      ctx.lineTo(x + l * 0.04, y - h - l * 0.35);
      ctx.stroke();
      flamme(x + l * 0.04, y - h - l * 0.3, l * 0.55, t, graine, allume, vent);
    }
    // Fumée qui monte d'une mèche soufflée.
    function fumee(x, y, u, a, l) {
      if (a <= 0) return;
      for (let j = 0; j < 6; j++) {
        const v = u - j * 0.12;
        if (v < 0 || v > 1.6) continue;
        const r = l * (0.3 + v * 1.4);
        ctx.globalAlpha = a * 0.35 * (1 - v / 1.6);
        ctx.fillStyle = '#c9c4d8';
        ctx.beginPath();
        ctx.arc(x + Math.sin(v * 4 + j) * l * 0.8, y - v * l * 9, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    const TEINTES = [['#b8a6e8', '#f4efff', '#9b87d6'], ['#e8a6c8', '#fff0f7', '#d487b0'], ['#a6c0e8', '#f0f6ff', '#879fd6'], ['#e8d6a6', '#fffaf0', '#d6bf87']];

    function bougiesGeantes(D, t) {
      const n = 5;
      const base = H * L(0.94, 0.86);
      for (let k = 0; k < n; k++) {
        const montee = sortieForte(lin(t, D.t + k * 0.1, D.t + 0.6 + k * 0.1));
        const sortieB = entree(lin(t, D.fin - 0.4, D.fin));
        const ecart = L(W * 0.11, W * 0.17);
        const x = cx + (k - (n - 1) / 2) * ecart;
        const h = H * L(0.26 + 0.07 * Math.sin(k * 2.1 + 1), 0.2 + 0.05 * Math.sin(k * 2.1 + 1)) ;
        const l = S * 0.055;
        const y = base + (1 - montee + sortieB) * H * 0.5;
        const al = borne((t - D.allume - k * 0.18) / 0.25);
        if (al > 0 && al < 1) gerbe(t, D.allume + k * 0.18, x, y - h - l * 0.4, 500 + k, { nombre: 30, vitesse: 0.25, duree: 0.7, gravite: 0.3 });
        bougie(x, y, l, h, t, al, TEINTES[k % TEINTES.length], k * 1.7);
      }
    }

    // ------------------------------------------------------- le gâteau
    function gateau(D, t) {
      if (D.portraitSeul && !portrait) return;
      if (t < D.t || t > D.fin) return;
      const ech = (D.echelle || 1) * S * L(0.3, 0.36);
      const x = cx + (portrait && D.xP != null ? D.xP : D.x || 0) * W;
      const yBase = cy + (portrait && D.yP != null ? D.yP : D.y || 0) * H + ech * 0.55;
      const arrive = sortieForte(lin(t, D.t, D.t + 0.7));
      const part = entree(lin(t, D.fin - 0.35, D.fin));
      const y = yBase + (1 - arrive) * H * 0.7 + part * H * 0.7;
      const rot = t * 0.5;
      const e = ech;
      ctx.save();
      // Assiette.
      const ass = ctx.createLinearGradient(x - e * 1.25, 0, x + e * 1.25, 0);
      ass.addColorStop(0, '#6f6a8c'); ass.addColorStop(0.5, '#f2f0ff'); ass.addColorStop(1, '#6f6a8c');
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(x, y + e * 0.06, e * 1.3, e * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ass;
      ctx.beginPath(); ctx.ellipse(x, y, e * 1.22, e * 0.27, 0, 0, Math.PI * 2); ctx.fill();
      const etages = [[1.0, 0.5, '#f6f0ff', '#cbb8f5'], [0.72, 0.42, '#fff2f8', '#f3b6d6'], [0.46, 0.36, '#f6f0ff', '#cbb8f5']];
      let yb = y - e * 0.02;
      let sommet = null;
      etages.forEach(([r, hh, clair, glacage], k) => {
        const rx = r * e, ry = r * e * 0.26, h = hh * e;
        const cote = ctx.createLinearGradient(x - rx, 0, x + rx, 0);
        cote.addColorStop(0, '#8f80b8'); cote.addColorStop(0.35, clair); cote.addColorStop(0.6, clair); cote.addColorStop(1, '#7d6fa6');
        ctx.fillStyle = cote;
        ctx.beginPath();
        ctx.moveTo(x - rx, yb - h);
        ctx.lineTo(x - rx, yb);
        ctx.ellipse(x, yb, rx, ry, 0, Math.PI, 0, true);
        ctx.lineTo(x + rx, yb - h);
        ctx.closePath();
        ctx.fill();
        // Coulures de glaçage qui tournent avec le gâteau.
        ctx.fillStyle = glacage;
        ctx.beginPath();
        ctx.moveTo(x - rx, yb - h);
        const nd = 14;
        for (let i = 0; i <= 40; i++) {
          const th = Math.PI - (i / 40) * Math.PI;
          const px = x + Math.cos(th) * rx;
          const lg = (0.12 + 0.1 * Math.max(0, Math.sin(th * nd + rot * 3 + k))) * h;
          ctx.lineTo(px, yb - h + Math.sin(th) * ry + lg);
        }
        ctx.lineTo(x + rx, yb - h);
        ctx.ellipse(x, yb - h, rx, ry, 0, 0, Math.PI, true);
        ctx.fill();
        // Perles qui tournent.
        for (let i = 0; i < 16; i++) {
          const th = (i / 16) * Math.PI * 2 + rot;
          if (Math.sin(th) < 0) continue;
          const px = x + Math.cos(th) * rx, py = yb + Math.sin(th) * ry - e * 0.02;
          ctx.fillStyle = k % 2 ? '#ffffff' : '#ffd6ec';
          ctx.beginPath(); ctx.arc(px, py, e * 0.028 * (0.6 + 0.4 * Math.sin(th)), 0, Math.PI * 2); ctx.fill();
        }
        // Dessus.
        const dessus = ctx.createRadialGradient(x - rx * 0.3, yb - h - ry * 0.4, 0, x, yb - h, rx);
        dessus.addColorStop(0, '#ffffff'); dessus.addColorStop(1, glacage);
        ctx.fillStyle = dessus;
        ctx.beginPath(); ctx.ellipse(x, yb - h, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
        sommet = { y: yb - h, rx, ry };
        yb -= h;
      });
      // Bougies sur le dessus, triées de l'arrière vers l'avant.
      const nb = 5;
      const liste = [];
      for (let i = 0; i < nb; i++) {
        const th = (i / nb) * Math.PI * 2 + rot * 0.6;
        liste.push({ i, th, px: x + Math.cos(th) * sommet.rx * 0.6, py: sommet.y + Math.sin(th) * sommet.ry * 0.6 });
      }
      liste.sort((a, b) => a.py - b.py);
      for (const b of liste) {
        let al = D.allumages ? borne((t - D.allumages[b.i % D.allumages.length]) / 0.25) : borne((t - D.allume - b.i * 0.15) / 0.25);
        if (D.allumages && al > 0 && al < 1) gerbe(t, D.allumages[b.i], b.px, b.py - e * 0.36, 800 + b.i, { nombre: 26, vitesse: 0.2, duree: 0.6, gravite: 0.3 });
        let vent = 0;
        if (D.souffle && t > D.souffle) {
          const q = borne((t - D.souffle - b.i * 0.05) / 0.3);
          const re = D.rallume ? borne((t - D.rallume - b.i * 0.08) / 0.2) : 0;
          vent = Math.sin(q * Math.PI) * 0.9 * (1 - re);
          al = al * (1 - q) + re;
          if (q > 0.4) fumee(b.px, b.py - e * 0.36, t - D.souffle - 0.15, 1 - re, e * 0.03);
          if (re > 0 && re < 1) gerbe(t, D.rallume + b.i * 0.08, b.px, b.py - e * 0.36, 900 + b.i, { nombre: 30, vitesse: 0.25, duree: 0.7, gravite: 0.3 });
        }
        bougie(b.px, b.py, e * 0.06, e * 0.32, t, al, TEINTES[b.i % TEINTES.length], b.i * 2.3, vent);
      }
      ctx.restore();
      // Reflet qui glisse.
      faisceauLocal(x, y - e * 0.6, e * 1.3, e * 0.9, lin(t, D.t + 0.6, D.t + 1.6));
    }
    function faisceauLocal(x, y, l, h, p) {
      if (p <= 0 || p >= 1) return;
      const bx = x - l + p * l * 2;
      const d = ctx.createLinearGradient(bx - l * 0.2, 0, bx + l * 0.2, 0);
      d.addColorStop(0, 'rgba(255,255,255,0)');
      d.addColorStop(0.5, 'rgba(255,255,255,0.35)');
      d.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = d;
      ctx.fillRect(x - l, y - h, l * 2, h * 2);
      ctx.globalCompositeOperation = 'source-over';
    }

    // ------------------------------------------------------- ballons
    const COULEURS_BALLONS = [[139, 92, 246], [196, 181, 253], [249, 168, 212], [147, 197, 253], [245, 243, 255], [233, 196, 106], [124, 77, 255]];
    function ballon(x, y, r, col, rot) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.strokeStyle = 'rgba(230,220,255,0.5)';
      ctx.lineWidth = Math.max(1, r * 0.03);
      ctx.beginPath();
      ctx.moveTo(0, r * 1.05);
      ctx.bezierCurveTo(r * 0.3, r * 1.7, -r * 0.3, r * 2.3, r * 0.1, r * 3.0);
      ctx.stroke();
      ctx.fillStyle = rgba(col.map((v) => v * 0.8), 1);
      ctx.beginPath();
      ctx.moveTo(-r * 0.1, r * 1.08);
      ctx.lineTo(r * 0.1, r * 1.08);
      ctx.lineTo(0, r * 0.95);
      ctx.fill();
      const d = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, 0, r * 1.1);
      d.addColorStop(0, 'rgba(255,255,255,0.95)');
      d.addColorStop(0.25, rgba(col, 1));
      d.addColorStop(1, rgba(col.map((v) => v * 0.45), 1));
      ctx.fillStyle = d;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.86, r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.35, -r * 0.45, r * 0.14, r * 0.24, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    function ballons(D, t, graine) {
      const r = hasard(graine);
      const n = Math.round((D.nombre || 20) * (portrait ? 0.8 : 1));
      const liste = [];
      for (let i = 0; i < n; i++) {
        const prof = r();
        liste.push({ x0: r(), retard: r() * (D.fin - D.t) * 0.6, v: 0.08 + r() * 0.08, prof, col: COULEURS_BALLONS[Math.floor(r() * COULEURS_BALLONS.length)], ph: r() * 6 });
      }
      liste.sort((a, b) => a.prof - b.prof);
      const fin = 1 - lin(t, D.fin - 0.6, D.fin);
      for (const b of liste) {
        const u = t - D.t - b.retard * 0.5;
        if (u < 0) continue;
        const rad = S * (0.035 + b.prof * 0.05);
        const y = H + rad * 3 - u * H * (b.v + b.prof * 0.1);
        if (y < -rad * 4) continue;
        const x = b.x0 * W + Math.sin(u * 0.9 + b.ph) * S * 0.03;
        ctx.globalAlpha = (0.45 + 0.55 * b.prof) * fin;
        ballon(x, y, rad, b.col, 0.12 * Math.sin(u * 1.1 + b.ph));
      }
      ctx.globalAlpha = 1;
    }

    // ---------------------------------------------- confettis, serpentins
    const COUL_CONF = ['#ffffff', '#d9c9ff', '#9b6dff', '#7c4dff', '#ffd1ea', '#f9a8d4', '#a9bcff', '#f3d28b'];
    function canons(D, t) {
      const dt = t - D.t;
      if (dt < 0 || dt > 6) return;
      const r = hasard(Math.floor(D.t * 10));
      const n = Math.round(D.nombre || 260);
      const k = 1.5, g = S * 0.7, vt = g / k;
      for (let i = 0; i < n; i++) {
        const cote = i % 2 ? 1 : -1;
        const x0 = cx + cote * W * 0.5, y0 = H;
        const a = -Math.PI / 2 - cote * (0.3 + r() * 0.45);
        const v = S * (1.6 + r() * 1.6) * (portrait ? 1.25 : 1);
        const vx = Math.cos(a) * v, vy = Math.sin(a) * v;
        const e = Math.exp(-k * dt);
        const x = x0 + (vx / k) * (1 - e) + Math.sin(dt * 3 + i) * S * 0.015 * dt;
        const y = y0 + ((vy - vt) / k) * (1 - e) + vt * dt;
        if (y > H + 30) continue;
        const tl = S * (0.008 + r() * 0.01);
        const flip = Math.cos(dt * (5 + r() * 8) + i);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(r() * 6 + dt * (2 + r() * 5));
        ctx.scale(1, flip);
        ctx.globalAlpha = (0.65 + 0.35 * Math.abs(flip)) * (1 - lin(dt, 4.5, 6));
        ctx.fillStyle = COUL_CONF[i % COUL_CONF.length];
        if (i % 6 === 0) { ctx.beginPath(); ctx.arc(0, 0, tl * 0.5, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-tl * 0.5, -tl * 0.22, tl, tl * 0.44);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      gerbe(t, D.t, cx - W * 0.48, H, Math.floor(D.t) + 5, { nombre: 120, vitesse: 1.6, duree: 1.2, gravite: 0.5, aplati: 1 });
      gerbe(t, D.t, cx + W * 0.48, H, Math.floor(D.t) + 6, { nombre: 120, vitesse: 1.6, duree: 1.2, gravite: 0.5, aplati: 1 });
    }
    function serpentins(D, t) {
      if (t < D.t || t > D.fin) return;
      const r = hasard(Math.floor(D.t * 7));
      const fin = 1 - lin(t, D.fin - 0.8, D.fin);
      for (let s = 0; s < 18; s++) {
        const cote = r() < 0.5 ? r() * 0.2 : 0.8 + r() * 0.2;
        const x0 = cote * W, lg = S * (0.25 + r() * 0.25), v = H * (0.18 + r() * 0.15), ret = r() * 1.5;
        const u = t - D.t - ret;
        if (u < 0) continue;
        const yh = -lg + u * v;
        const c1 = COUL_CONF[(s * 3) % COUL_CONF.length], c2 = COUL_CONF[(s * 3 + 2) % COUL_CONF.length];
        const largeur = S * 0.012;
        const amp = S * (0.025 + r() * 0.03), fr = 2 + r() * 2, ph = r() * 6;
        let prec = null;
        for (let i = 0; i <= 26; i++) {
          const q = i / 26;
          const px = x0 + Math.sin(q * fr * Math.PI * 2 + u * 3 + ph) * amp + u * S * 0.02;
          const py = yh + q * lg;
          const tor = Math.cos(q * 9 + u * 4 + ph);
          if (prec) {
            ctx.fillStyle = tor > 0 ? c1 : c2;
            ctx.globalAlpha = (0.55 + 0.45 * Math.abs(tor)) * fin;
            const w = largeur * (0.25 + 0.75 * Math.abs(tor));
            ctx.beginPath();
            ctx.moveTo(prec[0] - prec[2], prec[1]);
            ctx.lineTo(prec[0] + prec[2], prec[1]);
            ctx.lineTo(px + w, py);
            ctx.lineTo(px - w, py);
            ctx.fill();
          }
          prec = [px, py, largeur * (0.25 + 0.75 * Math.abs(tor))];
        }
      }
      ctx.globalAlpha = 1;
    }

    // Feu d'artifice : fusée qui monte, puis gerbe.
    function feu(D, t) {
      const dt = t - D.t;
      if (dt < 0 || dt > 3.4) return;
      const bx = D.x * W, by = (portrait ? D.y * 0.8 : D.y) * H;
      const montee = 0.55;
      if (dt < montee) {
        const k = sortie(dt / montee);
        const x = bx, y = H + (by - H) * k;
        for (let j = 0; j < 8; j++) point(spriteListe[j % 2 ? 0 : 5], x + Math.sin(j) * 2, y + j * S * 0.012, S * 0.006 * (1 - j / 8), 0.9 * (1 - j / 8));
      } else {
        gerbe(t, D.t + montee, bx, by, Math.floor(D.t * 100), { nombre: 260, vitesse: 0.9, duree: 2.4, gravite: 0.35 });
        halo(bx, by, S * 0.3, 0.5 * (1 - lin(dt, montee, montee + 0.5)));
        if (dt > montee + 0.9) {
          const r = hasard(Math.floor(D.t * 100) + 1);
          for (let i = 0; i < 40; i++) {
            const a = r() * Math.PI * 2, d = S * 0.22 * (0.4 + r() * 0.6);
            scintille(bx + Math.cos(a) * d, by + Math.sin(a) * d + (dt - 1) * S * 0.08, S * 0.012, (r() > 0.5 ? 1 : 0.4) * (1 - lin(dt, 2.2, 3.4)) * (Math.sin(t * 30 + i) > 0 ? 1 : 0.2));
          }
        }
      }
    }

    // ------------------------------------------------------- cadeaux
    const CADEAUX = [['#7c4dff', '#f3d28b'], ['#f472b6', '#ffffff'], ['#60a5fa', '#f3d28b'], ['#f5f3ff', '#9b6dff'], ['#e9c46a', '#7c4dff']];
    const nuance = (hex, f) => { const v = parseInt(hex.slice(1), 16); return rgba([Math.min(255, ((v >> 16) & 255) * f), Math.min(255, ((v >> 8) & 255) * f), Math.min(255, (v & 255) * f)].map(Math.round), 1); };
    function cadeau(D, t) {
      if (D.paysage && portrait) return;
      if (t < D.t || t > D.fin) return;
      const [coul, ruban] = CADEAUX[D.couleur % CADEAUX.length];
      const s = S * L(0.2, 0.26) * (D.echelle || 1);
      const x = cx + (D.x || 0) * W, yb = cy + (D.y != null ? D.y : L(0.36, 0.3)) * H;
      const pop = retour(borne((t - D.t) / 0.4));
      const fin = 1 - entree(lin(t, D.fin - 0.25, D.fin));
      const e = pop * fin;
      if (e <= 0.01) return;
      const ouv = sortieForte(lin(t, D.ouvre, D.ouvre + 0.6));
      ctx.save();
      ctx.translate(x, yb);
      ctx.scale(e, e);
      ctx.rotate(0.05 * Math.sin((t - D.t) * 3));
      const l = s, h = s * 0.8, p = s * 0.32;
      // Faisceau de lumière qui sort de la boîte ouverte.
      if (ouv > 0) {
        ctx.globalCompositeOperation = 'lighter';
        const d = ctx.createLinearGradient(0, -h, 0, -h - S * 0.9);
        d.addColorStop(0, rgba([255, 240, 200], 0.75 * ouv));
        d.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = d;
        ctx.beginPath();
        ctx.moveTo(-l * 0.45, -h);
        ctx.lineTo(l * 0.45 + p * 0.7, -h - p * 0.5);
        ctx.lineTo(l * 1.6, -h - S * 0.9);
        ctx.lineTo(-l * 1.4, -h - S * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      // Faces : avant, côté, dessus.
      ctx.fillStyle = nuance(coul, 1);
      ctx.fillRect(-l / 2, -h, l, h);
      ctx.fillStyle = nuance(coul, 0.68);
      ctx.beginPath(); ctx.moveTo(l / 2, -h); ctx.lineTo(l / 2 + p * 0.7, -h - p * 0.5); ctx.lineTo(l / 2 + p * 0.7, -p * 0.5); ctx.lineTo(l / 2, 0); ctx.fill();
      ctx.fillStyle = nuance(ruban, 1);
      ctx.fillRect(-l * 0.08, -h, l * 0.16, h);
      ctx.fillStyle = nuance(ruban, 0.7);
      ctx.beginPath(); ctx.moveTo(l / 2 + p * 0.27, -h - p * 0.19); ctx.lineTo(l / 2 + p * 0.43, -h - p * 0.31); ctx.lineTo(l / 2 + p * 0.43, -p * 0.31); ctx.lineTo(l / 2 + p * 0.27, -p * 0.19); ctx.fill();
      // Le couvercle (et le nœud) s'envolent à l'ouverture.
      ctx.save();
      ctx.translate(ouv * l * 0.5, -ouv * S * 0.35);
      ctx.rotate(ouv * 0.9);
      ctx.fillStyle = nuance(coul, 1.25);
      ctx.beginPath(); ctx.moveTo(-l / 2 - l * 0.04, -h); ctx.lineTo(l / 2 + l * 0.04, -h); ctx.lineTo(l / 2 + p * 0.7 + l * 0.04, -h - p * 0.5); ctx.lineTo(-l / 2 + p * 0.7 - l * 0.04, -h - p * 0.5); ctx.fill();
      ctx.fillStyle = nuance(coul, 1.05);
      ctx.fillRect(-l / 2 - l * 0.04, -h, l * 1.08, h * 0.16);
      ctx.fillStyle = nuance(ruban, 1);
      ctx.fillRect(-l * 0.08, -h, l * 0.16, h * 0.16);
      ctx.beginPath(); ctx.moveTo(-l * 0.08, -h); ctx.lineTo(l * 0.08, -h); ctx.lineTo(l * 0.08 + p * 0.7, -h - p * 0.5); ctx.lineTo(-l * 0.08 + p * 0.7, -h - p * 0.5); ctx.fill();
      const nx = p * 0.35, ny = -h - p * 0.25;
      ctx.fillStyle = nuance(ruban, 0.95);
      for (const sg of [-1, 1]) { ctx.beginPath(); ctx.ellipse(nx + sg * l * 0.16, ny - l * 0.08, l * 0.17, l * 0.09, sg * 0.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = nuance(ruban, 0.75);
      ctx.beginPath(); ctx.arc(nx, ny - l * 0.04, l * 0.06, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.restore();
      if (ouv > 0) gerbe(t, D.ouvre, x + l * 0.1 * e, yb - h * e, Math.floor(D.ouvre * 10), { nombre: 120, vitesse: 0.8, duree: 1.6, gravite: -0.2, aplati: 1.4 });
    }

    // ------------------------------------------------------ projecteurs
    function projecteurs(D, t) {
      if (t < D.t || t > D.fin) return;
      const fin = 1 - lin(t, D.fin - 0.5, D.fin);
      const xs = portrait ? [0.12, 0.38, 0.62, 0.88] : [0.14, 0.38, 0.62, 0.86];
      const sol = H * L(0.86, 0.88);
      xs.forEach((px, k) => {
        const tOn = D.t + 0.5 + k * 0.3;
        if (t < tOn) return;
        const clign = t - tOn < 0.18 ? (Math.sin((t - tOn) * 90) > 0 ? 1 : 0.15) : 1;
        const sx = W * px, sy = -S * 0.02;
        const conv = sortie(lin(t, D.converge, D.converge + 1.2));
        const balaye = Math.sin(t * 0.7 + k * 1.7) * W * 0.18;
        const tx = melange(sx + balaye, cx + (k - 1.5) * W * 0.03, conv);
        const ty = melange(sol, cy + S * 0.05, conv);
        const lg = melange(W * 0.16, W * 0.1, conv);
        const a = clign * fin * 0.42;
        ctx.globalCompositeOperation = 'lighter';
        const d = ctx.createLinearGradient(sx, sy, tx, ty);
        d.addColorStop(0, rgba([235, 225, 255], a));
        d.addColorStop(1, rgba([170, 140, 255], a * 0.15));
        ctx.fillStyle = d;
        const ang = Math.atan2(ty - sy, tx - sx) + Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(sx - Math.cos(ang) * S * 0.015, sy - Math.sin(ang) * S * 0.015);
        ctx.lineTo(sx + Math.cos(ang) * S * 0.015, sy + Math.sin(ang) * S * 0.015);
        ctx.lineTo(tx + Math.cos(ang) * lg / 2, ty + Math.sin(ang) * lg / 2);
        ctx.lineTo(tx - Math.cos(ang) * lg / 2, ty - Math.sin(ang) * lg / 2);
        ctx.closePath();
        ctx.fill();
        const sp = ctx.createRadialGradient(tx, ty, 0, tx, ty, lg * 0.6);
        sp.addColorStop(0, rgba([240, 230, 255], a * 0.8));
        sp.addColorStop(1, 'rgba(240,230,255,0)');
        ctx.fillStyle = sp;
        ctx.beginPath(); ctx.ellipse(tx, ty, lg * 0.6, lg * 0.18, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        halo(sx, sy + S * 0.02, S * 0.08, 0.9 * clign * fin);
      });
    }

    // ------------------------------------------------------- calendrier
    function calendrier(D, t) {
      if (t < D.t || t > D.fin) return;
      const l = S * L(0.36, 0.5), h = l * 1.12;
      const x = cx, y = cy + L(-0.06, -0.1) * H;
      const entreeC = sortieForte(lin(t, D.t, D.t + 0.6));
      const fin = entree(lin(t, D.fin - 0.35, D.fin));
      ctx.save();
      ctx.translate(x, y + (1 - entreeC) * H * 0.3 - fin * H * 0.2);
      ctx.globalAlpha = borne(entreeC * 2) * (1 - fin);
      ctx.transform(1, 0.05 * Math.sin(t * 0.8), -0.06 * Math.cos(t * 0.6), 1, 0, 0);
      const carte = (num, a, dos) => {
        ctx.fillStyle = dos ? '#cfc4ee' : '#fbfaff';
        ctx.beginPath(); ctx.roundRect(-l / 2, -h / 2, l, h, l * 0.06); ctx.fill();
        if (dos) return;
        const tete = ctx.createLinearGradient(0, -h / 2, 0, -h / 2 + h * 0.26);
        tete.addColorStop(0, '#9b6dff'); tete.addColorStop(1, '#6d3fe0');
        ctx.fillStyle = tete;
        ctx.beginPath(); ctx.roundRect(-l / 2, -h / 2, l, h * 0.26, [l * 0.06, l * 0.06, 0, 0]); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = police(700, h * 0.09, POLICES.titre);
        ctx.letterSpacing = Math.round(h * 0.02) + 'px';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('OCTOBRE 2026', 0, -h / 2 + h * 0.14);
        ctx.letterSpacing = '0px';
        ctx.fillStyle = '#2a1a5e';
        ctx.font = police(700, h * 0.48, POLICES.titre);
        ctx.fillText(String(num), 0, h * 0.1);
        ctx.fillStyle = '#7c66b8';
        ctx.font = police(500, h * 0.07, POLICES.titre);
        ctx.letterSpacing = Math.round(h * 0.02) + 'px';
        ctx.fillText(num === 10 ? 'SAMEDI' : num === 9 ? 'VENDREDI' : num === 8 ? 'JEUDI' : 'MERCREDI', 0, h * 0.4);
        ctx.letterSpacing = '0px';
        void a;
      };
      // Pages qui tournent : 7 → 8 → 9 → 10.
      const pages = [7, 8, 9, 10];
      let courant = 7;
      for (let k = 0; k < 3; k++) if (t >= D.t + 0.7 + k * 0.35 + 0.3) courant = pages[k + 1];
      carte(courant, 1);
      // la page qui se soulève
      for (let k = 0; k < 3; k++) {
        const t0 = D.t + 0.7 + k * 0.35;
        const q = lin(t, t0, t0 + 0.3);
        if (q <= 0 || q >= 1) continue;
        ctx.fillStyle = '#fbfaff';
        carte(pages[k + 1], 1);
        ctx.save();
        ctx.translate(0, -h / 2);
        ctx.scale(1, Math.cos(q * Math.PI));
        ctx.translate(0, h / 2);
        carte(pages[k], 1, q > 0.5);
        ctx.restore();
      }
      // Anneaux de reliure.
      ctx.fillStyle = '#3b2c66';
      for (const sx of [-0.25, 0.25]) { ctx.beginPath(); ctx.roundRect(sx * l - l * 0.03, -h / 2 - h * 0.05, l * 0.06, h * 0.12, l * 0.03); ctx.fill(); }
      ctx.restore();
      ctx.globalAlpha = 1;
      const tFin = D.t + 0.7 + 3 * 0.35;
      if (t > tFin) {
        halo(x, y, S * 0.5, 0.35 * (1 - lin(t, tFin, tFin + 1.5)));
        gerbe(t, tFin, x, y, 707, { nombre: 140, vitesse: 0.7, duree: 1.6, gravite: 0.1 });
      }
    }

    // ------------------------------------------------- page qui s'ouvre
    function livre(D, t) {
      if (t < D.t || t > D.fin) return;
      const a = fenetre(t, D.t, D.fin, 0.4, 0.4);
      const l = S * L(0.26, 0.34), h = l * 1.3;
      const x = cx, y = cy + L(-0.08, -0.08) * H;
      halo(x, y, S * 0.6, 0.35 * a, [255, 230, 200]);
      rayons(x, y, t, 0.25 * a);
      const page = (sens, q, couleur) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(sens * Math.cos(q * Math.PI), 1);
        const dg = ctx.createLinearGradient(0, 0, l, 0);
        dg.addColorStop(0, '#b9a8e6');
        dg.addColorStop(0.12, couleur);
        dg.addColorStop(1, '#efe8ff');
        ctx.shadowColor = 'rgba(160,120,255,0.6)';
        ctx.shadowBlur = S * 0.04;
        ctx.fillStyle = dg;
        ctx.beginPath();
        ctx.moveTo(0, -h / 2); ctx.lineTo(l, -h / 2 + l * 0.05); ctx.lineTo(l, h / 2 - l * 0.02); ctx.lineTo(0, h / 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'rgba(120,100,180,0.25)';
        ctx.lineWidth = 1;
        for (let k = 0; k < 9; k++) { const yy = -h / 2 + h * 0.18 + k * h * 0.075; ctx.beginPath(); ctx.moveTo(l * 0.12, yy); ctx.lineTo(l * (0.85 - (k % 3) * 0.1), yy); ctx.stroke(); }
        ctx.restore();
      };
      ctx.globalAlpha = a;
      page(-1, 0, '#f3eefc');
      page(1, 0, '#fbf8ff');
      const q = douce(lin(t, D.t + 0.5, D.t + 1.6));
      if (q > 0 && q < 1) page(1, q, q > 0.5 ? '#e9e2fa' : '#ffffff');
      ctx.globalAlpha = 1;
    }

    // ------------------------------------------- le chemin parcouru
    function chemin(D, t) {
      if (t < D.t || t > D.fin) return;
      const a = fenetre(t, D.t, D.fin, 0.5, 0.5);
      const hz = cy - L(0.06, 0.02) * H;
      const recul = (t - D.t) * 0.9;
      // La route.
      const d = ctx.createLinearGradient(0, hz, 0, H);
      d.addColorStop(0, rgba([120, 90, 220], 0.5 * a));
      d.addColorStop(1, rgba([30, 20, 70], 0.9 * a));
      ctx.fillStyle = d;
      ctx.beginPath();
      ctx.moveTo(cx - W * 0.006, hz); ctx.lineTo(cx + W * 0.006, hz); ctx.lineTo(cx + W * L(0.5, 0.7), H); ctx.lineTo(cx - W * L(0.5, 0.7), H);
      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba([200, 170, 255], 0.8 * a);
      ctx.lineWidth = Math.max(1, S * 0.003);
      for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sg * W * 0.006, hz); ctx.lineTo(cx + sg * W * L(0.5, 0.7), H); ctx.stroke(); }
      halo(cx, hz, S * 0.5, 0.5 * a, [255, 200, 240]);
      // Pointillés et jalons qui s'éloignent (on regarde en arrière).
      const proj = (z) => hz + (H - hz) / z;
      for (let k = 0; k < 14; k++) {
        const z = 1 + ((k * 1.2 + recul) % 16.8);
        const y1 = proj(z), y2 = proj(z + 0.5);
        ctx.strokeStyle = rgba([255, 240, 255], 0.7 * a * borne(2 - z / 8));
        ctx.lineWidth = Math.max(1, S * 0.012 / z);
        ctx.beginPath(); ctx.moveTo(cx, y1); ctx.lineTo(cx, y2); ctx.stroke();
        for (const sg of [-1, 1]) point(spriteListe[1], cx + sg * W * L(0.5, 0.7) / z * 1.05, y1, S * 0.02 / z, a * borne(2 - z / 10));
      }
      ctx.globalCompositeOperation = 'source-over';
      // Les photos, comme des polaroïds plantés au bord du chemin.
      const cartes = photosPretes.map((P, i) => ({ P, z: 1.05 + i * 1.1 + recul * 0.3, sg: i % 2 ? 1 : -1, i }));
      cartes.sort((a1, b1) => b1.z - a1.z);
      for (const c of cartes) {
        const z = c.z;
        const yb = proj(z);
        const ch = H * L(0.62, 0.4) / z, cw = ch * 0.82;
        const xx = cx + c.sg * W * L(0.3, 0.3) / z;
        const al = a * borne(2.6 - z / 3) * borne((t - D.t - c.i * 0.15) * 3);
        if (al <= 0.01) continue;
        ctx.save();
        ctx.translate(xx, yb - ch * 0.55);
        ctx.rotate(c.sg * 0.06);
        ctx.globalAlpha = al;
        ctx.fillStyle = '#fbfaff';
        ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
        const iw = cw * 0.88, ih = ch * 0.74;
        ctx.save();
        ctx.beginPath(); ctx.rect(-iw / 2, -ch / 2 + cw * 0.06, iw, ih); ctx.clip();
        const [px, py, pw, ph] = placer(c.P, iw, ih, 1.05);
        ctx.drawImage(c.P.img, -iw / 2 + px, -ch / 2 + cw * 0.06 + py, pw, ph);
        ctx.restore();
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }

    // ------------------------------------------- affiches publicitaires
    function affiche(P, x, y, l, h, t, t0, t1, o) {
      if (!P || t < t0 || t > t1) return;
      o = o || {};
      const sens = o.sens || 1;
      const e = sortieForte(lin(t, t0, t0 + 0.55));
      const s = entree(lin(t, t1 - 0.3, t1));
      const rot = (1 - e) * 1.0 * sens;
      const dx = (1 - e) * W * 0.35 * sens - s * W * 1.1 * sens;
      const ech = 1 + 0.035 * lin(t, t0, t1);
      ctx.save();
      ctx.translate(x + dx, y);
      ctx.transform(Math.cos(rot) * ech, Math.sin(rot) * 0.22, 0, ech, 0, 0);
      ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * borne(e * 3);
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = S * 0.05;
      ctx.shadowOffsetY = S * 0.015;
      ctx.fillStyle = '#0d0820';
      ctx.fillRect(-l / 2, -h / 2, l, h);
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.shadowColor = 'transparent';
      ctx.save();
      ctx.beginPath(); ctx.rect(-l / 2, -h / 2, l, h); ctx.clip();
      const [px, py, pw, ph] = placer(P, l, h, 1.04 + 0.06 * lin(t, t0, t1));
      ctx.drawImage(P.img, -l / 2 + px - dx * 0.04, -h / 2 + py, pw, ph);
      if (o.titre) {
        const d = ctx.createLinearGradient(0, h * 0.05, 0, h / 2);
        d.addColorStop(0, 'rgba(15,8,40,0)');
        d.addColorStop(1, 'rgba(15,8,40,0.92)');
        ctx.fillStyle = d;
        ctx.fillRect(-l / 2, -h / 2, l, h);
      }
      // Reflet brillant qui traverse l'affiche.
      const b = lin(t, t0 + 0.5, t0 + 1.4);
      if (b > 0 && b < 1) {
        const bx = -l / 2 - l * 0.4 + b * l * 1.8;
        const g = ctx.createLinearGradient(bx - l * 0.15, -h / 2, bx + l * 0.15, h / 2);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.3)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(-l / 2, -h / 2, l, h);
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(235,225,255,0.55)';
      ctx.lineWidth = Math.max(1, S * 0.002);
      ctx.strokeRect(-l / 2, -h / 2, l, h);
      // Textes de l'affiche.
      const marge = l * 0.07;
      if (o.etiquette) {
        ctx.font = police(500, l * 0.035, POLICES.titre);
        ctx.letterSpacing = Math.round(l * 0.012) + 'px';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(o.etiquette, -l / 2 + marge, -h / 2 + marge);
        ctx.fillRect(-l / 2 + marge, -h / 2 + marge + l * 0.055, l * 0.18, Math.max(1, l * 0.004));
        ctx.letterSpacing = '0px';
      }
      if (o.titre) {
        let tt = l * 0.24;
        ctx.font = police(700, tt, POLICES.titre);
        const lt = ctx.measureText(o.titre).width;
        if (lt > l - marge * 2) { tt *= (l - marge * 2) / lt; ctx.font = police(700, tt, POLICES.titre); }
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        const d = ctx.createLinearGradient(0, h / 2 - marge - tt * 1.6, 0, h / 2 - marge - tt * 0.6);
        d.addColorStop(0, '#ffffff'); d.addColorStop(1, '#d8c6ff');
        ctx.fillStyle = d;
        ctx.shadowColor = 'rgba(140,90,255,0.9)'; ctx.shadowBlur = tt * 0.3;
        ctx.fillText(o.titre, -l / 2 + marge, h / 2 - marge - tt * 0.55);
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
        if (o.sous) {
          ctx.font = police(600, tt * 0.22, POLICES.texte);
          ctx.letterSpacing = Math.round(tt * 0.02) + 'px';
          ctx.fillStyle = '#f0e8ff';
          ctx.fillText(o.sous, -l / 2 + marge, h / 2 - marge);
          ctx.letterSpacing = '0px';
        }
      }
      if (o.badge) {
        const br = l * 0.12;
        ctx.save();
        ctx.translate(l / 2 - marge - br * 0.6, -h / 2 + marge + br * 0.7);
        ctx.rotate(-0.25 + 0.05 * Math.sin(t * 3));
        const g = ctx.createLinearGradient(-br, -br, br, br);
        g.addColorStop(0, '#fff2c4'); g.addColorStop(0.5, '#e9c46a'); g.addColorStop(1, '#b8902f');
        ctx.fillStyle = g;
        ctx.beginPath();
        for (let k = 0; k < 24; k++) { const ang = (k / 24) * Math.PI * 2, rr = k % 2 ? br : br * 0.88; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
        ctx.fill();
        ctx.fillStyle = '#3b2a08';
        ctx.font = police(700, br * 0.5, POLICES.titre);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(o.badge, 0, br * 0.04);
        ctx.restore();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // Photos qui dérivent en profondeur derrière le texte (parallaxe).
    function murPhotos(D, t) {
      if (t < D.t || t > D.fin) return;
      const a = fenetre(t, D.t, D.fin, 0.5, 0.4);
      const places = portrait
        ? [[0.2, 0.18, 0.5], [0.8, 0.22, 0.8], [0.25, 0.8, 0.9], [0.78, 0.78, 0.6], [0.5, 0.06, 0.4]]
        : [[0.12, 0.25, 0.5], [0.88, 0.3, 0.8], [0.2, 0.78, 0.9], [0.82, 0.76, 0.6], [0.5, 0.12, 0.35]];
      photosPretes.forEach((P, i) => {
        const [px, py, prof] = places[i % places.length];
        const dx = (t - D.t) * S * 0.03 * (prof - 0.5) * 2;
        const h = S * (0.22 + prof * 0.16), l = h * 0.8;
        affiche(P, px * W + dx, py * H, l, h, t, D.t + i * 0.12, D.fin + 1, { alpha: a * (0.3 + prof * 0.35), sens: i % 2 ? 1 : -1 });
      });
    }

    // Le badge « message officiel » et le bandeau d'information.
    function badge(D, t) {
      if (t < D.t || t > D.fin) return;
      const a = fenetre(t, D.t, D.fin, 0.2, 0.3);
      const y = H * L(0.84, 0.86);
      const hb = S * 0.07;
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(124,77,255,0.9)';
      ctx.fillRect(0, y - hb / 2, W * L(0.22, 0.34), hb);
      ctx.fillStyle = 'rgba(12,8,30,0.85)';
      ctx.fillRect(W * L(0.22, 0.34), y - hb / 2, W, hb);
      ecrire('EN DIRECT', W * L(0.11, 0.17), y, { taille: hb * 0.42, poids: 700, famille: POLICES.titre, espacement: 0.12 });
      const pt = Math.sin(t * 8) > 0 ? 1 : 0.25;
      point(spriteListe[4], W * L(0.025, 0.04), y, hb * 0.35, pt * a);
      ctx.save();
      ctx.beginPath(); ctx.rect(W * L(0.22, 0.34), y - hb / 2, W, hb); ctx.clip();
      const msg = '★ JOËL · 10 OCTOBRE · UNE NOUVELLE ANNÉE · UNE NOUVELLE ÈRE ';
      const lm = mesurer(msg, { taille: hb * 0.42, poids: 500, famille: POLICES.titre, espacement: 0.1 });
      const dec = ((t - D.t) * S * 0.25) % lm;
      for (let k = -1; k < 4; k++) ecrire(msg, W * L(0.22, 0.34) + k * lm - dec, y, { taille: hb * 0.42, poids: 500, famille: POLICES.titre, espacement: 0.1, aligne: 'left', couleur: '#e9e2ff' });
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    const ecrire = O.ecrire;

    function nuee(D, t) {
      if (t < D.t || t > D.fin) return;
      const n = D.liste.length;
      D.liste.forEach((ch, i) => {
        let x, y;
        if (D.rangee) {
          x = cx + (i - (n - 1) / 2) * S * L(0.16, 0.2);
          y = cy - H * L(0.18, 0.12);
        } else {
          const ang = (i / n) * Math.PI * 2 + 0.4;
          x = cx + Math.cos(ang) * W * L(0.36, 0.34);
          y = cy + Math.sin(ang) * H * L(0.32, 0.26);
        }
        emoji(ch, x, y, S * L(0.09, 0.11), t, D.t + i * (D.pas || 0.22), D.fin, { phase: i * 1.3 });
      });
    }
    function coeurs(D, t) {
      if (t < D.t || t > D.fin) return;
      const r = hasard(Math.floor(D.t * 3));
      const liste = ['❤️', '💜', '🤍', '💖'];
      for (let i = 0; i < 16; i++) {
        const x0 = r() * W, v = 0.12 + r() * 0.1, ret = r() * 1.5, s = S * (0.03 + r() * 0.04), ph = r() * 6;
        const u = t - D.t - ret;
        if (u < 0) continue;
        const y = H + s - u * H * v;
        emoji(liste[i % 4], x0 + Math.sin(u * 1.5 + ph) * S * 0.03, y, s, t, D.t + ret, D.fin, { phase: ph, lueur: false, alpha: 0.85 });
      }
    }
    function pluie(D, t) {
      if (t < D.t || t > D.fin) return;
      const a = fenetre(t, D.t, D.fin, 0.6, 0.8);
      const r = hasard(13);
      ctx.strokeStyle = 'rgba(170,180,230,0.35)';
      ctx.lineWidth = 1;
      ctx.globalAlpha = a;
      for (let i = 0; i < 140; i++) {
        const x = r() * W, v = 0.6 + r() * 0.6, ph = r();
        const y = (((t * v + ph) % 1) * (H + 100)) - 50;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - S * 0.004, y + S * 0.03); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    function explosion(D, t) {
      const dt = t - D.t;
      if (dt < 0 || dt > 4) return;
      onde(t, D.t, cx, cy, 1.5);
      onde(t, D.t + 0.15, cx, cy, 1.0);
      gerbe(t, D.t, cx, cy, 909, { nombre: 800, vitesse: 2.4, duree: 3.2, gravite: 0.25 });
      halo(cx, cy, S * 1.2, 1.2 * (1 - lin(dt, 0, 1.2)));
    }

    // ----------------------------------------------- les grands titres
    function titreJoel(D, t) {
      if (t < D.t || t > D.fin) return;
      const u = t - D.t;
      const a = borne(u / 0.15) * (1 - lin(t, D.fin - 0.3, D.fin));
      rayons(cx, cy, t, 0.5 * a);
      poser(T.joel, cx, cy, { alpha: a, echelle: melange(1.5, 1, sortieForte(borne(u / 0.9))) * (1 + 0.04 * u), flou: (1 - borne(u / 0.3)) * S * 0.03, reflet: 0.5, lueur: 0.9, balayage: lin(t, D.t + 0.6, D.t + 1.6) });
      const te = S * L(0.12, 0.13);
      const ecart = T.joel.largeur * 0.5 + te * 1.2;
      emoji('⭐', cx - ecart, cy - T.joel.haut * 0.15, te, t, D.t + 0.3, D.fin, { phase: 0 });
      emoji('⭐', cx + ecart, cy - T.joel.haut * 0.15, te, t, D.t + 0.45, D.fin, { phase: 2 });
      etincelles(t, D.t, D.fin, 26, 77);
      gerbe(t, D.t, cx, cy, 471, { nombre: 400, vitesse: 1.6, duree: 2.4, gravite: 0.15 });
    }

    function liste(p, t) {
      if (t < p.t || t > p.fin) return;
      const tete = sortieForte(lin(t, p.t, p.t + 0.4)) * (1 - lin(t, p.fin - 0.3, p.fin));
      const yTete = cy - H * L(0.39, 0.36);
      const tt = TAILLES.l * L(0.85, 0.9);
      // l'en-tête : lettres espacées qui se resserrent
      ecrire(p.entete, cx, yTete, { taille: tt, poids: 700, famille: POLICES.titre, espacement: melange(0.8, 0.22, tete), alpha: tete, couleur: '#ffffff', lueur: 'rgba(150,100,255,0.8)' });
      ctx.globalAlpha = tete;
      ctx.fillStyle = '#c4a8ff';
      ctx.fillRect(cx - W * 0.05 * tete, yTete + tt * 0.75, W * 0.1 * tete, Math.max(2, S * 0.004));
      ctx.globalAlpha = 1;
      p.items.forEach((it, i) => {
        const fin = i < p.items.length - 1 ? p.items[i + 1].t : p.fin;
        if (t < it.t || t > fin + 0.35) return;
        const sens = i % 2 ? -1 : 1;
        if (it.photo != null && photosPretes.length) {
          const P = photosPretes[it.photo % photosPretes.length];
          const ratio = P.ratio;
          const hb = H * L(0.56, 0.42), lb = W * L(0.5, 0.82);
          const l = Math.min(lb, hb * ratio), h = l / ratio;
          affiche(P, cx, cy + H * L(-0.02, -0.04), l, h, t, it.t - 0.05, fin + 0.3, { sens });
        } else if (it.emoji) {
          emoji(it.emoji, cx, cy - H * L(0.06, 0.06), S * L(0.2, 0.26), t, it.t, fin, { phase: i });
        }
        phrase({ t: it.t, fin, texte: it.mot, style: 'punch', taille: 'l', y: L(0.31, 0.27), sortie: 'coupe', accent: i === p.items.length - 1 ? '*' : null }, t);
      });
    }

    function grandTitre(p, t) {
      if (t < p.t || t > p.fin) return;
      const u = t - p.t;
      const a = 1 - lin(t, p.fin - 0.35, p.fin);
      const yA = cy + H * L(-0.27, -0.22);
      const yJ = cy + H * L(-0.02, -0.04);
      rayons(cx, yJ, t, 0.6 * a);
      phrase({ t: p.t, fin: p.fin, texte: 'JOYEUX ANNIVERSAIRE', style: 'punch', taille: 'xl', accent: '*', y: (yA - cy) / H, yP: (yA - cy) / H }, t);
      const k = borne((u - 0.35) / 0.8);
      poser(T.joelExcl, cx, yJ, { alpha: borne((u - 0.35) * 6) * a, echelle: melange(1.6, 1, sortieForte(k)) * (1 + 0.012 * u), flou: (1 - borne((u - 0.35) / 0.3)) * S * 0.03, reflet: 0.45, lueur: 1, balayage: lin(t, p.t + 1.2, p.t + 2.2) });
      const te = S * L(0.1, 0.11);
      const ecart = T.joelExcl.largeur * 0.5 + te * 1.1;
      if (!portrait) {
        emoji('🎂', cx - ecart, yJ, te, t, p.t + 0.6, p.fin, { phase: 0 });
        emoji('🎂', cx + ecart, yJ, te, t, p.t + 0.7, p.fin, { phase: 2 });
      }
      emoji('✨', cx - T.joelExcl.largeur * 0.45, yJ - T.joelExcl.haut * 0.75, te * 0.8, t, p.t + 0.8, p.fin, { phase: 1 });
      emoji('✨', cx + T.joelExcl.largeur * 0.45, yJ - T.joelExcl.haut * 0.75, te * 0.8, t, p.t + 0.9, p.fin, { phase: 3 });
    }

    function ecranFinal(p, t) {
      if (t < p.t) return;
      const a = 1 - lin(t, 232.6, 234);
      const Y = (pay, por) => cy + H * L(pay, por);
      const rangee = ['🎂', '🎉', '🎈', '✨'];
      rangee.forEach((ch, i) => emoji(ch, cx + (i - 1.5) * S * L(0.12, 0.16), Y(-0.41, -0.36), S * L(0.07, 0.09), t, p.t + 0.2 + i * 0.12, 233.8, { phase: i * 1.5, alpha: a }));
      phrase({ t: p.t + 0.8, fin: 234, texte: 'JOYEUX ANNIVERSAIRE', style: 'revele', taille: 'l', accent: '*', y: -0.28, yP: -0.23, sortie: 'coupe' }, t, { alpha: a });
      const u = t - p.t - 1.2;
      if (u > 0) poser(T.joelFinal, cx, Y(-0.11, -0.08), { alpha: borne(u * 4) * a, echelle: melange(1.3, 1, sortieForte(borne(u / 0.9))) * (1 + 0.004 * u), reflet: L(0, 0.3), lueur: 0.9, balayage: lin(t, p.t + 2.4, p.t + 3.4) });
      phrase({ t: p.t + 2.2, fin: 234, texte: '10 OCTOBRE', style: 'mots', taille: 'm', y: 0.07, yP: 0.04, sortie: 'coupe' }, t, { alpha: a });
      const lignes = ['Une année de plus.', 'Une histoire de plus.', 'Des rêves encore plus grands.'];
      lignes.forEach((txt, i) => phrase({ t: p.t + 3.6 + i * 1.3, fin: 234, texte: txt, style: 'revele', taille: 's', poids: 300, y: 0.17 + i * 0.055, yP: 0.1 + i * 0.033, sortie: 'coupe' }, t, { alpha: a }));
      phrase({ t: p.t + 7.6, fin: 234, texte: 'QUE L’AVENTURE CONTINUE.', style: 'punch', taille: 'm', accent: '*', emojis: ['❤️', '❤️'], y: 0.37, yP: 0.28, sortie: 'coupe', lueur: true }, t, { alpha: a });
    }

    // ---------------------------------------------------- transitions
    function transitions(t) {
      for (const [t0, type] of V.transitions) {
        const d = t - t0;
        if (type === 'flash' && d >= 0 && d < 0.3) voile('#ffffff', 0.55 * (1 - d / 0.3));
        if (type === 'whip' && d > -0.12 && d < 0.14) {
          const k = 1 - Math.abs(d) / 0.14;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalCompositeOperation = 'lighter';
          for (let i = 1; i <= 4; i++) { ctx.globalAlpha = 0.16 * k; ctx.drawImage(canvas, i * S * 0.05 * k, 0); ctx.drawImage(canvas, -i * S * 0.05 * k, 0); }
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
        }
        if (type === 'zoom' && d >= 0 && d < 0.35) {
          const k = 1 - d / 0.35;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          for (let i = 1; i <= 3; i++) {
            const e = 1 + i * 0.05 * k;
            ctx.globalAlpha = 0.22 * k;
            ctx.drawImage(canvas, cx - (W * e) / 2, cy - (H * e) / 2, W * e, H * e);
          }
          ctx.globalAlpha = 1;
        }
      }
    }
    function bandesCine(t) {
      const w = poidsFond(t, 'cine');
      if (w <= 0) return;
      const hb = portrait ? H * 0.07 : Math.max(0, (H - W / 2.39) / 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, hb * w);
      ctx.fillRect(0, H - hb * w, W, hb * w);
    }

    // ============================================ LA FÊTE (la chanson)
    // Tout suit l'air de « Joyeux anniversaire » : les paroles s'allument
    // note après note (karaoké), tout pulse sur les temps.
    const AIR = V.air || [];
    const MOTS = [
      [['JOYEUX', 0, 1], ['ANNIVERSAIRE', 2, 5]],
      [['JOYEUX', 6, 7], ['ANNIVERSAIRE', 8, 11]],
      [['JOYEUX', 12, 13], ['ANNIVERSAIRE', 14, 16], ['JOËL', 17, 18]],
      [['JOYEUX', 19, 20], ['ANNIVERSAIRE !', 21, 24]],
    ];
    const note = (k, i) => V.couplets[k] + AIR[i][1] * V.temps;
    const debutPhrase = (k, p) => note(k, MOTS[p][0][1]);
    const finPhrase = (k, p) => (p < 3 ? debutPhrase(k, p + 1) : V.couplets[k] + 24 * V.temps);
    const finChant = () => V.couplets[V.couplets.length - 1] + 22 * V.temps;

    // L'impulsion du rythme : forte sur le premier temps de chaque mesure.
    function pouls(t) {
      const s0 = V.couplets[0];
      if (!V.couplets || t < s0 || t > finChant() + 0.6) return 0;
      const x = (t - s0) / V.temps, i = Math.floor(x), f = (x - i) * V.temps;
      const fort = (((i - 1) % 3) + 3) % 3 === 0 ? 1 : 0.55;
      return fort * Math.exp(-f / 0.11);
    }
    // Cercles qui résonnent à chaque temps fort.
    function resonance(t, x, y, force) {
      const s0 = V.couplets[0];
      const x0 = (t - s0) / V.temps;
      if (x0 < 0 || t > finChant() + 1.5) return;
      ctx.globalCompositeOperation = 'lighter';
      for (let j = 0; j < 4; j++) {
        const i = Math.floor(x0) - j;
        const fort = (((i - 1) % 3) + 3) % 3 === 0;
        if (!fort && force < 0.8) continue;
        const d = t - (s0 + i * V.temps);
        if (d < 0 || d > 1.3) continue;
        const p = sortie(d / 1.3);
        const r = S * (0.12 + p * 0.75);
        ctx.globalAlpha = (1 - p) * 0.4 * force * (fort ? 1 : 0.6);
        ctx.strokeStyle = fort ? '#dcc8ff' : '#ff9fd2';
        ctx.lineWidth = S * 0.007 * (1 - p) + 1;
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * (portrait ? 1 : 0.62), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // Un mot du karaoké : gris clair, puis rempli de lumière au fil du chant.
    function motK(texte, x, y, taille, prog, alpha, ech, flou, eclat) {
      if (alpha <= 0.01) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(ech, ech);
      ctx.font = police(700, taille, POLICES.titre);
      ctx.letterSpacing = Math.round(taille * 0.03) + 'px';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const l = ctx.measureText(texte).width;
      ctx.fillStyle = 'rgba(232,224,255,1)';
      if (flou > 1) { ctx.globalAlpha = alpha * 0.22; ctx.fillText(texte, -flou, 0); ctx.fillText(texte, flou, 0); ctx.fillText(texte, -flou * 2, 0); }
      ctx.globalAlpha = alpha * (prog > 0 ? 0.5 : 0.85);
      ctx.fillText(texte, 0, 0);
      if (prog > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(-l / 2 - taille * 0.2, -taille, l * prog + taille * 0.2, taille * 2);
        ctx.clip();
        const d = ctx.createLinearGradient(0, -taille * 0.5, 0, taille * 0.5);
        d.addColorStop(0, '#ffffff'); d.addColorStop(0.5, '#e6d2ff'); d.addColorStop(1, '#ff9fd2');
        ctx.fillStyle = d;
        ctx.shadowColor = 'rgba(190,120,255,0.95)';
        ctx.shadowBlur = taille * 0.35 * (eclat || 1);
        ctx.globalAlpha = alpha;
        ctx.fillText(texte, 0, 0);
        ctx.restore();
      }
      ctx.restore();
      ctx.letterSpacing = '0px';
      ctx.globalAlpha = 1;
    }

    function taillesK() {
      const tA = Math.min(S * 0.115, (W * 0.86) / 7.7);
      return { tA, tJ: tA * 0.72 };
    }
    // Les paroles d'un couplet, synchronisées sur les notes.
    function paroles(k, t, o) {
      const { tA, tJ } = taillesK();
      const y0 = cy + (portrait && o.yP != null ? o.yP : o.y) * H;
      for (let p = 0; p < 4; p++) {
        const a0 = debutPhrase(k, p) - 0.15;
        const a1 = p === 3 && o.fin ? o.fin : finPhrase(k, p) - 0.03;
        if (t < a0 || t > a1) continue;
        const q = o.coupe ? 0 : lin(t, a1 - 0.14, a1);
        MOTS[p].forEach(([mot, i0, i1], j) => {
          const tw = note(k, i0);
          const yw = j === 0 ? y0 - tA * 0.95 : j === 1 ? y0 : y0 + tA * 1.4;
          let prog = 0;
          for (let i = i0; i <= i1; i++) prog += borne((t - note(k, i)) / Math.min(0.25, AIR[i][2] * V.temps));
          prog /= i1 - i0 + 1;
          let bump = 0;
          for (let i = i0; i <= i1; i++) { const d = t - note(k, i); if (d >= 0) bump = Math.max(bump, Math.exp(-d / 0.12)); }
          const u = t - tw;
          const kk = borne((u + 0.05) / 0.35);
          const e = sortieForte(kk);
          const sens = (j + p) % 2 ? 1 : -1;
          let dx = 0, dy = 0, ech = 1 + 0.09 * bump, flou = 0;
          switch (o.entree) {
            case 'glisse': dx = (1 - e) * W * 0.65 * sens; flou = (1 - e) * tA * 0.9; break;
            case 'vole': dx = (1 - e) * W * 0.45 * sens; dy = -(1 - e) * H * 0.35; flou = (1 - e) * tA * 0.6; ech *= 1 + (1 - e) * 0.7; break;
            case 'zoom': ech *= melange(2.4, 1, e); flou = (1 - e) * tA * 0.5; break;
            default: dy = (1 - retour(kk)) * tA * 0.7; ech *= 0.55 + 0.45 * retour(kk); flou = (1 - kk) * tA * 0.4;
          }
          if (o.flotte) dy += Math.sin(t * 2.4 + j * 1.3 + p) * tA * 0.08;
          if (q > 0) { dy -= q * tA * 0.7 * (j + 1); ech *= 1 + q * 0.5; flou = Math.max(flou, q * tA * 0.5); }
          const alpha = (u >= -0.05 ? borne(kk * 3) : 0) * (1 - q) * (o.alpha == null ? 1 : o.alpha);
          if (mot === 'JOËL') {
            if (u < -0.05) return;
            poser(T.joelK, cx + dx, yw + dy, { alpha, echelle: ech * (1 + 0.08 * bump) * melange(1.6, 1, e), flou: flou * 0.5, reflet: 0, lueur: 0.8 + bump, balayage: lin(t, tw + 0.15, tw + 0.85) });
            onde(t, tw, cx, yw, 0.8);
            gerbe(t, tw, cx, yw, 3000 + k * 10, { nombre: 220, vitesse: 1.3, duree: 1.4, gravite: 0.2 });
            return;
          }
          const tt = j === 0 ? tJ : tA;
          if (u < -0.05) { motK(mot, cx, yw, tt, 0, 0.16 * (1 - q), 1, 0); return; }
          motK(mot, cx + dx, yw + dy, tt, prog, alpha, ech, flou, 1 + bump);
          if (bump > 0.6 && prog > 0) {
            const px = cx - (tt * mot.length * 0.33) + prog * tt * mot.length * 0.66;
            point(spriteListe[0], px, yw, tt * 0.35 * bump, 0.8 * bump);
          }
        });
      }
      ctx.globalAlpha = 1;
    }

    // Emojis qui courent en file à travers l'écran (traînée floue, petits sauts).
    function defile(liste, t, t0, t1, y, sens, taille, vitesse) {
      if (t < t0 || t > t1) return;
      const u = t - t0;
      const ecart = taille * 1.7;
      for (let i = 0; i < liste.length; i++) {
        const pos = u * vitesse * W - i * ecart;
        if (pos < -taille * 2 || pos > W + taille * 4) continue;
        const x = sens > 0 ? -taille + pos : W + taille - pos;
        const saut = Math.abs(Math.sin(u * 10 + i * 1.3)) * taille * 0.4;
        const img = imageEmoji(liste[i]);
        for (let g = 3; g >= 1; g--) {
          ctx.globalAlpha = 0.1 * (4 - g);
          const xg = x - sens * g * taille * 0.4;
          ctx.drawImage(img, xg - taille * 0.6, y - saut - taille * 0.6, taille * 1.2, taille * 1.2);
        }
        ctx.save();
        ctx.translate(x, y - saut);
        ctx.rotate(sens * 0.18 + Math.sin(u * 10 + i) * 0.12);
        ctx.globalAlpha = 1;
        ctx.drawImage(img, -taille * 0.62, -taille * 0.62, taille * 1.24, taille * 1.24);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    // Emojis qui volent en vagues, avec une traînée d'étincelles.
    function volants(t, t0, t1, liste, graine, densiteV) {
      const r = hasard(graine);
      const n = Math.round((t1 - t0) * 2.2 * densiteV);
      for (let i = 0; i < n; i++) {
        const dep = t0 + r() * Math.max(0.1, t1 - t0 - 1), duree = 1.6 + r() * 1.8, sens = r() < 0.5 ? 1 : -1;
        const y0 = H * (0.08 + r() * 0.84), amp = S * (0.04 + r() * 0.1), fr = 1 + r() * 2, s = S * (0.035 + r() * 0.04), ch = liste[i % liste.length], ph = r() * 6;
        const u = (t - dep) / duree;
        if (u < 0 || u > 1) continue;
        const x = sens > 0 ? -s + u * (W + 2 * s) : W + s - u * (W + 2 * s);
        const y = y0 + Math.sin(u * Math.PI * 2 * fr + ph) * amp - u * S * 0.1;
        const pente = Math.cos(u * Math.PI * 2 * fr + ph) * amp * Math.PI * 2 * fr / (W + 2 * s);
        ctx.globalCompositeOperation = 'lighter';
        for (let g = 1; g <= 5; g++) {
          const ug = u - g * 0.012;
          const xg = sens > 0 ? -s + ug * (W + 2 * s) : W + s - ug * (W + 2 * s);
          const yg = y0 + Math.sin(ug * Math.PI * 2 * fr + ph) * amp - ug * S * 0.1;
          point(spriteListe[g % 2 ? 1 : 4], xg, yg, s * 0.2 * (1 - g / 6), 0.6 * (1 - g / 6));
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.atan(pente) * sens * 0.8);
        ctx.globalAlpha = 0.95;
        ctx.drawImage(imageEmoji(ch), -s * 0.62, -s * 0.62, s * 1.24, s * 1.24);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    function polaroid(P, x, y, h, rot, alpha) {
      if (alpha <= 0.01) return;
      const w = h * 0.82;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.globalAlpha = alpha;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = h * 0.08;
      ctx.fillStyle = '#fbfaff';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      const iw = w * 0.88, ih = h * 0.74;
      ctx.beginPath(); ctx.rect(-iw / 2, -h / 2 + w * 0.06, iw, ih); ctx.clip();
      const [px, py, pw, ph] = placer(P, iw, ih, 1.05);
      ctx.drawImage(P.img, -iw / 2 + px, -h / 2 + w * 0.06 + py, pw, ph);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    // Les photos tournent en orbite autour des paroles.
    function orbite(t, t0, t1, y0) {
      if (t < t0 || t > t1 || !photosPretes.length) return;
      const a = fenetre(t, t0, t1, 0.8, 0.5);
      const n = photosPretes.length;
      const rx = W * L(0.4, 0.36), ry = H * L(0.34, 0.3);
      const items = photosPretes.map((P, i) => {
        const th = (i / n) * Math.PI * 2 + (t - t0) * 0.55;
        return { P, i, th, z: Math.sin(th) };
      }).sort((p1, p2) => p1.z - p2.z);
      for (const it of items) {
        const prof = (it.z + 1) / 2;
        const x = cx + Math.cos(it.th) * rx;
        const y = y0 + Math.sin(it.th) * ry;
        polaroid(it.P, x, y, S * L(0.26, 0.22) * (0.65 + 0.35 * prof), Math.cos(it.th) * 0.12, a * (0.45 + 0.55 * prof));
      }
    }

    FOND.club = function (t, a) {
      fondNebuleuse(t, 0.5 * a);
      const pz = pouls(t);
      const cols = [[255, 120, 200], [140, 100, 255], [90, 160, 255], [255, 210, 120]];
      ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 4; k++) {
        const sx = W * (0.1 + k * 0.27), sy = -S * 0.05;
        const ang = Math.PI / 2 + Math.sin(t * 1.3 + k * 1.7) * 0.6;
        const lg = S * 1.8, ou = 0.13;
        const d = ctx.createLinearGradient(sx, sy, sx + Math.cos(ang) * lg, sy + Math.sin(ang) * lg);
        d.addColorStop(0, rgba(cols[k], 0.32 * a * (0.55 + 0.6 * pz)));
        d.addColorStop(1, rgba(cols[k], 0));
        ctx.fillStyle = d;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(ang - ou) * lg, sy + Math.sin(ang - ou) * lg);
        ctx.lineTo(sx + Math.cos(ang + ou) * lg, sy + Math.sin(ang + ou) * lg);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      etoiles(t, 0.45 * a, { part: 0.7 });
      poussieres(t, 0.5 * a, 1);
    };

    // ---------------------------------------------------- les couplets
    function couplet1(t) {
      const s = V.couplets[0], fin = V.couplets[1];
      if (t > fin + 0.3) return;
      if (t < 1.3) halo(cx, cy, S * (0.05 + 0.4 * t), 0.7 * lin(t, 0, 0.5) * (1 - lin(t, 0.9, 1.4)));
      etincelles(t, 0, fin + 0.3, 34, 21);
      volants(t, s + 0.5, fin, ['✨', '⭐', '💫', '✨'], 31, 0.55);
      gateau({ t: 0.3, fin: fin + 0.3, allumages: [0, 6, 12, 17, 19].map((i) => note(0, i)), y: L(0.24, 0.22), yP: 0.22, echelle: L(0.62, 0.8) }, t);
      paroles(0, t, { y: -0.24, yP: -0.24, flotte: true });
    }

    function couplet2(t) {
      const s = V.couplets[1], fin = V.couplets[2];
      if (t < s - 0.3 || t > fin + 0.3) return;
      ballons({ t: s - 0.6, fin: fin + 0.4, nombre: 24 }, t, 13);
      volants(t, s, fin, ['🎈', '🎉', '🎊', '🥳', '🎁'], 41, 0.9);
      const textes = [
        { texte: 'C’EST TON JOUR, JOËL !', style: 'vole', taille: 'l', accent: ['JOËL'] },
        { texte: 'BON ANNIVERSAIRE !', style: 'chute', taille: 'xl', accent: '*' },
        { texte: '10 OCTOBRE', style: 'glisse', taille: 'xl', emoji: '🎂' },
        { texte: 'FAIS UN VŒU', style: 'revele', taille: 'xl', emojis: ['✨', '✨'], lueur: true },
      ];
      for (let p = 0; p < 4; p++) {
        const a0 = debutPhrase(1, p), a1 = finPhrase(1, p);
        phrase(Object.assign({ type: 'texte', t: a0, fin: a1 - 0.02, y: L(-0.14, -0.14), sortie: 'explose', flotte: true }, textes[p]), t, { echelle: 1 + 0.06 * pouls(t) });
        if (t >= a0 && t <= a1) {
          const sens = p % 2 ? 1 : -1;
          const glisse = sortieForte(lin(t, a0, a0 + 0.55));
          const part = entree(lin(t, a1 - 0.3, a1));
          cadeau({ t: a0, fin: a1, ouvre: a0 + 1.4, couleur: p, x: sens * (1 - glisse) * 0.7 - sens * part * 0.7, y: L(0.36, 0.3), echelle: L(1, 1.1) }, t);
        }
      }
    }

    function couplet3(t) {
      const s = V.couplets[2], fin = V.couplets[3];
      if (t < s - 0.3 || t > fin + 0.3) return;
      resonance(t, cx, cy, 0.9);
      for (let p = 0; p < 4; p++) {
        const a0 = debutPhrase(2, p), a1 = finPhrase(2, p);
        if (photosPretes.length && t >= a0 - 0.1 && t <= a1 + 0.3) {
          const Ph = photosPretes[p % photosPretes.length];
          const hb = H * L(0.6, 0.44), lb = W * L(0.46, 0.8);
          const l = Math.min(lb, hb * Ph.ratio), h = l / Ph.ratio;
          affiche(Ph, cx, cy + H * L(-0.1, -0.13), l, h, t, a0 - 0.1, a1 + 0.25, { sens: p % 2 ? -1 : 1 });
        }
        defile(['🎂', '🎁', '🎈', '🥳', '🎉', '🎊'], t, a0, a1 + 0.6, H * L(0.08, 0.06), p % 2 ? -1 : 1, S * L(0.07, 0.08), 0.6);
        if (portrait) defile(['🎈', '🎉', '🎂', '🎁'], t, a0 + 0.3, a1 + 0.9, H * 0.95, p % 2 ? 1 : -1, S * 0.08, 0.7);
      }
      paroles(2, t, { y: L(0.19, 0.19), entree: 'glisse', coupe: true, alpha: 1 });
    }

    function couplet4(t) {
      const s = V.couplets[3], fin = V.couplets[4];
      if (t < s - 0.3 || t > fin + 0.3) return;
      const d = s + 0.5;
      ballons({ t: d, fin: fin + 0.3, nombre: 22 }, t, 37);
      resonance(t, cx, cy, 1);
      explosion({ t: d }, t);
      serpentins({ t: d, fin: s + 6.5 }, t);
      for (const [x, y, dt] of [[0.2, 0.25, 0.3], [0.8, 0.22, 0.9], [0.5, 0.12, 1.6]]) feu({ t: d + dt - 0.55, x, y }, t);
      // « JOYEUX ANNIVERSAIRE JOËL ! »
      grandTitre({ t: d - 0.05, fin: debutPhrase(3, 1) - 0.02 }, t);
      // « SOUFFLE TES BOUGIES ! »
      const b0 = debutPhrase(3, 1), b1 = finPhrase(3, 1);
      phrase({ type: 'texte', t: b0, fin: b1 - 0.02, texte: 'SOUFFLE TES BOUGIES !', style: 'chute', taille: 'l', y: L(-0.32, -0.27), accent: ['BOUGIES'], sortie: 'explose', flotte: true }, t, { echelle: 1 + 0.05 * pouls(t) });
      gateau({ t: b0 - 0.1, fin: b1 + 0.15, allume: b0, souffle: s + 4.75, rallume: s + 5.4, y: L(0.2, 0.16), echelle: L(0.72, 0.9) }, t);
      // « HIP HIP HIP… HOURRA ! »
      const hips = [[14, 'HIP'], [15, 'HIP'], [16, 'HIP…']];
      const tH = note(3, 17);
      const finH = finPhrase(3, 2) - 0.02;
      hips.forEach(([i, mot], j) => {
        const th = note(3, i);
        const ex = portrait ? 0 : (j - 1) * W * 0.22;
        const ey = portrait ? -0.26 + j * 0.085 : -0.12;
        phrase({ type: 'texte', t: th, fin: tH + 0.4, texte: mot, style: 'punch', taille: 'xl', x: ex / W, xP: 0, y: ey, yP: ey, sortie: 'explose' }, t, { echelle: 1 + 0.08 * pouls(t) });
        if (t >= th) onde(t, th, cx + ex, cy + ey * H, 0.6);
      });
      phrase({ type: 'texte', t: tH, fin: finH, texte: 'HOURRA !', style: 'punch', taille: 'xl', accent: '*', y: L(0.12, 0.12), rayons: true, sortie: 'explose' }, t, { echelle: 1.25 + 0.1 * pouls(t) });
      if (t >= tH && t < tH + 3) {
        explosion({ t: tH }, t);
        canons({ t: tH, nombre: 300 }, t);
        feu({ t: tH - 0.1, x: 0.25, y: 0.2 }, t);
        feu({ t: tH + 0.4, x: 0.75, y: 0.18 }, t);
      }
      // « QUE LA FÊTE COMMENCE ! »
      const c0 = debutPhrase(3, 3);
      phrase({ type: 'texte', t: c0, fin: fin - 0.02, texte: 'QUE LA FÊTE COMMENCE !', style: 'vole', taille: 'l', emojis: ['🎉', '🎉'], accent: ['FÊTE'], sortie: 'explose', flotte: true }, t, { echelle: 1 + 0.06 * pouls(t) });
      defile(['🎉', '🎂', '🎈', '🎁', '🥳', '🎊', '🎈'], t, c0, fin + 0.6, H * L(0.82, 0.8), 1, S * 0.08, 0.6);
      defile(['🎈', '🎁', '🎂', '🎉'], t, c0 + 0.3, fin + 0.9, H * L(0.16, 0.2), -1, S * 0.07, 0.7);
    }

    function couplet5(t) {
      const s = V.couplets[4], f = finChant();
      if (t < s - 0.3 || t > f + 0.4) return;
      orbite(t, s - 0.2, f + 0.4, cy + H * L(0.0, -0.02));
      resonance(t, cx, cy, 0.7);
      volants(t, s, f, ['✨', '💜', '🎈', '⭐', '🎂'], 51, 0.8);
      for (const [dt, x, y] of [[3.2, 0.15, 0.2], [6.2, 0.85, 0.2], [9.1, 0.5, 0.12]]) feu({ t: s + dt - 0.55, x, y }, t);
      paroles(4, t, { y: L(-0.06, -0.08), entree: 'zoom', flotte: true, fin: f + 0.3 });
    }

    function finaleFete(t) {
      const t0 = finChant();
      if (t < t0) return;
      const a = 1 - lin(t, 64.0, 65.0);
      ballons({ t: t0 - 0.8, fin: 65, nombre: 26 }, t, 61);
      explosion({ t: t0 }, t);
      canons({ t: t0, nombre: 380 }, t);
      for (const [dt, x, y] of [[0.3, 0.2, 0.22], [0.9, 0.8, 0.2], [1.6, 0.5, 0.12]]) feu({ t: t0 + dt - 0.55, x, y }, t);
      O.confettis(t, t0 + 0.6, { pluie: true, nombre: 220, graine: 17, fin: 64.8 });
      rayons(cx, cy, t, 0.5 * a);
      etincelles(t, t0, 65, 30, 99);
      ['🎂', '🎉', '🎈', '✨'].forEach((ch, i) => emoji(ch, cx + (i - 1.5) * S * L(0.12, 0.16), cy + H * L(-0.39, -0.33), S * L(0.07, 0.09), t, t0 + 0.4 + i * 0.12, 64.9, { phase: i * 1.5, alpha: a }));
      phrase({ type: 'texte', t: t0, fin: 65, texte: 'JOYEUX ANNIVERSAIRE', style: 'punch', taille: 'l', accent: '*', y: L(-0.24, -0.2), sortie: 'coupe', flotte: true }, t, { alpha: a, echelle: 1 + 0.04 * Math.sin((t - t0) * 3) });
      const u = t - t0 - 0.25;
      if (u > 0) poser(T.joelExcl, cx, cy + H * L(-0.02, -0.05), { alpha: borne(u * 5) * a, echelle: melange(1.5, 1, sortieForte(borne(u / 0.85))) * (1 + 0.03 * Math.sin(u * 3)), reflet: 0.3, lueur: 1, balayage: lin(t, t0 + 1.2, t0 + 2.2) });
      phrase({ type: 'texte', t: t0 + 1.0, fin: 65, texte: '10.10.2026', style: 'chute', taille: 'm', y: L(0.2, 0.12), sortie: 'coupe', flotte: true }, t, { alpha: a });
    }

    function dessinerFete(t) {
      fonds(t);
      neuf(); couplet1(t);
      neuf(); couplet2(t);
      neuf(); couplet3(t);
      neuf(); couplet4(t);
      neuf(); couplet5(t);
      neuf(); finaleFete(t);
      neuf();
      transitions(t);
      if (t >= 64.0) voile('#000000', lin(t, 64.0, 65));
    }

    // ===================================================== préparation
    const T = {};
    function preparer() {
      T.joel = titre('pub-joel', 'JOËL', { style: 'metal', taille: S * L(0.34, 0.38), maxL: W * L(0.6, 0.78) });
      T.joelExcl = titre('pub-joel-excl', 'JOËL !', { style: 'metal', taille: S * L(0.24, 0.3), maxL: W * L(0.56, 0.76) });
      T.joelK = titre('fete-joel', 'JOËL', { style: 'metal', taille: S * L(0.2, 0.22), maxL: W * 0.7 });
      T.joelFinal = titre('pub-joel-final', 'JOËL !', { style: 'metal', taille: S * L(0.2, 0.3), maxL: W * L(0.5, 0.76) });
      for (const ch of ['💫', '🎁', '✨', '🎉', '🚨', '🕯️', '🎂', '🎊', '⭐', '❤️', '🎈', '🥂', '🌟', '🔥', '💪', '💭', '🚀', '🏆', '🔭', '😊', '🤝', '📸', '📚', '💡', '🥳', '😄', '😁', '🤩', '💜', '🤍', '💖']) imageEmoji(ch);
    }

    const DECORS_AVANT = { calendrier, projecteurs, bougies: bougiesGeantes, page: livre, chemin, murPhotos, pluie, titreJoel, affiche: null, explosion, serpentins };
    const DECORS_APRES = { gateau, cadeau, ballons: null, canons, feux: feu, nuee, coeurs, badge, etincelles: null };
    const neuf = () => { ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; };

    // ===================================================== une image
    function dessiner(t) {
      if (V.nom === 'fete') return dessinerFete(t);
      fonds(t);
      // Décors de fond (derrière les textes).
      for (const D of V.decors) {
        if (D.type === 'affiche') {
          if (t >= D.t && t <= D.fin && photosPretes.length) {
            const P = photosPretes[D.photo % photosPretes.length];
            const hb = H * L(0.8, 0.62), lb = W * L(0.42, 0.86);
            const ratio = D.cinema ? 0.72 : P.ratio;
            const l = Math.min(lb, hb * ratio), h = l / ratio;
            affiche(P, cx, cy, l, h, t, D.t, D.fin, { titre: D.titre, sous: D.sous, etiquette: D.etiquette, badge: D.badge });
          }
          continue;
        }
        if (D.type === 'ballons' && t >= D.t && t <= D.fin) { ballons(D, t, Math.floor(D.t)); continue; }
        if (D.type === 'etincelles') { if (t >= D.t && t <= D.fin) etincelles(t, D.t, D.fin, 30, 5); continue; }
        const f = DECORS_AVANT[D.type];
        if (f) { neuf(); f(D, t); }
      }
      // Les textes.
      for (const p of V.plans) {
        if (t < p.t - 0.05 || t > p.fin + 0.05) continue;
        neuf();
        if (p.type === 'texte') phrase(p, t);
        else if (p.type === 'pile') pile(p, t);
        else if (p.type === 'liste') liste(p, t);
        else if (p.type === 'grandTitre') grandTitre(p, t);
        else if (p.type === 'final') ecranFinal(p, t);
      }
      // Décors de premier plan.
      for (const D of V.decors) {
        const f = DECORS_APRES[D.type];
        if (f) { neuf(); f(D, t); }
      }
      neuf();
      transitions(t);
      bandesCine(t);
      if (t >= 233.0) voile('#000000', lin(t, 233.0, 234));
    }

    return { preparer, dessiner };
  }

  racine.JoelPub = { creer };
})(typeof self !== 'undefined' ? self : this);
