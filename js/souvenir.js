/*
 * La lettre en image : un souvenir à garder sur le téléphone.
 *
 * Dessine la lettre (titre, paragraphes, formule, signature, cœur) sur une
 * feuille de papier, avec les polices et les couleurs du site, puis la
 * propose à l'enregistrement : la feuille de partage sur iPhone (pour
 * « Enregistrer l'image » dans Photos), un téléchargement ailleurs.
 * Aucune bibliothèque : tout passe par un <canvas>.
 */
(function (global) {
  'use strict';

  var Amour = global.Amour = global.Amour || {};
  var doc = global.document;

  var LARGEUR = 1080;
  var MARGE = 96;                 // marge intérieure de la feuille
  var BORD = 44;                  // fond coloré autour de la feuille
  var CORPS = 40;                 // taille du texte (px)
  var INTERLIGNE = 1.62;
  var SERIF = "'Cormorant Garamond', Georgia, serif";
  var SCRIPT = "'Great Vibes', 'Snell Roundhand', cursive";

  var COEURS = { '❤': 1, '❤️': 1, '♥': 1, '♥️': 1 };
  var RE_COEUR = /(❤️?|♥️?)/g;

  function couleur(nom, defaut) {
    var v = global.getComputedStyle(doc.documentElement).getPropertyValue('--' + nom).trim();
    return v || defaut;
  }

  function coeur(ctx, x, y, taille, remplissage) {
    // Le cœur du site (viewBox 100 × 92), posé sur la ligne de base.
    var k = taille / 100;
    ctx.save();
    ctx.translate(x, y - 88 * k);
    ctx.scale(k, k);
    ctx.beginPath();
    ctx.moveTo(50, 88);
    ctx.bezierCurveTo(47, 85, 8, 60, 4, 34);
    ctx.bezierCurveTo(1, 16, 12, 4, 27, 4);
    ctx.bezierCurveTo(38, 4, 46, 11, 50, 20);
    ctx.bezierCurveTo(54, 11, 62, 4, 73, 4);
    ctx.bezierCurveTo(88, 4, 99, 16, 96, 34);
    ctx.bezierCurveTo(92, 60, 53, 85, 50, 88);
    ctx.closePath();
    ctx.fillStyle = remplissage;
    ctx.fill();
    ctx.restore();
  }

  // Découpe un paragraphe en lignes ; un ❤️ devient un mot « cœur » dessiné.
  function lignes(ctx, texte, largeurMax, police) {
    ctx.font = police;
    var mots = [];
    String(texte).replace(RE_COEUR, ' ❤ ').split(/\s+/).forEach(function (m) {
      if (m) mots.push(COEURS[m] ? { coeur: true } : { texte: m });
    });
    var espace = ctx.measureText(' ').width;
    var tailleCoeur = CORPS * 0.82;
    var res = [], ligne = [], largeur = 0;
    mots.forEach(function (m) {
      var w = m.coeur ? tailleCoeur : ctx.measureText(m.texte).width;
      var ajout = (ligne.length ? espace : 0) + w;
      if (ligne.length && largeur + ajout > largeurMax && !m.coeur) {
        res.push(ligne);
        ligne = [];
        largeur = 0;
        ajout = w;
      }
      m.w = w;
      ligne.push(m);
      largeur += ajout;
    });
    if (ligne.length) res.push(ligne);
    return { lignes: res, espace: espace };
  }

  function dessinerLigne(ctx, ligne, x, y, espace, encre, accent, alignDroite, largeurMax) {
    var total = ligne.reduce(function (s, m, i) { return s + m.w + (i ? espace : 0); }, 0);
    var cx = alignDroite ? x + largeurMax - total : x;
    ligne.forEach(function (m, i) {
      if (i) cx += espace;
      if (m.coeur) coeur(ctx, cx, y + CORPS * 0.06, m.w, accent);
      else { ctx.fillStyle = encre; ctx.fillText(m.texte, cx, y); }
      cx += m.w;
    });
  }

  // Construit l'image de la lettre ; résout un Blob PNG.
  function creerImage(config) {
    var l = config.lettre;
    var profonde = couleur('profonde', '#a3154f');
    var principale = couleur('principale', '#ff4f8b');
    var encre = '#43172c';
    var papier = '#fffaf3';
    var fond = couleur('fond-2', '#2a0a24');

    var polices = [
      '500 ' + CORPS + 'px ' + SERIF,
      'italic 500 ' + CORPS + 'px ' + SERIF,
      '400 120px ' + SCRIPT
    ];
    var chargement = doc.fonts && doc.fonts.load
      ? Promise.all(polices.map(function (p) { return doc.fonts.load(p, 'Aéà'); })).catch(function () {})
      : Promise.resolve();

    return chargement.then(function () {
      var toile = doc.createElement('canvas');
      var ctx = toile.getContext('2d');
      var largeurTexte = LARGEUR - 2 * BORD - 2 * MARGE;
      var hLigne = CORPS * INTERLIGNE;
      var titre = l.titre || (config.prenom ? config.prenom + ',' : '');

      // 1. Mise en page, pour connaître la hauteur.
      var policeCorps = '500 ' + CORPS + 'px ' + SERIF;
      var policeFormule = 'italic 500 ' + CORPS + 'px ' + SERIF;
      var paras = l.paragraphes.map(function (p) { return lignes(ctx, p, largeurTexte, policeCorps); });
      var formule = l.formule ? lignes(ctx, l.formule, largeurTexte, policeFormule) : null;

      var y = BORD + 120;                                   // sous le sceau
      var yTitre = titre ? (y += 96) : y;
      if (titre) y += 54;
      var hauteurParas = paras.reduce(function (s, p) { return s + p.lignes.length * hLigne + CORPS * 0.75; }, 0);
      y += hauteurParas;
      var yFormule = formule ? (y += 50) : y;
      if (formule) y += (formule.lignes.length - 1) * hLigne;
      var ySignature = l.signature ? (y += 112) : y;
      var yCoeur = y + 110;
      var hauteur = yCoeur + 60 + MARGE * 0.6 + BORD;

      toile.width = LARGEUR;
      toile.height = Math.ceil(hauteur);

      // 2. Fond et feuille.
      var g = ctx.createLinearGradient(0, 0, LARGEUR, toile.height);
      g.addColorStop(0, profonde);
      g.addColorStop(1, fond);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, LARGEUR, toile.height);

      var fx = BORD, fy = BORD + 30, fw = LARGEUR - 2 * BORD, fh = toile.height - 2 * BORD - 30;
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, .45)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 16;
      ctx.fillStyle = papier;
      ctx.fillRect(fx, fy, fw, fh);
      ctx.restore();
      var lueur = ctx.createRadialGradient(LARGEUR / 2, fy, 0, LARGEUR / 2, fy, fw * 0.8);
      lueur.addColorStop(0, 'rgba(255, 255, 255, .9)');
      lueur.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = lueur;
      ctx.fillRect(fx, fy, fw, fh);

      // 3. Le sceau en cœur, en haut de la feuille.
      var sx = LARGEUR / 2, sy = fy;
      var sceau = ctx.createRadialGradient(sx - 12, sy - 14, 4, sx, sy, 50);
      sceau.addColorStop(0, principale);
      sceau.addColorStop(1, profonde);
      ctx.beginPath();
      ctx.arc(sx, sy, 48, 0, Math.PI * 2);
      ctx.fillStyle = sceau;
      ctx.fill();
      coeur(ctx, sx - 22, sy + 19, 44, 'rgba(255, 255, 255, .92)');

      var x = fx + MARGE;
      ctx.textBaseline = 'alphabetic';

      // 4. Le texte.
      if (titre) {
        ctx.font = '400 104px ' + SCRIPT;
        ctx.fillStyle = profonde;
        ctx.fillText(titre, x, yTitre);
      }
      var yy = (titre ? yTitre + 54 : yTitre) + CORPS;
      ctx.font = policeCorps;
      paras.forEach(function (p) {
        p.lignes.forEach(function (ligne) {
          dessinerLigne(ctx, ligne, x, yy, p.espace, encre, principale, false, largeurTexte);
          yy += hLigne;
        });
        yy += CORPS * 0.75;
      });
      if (formule) {
        ctx.font = policeFormule;
        var yf = yFormule;
        formule.lignes.forEach(function (ligne) {
          dessinerLigne(ctx, ligne, x, yf, formule.espace, encre, principale, true, largeurTexte);
          yf += hLigne;
        });
      }
      if (l.signature) {
        ctx.font = '400 96px ' + SCRIPT;
        ctx.fillStyle = profonde;
        ctx.textAlign = 'right';
        ctx.fillText(l.signature, x + largeurTexte, ySignature);
        ctx.textAlign = 'left';
      }

      // 5. Le cœur dessiné à la main, sous la signature.
      ctx.save();
      ctx.translate(x + largeurTexte - 112, yCoeur - 84);
      ctx.strokeStyle = principale;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(new Path2D('M60 88C52 82 18 62 12 38C7 18 22 8 34 10C46 12 54 22 60 34C65 21 76 9 90 10C104 11 114 26 106 45C99 62 76 78 60 88C57 90 52 91 48 89'));
      ctx.restore();

      return new Promise(function (resoudre, rejeter) {
        if (toile.toBlob) toile.toBlob(function (b) { b ? resoudre(b) : rejeter(new Error('image vide')); }, 'image/png');
        else rejeter(new Error('toBlob indisponible'));
      });
    });
  }

  function estIOS() {
    var n = global.navigator;
    return /iPad|iPhone|iPod/.test(n.userAgent) || (n.platform === 'MacIntel' && n.maxTouchPoints > 1);
  }

  // Propose l'image : feuille de partage sur iPhone, téléchargement ailleurs.
  // Résout 'partage', 'telechargement' ou 'annule'.
  function enregistrer(blob, nomFichier) {
    var n = global.navigator;
    if (estIOS() && n.canShare && global.File) {
      var fichier = new File([blob], nomFichier, { type: 'image/png' });
      if (n.canShare({ files: [fichier] })) {
        return n.share({ files: [fichier] }).then(function () { return 'partage'; }, function (e) {
          if (e && e.name === 'AbortError') return 'annule';
          return telecharger(blob, nomFichier);
        });
      }
    }
    return Promise.resolve(telecharger(blob, nomFichier));
  }

  function telecharger(blob, nomFichier) {
    var url = URL.createObjectURL(blob);
    var a = doc.createElement('a');
    a.href = url;
    a.download = nomFichier;
    a.rel = 'noopener';
    doc.body.appendChild(a);
    a.click();
    doc.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    return 'telechargement';
  }

  Amour.souvenir = {
    creerImage: creerImage,
    enregistrer: enregistrer
  };
})(window);
