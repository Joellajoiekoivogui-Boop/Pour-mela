/*
 * Le film des photos, dessiné sur un seul <canvas>.
 *
 * Chaque photo naît dans un médaillon en forme de cœur qui bat, son visage
 * au creux du cœur ; puis le cœur s'ouvre jusqu'à remplir l'écran pendant
 * que la caméra recule (effet « iris »). La photo vit ensuite : lent zoom
 * vers le visage (effet Ken Burns), lumière chaude qui passe, poussières
 * dorées. À la fin, la dernière photo se referme en cœur, bat une dernière
 * fois et éclate.
 *
 * Sur un écran large (ordinateur, téléphone à l'horizontale), la photo est
 * présentée dans un cadre lumineux au lieu d'être trop recadrée.
 *
 * Une vidéo se joue de la même façon (sans le son, la musique continue) :
 * chaque image de la vidéo est copiée sur le canvas.
 */
(function (global) {
  'use strict';

  var Amour = global.Amour = global.Amour || {};
  var doc = global.document;

  // Durées, en secondes.
  var APPARITION = 0.55, BATTEMENT = 0.85, OUVERTURE = 1.2;
  var FERMETURE = 1.2, ECLAT = 0.62, FONDU = 0.9, RETRAIT = 0.6;

  var toile = null, ctx = null, testeur = null;
  var L = 0, H = 0, dpr = 1;
  var theme = null, leger = false, reduit = false, E = null;
  var couches = [];            // photos à l'écran, de la plus ancienne à la plus récente
  var rafId = 0, enCours = false, dernier = 0, temps = 0;
  var niveau = 0;              // 0 à 1 : présence des lumières sur la photo
  var poussieres = [], cumulEtincelles = 0;
  var spriteLueur = null, spriteFuite = null;
  var couvert = false, minuterieTaille = 0;
  var generation = 0;          // change à chaque arrêt : annule les vidéos en attente

  function borne(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function lisse(t) { t = borne(t, 0, 1); return t * t * (3 - 2 * t); }
  function entreeSortie(t) { t = borne(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function ressort(t) { t = borne(t, 0, 1) - 1; return 1 + 2.96 * t * t * t + 1.96 * t * t; }
  function hasard(a, b) { return a + Math.random() * (b - a); }
  function horloge() { return (global.performance && performance.now ? performance.now() : Date.now()) / 1000; }

  function rgba(hex, a) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  // Battement de cœur (comme l'animation CSS « battement »), t de 0 à 1.
  var BATS = [[0, 1], [0.13, 1.1], [0.27, 0.97], [0.4, 1.06], [0.58, 1]];
  function battement(t) {
    t = borne(t, 0, 1);
    for (var i = 1; i < BATS.length; i++) {
      if (t <= BATS[i][0]) return mix(BATS[i - 1][1], BATS[i][1], lisse((t - BATS[i - 1][0]) / (BATS[i][0] - BATS[i - 1][0])));
    }
    return 1;
  }

  /* ------------------------------------------------------------------ */
  /* Le cœur (même dessin que partout ailleurs sur la page)              */
  /* ------------------------------------------------------------------ */

  // Six courbes de Bézier, cœur centré en (0, 0), largeur 100.
  var SEGMENTS = [
    [0, 42, -3, 39, -42, 14, -46, -12],
    [-46, -12, -49, -30, -38, -42, -23, -42],
    [-23, -42, -12, -42, -4, -35, 0, -26],
    [0, -26, 4, -35, 12, -42, 23, -42],
    [23, -42, 38, -42, 49, -30, 46, -12],
    [46, -12, 42, 14, 3, 39, 0, 42]
  ];

  function tracerCoeur(c, x, y, l) {
    var k = l / 100;
    c.beginPath();
    c.moveTo(x, y + 42 * k);
    for (var i = 0; i < 6; i++) {
      var s = SEGMENTS[i];
      c.bezierCurveTo(x + s[2] * k, y + s[3] * k, x + s[4] * k, y + s[5] * k, x + s[6] * k, y + s[7] * k);
    }
    c.closePath();
  }

  // Point du contour, u de 0 à 6 (un entier par courbe).
  function pointCoeur(x, y, l, u) {
    var i = Math.min(5, Math.floor(u)), t = u - i, s = SEGMENTS[i], k = l / 100, m = 1 - t;
    var a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
    return {
      x: x + (a * s[0] + b * s[2] + c * s[4] + d * s[6]) * k,
      y: y + (a * s[1] + b * s[3] + c * s[5] + d * s[7]) * k
    };
  }

  function boiteCoeur(h) { return { x: h.x - 0.49 * h.l, y: h.y - 0.42 * h.l, w: 0.98 * h.l, h: 0.84 * h.l }; }

  function intersection(a, b) {
    var x = Math.max(a.x, b.x), y = Math.max(a.y, b.y);
    var w = Math.min(a.x + a.w, b.x + b.w) - x, h = Math.min(a.y + a.h, b.y + b.h) - y;
    return w > 0 && h > 0 ? { x: x, y: y, w: w, h: h } : null;
  }

  function cheminArrondi(c, R, r) {
    c.beginPath();
    c.moveTo(R.x + r, R.y);
    c.arcTo(R.x + R.w, R.y, R.x + R.w, R.y + R.h, r);
    c.arcTo(R.x + R.w, R.y + R.h, R.x, R.y + R.h, r);
    c.arcTo(R.x, R.y + R.h, R.x, R.y, r);
    c.arcTo(R.x, R.y, R.x + R.w, R.y, r);
    c.closePath();
  }

  /* ------------------------------------------------------------------ */
  /* Mise en page et caméra                                              */
  /* ------------------------------------------------------------------ */

  // Zone de la photo : tout l'écran si le recadrage reste raisonnable,
  // sinon un cadre centré aux proportions de la photo.
  function zone(p) {
    var couvre = Math.max(L / p.iw, H / p.ih), contient = Math.min(L / p.iw, H / p.ih);
    if (couvre / contient <= 1.8) return { x: 0, y: 0, w: L, h: H, plein: true };
    var h = H * 0.8, w = h * p.iw / p.ih;
    if (w > L * 0.86) { w = L * 0.86; h = w * p.ih / p.iw; }
    return { x: (L - w) / 2, y: (H - h) / 2 - H * 0.035, w: w, h: h, plein: false };
  }

  // Caméra : z = zoom (1 = la photo couvre juste la zone), (cx, cy) = point
  // de la photo (de 0 à 1) placé au centre de la zone.
  function echelle(p, R, z) { return Math.max(R.w / p.iw, R.h / p.ih) * z; }

  function placement(p, R, cam) {
    var s = echelle(p, R, cam.z), w = p.iw * s, h = p.ih * s;
    return { x: R.x + R.w / 2 - cam.cx * w, y: R.y + R.h / 2 - cam.cy * h, w: w, h: h };
  }

  function camBornee(p, R, cam) {
    var s = echelle(p, R, cam.z), dx = R.w / (2 * p.iw * s), dy = R.h / (2 * p.ih * s);
    return { z: cam.z, cx: borne(cam.cx, dx, 1 - dx), cy: borne(cam.cy, dy, 1 - dy) };
  }

  function melangerCam(a, b, t) { return { z: mix(a.z, b.z, t), cx: mix(a.cx, b.cx, t), cy: mix(a.cy, b.cy, t) }; }

  // Photo en plein écran : lent zoom vers le visage (Ken Burns).
  function camPleine(c, t) {
    var p = c.photo, u = reduit ? 0 : lisse(t / 9);
    return camBornee(p, c.R, { z: 1 + 0.18 * u, cx: p.fx, cy: mix(0.5, p.fy, 0.6 * u) });
  }

  // Gros plan sur le visage, pour le médaillon.
  function camProche(c) {
    var p = c.photo, hauteur = p.ih * echelle(p, c.R, 1);
    return { z: borne(0.84 * c.lm / (0.27 * hauteur), 1, 2.4) * 1.12, cx: p.fx, cy: p.fy };
  }

  // Le cœur suit le visage, placé un peu au-dessus du centre du cœur.
  function coeurSur(c, cam, l) {
    var p = c.photo, pl = placement(p, c.R, cam);
    return { x: pl.x + p.fx * pl.w, y: pl.y + p.fy * pl.h + 0.06 * l, l: l };
  }

  // Le cœur couvre-t-il toute la zone R ?
  function couvreZone(x, y, l, R) {
    tracerCoeur(testeur, x, y, l);
    for (var i = 0; i <= 3; i++) {
      var f = i / 3;
      if (!testeur.isPointInPath(R.x + R.w * f, R.y) || !testeur.isPointInPath(R.x + R.w * f, R.y + R.h) ||
          !testeur.isPointInPath(R.x, R.y + R.h * f) || !testeur.isPointInPath(R.x + R.w, R.y + R.h * f)) return false;
    }
    return true;
  }

  // Taille du cœur qui couvre la zone entière, une fois la caméra arrivée.
  function largeurPleine(c) {
    var arrivee = camPleine(c, 0), m = Math.max(c.R.w, c.R.h), bas = 0.3 * m, haut = 12 * m;
    for (var i = 0; i < 22; i++) {
      var milieu = (bas + haut) / 2, h = coeurSur(c, arrivee, milieu);
      if (couvreZone(h.x, h.y, milieu, c.R)) haut = milieu; else bas = milieu;
    }
    return haut * 1.04;
  }

  function mettreEnPage(c) {
    c.R = zone(c.photo);
    c.lm = Math.min(0.7 * c.R.w, 0.65 * c.R.h, 400);
    c.lPleine = largeurPleine(c);
  }

  /* ------------------------------------------------------------------ */
  /* Chronologie de chaque photo                                         */
  /* ------------------------------------------------------------------ */

  function passerPleine(c, t) {
    c.mode = 'pleine';
    c.tPleine = t;
    for (var i = 0; i < couches.length; i++) {
      var d = couches[i];
      if (d === c || d.mode === 'retrait') continue;
      if (d.R.plein && c.R.plein) d.mode = 'fini';
      else { d.mode = 'retrait'; d.t0 = t; }
    }
    if (c.resoudre) { c.resoudre(); c.resoudre = null; }
  }

  function prevenir(c, nom, h) {
    var f = c.rappels && c.rappels[nom];
    if (f) { try { f(h.x, h.y); } catch (e) { /* jamais bloquant */ } }
  }

  // État d'une photo à l'instant t : caméra, cœur (découpe), anneau lumineux.
  function etat(c, t) {
    var e = { cam: null, coeur: null, anneau: 0, alpha: 1 };
    var age = t - c.t0, proche;

    if (c.mode === 'ouverture') {
      proche = camProche(c);
      if (age < APPARITION) {
        e.cam = proche;
        e.coeur = coeurSur(c, proche, c.lm * ressort(age / APPARITION));
        e.anneau = lisse(age / (APPARITION * 0.6));
        if (!c.apparu && age > 0.04) {
          // les petits cœurs jaillissent du creux du cœur, au-dessus du visage
          var h = coeurSur(c, proche, c.lm);
          c.apparu = true;
          prevenir(c, 'apparition', { x: h.x, y: h.y - 0.3 * h.l });
        }
      } else if (age < APPARITION + BATTEMENT) {
        e.cam = proche;
        e.coeur = coeurSur(c, proche, c.lm * battement((age - APPARITION) / BATTEMENT));
        e.anneau = 1;
      } else if (age < APPARITION + BATTEMENT + OUVERTURE) {
        var u = (age - APPARITION - BATTEMENT) / OUVERTURE;
        e.cam = melangerCam(proche, camPleine(c, 0), entreeSortie(u));
        e.coeur = coeurSur(c, e.cam, mix(c.lm, c.lPleine, Math.pow(u, 2.4)));
        e.anneau = 1 - lisse((u - 0.3) / 0.5);
      } else {
        passerPleine(c, c.t0 + APPARITION + BATTEMENT + OUVERTURE);
      }
    } else if (c.mode === 'entree') {
      e.alpha = lisse(age / FONDU);
      if (age >= FONDU) passerPleine(c, c.t0 + FONDU);
    } else if (c.mode === 'fermeture') {
      proche = camProche(c);
      if (age < FERMETURE) {
        var v = age / FERMETURE;
        e.cam = melangerCam(c.camDepart, proche, entreeSortie(v));
        e.coeur = coeurSur(c, e.cam, mix(c.lPleine, c.lm, 1 - Math.pow(1 - v, 2.4)));
        e.anneau = lisse((v - 0.35) / 0.5);
      } else if (age < FERMETURE + BATTEMENT) {
        e.cam = proche;
        e.coeur = coeurSur(c, proche, c.lm * battement((age - FERMETURE) / BATTEMENT));
        e.anneau = 1;
      } else if (age < FERMETURE + BATTEMENT + ECLAT) {
        // Le cœur se serre, puis éclate en grandissant et s'efface.
        var w = (age - FERMETURE - BATTEMENT) / ECLAT;
        var taille = w < 0.3 ? mix(1, 0.84, lisse(w / 0.3)) : mix(0.84, 1.9, lisse((w - 0.3) / 0.7));
        e.cam = proche;
        e.coeur = coeurSur(c, proche, c.lm * taille);
        e.alpha = w < 0.3 ? 1 : 1 - lisse((w - 0.3) / 0.55);
        e.anneau = e.alpha;
        if (!c.eclate && w >= 0.3) { c.eclate = true; prevenir(c, 'eclat', coeurSur(c, proche, c.lm)); }
      } else {
        c.mode = 'fini';
      }
    } else if (c.mode === 'sortie') {
      e.alpha = 1 - lisse(age / FONDU);
      if (age >= FONDU) c.mode = 'fini';
    } else if (c.mode === 'retrait') {
      e.alpha = 1 - lisse(age / RETRAIT);
      if (age >= RETRAIT) c.mode = 'fini';
    }

    if (!e.cam) e.cam = camPleine(c, c.tPleine === undefined ? 0 : t - c.tPleine);
    if (c.mode === 'fini' && c.resoudre) { c.resoudre(); c.resoudre = null; }
    return e;
  }

  /* ------------------------------------------------------------------ */
  /* Dessin                                                              */
  /* ------------------------------------------------------------------ */

  function dessinerCouche(c, e, voile) {
    var p = c.photo, R = c.R;
    var pl = placement(p, R, e.cam);
    // La photo doit toujours couvrir la partie visible.
    var g = e.coeur ? intersection(R, boiteCoeur(e.coeur)) : R;
    if (!g) return;
    pl.x = borne(pl.x, g.x + g.w - pl.w, g.x);
    pl.y = borne(pl.y, g.y + g.h - pl.h, g.y);

    ctx.save();
    ctx.globalAlpha = e.alpha;
    if (e.coeur) {
      if (!leger && e.anneau > 0.02) {
        // halo derrière le médaillon
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.55 * e.anneau * e.alpha;
        ctx.drawImage(spriteLueur, e.coeur.x - e.coeur.l, e.coeur.y - e.coeur.l, e.coeur.l * 2, e.coeur.l * 2);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = e.alpha;
      }
      tracerCoeur(ctx, e.coeur.x, e.coeur.y, e.coeur.l);
      ctx.clip();
    }
    if (!R.plein) {
      var rayon = Math.min(18, R.w * 0.04);
      ctx.save();
      ctx.shadowColor = rgba(theme.principale, 0.55);
      ctx.shadowBlur = 40 * dpr;
      ctx.fillStyle = rgba(theme.fond[0], 1);
      cheminArrondi(ctx, R, rayon);
      ctx.fill();
      ctx.restore();
      cheminArrondi(ctx, R, rayon);
      ctx.clip();
    }
    ctx.drawImage(p.img, pl.x, pl.y, pl.w, pl.h);
    if (voile > 0.01) {
      ctx.fillStyle = 'rgba(0,0,0,' + voile.toFixed(3) + ')';
      ctx.fillRect(R.x, R.y, R.w, R.h);
    }
    if (!R.plein) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.2;
      cheminArrondi(ctx, R, Math.min(18, R.w * 0.04));
      ctx.stroke();
    }
    ctx.restore();
  }

  function dessinerAnneau(h, a) {
    if (a <= 0.02) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = 'round';
    tracerCoeur(ctx, h.x, h.y, h.l);
    ctx.strokeStyle = rgba(theme.claire, (0.3 * a).toFixed(3));
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.strokeStyle = rgba(theme.principale, (0.55 * a).toFixed(3));
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.95 * a).toFixed(3) + ')';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // Paillettes semées le long du contour lumineux (canvas « magie »).
  function semerEtincelles(h, a, dt) {
    if (!E || !E.poussiere || reduit || a < 0.2) return;
    cumulEtincelles += dt * a * (leger ? 14 : 34);
    while (cumulEtincelles >= 1) {
      cumulEtincelles -= 1;
      var pt = pointCoeur(h.x, h.y, h.l, Math.random() * 6);
      if (pt.x > -10 && pt.x < L + 10 && pt.y > -10 && pt.y < H + 10) E.poussiere(pt.x, pt.y, 1);
    }
  }

  // Lumière chaude qui traverse lentement la photo, poussières dorées.
  function dessinerLumieres(dt, R) {
    if (leger || reduit || niveau <= 0.01) return;
    ctx.save();
    if (!R.plein) { cheminArrondi(ctx, R, Math.min(18, R.w * 0.04)); ctx.clip(); }
    var taille = 1.25 * Math.max(R.w, R.h);
    var fx = R.x + R.w * (0.5 + 0.42 * Math.sin(temps * 0.19));
    var fy = R.y + R.h * (0.38 + 0.3 * Math.sin(temps * 0.13 + 1.2));
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.24 * niveau;
    ctx.drawImage(spriteFuite, fx - taille / 2, fy - taille / 2, taille, taille);
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < poussieres.length; i++) {
      var m = poussieres[i];
      m.y += m.vy * dt;
      m.x += (m.vx + Math.sin(temps * 0.7 + m.phase) * 7) * dt;
      if (m.y < R.y - 20) { m.y = R.y + R.h + 20; m.x = R.x + Math.random() * R.w; }
      if (m.x < R.x - 20) m.x = R.x + R.w + 20; else if (m.x > R.x + R.w + 20) m.x = R.x - 20;
      ctx.globalAlpha = niveau * m.a * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(temps * m.v + m.phase)));
      ctx.drawImage(spriteLueur, m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
    }
    ctx.restore();
  }

  function dessiner(dt) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, toile.width, toile.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var etats = [], i, c, e;
    for (i = 0; i < couches.length; i++) etats.push(etat(couches[i], temps));
    for (i = couches.length - 1; i >= 0; i--) {
      if (couches[i].mode === 'fini') { pauseVideo(couches[i].photo); couches.splice(i, 1); etats.splice(i, 1); }
    }

    var plein = false, haut = null, anneaux = [];
    for (i = 0; i < couches.length; i++) {
      c = couches[i];
      e = etats[i];
      // La photo du dessous s'assombrit quand la suivante apparaît.
      var suivante = couches[i + 1], voile = 0;
      if (suivante && suivante.mode === 'ouverture') voile = 0.5 * lisse((temps - suivante.t0) / 0.6);
      dessinerCouche(c, e, voile);
      if (e.coeur) anneaux.push({ h: e.coeur, a: e.anneau * e.alpha });
      if (c.mode === 'pleine') { haut = c; if (c.R.plein && e.alpha >= 1) plein = true; }
    }

    niveau = borne(niveau + (haut ? dt / 1.2 : -dt / 0.5), 0, 1);
    if (haut) dessinerLumieres(dt, haut.R);
    for (i = 0; i < anneaux.length; i++) {
      dessinerAnneau(anneaux[i].h, anneaux[i].a);
      semerEtincelles(anneaux[i].h, anneaux[i].a, dt);
    }

    // Écran entièrement couvert : inutile de dessiner le ciel dessous.
    if (plein !== couvert) {
      couvert = plein;
      if (E && E.couvrir) E.couvrir(plein);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Boucle                                                              */
  /* ------------------------------------------------------------------ */

  function image(ms) {
    rafId = global.requestAnimationFrame(image);
    var t = ms / 1000;
    var dt = dernier ? t - dernier : 1 / 60;
    dernier = t;
    temps = t;
    dessiner(Math.min(Math.max(dt, 0), 0.05));
    if (!couches.length && niveau <= 0) arreterBoucle();
  }

  function demarrerBoucle() {
    if (enCours || doc.hidden) return;
    enCours = true;
    dernier = 0;
    rafId = global.requestAnimationFrame(image);
  }

  function arreterBoucle() {
    enCours = false;
    global.cancelAnimationFrame(rafId);
  }

  function dimensionner() {
    L = global.innerWidth || doc.documentElement.clientWidth;
    H = global.innerHeight || doc.documentElement.clientHeight;
    dpr = Math.min(global.devicePixelRatio || 1, leger ? 1 : 2);
    toile.width = Math.round(L * dpr);
    toile.height = Math.round(H * dpr);
    couches.forEach(mettreEnPage);
    poussieres.forEach(function (m) { m.x = Math.random() * L; m.y = Math.random() * H; });
  }

  function surRedimension() {
    clearTimeout(minuterieTaille);
    minuterieTaille = setTimeout(function () {
      if (Math.abs((global.innerWidth || 0) - L) < 2 && Math.abs((global.innerHeight || 0) - H) < 2) return;
      dimensionner();
    }, 100);
  }

  /* ------------------------------------------------------------------ */
  /* Sprites                                                             */
  /* ------------------------------------------------------------------ */

  function spriteRadial(t, arrets) {
    var c = doc.createElement('canvas');
    c.width = c.height = t;
    var x = c.getContext('2d'), g = x.createRadialGradient(t / 2, t / 2, 0, t / 2, t / 2, t / 2);
    arrets.forEach(function (a) { g.addColorStop(a[0], a[1]); });
    x.fillStyle = g;
    x.fillRect(0, 0, t, t);
    return c;
  }

  function creerSprites() {
    spriteLueur = spriteRadial(64, [[0, 'rgba(255,255,255,1)'], [0.18, rgba(theme.eclat, 0.9)], [0.45, rgba(theme.principale, 0.3)], [1, rgba(theme.principale, 0)]]);
    spriteFuite = spriteRadial(256, [[0, rgba(theme.eclat, 0.85)], [0.35, rgba(theme.principale, 0.32)], [1, rgba(theme.principale, 0)]]);
    poussieres = [];
    for (var i = 0; i < (leger || reduit ? 0 : 16); i++) {
      poussieres.push({
        x: Math.random() * L, y: Math.random() * H,
        vx: hasard(-5, 5), vy: -hasard(8, 22), r: hasard(5, 13),
        a: hasard(0.25, 0.65), v: hasard(0.8, 2.2), phase: hasard(0, 6.28)
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Interface                                                           */
  /* ------------------------------------------------------------------ */

  // « 45% 20% » → [0.45, 0.2] : le point de la photo à garder au centre
  // (le visage). Par défaut, le haut du centre.
  function lireCadrage(v) {
    var m = /^\s*(\d+(?:[.,]\d+)?)\s*%?\s+(\d+(?:[.,]\d+)?)\s*%?\s*$/.exec(String(v || ''));
    if (!m) return [0.5, 0.36];
    return [borne(parseFloat(m[1].replace(',', '.')) / 100, 0, 1), borne(parseFloat(m[2].replace(',', '.')) / 100, 0, 1)];
  }

  function initialiser(o) {
    toile = o.toile;
    if (!toile || !toile.getContext || !global.requestAnimationFrame) return false;
    ctx = toile.getContext('2d');
    var t = doc.createElement('canvas');
    t.width = t.height = 1;
    testeur = t.getContext('2d');
    if (!ctx || !testeur) return false;
    theme = o.theme;
    leger = !!o.leger;
    reduit = !!o.reduit;
    E = o.effets || null;
    dimensionner();
    creerSprites();
    global.addEventListener('resize', surRedimension);
    global.addEventListener('orientationchange', surRedimension);
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) arreterBoucle();
      else if (couches.length) demarrerBoucle();
    });
    return true;
  }

  // Télécharge et décode les photos à l'avance. Renvoie { photos, pret } :
  // chaque photo reçoit ok = true une fois prête ; pret se résout quand
  // toutes ont abouti (ou échoué).
  function precharger(liste) {
    var choisir = Amour.outils && Amour.outils.choisirVideo;
    var photos = liste.map(function (source) {
      var cadrage = lireCadrage(source.cadrage);
      return {
        image: source.image || '', video: source.video && choisir ? choisir(source.video) : '',
        legende: source.legende || '', fx: cadrage[0], fy: cadrage[1],
        ok: false, img: null, iw: 0, ih: 0, duree: 0, apercu: ''
      };
    });
    var pret = Promise.all(photos.map(function (p) { return p.video ? chargerVideo(p) : chargerImage(p); }));
    return { photos: photos, pret: pret };
  }

  function chargerImage(p) {
    return new Promise(function (resoudre) {
      var img = new Image(), fini = false;
      function prete() {
        if (fini) return;
        fini = true;
        p.img = img;
        p.iw = img.naturalWidth;
        p.ih = img.naturalHeight;
        p.ok = p.iw > 0 && p.ih > 0;
        resoudre(p);
      }
      img.onload = function () {
        if (img.decode) img.decode().then(prete, prete);
        else prete();
      };
      img.onerror = function () {
        if (fini) return;
        fini = true;
        if (global.console) console.warn('Photo introuvable : ' + p.image);
        resoudre(p);
      };
      img.src = p.image;
    });
  }

  // Vidéo muette, lue dans la page (iPhone compris) ; prête dès que ses
  // dimensions sont connues. Sans image d'aperçu, une image de la vidéo
  // en tient lieu (médaillons).
  function chargerVideo(p) {
    return new Promise(function (resoudre) {
      var v = doc.createElement('video'), fini = false;
      v.muted = true;
      v.defaultMuted = true;
      v.setAttribute('muted', '');
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.loop = true;
      v.preload = 'auto';
      v.addEventListener('loadedmetadata', function () {
        if (fini) return;
        fini = true;
        p.img = v;
        p.iw = v.videoWidth;
        p.ih = v.videoHeight;
        p.duree = isFinite(v.duration) ? v.duration : 0;
        p.ok = p.iw > 0 && p.ih > 0;
        resoudre(p);
      });
      v.addEventListener('loadeddata', function () {
        if (p.image || p.apercu) return;
        try {
          var t = doc.createElement('canvas');
          t.width = 240;
          t.height = Math.round(240 * v.videoHeight / v.videoWidth) || 240;
          t.getContext('2d').drawImage(v, 0, 0, t.width, t.height);
          p.apercu = t.toDataURL('image/jpeg', 0.8);
        } catch (e) { /* vidéo d'un autre site : pas d'aperçu */ }
      });
      v.addEventListener('error', function () {
        if (fini) return;
        fini = true;
        if (global.console) console.warn('Vidéo illisible : ' + p.video);
        resoudre(p);
      });
      v.src = p.video;
      v.load();
    });
  }

  // La vidéo repart du début ; on attend sa première image (3 s au plus).
  function lancerVideo(p) {
    var v = p.img;
    try { v.currentTime = 0; } catch (e) { /* pas encore possible */ }
    var lecture = v.play();
    if (lecture && lecture.catch) lecture.catch(function () {});
    if (v.readyState >= 2) return Promise.resolve();
    return new Promise(function (resoudre) {
      var fini = false;
      function fin() {
        if (fini) return;
        fini = true;
        v.removeEventListener('loadeddata', fin);
        v.removeEventListener('playing', fin);
        resoudre();
      }
      v.addEventListener('loadeddata', fin);
      v.addEventListener('playing', fin);
      setTimeout(fin, 3000);
    });
  }

  function pauseVideo(p) {
    if (p && p.video && p.img && !p.img.paused) p.img.pause();
  }

  function nouvelleCouche(photo, rappels) {
    var c = { photo: photo, rappels: rappels || {}, t0: horloge(), mode: '' };
    mettreEnPage(c);
    return c;
  }

  // Fait apparaître une photo (médaillon en cœur, puis plein écran).
  // La promesse se résout quand la photo occupe tout l'écran.
  function ouvrir(photo, rappels) {
    if (!ctx || !photo || !photo.ok) return Promise.resolve();
    var gen = generation;
    return (photo.video ? lancerVideo(photo) : Promise.resolve()).then(function () {
      if (gen !== generation) return;
      var c = nouvelleCouche(photo, rappels);
      c.mode = reduit ? 'entree' : 'ouverture';
      couches.push(c);
      demarrerBoucle();
      return new Promise(function (r) { c.resoudre = r; });
    });
  }

  // Referme la dernière photo en cœur, qui bat puis éclate.
  function fermer(rappels) {
    var c = couches[couches.length - 1];
    if (!c) return Promise.resolve();
    var t = horloge();
    if (c.resoudre) { c.resoudre(); c.resoudre = null; }
    c.camDepart = camPleine(c, c.tPleine === undefined ? 0 : t - c.tPleine);
    c.rappels = rappels || {};
    c.t0 = t;
    c.mode = reduit ? 'sortie' : 'fermeture';
    demarrerBoucle();
    return new Promise(function (r) { c.resoudre = r; });
  }

  function arreter() {
    generation++;
    couches.forEach(function (c) { if (c.resoudre) c.resoudre = null; pauseVideo(c.photo); });
    couches = [];
    niveau = 0;
    arreterBoucle();
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, toile.width, toile.height);
    }
    if (couvert && E && E.couvrir) E.couvrir(false);
    couvert = false;
  }

  // Le téléphone peine : moins de pixels et moins de lumières.
  function alleger() {
    if (leger || !ctx) return;
    leger = true;
    poussieres = [];
    dimensionner();
  }

  Amour.film = {
    initialiser: initialiser,
    alleger: alleger,
    precharger: precharger,
    ouvrir: ouvrir,
    fermer: fermer,
    arreter: arreter,
    lireCadrage: lireCadrage,
    pleinEcran: function () { var c = couches[couches.length - 1]; return !!(c && c.R.plein); }
  };
})(window);
