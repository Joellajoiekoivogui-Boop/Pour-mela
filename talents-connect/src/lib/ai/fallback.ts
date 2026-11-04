import { keywords } from "../matching/engine.ts";
import type { AssistantMode } from "./prompts";

/**
 * Mode sans IA : réponses construites à partir de modèles prédéfinis, sans
 * appel externe. Elles sont toujours signalées comme telles dans l'interface.
 */

interface PathTemplate { match: string[]; title: string; steps: string[]; advice: string }

const PATHS: PathTemplate[] = [
  { match: ["fullstack", "web", "react", "javascript", "developpeur", "developpeuse", "frontend", "backend", "site", "application", "programmation", "code"],
    title: "Devenir développeur Full Stack",
    steps: ["Apprendre HTML et CSS (mise en page, responsive)", "Maîtriser JavaScript (fonctions, tableaux, DOM, asynchrone)", "Utiliser Git et GitHub au quotidien", "Apprendre React (composants, état, formulaires)", "Découvrir un back-end : Node.js et une base SQL", "Réaliser un projet complet et le mettre en ligne", "Construire un portfolio avec 2 ou 3 projets", "Préparer les entretiens techniques"],
    advice: "Codez un peu chaque jour et montrez vos projets à votre mentor à chaque étape." },
  { match: ["data", "donnees", "ia", "machinelearning", "python", "analyse", "statistiques", "intelligence"],
    title: "Se former à l'analyse de données et à l'IA",
    steps: ["Apprendre les bases de Python", "Réviser les statistiques descriptives", "Manipuler des données avec un tableur puis pandas", "Visualiser des données (graphiques clairs)", "Découvrir le machine learning supervisé", "Mener un projet sur un jeu de données réel et local", "Présenter ses résultats à un public non technique"],
    advice: "Choisissez des données qui vous parlent (agriculture, santé, éducation en Guinée) pour rester motivé." },
  { match: ["cybersecurite", "securite", "reseau", "reseaux", "hacking", "pentest"],
    title: "Débuter en cybersécurité",
    steps: ["Comprendre les réseaux (TCP/IP, DNS, HTTP)", "Prendre en main Linux en ligne de commande", "Apprendre les principales vulnérabilités web (OWASP Top 10)", "S'entraîner sur des plateformes légales de type CTF", "Étudier la sécurité des systèmes et des mots de passe", "Documenter ses apprentissages dans un carnet public", "Viser une première certification d'entrée"],
    advice: "Ne testez jamais un système sans autorisation écrite : entraînez-vous uniquement sur des environnements prévus pour cela." },
  { match: ["entreprise", "entrepreneur", "entrepreneuriat", "startup", "businessplan", "projet", "creer", "financement"],
    title: "Lancer son projet entrepreneurial",
    steps: ["Formuler le problème et la cible en une phrase", "Rencontrer au moins 10 clients potentiels", "Définir l'offre et le modèle économique", "Construire une première version simple (prototype)", "Rédiger un business plan court", "Préparer un pitch de 3 minutes", "Identifier les incubateurs, concours et financements adaptés"],
    advice: "Testez votre idée auprès de vrais clients avant d'investir de l'argent." },
  { match: ["marketing", "communication", "reseaux", "sociaux", "contenu", "seo", "digital"],
    title: "Développer des compétences en marketing digital",
    steps: ["Comprendre les bases du marketing (cible, message, canal)", "Créer une ligne éditoriale pour un réseau social", "Apprendre à mesurer les résultats (statistiques)", "S'initier au référencement (SEO)", "Mener une petite campagne pour une association ou un commerce", "Rassembler ses réalisations dans un portfolio"],
    advice: "Proposez vos services à une structure locale : c'est la meilleure façon d'apprendre et de bâtir un portfolio." },
  { match: ["design", "graphique", "ux", "ui", "uiux", "creatif", "video", "photo"],
    title: "Se lancer dans le design",
    steps: ["Apprendre les principes de base (couleur, typographie, grille)", "Maîtriser un outil de design", "Reproduire des interfaces existantes pour s'entraîner", "Mener un projet pour un vrai client ou une association", "Recueillir des retours et itérer", "Construire un portfolio en ligne"],
    advice: "Demandez régulièrement des critiques à votre mentor : le regard extérieur fait progresser plus vite." },
];

const GENERIC: Omit<PathTemplate, "match"> = {
  title: "Atteindre mon objectif professionnel",
  steps: ["Écrire l'objectif précisément, avec une échéance", "Lister les compétences nécessaires", "Évaluer son niveau actuel sur chacune", "Choisir des ressources de formation fiables", "Réaliser un premier projet concret", "Faire le point avec son mentor", "Préparer la prochaine étape (candidature, concours, lancement)"],
  advice: "Décrivez votre objectif avec plus de détails pour obtenir un parcours plus précis.",
};

export function fallbackPath(goal: string): { title: string; steps: string[]; advice: string } {
  const words = new Set(keywords(goal));
  let best: PathTemplate | null = null;
  let bestScore = 0;
  for (const p of PATHS) {
    const score = p.match.filter((m) => words.has(m)).length;
    if (score > bestScore) { best = p; bestScore = score; }
  }
  const chosen = best ?? GENERIC;
  const title = goal.trim().length >= 3 && goal.trim().length <= 120 && !best ? goal.trim() : chosen.title;
  return { title, steps: chosen.steps, advice: chosen.advice };
}

export function fallbackAnswer(mode: AssistantMode, question: string): string {
  const q = keywords(question);
  if (mode === "career") {
    if (q.some((w) => w.startsWith("lettre") || w.startsWith("motivation"))) {
      return `Structure d'une lettre de motivation (1 page) :

1. **Accroche** : le poste visé et pourquoi cette organisation précisément.
2. **Vous** : 2 ou 3 réalisations concrètes en lien avec le poste (projets, stages, engagement associatif).
3. **Eux** : ce que vous comprenez de leurs besoins et comment vous y répondez.
4. **Nous** : votre motivation, votre disponibilité, une demande d'entretien.

Conseils : adaptez chaque lettre, évitez les formules toutes faites, faites relire votre mentor.`;
    }
    if (q.some((w) => w.startsWith("entretien"))) {
      return `Préparer un entretien :

- **Présentez-vous en 1 minute** : formation, projet marquant, objectif.
- **Préparez 3 exemples** selon la méthode STAR (Situation, Tâche, Action, Résultat).
- **Renseignez-vous** sur l'organisation (activités, actualités, valeurs).
- **Préparez 2 questions** à poser au recruteur.
- **Entraînez-vous à voix haute**, idéalement avec votre mentor lors d'une séance.`;
    }
    return `Structure d'un CV clair (1 page) :

1. **En-tête** : nom, téléphone, e-mail professionnel, ville, lien vers un portfolio.
2. **Titre** : le poste ou le domaine visé.
3. **Formation** : du plus récent au plus ancien.
4. **Expériences et projets** : verbes d'action et résultats concrets.
5. **Compétences** : techniques, langues, outils.
6. **Engagements** : associations, bénévolat, hackathons.

Ne mentionnez que des éléments réels et vérifiables. Demandez à votre mentor de relire votre CV.`;
  }
  if (mode === "mentor_prep") {
    return `Trame de séance (45 à 60 min) :

1. **Accueil (5 min)** : nouvelles, humeur, point sur la dernière séance.
2. **Revue des objectifs (10 min)** : étapes accomplies, blocages.
3. **Sujet du jour (25 min)** : conseil, exercice, relecture ou simulation.
4. **Plan d'action (10 min)** : 1 à 3 actions concrètes avant la prochaine séance, notées dans les étapes de l'objectif.
5. **Clôture (5 min)** : date de la prochaine séance.

Questions utiles : « Qu'est-ce qui t'a le plus appris ce mois-ci ? », « Qu'est-ce qui te bloque ? », « De quoi as-tu besoin de ma part ? »`;
  }
  return `Pour clarifier votre orientation, répondez à ces questions (vous pouvez les noter dans votre profil) :

1. **Ce que vous aimez faire** : quelles activités vous font perdre la notion du temps ?
2. **Vos forces** : pour quoi vous demande-t-on souvent de l'aide ?
3. **Le métier visé** : en connaissez-vous le quotidien ? Une séance avec un mentor du domaine peut vous éclairer.
4. **Le chemin** : quelles formations ou compétences sont nécessaires ?
5. **L'échéance** : où voulez-vous être dans 1 an ? dans 3 ans ?

Ensuite : renseignez vos domaines et objectifs dans votre profil, puis consultez les mentors recommandés.`;
}
