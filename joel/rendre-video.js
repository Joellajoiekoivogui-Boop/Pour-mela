#!/usr/bin/env node
// Rend le film de Joël en vidéo MP4 (image + son), image par image, avec
// Chromium (Playwright) et ffmpeg.
//
//   node rendre-video.js                       → 90 s, 16:9, 1080p
//   node rendre-video.js --format portrait     → 90 s, 9:16 (TikTok, Reels, Status…)
//   node rendre-video.js --version courte      → 15 s
//   node rendre-video.js --4k                  → 3840×2160 (ou 2160×3840)
//   node rendre-video.js --tout                → les quatre vidéos 1080p
//
// Prérequis : Node 18+, ffmpeg, et Playwright (`npm i -D playwright` puis
// `npx playwright install chromium`).
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const BandeSon = require('./js/bande-son.js');

const ici = __dirname;
const args = process.argv.slice(2);
const option = (nom, defaut) => {
  const i = args.indexOf('--' + nom);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : defaut;
};
const drapeau = (nom) => args.includes('--' + nom);

function chargerPlaywright() {
  try { return require('playwright'); } catch (e) { /* essai suivant */ }
  try { return require('playwright-core'); } catch (e) { /* essai suivant */ }
  const global = require('child_process').execSync('npm root -g').toString().trim();
  return require(path.join(global, 'playwright'));
}

// Petit serveur statique (les polices et les photos se chargent proprement).
function servir() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
  const serveur = http.createServer((req, res) => {
    const chemin = path.join(ici, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!chemin.startsWith(ici) || !fs.existsSync(chemin) || fs.statSync(chemin).isDirectory()) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(chemin).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(chemin).pipe(res);
  });
  return new Promise((ok) => serveur.listen(0, '127.0.0.1', () => ok(serveur)));
}

async function rendre(navigateur, port, { version, format, k4, fps, sortie }) {
  const paysage = format !== 'portrait';
  const base = k4 ? [3840, 2160] : [1920, 1080];
  const [l, h] = paysage ? base : [base[1], base[0]];

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'joel-'));
  const wav = path.join(temp, 'son.wav');
  fs.writeFileSync(wav, Buffer.from(BandeSon.enWav(BandeSon.generer(version, 48000))));

  const page = await navigateur.newPage({ viewport: { width: l, height: h }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('Erreur dans la page :', e.message));
  await page.goto(`http://127.0.0.1:${port}/index.html?capture=1&version=${version}`);
  const duree = await page.evaluate(() => window.__pret);
  const total = Math.round(duree * fps);

  const ffmpeg = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', k4 ? '20' : '19', '-pix_fmt', 'yuv420p',
    '-profile:v', 'high', '-tune', 'film',
    '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-movflags', '+faststart', sortie,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const fini = new Promise((ok, ko) => ffmpeg.on('close', (c) => (c === 0 ? ok() : ko(new Error('ffmpeg a échoué (' + c + ')')))));

  const debut = Date.now();
  for (let i = 0; i < total; i++) {
    await page.evaluate((t) => window.__film.dessiner(t), i / fps);
    const image = await page.screenshot({ type: 'jpeg', quality: 96 });
    if (!ffmpeg.stdin.write(image)) await new Promise((ok) => ffmpeg.stdin.once('drain', ok));
    if (i % 30 === 0 || i === total - 1) {
      const ecoule = (Date.now() - debut) / 1000;
      process.stdout.write(`\r  ${path.basename(sortie)} : ${i + 1}/${total} images · reste ~${Math.round((ecoule / (i + 1)) * (total - i - 1))} s   `);
    }
  }
  ffmpeg.stdin.end();
  await fini;
  await page.close();
  fs.rmSync(temp, { recursive: true, force: true });
  console.log(`\n  ✓ ${sortie}`);
}

(async () => {
  const fps = Number(option('fps', 30));
  const k4 = drapeau('4k');
  const dossier = path.join(ici, 'videos');
  fs.mkdirSync(dossier, { recursive: true });
  const nom = (v, f) => path.join(dossier, (v === 'courte' ? 'joel-15s' : v === 'pub' ? 'joel-pub' : v === 'fete' ? 'joel-fete' : 'joel-anniversaire') + '-' + (f === 'portrait' ? '9x16' : '16x9') + (k4 ? '-4k' : '') + '.mp4');
  const travaux = drapeau('tout')
    ? [['longue', 'paysage'], ['longue', 'portrait'], ['courte', 'paysage'], ['courte', 'portrait']]
    : [[option('version', 'longue'), option('format', 'paysage')]];

  const { chromium } = chargerPlaywright();
  const serveur = await servir();
  const navigateur = await chromium.launch({ args: ['--font-render-hinting=none', '--force-color-profile=srgb'] });
  try {
    for (const [version, format] of travaux) {
      await rendre(navigateur, serveur.address().port, { version, format, k4, fps, sortie: option('sortie', nom(version, format)) });
    }
  } finally {
    await navigateur.close();
    serveur.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
