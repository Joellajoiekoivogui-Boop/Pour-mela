// Construction sur Vercel (lancée automatiquement, voir vercel.json).
// Copie le site dans public/ et rend absolue l'adresse de l'image d'aperçu
// (og:image) : WhatsApp et Facebook l'exigent pour afficher l'image quand
// on partage le lien. En dehors de Vercel, ce fichier ne sert pas.
'use strict';

const fs = require('fs');
const path = require('path');

const { execSync } = require('child_process');

const ici = __dirname;
const sortie = path.join(ici, 'public');

// Le même dépôt sert deux projets Vercel : « pour-mela » (ce site) et
// « pour-mela-joel » (le site de Joël, dossier joel/). Le projet est reconnu
// à son identifiant ou à son adresse, sans réglage à faire chez Vercel.
const estJoel =
  process.env.VERCEL_PROJECT_ID === 'prj_UnuETpLMldWmGXwQcIfXDbmxLGtT' ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL || '').startsWith('pour-mela-joel');

// « node preparer-vercel.js --ignorer » : étape « Ignored Build Step » de
// Vercel. Code 0 = rien à reconstruire (seul l'autre site a changé).
if (process.argv.includes('--ignorer')) {
  const chemins = estJoel
    ? ['joel', 'vercel.json', 'preparer-vercel.js']
    : ['index.html', 'personnaliser.html', 'config.js', 'apercu.jpg', 'icone.png', 'css', 'js', 'fonts', 'medias'];
  try {
    execSync('git diff --quiet HEAD^ HEAD -- ' + chemins.join(' '), { cwd: ici, stdio: 'inherit' });
    console.log('Rien de changé pour ce site : construction ignorée.');
    process.exit(0);
  } catch {
    process.exit(1);
  }
}

if (estJoel) {
  const dossier = path.join(ici, 'joel');
  execSync('npm ci && npm run build', { cwd: dossier, stdio: 'inherit' });
  fs.rmSync(sortie, { recursive: true, force: true });
  fs.cpSync(path.join(dossier, 'out'), sortie, { recursive: true });
  console.log('Site de Joël prêt dans public/');
  process.exit(0);
}
const aCopier = ['index.html', 'personnaliser.html', 'config.js', 'apercu.jpg', 'icone.png', 'css', 'js', 'fonts', 'medias'];

fs.rmSync(sortie, { recursive: true, force: true });
fs.mkdirSync(sortie);
for (const nom of aCopier) {
  const source = path.join(ici, nom);
  if (fs.existsSync(source)) fs.cpSync(source, path.join(sortie, nom), { recursive: true });
}

const domaine = process.env.VERCEL_PROJECT_PRODUCTION_URL;
if (domaine) {
  const page = path.join(sortie, 'index.html');
  const html = fs.readFileSync(page, 'utf8');
  fs.writeFileSync(page, html.replace('content="apercu.jpg"', 'content="https://' + domaine + '/apercu.jpg"'));
  console.log('Image d’aperçu : https://' + domaine + '/apercu.jpg');
}
console.log('Site prêt dans public/');
