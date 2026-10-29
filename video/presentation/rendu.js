// Fabrique la vidéo de présentation : dessine chaque image de
// presentation.html dans Chromium, l'envoie à ffmpeg, puis mixe la voix off
// (sortie/voix.wav, faite par voix.py) avec la musique, baissée sous la voix.
//
//   node video/presentation/rendu.js                       → sortie/presentation-joel-koivogui.mp4
//   node video/presentation/rendu.js --apercu nom+1,sgs+3  → images PNG (instant = segment + secondes)
'use strict';

const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ici = __dirname;
const sortie = path.join(ici, 'sortie');
const IPS = 30;
const args = process.argv.slice(2);
const apercu = args.includes('--apercu') ? args[args.indexOf('--apercu') + 1].split(',') : null;

(async () => {
  // Sans cette option, les photos locales « contaminent » le canvas et toDataURL échoue.
  const navigateur = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await navigateur.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => { console.error('Erreur dans la page :', e.message); process.exitCode = 1; });
  await page.goto('file://' + path.join(ici, 'presentation.html') + '?rendu');
  await page.evaluate(async () => {
    await document.fonts.load('italic 40px Cormorant');
    await document.fonts.load('800 40px Inter');
    await window.pret;
  });
  const duree = await page.evaluate(() => window.DUREE);
  fs.mkdirSync(sortie, { recursive: true });

  if (apercu) {
    const dossier = path.join(sortie, 'apercu');
    fs.mkdirSync(dossier, { recursive: true });
    for (const repere of apercu) {
      const [id, dec] = repere.split('+');
      const t = await page.evaluate(([id, dec]) => {
        const s = window.TIMELINE.segments.find(s => s.id === id);
        return (s ? s.debut : Number(id)) + Number(dec || 0);
      }, [id, dec]);
      await page.evaluate(t => window.rendre(t), t);
      await (await page.$('canvas')).screenshot({ path: path.join(dossier, repere.replace(/[^\w.+-]/g, '_') + '.png') });
    }
    await navigateur.close();
    return;
  }

  const muet = path.join(sortie, 'muet.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(IPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p', muet], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.round(duree * IPS);
  for (let i = 0; i < total; i++) {
    const donnees = await page.evaluate(t => { window.rendre(t); return document.getElementById('c').toDataURL('image/jpeg', 0.93); }, i / IPS);
    if (!ff.stdin.write(Buffer.from(donnees.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 900 === 0) console.log(`image ${i}/${total}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await navigateur.close();

  // musique baissée automatiquement quand la voix parle
  const musique = path.join(sortie, 'musique.wav');
  execFileSync('python3', [path.join(ici, 'musique.py'), musique, String(duree)], { stdio: 'inherit' });
  const finale = path.join(sortie, 'presentation-joel-koivogui.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', muet, '-i', path.join(sortie, 'voix.wav'), '-i', musique,
    '-filter_complex',
    '[1:a]aformat=channel_layouts=stereo,volume=1.0,asplit=2[voix][cle];' +
    '[2:a]volume=0.5[mus];' +
    '[mus][cle]sidechaincompress=threshold=0.02:ratio=6:attack=80:release=900[musb];' +
    '[voix][musb]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]',
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', finale], { stdio: 'inherit' });
  fs.rmSync(muet); fs.rmSync(musique);
  console.log('Vidéo prête : ' + finale);
})();
