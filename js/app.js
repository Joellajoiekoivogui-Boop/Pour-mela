/*
 * Le scénario : accueil → explosion de cœurs → « JE T'AIME » → le prénom
 * écrit à la main → les petits messages → le film des photos → l'enveloppe
 * → la lettre.
 */
(function () {
  'use strict';

  var Amour = window.Amour;
  var O = Amour.outils, E = Amour.effets, M = Amour.musique, F = Amour.film;
  var html = document.documentElement;

  var charge = O.chargerConfig();
  var config = charge.config;
  var theme = O.resoudreTheme(config.couleur);
  O.appliquerTheme(theme);
  if (config.titrePage) document.title = config.titrePage;

  var mqReduit = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduit = !!(mqReduit && mqReduit.matches);
  var tactile = !(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  if (appareilModeste()) html.classList.add('leger');
  if (reduit) html.classList.add('reduit');
  if (tactile) html.classList.add('tactile');
  var masqueOk = !!(window.CSS && CSS.supports && (
    CSS.supports('-webkit-mask-image', 'linear-gradient(#000, #000)') ||
    CSS.supports('mask-image', 'linear-gradient(#000, #000)')));

  // Économie de données, peu de mémoire ou de cœurs : effets allégés d'emblée.
  function appareilModeste() {
    var n = navigator, c = n.connection || {};
    return !!(c.saveData || (n.deviceMemory && n.deviceMemory <= 2) || (n.hardwareConcurrency && n.hardwareConcurrency <= 2));
  }

  function $(id) { return document.getElementById(id); }

  var el = {
    scenes: $('scenes'),
    accueil: $('accueil'),
    titreAccueil: $('titre-accueil'),
    invitation: $('invitation'),
    grandCoeur: $('grand-coeur'),
    sceneJetaime: $('scene-jetaime'),
    jetaime: $('jetaime'),
    scenePrenom: $('scene-prenom'),
    avantPrenom: $('avant-prenom'),
    lignePrenom: $('ligne-prenom'),
    prenom: $('prenom'),
    prenomCoeur: $('prenom-coeur'),
    sceneMessages: $('scene-messages'),
    zoneMessages: $('zone-messages'),
    boutonLettre: $('bouton-lettre'),
    indice: $('indice-suite'),
    sceneFilm: $('scene-film'),
    filmToile: $('film-toile'),
    filmTitre: $('film-titre'),
    filmLegende: $('film-legende'),
    filmBarres: $('film-barres'),
    filmFin: $('film-fin'),
    constellation: $('constellation'),
    cstMedaillons: $('cst-medaillons'),
    cstNomLigne: $('cst-nom-ligne'),
    cstNom: $('cst-nom'),
    boutonFilm: $('bouton-lettre-film'),
    sceneEnveloppe: $('scene-enveloppe'),
    enveloppe: $('enveloppe'),
    envTexte: $('env-texte'),
    envIndice: $('env-indice'),
    lettre: $('lettre'),
    lettreTitre: $('lettre-titre'),
    lettreCorps: $('lettre-corps'),
    lettreFormule: $('lettre-formule'),
    lettreSignature: $('lettre-signature'),
    coeurDessine: $('coeur-dessine'),
    souvenirs: $('souvenirs'),
    souvenirsTitre: $('souvenirs-titre'),
    polaroids: $('polaroids'),
    lettreFin: $('lettre-fin'),
    boutonRejouer: $('bouton-rejouer'),
    flash: $('flash'),
    boutonSon: $('bouton-son'),
    annonce: $('annonce'),
    visionneuse: $('visionneuse'),
    visionneuseImg: $('visionneuse-img'),
    visionneuseVideo: $('visionneuse-video'),
    visionneuseLegende: $('visionneuse-legende')
  };

  var etat = 'chargement';
  var jeton = 0;               // change à chaque « rejouer » : annule les suites en cours
  var toucherEnAttente = null; // fonction appelée au prochain toucher

  /* ------------------------------------------------------------------ */
  /* Petits outils                                                       */
  /* ------------------------------------------------------------------ */

  function attendre(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // Attend `ms` millisecondes OU un toucher (ms < 0 : seulement un toucher).
  // Renvoie true si la personne a touché l'écran.
  function attendreOuToucher(ms) {
    return new Promise(function (resoudre) {
      var fini = false;
      var minuterie = ms >= 0 ? setTimeout(function () { fin(false); }, ms) : 0;
      function fin(touche) {
        if (fini) return;
        fini = true;
        clearTimeout(minuterie);
        if (toucherEnAttente === fin) toucherEnAttente = null;
        resoudre(touche);
      }
      toucherEnAttente = fin;
    });
  }

  function vider(noeud) { while (noeud.firstChild) noeud.removeChild(noeud.firstChild); }

  function centre(noeud) {
    var r = noeud.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function annoncer(texte) { el.annonce.textContent = texte; }

  /* ------------------------------------------------------------------ */
  /* Texte : lettres, mots, et ❤️ remplacés par un cœur animé            */
  /* ------------------------------------------------------------------ */

  var RE_GRAPHEME = /\uD83C[\uDDE6-\uDDFF]\uD83C[\uDDE6-\uDDFF]|(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF])(?:[\u0300-\u036F\uFE0E\uFE0F\u20E3]|\uD83C[\uDFFB-\uDFFF])*(?:\u200D(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF])(?:[\uFE0E\uFE0F]|\uD83C[\uDFFB-\uDFFF])*)*/g;
  var COEURS = { '\u2764': 1, '\u2764\uFE0F': 1, '\u2665': 1, '\u2665\uFE0F': 1 };

  function graphemes(texte) {
    if (window.Intl && Intl.Segmenter) {
      return Array.from(new Intl.Segmenter('fr', { granularity: 'grapheme' }).segment(texte), function (s) { return s.segment; });
    }
    return texte.match(RE_GRAPHEME) || [];
  }

  function estCoeur(g) { return COEURS[g] === 1; }

  // Découpe en mots ; un « mot » sans lettre (❤️, !, ?, …) reste collé au
  // précédent par une espace insécable, comme en typographie française.
  var RE_LETTRE = /[0-9A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF]/;
  function decouperMots(texte) {
    var mots = [];
    texte.split(/\s+/).forEach(function (m) {
      if (!m) return;
      if (mots.length && !RE_LETTRE.test(m)) mots[mots.length - 1] += '\u00A0' + m;
      else mots.push(m);
    });
    return mots;
  }

  function coeurInline() {
    var span = document.createElement('span');
    span.className = 'coeur-inline';
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '<svg viewBox="0 0 100 92" focusable="false"><use xlink:href="#chemin-coeur" href="#chemin-coeur"></use></svg>';
    return span;
  }

  function texteLecteur(noeud, texte) {
    var sr = document.createElement('span');
    sr.className = 'sr';
    sr.textContent = texte;
    noeud.appendChild(sr);
  }

  // Texte simple, chaque ❤️ devient un cœur SVG.
  function remplirTexte(noeud, texte) {
    vider(noeud);
    var tampon = '';
    graphemes(texte).forEach(function (g) {
      if (estCoeur(g)) {
        tampon = tampon.replace(/ $/, '\u00A0');
        if (tampon) noeud.appendChild(document.createTextNode(tampon));
        tampon = '';
        noeud.appendChild(coeurInline());
      } else {
        tampon += g;
      }
    });
    if (tampon) noeud.appendChild(document.createTextNode(tampon));
  }

  // Une <span> par lettre (animées l'une après l'autre), regroupées par mot
  // pour que les retours à la ligne se fassent entre les mots.
  function remplirLettres(noeud, texte, classe, delai, pas, avecLueur) {
    vider(noeud);
    texteLecteur(noeud, texte);
    var i = 0;
    decouperMots(texte).forEach(function (m, n) {
      if (n) noeud.appendChild(document.createTextNode(' '));
      var mot = document.createElement('span');
      mot.className = 'mot';
      mot.setAttribute('aria-hidden', 'true');
      noeud.appendChild(mot);
      graphemes(m).forEach(function (g) { ajouterLettre(mot, g); });
    });
    return i;

    function ajouterLettre(mot, g) {
      var lettre;
      if (estCoeur(g)) {
        lettre = coeurInline();
      } else {
        lettre = document.createElement('span');
        if (avecLueur) {
          var lueur = document.createElement('span');
          lueur.className = 'lueur';
          lueur.style.animationDelay = (i * 110) + 'ms';
          lueur.textContent = g;
          lettre.appendChild(lueur);
        } else {
          lettre.textContent = g;
        }
      }
      lettre.className += (lettre.className ? ' ' : '') + classe;
      lettre.style.animationDelay = (delai + i * pas) + 'ms';
      mot.appendChild(lettre);
      i++;
    }
  }

  // Une <span> par mot.
  function remplirMots(noeud, texte, classe, delai, pas) {
    vider(noeud);
    texteLecteur(noeud, texte);
    var mots = decouperMots(texte);
    mots.forEach(function (m, i) {
      if (i) noeud.appendChild(document.createTextNode(' '));
      var span = document.createElement('span');
      span.className = classe;
      span.setAttribute('aria-hidden', 'true');
      span.style.animationDelay = (delai + i * pas) + 'ms';
      remplirTexte(span, m);
      noeud.appendChild(span);
    });
    return mots.length;
  }

  // Réduit la taille de police si le texte (sur une ligne) dépasse l'écran.
  function ajusterLargeur(noeud) {
    noeud.style.fontSize = '';
    var dispo = Math.min(window.innerWidth, document.documentElement.clientWidth) - 28;
    var largeur = noeud.getBoundingClientRect().width;
    if (largeur > dispo && largeur > 0) {
      var taille = parseFloat(window.getComputedStyle(noeud).fontSize);
      noeud.style.fontSize = Math.max(16, Math.floor(taille * dispo / largeur)) + 'px';
    }
  }

  /* ------------------------------------------------------------------ */
  /* Scènes                                                              */
  /* ------------------------------------------------------------------ */

  function montrer(id) {
    var scenes = document.querySelectorAll('.scene');
    for (var i = 0; i < scenes.length; i++) {
      scenes[i].classList.toggle('est-active', scenes[i].id === id);
    }
  }

  function flash(x, y) {
    el.flash.style.setProperty('--fx', x + 'px');
    el.flash.style.setProperty('--fy', y + 'px');
    el.flash.classList.remove('actif');
    void el.flash.offsetWidth;
    el.flash.classList.add('actif');
  }

  function vibrer(motif) {
    if (!config.options.vibration || !navigator.vibrate) return;
    try { navigator.vibrate(motif); } catch (e) { /* refusé : tant pis */ }
  }

  /* ------------------------------------------------------------------ */
  /* 1. Accueil                                                          */
  /* ------------------------------------------------------------------ */

  function lancerAccueil() {
    etat = 'accueil';
    remplirLettres(el.titreAccueil, config.accueil.titre, 'lettre-douce', 250, 42);
    remplirTexte(el.invitation, config.accueil.invitation);
    el.grandCoeur.setAttribute('aria-label', config.accueil.invitation.replace(/[\u2764\u2665]\uFE0F?/g, '').trim() || 'Ouvrir le message');
    montrer('accueil');
    html.classList.add('pret');
  }

  function surCoeur() {
    if (etat !== 'accueil') return;
    etat = 'histoire';
    prechargerFilm();
    M.demarrer();               // pendant le geste : obligatoire pour le son
    vibrer([28, 90, 42]);
    var c = centre(el.grandCoeur);
    el.grandCoeur.blur();
    try { el.scenes.focus({ preventScroll: true }); } catch (e) { el.scenes.focus(); }
    histoire(++jeton, c.x, c.y);
  }

  /* ------------------------------------------------------------------ */
  /* 2 à 4. L'histoire                                                   */
  /* ------------------------------------------------------------------ */

  function encore(j) { return j === jeton; }

  async function histoire(j, x, y) {
    html.classList.add('eclate');
    await attendre(240);
    if (!encore(j)) return;
    E.explosion(x, y);
    M.effet('eclat');
    flash(x, y);

    await attendre(950);
    if (!encore(j)) return;

    if (config.grandMessage) {
      await grandMessage(j);
      if (!encore(j)) return;
    }
    if (config.prenom) {
      await ecrirePrenom(j);
      if (!encore(j)) return;
    }
    await messages(j);
  }

  async function grandMessage(j) {
    el.jetaime.classList.remove('sort', 'brille');
    var n = remplirLettres(el.jetaime, config.grandMessage, 'lettre-grande', 0, 85, true);
    montrer('scene-jetaime');
    annoncer(config.grandMessage);
    ajusterLargeur(el.jetaime);

    await attendre(n * 85 + 650);
    if (!encore(j)) return;
    el.jetaime.classList.add('brille');
    var coeur = el.jetaime.querySelector('.coeur-inline');
    var c = centre(coeur || el.jetaime);
    E.petitEclat(c.x, c.y, coeur ? 1.4 : 1);
    M.effet('pop');
    vibrer(20);

    await attendre(2700);
    if (!encore(j)) return;
    el.jetaime.classList.add('sort');
    await attendre(650);
  }

  // Écrit un texte « à la main » : l'encre (un masque) avance de gauche à
  // droite, suivie d'une plume lumineuse. Renvoie une promesse.
  function ecrireALaMain(noeud, j, duree, nbLettres) {
    return new Promise(function (resoudre) {
      noeud.classList.add('en-ecriture');
      var r = noeud.getBoundingClientRect();
      var debut = 0;

      function etape(maintenant) {
        if (!encore(j)) { E.plume(null); return resoudre(false); }
        if (!debut) debut = maintenant;
        var t = Math.min(1, (maintenant - debut) / duree);
        var e = 0.5 - Math.cos(t * Math.PI) / 2;          // départ et arrivée en douceur
        var f = -0.12 + e * 1.24;                          // bord de l'encre, de 0 à 1
        var p = ((1.5 - f) * 50).toFixed(2) + '% 0';
        noeud.style.webkitMaskPosition = p;
        noeud.style.maskPosition = p;
        E.plume(r.left + r.width * Math.max(0, Math.min(1, f)),
                r.top + r.height * (0.56 + 0.15 * Math.sin(f * nbLettres * Math.PI)));
        if (t < 1) window.requestAnimationFrame(etape);
        else { E.plume(null); resoudre(true); }
      }
      window.requestAnimationFrame(etape);
    });
  }

  function ecrirePrenom(j) {
    return new Promise(function (resoudre) {
      el.scenePrenom.classList.remove('sort');
      el.prenom.classList.remove('en-ecriture', 'ecrit', 'simple');
      el.prenom.style.webkitMaskPosition = '';
      el.prenom.style.maskPosition = '';
      el.prenomCoeur.classList.remove('visible');
      remplirMots(el.avantPrenom, config.avantPrenom, 'mot-doux', 150, 160);
      el.prenom.textContent = config.prenom;
      montrer('scene-prenom');
      ajusterLargeur(el.lignePrenom);
      annoncer(config.avantPrenom + ' ' + config.prenom);

      var nbLettres = graphemes(config.prenom).length;
      var duree = Math.max(1500, Math.min(3600, 650 + nbLettres * 200));

      setTimeout(function () {
        if (!encore(j)) return resoudre();

        if (!masqueOk || reduit) {
          el.prenom.classList.add('simple');
          setTimeout(fin, 1300);
          return;
        }

        ecrireALaMain(el.prenom, j, duree, nbLettres).then(fin);
      }, 1000);

      function fin() {
        E.plume(null);
        if (!encore(j)) return resoudre();
        el.prenom.classList.remove('en-ecriture', 'simple');
        el.prenom.classList.add('ecrit');
        el.prenomCoeur.classList.add('visible');
        var c = centre(el.prenomCoeur);
        E.petitEclat(c.x, c.y, 1.3);
        M.effet('prenom');
        vibrer(20);
        setTimeout(function () {
          if (!encore(j)) return resoudre();
          el.scenePrenom.classList.add('sort');
          setTimeout(resoudre, 700);
        }, 3000);
      }
    });
  }

  async function messages(j) {
    vider(el.zoneMessages);
    el.boutonLettre.classList.remove('visible');
    montrer('scene-messages');
    await attendre(700);
    if (!encore(j)) return;

    var liste = config.messages;
    for (var i = 0; i < liste.length; i++) {
      await unMessage(j, liste[i], i === liste.length - 1);
      if (!encore(j)) return;
    }
    if (filmPrevu()) {
      await attendreOuToucher(liste.length ? 2600 : 300);
      if (!encore(j)) return;
      var vu = await film(j);
      if (!encore(j)) return;
      if (vu) return montrerBouton(el.boutonFilm);
    } else {
      await attendre(liste.length ? 1100 : 300);
      if (!encore(j)) return;
    }
    montrerBouton(el.boutonLettre);
  }

  function montrerBouton(bouton) {
    etat = 'bouton';
    bouton.classList.add('visible');
    bouton.removeAttribute('tabindex');
  }

  async function unMessage(j, texte, dernier) {
    var bloc = document.createElement('div');
    bloc.className = 'message' + (dernier ? ' message-final' : '');
    var p = document.createElement('p');
    p.className = 'message-texte';
    var pas = dernier ? 170 : 115;
    var n = remplirMots(p, texte, 'mot-anime', 0, pas);
    bloc.appendChild(p);
    el.zoneMessages.appendChild(bloc);
    annoncer(texte);

    // Révélation des mots (un toucher l'accélère).
    var touche = await attendreOuToucher(n * pas + 900);
    if (!encore(j)) return;
    if (touche) bloc.classList.add('instantane');

    if (dernier) {
      var coeur = p.querySelector('.coeur-inline');
      var c = centre(coeur || p);
      E.explosion(c.x, c.y, { force: 0.45, confettis: false, ondes: false });
      M.effet('final');
      vibrer([20, 60, 30]);
      return;
    }

    // Lecture : passage automatique, ou au toucher.
    el.sceneMessages.classList.add('attend-toucher');
    var lecture = config.options.avancementAuto ? Math.min(9000, 2000 + texte.length * 50) : -1;
    await attendreOuToucher(lecture);
    el.sceneMessages.classList.remove('attend-toucher');
    if (!encore(j)) return;

    bloc.classList.add('sort');
    await attendre(700);
    if (bloc.parentNode) bloc.parentNode.removeChild(bloc);
  }

  /* ------------------------------------------------------------------ */
  /* 5. Le film des photos                                               */
  /* ------------------------------------------------------------------ */

  var filmOk = false;      // le canvas du film est prêt
  var filmPhotos = null;   // préchargement : { photos, pret }

  function filmPrevu() { return filmOk && config.options.diaporama && config.photos.liste.length > 0; }

  // Les photos se téléchargent pendant l'accueil : elles sont prêtes à temps.
  function prechargerFilm() {
    if (filmPhotos || !filmPrevu()) return;
    filmPhotos = F.precharger(config.photos.liste.slice(0, 10));
  }

  // Titre, puis chaque photo dans son cœur, puis la constellation.
  // Renvoie false si aucune photo n'est prête : on passe directement à la suite.
  async function film(j) {
    prechargerFilm();
    await Promise.race([filmPhotos.pret, attendre(5000)]);
    if (!encore(j)) return false;
    var photos = filmPhotos.photos.filter(function (p) { return p.ok; });
    if (!photos.length) return false;

    etat = 'film';
    preparerFilm(photos);
    montrer('scene-film');
    await attendre(700);
    if (!encore(j)) return false;

    if (config.photos.titre) {
      var n = remplirLettres(el.filmTitre, config.photos.titre, 'lettre-douce', 0, 45);
      annoncer(config.photos.titre);
      await attendreOuToucher(n * 45 + 2400);
      if (!encore(j)) return false;
      el.filmTitre.classList.add('sort');
      await attendre(450);
      if (!encore(j)) return false;
    }

    el.filmBarres.classList.add('visible');
    for (var i = 0; i < photos.length; i++) {
      await unePhoto(j, photos[i], i);
      if (!encore(j)) return false;
    }
    await finDuFilm(j);
    if (!encore(j)) return false;
    await constellation(j);
    return encore(j);
  }

  async function unePhoto(j, photo, i) {
    el.sceneFilm.classList.remove('photo-pleine');
    el.filmLegende.classList.add('sort');
    await F.ouvrir(photo, {
      apparition: function (x, y) {
        if (!encore(j)) return;
        E.petitEclat(x, y, 1.25);
        vibrer(12);
      }
    });
    if (!encore(j)) return;
    el.sceneFilm.classList.toggle('plein', F.pleinEcran());
    el.sceneFilm.classList.add('photo-pleine');

    vider(el.filmLegende);
    if (photo.legende) {
      remplirMots(el.filmLegende, photo.legende, 'mot-anime', 120, 150);
      el.filmLegende.classList.remove('sort');
      annoncer(photo.legende);
    }
    var duree = !config.options.avancementAuto ? -1
      : photo.video && photo.duree ? Math.max(4000, Math.min(12000, photo.duree * 1000 - 2600))
      : Math.max(3400, Math.min(6200, 3000 + photo.legende.length * 45));
    remplirBarre(i, duree);
    await attendreOuToucher(duree);
    remplirBarre(i, 0);
  }

  // La dernière photo se referme en cœur, bat une dernière fois et éclate.
  async function finDuFilm(j) {
    el.sceneFilm.classList.remove('photo-pleine');
    el.filmLegende.classList.add('sort');
    el.filmBarres.classList.remove('visible');
    await F.fermer({
      eclat: function (x, y) {
        if (!encore(j)) return;
        E.explosion(x, y, { force: 0.6, confettis: false });
        flash(x, y);
        M.effet('eclat');
        vibrer([24, 70, 36]);
      }
    });
    F.arreter();
  }

  // Les photos deviennent les perles d'un cœur de lumière tracé par la plume,
  // puis son prénom s'écrit au creux du cœur.
  async function constellation(j) {
    el.filmFin.classList.add('visible');
    ajusterNomConstellation();
    await attendre(reduit ? 300 : 800);
    if (!encore(j)) return;
    await tracerConstellation(j);
    if (!encore(j)) return;
    el.constellation.classList.add('trace');
    await attendre(600);
    if (!encore(j)) return;

    if (config.prenom) {
      annoncer(config.prenom);
      if (!masqueOk || reduit) {
        el.cstNom.classList.add('simple');
        await attendre(1300);
      } else {
        var nb = graphemes(config.prenom).length;
        await ecrireALaMain(el.cstNom, j, Math.max(1400, Math.min(3000, 600 + nb * 170)), nb);
      }
      if (!encore(j)) return;
      el.cstNom.classList.remove('en-ecriture', 'simple');
      el.cstNom.classList.add('ecrit');
      M.effet('prenom');
    }
    el.constellation.classList.add('complete');
    var c = centre(el.constellation);
    E.explosion(c.x, c.y, { force: 0.42, confettis: true });
    E.pluieDeCoeurs(5, 7);
    M.effet('final');
    vibrer([20, 60, 30]);
    await attendre(1500);
  }

  function preparerFilm(photos) {
    el.sceneFilm.classList.remove('photo-pleine', 'plein');
    el.filmTitre.classList.remove('sort');
    vider(el.filmTitre);
    vider(el.filmLegende);
    el.filmLegende.classList.add('sort');
    el.filmBarres.classList.remove('visible');
    vider(el.filmBarres);
    photos.forEach(function () {
      var barre = document.createElement('span');
      barre.className = 'film-barre';
      barre.appendChild(document.createElement('i'));
      el.filmBarres.appendChild(barre);
    });
    el.filmFin.classList.remove('visible');
    el.constellation.classList.remove('trace', 'complete');
    el.boutonFilm.classList.remove('visible');
    preparerConstellation(photos);
  }

  // Barre de progression (comme les « statuts ») : se remplit pendant la photo.
  function remplirBarre(i, duree) {
    var barre = el.filmBarres.children[i];
    if (!barre) return;
    var trait = barre.firstChild;
    trait.style.transition = 'none';
    if (duree > 0) {
      trait.style.transform = 'scaleX(0)';
      void trait.offsetWidth;
      trait.style.transition = 'transform ' + duree + 'ms linear';
    }
    trait.style.transform = 'scaleX(1)';
  }

  // Le visage au centre de chaque médaillon rond.
  function cadrerMedaillon(noeud, p) {
    var r = p.ih / p.iw;                       // hauteur / largeur
    // Portrait : ~23 % de la hauteur (visage et épaules) ; paysage : plus large.
    var part = Math.max(0.23, Math.min(0.6, 0.23 + (1.25 - r) * 0.6));
    var z = Math.max(1, 1 / (part * r));
    var px = Math.abs(1 - z) < 0.001 ? 0.5 : (0.5 - p.fx * z) / (1 - z);
    var py = Math.abs(1 - z * r) < 0.001 ? 0.5 : (0.46 - p.fy * z * r) / (1 - z * r);
    var fond = p.image || p.apercu;
    if (fond) noeud.style.backgroundImage = 'url("' + fond.replace(/["\\\n]/g, encodeURIComponent) + '")';
    noeud.style.backgroundSize = (z * 100).toFixed(1) + '% auto';
    noeud.style.backgroundPosition = (Math.max(0, Math.min(1, px)) * 100).toFixed(1) + '% ' +
      (Math.max(0, Math.min(1, py)) * 100).toFixed(1) + '%';
  }

  var VB = { x: -6, y: -6, l: 112, h: 104 };   // viewBox du cœur de la constellation

  function traitsConstellation() { return el.constellation.querySelectorAll('.cst-trace'); }

  function preparerConstellation(photos) {
    vider(el.cstMedaillons);
    var traits = traitsConstellation(), ref = traits[0];
    var longueur = ref.getTotalLength ? ref.getTotalLength() : 0;
    for (var k = 0; k < traits.length; k++) {
      traits[k].style.strokeDasharray = longueur + ' ' + longueur;
      traits[k].style.strokeDashoffset = longueur;
    }
    var n = photos.length, taille = n <= 5 ? 25 : (n <= 7 ? 21 : 18);
    photos.forEach(function (p, i) {
      var seuil = longueur * placePerle(i, n);
      var pt = longueur ? ref.getPointAtLength(seuil) : { x: 50, y: 50 };
      var perle = document.createElement('span');
      perle.className = 'cst-medaillon';
      perle.style.left = ((pt.x - VB.x) / VB.l * 100).toFixed(3) + '%';
      perle.style.top = ((pt.y - VB.y) / VB.h * 100).toFixed(3) + '%';
      perle.style.width = perle.style.paddingTop = taille + '%';
      perle.style.marginLeft = perle.style.marginTop = (-taille / 2) + '%';
      perle.seuil = seuil;
      var photo = document.createElement('span');
      photo.className = 'cst-photo';
      photo.style.animationDelay = (-i * 0.9) + 's';
      cadrerMedaillon(photo, p);
      perle.appendChild(photo);
      el.cstMedaillons.appendChild(perle);
    });
    el.cstNom.textContent = config.prenom;
    el.cstNom.classList.remove('en-ecriture', 'ecrit', 'simple');
    el.cstNom.style.webkitMaskPosition = '';
    el.cstNom.style.maskPosition = '';
    el.cstNomLigne.hidden = !config.prenom;
  }

  // Place de la i-ième photo sur le contour (0 = creux du haut, 0,5 = pointe).
  // Jusqu'à 5 photos, les côtés restent libres pour le prénom.
  function placePerle(i, n) {
    if (n < 2) return 0.5;
    var v = 2 * i / (n - 1) - 1, k = n <= 5 ? 1.4 : 1;
    return 0.5 + (v < 0 ? -1 : 1) * 0.4 * Math.pow(Math.abs(v), k);
  }

  // La plume trace le cœur ; chaque photo s'allume quand elle passe.
  function tracerConstellation(j) {
    return new Promise(function (resoudre) {
      var traits = traitsConstellation(), ref = traits[0];
      var longueur = ref.getTotalLength ? ref.getTotalLength() : 0;
      var perles = [].slice.call(el.cstMedaillons.children);
      var k;
      if (reduit || !longueur) {
        for (k = 0; k < traits.length; k++) traits[k].style.strokeDashoffset = '0';
        perles.forEach(function (perle) { perle.classList.add('visible'); });
        return setTimeout(resoudre, 900);
      }
      var svg = ref.ownerSVGElement, duree = 3000 + perles.length * 100, debut = 0, prochaine = 0;

      function etape(maintenant) {
        if (!encore(j)) { E.plume(null); return resoudre(); }
        if (!debut) debut = maintenant;
        var t = Math.min(1, (maintenant - debut) / duree);
        var s = (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) * longueur;
        for (k = 0; k < traits.length; k++) traits[k].style.strokeDashoffset = (longueur - s).toFixed(2);
        var r = svg.getBoundingClientRect(), e = r.width / VB.l, pt = ref.getPointAtLength(s);
        E.plume(r.left + (pt.x - VB.x) * e, r.top + (pt.y - VB.y) * e);
        while (prochaine < perles.length && perles[prochaine].seuil <= s) {
          allumerPerle(perles[prochaine]);
          prochaine++;
        }
        if (t < 1) window.requestAnimationFrame(etape);
        else { E.plume(null); resoudre(); }
      }
      window.requestAnimationFrame(etape);
    });
  }

  function allumerPerle(perle) {
    perle.classList.add('visible');
    var c = centre(perle);
    E.etincelles(c.x, c.y, 16);
  }

  // Le prénom tient au creux du cœur, entre les photos.
  function ajusterNomConstellation() {
    if (!config.prenom) return;
    var largeur = el.constellation.getBoundingClientRect().width;
    if (!largeur) return;
    var taille = largeur * 0.13;
    el.cstNomLigne.style.fontSize = taille + 'px';
    var mesure = el.cstNom.getBoundingClientRect().width, dispo = largeur * 0.62;
    if (mesure > dispo) el.cstNomLigne.style.fontSize = Math.max(14, Math.floor(taille * dispo / mesure)) + 'px';
  }

  /* ------------------------------------------------------------------ */
  /* 6. L'enveloppe et la lettre                                         */
  /* ------------------------------------------------------------------ */

  function surBoutonLettre(e) {
    if (etat !== 'bouton') return;
    etat = 'enveloppe';
    var bouton = e && e.currentTarget && e.currentTarget.nodeName === 'BUTTON' ? e.currentTarget : el.boutonLettre;
    var c = centre(bouton);
    E.etincelles(c.x, c.y, 26);
    M.effet('pop');
    el.boutonLettre.setAttribute('tabindex', '-1');
    el.boutonFilm.setAttribute('tabindex', '-1');
    el.sceneEnveloppe.classList.remove('ouverte', 'disparait');
    montrer('scene-enveloppe');
    setTimeout(function () { try { el.enveloppe.focus({ preventScroll: true }); } catch (e) { /* rien */ } }, 900);
  }

  function surEnveloppe() {
    if (etat !== 'enveloppe') return;
    etat = 'ouverture';
    var j = jeton;
    el.sceneEnveloppe.classList.add('ouverte');
    M.effet('lettre');
    vibrer(15);
    var c = centre(el.enveloppe);
    setTimeout(function () { if (encore(j)) E.etincelles(c.x, c.y - 30, 20); }, 250);
    setTimeout(function () {
      if (!encore(j)) return;
      el.sceneEnveloppe.classList.add('disparait');
      ouvrirLettre(j);
    }, 1750);
  }

  function construireLettre() {
    var l = config.lettre;
    el.lettreTitre.textContent = l.titre || (config.prenom ? config.prenom + ',' : '');
    el.lettreTitre.hidden = !el.lettreTitre.textContent;
    vider(el.lettreCorps);
    l.paragraphes.forEach(function (texte) {
      var p = document.createElement('p');
      p.className = 'revele';
      remplirTexte(p, texte);
      el.lettreCorps.appendChild(p);
    });
    remplirTexte(el.lettreFormule, l.formule);
    el.lettreFormule.hidden = !l.formule;
    var sig = el.lettreSignature.firstElementChild;
    sig.textContent = l.signature;
    el.lettreSignature.hidden = !l.signature;
    construirePhotos();
  }

  var photos = [];

  function construirePhotos() {
    photos = config.photos.liste.slice();
    vider(el.polaroids);
    el.souvenirs.hidden = !photos.length;
    if (!photos.length) return;
    el.souvenirsTitre.textContent = config.photos.titre;
    el.souvenirsTitre.hidden = !config.photos.titre;
    el.polaroids.className = 'polaroids' + (photos.length === 1 ? ' un-seul' : '');
    photos.forEach(function (photo, i) {
      var bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'polaroid revele';
      bouton.setAttribute('data-pause', '320');
      var quoi = photo.video ? 'Regarder la vidéo' : 'Agrandir la photo';
      bouton.setAttribute('aria-label', photo.legende ? quoi + ' : ' + photo.legende : quoi);
      var cadre = document.createElement('span');
      cadre.className = 'polaroid-cadre';
      cadre.style.transform = 'rotate(' + ((i % 2 ? 1 : -1) * (2 + (i * 7) % 5)) + 'deg)';
      var fenetre = document.createElement('span');
      fenetre.className = 'polaroid-photo';
      // Vidéo sans image d'aperçu : la vidéo elle-même, arrêtée sur une image.
      var img = document.createElement(photo.image ? 'img' : 'video');
      if (photo.image) {
        img.alt = photo.legende || '';
        img.decoding = 'async';
        if ('loading' in img) img.loading = 'lazy';
      } else {
        img.muted = true;
        img.setAttribute('playsinline', '');
        img.preload = 'metadata';
      }
      img.onerror = function () {
        if (window.console) console.warn('Photo introuvable : ' + photo.image);
        photo.erreur = true;
        bouton.hidden = true;
        var restantes = photos.filter(function (ph) { return !ph.erreur; }).length;
        if (!restantes) el.souvenirs.hidden = true;
      };
      if (photo.cadrage && F) {
        var point = F.lireCadrage(photo.cadrage);
        img.style.objectPosition = (point[0] * 100) + '% ' + (point[1] * 100) + '%';
      }
      img.src = photo.image || O.choisirVideo(photo.video) + '#t=0.5';
      fenetre.appendChild(img);
      if (photo.video) {
        var lecture = document.createElement('span');
        lecture.className = 'polaroid-lecture';
        lecture.setAttribute('aria-hidden', 'true');
        lecture.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="M8 5.5v13l11-6.5z"/></svg>';
        fenetre.appendChild(lecture);
      }
      cadre.appendChild(fenetre);
      var legende = document.createElement('span');
      legende.className = 'polaroid-legende';
      remplirTexte(legende, photo.legende || '');
      cadre.appendChild(legende);
      bouton.appendChild(cadre);
      bouton.addEventListener('click', function () { ouvrirVisionneuse(i); });
      el.polaroids.appendChild(bouton);
    });
  }

  function ouvrirLettre(j) {
    etat = 'lettre';
    construireLettre();
    html.classList.add('lecture');
    el.lettre.hidden = false;
    el.lettre.scrollTop = 0;
    void el.lettre.offsetWidth;
    el.lettre.classList.add('ouverte');
    try { el.lettre.focus({ preventScroll: true }); } catch (e) { el.lettre.focus(); }
    annoncer(config.lettre.paragraphes.join(' '));

    var aReveler = [el.lettreTitre]
      .concat([].slice.call(el.lettreCorps.children))
      .concat([el.lettreFormule, el.lettreSignature, el.coeurDessine])
      .concat(photos.length ? [el.souvenirsTitre] : [])
      .concat([].slice.call(el.polaroids.children))
      .concat([el.lettreFin])
      .filter(function (n) { return !n.hidden; });

    setTimeout(function () {
      if (encore(j)) revelerProgressivement(aReveler, j);
    }, 700);
  }

  // Révèle les éléments dans l'ordre, au rythme de la lecture, en attendant
  // qu'ils soient visibles à l'écran (IntersectionObserver).
  function revelerProgressivement(elements, j) {
    var file = [], occupe = false, prochainIndex = 0;

    function suivant() {
      if (!encore(j)) return;
      if (!file.length) { occupe = false; return; }
      occupe = true;
      var n = file.shift();
      n.classList.add('visible');
      if (n === el.lettreSignature) ecrireSignature(j);
      var pause = parseInt(n.getAttribute('data-pause'), 10) || 650;
      setTimeout(suivant, pause);
    }

    // Révèle jusqu'à l'élément i inclus (jamais dans le désordre).
    function jusqua(i) {
      while (prochainIndex <= i && prochainIndex < elements.length) file.push(elements[prochainIndex++]);
      if (!occupe) suivant();
    }

    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (en) {
          if (en.isIntersecting || en.intersectionRatio > 0) {
            obs.unobserve(en.target);
            jusqua(elements.indexOf(en.target));
          }
        });
      }, { root: el.lettre, threshold: 0.12 });
      elements.forEach(function (n) { obs.observe(n); });
    } else {
      jusqua(elements.length - 1);
    }
  }

  function ecrireSignature(j) {
    var trace = el.coeurDessine.querySelector('.trace');
    if (trace && trace.getTotalLength) {
      var longueur = Math.ceil(trace.getTotalLength());
      trace.style.strokeDasharray = longueur + ' ' + longueur;
      trace.style.strokeDashoffset = longueur;
    }
    setTimeout(function () {
      if (!encore(j)) return;
      if (trace) trace.style.strokeDashoffset = '0';
    }, 1900);
    setTimeout(function () {
      if (!encore(j)) return;
      E.pluieDeCoeurs(4.5, 9);
      M.effet('final');
    }, 3000);
  }

  /* ------------------------------------------------------------------ */
  /* Visionneuse de photos                                               */
  /* ------------------------------------------------------------------ */

  var photoActive = 0, focusAvant = null;

  function afficherPhoto(i) {
    var total = photos.length, sens = i < photoActive ? -1 : 1;
    var visibles = photos.filter(function (ph) { return !ph.erreur; }).length;
    if (!visibles) return;
    i = (i + total) % total;
    while (photos[i].erreur) i = (i + sens + total) % total;
    photoActive = i;
    var photo = photos[photoActive];
    arreterVideoVisionneuse();
    el.visionneuseImg.hidden = !!photo.video;
    el.visionneuseVideo.hidden = !photo.video;
    if (photo.video) {
      // Sans le son au départ ; si on le remet, la musique se fait toute petite.
      if (photo.image) el.visionneuseVideo.poster = photo.image;
      else el.visionneuseVideo.removeAttribute('poster');
      el.visionneuseVideo.src = O.choisirVideo(photo.video);
      el.visionneuseVideo.muted = true;   // la musique continue ; le son de la vidéo se remet avec ses boutons
      var lecture = el.visionneuseVideo.play();
      if (lecture && lecture.catch) lecture.catch(function () {});
    } else {
      el.visionneuseImg.src = photo.image;
      el.visionneuseImg.alt = photo.legende || '';
    }
    remplirTexte(el.visionneuseLegende, photo.legende || '');
    el.visionneuse.classList.toggle('une-seule', visibles < 2);
  }

  function ouvrirVisionneuse(i) {
    focusAvant = document.activeElement;
    afficherPhoto(i);
    el.visionneuse.hidden = false;
    void el.visionneuse.offsetWidth;
    el.visionneuse.classList.add('ouverte');
    $('visionneuse-fermer').focus();
  }

  function arreterVideoVisionneuse() {
    var v = el.visionneuseVideo;
    if (!v.getAttribute('src')) return;
    v.pause();
    v.removeAttribute('src');
    v.load();
    M.attenuer(false);
  }

  function fermerVisionneuse() {
    if (el.visionneuse.hidden) return;
    arreterVideoVisionneuse();
    el.visionneuse.classList.remove('ouverte');
    setTimeout(function () { el.visionneuse.hidden = true; }, 350);
    if (focusAvant && focusAvant.focus) focusAvant.focus();
  }

  /* ------------------------------------------------------------------ */
  /* Rejouer                                                             */
  /* ------------------------------------------------------------------ */

  function rejouer() {
    jeton++;
    toucherEnAttente = null;
    E.vider();
    E.plume(null);
    if (filmOk) F.arreter();
    fermerVisionneuse();
    el.lettre.classList.remove('ouverte');
    setTimeout(function () { if (etat !== 'lettre') el.lettre.hidden = true; }, 900);
    var reveles = el.lettre.querySelectorAll('.revele');
    for (var i = 0; i < reveles.length; i++) reveles[i].classList.remove('visible');
    var trace = el.coeurDessine.querySelector('.trace');
    if (trace) trace.style.strokeDashoffset = trace.style.strokeDasharray ? trace.style.strokeDasharray.split(' ')[0] : '';
    html.classList.remove('eclate', 'lecture', 'pret');
    el.jetaime.classList.remove('sort', 'brille');
    el.scenePrenom.classList.remove('sort');
    el.prenom.classList.remove('en-ecriture', 'ecrit', 'simple');
    el.prenomCoeur.classList.remove('visible');
    el.sceneEnveloppe.classList.remove('ouverte', 'disparait');
    el.sceneMessages.classList.remove('attend-toucher');
    el.boutonLettre.classList.remove('visible');
    el.boutonLettre.setAttribute('tabindex', '-1');
    el.sceneFilm.classList.remove('photo-pleine', 'plein');
    el.filmFin.classList.remove('visible');
    el.filmBarres.classList.remove('visible');
    el.constellation.classList.remove('trace', 'complete');
    el.boutonFilm.classList.remove('visible');
    el.boutonFilm.setAttribute('tabindex', '-1');
    vider(el.zoneMessages);
    void html.offsetWidth;
    lancerAccueil();
    setTimeout(function () { try { el.grandCoeur.focus({ preventScroll: true }); } catch (e) { /* rien */ } }, 1200);
  }

  /* ------------------------------------------------------------------ */
  /* Toucher, souris, clavier                                            */
  /* ------------------------------------------------------------------ */

  function estInteractif(n) {
    while (n && n !== document.body && n !== document) {
      if (n.nodeName === 'BUTTON' || n.nodeName === 'A' || n.id === 'lettre' || n.id === 'visionneuse') return true;
      n = n.parentNode;
    }
    return false;
  }

  function surToucher(x, y, cible) {
    M.reveiller();
    if (estInteractif(cible)) return;
    if (etat === 'lettre' || etat === 'ouverture' || etat === 'chargement') return;
    E.petitEclat(x, y, 0.8);
    if (toucherEnAttente) toucherEnAttente(true);
  }

  var dernierToucher = 0;
  if (window.PointerEvent) {
    document.addEventListener('pointerdown', function (e) {
      if (e.isPrimary === false) return;
      surToucher(e.clientX, e.clientY, e.target);
    });
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'mouse') E.viser(e.clientX, e.clientY);
      if (etat !== 'lettre' && (e.pointerType === 'mouse' || e.buttons)) E.trainee(e.clientX, e.clientY);
    }, { passive: true });
  } else {
    document.addEventListener('touchstart', function (e) {
      dernierToucher = Date.now();
      var t = e.changedTouches[0];
      surToucher(t.clientX, t.clientY, e.target);
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      var t = e.changedTouches[0];
      if (etat !== 'lettre') E.trainee(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('mousedown', function (e) {
      if (Date.now() - dernierToucher < 800) return;
      surToucher(e.clientX, e.clientY, e.target);
    });
    document.addEventListener('mousemove', function (e) {
      E.viser(e.clientX, e.clientY);
      if (etat !== 'lettre') E.trainee(e.clientX, e.clientY);
    });
  }

  document.addEventListener('keydown', function (e) {
    var touche = e.key || '';
    if (!el.visionneuse.hidden) {
      if (touche === 'Escape' || touche === 'Esc') fermerVisionneuse();
      else if (touche === 'ArrowLeft' || touche === 'Left') afficherPhoto(photoActive - 1);
      else if (touche === 'ArrowRight' || touche === 'Right') afficherPhoto(photoActive + 1);
      return;
    }
    var surBouton = document.activeElement && document.activeElement.nodeName === 'BUTTON';
    if (toucherEnAttente && !surBouton && (touche === ' ' || touche === 'Spacebar' || touche === 'Enter' || touche === 'ArrowRight' || touche === 'Right')) {
      e.preventDefault();
      toucherEnAttente(true);
    }
  });

  el.grandCoeur.addEventListener('click', surCoeur);
  el.boutonLettre.addEventListener('click', surBoutonLettre);
  el.boutonFilm.addEventListener('click', surBoutonLettre);
  el.enveloppe.addEventListener('click', surEnveloppe);
  el.boutonRejouer.addEventListener('click', rejouer);
  $('visionneuse-fermer').addEventListener('click', fermerVisionneuse);
  $('visionneuse-prec').addEventListener('click', function () { afficherPhoto(photoActive - 1); });
  $('visionneuse-suiv').addEventListener('click', function () { afficherPhoto(photoActive + 1); });
  el.visionneuse.addEventListener('click', function (e) { if (e.target === el.visionneuse) fermerVisionneuse(); });
  el.visionneuseVideo.addEventListener('play', function () { M.attenuer(!el.visionneuseVideo.muted); });
  el.visionneuseVideo.addEventListener('volumechange', function () { if (!el.visionneuseVideo.paused) M.attenuer(!el.visionneuseVideo.muted); });
  el.visionneuseVideo.addEventListener('pause', function () { M.attenuer(false); });
  el.visionneuseVideo.addEventListener('ended', function () { M.attenuer(false); });

  var departGlisse = null;
  el.visionneuse.addEventListener('touchstart', function (e) { departGlisse = e.changedTouches[0].clientX; }, { passive: true });
  el.visionneuse.addEventListener('touchend', function (e) {
    if (departGlisse === null) return;
    var dx = e.changedTouches[0].clientX - departGlisse;
    departGlisse = null;
    if (Math.abs(dx) > 45 && photos.length > 1) afficherPhoto(photoActive + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* ------------------------------------------------------------------ */
  /* Musique                                                             */
  /* ------------------------------------------------------------------ */

  function majBoutonSon(actif, joue) {
    el.boutonSon.classList.toggle('coupe', !actif);
    el.boutonSon.classList.toggle('joue', !!joue);
    el.boutonSon.setAttribute('aria-pressed', actif ? 'true' : 'false');
    el.boutonSon.title = actif ? 'Couper la musique' : 'Activer la musique';
  }

  M.init({
    activee: config.musique.activee,
    fichier: config.musique.fichier,
    volume: config.musique.volume,
    debut: config.musique.debut,
    leger: html.classList.contains('leger')
  });
  if (!config.musique.activee || !M.disponible()) {
    el.boutonSon.hidden = true;
  } else {
    M.surChangement(majBoutonSon);
    majBoutonSon(true, false);
    el.boutonSon.addEventListener('click', function () { M.basculer(); });
  }

  /* ------------------------------------------------------------------ */
  /* Démarrage                                                           */
  /* ------------------------------------------------------------------ */

  function attendrePolices() {
    var polices = Promise.resolve();
    if (document.fonts && document.fonts.load) {
      polices = Promise.all([
        document.fonts.load('400 1em "Great Vibes"'),
        document.fonts.load('italic 500 1em "Cormorant Garamond"'),
        document.fonts.load('600 1em "Cormorant Garamond"')
      ]).catch(function () {});
    }
    return Promise.race([polices, attendre(2500)]);
  }

  function signalerErreurConfig() {
    var details = (window.__erreursConfig || []).join(' — ');
    if (window.console) console.error('config.js introuvable ou invalide. ' + details);
    var bandeau = document.createElement('div');
    bandeau.className = 'alerte-config';
    bandeau.setAttribute('role', 'alert');
    bandeau.textContent = '⚠️ Le fichier config.js est introuvable ou contient une erreur' +
      (details ? ' (' + details + ')' : '') + ' : la version par défaut est affichée.';
    document.body.appendChild(bandeau);
  }

  el.indice.textContent = tactile ? 'Touche l’écran pour continuer' : 'Clique pour continuer';
  el.envIndice.textContent = tactile ? 'Touche l’enveloppe pour l’ouvrir' : 'Clique sur l’enveloppe pour l’ouvrir';
  remplirTexte(el.boutonLettre, config.boutonLettre);
  remplirTexte(el.boutonFilm, config.boutonLettre);
  remplirTexte(el.envTexte, config.lettre.surEnveloppe);

  E.initialiser({
    theme: theme,
    leger: html.classList.contains('leger'),
    reduit: reduit,
    surLeger: function () {
      html.classList.add('leger');
      if (filmOk) F.alleger();
    }
  });

  filmOk = !!(F && F.initialiser({
    toile: el.filmToile,
    theme: theme,
    leger: html.classList.contains('leger'),
    reduit: reduit,
    effets: E
  }));

  if (charge.erreur) signalerErreurConfig();

  var redim = 0;
  window.addEventListener('resize', function () {
    clearTimeout(redim);
    redim = setTimeout(function () {
      if (el.sceneJetaime.classList.contains('est-active')) ajusterLargeur(el.jetaime);
      if (el.scenePrenom.classList.contains('est-active')) ajusterLargeur(el.lignePrenom);
      if (el.sceneFilm.classList.contains('est-active')) ajusterNomConstellation();
    }, 150);
  });

  attendrePolices().then(function () {
    lancerAccueil();
    setTimeout(prechargerFilm, 1500);
  });
})();
