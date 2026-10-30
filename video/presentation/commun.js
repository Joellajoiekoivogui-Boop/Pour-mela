'use strict';
// Outils partagés par les présentations animées (version longue et
// version courte) : couleurs, ligne de temps, textes animés, fond,
// sous-titres, carte d'Afrique, maquettes des réalisations, logos…
// Chaque page charge d'abord sa timeline, puis ce fichier, puis ses scènes,
// et appelle enfin demarrer([...ses scènes], 'sortie/…wav').

const c = document.getElementById('c');
const W = c.width, H = c.height;  // 1920 × 1080, ou 1080 × 1920 pour la version verticale
const g = c.getContext('2d');
const TL = window.TIMELINE;
const DUREE = TL.duree;

const COUL = {
  fond: '#05070f', encre: '#f4f1ea', doux: '#9aa3b8', sombre: '#0c1222',
  or: '#f5b041', corail: '#ff6b4a', cyan: '#3ad6e6', violet: '#8b7bff', vert: '#3ddc97',
  fata: '#ffd84d', orange: '#ff7900', wa: '#25d366',
};
const SANS = 'Inter, "Inter Display", system-ui, sans-serif';
const SERIF = 'Cormorant, Georgia, serif';
const MONO = '"DejaVu Sans Mono", monospace';

// ---------- ligne de temps ----------
const SEG = {};
TL.segments.forEach(s => { SEG[s.id] = s; });
const D = id => SEG[id].debut;
const F = id => SEG[id].fin;
const frac = (id, f) => D(id) + (F(id) - D(id)) * f;
const SCENES = [];
TL.segments.forEach(s => { if (!SCENES.length || SCENES[SCENES.length - 1].nom !== s.scene) SCENES.push({ nom: s.scene, debut: s.debut }); });
SCENES.forEach((s, i) => {
  s.a = i === 0 ? 0 : s.debut - 1.0;
  s.b = i < SCENES.length - 1 ? SCENES[i + 1].debut - .4 : DUREE;
});
const BORNES = Object.fromEntries(SCENES.map(s => [s.nom, s]));

// ---------- médias ----------
// Les fichiers absents sont simplement ignorés : la scène dessine alors une
// maquette à la place (voir README.md pour ajouter logos et captures).
const MEDIAS = {};
const CHARGEMENTS = [];
['photo-joel.jpg', 'portrait-joel.jpg', 'joel-scene.jpg', 'affiche-fata.jpg', 'logo-fata.png', 'logo-elitech.png', 'logo-yen.png',
 'ev-micro.jpg', 'ev-presentation.jpg', 'ev-remise.jpg', 'ev-stand.jpg', 'ev-stand2.jpg', 'ev-foire.jpg', 'ev-cloud-unc.jpg', 'ev-odc.jpg',
 'capture-nabele.png', 'capture-smartstock.png', 'capture-sgs.png', 'capture-solarbox.png', 'capture-ast.png', 'capture-om.png',
].forEach(nom => {
  const img = new Image();
  CHARGEMENTS.push(new Promise(ok => {
    img.onload = () => { MEDIAS[nom.replace(/\.\w+$/, '')] = img; ok(); };
    img.onerror = ok;
  }));
  img.src = 'medias/' + nom;
});

// ---------- outils ----------
const borne = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const prog = (t, a, b) => borne((t - a) / (b - a));
const lin = (a, b, p) => a + (b - a) * p;
const sortie3 = p => 1 - Math.pow(1 - p, 3);
const sortie5 = p => 1 - Math.pow(1 - p, 5);
const entreeSortie = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const rebond = p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
function alea(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

function police(taille, graisse = 700, famille = SANS, italique = false) {
  g.font = `${italique ? 'italic ' : ''}${graisse} ${taille}px ${famille}`;
}

function texteLettres(txt, x, y, p, { taille = 60, graisse = 700, famille = SANS, couleur = COUL.encre, align = 'center', espace = 0, montee = 40 } = {}) {
  police(taille, graisse, famille);
  const lettres = [...txt];
  const larg = lettres.map(l => g.measureText(l).width + espace);
  const total = larg.reduce((a, b) => a + b, 0) - espace;
  let cx = align === 'center' ? x - total / 2 : x;
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  lettres.forEach((l, i) => {
    const q = sortie3(borne((p - (i / lettres.length) * .6) / .4));
    if (q > 0) {
      g.save(); g.globalAlpha *= q; g.fillStyle = couleur;
      g.fillText(l, cx, y + (1 - q) * montee); g.restore();
    }
    cx += larg[i];
  });
  return total;
}

function texteMots(txt, x, y, p, { taille = 48, graisse = 500, famille = SANS, italique = false, couleur = COUL.encre, align = 'center', accents = {} } = {}) {
  police(taille, graisse, famille, italique);
  const mots = txt.split(' ');
  const espace = g.measureText(' ').width;
  const larg = mots.map(m => g.measureText(m).width);
  const total = larg.reduce((a, b) => a + b, 0) + espace * (mots.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  mots.forEach((m, i) => {
    const q = sortie3(borne((p - (i / mots.length) * .65) / .35));
    if (q > 0) {
      g.save(); g.globalAlpha *= q;
      g.fillStyle = accents[m.replace(/[.,:;!?…»«]/g, '')] || couleur;
      g.fillText(m, cx, y + (1 - q) * 24); g.restore();
    }
    cx += larg[i] + espace;
  });
  return total;
}

// Coupe un texte en lignes d'au plus « largeur » pixels.
function lignes(txt, largeur) {
  const res = []; let l = '';
  for (const m of txt.split(' ')) {
    const essai = l ? l + ' ' + m : m;
    if (g.measureText(essai).width > largeur && l) { res.push(l); l = m; } else l = essai;
  }
  if (l) res.push(l);
  return res;
}

function paragraphe(txt, x, y, largeur, interligne, p, opts = {}) {
  police(opts.taille || 48, opts.graisse || 500, opts.famille || SANS, opts.italique);
  const ls = lignes(txt, largeur);
  ls.forEach((l, i) => texteMots(l, x, y + i * interligne, borne(p * (ls.length + 1) - i * .9), opts));
  return ls.length;
}

function scene(t, nom, fe = .7, fs = .7) {
  const s = BORNES[nom];
  if (t < s.a || t > s.b) return 0;
  return Math.min(prog(t, s.a, s.a + fe), 1 - prog(t, s.b - fs, s.b));
}

// Visibilité d'un élément entre deux instants (fondu d'entrée et de sortie).
function fenetre(t, a, b, fe = .5, fs = .5) {
  if (t < a || t > b) return 0;
  return Math.min(prog(t, a, a + fe), b === Infinity ? 1 : 1 - prog(t, b - fs, b));
}

function cercle(x, y, r, couleur, alpha = 1) {
  g.save(); g.globalAlpha *= alpha; g.fillStyle = couleur;
  g.beginPath(); g.arc(x, y, Math.max(0, r), 0, Math.PI * 2); g.fill(); g.restore();
}

function anneau(x, y, r, couleur, ep = 2, p = 1) {
  g.save(); g.strokeStyle = couleur; g.lineWidth = ep;
  g.beginPath(); g.arc(x, y, Math.max(0, r), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); g.stroke(); g.restore();
}

function lueur(x, y, r, couleur, alpha = 1) {
  if (alpha <= 0) return;
  g.save(); g.globalAlpha *= alpha;
  const d = g.createRadialGradient(x, y, 0, x, y, r);
  d.addColorStop(0, couleur); d.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = d; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}

function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }

function carte(x, y, w, h, { r = 22, fond = 'rgba(12,18,34,0.92)', bord = 'rgba(255,255,255,0.09)', ombre = null } = {}) {
  g.save();
  if (ombre) { g.shadowColor = ombre; g.shadowBlur = 50; }
  rr(x, y, w, h, r); g.fillStyle = fond; g.fill();
  g.shadowBlur = 0;
  g.strokeStyle = bord; g.lineWidth = 1.2; g.stroke();
  g.restore();
}

// Pastille arrondie avec texte ; renvoie sa largeur.
function pastille(txt, x, y, p, { couleur = COUL.or, taille = 26, align = 'left', plein = false } = {}) {
  police(taille, 600);
  const w = g.measureText(txt).width + taille * 1.6, h = taille * 1.9;
  const q = rebond(borne(p));
  if (p <= 0) return w;
  const cx = align === 'center' ? x : x + w / 2;
  g.save(); g.globalAlpha *= borne(p * 2);
  g.translate(cx, y); g.scale(q, q);
  rr(-w / 2, -h / 2, w, h, h / 2);
  g.fillStyle = plein ? couleur : 'rgba(255,255,255,0.05)'; g.fill();
  g.strokeStyle = couleur; g.lineWidth = 1.5; g.stroke();
  g.fillStyle = plein ? COUL.fond : COUL.encre; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(txt, 0, 1);
  g.restore();
  return w;
}

// Photo recadrée (cover) avec lent zoom ; foyer = point à garder centré.
function photo(img, x, y, w, h, { foyer = [.5, .5], zoom = 1, r = 24, rond = false } = {}) {
  if (!img) return false;
  const e = Math.max(w / img.width, h / img.height) * zoom;
  const sw = w / e, sh = h / e;
  const sx = borne(img.width * foyer[0] - sw / 2, 0, img.width - sw);
  const sy = borne(img.height * foyer[1] - sh / 2, 0, img.height - sh);
  g.save();
  if (rond) { g.beginPath(); g.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2); } else rr(x, y, w, h, r);
  g.clip();
  g.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  g.restore();
  return true;
}

// Photo encadrée, avec ombre, lent zoom et légende en bas.
function cadrePhoto(nom, x, y, w, h, { foyer = [.5, .5], legende = '', zoom = 1, bord = 'rgba(255,255,255,0.35)', lumiere = 1 } = {}) {
  const img = MEDIAS[nom];
  if (!img) return false;
  g.save(); g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 50; rr(x, y, w, h, 24); g.fillStyle = '#000'; g.fill(); g.restore();
  if (lumiere !== 1) { g.save(); g.filter = `brightness(${lumiere})`; }
  photo(img, x, y, w, h, { foyer, zoom });
  if (lumiere !== 1) g.restore();
  g.strokeStyle = bord; g.lineWidth = 2; rr(x, y, w, h, 24); g.stroke();
  if (legende) {
    police(20, 600);
    const lw = Math.min(w - 48, g.measureText(legende).width + 40);
    rr(x + 24, y + h - 70, lw, 46, 23); g.fillStyle = 'rgba(5,7,15,0.82)'; g.fill();
    g.fillStyle = COUL.encre; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(legende, x + 44, y + h - 40);
  }
  return true;
}

// Titre de chapitre en haut à gauche.
function chapitre(t, nom, num, titre, couleur) {
  const p = prog(t, BORNES[nom].a + .3, BORNES[nom].a + 1.4);
  g.save(); g.globalAlpha *= sortie3(p);
  police(22, 700); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillStyle = couleur; g.fillText(num, 120, 100);
  g.fillRect(166, 92, 56 * sortie3(p), 2);
  g.fillStyle = COUL.doux; g.fillText(titre.toUpperCase(), 240, 100);
  g.restore();
}

// Mot-clé fort qui « claque » à l'écran.
function motCle(t, debut, txt, x, y, couleur, { taille = 120, fin = Infinity, align = 'center' } = {}) {
  const a = fenetre(t, debut, fin, .25, .5);
  if (!a) return;
  const p = sortie5(prog(t, debut, debut + .5));
  g.save(); g.globalAlpha *= a;
  police(taille, 900); g.textAlign = align; g.textBaseline = 'alphabetic';
  const w = g.measureText(txt).width;
  const cx = align === 'center' ? x : x + w / 2;
  g.translate(cx, y); g.scale(lin(1.3, 1, p), lin(1.3, 1, p));
  lueur(0, -taille * .35, w * .7, couleur, .18 * a);
  g.fillStyle = couleur; g.textAlign = 'center';
  g.fillText(txt, 0, 0);
  g.restore();
}

// ---------- fond ----------
const PARTICULES = Array.from({ length: 120 }, (_, i) => ({
  x: alea(i) * W, y: alea(i + 500) * H, v: .2 + alea(i + 900) * .8, r: .6 + alea(i + 1300) * 1.6, ph: alea(i + 1700) * 6.28,
}));
const TEINTES = { intro: COUL.or, parcours: COUL.cyan, stack: COUL.cyan, idee: COUL.violet, realisations: COUL.or, ia: COUL.violet,
  entreprise: COUL.or, fata: COUL.fata, jeunes: COUL.vert, yen: COUL.cyan, vision: COUL.corail, afrique: COUL.or, conclusion: COUL.or };
function teinte(t) {
  let k = COUL.or;
  for (const s of SCENES) if (t >= s.a) k = TEINTES[s.nom] || COUL.or;
  return k;
}

function fond(t) {
  g.fillStyle = COUL.fond; g.fillRect(0, 0, W, H);
  const k = teinte(t);
  lueur(W * .5 + Math.sin(t * .1) * 360, H * .42 + Math.cos(t * .08) * 140, 950, k, .14);
  lueur(W * .12 + Math.cos(t * .07) * 200, H * .95, 700, COUL.violet, .09);
  lueur(W * .92, H * .08 + Math.sin(t * .06) * 100, 600, COUL.cyan, .06);
  g.fillStyle = 'rgba(255,255,255,0.04)';
  const dec = (t * 6) % 60;
  for (let x = -60 + dec; x < W + 60; x += 60) for (let y = 30; y < H; y += 60) g.fillRect(x, y, 2, 2);
  for (const q of PARTICULES) {
    const y = (q.y - t * 14 * q.v + H * 100) % H;
    cercle(q.x + Math.sin(t * .4 + q.ph) * 20, y, q.r, '#fff', .12 + .2 * (.5 + .5 * Math.sin(t * 1.6 + q.ph)));
  }
}

function vignette() {
  const d = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.05);
  d.addColorStop(0, 'rgba(0,0,0,0)'); d.addColorStop(1, 'rgba(0,0,0,0.65)');
  g.fillStyle = d; g.fillRect(0, 0, W, H);
}

// ---------- sous-titres ----------
function sousTitres(t) {
  const s = TL.segments.find(s => t >= s.debut - .15 && t <= s.fin + .35);
  if (!s) return;
  const a = Math.min(prog(t, s.debut - .15, s.debut + .1), 1 - prog(t, s.fin + .1, s.fin + .35));
  police(32, 500);
  const ls = lignes(s.texte, 1500);
  const ih = 44, y0 = 1010 - (ls.length - 1) * ih;
  g.save(); g.globalAlpha = a;
  const d = g.createLinearGradient(0, y0 - 80, 0, H);
  d.addColorStop(0, 'rgba(5,7,15,0)'); d.addColorStop(.45, 'rgba(5,7,15,0.75)'); d.addColorStop(1, 'rgba(5,7,15,0.9)');
  g.fillStyle = d; g.fillRect(0, y0 - 80, W, H - y0 + 80);
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  ls.forEach((l, i) => {
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillText(l, W / 2 + 2, y0 + i * ih + 2);
    g.fillStyle = COUL.encre; g.fillText(l, W / 2, y0 + i * ih);
  });
  g.restore();
}

// ---------- carte d'Afrique en points ----------
const AFRIQUE = [[-5.9,35.8],[-1,35.1],[3,36.8],[10,37.2],[11,33.5],[15,32.3],[19.9,30.9],[25,31.6],[29,30.9],[32.3,31.3],[32.6,29.9],[35,24],[37.2,21],[38.5,18],[41.5,14],[43.3,12.5],[44.5,10.4],[51.2,11.8],[51,10],[49,6],[46,2],[42,-1.5],[40,-3.5],[39.3,-6.8],[40.5,-10.5],[40.5,-15],[35.5,-24],[32.9,-26],[32.5,-29],[30,-31.3],[27,-33.6],[22,-34],[20,-34.8],[18.4,-34.2],[17.9,-31],[15,-27],[14.5,-23],[11.8,-17],[13.4,-12],[12.2,-6],[9.4,-1],[9.5,3.8],[8.5,4.5],[6,4.3],[3,6.4],[1,6],[-2,4.8],[-4,5.2],[-7.5,4.4],[-9.3,5.5],[-11.5,6.9],[-13.2,8.5],[-14.5,10.8],[-16.7,12.4],[-17.5,14.7],[-16.5,19.5],[-17,21],[-14.5,26],[-13,27.6],[-9.8,29.5],[-9.6,30.4],[-8.5,33.2],[-6.8,34]];
const MADAGASCAR = [[49.3,-12],[50.5,-15.5],[49.8,-17],[47.1,-24.9],[45.2,-25.5],[43.7,-23.5],[43.3,-21.8],[44.4,-16.2],[46.5,-15.7],[48,-13.5]];
function dedans(pt, poly) {
  let ok = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) ok = !ok;
  }
  return ok;
}
// Points de la carte en coordonnées (longitude, latitude), tous les 1,25°.
const POINTS_AFRIQUE = [];
for (let lo = -18; lo < 52; lo += 1.25) for (let la = -35; la < 38; la += 1.25)
  if (dedans([lo, la], AFRIQUE) || dedans([lo, la], MADAGASCAR)) POINTS_AFRIQUE.push([lo, la]);
const GUINEE = [-11, 10.4];
const POLES = [[3.4, 6.5], [36.8, -1.3], [31.2, 30], [28, -26.2], [-17.4, 14.7], [32.6, .3], [15.3, -4.3], [38.7, 9], [-4, 5.3], [-7.6, 33.6]];

function carteAfrique(t, debut, cx, cy, e, { arcs = -1, alpha = 1 } = {}) {
  const proj = ([lo, la]) => [cx + (lo - 17) * e, cy - (la - 1) * e];
  const G = proj(GUINEE);
  const rayon = (t - debut) * 50 * e;
  g.save(); g.globalAlpha *= alpha;
  for (const pt of POINTS_AFRIQUE) {
    const [x, y] = proj(pt);
    const p = borne((rayon - Math.hypot(x - G[0], y - G[1])) / (16 * e));
    if (p <= 0) continue;
    cercle(x, y, e * .24 * p, COUL.or, (.3 + .3 * Math.sin(t * 2 + x * .05 + y * .03)) * p + .1 * p);
  }
  if (arcs >= 0) POLES.forEach((P0, i) => {
    const P = proj(P0);
    const p = entreeSortie(prog(t, arcs + i * .25, arcs + i * .25 + 1.2));
    if (p <= 0) return;
    const mx = (G[0] + P[0]) / 2, my = Math.min(G[1], P[1]) - 10 * e;
    g.strokeStyle = 'rgba(58,214,230,0.55)'; g.lineWidth = 2; g.beginPath();
    for (let k = 0; k <= 40 * p; k++) {
      const u = k / 40;
      const x = (1 - u) * (1 - u) * G[0] + 2 * (1 - u) * u * mx + u * u * P[0];
      const y = (1 - u) * (1 - u) * G[1] + 2 * (1 - u) * u * my + u * u * P[1];
      k ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
    if (p >= 1) { lueur(P[0], P[1], 22, COUL.cyan, .7); cercle(P[0], P[1], 3.5, '#fff'); }
  });
  const pg = prog(t, debut, debut + .8);
  for (let i = 0; i < 3; i++) {
    const q = (t * .6 + i / 3) % 1;
    g.save(); g.globalAlpha *= pg * (1 - q) * .8; g.strokeStyle = COUL.corail; g.lineWidth = 2;
    g.beginPath(); g.arc(G[0], G[1], 8 + q * 6 * e, 0, Math.PI * 2); g.stroke(); g.restore();
  }
  lueur(G[0], G[1], 4 * e, COUL.corail, pg);
  cercle(G[0], G[1], 7 * pg, '#fff');
  g.restore();
  return G;
}

function drapeau(x, y, h = 28) {
  ['#ce1126', '#fcd116', '#009460'].forEach((k, i) => { g.fillStyle = k; g.fillRect(x + i * h * .45, y, h * .45, h); });
}


const TECHS = {
  web: [['React', '#61dafb', 'atome'], ['Next.js', '#ffffff', 'N'], ['Node.js', '#68a063', 'JS'], ['Express', '#cfd6e4', 'ex'], ['MongoDB', '#47a248', 'feuille'], ['Supabase', '#3ecf8e', 'eclair']],
  mobile: [['React Native', '#61dafb', 'atome'], ['Expo', '#ffffff', 'expo']],
  autres: [['Electron.js', '#9feaf9', 'atome2'], ['Python', '#ffd43b', 'Py'], ['Arduino', '#00979d', 'inf'], ['ESP32', '#e7352c', 'puce']],
};
function iconeTech(type, k, s, t) {
  g.save(); g.strokeStyle = k; g.fillStyle = k; g.lineWidth = s * .07; g.lineCap = 'round';
  if (type === 'atome' || type === 'atome2') {
    for (let i = 0; i < 3; i++) {
      g.save(); g.rotate(i * Math.PI / 3 + (type === 'atome2' ? t * .3 : 0));
      g.beginPath(); g.ellipse(0, 0, s * .46, s * .18, 0, 0, Math.PI * 2); g.stroke(); g.restore();
    }
    cercle(0, 0, s * .09, k);
  } else if (type === 'feuille') {
    g.beginPath(); g.moveTo(0, -s * .45); g.quadraticCurveTo(s * .32, -s * .05, 0, s * .4); g.quadraticCurveTo(-s * .32, -s * .05, 0, -s * .45); g.fill();
    g.strokeStyle = COUL.sombre; g.beginPath(); g.moveTo(0, -s * .3); g.lineTo(0, s * .45); g.stroke();
  } else if (type === 'eclair') {
    g.beginPath(); g.moveTo(s * .08, -s * .45); g.lineTo(-s * .3, s * .08); g.lineTo(0, s * .08); g.lineTo(-s * .08, s * .45); g.lineTo(s * .3, -s * .08); g.lineTo(0, -s * .08); g.closePath(); g.fill();
  } else if (type === 'expo') {
    g.beginPath(); g.moveTo(-s * .4, s * .35); g.lineTo(0, -s * .35); g.lineTo(s * .4, s * .35); g.stroke();
  } else if (type === 'inf') {
    g.beginPath(); g.ellipse(-s * .2, 0, s * .2, s * .16, 0, 0, Math.PI * 2); g.ellipse(s * .2, 0, s * .2, s * .16, 0, 0, Math.PI * 2); g.stroke();
    police(s * .2, 800); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('−', -s * .2, 0); g.fillText('+', s * .2, 0);
  } else if (type === 'puce') {
    rr(-s * .3, -s * .3, s * .6, s * .6, s * .06); g.stroke();
    for (let i = -2; i <= 2; i++) {
      g.beginPath(); g.moveTo(i * s * .1, -s * .3); g.lineTo(i * s * .1, -s * .42); g.moveTo(i * s * .1, s * .3); g.lineTo(i * s * .1, s * .42);
      g.moveTo(-s * .3, i * s * .1); g.lineTo(-s * .42, i * s * .1); g.moveTo(s * .3, i * s * .1); g.lineTo(s * .42, i * s * .1); g.stroke();
    }
  } else {
    police(s * .42, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(type, 0, 2);
  }
  g.restore();
}

function tuile(t, [nom, k, ic], x, y, p) {
  if (p <= 0) return;
  const q = rebond(borne(p));
  g.save(); g.globalAlpha *= borne(p * 2);
  g.translate(x, y); g.scale(q, q);
  carte(-95, -95, 190, 190, { r: 30 });
  lueur(0, -20, 90, k, .18);
  g.translate(0, -18); iconeTech(ic, k, 86, t); g.translate(0, 18);
  police(23, 700); g.fillStyle = COUL.encre; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillText(nom, 0, 72);
  g.restore();
}


function ampoule(x, y, s, allume) {
  lueur(x, y - s * .2, s * 2.2, COUL.or, .5 * allume);
  g.save(); g.strokeStyle = COUL.or; g.lineWidth = s * .08; g.lineCap = 'round';
  g.beginPath(); g.arc(x, y - s * .2, s * .55, Math.PI * .8, Math.PI * 2.2); g.lineTo(x + s * .25, y + s * .5); g.lineTo(x - s * .25, y + s * .5); g.closePath();
  g.fillStyle = `rgba(245,176,65,${.15 + .5 * allume})`; g.fill(); g.stroke();
  g.beginPath(); g.moveTo(x - s * .22, y + s * .68); g.lineTo(x + s * .22, y + s * .68); g.stroke();
  g.restore();
}
function engrenage(x, y, r, rot, k) {
  g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = k;
  g.beginPath();
  for (let i = 0; i < 16; i++) {
    const ang = i / 16 * Math.PI * 2, rr2 = i % 2 ? r * .78 : r;
    g.lineTo(Math.cos(ang - .1) * rr2, Math.sin(ang - .1) * rr2); g.lineTo(Math.cos(ang + .1) * rr2, Math.sin(ang + .1) * rr2);
  }
  g.closePath(); g.fill();
  cercle(0, 0, r * .35, COUL.fond);
  g.restore();
}
function telephone(x, y, w, h, contenu) {
  carte(x, y, w, h, { r: w * .14, fond: '#0b1020', bord: 'rgba(255,255,255,0.25)', ombre: 'rgba(0,0,0,0.5)' });
  g.save(); rr(x + w * .05, y + w * .05, w * .9, h - w * .1, w * .1); g.clip();
  g.fillStyle = '#111a2e'; g.fillRect(x, y, w, h);
  contenu(x + w * .05, y + w * .05, w * .9, h - w * .1);
  g.restore();
  rr(x + w * .36, y + w * .07, w * .28, w * .05, w * .025); g.fillStyle = '#000'; g.fill();
}


function navigateur(x, y, w, h, titre, contenu) {
  carte(x, y, w, h, { r: 16, fond: '#0e1528', ombre: 'rgba(0,0,0,0.6)' });
  [COUL.corail, COUL.or, COUL.vert].forEach((k, i) => cercle(x + 24 + i * 20, y + 24, 6, k));
  rr(x + 100, y + 12, w - 200, 24, 12); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fill();
  police(14, 500); g.fillStyle = COUL.doux; g.textAlign = 'center'; g.fillText(titre, x + w / 2, y + 29);
  g.save(); rr(x, y + 48, w, h - 48, 0); g.clip();
  contenu(x, y + 48, w, h - 48);
  g.restore();
}
function barres(x, y, w, h, n, k, p, graine) {
  for (let i = 0; i < n; i++) {
    const v = (.3 + .7 * alea(graine + i)) * borne(p * 2 - i / n);
    rr(x + i * w / n + 4, y + h - h * v, w / n - 8, h * v, 4); g.fillStyle = k; g.fill();
  }
}
function kpi(x, y, w, titre, valeur, k) {
  rr(x, y, w, 90, 12); g.fillStyle = 'rgba(255,255,255,0.05)'; g.fill();
  police(14, 500); g.fillStyle = COUL.doux; g.textAlign = 'left'; g.fillText(titre, x + 16, y + 30);
  police(26, 800); g.fillStyle = k; g.fillText(valeur, x + 16, y + 68);
}
function ligneTexte(x, y, w, a = .3) { g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(x, y, w, 8); }

const PRODUITS = [
  { id: 'nabele', nom: 'NABELE', desc: ['Gestion de stock et de caisse', 'multi-boutiques', 'Restaurants & commerces'], k: COUL.or,
    maquette(x, y, w, h, p) {
      navigateur(x, y, w, h, 'nabele · tableau de bord', (X, Y, Wd, Hd) => {
        g.fillStyle = 'rgba(245,176,65,0.08)'; g.fillRect(X, Y, 170, Hd);
        police(20, 900); g.fillStyle = COUL.or; g.textAlign = 'left'; g.fillText('NABELE', X + 24, Y + 40);
        ['Caisse', 'Stock', 'Boutiques', 'Rapports'].forEach((m, i) => { police(16, 500); g.fillStyle = i === 0 ? COUL.encre : COUL.doux; g.fillText(m, X + 24, Y + 95 + i * 40); });
        kpi(X + 195, Y + 24, 200, 'Ventes du jour', Math.round(2450000 * borne(p * 1.5)).toLocaleString('fr-FR') + ' GNF', COUL.or);
        kpi(X + 410, Y + 24, 150, 'Boutiques', '3', COUL.cyan);
        kpi(X + 575, Y + 24, 150, 'Articles', '1 284', COUL.vert);
        barres(X + 195, Y + 140, 530, 200, 12, 'rgba(245,176,65,0.7)', p, 11);
        police(14, 500); g.fillStyle = COUL.doux; g.fillText('Ventes de la semaine', X + 195, Y + 370);
      });
    } },
  { id: 'smartstock', nom: 'SmartStock Guinée', desc: ['Plateforme pour', 'les commerçants', 'Stock en temps réel'], k: COUL.vert,
    maquette(x, y, w, h, p) {
      telephone(x + w / 2 - 130, y - 10, 260, 480, (X, Y, Wd) => {
        g.fillStyle = COUL.vert; g.fillRect(X, Y, Wd, 66);
        police(18, 800); g.fillStyle = COUL.fond; g.textAlign = 'left'; g.fillText('SmartStock Guinée', X + 14, Y + 42);
        ['Riz 25 kg', 'Huile 5 L', 'Sucre 1 kg', 'Savon', 'Lait en poudre'].forEach((nom, i) => {
          const yy = Y + 90 + i * 70;
          police(15, 600); g.fillStyle = COUL.encre; g.fillText(nom, X + 14, yy + 18);
          const v = (.2 + .8 * alea(i + 40)) * borne(p * 2 - i * .15);
          rr(X + 14, yy + 30, Wd - 28, 10, 5); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fill();
          rr(X + 14, yy + 30, (Wd - 28) * v, 10, 5); g.fillStyle = v < .35 ? COUL.corail : COUL.vert; g.fill();
        });
      });
    } },
  { id: 'sgs', nom: 'SGS', desc: ['Système de gestion scolaire', 'Electron → Next.js + MongoDB', 'Élèves, notes, classes'], k: COUL.cyan,
    maquette(x, y, w, h, p) {
      navigateur(x, y, w, h, 'sgs · gestion scolaire', (X, Y, Wd) => {
        kpi(X + 24, Y + 24, 220, 'Élèves inscrits', Math.round(640 * borne(p * 1.5)).toString(), COUL.cyan);
        kpi(X + 260, Y + 24, 200, 'Classes', '18', COUL.violet);
        kpi(X + 476, Y + 24, 240, 'Moyenne générale', '13,4 / 20', COUL.or);
        police(14, 700); g.fillStyle = COUL.doux; g.textAlign = 'left';
        ['Élève', 'Classe', 'Moyenne', 'Statut'].forEach((c2, i) => g.fillText(c2, X + 30 + i * 175, Y + 160));
        for (let i = 0; i < 5; i++) {
          if (borne(p * 2 - i * .15) <= 0) continue;
          const yy = Y + 180 + i * 46;
          g.fillStyle = i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)'; g.fillRect(X + 20, yy, Wd - 40, 40);
          ligneTexte(X + 30, yy + 16, 110, .35); ligneTexte(X + 205, yy + 16, 60, .25);
          police(15, 700); g.fillStyle = COUL.encre; g.fillText((10 + alea(i + 70) * 8).toFixed(1).replace('.', ','), X + 380, yy + 26);
          pastille(i === 3 ? 'À suivre' : 'Admis', X + 555, yy + 20, 1, { couleur: i === 3 ? COUL.corail : COUL.vert, taille: 13 });
        }
      });
    } },
  { id: 'solarbox', nom: 'SolarBox', desc: ['Onduleur solaire connecté', 'Tableaux de bord', 'Apprentissage automatique'], k: COUL.or,
    maquette(x, y, w, h, p, t) {
      navigateur(x, y, w, h, 'solarbox · énergie', (X, Y, Wd, Hd) => {
        // jauge de batterie
        const bx = X + 130, by = Y + 170;
        anneau(bx, by, 90, 'rgba(255,255,255,0.08)', 16);
        anneau(bx, by, 90, COUL.vert, 16, .82 * borne(p * 1.5));
        police(36, 900); g.fillStyle = COUL.encre; g.textAlign = 'center'; g.fillText(Math.round(82 * borne(p * 1.5)) + ' %', bx, by + 12);
        police(14, 500); g.fillStyle = COUL.doux; g.fillText('Batterie', bx, by + 130);
        // courbe de production + prédiction
        const cx0 = X + 280, cw = Wd - 310, cy0 = Y + 300, ch = 230;
        g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = 1;
        for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(cx0, cy0 - i * ch / 4); g.lineTo(cx0 + cw, cy0 - i * ch / 4); g.stroke(); }
        const courbe = u => Math.max(0, Math.sin(u * Math.PI)) * (.85 + .1 * Math.sin(u * 20));
        g.strokeStyle = COUL.or; g.lineWidth = 3; g.beginPath();
        for (let i = 0; i <= 60 * borne(p * 1.3); i++) { const u = i / 60; const yy = cy0 - courbe(u) * ch; i ? g.lineTo(cx0 + u * cw * .65, yy) : g.moveTo(cx0, yy); }
        g.stroke();
        if (p > .6) {
          g.strokeStyle = COUL.violet; g.setLineDash([8, 8]); g.beginPath();
          for (let i = 39; i <= 60; i++) { const u = i / 60; const yy = cy0 - courbe(u) * ch * .95; i > 39 ? g.lineTo(cx0 + u * cw, yy) : g.moveTo(cx0 + u * cw * .65 / .65 * .65, yy); }
          g.stroke(); g.setLineDash([]);
          pastille('✦ Prédiction ML', cx0 + cw * .66, Y + 40, prog(p, .6, .8), { couleur: COUL.violet, taille: 14 });
        }
        police(14, 500); g.fillStyle = COUL.doux; g.textAlign = 'left'; g.fillText('Production solaire (kW)', cx0, Y + 40);
      });
    } },
  { id: 'ast', nom: 'AST Media', desc: ['Plateforme d’actualités', 'en français'], k: COUL.corail,
    maquette(x, y, w, h, p) {
      navigateur(x, y, w, h, 'ast media · actualités', (X, Y, Wd) => {
        police(26, 900); g.fillStyle = COUL.corail; g.textAlign = 'left'; g.fillText('AST MEDIA', X + 24, Y + 44);
        ['À la une', 'Guinée', 'Afrique', 'Tech', 'Sport'].forEach((r, i) => { police(14, 600); g.fillStyle = i ? COUL.doux : COUL.encre; g.fillText(r, X + 220 + i * 90, Y + 40); });
        rr(X + 24, Y + 70, 430, 250, 10);
        const gr = g.createLinearGradient(X + 24, Y + 70, X + 454, Y + 320); gr.addColorStop(0, 'rgba(255,107,74,0.5)'); gr.addColorStop(1, 'rgba(139,123,255,0.4)');
        g.fillStyle = gr; g.fill();
        ligneTexte(X + 44, Y + 270, 330, .8); ligneTexte(X + 44, Y + 290, 250, .5);
        for (let i = 0; i < 3; i++) {
          if (borne(p * 2 - i * .2) <= 0) continue;
          const yy = Y + 70 + i * 86;
          rr(X + 474, yy, 100, 72, 8); g.fillStyle = `rgba(255,255,255,${.08 + i * .03})`; g.fill();
          ligneTexte(X + 590, yy + 14, 130, .5); ligneTexte(X + 590, yy + 34, 100, .3);
        }
      });
    } },
  { id: 'om', nom: 'Orange Money → WhatsApp', desc: ['Notifications de paiement', 'envoyées aux commerçants'], k: COUL.wa,
    maquette(x, y, w, h, p, t) {
      // paiement → notification
      const ox = x + 70, oy = y + h / 2 - 20;
      rr(ox - 60, oy - 60, 120, 120, 26); g.fillStyle = COUL.orange; g.fill();
      police(18, 800); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('Orange', ox, oy - 4); g.fillText('Money', ox, oy + 20);
      const q = (t * .7) % 1;
      g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 3; g.setLineDash([10, 10]); g.lineDashOffset = -t * 40;
      g.beginPath(); g.moveTo(ox + 80, oy); g.lineTo(x + w - 300, oy); g.stroke(); g.setLineDash([]);
      lueur(lin(ox + 80, x + w - 300, q), oy, 26, COUL.or, .9);
      telephone(x + w - 270, y - 20, 250, 470, (X, Y, Wd) => {
        g.fillStyle = '#075e54'; g.fillRect(X, Y, Wd, 64);
        police(16, 700); g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText('Notifications paiement', X + 14, Y + 40);
        g.fillStyle = '#0b141a'; g.fillRect(X, Y + 64, Wd, 500);
        [['Paiement reçu', '150 000 GNF', .2], ['Paiement reçu', '75 000 GNF', .5], ['Paiement reçu', '320 000 GNF', .8]].forEach(([l1, l2, f], i) => {
          const pp = sortie5(prog(p, f - .15, f));
          if (pp <= 0) return;
          g.save(); g.globalAlpha *= pp;
          const yy = Y + 90 + i * 110 + (1 - pp) * 20;
          rr(X + 16, yy, Wd - 40, 92, 12); g.fillStyle = '#005c4b'; g.fill();
          police(14, 700); g.fillStyle = COUL.wa; g.fillText('✓ ' + l1, X + 30, yy + 28);
          police(22, 800); g.fillStyle = '#fff'; g.fillText(l2, X + 30, yy + 60);
          police(11, 500); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillText('Orange Money', X + 30, yy + 80);
          g.restore();
        });
      });
    } },
];


const COUCHES = [4, 6, 6, 3];
function reseau(t, debut, x0, x1, cy, haut) {
  const noeuds = COUCHES.map((n, ci) => Array.from({ length: n }, (_, j) => ({ x: lin(x0, x1, ci / (COUCHES.length - 1)), y: cy - haut / 2 + (j + .5) * haut / n })));
  const pres = prog(t, debut, debut + 2.5);
  for (let ci = 0; ci < noeuds.length - 1; ci++) {
    const pc = sortie3(borne(pres * 3 - ci));
    noeuds[ci].forEach((A, ia) => noeuds[ci + 1].forEach((B, ib) => {
      g.strokeStyle = `rgba(139,123,255,${.16 * pc})`; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(lin(A.x, B.x, pc), lin(A.y, B.y, pc)); g.stroke();
      if (pres >= 1) {
        const gr2 = ci * 100 + ia * 10 + ib, per = 1.6 + alea(gr2) * 1.4;
        const q = ((t + alea(gr2 + 5) * per) % per) / per;
        if (alea(gr2 + 9) > .55) { lueur(lin(A.x, B.x, q), lin(A.y, B.y, q), 14, ci % 2 ? COUL.cyan : COUL.violet, .8); }
      }
    }));
  }
  noeuds.forEach((couche, ci) => couche.forEach((N, j) => {
    const p = Math.max(0, rebond(prog(t, debut + ci * .3 + j * .05, debut + .6 + ci * .3 + j * .05)));
    const batt = .5 + .5 * Math.sin(t * 3 + ci + j * 1.7);
    const k = ci === COUCHES.length - 1 ? COUL.or : ci === 0 ? COUL.cyan : COUL.violet;
    lueur(N.x, N.y, 44, k, .22 + .2 * batt);
    cercle(N.x, N.y, 14 * p, COUL.sombre); anneau(N.x, N.y, 14 * p, k, 3); cercle(N.x, N.y, 4.5 * p * (.6 + .4 * batt), k);
  }));
}

function carteESP(x, y, t, p) {
  g.save(); g.globalAlpha *= p;
  rr(x, y, 260, 150, 12); g.fillStyle = '#103e2e'; g.fill(); g.strokeStyle = '#1f6b50'; g.lineWidth = 2; g.stroke();
  rr(x + 80, y + 35, 100, 80, 6); g.fillStyle = '#1b1f27'; g.fill();
  police(16, 800); g.fillStyle = '#c9cfdc'; g.textAlign = 'center'; g.fillText('ESP32', x + 130, y + 82);
  for (let i = 0; i < 12; i++) { g.fillStyle = '#d4af37'; g.fillRect(x + 16 + i * 20, y + 8, 8, 12); g.fillRect(x + 16 + i * 20, y + 130, 8, 12); }
  cercle(x + 230, y + 40, 6, Math.sin(t * 6) > 0 ? COUL.cyan : '#123');
  // ondes Wi-Fi
  for (let i = 1; i <= 3; i++) {
    const q = (t * .8 + i / 3) % 1;
    g.save(); g.globalAlpha *= (1 - q) * .8; g.strokeStyle = COUL.cyan; g.lineWidth = 3;
    g.beginPath(); g.arc(x + 130, y - 10, 20 + q * 70, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); g.restore();
  }
  g.restore();
}
function panneau(x, y, p) {
  g.save(); g.globalAlpha *= p;
  g.translate(x, y); g.transform(1, 0, -.3, 1, 0, 0);
  rr(0, 0, 200, 120, 6); g.fillStyle = '#16305e'; g.fill();
  g.strokeStyle = 'rgba(160,200,255,0.5)'; g.lineWidth = 1.5;
  for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * 50, 0); g.lineTo(i * 50, 120); g.stroke(); }
  for (let j = 1; j < 3; j++) { g.beginPath(); g.moveTo(0, j * 40); g.lineTo(200, j * 40); g.stroke(); }
  g.restore();
}


function logoFata(x, y, h, p = 1) {
  const img = MEDIAS['logo-fata'];
  g.save(); g.globalAlpha *= p;
  if (img) {
    const w = h * img.width / img.height;
    rr(x - w / 2, y - h / 2, w, h, h * .14); g.save(); g.clip(); g.drawImage(img, x - w / 2, y - h / 2, w, h); g.restore();
  } else {
    police(h * .6, 900); const w = g.measureText('{fata}').width + h * .5;
    rr(x - w / 2, y - h / 2, w, h, h * .14); g.fillStyle = COUL.fata; g.fill();
    g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('{fata}', x, y + 2); g.textBaseline = 'alphabetic';
  }
  g.restore();
}
function logoTexte(img, titre, sous, x, y, k, p) {
  g.save(); g.globalAlpha *= p;
  if (img) { const h = 120, w = h * img.width / img.height; g.drawImage(img, x - w / 2, y - h / 2 - 20, w, h); }
  else {
    police(64, 900); const w = g.measureText(titre).width;
    g.fillStyle = k; g.fillRect(x - w / 2, y + 22, w, 5);
    g.fillStyle = COUL.encre; g.textAlign = 'center'; g.fillText(titre, x, y);
    police(24, 600); g.fillStyle = k; g.fillText(sous, x, y + 70);
  }
  g.restore();
}


function portrait(t, cx, cy, r, p) {
  if (p <= 0) return;
  g.save(); g.globalAlpha *= p;
  lueur(cx, cy, r * 1.8, COUL.or, .35);
  anneau(cx, cy, r + 12, COUL.or, 3, sortie3(p));
  const z = 1 + (t % 60) * .002;
  if (!photo(MEDIAS['portrait-joel'], cx - r, cy - r, r * 2, r * 2, { rond: true, foyer: [.5, .5], zoom: z })) {
    cercle(cx, cy, r, COUL.sombre); police(r * .6, 900); g.fillStyle = COUL.or; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('JK', cx, cy); g.textBaseline = 'alphabetic';
  }
  g.restore();
}


// Volet lumineux entre les scènes.
function transitions(t) {
  SCENES.slice(1).forEach(s => {
    const p = prog(t, s.a - .45, s.a + .45);
    if (p <= 0 || p >= 1) return;
    const x = lin(-300, W + 300, entreeSortie(p));
    g.save(); g.globalCompositeOperation = 'lighter';
    const d = g.createLinearGradient(x - 220, 0, x + 220, 0);
    d.addColorStop(0, 'rgba(255,255,255,0)'); d.addColorStop(.5, 'rgba(245,176,65,0.14)'); d.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = d; g.fillRect(x - 220, 0, 440, H);
    g.fillStyle = 'rgba(255,220,160,0.45)'; g.fillRect(x, 0, 2, H);
    g.restore();
  });
}

function barre(t) {
  g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, H - 4, W, 4);
  g.fillStyle = teinte(t); g.fillRect(0, H - 4, W * (t / DUREE), 4);
}

// Dessine l'image à l'instant t avec les scènes de la page, et prépare la
// lecture en temps réel (avec la voix) quand la page est ouverte normalement.
// « habillage » remplace le fond et les couches du dessus (version verticale).
function demarrer(scenes, voix, habillage = {}) {
  const dessous = habillage.dessous || [fond];
  const dessus = habillage.dessus || [transitions, vignette, sousTitres, barre];
  function rendre(t) {
    g.save();
    g.globalAlpha = 1;
    dessous.forEach(f => f(t));
    scenes.forEach(sc => sc(t));
    dessus.forEach(f => f(t));
    const fo = prog(t, DUREE - 1.2, DUREE);
    if (fo > 0) { g.fillStyle = `rgba(0,0,0,${fo})`; g.fillRect(0, 0, W, H); }
    g.restore();
  }
  window.rendre = rendre;
  window.DUREE = DUREE;
  window.pret = Promise.all([document.fonts.ready, ...CHARGEMENTS]);
  if (location.search.includes('rendu')) return;
  const audio = new Audio(voix);
  let debut = null;
  document.body.addEventListener('click', () => { audio.currentTime = 0; audio.play(); debut = performance.now(); });
  (function boucle() {
    const t = debut === null ? 0.001 : (performance.now() - debut) / 1000;
    rendre(Math.min(t, DUREE));
    if (debut === null) {
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, W, H);
      police(40, 600); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('Cliquer pour lancer la présentation', W / 2, H / 2);
    }
    requestAnimationFrame(boucle);
  })();
}
