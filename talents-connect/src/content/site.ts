/** Contenus éditoriaux du site public (textes, FAQ, témoignages d'exemple). */

export const HOW_IT_WORKS = [
  { title: "Créez votre profil", text: "Indiquez votre formation, vos compétences, les domaines qui vous intéressent et vos objectifs professionnels." },
  { title: "Recevez des recommandations", text: "Le moteur de matching classe les mentors vérifiés selon 5 critères objectifs, et explique chaque recommandation." },
  { title: "Demandez un mentorat", text: "Présentez votre motivation au mentor choisi. Il accepte ou décline, et vous êtes notifié immédiatement." },
  { title: "Progressez ensemble", text: "Réservez des séances, échangez par messagerie, définissez vos objectifs et suivez votre progression étape par étape." },
];

export const BENEFITS = [
  { icon: "badge-check", title: "Mentors vérifiés", text: "Chaque mentor est validé par l'équipe avant d'apparaître dans l'annuaire." },
  { icon: "scale", title: "Matching explicable", text: "Un score sur 100 calculé à partir de critères transparents : domaines, compétences, objectifs, disponibilités, expérience." },
  { icon: "calendar-check", title: "Séances organisées", text: "Créneaux, confirmations, rappels et historique, à l'heure de Conakry." },
  { icon: "target", title: "Progression mesurée", text: "Des objectifs découpés en étapes : la progression reflète ce qui est réellement accompli." },
  { icon: "lock", title: "Données protégées", text: "Vos échanges ne sont visibles que de vous et de votre mentor. Sécurité vérifiée au niveau de la base de données." },
  { icon: "smartphone", title: "Pensé pour le mobile", text: "Une interface légère, adaptée aux smartphones et aux connexions modestes." },
];

/**
 * Témoignages FICTIFS servant d'exemples pendant la démonstration.
 * Ils sont affichés avec la mention « Exemple illustratif » et doivent être
 * remplacés par de vrais témoignages (avec accord écrit) après le lancement.
 */
export const DEMO_TESTIMONIALS = [
  { name: "Aïssatou", role: "Étudiante en licence informatique", text: "J'avais des bases en HTML mais je ne savais pas par où continuer. Avoir un plan étape par étape et quelqu'un pour relire mon portfolio change tout." },
  { name: "Ousmane", role: "Porteur de projet agritech", text: "Le mentor m'a aidé à structurer mon business plan avant un concours d'incubateur. Les séances courtes et régulières conviennent à mon emploi du temps." },
  { name: "Mariama", role: "Mentore, responsable marketing", text: "Je voulais transmettre, mais sans perdre de temps en organisation. Je publie mes créneaux, les jeunes réservent, je confirme." },
];

export const FAQ = [
  { q: "TALENTS CONNECT est-il gratuit ?", a: "Oui. L'inscription et le mentorat sont gratuits pour les jeunes. Les mentors s'engagent bénévolement." },
  { q: "Qui peut devenir mentor ?", a: "Tout professionnel expérimenté qui souhaite transmettre. Après l'inscription, l'équipe vérifie le profil avant de le rendre visible." },
  { q: "Comment le score de compatibilité est-il calculé ?", a: "Il additionne 5 critères objectifs : domaines d'expertise (35 pts), compétences recherchées (30 pts), objectifs (15 pts), disponibilités (10 pts) et expérience (10 pts). Le détail est affiché sur chaque recommandation. Ce n'est pas une « prédiction » d'IA." },
  { q: "À quoi sert l'assistant IA ?", a: "Il aide à clarifier une orientation, structurer un CV ou une lettre, préparer un entretien ou générer un plan d'apprentissage. Il ne remplace pas le mentor et n'invente ni offres ni qualifications. Sans clé d'API configurée, il fonctionne avec des modèles prédéfinis." },
  { q: "Mes conversations sont-elles privées ?", a: "Oui. Seuls les deux participants d'un mentorat peuvent lire leur conversation, y compris vis-à-vis de l'administration." },
  { q: "Les séances se déroulent-elles en ligne ?", a: "Au choix du mentor : présentiel, visioconférence, appel audio ou échange écrit. Les horaires sont affichés à l'heure de Conakry." },
];

/** Domaines présentés si la base n'est pas encore configurée (mêmes valeurs que supabase/seed.sql). */
export const FALLBACK_DOMAINS = [
  { slug: "developpement-informatique", name: "Développement informatique", description: "Web, mobile, logiciel, bases de données et bonnes pratiques de code.", icon: "code" },
  { slug: "intelligence-artificielle", name: "Intelligence artificielle", description: "Données, apprentissage automatique, modèles de langage et IA appliquée.", icon: "brain-circuit" },
  { slug: "cybersecurite", name: "Cybersécurité", description: "Sécurité des systèmes, des réseaux et des applications.", icon: "shield-check" },
  { slug: "entrepreneuriat", name: "Entrepreneuriat", description: "Créer, financer et faire grandir une entreprise ou une startup.", icon: "rocket" },
  { slug: "marketing-digital", name: "Marketing digital", description: "Réseaux sociaux, contenu, référencement et acquisition.", icon: "megaphone" },
  { slug: "leadership", name: "Leadership", description: "Prise de parole, management d'équipe et développement personnel.", icon: "users" },
  { slug: "gestion-de-projets", name: "Gestion de projets", description: "Planifier, piloter et livrer des projets, méthodes agiles.", icon: "kanban" },
  { slug: "orientation-professionnelle", name: "Orientation professionnelle", description: "Choix d'études, CV, candidatures et entretiens.", icon: "compass" },
  { slug: "culture-litterature", name: "Culture et littérature", description: "Écriture, édition, lecture et métiers du livre.", icon: "book-open" },
  { slug: "design-creativite", name: "Design et créativité", description: "Design graphique, UX/UI, image et vidéo.", icon: "palette" },
  { slug: "finance-gestion", name: "Finance et gestion", description: "Comptabilité, finance d'entreprise et gestion.", icon: "wallet" },
  { slug: "agriculture-environnement", name: "Agriculture et environnement", description: "Agritech, énergies renouvelables et développement durable.", icon: "sprout" },
];
