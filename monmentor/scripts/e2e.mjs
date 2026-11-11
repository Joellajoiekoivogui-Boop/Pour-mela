// Test de bout en bout des parcours principaux, sur un serveur déjà lancé.
//   npm run build && npm run demo:reset && npm start   (puis, dans un autre terminal)
//   BASE_URL=http://localhost:3000 npm run test:e2e
// Prérequis : DEMO_MODE=true (comptes de démonstration) et Playwright installé.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS_DIR;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const failures = [];
let passed = 0;
async function step(name, fn) {
  try { await fn(); passed++; console.log(`✓ ${name}`); }
  catch (e) { failures.push(name); console.log(`✗ ${name}\n    ${String(e?.message ?? e).split("\n")[0]}`); }
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

const browser = await chromium.launch();
async function newPage(opts = {}) {
  const ctx = await browser.newContext({ baseURL: BASE, ...opts });
  const page = await ctx.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  page.on("response", (r) => { if (r.status() >= 500) page.errors.push(`${r.status()} ${r.url()}`); });
  return page;
}
async function demoLogin(page, name) {
  await page.goto("/connexion");
  await page.getByRole("button", { name: new RegExp(`^${name}`) }).click();
  await page.waitForURL(/\/(accueil|admin)/);
}
const shot = (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });

// --- Public ---
const visitor = await newPage();
await step("les pages publiques s'affichent sans erreur", async () => {
  for (const p of ["/", "/mentors", "/programmes", "/programmes/reussir-campus-france", "/devenir-mentor", "/charte", "/confidentialite", "/conditions", "/mentions-legales", "/contact"]) {
    const res = await visitor.goto(p);
    expect(res.status() === 200, `${p} → ${res.status()}`);
  }
  expect(visitor.errors.length === 0, visitor.errors.join(" | "));
  await visitor.goto("/"); await shot(visitor, "accueil");
});
await step("le titre principal parle aux jeunes", async () => {
  await visitor.goto("/");
  expect((await visitor.locator("h1").innerText()).includes("vos ambitions"), "titre inattendu");
});
await step("le contenu de l'accueil est visible sans défilement (pas d'opacité nulle)", async () => {
  const hidden = await visitor.evaluate(() => [...document.querySelectorAll("main section")].filter((s) => getComputedStyle(s).opacity === "0").length);
  expect(hidden === 0, `${hidden} section(s) invisibles`);
});
await step("l'annuaire est public et n'affiche que des mentors vérifiés", async () => {
  await visitor.goto("/mentors");
  expect(await visitor.getByText("Fatoumata Bangoura").count() > 0, "mentor vérifié absent");
  expect(await visitor.getByText("Lansana Doumbouya").count() === 0, "mentor non vérifié affiché");
});
await step("la fiche d'un mentor s'ouvre sans compte", async () => {
  await visitor.goto("/mentors");
  await visitor.getByRole("link", { name: "Fatoumata Bangoura" }).first().click();
  await visitor.waitForURL(/\/mentors\/.+/);
  expect(await visitor.getByRole("heading", { name: "Fatoumata Bangoura" }).isVisible(), "titre absent");
  expect(await visitor.getByText("Profil d'impact").isVisible(), "impact absent");
  await shot(visitor, "fiche-mentor");
});
await step("recommandation : la fondatrice agroalimentaire passe devant l'éditrice", async () => {
  await visitor.goto(`/recommandation?besoin=${encodeURIComponent("Je veux créer mon entreprise de transformation agricole")}`);
  const first = await visitor.locator("article h3").first().innerText();
  expect(first.includes("Fatoumata"), `premier : ${first}`);
  await shot(visitor, "recommandation");
});
await step("robots.txt, plan du site et aperçu Open Graph", async () => {
  expect((await (await fetch(`${BASE}/robots.txt`)).text()).includes("Sitemap"), "robots.txt");
  expect((await (await fetch(`${BASE}/sitemap.xml`)).text()).includes("/mentors/"), "sitemap");
  await visitor.goto("/");
  expect(await visitor.locator('meta[property="og:image"]').count() > 0, "og:image absente");
});
await step("en-têtes de sécurité présents", async () => {
  const h = (await fetch(`${BASE}/`)).headers;
  for (const k of ["content-security-policy", "strict-transport-security", "x-frame-options", "referrer-policy"]) expect(h.get(k), `${k} absent`);
  expect(!h.get("x-powered-by"), "x-powered-by exposé");
});
await step("page 404 avec un lien vers l'accueil public", async () => {
  const res = await visitor.goto("/nexiste-pas");
  expect(res.status() === 404, "statut");
  expect(await visitor.getByRole("link", { name: "Retourner à l'accueil" }).getAttribute("href") === "/", "lien 404");
});

// --- Mentorée ---
const mariama = await newPage();
await step("connexion de démonstration (mentorée) et tableau de bord", async () => {
  await demoLogin(mariama, "Mariama");
  expect(await mariama.getByRole("heading", { name: /Bonjour Mariama/ }).isVisible(), "tableau de bord");
  await shot(mariama, "tableau-de-bord");
});
await step("une séance passée n'est plus « à venir »", async () => {
  await mariama.goto("/seances");
  expect(await mariama.getByText("Revue du README").count() === 0, "séance d'hier listée à venir");
  await mariama.goto("/seances?onglet=passees");
  expect(await mariama.getByText("Revue du README").count() > 0, "séance d'hier absente des passées");
});
await step("la page d'une séance s'ouvre et permet de donner un avis", async () => {
  await mariama.getByText("Revue du README").click();
  await mariama.waitForURL(/\/seances\/.+/);
  await mariama.locator("label", { hasText: /^5$/ }).click();
  await mariama.getByRole("button", { name: "Envoyer mon avis" }).click();
  await mariama.waitForURL(/ok=avis/);
});
await step("cocher une étape d'objectif", async () => {
  await mariama.goto("/objectifs");
  const before = await mariama.locator("button[aria-pressed='true']").count();
  await mariama.locator("button[aria-pressed='false']").first().click();
  await mariama.waitForFunction((n) => document.querySelectorAll("button[aria-pressed='true']").length === n + 1, before);
});
await step("envoyer un message à un mentor", async () => {
  await mariama.goto("/messages");
  await mariama.getByRole("link", { name: /Alseny Camara/ }).click();
  await mariama.locator("#body").fill("Message de test automatisé");
  await mariama.getByRole("button", { name: "Envoyer" }).click();
  await mariama.getByText("Message de test automatisé").waitFor();
});
let cvLink = "";
await step("CV : partage, lien privé et PDF", async () => {
  await mariama.goto("/profil/cv");
  cvLink = await mariama.locator("#cv-url").inputValue();
  expect(cvLink.includes("?t="), "le CV « avec le lien » doit porter un jeton");
  for (const name of ["LinkedIn", "Facebook", "WhatsApp"]) expect(await mariama.getByRole("button", { name }).isVisible(), `bouton ${name}`);
  expect(await mariama.getByRole("button", { name: /Écrire son projet d'études/ }).isVisible(), "bouton certificat LinkedIn");
  const pdf = await mariama.request.get("/api/cv/pdf");
  expect(pdf.headers()["content-type"] === "application/pdf", "PDF");
  const size = (await pdf.body()).length;
  expect(size < 300_000, `PDF trop lourd : ${size} octets`);
  await shot(mariama, "cv-editeur");
});
await step("CV « avec le lien » : visible avec le jeton, 404 sans", async () => {
  const path = new URL(cvLink).pathname + new URL(cvLink).search;
  const anon = await newPage();
  expect((await anon.goto(path)).status() === 200, "avec jeton");
  expect(await anon.getByText("Mariama Camara").first().isVisible(), "nom absent");
  expect((await anon.goto(new URL(cvLink).pathname)).status() === 404, "sans jeton");
  const og = await fetch(`${BASE}/api/og/cv/${new URL(cvLink).pathname.split("/").pop()}${new URL(cvLink).search}`);
  expect(og.headers.get("content-type") === "image/png", "image d'aperçu");
  await anon.goto(path); await shot(anon, "cv-public");
});
await step("vérification d'un certificat", async () => {
  await mariama.goto("/profil/cv");
  const code = (await mariama.locator("a[href^='/verif/']").first().innerText()).trim();
  const anon = await newPage();
  await anon.goto(`/verif/${code}`);
  expect(await anon.getByText("Certificat valide").isVisible(), "certificat non valide");
});
await step("export des données personnelles", async () => {
  const res = await mariama.request.get("/api/moi/export");
  const data = await res.json();
  expect(data.profile.name === "Mariama Camara" && !("passwordHash" in data.profile), "export");
});

// --- Mentor ---
const ibrahima = await newPage();
await step("mentor : clôturer une séance avec un compte rendu", async () => {
  await demoLogin(ibrahima, "Ibrahima");
  await ibrahima.goto("/seances?onglet=passees");
  await ibrahima.getByText("Revue du README").click();
  await ibrahima.locator("textarea[name=summary]").fill("README relu ensemble, exemple d'utilisation ajouté.");
  await ibrahima.locator("textarea[name=nextActions]").fill("Publier l'article sur la démarche");
  await ibrahima.getByRole("button", { name: "Enregistrer le compte rendu" }).click();
  await ibrahima.waitForURL(/ok=cloture/);
});
await step("la prochaine action apparaît dans les objectifs de la mentorée", async () => {
  await mariama.goto("/objectifs");
  expect(await mariama.getByText("Publier l'article sur la démarche").count() > 0, "étape absente");
});
await step("mentor : valider une compétence et écrire une recommandation", async () => {
  await ibrahima.goto("/mentores");
  await ibrahima.getByRole("link", { name: /Mariama Camara/ }).first().click();
  await ibrahima.locator("input[name=skill]").fill("Intelligence artificielle");
  await ibrahima.getByRole("button", { name: "Valider" }).click();
  await ibrahima.getByText(/Déjà validées : .*Intelligence artificielle/).waitFor();
  await ibrahima.locator("textarea[name=body]").fill("Mariama apprend vite et documente son travail avec soin : son README est un modèle.");
  await ibrahima.getByRole("button", { name: "Envoyer pour approbation" }).click();
  await ibrahima.waitForURL(/ok=recommandation/);
  await shot(ibrahima, "fiche-mentoree");
});

// --- Coordination ---
const admin = await newPage();
await step("coordination : tableau d'impact, vérification et signalement", async () => {
  await demoLogin(admin, "Coordination");
  expect(await admin.getByRole("heading", { name: "Tableau d'impact" }).isVisible(), "tableau d'impact");
  await shot(admin, "admin");
  await admin.goto("/admin/mentors");
  await admin.getByRole("button", { name: "Valider" }).first().click();
  await admin.getByText("En attente (0)").waitFor();
  await admin.goto("/admin/signalements");
  await admin.getByRole("button", { name: "Classer sans suite" }).first().click();
  await admin.getByText("À traiter (0)").waitFor();
  const csv = await admin.request.get("/api/admin/impact");
  expect((await csv.text()).includes("Jumelages actifs"), "export CSV");
});

// --- Inscription et connexion par téléphone ---
const newbie = await newPage();
await step("inscription d'un mineur : accord parental demandé", async () => {
  await newbie.goto("/inscription");
  await newbie.locator("input[name=name]").fill("Test Mineur");
  await newbie.locator("input[name=phone]").fill(`+22462${String(Date.now()).slice(-7)}`);
  await newbie.locator("input[name=password]").fill("motdepasse-test");
  await newbie.locator("input[name=birthDate]").fill(`${new Date().getFullYear() - 15}-03-01`);
  await newbie.locator("input[name=parentName]").fill("Parent Test");
  await newbie.locator("input[name=parentPhone]").fill("+224620000000");
  await newbie.locator("textarea[name=need]").fill("Je veux apprendre à coder des sites web");
  await newbie.locator("input[name=charter]").check();
  await newbie.getByRole("button", { name: "Créer mon compte" }).click();
  await newbie.waitForURL(/\/trouver/);
  await newbie.goto("/accueil");
  expect(await newbie.getByText(/accord de votre parent/).isVisible(), "avertissement d'accord parental absent");
});
await step("connexion par téléphone avec code (mode démo)", async () => {
  const p = await newPage();
  await p.goto("/connexion");
  await p.locator("input[name=phone]").fill("+224629999999");
  await p.getByRole("button", { name: "Recevoir mon code" }).click();
  const code = (await p.locator("strong.tabular-nums").innerText()).trim();
  await p.locator("input[name=code]").fill(code);
  await p.getByRole("button", { name: "Se connecter" }).click();
  await p.waitForURL(/\/inscription\?telephone=1/);
  expect(await p.getByText("Numéro vérifié : +224629999999").isVisible(), "numéro vérifié");
});

// --- Mobile ---
await step("téléphone : aucune page ne défile horizontalement", async () => {
  const phone = await newPage({ ...devices["iPhone 13"] });
  await demoLogin(phone, "Mariama");
  for (const p of ["/", "/mentors", "/accueil", "/seances", "/objectifs", "/profil/cv", "/messages"]) {
    await phone.goto(p);
    const over = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over <= 1, `${p} déborde de ${over}px`);
  }
  await phone.goto("/accueil"); await shot(phone, "mobile-accueil");
  await phone.goto("/"); await shot(phone, "mobile-vitrine");
});

for (const [name, p] of [["visiteur", visitor], ["Mariama", mariama], ["Ibrahima", ibrahima], ["coordination", admin], ["inscription", newbie]]) {
  if (p.errors.length) { failures.push(`erreurs navigateur (${name})`); console.log(`✗ erreurs navigateur (${name}) : ${p.errors.join(" | ")}`); }
}
await browser.close();
console.log(`\n${passed} réussi(s), ${failures.length} échec(s)`);
process.exit(failures.length ? 1 : 0);
