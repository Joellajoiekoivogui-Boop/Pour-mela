// Données initiales.
//   npm run db:seed      → migrations + programmes + jeu de démonstration (si absent)
//   npm run demo:reset   → efface puis recrée tous les comptes de démonstration
// Les comptes de démonstration (is_demo = 1) sont fictifs ; les comptes réels ne sont jamais touchés.
import { mkdirSync } from "node:fs";
import { eq } from "drizzle-orm";
import { db, getClient, schema } from "../src/db";
import { migrate } from "../src/db/migrate";
import { DEMO_MENTEES, DEMO_MENTORS } from "../src/lib/demo-data";
import { certificateCode, newId, newToken, slugify } from "../src/lib/ids";
import { CHARTER_VERSION } from "../src/lib/env";

const reset = process.argv.includes("--reset-demo");
const now = Date.now();
const H = 3_600_000;
const D = 24 * H;
const day = (offset: number) => new Date(now + offset * D).toISOString().slice(0, 10);
/** Horodatage à une heure donnée (heure de Conakry = UTC), n jours plus tard. */
const at = (offsetDays: number, hour: number) => {
  const d = new Date(now + offsetDays * D);
  d.setUTCHours(hour, 0, 0, 0);
  return d.getTime();
};

mkdirSync("data", { recursive: true });
await migrate(getClient());

// Programmes (configuration réelle, pas de la démo).
const PROGRAMS = [
  {
    slug: "reussir-campus-france", title: "Réussir Campus France", domain: "etudes", weeks: 6, sessionsCount: 6, sessionMinutes: 60,
    summary: "Six semaines en groupe pour construire un dossier solide et aborder l'entretien sereinement.",
    deliverable: "Dossier déposé et entretien simulé",
    steps: ["Choisir 7 formations adaptées", "Rédiger le projet d'études", "Adapter les lettres de motivation", "Préparer les justificatifs", "Simuler l'entretien", "Déposer le dossier"],
    certificateTitle: "Parcours Réussir Campus France",
  },
  {
    slug: "premier-emploi", title: "Premier emploi", domain: "insertion", weeks: 6, sessionsCount: 6, sessionMinutes: 60,
    summary: "De la lecture des offres à l'entretien : une méthode pour décrocher un premier poste ou un stage.",
    deliverable: "CV, lettre type et 3 candidatures envoyées",
    steps: ["Faire le point sur ses compétences", "Écrire un CV qui passe le tri", "Écrire une lettre type", "Repérer les offres", "Préparer l'entretien", "Envoyer 3 candidatures"],
    certificateTitle: "Parcours Premier emploi",
  },
  {
    slug: "lancer-son-activite", title: "Lancer son activité", domain: "entrepreneuriat", weeks: 8, sessionsCount: 8, sessionMinutes: 90,
    summary: "Huit semaines pour passer de l'idée à un projet chiffré, prêt à être présenté à un financeur.",
    deliverable: "Business plan d'une page et budget prévisionnel",
    steps: ["Préciser le problème et le client", "Tester l'idée auprès de 10 clients", "Fixer son prix", "Choisir son statut", "Construire le budget prévisionnel", "Écrire le business plan d'une page", "Préparer le pitch", "Présenter devant un jury"],
    certificateTitle: "Parcours Lancer son activité",
  },
  {
    slug: "debuter-dans-le-numerique", title: "Bien débuter dans le numérique", domain: "numerique", weeks: 8, sessionsCount: 8, sessionMinutes: 60,
    summary: "Les bases pour coder un premier projet utile et le publier proprement.",
    deliverable: "Projet publié sur GitHub avec un README clair",
    steps: ["Installer ses outils", "Les bases de Git", "Choisir un projet utile", "Construire une première version", "Tester", "Écrire le README", "Publier", "Présenter son projet"],
    certificateTitle: "Parcours Débuter dans le numérique",
  },
];
for (const p of PROGRAMS) {
  const [exists] = await db.select().from(schema.programs).where(eq(schema.programs.slug, p.slug)).limit(1);
  if (!exists) await db.insert(schema.programs).values({ id: newId(), ...p });
}

const [existingDemo] = await db.select().from(schema.users).where(eq(schema.users.isDemo, true)).limit(1);
if (existingDemo && !reset) {
  console.log("Jeu de démonstration déjà présent (npm run demo:reset pour le recréer).");
  process.exit(0);
}
if (reset) {
  await db.delete(schema.users).where(eq(schema.users.isDemo, true));
  console.log("Comptes de démonstration effacés.");
}

const ids = new Map<string, string>();
const userId = (key: string) => ids.get(key)!;

// Coordination
ids.set("coordination", newId());
await db.insert(schema.users).values({
  id: userId("coordination"), role: "ADMIN", name: "Coordination MonMentor (démo)", email: "coordination@demo.monmentor",
  city: "Conakry", isDemo: true, charterVersion: CHARTER_VERSION, charterAcceptedAt: now - 60 * D, createdAt: now - 90 * D,
});

for (const m of DEMO_MENTORS) {
  ids.set(m.key, newId());
  await db.insert(schema.users).values({
    id: userId(m.key), role: "MENTOR", name: m.name, email: `${m.key}@demo.monmentor`, phone: null, gender: m.gender,
    city: m.city, country: m.country, bio: m.bio, isDemo: true, preferredChannel: "email",
    charterVersion: CHARTER_VERSION, charterAcceptedAt: now - 50 * D, createdAt: now - 80 * D,
  });
  await db.insert(schema.mentorProfiles).values({
    userId: userId(m.key), title: m.title, organization: m.organization, yearsExperience: m.yearsExperience,
    primaryDomain: m.primaryDomain, domains: m.domains, skills: m.skills, languages: m.languages, formats: m.formats,
    capacity: m.capacity, verificationLevel: m.verificationLevel, slots: m.slots,
  });
  await db.insert(schema.careerProfiles).values({
    userId: userId(m.key), slug: `${slugify(m.name)}-demo`, visibility: m.verificationLevel >= 2 ? "PUBLIC" : "PRIVATE",
    headline: `${m.title} · ${m.organization}`, summary: m.bio, hidden: [], shareToken: newToken(16), updatedAt: now,
  });
}

for (const m of DEMO_MENTEES) {
  ids.set(m.key, newId());
  await db.insert(schema.users).values({
    id: userId(m.key), role: "MENTEE", name: m.name, email: `${m.key}@demo.monmentor`, gender: m.gender, city: m.city,
    birthDate: m.birthDate, isDemo: true, preferredChannel: "email",
    charterVersion: CHARTER_VERSION, charterAcceptedAt: now - 30 * D, createdAt: now - 40 * D,
  });
  await db.insert(schema.menteeProfiles).values({ userId: userId(m.key), situation: m.situation, need: m.need, domains: m.domains });
}

// Relations de mentorat
const pair = async (mentor: string, mentee: string, status: "ACTIVE" | "PENDING", daysAgo: number, message?: string) =>
  db.insert(schema.mentorships).values({ id: newId(), mentorId: userId(mentor), menteeId: userId(mentee), status, message: message ?? null, createdAt: now - daysAgo * D });
await pair("alseny", "mariama", "ACTIVE", 35);
await pair("ibrahima", "mariama", "ACTIVE", 28);
await pair("fatoumata", "thierno", "ACTIVE", 21);
await pair("nenefanta", "aissata", "ACTIVE", 14);
await pair("aminata", "aissata", "PENDING", 1, "Bonjour Madame Diallo, je suis très timide en entretien et j'aimerais travailler ma prise de parole avec vous.");

// Objectifs
const objective = async (mentee: string, title: string, domain: string, dueIn: number, steps: [string, boolean][], comment?: [string, string]) => {
  const id = newId();
  await db.insert(schema.objectives).values({
    id, menteeId: userId(mentee), title, domain, dueDate: day(dueIn), createdAt: now - 30 * D,
    mentorComment: comment?.[1] ?? null, mentorCommentBy: comment ? userId(comment[0]) : null,
  });
  await db.insert(schema.objectiveSteps).values(steps.map(([t, done], i) => ({ id: newId(), objectiveId: id, title: t, done, position: i })));
  return id;
};
const objCampus = await objective("mariama", "Déposer mon dossier Campus France", "etudes", 32, [
  ["Sélectionner 7 formations adaptées à mon profil", true],
  ["Rédiger mon projet d'études", true],
  ["Adapter la lettre de motivation à chaque formation", false],
  ["Préparer l'entretien Campus France", false],
  ["Soumettre le dossier complet", false],
], ["alseny", "Très bon rythme. Pour l'entretien, prépare une réponse claire à « Pourquoi la France et pas ailleurs ? »."]);
const objIa = await objective("mariama", "Construire un projet d'IA pour mon portfolio", "numerique", 48, [
  ["Constituer un jeu de données de phrases en soussou", true],
  ["Entraîner un premier modèle de classification", true],
  ["Publier le code sur GitHub avec un README clair", false],
  ["Rédiger un article qui raconte la démarche", false],
]);
await objective("thierno", "Chiffrer mon projet de jus de mangue", "agri", 40, [
  ["Interroger 10 commerçants de Madina sur leurs achats", true],
  ["Calculer le coût de revient d'une bouteille", false],
  ["Lister les machines et leur prix", false],
  ["Préparer un dossier pour un microcrédit", false],
]);
await objective("aissata", "Décrocher un premier emploi en gestion", "insertion", 60, [
  ["Refaire mon CV", true],
  ["Préparer 5 réponses aux questions d'entretien", false],
  ["Envoyer 3 candidatures", false],
]);

// Séances
const session = async (v: {
  mentor: string; mentee: string; title: string; startsAt: number; status: typeof schema.sessions.$inferInsert.status;
  duration?: number; joined?: boolean; summary?: string; nextActions?: string[]; rating?: number; comment?: string; objectiveId?: string; skill?: string;
}) => {
  const id = newId();
  await db.insert(schema.sessions).values({
    id, mentorId: userId(v.mentor), menteeId: userId(v.mentee), title: v.title, startsAt: v.startsAt, durationMin: v.duration ?? 45,
    format: "visio", status: v.status, objectiveId: v.objectiveId ?? null,
    joinedAtMentor: v.joined ? v.startsAt + 60_000 : null, joinedAtMentee: v.joined ? v.startsAt + 120_000 : null,
    summary: v.summary ?? null, nextActions: v.nextActions ?? null, skillWorked: v.skill ?? null,
    rating: v.rating ?? null, ratingComment: v.comment ?? null,
    closedAt: v.status === "COMPLETED" ? v.startsAt + 2 * H : null, createdAt: v.startsAt - 3 * D,
  });
  return id;
};
await session({ mentor: "alseny", mentee: "mariama", title: "Choisir ses formations", startsAt: at(-30, 19), status: "COMPLETED", joined: true, rating: 5, comment: "Très concret, merci !", summary: "Liste de 12 formations réduite à 7 selon le niveau et le budget.", nextActions: ["Rédiger le projet d'études"], objectiveId: objCampus, skill: "Choix de formation" });
await session({ mentor: "alseny", mentee: "mariama", title: "Relecture du projet d'études", startsAt: at(-16, 19), status: "COMPLETED", joined: true, rating: 5, summary: "Projet d'études restructuré en trois parties.", nextActions: ["Adapter la lettre de motivation à chaque formation"], objectiveId: objCampus, skill: "Lettre de motivation" });
await session({ mentor: "alseny", mentee: "mariama", title: "Simulation d'entretien Campus France", startsAt: at(2, 19), status: "CONFIRMED", objectiveId: objCampus });
await session({ mentor: "ibrahima", mentee: "mariama", title: "Cadrer le projet d'IA", startsAt: at(-21, 18), status: "COMPLETED", joined: true, rating: 5, summary: "Choix d'un problème de classification de phrases en soussou.", nextActions: ["Constituer le jeu de données"], objectiveId: objIa, skill: "Python" });
await session({ mentor: "ibrahima", mentee: "mariama", title: "Premier modèle", startsAt: at(-9, 18), status: "COMPLETED", joined: true, rating: 4, summary: "Premier modèle entraîné, 71 % de précision.", nextActions: ["Publier le code sur GitHub avec un README clair"], objectiveId: objIa, skill: "Intelligence artificielle" });
await session({ mentor: "ibrahima", mentee: "mariama", title: "Revue du README", startsAt: at(-1, 18), status: "CONFIRMED", joined: true, objectiveId: objIa });
await session({ mentor: "fatoumata", mentee: "thierno", title: "Valider l'idée auprès des clients", startsAt: at(-12, 10), status: "COMPLETED", joined: true, rating: 5, summary: "Questionnaire préparé pour 10 commerçants.", nextActions: ["Calculer le coût de revient d'une bouteille"] });
await session({ mentor: "fatoumata", mentee: "thierno", title: "Coût de revient et prix de vente", startsAt: at(3, 10), status: "REQUESTED" });
await session({ mentor: "nenefanta", mentee: "aissata", title: "Préparer les questions d'entretien", startsAt: at(1, 17), status: "CONFIRMED" });
await session({ mentor: "nenefanta", mentee: "aissata", title: "Relecture du CV", startsAt: at(-7, 17), status: "COMPLETED", joined: true, rating: 5, summary: "CV raccourci à une page, expériences associatives mises en valeur.", nextActions: ["Préparer 5 réponses aux questions d'entretien"], skill: "CV" });

// CV de Mariama
await db.insert(schema.careerProfiles).values({
  userId: userId("mariama"), slug: "mariama-camara-demo", visibility: "LINK",
  headline: "Licence 3 informatique · vise un master en intelligence artificielle",
  summary: "Étudiante à Conakry, je construis un modèle de classification de phrases en soussou et je prépare une poursuite d'études en France.",
  hidden: [], shareToken: newToken(16), updatedAt: now,
});
await db.insert(schema.experiences).values([
  { id: newId(), userId: userId("mariama"), kind: "EDUCATION", title: "Licence d'informatique", organization: "Université de Conakry (démo)", start: "2023", end: "2026", description: "Spécialité génie logiciel." },
  { id: newId(), userId: userId("mariama"), kind: "EXPERIENCE", title: "Bénévole formatrice", organization: "Club informatique du quartier (démo)", start: "2024", end: null, description: "Initiation à la bureautique pour 20 collégiens." },
]);
await db.insert(schema.skillEndorsements).values([
  { id: newId(), menteeId: userId("mariama"), mentorId: userId("ibrahima"), skill: "Python", createdAt: now - 9 * D },
  { id: newId(), menteeId: userId("mariama"), mentorId: userId("alseny"), skill: "Lettre de motivation", createdAt: now - 16 * D },
]);
await db.insert(schema.recommendations).values({
  id: newId(), menteeId: userId("mariama"), mentorId: userId("ibrahima"), status: "APPROVED", createdAt: now - 8 * D,
  body: "Mariama a constitué seule un jeu de données en soussou et entraîné son premier modèle en trois semaines. Rigoureuse, curieuse et persévérante.",
});
await db.insert(schema.certificates).values({
  id: newId(), code: certificateCode(), userId: userId("mariama"), title: "Atelier « Écrire son projet d'études »",
  issuedBy: userId("coordination"), issuedAt: now - 10 * D,
});

// Ressources
const resource = (author: string, type: typeof schema.resources.$inferInsert.type, domain: string, title: string, summary: string, minutes: number, body: string, daysAgo: number) =>
  ({ id: newId(), authorId: userId(author), type, domain, title, summary, minutes, body, createdAt: now - daysAgo * D });
await db.insert(schema.resources).values([
  resource("alseny", "checklist", "etudes", "Réussir son entretien Campus France", "Les questions qui reviennent et une méthode pour présenter son projet avec assurance.", 7,
    "## Les questions qui reviennent\n- Présentez votre parcours en deux minutes.\n- Pourquoi cette formation, et pourquoi en France ?\n- Comment allez-vous financer vos études ?\n- Que ferez-vous après le diplôme ?\n\n## La méthode\n1. Écrivez une réponse de 5 phrases pour chaque question.\n2. Répétez à voix haute, chronomètre en main.\n3. Faites une simulation avec votre mentor la semaine précédente.\n\n## Les pièges\n- Réciter un texte appris par cœur.\n- Ne pas connaître le contenu des formations choisies.\n- Rester flou sur le financement.", 20),
  resource("hadja", "modele", "etudes", "Lettre de motivation : la méthode en 4 paragraphes", "Un modèle simple pour écrire une lettre personnelle, adaptée à chaque formation.", 6,
    "1. **Vous** : ce qui vous amène à cette formation, avec un fait précis.\n2. **Eux** : ce que la formation apporte de particulier (cours, projets, débouchés).\n3. **Nous** : ce que vous apporterez à la promotion.\n4. **La suite** : votre projet professionnel et la demande d'entretien.\n\nUne lettre par formation : changez au minimum les paragraphes 2 et 3.", 25),
  resource("ibrahima", "guide", "numerique", "Débuter en intelligence artificielle en 6 mois", "Les bases à maîtriser, des ressources gratuites et un projet par mois.", 9,
    "- **Mois 1** : Python et les bases de la programmation.\n- **Mois 2** : statistiques et manipulation de données.\n- **Mois 3** : premiers modèles de classification.\n- **Mois 4** : un projet sur des données locales.\n- **Mois 5** : publier le code et écrire un README clair.\n- **Mois 6** : raconter la démarche dans un article.", 28),
  resource("nenefanta", "guide", "insertion", "Le CV qui passe le tri en 30 secondes", "Ce que regarde vraiment un recruteur, même sans expérience professionnelle.", 8,
    "- Une page, pas plus.\n- En haut : le poste visé en une ligne.\n- Les expériences associatives et les projets comptent : décrivez ce que vous avez fait et le résultat.\n- Des verbes d'action et des chiffres : « formé 20 collégiens » plutôt que « formation ».\n- Relisez l'orthographe, puis faites relire.", 12),
  resource("aminata", "guide", "leadership", "Pitcher son projet en 3 minutes", "Structure, respiration et regard : convaincre un jury sans réciter.", 5,
    "1. **Le problème** (30 s) : une histoire vraie.\n2. **La solution** (60 s) : ce que vous faites, pour qui.\n3. **La preuve** (45 s) : un chiffre, un client, un test.\n4. **La demande** (45 s) : ce que vous attendez du jury.\n\nRespirez avant de commencer, regardez une personne par phrase.", 18),
  resource("fatoumata", "guide", "agri", "Calculer le coût de revient d'un produit transformé", "Matières premières, emballage, énergie, main-d'œuvre : ne rien oublier avant de fixer son prix.", 7,
    "Pour une bouteille de jus :\n- matières premières (fruits, sucre) ;\n- emballage (bouteille, bouchon, étiquette) ;\n- énergie (électricité, gaz) ;\n- main-d'œuvre ;\n- part des machines (prix ÷ nombre de bouteilles sur leur durée de vie) ;\n- transport.\n\nPrix de vente = coût de revient + marge, à comparer aux prix du marché.", 9),
  resource("moussa", "checklist", "numerique", "Les 10 réflexes de cybersécurité", "Pour protéger vos comptes, ceux de votre entreprise et ceux de vos clients.", 4,
    "1. Un mot de passe différent par service.\n2. Un gestionnaire de mots de passe.\n3. La double authentification partout.\n4. Les mises à jour dès qu'elles sortent.\n5. Ne jamais donner un code reçu par SMS.\n6. Vérifier l'expéditeur avant de cliquer.\n7. Sauvegarder ses fichiers chaque semaine.\n8. Verrouiller son téléphone.\n9. Éviter les Wi-Fi publics pour les paiements.\n10. Signaler tout message suspect.", 30),
  resource("mariame", "livre", "culture", "« L'Enfant noir » de Camara Laye", "Écrire l'intime avec une simplicité qui touche le monde entier.", 3,
    "Le livre que je recommande à chaque jeune auteur guinéen : lisez-le en notant comment l'auteur décrit les gestes du quotidien.", 40),
]);

// Opportunités (organisations fictives)
await db.insert(schema.opportunities).values([
  { id: newId(), authorId: userId("ibrahima"), type: "stage", domain: "numerique", title: "Stage développeur·se web (6 mois)", organization: "Start-up de paiement mobile (démo)", location: "Conakry", description: "Rejoindre une équipe produit : React, Node.js, tests. Stage rémunéré, possibilité d'embauche.", deadline: day(19), createdAt: now - 8 * D },
  { id: newId(), authorId: userId("alseny"), type: "bourse", domain: "etudes", title: "Bourse d'excellence pour un master en France", organization: "Fondation (démo)", location: "En ligne", description: "Dix bourses couvrant les frais de scolarité et une partie du logement pour des étudiants guinéens admis en master.", deadline: day(23), createdAt: now - 5 * D },
  { id: newId(), authorId: userId("fatoumata"), type: "concours", domain: "entrepreneuriat", title: "Prix des jeunes entrepreneurs", organization: "Chambre consulaire (démo)", location: "Conakry", description: "Concours ouvert aux entreprises de moins de 3 ans. Dotation et un an d'accompagnement.", deadline: day(28), createdAt: now - 10 * D },
  { id: newId(), authorId: userId("fatoumata"), type: "incubation", domain: "agri", title: "Programme d'incubation agroalimentaire, cohorte 2027", organization: "Incubateur (démo)", location: "Conakry", description: "Six mois d'accompagnement, un atelier partagé et des rencontres avec des investisseurs.", deadline: day(43), createdAt: now - 13 * D },
  { id: newId(), authorId: userId("nenefanta"), type: "emploi", domain: "insertion", title: "Assistant·e comptable junior", organization: "Groupe industriel (démo)", location: "Conakry", description: "Premier poste en comptabilité, formation assurée. Licence en gestion ou comptabilité.", deadline: day(15), createdAt: now - 3 * D },
]);

// Cohorte
const [campus] = await db.select().from(schema.programs).where(eq(schema.programs.slug, "reussir-campus-france")).limit(1);
const cohortId = newId();
await db.insert(schema.cohorts).values({ id: cohortId, programId: campus!.id, mentorId: userId("alseny"), startsOn: day(7), capacity: 8, status: "OPEN", createdAt: now - 4 * D });
await db.insert(schema.cohortMembers).values({ cohortId, userId: userId("mariama"), status: "ENROLLED", createdAt: now - 3 * D });

// Messages
const msg = (from: string, to: string, body: string, minsAgo: number) =>
  ({ id: newId(), senderId: userId(from), recipientId: userId(to), body, createdAt: now - minsAgo * 60_000, readAt: now - (minsAgo - 5) * 60_000 });
await db.insert(schema.messages).values([
  msg("mariama", "alseny", "Bonjour, j'ai terminé ma liste de 7 formations. Je vous l'envoie avant la séance ?", 60 * 30),
  msg("alseny", "mariama", "Oui, envoie-la. Ajoute pour chacune le lien vers le programme des cours.", 60 * 29),
  msg("ibrahima", "mariama", "Ton README est presque prêt. Pense à ajouter un exemple d'utilisation.", 60 * 20),
  msg("thierno", "fatoumata", "J'ai interrogé 10 commerçants de Madina, 7 achèteraient du jus en bouteille de 50 cl.", 60 * 50),
  msg("fatoumata", "thierno", "Excellent début. On calcule ensemble le coût de revient à la prochaine séance.", 60 * 48),
]);

// Vérification en attente et signalement de démonstration
await db.insert(schema.verifications).values({
  id: newId(), userId: userId("lansana"), level: 2, status: "PENDING", createdAt: now - 2 * D,
  evidence: "Attestation de la coopérative transmise par e-mail (démo).",
});
await db.insert(schema.reports).values({
  id: newId(), reporterId: userId("aissata"), targetType: "USER", targetId: userId("lansana"), targetUserId: userId("lansana"),
  reason: "FAKE_PROFILE", details: "Signalement de démonstration : profil incomplet.", createdAt: now - D,
});

await db.insert(schema.notifications).values([
  { id: newId(), userId: userId("aminata"), type: "mentorship_request", channel: "inapp", status: "SENT", body: "Aïssata Barry souhaite être accompagnée par vous.", link: "/mentores", scheduledAt: now - D, sentAt: now - D, createdAt: now - D },
  { id: newId(), userId: userId("fatoumata"), type: "session_request", channel: "inapp", status: "SENT", body: "Thierno Diallo demande une séance « Coût de revient et prix de vente ».", link: "/seances", scheduledAt: now - 2 * H, sentAt: now - 2 * H, createdAt: now - 2 * H },
]);

console.log(`Jeu de démonstration créé : ${DEMO_MENTORS.length} mentors, ${DEMO_MENTEES.length} mentorés, 1 compte de coordination.`);
