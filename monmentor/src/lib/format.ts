// Mise en forme pour l'affichage, à l'heure de Conakry (UTC+0, sans heure d'été).
export const TZ = "Africa/Conakry";

export function formatDateTime(ms: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  }).format(ms);
}

export function formatDate(value: number | string): string {
  const d = typeof value === "string" ? new Date(`${value.slice(0, 10)}T12:00:00Z`) : new Date(value);
  return new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function formatShortDate(value: number | string): string {
  const d = typeof value === "string" ? new Date(`${value.slice(0, 10)}T12:00:00Z`) : new Date(value);
  return new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, day: "numeric", month: "short" }).format(d);
}

export function formatTime(ms: number): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(ms);
}

const pr = new Intl.PluralRules("fr-FR");
/** plural(1, "séance") → « 1 séance » ; plural(3, "séance") → « 3 séances ». */
export function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${n.toLocaleString("fr-FR")} ${pr.select(n) === "one" ? singular : pluralForm}`;
}

export function relativeTime(ms: number, now = Date.now()): string {
  const rtf = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });
  const diff = ms - now;
  const abs = Math.abs(diff);
  const min = 60_000, h = 60 * min, d = 24 * h;
  if (abs < h) return rtf.format(Math.round(diff / min), "minute");
  if (abs < d) return rtf.format(Math.round(diff / h), "hour");
  if (abs < 30 * d) return rtf.format(Math.round(diff / d), "day");
  return formatDate(ms);
}

/** Jours restants avant une date AAAA-MM-JJ (négatif si dépassée). */
export function daysUntil(isoDate: string, now = Date.now()): number {
  const target = Date.parse(`${isoDate.slice(0, 10)}T23:59:59Z`);
  return Math.ceil((target - now) / 86_400_000);
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

export function ageFrom(birthDate: string | null | undefined, now = new Date()): number | null {
  if (!birthDate) return null;
  const b = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(b.getTime())) return null;
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  const m = now.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

export const isMinor = (birthDate: string | null | undefined, now = new Date()) => {
  const a = ageFrom(birthDate, now);
  return a !== null && a < 18;
};
