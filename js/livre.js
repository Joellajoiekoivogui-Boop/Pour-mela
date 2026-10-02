/*
 * Le livre : la lettre lue à voix haute, page après page.
 *
 * La couverture s'ouvre, chaque mot s'écrit au moment où la voix le dit,
 * puis la page lue se soulève et s'envole pour laisser place à la suivante.
 * La musique continue derrière, plus doucement. À la fin, la signature
 * s'écrit, un cœur se dessine et une pluie de cœurs tombe.
 *
 * Les phrases et leurs instants viennent de medias/lecture.js (généré en
 * même temps que la voix). Sans voix (fichier absent, son bloqué), le livre
 * se lit tout seul au même rythme, en silence.
 */
(function (global) {
  'use strict';

  var Amour = global.Amour = global.Amour || {};
  var doc = global.document;

  var ENVOL = 1.45;          // durée de l'envol d'une page (s)
  var MUSIQUE = 0.3;         // volume de la musique pendant la voix

  var el = {}, donnees = null, E = null, M = null, remplirTexte = null, reduit = false;
  var pages = [], segments = [], envols = [], voix = null;
  var rafId = 0, enCours = false, pageActive = 0;
  var virtuel = false, origine = 0;         // horloge de secours (sans voix)
  var finSignature = 0, etapesFin = {}, resoudreFin = null;
  var etaitEnLecture = false, cacheDepuis = 0;

  function $(id) { return doc.getElementById(id); }
  function vider(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function maintenant() { return (global.performance && performance.now ? performance.now() : Date.now()) / 1000; }

  /* ------------------------------------------------------------------ */
  /* Construction des pages                                              */
  /* ------------------------------------------------------------------ */

  // Une <span> par mot ; un « mot » sans lettre (❤️, !) reste collé au précédent.
  var RE_LETTRE = /[0-9A-Za-zÀ-ɏ]/;
  function ajouterMots(parent, texte) {
    var mots = [];
    texte.split(/\s+/).forEach(function (m) {
      if (!m) return;
      if (mots.length && !RE_LETTRE.test(m)) mots[mots.length - 1] += ' ' + m;
      else mots.push(m);
    });
    return mots.map(function (m, i) {
      if (i) parent.appendChild(doc.createTextNode(' '));
      var s = doc.createElement('span');
      s.className = 'mot-livre';
      remplirTexte(s, m);
      parent.appendChild(s);
      return s;
    });
  }

  function construire() {
    vider(el.pages);
    pages = [];
    segments = [];
    for (var p = 0; p < donnees.pages; p++) {
      var page = doc.createElement('article');
      page.className = 'page';
      page.style.zIndex = String(100 - p);
      var contenu = doc.createElement('div');
      contenu.className = 'page-contenu';
      var numero = doc.createElement('span');
      numero.className = 'page-numero';
      numero.textContent = (p + 1) + ' / ' + donnees.pages;
      page.appendChild(contenu);
      page.appendChild(numero);
      el.pages.appendChild(page);
      pages.push({ noeud: page, contenu: contenu, paras: {} });
    }

    donnees.frise.forEach(function (s) {
      var page = pages[Math.min(pages.length - 1, Math.max(0, s.page))];
      var seg = { genre: s.genre, debut: +s.debut, fin: +s.fin, page: s.page, mots: [], fait: 0 };
      var bloc;
      if (s.genre === 'titre') {
        bloc = doc.createElement('h2');
        bloc.className = 'page-titre';
        page.contenu.appendChild(bloc);
      } else if (s.genre === 'formule') {
        bloc = doc.createElement('p');
        bloc.className = 'page-formule';
        page.contenu.appendChild(bloc);
      } else if (s.genre === 'signature') {
        bloc = doc.createElement('p');
        bloc.className = 'page-signature';
        var encre = doc.createElement('span');
        encre.className = 'signature-encre';
        encre.textContent = s.texte;
        bloc.appendChild(encre);
        page.contenu.appendChild(bloc);
        seg.noeud = bloc;
        var coeur = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
        coeur.setAttribute('class', 'page-coeur');
        coeur.setAttribute('viewBox', '0 0 120 100');
        coeur.setAttribute('aria-hidden', 'true');
        coeur.innerHTML = '<path class="trace" d="M60 88C52 82 18 62 12 38C7 18 22 8 34 10C46 12 54 22 60 34C65 21 76 9 90 10C104 11 114 26 106 45C99 62 76 78 60 88C57 90 52 91 48 89"/>';
        page.contenu.appendChild(coeur);
        seg.coeur = coeur.querySelector('.trace');
        segments.push(seg);
        return;
      } else {
        bloc = page.paras[s.para];
        if (!bloc) {
          bloc = page.paras[s.para] = doc.createElement('p');
          bloc.className = 'page-para';
          page.contenu.appendChild(bloc);
        } else {
          bloc.appendChild(doc.createTextNode(' '));
        }
      }
      seg.mots = ajouterMots(bloc, s.texte);
      segments.push(seg);
    });

    // Instants où chaque page s'envole : juste après sa dernière phrase.
    envols = [];
    for (var n = 1; n < pages.length; n++) {
      var derniere = 0;
      segments.forEach(function (g) { if (g.page === n - 1) derniere = Math.max(derniere, g.fin); });
      envols.push(derniere + 0.3);
    }
    ajuster();
  }

  // Taille du texte : la plus grande qui tient dans toutes les pages (la
  // même partout), mesurée avec tous les mots en place, encore invisibles.
  function tient(p, taille) {
    p.contenu.style.fontSize = taille + 'px';
    return p.contenu.scrollHeight <= p.contenu.clientHeight + 1;
  }

  function ajuster() {
    if (!pages.length) return;
    var largeur = el.livre.offsetWidth || 340;
    var taille = Math.max(12, Math.min(30, largeur * 0.075));
    pages.forEach(function (p) {
      if (tient(p, taille)) return;
      var bas = 9, haut = taille;
      while (haut - bas > 0.25) {
        var milieu = (bas + haut) / 2;
        if (tient(p, milieu)) bas = milieu; else haut = milieu;
      }
      taille = bas;
    });
    pages.forEach(function (p) { p.contenu.style.fontSize = taille.toFixed(2) + 'px'; });
  }

  /* ------------------------------------------------------------------ */
  /* Lecture                                                             */
  /* ------------------------------------------------------------------ */

  function temps() {
    if (!virtuel && voix) return voix.currentTime || 0;
    return maintenant() - origine;
  }

  // La voix ne peut pas être lue : on continue au même rythme, en silence.
  function passerEnSilence() {
    if (virtuel) return;
    var t = voix ? (voix.currentTime || 0) : 0;
    virtuel = true;
    origine = maintenant() - t;
  }

  function envoler(n) {
    var page = pages[n];
    if (!page) return;
    page.noeud.classList.add('envolee');
    if (M) M.effet('lettre');
    if (E) {
      var r = page.noeud.getBoundingClientRect();
      E.etincelles(r.right - 10, r.top + r.height * 0.3, 14);
    }
    setTimeout(function () { page.noeud.classList.add('partie'); }, ENVOL * 1000 + 100);
  }

  function image() {
    rafId = global.requestAnimationFrame(image);
    var t = temps();

    while (pageActive < envols.length && t >= envols[pageActive]) {
      envoler(pageActive);
      pageActive++;
    }

    for (var i = 0; i < segments.length; i++) {
      var s = segments[i];
      if (t < s.debut) break;
      if (s.genre === 'signature') {
        if (!s.noeud.classList.contains('visible')) {
          s.noeud.classList.add('visible');
          finSignature = s.fin;
        }
        continue;
      }
      if (s.fait >= s.mots.length) continue;
      // Les mots apparaissent au rythme de la voix (un peu en avance).
      var avance = Math.min(1, (t - s.debut) / Math.max(0.2, s.fin - s.debut) + 0.06);
      var k = Math.ceil(avance * s.mots.length);
      while (s.fait < k && s.fait < s.mots.length) s.mots[s.fait++].classList.add('dit');
    }

    if (finSignature) finir(t);
  }

  // Après la signature : le cœur se dessine, puis la pluie de cœurs.
  function finir(t) {
    var sig = segments[segments.length - 1];
    if (!etapesFin.coeur && t >= finSignature + 0.6) {
      etapesFin.coeur = true;
      if (sig.coeur && sig.coeur.parentNode) sig.coeur.parentNode.classList.add('visible');
      if (sig.coeur && sig.coeur.getTotalLength) {
        var l = Math.ceil(sig.coeur.getTotalLength());
        sig.coeur.style.strokeDasharray = l + ' ' + l;
        sig.coeur.style.strokeDashoffset = l;
        void sig.coeur.getBoundingClientRect();
        sig.coeur.style.strokeDashoffset = '0';
      }
    }
    if (!etapesFin.pluie && t >= finSignature + 2.2) {
      etapesFin.pluie = true;
      if (E) E.pluieDeCoeurs(4.5, 9);
      if (M) { M.effet('final'); M.attenuer(false); }
      setTimeout(function () {
        arreterBoucle();
        if (resoudreFin) { var r = resoudreFin; resoudreFin = null; r(); }
      }, 1200);
    }
  }

  function demarrerBoucle() {
    if (enCours) return;
    enCours = true;
    rafId = global.requestAnimationFrame(image);
  }

  function arreterBoucle() {
    enCours = false;
    global.cancelAnimationFrame(rafId);
  }

  /* ------------------------------------------------------------------ */
  /* Interface                                                           */
  /* ------------------------------------------------------------------ */

  function preparer(o) {
    donnees = o.donnees;
    if (!donnees || !donnees.frise || !donnees.frise.length || !donnees.pages) return false;
    el.livre = $('livre');
    el.pages = $('livre-pages');
    if (!el.livre || !el.pages) return false;
    E = o.effets || null;
    M = o.musique || null;
    remplirTexte = o.remplirTexte;
    reduit = !!o.reduit;
    construire();

    if (donnees.voix) {
      voix = new Audio();
      voix.preload = 'none';
      voix.src = donnees.voix;
      voix.addEventListener('error', passerEnSilence);
      // La voix se tait : l'horloge continue pour finir (cœur, pluie de cœurs).
      voix.addEventListener('ended', passerEnSilence);
    }
    if (M && M.surChangement) M.surChangement(function (actif) { if (voix) voix.muted = !actif; });

    doc.addEventListener('visibilitychange', function () {
      if (!enCours) return;
      if (doc.hidden) {
        cacheDepuis = maintenant();
        etaitEnLecture = !!(voix && !voix.paused && !virtuel);
        if (etaitEnLecture) voix.pause();
      } else {
        if (virtuel && cacheDepuis) origine += maintenant() - cacheDepuis;
        if (etaitEnLecture) {
          var p = voix.play();
          if (p && p.catch) p.catch(passerEnSilence);
        }
      }
    });
    var minuterie = 0;
    global.addEventListener('resize', function () {
      clearTimeout(minuterie);
      minuterie = setTimeout(ajuster, 200);
    });
    return true;
  }

  // Le livre arrive : on commence à charger la voix.
  function approcher() {
    if (voix && voix.preload !== 'auto') { voix.preload = 'auto'; voix.load(); }
    ajuster();
  }

  // À appeler pendant le toucher sur la couverture (geste exigé pour le son).
  // La promesse se résout quand tout est lu.
  function ouvrir() {
    el.livre.classList.add('ouvert');
    if (M && M.attenuer) M.attenuer(true, MUSIQUE);
    virtuel = !voix;
    origine = maintenant();
    if (voix) {
      try { voix.currentTime = 0; } catch (e) { /* pas encore chargée */ }
      voix.muted = !!(M && M.estActif && !M.estActif());
      var p = voix.play();
      if (p && p.catch) p.catch(passerEnSilence);
    }
    demarrerBoucle();
    return new Promise(function (r) { resoudreFin = r; });
  }

  function arreter() {
    arreterBoucle();
    resoudreFin = null;
    if (voix) { voix.pause(); try { voix.currentTime = 0; } catch (e) { /* rien */ } }
    if (M && M.attenuer) M.attenuer(false);
    pageActive = 0;
    finSignature = 0;
    etapesFin = {};
    virtuel = false;
    if (el.livre) el.livre.classList.remove('ouvert');
    if (donnees) construire();
  }

  Amour.livre = {
    preparer: preparer,
    approcher: approcher,
    ouvrir: ouvrir,
    arreter: arreter,
    ajuster: ajuster
  };
})(window);
