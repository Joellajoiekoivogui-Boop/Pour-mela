// Test de fumée : chaque page publique répond, les espaces protégés redirigent
// vers /connexion, aucune page ne déborde horizontalement sur mobile (390 px).
// Usage : BASE_URL=http://localhost:3000 node scripts/smoke.cjs
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const PUBLIC = ["/", "/a-propos", "/comment-ca-marche", "/mentors", "/domaines", "/devenir-mentor", "/conditions", "/confidentialite", "/connexion", "/inscription", "/inscription?profil=mentor", "/mot-de-passe-oublie"];
const PROTECTED = ["/espace", "/mentore", "/mentore/trouver", "/mentor", "/mentor/demandes", "/admin", "/admin/utilisateurs"];

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  const fail = (msg) => { failures++; console.log("✘ " + msg); };

  for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const path of PUBLIC) {
      const res = await page.goto(BASE + path, { waitUntil: "networkidle" });
      if (!res || res.status() !== 200) fail(`${path} → HTTP ${res && res.status()}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 1) fail(`${path} déborde de ${overflow}px à ${viewport.width}px`);
      const h1 = await page.locator("h1").count();
      if (h1 < 1) fail(`${path} : aucun titre h1`);
    }
    if (errors.length) fail(`erreurs JavaScript : ${errors.join(" | ")}`);
    await page.close();
  }

  const page = await browser.newPage();
  for (const path of PROTECTED) {
    await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
    if (!new URL(page.url()).pathname.startsWith("/connexion")) fail(`${path} accessible sans connexion (${page.url()})`);
  }

  // Liens internes de la page d'accueil : aucun ne doit mener à une 404.
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const hrefs = [...new Set(await page.$$eval("a[href^='/']", (as) => as.map((a) => a.getAttribute("href"))))];
  for (const href of hrefs) {
    const res = await page.request.get(BASE + href, { maxRedirects: 5 });
    if (res.status() >= 400) fail(`lien ${href} → HTTP ${res.status()}`);
  }

  // Validation du formulaire d'inscription côté client.
  await page.goto(BASE + "/inscription", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  const alerts = await page.locator("[role=alert]").allTextContents();
  if (!alerts.some((t) => t.includes("Choisissez votre profil"))) fail("validation de l'inscription absente");

  await browser.close();
  console.log(failures === 0 ? `✔ Test de fumée OK (${PUBLIC.length} pages × 2 tailles, ${PROTECTED.length} routes protégées, ${hrefs.length} liens)` : `${failures} échec(s)`);
  process.exit(failures === 0 ? 0 : 1);
})();
