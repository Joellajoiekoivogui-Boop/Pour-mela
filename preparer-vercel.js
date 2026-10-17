// Construction sur Vercel (lancée automatiquement, voir vercel.json).
// En dehors de Vercel, ce fichier ne sert pas.
'use strict';

const fs = require('fs');
const path = require('path');

const { execSync } = require('child_process');

const ici = __dirname;
const sortie = path.join(ici, 'public');

// Le même dépôt sert deux projets Vercel : « pour-mela » (une page vide,
// le site de Mela ayant été retiré) et « pour-mela-joel » (le site de Joël,
// dossier joel/). Le projet est reconnu à son identifiant ou à son adresse,
// sans réglage à faire chez Vercel.
const estJoel =
  process.env.VERCEL_PROJECT_ID === 'prj_UnuETpLMldWmGXwQcIfXDbmxLGtT' ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL || '').startsWith('pour-mela-joel');

// « node preparer-vercel.js --ignorer » : étape « Ignored Build Step » de
// Vercel. Code 0 = rien à reconstruire (seul l'autre site a changé).
if (process.argv.includes('--ignorer')) {
  const chemins = estJoel
    ? ['joel', 'vercel.json', 'preparer-vercel.js']
    : ['preparer-vercel.js'];
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
// Le site de Mela a été retiré : une page vide remplace l'ancien déploiement.
fs.rmSync(sortie, { recursive: true, force: true });
fs.mkdirSync(sortie);
fs.writeFileSync(
  path.join(sortie, 'index.html'),
  '<!doctype html>\n<html lang="fr"><head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title></title></head><body></body></html>\n'
);
console.log('Page vide prête dans public/');
