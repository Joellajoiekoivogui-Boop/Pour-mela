// Parcours du jury, de bout en bout, dans Chromium (Playwright).
// Usage : npm run build && npm start, puis BASE_URL=http://localhost:3000 node scripts/e2e-jury.cjs
const { chromium } = require("playwright");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = process.env.SCREENSHOTS_DIR || require("node:os").tmpdir();
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));
  const step = (s) => console.log("✔", s);

  await page.goto(BASE + "/");
  await page.screenshot({ path: OUT + "/01-accueil.png", fullPage: false });
  step("1. Accueil");

  await page.getByRole("link", { name: /Explorer l'Afrique/ }).first().click();
  await page.waitForURL("**/explorer");
  await page.waitForSelector(".leaflet-interactive", { timeout: 15000 });
  await page.screenshot({ path: OUT + "/02-explorer.png" });
  step("2. Explorer l'Afrique (carte chargée : " + (await page.locator(".leaflet-interactive").count()) + " formes)");

  // 3. Clic sur la Guinée sur la carte : on cherche la forme dont le tooltip est Guinée.
  const shapes = page.locator("path.leaflet-interactive");
  const n = await shapes.count();
  let clicked = false;
  for (let i = 0; i < n && !clicked; i++) {
    const s = shapes.nth(i);
    const box = await s.boundingBox();
    if (!box || box.width < 8) continue;
    await s.hover({ force: true });
    const tip = (await page.locator(".leaflet-tooltip").allTextContents()).pop() ?? "";
    if (tip && tip.startsWith("Guinée —")) {
      await s.click({ force: true });
      clicked = true;
    }
  }
  if (!clicked) throw new Error("Guinée introuvable sur la carte");
  await page.waitForURL("**/explorer/gn");
  step("3. Guinée sélectionnée sur la carte");

  // Badge Petit explorateur
  await page.getByRole("dialog").getByText("Petit explorateur").waitFor({ timeout: 5000 });
  await page.screenshot({ path: OUT + "/03-badge.png" });
  step("   Badge « Petit explorateur » affiché");
  await page.getByRole("button", { name: "Continuer" }).click();

  await page.getByRole("heading", { name: "Histoire" }).waitFor();
  await page.screenshot({ path: OUT + "/04-fiche-guinee.png", fullPage: true });
  step("4. Information sur l'histoire de la Guinée");

  await page.getByRole("link", { name: /1958 : le « non »/ }).first().click();
  await page.waitForURL("**/bibliotheque/independance-guinee-1958");
  await page.getByRole("button", { name: /^colonie$/i }).first().click();
  await page.getByRole("tooltip").waitFor();
  await page.screenshot({ path: OUT + "/05-article.png" });
  step("5. Lecture de l'article (glossaire OK)");

  await page.getByRole("button", { name: /J'ai fini de lire/ }).click();
  for (let i = 0; i < 3; i++) {
    const answer = ["1958", "Non", "Ahmed Sékou Touré"][i];
    await page.getByRole("button", { name: new RegExp(answer) }).first().click();
    await page.getByRole("button", { name: /Question suivante|Voir mon score/ }).click();
  }
  await page.getByText("3 / 3").waitFor();
  step("6. Quiz réussi 3/3");
  await page.getByRole("dialog").getByText("Premier quiz réussi").waitFor();
  await page.screenshot({ path: OUT + "/06-badge-quiz.png" });
  step("7. Badge « Premier quiz réussi » gagné");
  await page.getByRole("button", { name: "Continuer" }).click();

  await page.goto(BASE + "/assistant");
  await page.waitForTimeout(1000);
  await page.getByPlaceholder("Écris ta question…").fill("Qu'est-ce que le Fouta-Djalon ?");
  await page.getByRole("button", { name: "Envoyer" }).click();
  await page.getByText(/château d'eau/).first().waitFor();
  await page.screenshot({ path: OUT + "/07-lumo.png" });
  step("8. Question posée à LUMO, réponse reçue");

  await page.goto(BASE + "/passeport");
  await page.getByText("Petit explorateur").first().waitFor();
  await page.screenshot({ path: OUT + "/08-passeport.png", fullPage: true });
  const xp = await page.locator("header a[href='/dashboard']").textContent();
  step("   Passeport à jour, " + xp.trim());

  // Mobile : quelques pages clés
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  m.on("pageerror", (e) => errors.push("mobile pageerror: " + e.message));
  for (const [p, f] of [["/", "m-accueil"], ["/guinee", "m-guinee"], ["/bibliotheque", "m-biblio"], ["/histoires/le-secret-de-la-source", "m-histoire"], ["/challenges", "m-defis"], ["/dashboard", "m-dashboard"]]) {
    await m.goto(BASE + p);
    await m.waitForTimeout(400);
    const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 1) errors.push(`débordement horizontal ${overflow}px sur ${p}`);
    await m.screenshot({ path: `${OUT}/${f}.png` });
  }
  step("Mobile : 6 pages capturées");

  // Toutes les pages répondent
  for (const p of ["/univers", "/univers/sciences", "/histoires", "/challenges/quiz-drapeaux", "/parents", "/admin", "/connexion", "/a-propos", "/hors-ligne", "/explorer/gh", "/bibliotheque/os-ishango", "/page-inexistante"]) {
    const r = await page.goto(BASE + p);
    console.log("  ", r.status(), p);
  }
  const real = errors.filter((e) => !e.includes("404"));
  console.log(real.length ? "ERREURS :\n" + real.join("\n") : "Aucune erreur JavaScript.");
  if (real.length) process.exitCode = 1;
  await browser.close();
})().catch((e) => {
  console.error("ÉCHEC", e);
  process.exit(1);
});
