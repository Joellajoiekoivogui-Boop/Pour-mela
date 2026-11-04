// Comptes et contenus de DÉMONSTRATION, clairement identifiés (profiles.is_demo = true,
// e-mails en @demo.talents-connect.test). À exécuter une fois, après les migrations :
//   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… DEMO_PASSWORD=… npm run seed:demo
// La clé service_role contourne la RLS : ne l'utilisez qu'en local, jamais dans le navigateur.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.DEMO_PASSWORD;
if (!url || !key) { console.error("Renseignez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY."); process.exit(1); }
if (!password || password.length < 8 || !/[a-z]/i.test(password) || !/\d/.test(password)) {
  console.error("Définissez DEMO_PASSWORD (8 caractères min., lettres et chiffres) : il sera commun à tous les comptes de démo."); process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const check = (r, what) => { if (r.error) { console.error(`✘ ${what} : ${r.error.message}`); process.exit(1); } return r.data; };

const MENTORS = [
  { email: "aminata.conde", first: "Aminata", last: "Condé", job: "Développeuse Full Stack", org: "Studio numérique (démo)", years: 8, domains: ["developpement-informatique"], skills: ["react", "nodejs", "javascript", "typescript", "git"], bio: "J'accompagne les jeunes qui veulent devenir développeurs web : bases solides, projets concrets, portfolio.", types: ["video", "written"] },
  { email: "ibrahima.bah", first: "Ibrahima", last: "Bah", job: "CTO", org: "Startup fintech (démo)", years: 14, domains: ["developpement-informatique", "entrepreneuriat"], skills: ["architecture-logicielle", "devops", "sql", "pitch"], bio: "Ingénieur logiciel devenu CTO. Je conseille sur les carrières tech et le lancement de produits numériques.", types: ["video", "in_person"] },
  { email: "mariama.sylla", first: "Mariama", last: "Sylla", job: "Responsable marketing digital", org: "Agence de communication (démo)", years: 9, domains: ["marketing-digital", "leadership"], skills: ["reseaux-sociaux", "creation-contenu", "seo", "prise-de-parole"], bio: "Stratégie de contenu et marque personnelle : je vous aide à vous rendre visibles.", types: ["video", "audio"] },
  { email: "sekou.keita", first: "Sékou", last: "Keïta", job: "Analyste en cybersécurité", org: "Opérateur télécom (démo)", years: 6, domains: ["cybersecurite"], skills: ["securite-reseaux", "securite-applicative", "reseaux-systemes"], bio: "Je fais découvrir les métiers de la sécurité et la pratique éthique.", types: ["video", "written"] },
  { email: "fatoumata.diallo", first: "Fatoumata", last: "Diallo", job: "Data scientist", org: "ONG santé publique (démo)", years: 5, domains: ["intelligence-artificielle"], skills: ["python", "data-analyse", "machine-learning", "statistiques"], bio: "Les données au service de la santé : Python, statistiques, projets utiles localement.", types: ["video"] },
];
const MENTEE = { email: "awa.camara", first: "Awa", last: "Camara" };
const ADMIN = { email: "admin", first: "Admin", last: "Démo" };

async function user(slug, meta) {
  const email = `${slug}@demo.talents-connect.test`;
  const list = check(await db.auth.admin.listUsers({ perPage: 1000 }), "liste des utilisateurs");
  const found = list.users.find((u) => u.email === email);
  if (found) return found.id;
  const r = check(await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: meta }), `création de ${email}`);
  return r.user.id;
}

const domains = check(await db.from("expertise_domains").select("id, slug"), "domaines");
const skills = check(await db.from("skills").select("id, slug"), "compétences");
if (domains.length === 0) { console.error("Exécutez d'abord supabase/seed.sql (domaines et compétences)."); process.exit(1); }
const D = Object.fromEntries(domains.map((d) => [d.slug, d.id]));
const K = Object.fromEntries(skills.map((s) => [s.slug, s.id]));

for (const m of MENTORS) {
  const id = await user(m.email, { role: "mentor", first_name: m.first, last_name: m.last });
  check(await db.from("profiles").update({ is_demo: true, bio: m.bio, location: "Conakry, Guinée" }).eq("id", id), "profil");
  check(await db.from("mentor_profiles").update({ job_title: m.job, organization: m.org, years_experience: m.years, support_types: m.types,
    languages: ["Français", "Anglais"], availability_note: "En soirée et le samedi", verification_status: "verified", verified_at: new Date().toISOString() }).eq("user_id", id), "profil mentor");
  await db.from("user_domains").delete().eq("user_id", id);
  await db.from("user_skills").delete().eq("user_id", id);
  check(await db.from("user_domains").insert(m.domains.map((s) => ({ user_id: id, domain_id: D[s] }))), "domaines du mentor");
  check(await db.from("user_skills").insert(m.skills.map((s) => ({ user_id: id, skill_id: K[s], relation: "teaches" }))), "compétences du mentor");
  // Créneaux : les 4 prochains samedis à 10 h (heure de Conakry = UTC).
  const now = new Date();
  const slots = [1, 2, 3, 4].map((w) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + ((6 - now.getUTCDay() + 7) % 7 || 7) + (w - 1) * 7, 10));
    return { mentor_id: id, starts_at: d.toISOString(), ends_at: new Date(d.getTime() + 3600_000).toISOString(), session_types: m.types };
  });
  await db.from("availability_slots").upsert(slots, { onConflict: "mentor_id,starts_at", ignoreDuplicates: true });
  console.log(`✔ Mentor ${m.first} ${m.last}`);
}

const menteeId = await user(MENTEE.email, { role: "mentee", first_name: MENTEE.first, last_name: MENTEE.last });
check(await db.from("profiles").update({ is_demo: true, location: "Conakry, Guinée", bio: "Étudiante en informatique, passionnée de web." }).eq("id", menteeId), "profil mentoré");
check(await db.from("mentee_profiles").update({ education_level: "licence", institution: "Université (démo)", field_of_study: "Licence informatique",
  professional_goals: "Devenir développeuse Full Stack et créer des services utiles en Guinée." }).eq("user_id", menteeId), "profil mentoré");
await db.from("user_domains").delete().eq("user_id", menteeId);
await db.from("user_skills").delete().eq("user_id", menteeId);
check(await db.from("user_domains").insert([{ user_id: menteeId, domain_id: D["developpement-informatique"] }]), "domaines mentoré");
check(await db.from("user_skills").insert([...["react", "nodejs"].map((s) => ({ user_id: menteeId, skill_id: K[s], relation: "wants" })), { user_id: menteeId, skill_id: K["html-css"], relation: "has" }]), "compétences mentoré");
console.log("✔ Mentorée Awa Camara");

const adminId = await user(ADMIN.email, { first_name: ADMIN.first, last_name: ADMIN.last });
check(await db.from("profiles").update({ role: "super_admin", is_demo: true }).eq("id", adminId), "super administrateur");
console.log("✔ Super administrateur de démonstration");

// Contenus d'exemple, signalés « (démo) » : aucune vraie offre n'est inventée.
const { count } = await db.from("opportunities").select("id", { count: "exact", head: true }).like("title", "%(démo)%");
if (!count) {
  const deadline = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
  check(await db.from("opportunities").insert([
    { created_by: adminId, title: "Stage développeur web (démo)", organization: "Organisation fictive de démonstration", category: "internship", domain_id: D["developpement-informatique"], location: "Conakry", deadline, description: "Exemple d'opportunité créé pour la démonstration. Ce n'est pas une offre réelle." },
    { created_by: adminId, title: "Hackathon innovation numérique (démo)", organization: "Organisation fictive de démonstration", category: "hackathon", location: "Conakry", deadline, description: "Exemple d'opportunité créé pour la démonstration. Ce n'est pas un événement réel." },
  ]), "opportunités");
  check(await db.from("resources").insert([
    { author_id: adminId, domain_id: D["developpement-informatique"], title: "MDN Web Docs — apprendre le développement web", type: "link", url: "https://developer.mozilla.org/fr/docs/Learn", description: "Documentation de référence gratuite (HTML, CSS, JavaScript)." },
    { author_id: adminId, domain_id: D["orientation-professionnelle"], title: "Préparer son premier entretien (démo)", type: "link", url: "https://developer.mozilla.org/fr/", description: "Lien d'exemple pour la démonstration." },
  ]), "ressources");
  console.log("✔ Opportunités et ressources d'exemple");
}
console.log(`\nComptes (mot de passe : DEMO_PASSWORD) :\n  mentorée : awa.camara@demo.talents-connect.test\n  mentor   : aminata.conde@demo.talents-connect.test (et 4 autres)\n  admin    : admin@demo.talents-connect.test (super administrateur)`);
