// Fabrique la vidéo : ouvre animation.html dans Chromium, dessine chaque
// image avec rendre(t) et l'envoie à ffmpeg, puis ajoute la musique.
//
//   node video/rendu.js                  → video/joel-koivogui-motion.mp4
//   node video/rendu.js --apercu 5,20,40 → images PNG de ces instants
'use strict';

const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ici = __dirname;
const IPS = 30;
const args = process.argv.slice(2);
const apercu = args.includes('--apercu') ? args[args.indexOf('--apercu') + 1].split(',').map(Number) : null;

(async () => {
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file://' + path.join(ici, 'animation.html') + '?rendu');
  await page.evaluate(async () => {
    await document.fonts.load('italic 40px Cormorant');
    await document.fonts.load('800 40px Inter');
    await window.policesPretes;
  });
  const duree = await page.evaluate(() => window.DUREE);
  const canvas = await page.$('canvas');

  if (apercu) {
    fs.mkdirSync(path.join(ici, 'apercu'), { recursive: true });
    for (const t of apercu) {
      await page.evaluate(t => window.rendre(t), t);
      await canvas.screenshot({ path: path.join(ici, 'apercu', `t${String(t).padStart(5, '0')}.png`) });
    }
    await navigateur.close();
    return;
  }

  const muet = path.join(ici, 'muet.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(IPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', muet], { stdio: ['pipe', 'inherit', 'inherit'] });

  const total = Math.round(duree * IPS);
  for (let i = 0; i < total; i++) {
    const t = i / IPS;
    const donnees = await page.evaluate(t => { window.rendre(t); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, t);
    const image = Buffer.from(donnees.split(',')[1], 'base64');
    if (!ff.stdin.write(image)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`image ${i}/${total}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await navigateur.close();

  // musique
  const musique = path.join(ici, 'musique.wav');
  execFileSync('python3', [path.join(ici, 'musique.py'), musique, String(duree)], { stdio: 'inherit' });
  const finale = path.join(ici, 'joel-koivogui-motion.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', muet, '-i', musique, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', finale], { stdio: 'inherit' });
  fs.rmSync(muet); fs.rmSync(musique);
  console.log('Vidéo prête : ' + finale);
})();
