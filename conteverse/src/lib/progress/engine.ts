import { XP, levelFor } from "./levels.ts";
import { newlyEarnedBadges } from "./badges.ts";
import type { LearnerProfile, ProgressState } from "./types.ts";

export type ProgressEvent =
  | { type: "setProfile"; profile: LearnerProfile }
  | { type: "discoverCountry"; code: string }
  | { type: "readArticle"; slug: string }
  | { type: "completeStory"; slug: string; ending: string }
  | { type: "recordQuiz"; slug: string; score: number; total: number }
  | { type: "completeDaily"; day: string; score: number }
  | { type: "addReading"; day: string; seconds: number }
  | { type: "reset" };

const now = () => new Date().toISOString();

/** Applique un événement et attribue les badges. Fonction pure (hors horodatage). */
export function applyEvent(state: ProgressState, ev: ProgressEvent): { state: ProgressState; newBadges: string[] } {
  let s: ProgressState = state;
  switch (ev.type) {
    case "setProfile":
      s = { ...s, profile: ev.profile };
      break;
    case "discoverCountry":
      if (!s.countries[ev.code]) s = { ...s, countries: { ...s.countries, [ev.code]: now() } };
      break;
    case "readArticle":
      if (!s.articlesRead[ev.slug]) s = { ...s, articlesRead: { ...s.articlesRead, [ev.slug]: now() } };
      break;
    case "completeStory":
      s = { ...s, storiesDone: { ...s.storiesDone, [ev.slug]: { at: now(), ending: ev.ending } } };
      break;
    case "recordQuiz": {
      const prev = s.quizResults[ev.slug];
      const score = Math.max(0, Math.min(ev.score, ev.total));
      s = {
        ...s,
        quizResults: {
          ...s.quizResults,
          [ev.slug]: {
            best: Math.max(prev?.best ?? 0, score),
            total: ev.total,
            attempts: (prev?.attempts ?? 0) + 1,
            lastAt: now(),
          },
        },
      };
      break;
    }
    case "completeDaily":
      if (s.dailyDone[ev.day] === undefined) s = { ...s, dailyDone: { ...s.dailyDone, [ev.day]: ev.score } };
      break;
    case "addReading": {
      const secs = Math.max(0, Math.min(ev.seconds, 600));
      s = { ...s, readingSeconds: { ...s.readingSeconds, [ev.day]: (s.readingSeconds[ev.day] ?? 0) + secs } };
      break;
    }
    case "reset":
      return { state: { ...state, articlesRead: {}, storiesDone: {}, quizResults: {}, countries: {}, badges: {}, dailyDone: {}, readingSeconds: {} }, newBadges: [] };
  }
  const newBadges = newlyEarnedBadges(s);
  if (newBadges.length) {
    const at = now();
    s = { ...s, badges: { ...s.badges, ...Object.fromEntries(newBadges.map((b) => [b, at])) } };
  }
  return { state: s, newBadges };
}

/**
 * Les XP sont recalculés à partir des acquis : relire un article ou refaire
 * un quiz n'en rapporte pas davantage (seul le meilleur score compte).
 */
export function computeXp(s: ProgressState): number {
  const quizXp = Object.values(s.quizResults).reduce((sum, r) => sum + r.best * XP.correctAnswer, 0);
  return (
    Object.keys(s.articlesRead).length * XP.articleRead +
    Object.keys(s.storiesDone).length * XP.storyCompleted +
    Object.keys(s.countries).length * XP.countryDiscovered +
    Object.keys(s.dailyDone).length * XP.dailyChallenge +
    quizXp
  );
}

export function summarize(s: ProgressState) {
  const xp = computeXp(s);
  return {
    xp,
    level: levelFor(xp),
    articles: Object.keys(s.articlesRead).length,
    stories: Object.keys(s.storiesDone).length,
    countries: Object.keys(s.countries).length,
    badges: Object.keys(s.badges).length,
    quizzesPassed: Object.values(s.quizResults).filter((r) => r.total > 0 && r.best / r.total >= 0.6).length,
    readingMinutes: Math.round(Object.values(s.readingSeconds).reduce((a, b) => a + b, 0) / 60),
  };
}

/** Fusionne deux états (ex. progression locale + progression du compte). */
export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  const quiz = { ...a.quizResults };
  for (const [k, r] of Object.entries(b.quizResults)) {
    const p = quiz[k];
    quiz[k] = p ? { best: Math.max(p.best, r.best), total: r.total, attempts: Math.max(p.attempts, r.attempts), lastAt: p.lastAt > r.lastAt ? p.lastAt : r.lastAt } : r;
  }
  const reading = { ...a.readingSeconds };
  for (const [d, v] of Object.entries(b.readingSeconds)) reading[d] = Math.max(reading[d] ?? 0, v);
  return {
    version: 1,
    profile: b.profile ?? a.profile,
    articlesRead: { ...b.articlesRead, ...a.articlesRead },
    storiesDone: { ...b.storiesDone, ...a.storiesDone },
    quizResults: quiz,
    countries: { ...b.countries, ...a.countries },
    badges: { ...b.badges, ...a.badges },
    dailyDone: { ...b.dailyDone, ...a.dailyDone },
    readingSeconds: reading,
  };
}

export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
