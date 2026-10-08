// Le calendrier de l'anniversaire : avant, le jour J, après. Tout se fait
// à l'heure locale du visiteur. Fonctions pures, testées (birthday.test.ts).

export type Phase = "before" | "today" | "after";

export interface BirthdayInfo {
  phase: Phase;
  /** Prochain début de journée d'anniversaire (le jour J : l'an prochain). */
  next: Date;
  /** Millisecondes restantes avant `next`. */
  remaining: number;
}

export interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const DAY = 86_400_000;

export function birthdayInfo(now: Date, month: number, day: number, daysAfter = 60): BirthdayInfo {
  const year = now.getFullYear();
  const thisYear = new Date(year, month - 1, day);
  const endOfDay = new Date(year, month - 1, day + 1);

  if (now >= thisYear && now < endOfDay) {
    const next = new Date(year + 1, month - 1, day);
    return { phase: "today", next, remaining: next.getTime() - now.getTime() };
  }
  if (now < thisYear) {
    const last = new Date(year - 1, month - 1, day + 1);
    const phase: Phase = now.getTime() - last.getTime() < daysAfter * DAY ? "after" : "before";
    return { phase, next: thisYear, remaining: thisYear.getTime() - now.getTime() };
  }
  const next = new Date(year + 1, month - 1, day);
  const phase: Phase = now.getTime() - endOfDay.getTime() < daysAfter * DAY ? "after" : "before";
  return { phase, next, remaining: next.getTime() - now.getTime() };
}

export function splitDuration(ms: number): Parts {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * Pour essayer le site à une autre date : ?date=2026-10-10T08:00
 * Renvoie le décalage à appliquer à l'horloge (0 sans paramètre).
 */
export function clockOffset(search: string): number {
  const value = new URLSearchParams(search).get("date");
  if (!value) return 0;
  const target = new Date(value);
  return Number.isNaN(target.getTime()) ? 0 : target.getTime() - Date.now();
}
