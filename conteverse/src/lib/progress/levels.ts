export interface Level {
  rank: number;
  name: string;
  minXp: number;
}

export const LEVELS: Level[] = [
  { rank: 1, name: "Petit curieux", minXp: 0 },
  { rank: 2, name: "Explorateur", minXp: 100 },
  { rank: 3, name: "Découvreur", minXp: 250 },
  { rank: 4, name: "Ambassadeur du savoir", minXp: 500 },
  { rank: 5, name: "Gardien du patrimoine", minXp: 900 },
];

export function levelFor(xp: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.minXp) current = l;
  const next = LEVELS.find((l) => l.minXp > xp) ?? null;
  const progress = next ? (xp - current.minXp) / (next.minXp - current.minXp) : 1;
  return { current, next, progress: Math.max(0, Math.min(1, progress)) };
}

/** Barème d'XP : on récompense la compréhension, pas le temps passé. */
export const XP = {
  articleRead: 20,
  storyCompleted: 25,
  countryDiscovered: 15,
  correctAnswer: 10,
  dailyChallenge: 15,
} as const;
