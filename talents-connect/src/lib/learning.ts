/**
 * Règles des mécanismes d'apprentissage (fonctions pures, testées).
 * Fondements : docs/conception-comportementale.md
 */

/** Révision espacée : première à J+2 après la prise de notes, puis tous les 7 jours, 4 fois au plus. */
export function isReviewDue(a: { mentee_takeaways: string | null; takeaways_at: string | null; reviewed_at: string | null; review_count: number }, now = new Date()): boolean {
  if (!a.mentee_takeaways || !a.takeaways_at || a.review_count >= 4) return false;
  const DAY = 86_400_000;
  const last = new Date(a.reviewed_at ?? a.takeaways_at).getTime();
  const gap = a.reviewed_at ? 7 * DAY : 2 * DAY;
  return now.getTime() - last >= gap;
}

/** Prochaine petite action : première étape non faite de l'objectif actif le plus prioritaire, puis le plus proche de l'échéance. */
export function nextAction<G extends { id: string; title: string; status: string; priority: string; due_date: string | null; milestones: { id: string; title: string; is_done: boolean; position: number; intention?: string | null }[] }>(goals: G[]) {
  const rank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const active = goals
    .filter((g) => g.status !== "completed" && g.status !== "abandoned" && g.milestones.some((m) => !m.is_done))
    .sort((a, b) => (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1) || (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
  const goal = active[0];
  if (!goal) return null;
  const steps = [...goal.milestones].sort((a, b) => a.position - b.position);
  const step = steps.find((m) => !m.is_done)!;
  return { goal, step, done: steps.filter((m) => m.is_done).length, total: steps.length };
}

/** Complétude du profil : chaque élément utile au matching, avec le lien pour le compléter. */
export function profileChecklist(p: { avatar: boolean; bio: boolean; education: boolean; domains: number; wanted: number; goals: boolean }) {
  return [
    { label: "Ajouter une photo", done: p.avatar },
    { label: "Me présenter en quelques lignes", done: p.bio },
    { label: "Indiquer ma formation", done: p.education },
    { label: "Choisir au moins un domaine", done: p.domains > 0 },
    { label: "Choisir les compétences que je veux acquérir", done: p.wanted > 0 },
    { label: "Décrire mon objectif professionnel", done: p.goals },
  ];
}

/** Message de réussite d'une étape : retour sur la compétence, sans points ni classement. */
export function milestoneFeedback(done: number, total: number): string {
  if (total > 0 && done === total) return "Objectif atteint ! Prenez un moment pour en parler avec votre mentor.";
  if (done === 1) return "Première étape franchie : le plus dur est de commencer.";
  if (total > 0 && done / total >= 0.5 && (done - 1) / total < 0.5) return "Vous avez passé la moitié du chemin.";
  return `Étape validée : ${done} sur ${total}.`;
}
