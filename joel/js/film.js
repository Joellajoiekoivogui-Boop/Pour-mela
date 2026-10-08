// Le film de Joël : chaque image est calculée à partir du temps seul
// (dessiner(t)), sans état caché. On peut donc le lire en direct dans le
// navigateur ou le rendre image par image en vidéo, avec le même résultat.
(function (racine) {
  'use strict';

  const Partition = racine.JoelPartition;

  // ------------------------------------------------------------ outils
  const borne = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lin = (t, a, b) => borne((t - a) / (b - a));
  const melange = (a, b, x) => a + (b - a) * x;
  const sortie = (x) => 1 - Math.pow(1 - x, 3);
  const sortieForte = (x) => 1 - Math.pow(1 - x, 5);
  const entree = (x) => x * x * x;
  const douce = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const lisse = (x) => x * x * (3 - 2 * x);
  // Visibilité dans une fenêtre [a, b] avec fondus d'entrée et de sortie.
  const fenetre = (t, a, b, fi, fo) => (t < a || t > b ? 0 : Math.min(fi > 0 ? lin(t, a, a + fi) : 1, fo > 0 ? 1 - lin(t, b - fo, b) : 1));

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

  function toile(l, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(l));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  }

  const COULEURS = {
    blanc: [255, 255, 255],
    lavande: [205, 185, 255],
    violet: [150, 90, 255],
    electrique: [124, 77, 255],
    bleu: [88, 128, 255],
    nuit: [22, 30, 80],
    rose: [255, 160, 210],
  };
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';

  const POLICES = {
    titre: '"Space Grotesk", "Sora", "Inter", system-ui, sans-serif',
    texte: '"Sora", "Inter", system-ui, sans-serif',
    code: '"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, "DejaVu Sans Mono", monospace',
  };
  const AFFICHAGES_POLICES = ['300 64px "Space Grotesk"', '500 64px "Space Grotesk"', '700 64px "Space Grotesk"', '300 64px "Sora"', '600 64px "Sora"'];

  // =================================================================
  function creer(canvas, options) {
    options = options || {};
    const W = canvas.width;
    const H = canvas.height;
    const portrait = H > W;
    const S = Math.min(W, H);
    const cx = W / 2;
    const cy = H / 2;
    const ctx = canvas.getContext('2d');
    const nomVersion = options.version === 'courte' ? 'courte' : 'longue';
    const V = Partition.versions[nomVersion];
    const photos = (options.photos || []).filter((p) => p && p.naturalWidth);
    const grain = options.grain !== false;
    const L = (paysage, vertical) => (portrait ? vertical : paysage);
    const densite = borne((W * H) / (1920 * 1080), 0.6, 2.2);

    // ------------------------------------------------- caméra (profondeur)
    const PAS_Z = 1 / 120;
    const tableZ = new Float32Array(Math.ceil(V.duree / PAS_Z) + 2);
    function vitesse(t) {
      const v = V.vitesse;
      if (t <= v[0][0]) return v[0][1];
      for (let i = 1; i < v.length; i++) if (t <= v[i][0]) return melange(v[i - 1][1], v[i][1], (t - v[i - 1][0]) / (v[i][0] - v[i - 1][0]));
      return v[v.length - 1][1];
    }
    for (let i = 1; i < tableZ.length; i++) tableZ[i] = tableZ[i - 1] + vitesse(i * PAS_Z) * PAS_Z;
    function camZ(t) {
      const x = borne(t, 0, V.duree) / PAS_Z;
      const i = Math.floor(x);
      return melange(tableZ[i], tableZ[Math.min(i + 1, tableZ.length - 1)], x - i);
    }

    // ------------------------------------------------------- sprites
    const sprites = {};
    function sprite(nom) {
      if (sprites[nom]) return sprites[nom];
      const c = toile(64, 64);
      const g = c.getContext('2d');
      const col = COULEURS[nom];
      const d = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      d.addColorStop(0, rgba([255, 255, 255], 1));
      d.addColorStop(0.12, rgba(col, 0.95));
      d.addColorStop(0.35, rgba(col, 0.32));
      d.addColorStop(1, rgba(col, 0));
      g.fillStyle = d;
      g.fillRect(0, 0, 64, 64);
      return (sprites[nom] = c);
    }
    const SPRITES_NOMS = ['blanc', 'lavande', 'violet', 'bleu', 'rose', 'electrique'];
    const spriteListe = SPRITES_NOMS.map(sprite);
    // Bokeh : un disque flou, pour la profondeur de champ.
    const bokeh = (function () {
      const c = toile(128, 128);
      const g = c.getContext('2d');
      const d = g.createRadialGradient(64, 64, 30, 64, 64, 64);
      d.addColorStop(0, 'rgba(200,180,255,0.35)');
      d.addColorStop(0.8, 'rgba(160,120,255,0.18)');
      d.addColorStop(1, 'rgba(160,120,255,0)');
      g.fillStyle = d;
      g.fillRect(0, 0, 128, 128);
      return c;
    })();

    function point(sp, x, y, r, a) {
      if (a <= 0.003 || r <= 0.05) return;
      ctx.globalAlpha = a > 1 ? 1 : a;
      ctx.drawImage(sp, x - r, y - r, r * 2, r * 2);
    }

    // --------------------------------------------- nébuleuse et vignette
    const nebuleuse = (function () {
      const l = Math.ceil(W / 4), h = Math.ceil(H / 4);
      const c = toile(l, h);
      const g = c.getContext('2d');
      const r = hasard(7);
      const taches = [[COULEURS.electrique, 0.32], [COULEURS.nuit, 0.7], [COULEURS.bleu, 0.18], [COULEURS.rose, 0.07], [COULEURS.violet, 0.22], [COULEURS.nuit, 0.6]];
      for (const [col, a] of taches) {
        const x = l * (0.15 + r() * 0.7), y = h * (0.15 + r() * 0.7), rad = Math.max(l, h) * (0.25 + r() * 0.35);
        const d = g.createRadialGradient(x, y, 0, x, y, rad);
        d.addColorStop(0, rgba(col, a));
        d.addColorStop(1, rgba(col, 0));
        g.fillStyle = d;
        g.fillRect(0, 0, l, h);
      }
      return c;
    })();
    function fondNebuleuse(t, a) {
      if (a <= 0) return;
      const e = 1.25 + 0.05 * Math.sin(t * 0.07);
      const dx = Math.sin(t * 0.031) * W * 0.04, dy = Math.cos(t * 0.027) * H * 0.04;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      ctx.drawImage(nebuleuse, cx - (W * e) / 2 + dx, cy - (H * e) / 2 + dy, W * e, H * e);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    const vignette = (function () {
      const c = toile(W, H);
      const g = c.getContext('2d');
      const d = g.createRadialGradient(cx, cy, S * 0.35, cx, cy, Math.hypot(cx, cy) * 1.05);
      d.addColorStop(0, 'rgba(0,0,0,0)');
      d.addColorStop(1, 'rgba(0,0,0,0.78)');
      g.fillStyle = d;
      g.fillRect(0, 0, W, H);
      return c;
    })();

    const tuileGrain = (function () {
      const c = toile(256, 256);
      const g = c.getContext('2d');
      const img = g.createImageData(256, 256);
      const r = hasard(99);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 128 + (r() - 0.5) * 120;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      return c;
    })();

    // ----------------------------------------------------- texte simple
    function police(poids, taille, famille) {
      return poids + ' ' + Math.round(taille) + 'px ' + (famille || POLICES.texte);
    }
    function ecrire(texte, x, y, o) {
      const taille = o.taille;
      ctx.font = police(o.poids || 300, taille, o.famille);
      ctx.letterSpacing = Math.round((o.espacement || 0) * taille) + 'px';
      ctx.textAlign = o.aligne || 'center';
      ctx.textBaseline = 'middle';
      const decal = o.aligne === 'left' ? 0 : ((o.espacement || 0) * taille) / 2;
      ctx.globalAlpha = borne(o.alpha == null ? 1 : o.alpha);
      if (o.lueur) {
        ctx.shadowColor = o.lueur;
        ctx.shadowBlur = taille * 0.6;
      }
      ctx.fillStyle = o.couleur || '#fff';
      ctx.fillText(texte, x + decal, y);
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.letterSpacing = '0px';
      ctx.globalAlpha = 1;
    }
    function mesurer(texte, o) {
      ctx.font = police(o.poids || 300, o.taille, o.famille);
      ctx.letterSpacing = Math.round((o.espacement || 0) * o.taille) + 'px';
      const l = ctx.measureText(texte).width;
      ctx.letterSpacing = '0px';
      return l;
    }
    // Texte qui apparaît dans un léger flou (plusieurs passes décalées).
    function ecrireFlou(texte, x, y, o, apparition) {
      const a = (o.alpha == null ? 1 : o.alpha) * apparition;
      if (a <= 0.005) return;
      const flou = (1 - apparition) * o.taille * 0.25;
      if (flou > 0.5) {
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ecrire(texte, x + dx * flou, y + dy * flou, Object.assign({}, o, { alpha: a * 0.3, lueur: null }));
      }
      ecrire(texte, x, y + (1 - apparition) * o.taille * 0.3, Object.assign({}, o, { alpha: a }));
    }
    // Découpe un texte en lignes qui tiennent dans la largeur donnée.
    function couper(texte, o, largeur) {
      const mots = texte.split(' ');
      const lignes = [];
      let ligne = [];
      for (const m of mots) {
        const essai = ligne.concat(m).join(' ');
        if (ligne.length && mesurer(essai, o) > largeur) {
          lignes.push(ligne);
          ligne = [m];
        } else ligne.push(m);
      }
      if (ligne.length) lignes.push(ligne);
      return lignes;
    }

    // ------------------------------------------- titres « cuits » (3D)
    // Un titre est préparé une fois : face (métal ou blanc), masque, lueur,
    // reflet. On le pose ensuite à chaque image, avec rotation et balayage.
    const titres = {};
    function titre(cle, texte, o) {
      if (titres[cle]) return titres[cle];
      const famille = o.famille || POLICES.titre;
      let taille = o.taille;
      const esp = o.espacement || 0;
      const mesure = () => {
        ctx.font = police(o.poids || 700, taille, famille);
        ctx.letterSpacing = Math.round(esp * taille) + 'px';
        const m = ctx.measureText(texte);
        ctx.letterSpacing = '0px';
        return m;
      };
      let m = mesure();
      if (o.maxL && m.width > o.maxL) {
        taille *= o.maxL / m.width;
        m = mesure();
      }
      const metal = o.style === 'metal';
      const profondeur = metal ? taille * 0.07 : 0;
      const marge = taille * 0.4 + profondeur;
      const haut = m.actualBoundingBoxAscent;
      const bas = m.actualBoundingBoxDescent;
      const l = m.width + marge * 2;
      const h = haut + bas + marge * 2;
      const bx = marge + (esp * taille) / 2 + m.width / 2;
      const by = marge + haut;
      const prep = (g) => {
        g.font = police(o.poids || 700, taille, famille);
        g.letterSpacing = Math.round(esp * taille) + 'px';
        g.textAlign = 'center';
        g.textBaseline = 'alphabetic';
      };

      const masque = toile(l, h);
      const gm = masque.getContext('2d');
      prep(gm);
      gm.fillStyle = '#fff';
      gm.fillText(texte, bx, by);

      const face = toile(l, h);
      const g = face.getContext('2d');
      prep(g);
      if (metal) {
        // Extrusion : la profondeur 3D, couche par couche.
        const pas = Math.max(1, profondeur / 28);
        for (let k = profondeur; k > 0; k -= pas) {
          const x = k / profondeur;
          const c = [Math.round(melange(70, 12, x)), Math.round(melange(45, 8, x)), Math.round(melange(140, 32, x))];
          g.fillStyle = rgba(c, 1);
          g.fillText(texte, bx + k * 0.35, by + k * 0.75);
        }
        const d = g.createLinearGradient(0, by - haut, 0, by + bas);
        d.addColorStop(0, '#ffffff');
        d.addColorStop(0.3, '#e4e2f5');
        d.addColorStop(0.48, '#9a98c4');
        d.addColorStop(0.52, '#4a4278');
        d.addColorStop(0.68, '#b3a8ee');
        d.addColorStop(0.9, '#f2eeff');
        d.addColorStop(1, '#ffffff');
        g.fillStyle = d;
        g.fillText(texte, bx, by);
        // Lumière intérieure.
        g.globalCompositeOperation = 'source-atop';
        const li = g.createRadialGradient(bx, by - haut * 0.45, 0, bx, by - haut * 0.45, Math.max(m.width, haut) * 0.6);
        li.addColorStop(0, 'rgba(190,150,255,0.45)');
        li.addColorStop(1, 'rgba(190,150,255,0)');
        g.fillStyle = li;
        g.fillRect(0, 0, l, h);
        g.globalCompositeOperation = 'source-over';
        g.lineWidth = Math.max(1, taille * 0.006);
        g.strokeStyle = 'rgba(255,255,255,0.7)';
        g.strokeText(texte, bx, by);
      } else {
        const d = g.createLinearGradient(0, by - haut, 0, by + bas);
        d.addColorStop(0, '#ffffff');
        d.addColorStop(1, o.teinte || '#e2dcff');
        g.fillStyle = d;
        g.fillText(texte, bx, by);
      }

      const lueur = toile(l, h);
      const gl = lueur.getContext('2d');
      gl.filter = 'blur(' + Math.max(2, taille * (o.flouLueur || 0.07)) + 'px)';
      gl.drawImage(masque, 0, 0);
      gl.filter = 'none';
      gl.globalCompositeOperation = 'source-in';
      gl.fillStyle = o.couleurLueur || 'rgb(140,90,255)';
      gl.fillRect(0, 0, l, h);

      let reflet = null;
      if (metal) {
        reflet = toile(l, h);
        const gr = reflet.getContext('2d');
        gr.translate(0, h);
        gr.scale(1, -1);
        gr.drawImage(face, 0, 0);
        gr.setTransform(1, 0, 0, 1, 0, 0);
        gr.globalCompositeOperation = 'destination-in';
        const fr = gr.createLinearGradient(0, h - by - bas, 0, h - by + haut * 0.6);
        fr.addColorStop(0, 'rgba(0,0,0,0.3)');
        fr.addColorStop(1, 'rgba(0,0,0,0)');
        gr.fillStyle = fr;
        gr.fillRect(0, 0, l, h);
      }

      return (titres[cle] = { texte, face, masque, lueur, reflet, tampon: toile(l, h), l, h, bx, by, haut, bas, taille, largeur: m.width, centreY: by - (haut - bas) / 2 });
    }

    // Pose un titre centré en (x, y).
    function poser(T, x, y, o) {
      o = o || {};
      const alpha = o.alpha == null ? 1 : o.alpha;
      if (alpha <= 0.003) return;
      const e = o.echelle || 1;
      const rot = o.rotY || 0;
      ctx.save();
      ctx.translate(x, y);
      ctx.transform(Math.cos(rot) * e, Math.sin(rot) * 0.14 * e, 0, e, 0, 0);
      const ox = -T.bx + (T.bx - T.l / 2) * 0 - 0;
      const x0 = -T.l / 2, y0 = -T.centreY;
      void ox;
      if (o.lueur !== 0) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = borne(alpha * (o.lueur == null ? 0.7 : o.lueur));
        ctx.drawImage(T.lueur, x0, y0);
      }
      ctx.globalCompositeOperation = 'source-over';
      if (o.flou > 0.5) ctx.filter = 'blur(' + o.flou.toFixed(1) + 'px)';
      ctx.globalAlpha = borne(alpha);
      ctx.drawImage(T.face, x0, y0);
      ctx.filter = 'none';
      if (o.reflet && T.reflet) {
        ctx.globalAlpha = borne(alpha * o.reflet);
        ctx.drawImage(T.reflet, x0, y0 + 2 * T.by - T.h + T.taille * 0.04);
      }
      if (o.balayage != null && o.balayage > -0.2 && o.balayage < 1.2) {
        const g = T.tampon.getContext('2d');
        g.globalCompositeOperation = 'source-over';
        g.clearRect(0, 0, T.l, T.h);
        g.drawImage(T.masque, 0, 0);
        g.globalCompositeOperation = 'source-in';
        const bx = melange(-0.25, 1.25, o.balayage) * T.l;
        const d = g.createLinearGradient(bx - T.taille * 0.5, 0, bx + T.taille * 0.5, T.h);
        d.addColorStop(0, 'rgba(255,255,255,0)');
        d.addColorStop(0.45, 'rgba(255,255,255,0.75)');
        d.addColorStop(0.5, 'rgba(255,255,255,1)');
        d.addColorStop(0.55, 'rgba(230,210,255,0.75)');
        d.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = d;
        g.fillRect(0, 0, T.l, T.h);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = borne(alpha);
        ctx.drawImage(T.tampon, x0, y0);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // Glitch subtil : la face découpée en bandes décalées, teintée.
    function glitch(T, x, y, force, graine, alpha) {
      if (force <= 0.01) return;
      const r = hasard(graine);
      const x0 = x - T.l / 2, y0 = y - T.centreY;
      ctx.globalCompositeOperation = 'lighter';
      const bandes = 7;
      for (let k = 0; k < bandes; k++) {
        const h0 = (T.h / bandes) * k;
        const dx = (r() - 0.5) * S * 0.05 * force;
        ctx.globalAlpha = 0.35 * force * alpha;
        ctx.drawImage(T.face, 0, h0, T.l, T.h / bandes, x0 + dx, y0 + h0, T.l, T.h / bandes);
      }
      ctx.globalAlpha = 0.25 * force * alpha;
      ctx.drawImage(T.lueur, x0 - S * 0.012 * force, y0);
      ctx.drawImage(T.lueur, x0 + S * 0.012 * force, y0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // --------------------------------------------------- nuages de points
    // Les points d'un titre, pour le reconstruire en particules.
    const nuages = {};
    function nuageDe(cle, source, cible) {
      if (nuages[cle]) return nuages[cle];
      const c = source.masque || source;
      const g = c.getContext('2d');
      const img = g.getImageData(0, 0, c.width, c.height).data;
      let plein = 0;
      for (let i = 3; i < img.length; i += 16) if (img[i] > 128) plein++;
      plein *= 4;
      const nb = Math.round((cible || 2400) * densite);
      const pas = Math.max(2, Math.sqrt(plein / nb));
      const pts = [];
      const r = hasard(cle.length * 131 + 7);
      const ancreY = source.centreY != null ? source.centreY : c.height / 2;
      for (let y = 0; y < c.height; y += pas) {
        for (let x = 0; x < c.width; x += pas) {
          const xx = Math.floor(x + r() * pas * 0.8), yy = Math.floor(y + r() * pas * 0.8);
          if (xx >= c.width || yy >= c.height) continue;
          if (img[(yy * c.width + xx) * 4 + 3] > 128) pts.push(xx - c.width / 2, yy - ancreY);
        }
      }
      const n = pts.length / 2;
      const p = new Float32Array(n * 2);
      p.set(pts);
      const alea = new Float32Array(n * 6);
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2, d = 0.4 + r() * 0.9;
        alea[i * 6] = Math.cos(a) * d;
        alea[i * 6 + 1] = Math.sin(a) * d;
        alea[i * 6 + 2] = r();
        alea[i * 6 + 3] = r() * Math.PI * 2;
        alea[i * 6 + 4] = r();
        alea[i * 6 + 5] = r();
      }
      return (nuages[cle] = { p, alea, n, pas });
    }

    // Les particules convergent vers le nuage (t0 → t1), scintillent, puis
    // se désintègrent (t2 → t3). « depuis » : un autre nuage d'origine.
    function former(N, x, y, t, o) {
      if (t < o.t0 - 0.01 || (o.t3 != null && t > o.t3)) return;
      const e = o.echelle || 1;
      const dur = o.t1 - o.t0;
      const taille = (o.taille || 1) * S * 0.0042 * Math.max(0.7, N.pas / 5);
      const tour = o.tourbillon == null ? 1.6 : o.tourbillon;
      const disp = o.dispersion || 1;
      const alphaG = o.alpha == null ? 1 : o.alpha;
      const sp = o.couleurs || [spriteListe[0], spriteListe[1], spriteListe[2], spriteListe[1]];
      const D = o.depuis;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < N.n; i++) {
        const k = i * 6;
        const retard = N.alea[k + 2];
        const a = borne((t - o.t0 - retard * dur * 0.45) / (dur * 0.55));
        if (!D && a <= 0) continue;
        const p = douce(a);
        const tx = x + N.p[i * 2] * e, ty = y + N.p[i * 2 + 1] * e;
        let sx, sy;
        if (D) {
          const j = i % D.nuage.n;
          sx = D.x + D.nuage.p[j * 2] * (D.echelle || 1);
          sy = D.y + D.nuage.p[j * 2 + 1] * (D.echelle || 1);
        } else {
          sx = tx + N.alea[k] * S * 0.9 * disp;
          sy = ty + N.alea[k + 1] * S * 0.7 * disp;
        }
        const ang = (1 - p) * tour * (N.alea[k + 4] > 0.5 ? 1 : -1);
        const dx = sx - tx, dy = sy - ty;
        const ca = Math.cos(ang), sa = Math.sin(ang);
        let px = tx + (dx * ca - dy * sa) * (1 - p);
        let py = ty + (dx * sa + dy * ca) * (1 - p);
        let al = D ? 1 : lisse(borne(a * 2.5));
        let r = taille * (0.6 + N.alea[k + 5] * 0.8) * (1 + (D ? 0.6 : 2.2) * (1 - p) * (1 - p));
        al *= 0.65 + 0.35 * Math.sin(t * 5 + N.alea[k + 3]);
        if (o.t2 != null && t > o.t2) {
          const q = entree(borne((t - o.t2 - retard * (o.t3 - o.t2) * 0.4) / ((o.t3 - o.t2) * 0.6)));
          const ad = N.alea[k + 3];
          px += Math.cos(ad) * q * S * 0.3 * (0.3 + N.alea[k + 5]);
          py += (Math.sin(ad) - 0.8) * q * S * 0.22 * (0.3 + N.alea[k + 5]);
          al *= 1 - q;
          r *= 1 + q;
        }
        point(sp[i & 3], px, py, r, al * alphaG);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // Silhouette abstraite (buste), en points.
    function nuageSilhouette() {
      if (nuages.silhouette) return nuages.silhouette;
      const h = S * L(0.62, 0.62);
      const c = toile(h * 0.9, h);
      const g = c.getContext('2d');
      g.fillStyle = '#fff';
      const mx = c.width / 2;
      g.beginPath();
      g.ellipse(mx, h * 0.27, h * 0.15, h * 0.19, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(mx - h * 0.07, h * 0.42);
      g.lineTo(mx + h * 0.07, h * 0.42);
      g.lineTo(mx + h * 0.08, h * 0.55);
      g.bezierCurveTo(mx + h * 0.3, h * 0.58, mx + h * 0.42, h * 0.68, mx + h * 0.44, h);
      g.lineTo(mx - h * 0.44, h);
      g.bezierCurveTo(mx - h * 0.42, h * 0.68, mx - h * 0.3, h * 0.58, mx - h * 0.08, h * 0.55);
      g.closePath();
      g.fill();
      return nuageDe('silhouette', c, 2600);
    }

    // ------------------------------------------------- champ d'étoiles
    const ETOILES = (function () {
      const n = Math.round(1400 * densite);
      const r = hasard(3);
      const e = new Float32Array(n * 5);
      for (let i = 0; i < n; i++) {
        e[i * 5] = (r() * 2 - 1) * 1.6;
        e[i * 5 + 1] = (r() * 2 - 1) * 1.6;
        e[i * 5 + 2] = r() * 10;
        e[i * 5 + 3] = r();
        e[i * 5 + 4] = Math.floor(r() * 4);
      }
      return { e, n };
    })();
    const F = S * 0.75;
    function etoiles(t, intensite, o) {
      if (intensite <= 0) return;
      o = o || {};
      const z = camZ(t);
      const v = vitesse(t);
      const flou = o.trainees == null ? borne((v - 0.8) / 4) : o.trainees;
      const zPrec = z - Math.min(v, 14) * 0.06;
      const part = o.part == null ? 1 : o.part;
      const nb = Math.floor(ETOILES.n * part);
      const D = 10;
      ctx.globalCompositeOperation = 'lighter';
      const e = ETOILES.e;
      for (let i = 0; i < nb; i++) {
        const k = i * 5;
        const zr = ((((e[k + 2] - z) % D) + D) % D) + 0.05;
        if (zr < 0.12) continue;
        const sx = cx + (e[k] / zr) * F, sy = cy + (e[k + 1] / zr) * F;
        if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) continue;
        const proche = 1 - zr / D;
        const al = intensite * borne(proche * 1.6) * (0.35 + 0.65 * e[k + 3]) * borne(zr / 0.5);
        const rr = S * 0.0022 * (0.5 + e[k + 3]) * (0.4 + 2.6 / zr);
        if (flou > 0.02) {
          const zp = ((((e[k + 2] - zPrec) % D) + D) % D) + 0.05;
          if (zp > zr) {
            const px = cx + (e[k] / zp) * F, py = cy + (e[k + 1] / zp) * F;
            ctx.globalAlpha = borne(al * flou * 0.8);
            ctx.strokeStyle = e[k + 4] === 1 ? '#b9a2ff' : e[k + 4] === 2 ? '#8fa8ff' : '#ffffff';
            ctx.lineWidth = Math.max(0.6, rr * 0.5);
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(sx, sy);
            ctx.stroke();
          }
        }
        point(spriteListe[e[k + 4]], sx, sy, rr, al);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // Poussières qui traversent l'écran (parallaxe + bokeh).
    const POUSSIERES = (function () {
      const n = Math.round(260 * densite);
      const r = hasard(5);
      const p = new Float32Array(n * 6);
      for (let i = 0; i < n; i++) {
        p[i * 6] = r(); p[i * 6 + 1] = r(); p[i * 6 + 2] = r(); p[i * 6 + 3] = r(); p[i * 6 + 4] = r(); p[i * 6 + 5] = r();
      }
      return { p, n };
    })();
    function poussieres(t, intensite, sens) {
      if (intensite <= 0) return;
      sens = sens || 1;
      ctx.globalCompositeOperation = 'lighter';
      const P = POUSSIERES.p;
      for (let i = 0; i < POUSSIERES.n; i++) {
        const k = i * 6;
        const prof = P[k + 2];
        const vit = (0.01 + prof * 0.05) * sens;
        const x = ((((P[k] + t * vit) % 1) + 1) % 1) * (W + 200) - 100;
        const y = P[k + 1] * H + Math.sin(t * 0.3 + P[k + 3] * 6) * S * 0.02;
        if (prof > 0.93) {
          const r = S * (0.03 + P[k + 4] * 0.05);
          ctx.globalAlpha = intensite * 0.45 * (0.5 + 0.5 * Math.sin(t * 0.8 + P[k + 5] * 6));
          ctx.drawImage(bokeh, x - r, y - r, r * 2, r * 2);
        } else {
          point(spriteListe[i % 4], x, y, S * 0.002 * (0.6 + prof * 2.5), intensite * (0.25 + prof * 0.6) * (0.6 + 0.4 * Math.sin(t * 2 + P[k + 5] * 9)));
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // ----------------------------------------------- éclats et confettis
    function gerbe(t, t0, x, y, graine, o) {
      const dt = t - t0;
      if (dt < 0 || dt > (o.duree || 3)) return;
      const n = Math.round((o.nombre || 500) * densite);
      const r = hasard(graine);
      const k = o.freinage || 2.2;
      const amort = (1 - Math.exp(-k * dt)) / k;
      const amortP = (1 - Math.exp(-k * Math.max(0, dt - 0.04))) / k;
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2;
        const v = S * (o.vitesse || 1.6) * (0.15 + Math.pow(r(), 0.6));
        const vie = (o.duree || 3) * (0.35 + r() * 0.65);
        const c = Math.floor(r() * 5);
        const g = S * 0.12 * (o.gravite == null ? 1 : o.gravite);
        if (dt > vie) continue;
        const px = x + Math.cos(a) * v * amort, py = y + Math.sin(a) * v * amort * (o.aplati || 1) + g * dt * dt * 0.5;
        const qx = x + Math.cos(a) * v * amortP, qy = y + Math.sin(a) * v * amortP * (o.aplati || 1) + g * Math.max(0, dt - 0.04) ** 2 * 0.5;
        const al = (1 - dt / vie) ** 1.5;
        ctx.globalAlpha = al * 0.8;
        ctx.strokeStyle = c === 0 ? '#ffffff' : c === 1 ? '#c9b5ff' : c === 2 ? '#9a6bff' : c === 3 ? '#ffc4e4' : '#9fb4ff';
        ctx.lineWidth = S * 0.0025;
        ctx.beginPath();
        ctx.moveTo(qx, qy);
        ctx.lineTo(px, py);
        ctx.stroke();
        point(spriteListe[c % 4], px, py, S * 0.006, al);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    const COULEURS_CONFETTIS = ['#ffffff', '#d9c9ff', '#9b6dff', '#7c4dff', '#ffd1ea', '#a9bcff', '#e8e8f5'];
    function confettis(t, t0, o) {
      const dt = t - t0;
      if (dt < 0 || dt > 9) return;
      const n = Math.round((o.nombre || 300) * Math.sqrt(densite));
      const r = hasard(o.graine || 1);
      const k = 1.6;
      const g = S * 0.55;
      const vt = g / k;
      for (let i = 0; i < n; i++) {
        let x0, y0, vx, vy;
        if (o.pluie) {
          x0 = r() * W; y0 = -S * 0.05 - r() * H * 0.6; vx = (r() - 0.5) * S * 0.2; vy = S * 0.1;
        } else {
          const a = -Math.PI / 2 + (r() - 0.5) * Math.PI * 1.7;
          const v = S * (0.8 + r() * 1.8);
          x0 = o.x; y0 = o.y; vx = Math.cos(a) * v * (portrait ? 0.7 : 1.1); vy = Math.sin(a) * v;
        }
        const e = Math.exp(-k * dt);
        let x = x0 + (vx / k) * (1 - e);
        const y = y0 + ((vy + vt) / k) * (1 - e) - vt * dt;
        const yy = y0 + ((vy - vt) / k) * (1 - e) + vt * dt;
        x += Math.sin(dt * (1.5 + r() * 2) + r() * 6) * S * 0.02;
        if (yy > H + 40 || x < -40 || x > W + 40) continue;
        void y;
        const tl = S * (0.007 + r() * 0.008);
        const rot = r() * 6 + dt * (2 + r() * 6);
        const flip = Math.cos(dt * (4 + r() * 8) + r() * 6);
        const al = borne((o.fin - t) / 1.2) * borne(dt * 8);
        if (al <= 0) continue;
        ctx.save();
        ctx.translate(x, yy);
        ctx.rotate(rot);
        ctx.scale(1, flip);
        ctx.globalAlpha = al * (0.65 + 0.35 * Math.abs(flip));
        ctx.fillStyle = COULEURS_CONFETTIS[i % COULEURS_CONFETTIS.length];
        if (i % 5 === 0) {
          ctx.beginPath();
          ctx.arc(0, 0, tl * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.fillRect(-tl * 0.5, -tl * 0.25, tl, tl * 0.5);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    // Onde de choc lumineuse.
    function onde(t, t0, x, y, force) {
      const dt = t - t0;
      if (dt < 0 || dt > 1.4) return;
      const p = sortie(dt / 1.4);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (1 - p) * 0.6 * (force || 1);
      ctx.strokeStyle = '#c8b4ff';
      ctx.lineWidth = S * 0.012 * (1 - p) + 1;
      ctx.beginPath();
      ctx.ellipse(x, y, p * S * 1.1, p * S * 1.1 * (portrait ? 1 : 0.62), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // Lueur ponctuelle (lumière, cœur d'explosion).
    function halo(x, y, r, a, col) {
      if (a <= 0 || r <= 0) return;
      const d = ctx.createRadialGradient(x, y, 0, x, y, r);
      const c = col || COULEURS.lavande;
      d.addColorStop(0, rgba([255, 255, 255], borne(a)));
      d.addColorStop(0.15, rgba(c, borne(a * 0.6)));
      d.addColorStop(0.5, rgba(COULEURS.electrique, borne(a * 0.14)));
      d.addColorStop(1, rgba(COULEURS.electrique, 0));
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = d;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.globalCompositeOperation = 'source-over';
    }

    function voile(couleur, a) {
      if (a <= 0.002) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = borne(a);
      ctx.fillStyle = couleur;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    // Faisceau de lumière qui traverse tout l'écran.
    function faisceau(p, a) {
      if (p <= 0 || p >= 1 || a <= 0) return;
      const x = melange(-0.4, 1.4, p) * W;
      const l = S * 0.5;
      const d = ctx.createLinearGradient(x - l, 0, x + l, H * 0.4);
      d.addColorStop(0, 'rgba(255,255,255,0)');
      d.addColorStop(0.5, 'rgba(235,225,255,' + (0.35 * a).toFixed(3) + ')');
      d.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = d;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }

    // --------------------------------------------------- géométries 3D
    function solide(sommets, distance) {
      const aretes = [];
      for (let i = 0; i < sommets.length; i++)
        for (let j = i + 1; j < sommets.length; j++) {
          const d = Math.hypot(sommets[i][0] - sommets[j][0], sommets[i][1] - sommets[j][1], sommets[i][2] - sommets[j][2]);
          if (Math.abs(d - distance) < 0.01) aretes.push([i, j]);
        }
      return { sommets, aretes };
    }
    const PHI = (1 + Math.sqrt(5)) / 2;
    const ICOSA = solide([[0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI], [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0], [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1]], 2);
    const CUBE = solide([[-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1], [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1]], 2);
    const OCTA = solide([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], Math.SQRT2);

    function filaire(G, x, y, taille, ay, ax, prog, alpha, couleur) {
      if (alpha <= 0) return;
      const ca = Math.cos(ay), sa = Math.sin(ay), cb = Math.cos(ax), sb = Math.sin(ax);
      const pr = G.sommets.map(([a, b, c]) => {
        const x1 = a * ca + c * sa, z1 = -a * sa + c * ca;
        const y2 = b * cb - z1 * sb, z2 = b * sb + z1 * cb;
        const f = 4 / (4 + z2);
        return [x + x1 * taille * f, y + y2 * taille * f];
      });
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      G.aretes.forEach(([i, j], k) => {
        const f = borne(prog * G.aretes.length * 0.12 - k * 0.1);
        if (f <= 0) return;
        const [x1, y1] = pr[i], [x2, y2] = pr[j];
        const xe = melange(x1, x2, f), ye = melange(y1, y2, f);
        ctx.strokeStyle = couleur;
        ctx.globalAlpha = alpha * 0.25;
        ctx.lineWidth = S * 0.008;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(xe, ye); ctx.stroke();
        ctx.globalAlpha = alpha * 0.9;
        ctx.lineWidth = Math.max(1, S * 0.0018);
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(xe, ye); ctx.stroke();
      });
      for (const [px, py] of pr) point(spriteListe[1], px, py, S * 0.008, alpha * borne(prog * 2));
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // ---------------------------------------- univers de « LE PARCOURS »
    const LIGNES_CODE = [
      ['const joel = new Batisseur({ ne: "10.10" });', 'while (reve.estVivant()) {', '  joel.apprendre(chaqueJour);', '  joel.creer(demain);', '}', 'export default avenir.construire();'],
      ['def nouvelle_annee(joel):', '    for idee in joel.idees:', '        yield idee.realiser()', '', '# version = annee + 1', 'lancer(nouvelle_annee)'],
      ['> curiosite ......... 100%', '> savoir ............ ++', '> ambition .......... MAX', '> cap : NOUVELLE ERE', '> statut : EN COURS_'],
    ];
    function panneau(lignes, x, y, l, h, incl, u, alpha, graine) {
      if (alpha <= 0) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.transform(1, incl * 0.18, 0, 1, 0, 0);
      ctx.globalAlpha = alpha * 0.55;
      ctx.fillStyle = 'rgba(20,14,50,0.55)';
      ctx.fillRect(-l / 2, -h / 2, l, h);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(170,140,255,0.55)';
      ctx.lineWidth = Math.max(1, S * 0.0015);
      ctx.strokeRect(-l / 2, -h / 2, l, h);
      ctx.fillStyle = 'rgba(170,140,255,0.25)';
      ctx.fillRect(-l / 2, -h / 2, l, h * 0.09);
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.arc(-l / 2 + h * 0.05 + k * h * 0.045, -h / 2 + h * 0.045, h * 0.012, 0, Math.PI * 2);
        ctx.fillStyle = k === 0 ? '#ff9ad5' : k === 1 ? '#b79bff' : '#8fa8ff';
        ctx.fill();
      }
      const plusLongue = Math.max(...lignes.map((x) => x.length));
      const tl = Math.min(h * 0.065, (l * 0.9) / (plusLongue * 0.62));
      ctx.beginPath();
      ctx.rect(-l / 2, -h / 2, l, h);
      ctx.clip();
      ctx.font = '400 ' + Math.round(tl) + 'px ' + POLICES.code;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      let reste = Math.floor(u * 55);
      lignes.forEach((ligne, k) => {
        if (reste <= 0) return;
        const vu = ligne.slice(0, reste);
        reste -= ligne.length + 4;
        const mot = /^\s*(const|while|export|def|for|yield|#|>)/.test(ligne);
        ctx.fillStyle = mot ? '#c3a6ff' : ligne.includes('"') ? '#ffb8dd' : 'rgba(235,235,255,0.9)';
        ctx.fillText(vu, -l / 2 + h * 0.05, -h / 2 + h * 0.15 + k * tl * 1.55);
        if (reste <= 0 && Math.floor(u * 4 + graine) % 2 === 0) ctx.fillRect(-l / 2 + h * 0.05 + ctx.measureText(vu).width + 2, -h / 2 + h * 0.15 + k * tl * 1.55, tl * 0.5, tl);
      });
      // Balayage d'écran holographique.
      const sy = -h / 2 + (((u * 0.6 + graine * 0.3) % 1) * h);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(160,130,255,0.12)';
      ctx.fillRect(-l / 2, sy, l, h * 0.04);
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    function pluieCode(t, alpha) {
      if (alpha <= 0) return;
      const cols = Math.round(L(46, 26));
      const tl = W / cols;
      ctx.font = '400 ' + Math.round(tl * 0.55) + 'px ' + POLICES.code;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const r = hasard(17);
      const chars = '01{}<>/=;()[]+*abcdefjoel10';
      for (let c = 0; c < cols; c++) {
        const vit = 2 + r() * 5, dec = r() * 40, long = 6 + Math.floor(r() * 12);
        const tete = (t * vit + dec) % (H / tl + long);
        for (let k = 0; k < long; k++) {
          const ligne = Math.floor(tete) - k;
          if (ligne < 0 || ligne * tl > H) continue;
          ctx.globalAlpha = alpha * 0.18 * (1 - k / long) * (k === 0 ? 2.5 : 1);
          ctx.fillStyle = k === 0 ? '#ffffff' : '#9b7bff';
          ctx.fillText(chars[(c * 7 + ligne * 3 + Math.floor(t * 3)) % chars.length], c * tl + tl / 2, ligne * tl);
        }
      }
      ctx.globalAlpha = 1;
    }

    const CIRCUITS = (function () {
      const r = hasard(29);
      const chemins = [];
      for (let k = 0; k < 34; k++) {
        const cote = k % 4;
        let x = cote === 0 ? -1.05 : cote === 1 ? 1.05 : (r() * 2 - 1);
        let y = cote === 2 ? -1.05 : cote === 3 ? 1.05 : (r() * 2 - 1);
        const pts = [[x, y]];
        for (let s = 0; s < 4; s++) {
          if ((s + cote) % 2 === 0) x *= 0.55 + r() * 0.2;
          else y *= 0.55 + r() * 0.2;
          if (s === 2) { const d = Math.min(Math.abs(x), Math.abs(y)) * 0.4; x -= Math.sign(x) * d; y -= Math.sign(y) * d; }
          pts.push([x, y]);
        }
        chemins.push({ pts, retard: r() * 0.6, vitesse: 0.6 + r() * 0.8 });
      }
      return chemins;
    })();
    function circuits(u, alpha) {
      if (alpha <= 0) return;
      const ex = W * 0.5, ey = H * 0.48;
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const c of CIRCUITS) {
        const pts = c.pts.map(([x, y]) => [cx + x * ex, cy + y * ey]);
        let total = 0;
        const lg = [];
        for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lg.push(d); total += d; }
        const f = sortie(borne((u - c.retard) / 1.1));
        if (f <= 0) continue;
        let reste = total * f;
        ctx.strokeStyle = '#8f6bff';
        ctx.globalAlpha = alpha * 0.6;
        ctx.lineWidth = Math.max(1, S * 0.002);
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        let fin = pts[0];
        for (let i = 1; i < pts.length && reste > 0; i++) {
          const q = Math.min(1, reste / lg[i - 1]);
          fin = [melange(pts[i - 1][0], pts[i][0], q), melange(pts[i - 1][1], pts[i][1], q)];
          ctx.lineTo(fin[0], fin[1]);
          reste -= lg[i - 1];
        }
        ctx.stroke();
        point(spriteListe[0], pts[0][0], pts[0][1], S * 0.006, alpha * 0.8);
        point(spriteListe[1], fin[0], fin[1], S * 0.01, alpha);
        // Impulsions qui voyagent le long des pistes.
        if (f >= 1) {
          let d = ((u * c.vitesse * 0.8 + c.retard) % 1) * total;
          for (let i = 1; i < pts.length; i++) {
            if (d <= lg[i - 1]) {
              const q = d / lg[i - 1];
              point(spriteListe[0], melange(pts[i - 1][0], pts[i][0], q), melange(pts[i - 1][1], pts[i][1], q), S * 0.012, alpha);
              break;
            }
            d -= lg[i - 1];
          }
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // Un robot abstrait : quelques lignes, deux yeux de lumière.
    function robot(x, y, s, u, alpha) {
      if (alpha <= 0) return;
      const p = sortie(borne(u / 0.9));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = '#b7a0ff';
      ctx.lineWidth = Math.max(1, S * 0.0022);
      ctx.setLineDash([s * 4 * p, s * 4]);
      ctx.beginPath();
      ctx.roundRect(x - s, y - s * 0.75, s * 2, s * 1.5, s * 0.35);
      ctx.moveTo(x, y - s * 0.75); ctx.lineTo(x, y - s * 1.15);
      ctx.moveTo(x - s * 1.25, y - s * 0.2); ctx.lineTo(x - s, y - s * 0.2);
      ctx.moveTo(x + s, y - s * 0.2); ctx.lineTo(x + s * 1.25, y - s * 0.2);
      ctx.moveTo(x - s * 0.45, y + s * 0.38); ctx.lineTo(x + s * 0.45, y + s * 0.38);
      ctx.stroke();
      ctx.setLineDash([]);
      const cligne = Math.abs(Math.sin(u * 2.2)) > 0.97 ? 0.2 : 1;
      point(spriteListe[0], x, y - s * 1.2, s * 0.25, alpha * p);
      point(spriteListe[5], x - s * 0.45, y - s * 0.12, s * 0.55 * cligne, alpha * p);
      point(spriteListe[5], x + s * 0.45, y - s * 0.12, s * 0.55 * cligne, alpha * p);
      ctx.restore();
    }

    const RESEAU = (function () {
      const r = hasard(41);
      const noeuds = [{ x: 0, y: 0, r: 0, parent: -1 }];
      for (let k = 0; k < 46; k++) {
        const rad = 0.18 + Math.pow(r(), 0.8) * 0.85;
        const a = r() * Math.PI * 2;
        noeuds.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad, r: rad, parent: 0 });
      }
      noeuds.sort((a, b) => a.r - b.r);
      for (let i = 1; i < noeuds.length; i++) {
        let meilleur = 0, dm = 1e9;
        for (let j = 0; j < i; j++) {
          const d = Math.hypot(noeuds[i].x - noeuds[j].x, noeuds[i].y - noeuds[j].y);
          if (d < dm) { dm = d; meilleur = j; }
        }
        noeuds[i].parent = meilleur;
      }
      for (const n of noeuds) n.actif = 0.1 + n.r * 1.3;
      return noeuds;
    })();
    function personne(x, y, s, a) {
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(x, y - s * 0.55, s * 0.45, 0, Math.PI * 2);
      ctx.moveTo(x + s * 0.95, y + s * 1.05);
      ctx.arc(x, y + s * 1.05, s * 0.95, 0, Math.PI, true);
      ctx.stroke();
    }
    function reseau(u, alpha) {
      if (alpha <= 0) return;
      const ex = L(W * 0.44, W * 0.46), ey = L(H * 0.42, H * 0.36);
      const pos = (n) => [cx + n.x * ex, cy + n.y * ey];
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = Math.max(1, S * 0.0018);
      for (let i = 1; i < RESEAU.length; i++) {
        const n = RESEAU[i], p = RESEAU[n.parent];
        const f = borne((u - p.actif) / Math.max(0.05, n.actif - p.actif));
        if (f <= 0) continue;
        const [x1, y1] = pos(p), [x2, y2] = pos(n);
        ctx.globalAlpha = alpha * 0.45;
        ctx.strokeStyle = '#9a7cff';
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(melange(x1, x2, f), melange(y1, y2, f)); ctx.stroke();
        if (f < 1) point(spriteListe[0], melange(x1, x2, f), melange(y1, y2, f), S * 0.012, alpha);
        else {
          const q = ((u * 0.9 + i * 0.137) % 1);
          point(spriteListe[1], melange(x1, x2, q), melange(y1, y2, q), S * 0.007, alpha * 0.8);
        }
      }
      ctx.strokeStyle = '#e6dcff';
      ctx.lineWidth = Math.max(1, S * 0.0022);
      for (let i = 0; i < RESEAU.length; i++) {
        const n = RESEAU[i];
        const a = borne((u - n.actif) * 4);
        if (a <= 0) continue;
        const [x, y] = pos(n);
        const s = S * (i === 0 ? 0.03 : 0.014);
        point(spriteListe[2], x, y, s * 3.5, alpha * a * 0.5);
        personne(x, y, s, alpha * a);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // ------------------------------------------------------- photos
    const photosPretes = photos.map((img, k) => {
      const ech = toile(48, 64);
      const g = ech.getContext('2d');
      const r = Math.max(48 / img.naturalWidth, 64 / img.naturalHeight);
      g.drawImage(img, (48 - img.naturalWidth * r) / 2, (64 - img.naturalHeight * r) / 2, img.naturalWidth * r, img.naturalHeight * r);
      let pix = null;
      try { pix = g.getImageData(0, 0, 48, 64).data; } catch (e) { pix = null; }
      return { img, pix, graine: k * 31 + 3 };
    });
    // Une photo dans un cadre de cinéma : jamais déformée, lent zoom.
    function cadrePhoto(P, x, y, l, h, u, alpha, dissolution) {
      if (alpha <= 0) return;
      const img = P.img;
      ctx.save();
      ctx.globalAlpha = alpha * (1 - dissolution);
      ctx.beginPath();
      ctx.rect(x - l / 2, y - h / 2, l, h);
      ctx.clip();
      const zoom = 1.04 + 0.08 * u;
      const r = Math.max(l / img.naturalWidth, h / img.naturalHeight) * zoom;
      const iw = img.naturalWidth * r, ih = img.naturalHeight * r;
      ctx.drawImage(img, x - iw / 2, y - ih * 0.45, iw, ih);
      const d = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
      d.addColorStop(0, 'rgba(10,6,30,0.25)');
      d.addColorStop(0.6, 'rgba(10,6,30,0)');
      d.addColorStop(1, 'rgba(10,6,30,0.55)');
      ctx.fillStyle = d;
      ctx.fillRect(x - l / 2, y - h / 2, l, h);
      ctx.restore();
      ctx.globalAlpha = alpha * (1 - dissolution);
      ctx.strokeStyle = 'rgba(220,205,255,0.5)';
      ctx.lineWidth = Math.max(1, S * 0.0015);
      ctx.strokeRect(x - l / 2, y - h / 2, l, h);
      // Coins de viseur.
      const c = S * 0.03, m = S * 0.018;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = Math.max(1, S * 0.003);
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const ax = x + sx * (l / 2 + m), ay = y + sy * (h / 2 + m);
        ctx.beginPath(); ctx.moveTo(ax, ay - sy * c); ctx.lineTo(ax, ay); ctx.lineTo(ax - sx * c, ay); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Dissolution en particules aux couleurs de la photo.
      if (dissolution > 0 && P.pix) {
        const rr = hasard(P.graine);
        ctx.globalCompositeOperation = 'lighter';
        for (let j = 0; j < 64; j++)
          for (let i = 0; i < 48; i++) {
            const o = (j * 48 + i) * 4;
            const a = rr() * Math.PI * 2, v = rr();
            const q = borne(dissolution * 1.4 - rr() * 0.4);
            const px = x - l / 2 + (i + 0.5) * (l / 48) + Math.cos(a) * q * S * 0.25 * v;
            const py = y - h / 2 + (j + 0.5) * (h / 64) + (Math.sin(a) - 0.6) * q * S * 0.2 * v;
            ctx.globalAlpha = alpha * (1 - q) * Math.min(1, dissolution * 4);
            ctx.fillStyle = 'rgb(' + P.pix[o] + ',' + P.pix[o + 1] + ',' + P.pix[o + 2] + ')';
            const s = (l / 48) * (1 - q * 0.6);
            ctx.fillRect(px - s / 2, py - s / 2, s, s);
          }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    // ===================================================== préparation
    const T = {};
    function preparer() {
      const ttl = (cle, texte, o) => (T[cle] = titre(cle, texte, o));
      if (nomVersion === 'longue') {
        ttl('dix', '10', { style: 'metal', taille: S * L(0.62, 0.7), maxL: W * L(0.6, 0.8) });
        ttl('octobre', 'OCTOBRE', { style: 'blanc', poids: 500, taille: S * L(0.075, 0.095), espacement: 0.38, maxL: W * 0.86 });
        ttl('dixdix', '10.10', { style: 'metal', taille: S * L(0.42, 0.42), maxL: W * L(0.72, 0.86) });
        ttl('joel', 'JOËL', { style: 'metal', taille: S * L(0.36, 0.42), maxL: W * L(0.66, 0.86) });
        ttl('commence', 'Une nouvelle année commence.', { style: 'blanc', poids: 300, famille: POLICES.texte, taille: S * L(0.038, 0.048), espacement: 0.06, maxL: W * 0.86, flouLueur: 0.2 });
        Partition.versions.longue.parcours.forEach((p, k) => ttl('parcours' + k, p.mot, { style: 'blanc', poids: 700, taille: S * L(0.15, 0.15), espacement: 0.06, maxL: W * 0.86 }));
        Partition.versions.longue.reves.forEach((p, k) => ttl('reve' + k, p.mot, { style: 'blanc', poids: 700, taille: S * (photos.length ? L(0.09, 0.12) : L(0.17, 0.16)), espacement: 0.05, maxL: W * 0.84 }));
        ttl('joelFin', 'JOËL', { style: 'metal', taille: S * L(0.3, 0.38), maxL: W * L(0.6, 0.84) });
        ttl('dixOctobre', '10 OCTOBRE', { style: 'blanc', poids: 500, taille: S * L(0.07, 0.085), espacement: 0.3, maxL: W * 0.86 });
        if (portrait) {
          ttl('joyeux', 'JOYEUX', { style: 'blanc', poids: 600, famille: POLICES.texte, taille: S * 0.085, espacement: 0.14, maxL: W * 0.86 });
          ttl('anniv', 'ANNIVERSAIRE 🎂', { style: 'blanc', poids: 600, famille: POLICES.texte, taille: S * 0.085, espacement: 0.08, maxL: W * 0.9 });
        } else {
          ttl('anniv', 'JOYEUX ANNIVERSAIRE 🎂', { style: 'blanc', poids: 600, famille: POLICES.texte, taille: S * 0.062, espacement: 0.12, maxL: W * 0.86 });
        }
        ttl('annee', 'UNE NOUVELLE ANNÉE.', { style: 'blanc', poids: 500, taille: S * L(0.052, 0.062), espacement: 0.22, maxL: W * 0.9 });
        ttl('ere', 'UNE NOUVELLE ÈRE.', { style: 'blanc', poids: 700, taille: S * L(0.052, 0.062), espacement: 0.22, maxL: W * 0.9, couleurLueur: 'rgb(170,110,255)' });
        ttl('meilleur', 'Le meilleur reste à construire.', { style: 'blanc', poids: 300, famille: POLICES.texte, taille: S * L(0.04, 0.05), espacement: 0.04, maxL: W * 0.88, flouLueur: 0.2 });
        ttl('date', '10.10.2026', { style: 'blanc', poids: 300, taille: S * L(0.05, 0.065), espacement: 0.45, maxL: W * 0.9, flouLueur: 0.2 });
        nuageDe('dix', T.dix, 2200);
        nuageDe('dixdix', T.dixdix, 2600);
        nuageDe('joel', T.joel, 2600);
        nuageSilhouette();
        Partition.versions.longue.reves.forEach((p, k) => nuageDe('reve' + k, T['reve' + k], 2400));
      } else {
        ttl('dix', '10', { style: 'metal', taille: S * L(0.66, 0.74), maxL: W * L(0.6, 0.82) });
        ttl('octobre', 'OCTOBRE', { style: 'metal', poids: 700, taille: S * L(0.26, 0.2), espacement: 0.04, maxL: W * L(0.8, 0.88) });
        ttl('joel', 'JOËL', { style: 'metal', taille: S * L(0.4, 0.44), maxL: W * L(0.7, 0.86) });
        if (portrait) {
          ttl('joyeux', 'JOYEUX', { style: 'blanc', poids: 700, taille: S * 0.17, espacement: 0.06, maxL: W * 0.86 });
          ttl('anniv', 'ANNIVERSAIRE', { style: 'blanc', poids: 700, taille: S * 0.12, espacement: 0.04, maxL: W * 0.88 });
        } else {
          ttl('joyeux', 'JOYEUX', { style: 'blanc', poids: 700, taille: S * 0.16, espacement: 0.08, maxL: W * 0.8 });
          ttl('anniv', 'ANNIVERSAIRE', { style: 'blanc', poids: 700, taille: S * 0.16, espacement: 0.04, maxL: W * 0.82 });
        }
        ttl('gateau', '🎂', { style: 'blanc', poids: 400, famille: 'sans-serif', taille: S * L(0.1, 0.12) });
        ttl('date', '10.10.2026', { style: 'metal', taille: S * L(0.22, 0.2), maxL: W * L(0.8, 0.9) });
        ttl('joelPetit', 'JOËL', { style: 'blanc', poids: 500, taille: S * L(0.05, 0.06), espacement: 0.6, maxL: W * 0.8 });
        nuageDe('octobre', T.octobre, 2400);
        nuageDe('joel', T.joel, 2400);
      }
    }

    // Secousse de caméra après les impacts.
    function secousse(t) {
      let x = 0, y = 0;
      for (const [t0, f] of V.secousses) {
        const d = t - t0;
        if (d < 0 || d > 0.7) continue;
        const a = f * S * 0.012 * Math.exp(-d * 7);
        x += Math.sin(d * 63 + t0) * a;
        y += Math.cos(d * 51 + t0 * 2) * a;
      }
      return [x, y];
    }

    // ================================================= FILM — 90 SECONDES
    function scenesLongues(t) {
      const P = V;

      // ------------------------------------------- 01 — L'OBSCURITÉ
      if (t < 7.3) {
        etoiles(t, lin(t, 1.2, 5.5) * 0.55 * (1 - lin(t, 7.0, 7.3)), { part: 0.6 });
        let pouls = 0;
        for (const b of P.battements) if (t >= b) pouls += Math.exp(-(t - b) / 0.22);
        const apparition = lin(t, 0.8, 2.0);
        const r = S * (0.012 + 0.07 * entree(lin(t, 1, 7))) * (1 + 0.35 * pouls);
        halo(cx, cy, r * 4, apparition * (0.5 + 0.25 * pouls) * (1 - lin(t, 7.05, 7.3)));
        point(spriteListe[0], cx, cy, r * 0.6, apparition);
        // Poussières microscopiques autour de la lumière.
        const r2 = hasard(61);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 160; i++) {
          const rad = S * (0.03 + r2() * 0.25), a0 = r2() * Math.PI * 2, v = (0.05 + r2() * 0.2) * (r2() > 0.5 ? 1 : -1);
          const rr = rad * (1 - 0.35 * lin(t, 4, 7));
          const a = a0 + t * v;
          point(spriteListe[i % 4], cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7, S * 0.0025, lin(t, 2 + r2() * 2, 4.5) * 0.7);
        }
        ctx.globalCompositeOperation = 'source-over';
        ecrireFlou('Tout commence quelque part.', cx, cy + S * L(0.17, 0.2), { taille: S * L(0.03, 0.038), poids: 300, espacement: 0.22, couleur: 'rgba(235,228,255,0.85)' }, sortie(lin(t, 3.0, 4.0)) * (1 - lin(t, 5.6, 6.3)));
      }

      // --------------------------------------------- 02 — LE TEMPS
      if (t >= 6.9 && t < 14.6) {
        const exp = sortieForte(lin(t, 7.0, 8.9));
        const dist = melange(6.5, 0.7, douce(lin(t, 7.4, 14.6)));
        const elev = melange(0.95, 0.12, douce(lin(t, 7.0, 14.6)));
        const rot = (t - 7) * 0.12;
        const ce = Math.cos(elev), se = Math.sin(elev);
        const r = hasard(71);
        const n = Math.round(2600 * densite);
        const Fg = S * 0.9;
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < n; i++) {
          const bras = i % 3;
          const rad = Math.pow(r(), 1.6) * 3.2 + 0.05;
          const ang = (bras * Math.PI * 2) / 3 + rad * 1.4 + (r() - 0.5) * 0.6 + rot / (0.4 + rad * 0.3);
          const h = (r() - 0.5) * 0.18 * (1.2 - rad / 3.2);
          const c = r();
          const x = Math.cos(ang) * rad * exp, z = Math.sin(ang) * rad * exp, y = h * exp;
          const y2 = y * ce - z * se, z2 = y * se + z * ce + dist;
          if (z2 < 0.08) continue;
          const sx = cx + (x * Fg) / z2, sy = cy + (y2 * Fg) / z2;
          if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30) continue;
          const tl = S * 0.0035 * (0.4 + c) * (1.6 / z2 + 0.3);
          const col = rad < 0.6 ? (c > 0.5 ? 0 : 1) : c < 0.45 ? 2 : c < 0.75 ? 3 : c < 0.92 ? 1 : 4;
          point(spriteListe[col], sx, sy, Math.min(tl, S * 0.03), (0.35 + 0.65 * c) * lin(t, 7.0, 7.3));
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        halo(cx, cy, S * melange(0.6, 0.25, lin(t, 7, 8.5)), (1 - lin(t, 7, 9.5)) * 0.9 + 0.12);
        etoiles(t, lin(t, 8, 10) * 0.6, { part: 0.7 });
        // Le compteur du temps.
        const idx = (function () { let k = -1; for (let i = 0; i < P.compteur.length; i++) if (P.compteur[i] <= t) k = i; return k; })();
        if (idx >= 0) {
          const taille = S * L(0.2, 0.24);
          for (let g = 3; g >= 1; g--) {
            const j = idx - g;
            if (j < 0) continue;
            const age = t - P.compteur[j];
            const ech = 1 + age * 3.5;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(ech, ech);
            ecrire(String(j + 1).padStart(2, '0'), 0, 0, { taille, poids: 300, famille: POLICES.titre, alpha: 0.28 * Math.exp(-age * 3), couleur: '#cbb8ff' });
            ctx.restore();
          }
          const age = t - P.compteur[idx];
          ecrire(String(idx + 1).padStart(2, '0'), cx, cy, { taille: taille * (1 + 0.08 * Math.exp(-age * 12)), poids: 300, famille: POLICES.titre, alpha: 0.92, lueur: 'rgba(150,100,255,0.9)' });
        }
      }
      // 14.6 → 15.0 : silence, noir total.

      // ------------------------------------------- 03 — 10 OCTOBRE
      if (t >= 15.0 && t < 25.6) {
        const u = t - 15.3;
        fondNebuleuse(t, 0.55 * lin(t, 15.3, 17));
        etoiles(t, 0.5 * lin(t, 15.3, 16.5), { part: 0.5 });
        poussieres(t, lin(t, 15.4, 17) * (1 - lin(t, 25, 25.6)), 1);
        onde(t, 15.3, cx, L(cy * 0.9, cy * 0.85), 1);
        gerbe(t, 15.3, cx, L(H * 0.43, H * 0.4), 101, { nombre: 260, vitesse: 1.1, duree: 2.4, gravite: 0.1 });
        const yDix = L(H * 0.43, H * 0.4);
        const rot = 0.32 * Math.cos(u * 0.45) * (1 - lin(t, 21, 22)) - 0.05;
        const fondu10 = 1 - lin(t, 21.6, 22.2);
        if (u > 0 && fondu10 > 0) {
          const ech = melange(1.3, 1, sortieForte(lin(u, 0, 1.4))) * (1 + 0.05 * lin(t, 17, 21.6)) * (1 + 0.15 * lin(t, 21.6, 22.2));
          poser(T.dix, cx, yDix, {
            alpha: lin(u, 0, 0.18) * fondu10, echelle: ech, rotY: rot, flou: (1 - lin(u, 0, 0.45)) * S * 0.03,
            reflet: 0.8, lueur: 0.6 + 0.4 * Math.exp(-u * 2), balayage: lin(t, 15.9, 17.1),
          });
          const yOct = yDix + T.dix.haut * 0.5 + S * L(0.11, 0.14);
          const ao = sortie(lin(t, 17.0, 17.9)) * fondu10;
          ctx.save();
          ctx.translate(cx, yOct);
          ctx.scale(melange(1.25, 1, sortie(lin(t, 17, 18))), 1);
          poser(T.octobre, 0, 0, { alpha: ao, lueur: 0.6, balayage: lin(t, 19.2, 20.4), rotY: rot * 0.5 });
          ctx.restore();
        }
        // « 10 » se brise : les particules partent, « 10.10 » naît.
        former(nuageDe('dix', T.dix), cx, yDix, t, { t0: 21.4, t1: 21.6, t2: 21.65, t3: 23.2, tourbillon: 0, dispersion: 0.01 });
        const a1010 = sortie(lin(t, 22.0, 22.6)) * (1 - lin(t, 24.6, 25.1));
        if (a1010 > 0) {
          poser(T.dixdix, cx, cy, {
            alpha: a1010, echelle: melange(1.12, 1, sortie(lin(t, 22, 23))) * (1 + 0.05 * lin(t, 22, 25)), flou: (1 - lin(t, 22, 22.5)) * S * 0.02,
            reflet: 0.7, rotY: -0.12 + 0.1 * lin(t, 22, 25), balayage: lin(t, 23.0, 24.2),
          });
        }
        if (t > 22) halo(cx, cy, S * 0.7, 0.18 * a1010);
      }

      // ------------------------------------------- 04 — RÉVÉLATION
      if (t >= 24.5 && t < 35.3) {
        fondNebuleuse(t, 0.55);
        etoiles(t, 0.45, { part: 0.5 });
        poussieres(t, lin(t, 24.5, 25.5) * 0.8 * (1 - lin(t, 34.8, 35.2)), -1);
        const N1010 = nuageDe('dixdix', T.dixdix);
        const Nsil = nuageSilhouette();
        const Njoel = nuageDe('joel', T.joel);
        const recul = 1 - 0.14 * douce(lin(t, 31, 35));
        const yJ = L(cy * 0.94, cy * 0.92);
        const silY = cy + S * 0.02;
        if (t < 28.6) {
          // 10.10 → silhouette.
          former(Nsil, cx, silY, t, {
            t0: 24.7, t1: 27.4, tourbillon: 0.9, taille: 1.1, alpha: 1 - lin(t, 28.3, 28.6),
            depuis: { nuage: N1010, x: cx, y: cy, echelle: 1.05 },
          });
          halo(cx, silY - S * 0.15, S * 0.45, 0.2 * lin(t, 26, 27.5) * (1 - lin(t, 28, 28.6)));
        }
        if (t >= 28.3) {
          // Silhouette → JOËL.
          former(Njoel, cx, yJ, t, {
            t0: 28.3, t1: 31.0, tourbillon: 1.4, taille: 1.1, echelle: recul,
            alpha: 1 - 0.55 * lin(t, 31.2, 32.5),
            depuis: { nuage: Nsil, x: cx, y: silY, echelle: 1 + 0.15 * lin(t, 28.3, 29) },
          });
        }
        const aJ = sortie(lin(t, 30.5, 31.2)) * (1 - lin(t, 34.9, 35.2));
        poser(T.joel, cx, yJ, { alpha: aJ, echelle: recul * (1 + 0.6 * lin(t, 34.85, 35.2) ** 2), reflet: 0.6, lueur: 0.6 + 0.6 * Math.exp(-Math.max(0, t - 31) * 2), balayage: lin(t, 31.2, 32.4), rotY: 0.06 * Math.sin((t - 31) * 0.6) });
        if (t > 30.9) onde(t, 31.0, cx, yJ, 0.7);
        gerbe(t, 31.0, cx, yJ, 211, { nombre: 300, vitesse: 1.0, duree: 2.2, gravite: 0.15 });
        const yC = yJ + T.joel.haut * 0.5 * recul + S * L(0.11, 0.12);
        ecrireFlou(T.commence.texte, cx, yC, { taille: T.commence.taille, poids: 300, espacement: 0.06, couleur: 'rgba(240,235,255,0.92)' }, sortie(lin(t, 32.0, 33.0)) * (1 - lin(t, 34.4, 34.9)));
      }

      // ------------------------------------------- 05 — LE PARCOURS
      if (t >= 34.9 && t < 48.2) {
        etoiles(t, 0.35, { part: 0.5 });
        fondNebuleuse(t, 0.35);
        P.parcours.forEach((p, k) => {
          const fin = k < 3 ? P.parcours[k + 1].t : 48.0;
          if (t < p.t - 0.05 || t > fin + 0.12) return;
          const u = t - p.t;
          const a = lin(u, -0.05, 0.12) * (1 - lin(t, fin - 0.12, fin + 0.08));
          const zoom = melange(1.18, 1, sortieForte(lin(u, 0, 0.6))) * (1 + 0.04 * u / 3.25) * (1 + 0.5 * entree(lin(t, fin - 0.15, fin + 0.08)));
          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(zoom, zoom);
          ctx.translate(-cx, -cy);
          if (p.theme === 'code') {
            pluieCode(t, a);
            const l = W * L(0.27, 0.62), h = H * L(0.3, 0.17);
            if (portrait) {
              panneau(LIGNES_CODE[0], cx, H * 0.2, l, h, -0.3, u, a * 0.95, 1);
              panneau(LIGNES_CODE[1], cx, H * 0.79, l, h, 0.3, u - 0.3, a * 0.85, 2);
            } else {
              panneau(LIGNES_CODE[0], W * 0.2, H * 0.32, l, h, -0.35, u, a * 0.95, 1);
              panneau(LIGNES_CODE[1], W * 0.8, H * 0.68, l, h, 0.35, u - 0.3, a * 0.85, 2);
              panneau(LIGNES_CODE[2], W * 0.79, H * 0.24, l * 0.8, h * 0.75, 0.2, u - 0.6, a * 0.7, 3);
            }
          } else if (p.theme === 'formes') {
            const pr = lin(u, 0, 1.6);
            const tl = S * L(0.13, 0.12);
            filaire(ICOSA, L(W * 0.2, W * 0.28), L(H * 0.36, H * 0.22), tl * 0.6, u * 0.7, 0.4 + u * 0.3, pr, a, '#9b6dff');
            filaire(CUBE, L(W * 0.8, W * 0.74), L(H * 0.62, H * 0.8), tl * 0.55, -u * 0.6, 0.6, lin(u, 0.25, 1.9), a, '#7aa0ff');
            filaire(OCTA, L(W * 0.78, W * 0.78), L(H * 0.24, H * 0.2), tl * 0.55, u * 0.9, 0.3, lin(u, 0.5, 2.1), a * 0.9, '#ff9ad5');
            filaire(ICOSA, L(W * 0.24, W * 0.22), L(H * 0.74, H * 0.82), tl * 0.38, -u * 0.5, 1.1, lin(u, 0.7, 2.3), a * 0.8, '#b79bff');
          } else if (p.theme === 'circuits') {
            circuits(u, a);
            robot(L(W * 0.84, W * 0.5), L(H * 0.28, H * 0.2), S * 0.06, u, a * 0.9);
          } else reseau(u, a);
          ctx.restore();
          const Tm = T['parcours' + k];
          const am = sortie(lin(u, 0.05, 0.35)) * (1 - lin(t, fin - 0.12, fin));
          const glitchForce = (1 - lin(u, 0.05, 0.3)) + (Math.sin(u * 11 + k) > 0.985 ? 0.4 : 0);
          // Une ombre douce derrière le mot, pour qu'il reste lisible.
          halo(cx, cy, S * 0.55, 0);
          ctx.globalAlpha = am * 0.55;
          const ombre = ctx.createRadialGradient(cx, cy, 0, cx, cy, Tm.largeur * 0.7);
          ombre.addColorStop(0, 'rgba(0,0,0,0.85)');
          ombre.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = ombre;
          ctx.fillRect(cx - Tm.largeur, cy - Tm.largeur, Tm.largeur * 2, Tm.largeur * 2);
          ctx.globalAlpha = 1;
          poser(Tm, cx, cy, { alpha: am, echelle: melange(1.08, 1, sortie(lin(u, 0, 0.5))) * (1 + 0.03 * u / 3), lueur: 0.75, balayage: lin(u, 0.4, 1.3) });
          glitch(Tm, cx, cy, glitchForce, 1000 + k * 17 + Math.floor(u * 24), am);
          ecrire('0' + (k + 1) + ' / 04', cx, cy - Tm.haut * 0.5 - S * 0.07, { taille: S * 0.022, poids: 300, famille: POLICES.titre, espacement: 0.5, alpha: am * 0.7, couleur: '#cdbdff' });
        });
        // Flash entre les mots.
        for (const p of P.parcours) voile('#ffffff', 0.5 * (1 - lin(t, p.t, p.t + 0.12)) * (t >= p.t ? 1 : 0));
      }

      // ------------------------------------------- 06 — LES RÊVES
      if (t >= 47.8 && t < 58.4) {
        const a = lin(t, 47.8, 48.2) * (1 - lin(t, 57.9, 58.4));
        fondNebuleuse(t, 0.7 * a);
        etoiles(t, 0.8 * a, { part: 1 });
        poussieres(t, 0.6 * a, 1);
        const avecPhotos = photosPretes.length > 0;
        P.reves.forEach((r, k) => {
          if (t < r.t - 0.3 || t > r.t + 2.3) return;
          const N = nuageDe('reve' + k, T['reve' + k]);
          const y = avecPhotos ? L(H * 0.84, H * 0.8) : cy;
          if (avecPhotos) {
            const P0 = photosPretes[k % photosPretes.length];
            const pl = L(W * 0.34, W * 0.74), ph = L(H * 0.6, H * 0.5);
            const u = (t - r.t + 0.3) / 2.4;
            cadrePhoto(P0, cx, L(H * 0.4, H * 0.38), pl, ph, u, lin(t, r.t - 0.3, r.t + 0.1), lin(t, r.t + 1.55, r.t + 2.2));
          }
          former(N, cx, y, t, { t0: r.t - 0.2, t1: r.t + 0.75, t2: r.t + 1.45, t3: r.t + 2.2, tourbillon: 1.2, taille: 1 });
          poser(T['reve' + k], cx, y, { alpha: 0.85 * fenetre(t, r.t + 0.45, r.t + 1.55, 0.35, 0.3), lueur: 0.9, balayage: lin(t, r.t + 0.6, r.t + 1.4) });
        });
      }

      // ------------------------------------------- 07 — LE MESSAGE
      if (t >= 58.0 && t < 70.4) {
        const respire = 0.5 + 0.5 * Math.sin((t - 58) * 0.9);
        halo(cx, cy, S * (0.65 + 0.05 * respire), (0.12 + 0.05 * respire) * lin(t, 58, 59.5) * (1 - lin(t, 69.6, 70.3)));
        poussieres(t * 0.4, 0.35 * lin(t, 58, 60), -1);
        etoiles(t, 0.2, { part: 0.4 });
        const o = { taille: S * L(0.058, 0.066), poids: 300, espacement: 0.02, couleur: '#f3efff' };
        P.message.forEach((m, k) => {
          if (t < m.t || t > m.fin) return;
          const lignes = couper(m.texte, o, W * L(0.72, 0.84));
          const hl = o.taille * 1.45;
          let idx = 0;
          const sortieM = 1 - lin(t, m.fin - 0.5, m.fin);
          lignes.forEach((mots, j) => {
            const y = cy + (j - (lignes.length - 1) / 2) * hl;
            const largeurs = mots.map((w) => mesurer(w, o));
            const espace = mesurer(' ', o);
            const total = largeurs.reduce((a, b) => a + b, 0) + espace * (mots.length - 1);
            let x = cx - total / 2;
            mots.forEach((w, i) => {
              const tw = m.t + idx * (k === 0 ? 0.42 : 0.27);
              idx++;
              const ap = sortie(lin(t, tw, tw + 0.55));
              ecrireFlou(w, x + largeurs[i] / 2, y, Object.assign({}, o, { alpha: sortieM, lueur: k === 2 ? 'rgba(160,110,255,0.6)' : null }), ap);
              x += largeurs[i] + espace;
            });
          });
        });
      }

      // ------------------------------------------- 08 — MONTÉE FINALE
      if (t >= 69.8 && t < 79.6) {
        const m = lin(t, 70, 79.6);
        const aA = lin(t, 69.8, 70.6) * (1 - lin(t, 73.4, 74.2) * 0.6);
        fondNebuleuse(t, 0.4 + 0.4 * m);
        etoiles(t, 1.2 * aA + 0.5 * m, { part: 1, trainees: borne(0.35 + m) });
        poussieres(t * 3, 0.5 * aA, 1);
        // Tunnel d'anneaux.
        const aB = fenetre(t, 73.0, 76.9, 0.8, 0.6);
        if (aB > 0) {
          const z = camZ(t);
          ctx.globalCompositeOperation = 'lighter';
          for (let k = 0; k < 18; k++) {
            const zr = ((((k * 0.6 - z) % 10.8) + 10.8) % 10.8) + 0.1;
            const R = (1.3 / zr) * F;
            const al = aB * borne((10.8 - zr) / 4) * borne(zr / 0.6);
            ctx.globalAlpha = al * 0.5;
            ctx.strokeStyle = k % 2 ? '#7c4dff' : '#5b7dff';
            ctx.lineWidth = Math.max(1, (S * 0.01) / zr);
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.stroke();
            for (let j = 0; j < 24; j++) {
              const a = (j / 24) * Math.PI * 2 + k * 0.3 + t * 0.4;
              point(spriteListe[j % 3], cx + Math.cos(a) * R, cy + Math.sin(a) * R, (S * 0.01) / zr, al);
            }
          }
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }
        // Tunnel de grille.
        const aC = lin(t, 76.3, 77.0);
        if (aC > 0) {
          const z = camZ(t);
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = '#8d6bff';
          for (let k = 0; k < 16; k++) {
            const zr = ((((k * 0.7 - z) % 11.2) + 11.2) % 11.2) + 0.1;
            const s = (1.0 / zr) * F;
            ctx.globalAlpha = aC * 0.55 * borne((11.2 - zr) / 4) * borne(zr / 0.5);
            ctx.lineWidth = Math.max(1, (S * 0.006) / zr);
            ctx.strokeRect(cx - s * L(1.6, 0.9), cy - s * L(0.9, 1.6), s * L(3.2, 1.8), s * L(1.8, 3.2));
          }
          ctx.globalAlpha = aC * 0.3;
          ctx.lineWidth = 1;
          for (let k = -6; k <= 6; k++) {
            for (const sgn of [-1, 1]) {
              ctx.beginPath();
              ctx.moveTo(cx + k * W * 0.12, cy + sgn * H * 0.9);
              ctx.lineTo(cx + k * W * 0.004, cy + sgn * H * 0.02);
              ctx.stroke();
            }
          }
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }
        halo(cx, cy, S * (0.2 + 0.6 * m * m), 0.2 + 0.6 * entree(m));
        voile('#ffffff', entree(lin(t, 78.7, 79.6)));
      }
      if (t >= 79.6 && t < 80.0) voile('#ffffff', 1);

      // ------------------------------------- 09 — JOYEUX ANNIVERSAIRE
      if (t >= 80.0) {
        fondNebuleuse(t, 0.75 * (1 - lin(t, 88.4, 89.0)));
        etoiles(t, 0.6 * (1 - lin(t, 88.4, 89.0)), { part: 0.8 });
        poussieres(t, 0.6 * (1 - lin(t, 88.4, 89.0)), 1);
        const yJ = L(H * 0.36, H * 0.33) - S * 0.04 * douce(lin(t, 84.5, 85.3));
        onde(t, 80.0, cx, yJ, 1.3);
        gerbe(t, 80.0, cx, yJ, 401, { nombre: 700, vitesse: 2.0, duree: 3.2, gravite: 0.25 });
        confettis(t, 80.0, { x: cx, y: yJ, nombre: 380, graine: 7, fin: 88.6 });
        confettis(t, 82.4, { pluie: true, nombre: 260, graine: 9, fin: 88.6 });
        const finale = 1 - lin(t, 88.4, 89.0);
        const aJ = lin(t, 80.4, 80.65) * finale;
        poser(T.joelFin, cx, yJ, {
          alpha: aJ, echelle: melange(1.35, 1, sortieForte(lin(t, 80.4, 81.4))) * (1 + 0.04 * lin(t, 81, 88.4)), flou: (1 - lin(t, 80.4, 80.8)) * S * 0.02,
          reflet: 0.35, lueur: 0.7 + 0.5 * Math.exp(-(t - 80.4) * 1.5), balayage: lin(t, 83.3, 84.3), rotY: 0.05 * Math.sin((t - 80) * 0.5),
        });
        const yO = yJ + T.joelFin.haut * 0.5 + S * L(0.1, 0.1);
        const aO = sortie(lin(t, 81.4, 82.0)) * finale;
        poser(T.dixOctobre, cx, yO, { alpha: aO, echelle: melange(1.2, 1, sortie(lin(t, 81.4, 82.2))), lueur: 0.7, balayage: lin(t, 83.5, 84.5) });
        const yA = yO + S * L(0.13, 0.13);
        const aA = sortie(lin(t, 82.4, 83.0)) * (1 - lin(t, 84.3, 84.7));
        if (portrait) {
          poser(T.joyeux, cx, yA, { alpha: aA, echelle: melange(0.9, 1, sortie(lin(t, 82.4, 83))), lueur: 0.6 });
          poser(T.anniv, cx, yA + S * 0.11, { alpha: aA, echelle: melange(0.9, 1, sortie(lin(t, 82.5, 83.1))), lueur: 0.6 });
        } else {
          poser(T.anniv, cx, yA, { alpha: aA, echelle: melange(0.9, 1, sortie(lin(t, 82.4, 83))), lueur: 0.6 });
        }
        faisceau(lin(t, 83.2, 84.2), 1);
        const yN = yO + S * L(0.14, 0.15);
        poser(T.annee, cx, yN, { alpha: sortie(lin(t, 84.8, 85.4)) * finale, echelle: melange(1.1, 1, sortie(lin(t, 84.8, 85.5))), lueur: 0.5 });
        poser(T.ere, cx, yN + S * L(0.08, 0.09), { alpha: sortie(lin(t, 85.6, 86.2)) * finale, echelle: melange(1.15, 1, sortie(lin(t, 85.6, 86.3))), lueur: 0.9, balayage: lin(t, 86.2, 87.0) });
        const yM = yN + S * L(0.2, 0.24);
        ecrireFlou(T.meilleur.texte, cx, yM, { taille: T.meilleur.taille, poids: 300, espacement: 0.04, couleur: '#f1ebff', lueur: 'rgba(150,100,255,0.5)' }, sortie(lin(t, 87.0, 87.8)) * finale);
        voile('#ffffff', 1 - sortie(lin(t, 80.0, 80.7)));
        // Dernière inscription.
        const aD = sortie(lin(t, 89.1, 89.6)) * (1 - lin(t, 89.8, 90));
        poser(T.date, cx, cy, { alpha: aD, lueur: 0.5, echelle: 1 + 0.03 * lin(t, 89.1, 90) });
      }
    }

    // ================================================= FILM — 15 SECONDES
    function scenesCourtes(t) {
      const yC = cy;
      fondNebuleuse(t, 0.6 * lin(t, 0.15, 1));
      etoiles(t, 0.6 * lin(t, 0.15, 0.8), { part: 0.8 });
      poussieres(t, 0.6 * lin(t, 0.2, 1.2) * (1 - lin(t, 14.4, 15)), 1);

      // 0–3 : 10
      if (t < 3.2) {
        onde(t, 0.15, cx, yC, 1.2);
        gerbe(t, 0.15, cx, yC, 11, { nombre: 400, vitesse: 1.6, duree: 2.4, gravite: 0.1 });
        const a = lin(t, 0.15, 0.3) * (1 - lin(t, 2.85, 3.05));
        poser(T.dix, cx, yC, {
          alpha: a, echelle: melange(1.45, 1, sortieForte(lin(t, 0.15, 1.3))) * (1 + 0.6 * entree(lin(t, 2.6, 3.05))), flou: (1 - lin(t, 0.15, 0.5)) * S * 0.03,
          rotY: 0.3 * Math.cos(t * 0.8), reflet: 0.7, lueur: 0.7, balayage: lin(t, 1.0, 2.1),
        });
        voile('#ffffff', 0.9 * (1 - lin(t, 0.15, 0.5)) * (t >= 0.15 ? 1 : 0));
      }
      // 3–6 : OCTOBRE
      if (t >= 2.8 && t < 6.2) {
        former(nuageDe('octobre', T.octobre), cx, yC, t, { t0: 2.8, t1: 3.5, t2: 5.65, t3: 6.2, tourbillon: 1.4 });
        const a = sortie(lin(t, 3.2, 3.6)) * (1 - lin(t, 5.6, 5.85));
        poser(T.octobre, cx, yC, { alpha: a, echelle: 1 + 0.05 * lin(t, 3, 6), reflet: 0.6, lueur: 0.6, balayage: lin(t, 3.8, 4.9), rotY: -0.15 + 0.1 * lin(t, 3, 6) });
      }
      // 6–9 : JOËL
      if (t >= 5.6 && t < 9.2) {
        former(nuageDe('joel', T.joel), cx, yC, t, { t0: 5.5, t1: 6.05, tourbillon: 1.6, alpha: 1 - lin(t, 6.2, 7.2) * 0.6 });
        onde(t, 6.0, cx, yC, 0.9);
        gerbe(t, 6.0, cx, yC, 61, { nombre: 300, vitesse: 1.2, duree: 2.0, gravite: 0.15 });
        const a = sortie(lin(t, 5.95, 6.2)) * (1 - lin(t, 8.85, 9.0));
        poser(T.joel, cx, yC, { alpha: a, echelle: melange(1.15, 1, sortie(lin(t, 6, 6.8))) * (1 + 0.05 * lin(t, 6, 9)), reflet: 0.7, lueur: 0.6 + 0.6 * Math.exp(-(t - 6) * 2), balayage: lin(t, 6.5, 7.6), rotY: 0.08 * Math.sin(t) });
      }
      // 9–12 : JOYEUX ANNIVERSAIRE
      if (t >= 8.9 && t < 12.0) {
        onde(t, 9.0, cx, yC, 1.2);
        gerbe(t, 9.0, cx, yC, 91, { nombre: 600, vitesse: 2, duree: 2.8, gravite: 0.25 });
        confettis(t, 9.0, { x: cx, y: yC, nombre: 360, graine: 3, fin: 14.6 });
        const a = sortie(lin(t, 9.0, 9.3));
        const e = melange(1.25, 1, sortieForte(lin(t, 9.0, 9.9))) * (1 + 0.06 * lin(t, 9.5, 11.9));
        const ecart = S * L(0.12, 0.1);
        poser(T.joyeux, cx, yC - ecart, { alpha: a, echelle: e, lueur: 0.7, balayage: lin(t, 10.0, 11.0) });
        poser(T.anniv, cx, yC + ecart * L(0.75, 0.6), { alpha: sortie(lin(t, 9.15, 9.45)), echelle: e, lueur: 0.7, balayage: lin(t, 10.2, 11.2) });
        poser(T.gateau, cx, yC + ecart * L(2.2, 1.9), { alpha: sortie(lin(t, 9.5, 9.9)), echelle: melange(0.6, 1, sortie(lin(t, 9.5, 10.1))), lueur: 0 });
        voile('#ffffff', 0.8 * (1 - lin(t, 9.0, 9.35)) * (t >= 9 ? 1 : 0));
        voile('#ffffff', entree(lin(t, 11.3, 11.9)));
        if (t >= 11.9) voile('#ffffff', 1);
      }
      // 12–15 : 10.10.2026
      if (t >= 12.0) {
        confettis(t, 12.0, { pluie: true, nombre: 240, graine: 5, fin: 14.7 });
        gerbe(t, 12.0, cx, yC, 121, { nombre: 700, vitesse: 2.2, duree: 3, gravite: 0.2 });
        onde(t, 12.0, cx, yC, 1.4);
        const fin = 1 - lin(t, 14.5, 15);
        poser(T.joelPetit, cx, yC - T.date.haut * 0.5 - S * 0.12, { alpha: sortie(lin(t, 12.6, 13.2)) * fin, lueur: 0.5 });
        poser(T.date, cx, yC, { alpha: lin(t, 12.0, 12.1) * fin, echelle: melange(1.3, 1, sortieForte(lin(t, 12.0, 12.9))) * (1 + 0.04 * lin(t, 12.5, 15)), reflet: 0.6, lueur: 0.7 + 0.6 * Math.exp(-(t - 12) * 2), balayage: lin(t, 12.7, 13.8) });
        voile('#ffffff', 1 - sortie(lin(t, 12.0, 12.5)));
      }
    }

    // ===================================================== une image
    function dessiner(t) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const silence = (V.silences || []).some(([a, b]) => t >= a && t < b) && nomVersion === 'longue' && t < 15;
      if (!silence) {
        const [sx, sy] = secousse(t);
        ctx.setTransform(1, 0, 0, 1, sx, sy);
        if (nomVersion === 'longue') scenesLongues(t);
        else scenesCourtes(t);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(vignette, 0, 0);
      if (grain) {
        const r = hasard(Math.floor(t * 30) + 1);
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.07;
        const ox = -Math.floor(r() * 256), oy = -Math.floor(r() * 256);
        for (let y = oy; y < H; y += 256) for (let x = ox; x < W; x += 256) ctx.drawImage(tuileGrain, x, y);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    preparer();
    return { dessiner, duree: V.duree, version: nomVersion, portrait };
  }

  // Attend que les polices soient chargées (indispensable avant de cuire
  // les titres et d'en extraire les particules).
  async function chargerPolices() {
    if (!document.fonts) return;
    await Promise.all(AFFICHAGES_POLICES.map((p) => document.fonts.load(p, 'JOËL 10 ÈÉ').catch(() => null)));
    await document.fonts.ready;
  }

  racine.JoelFilm = { creer, chargerPolices };
})(typeof self !== 'undefined' ? self : this);
