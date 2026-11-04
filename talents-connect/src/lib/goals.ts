/** Progression d'un objectif : part des étapes réellement accomplies (0 à 100). */
export function goalProgress(milestones: { is_done: boolean }[]): number {
  if (milestones.length === 0) return 0;
  const done = milestones.filter((m) => m.is_done).length;
  return Math.round((done / milestones.length) * 100);
}

/**
 * Progression globale : toutes les étapes des objectifs non abandonnés,
 * pondérées par leur nombre (un objectif de 10 étapes pèse plus qu'un de 2).
 */
export function overallProgress(goals: { status: string; milestones: { is_done: boolean }[] }[]): number {
  const all = goals.filter((g) => g.status !== "abandoned").flatMap((g) => g.milestones);
  return goalProgress(all);
}
