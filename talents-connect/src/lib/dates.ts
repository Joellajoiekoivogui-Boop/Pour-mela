import { TZDate } from "@date-fns/tz";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

/** Fuseau de référence de la plateforme (UTC+0, sans heure d'été). */
export const APP_TIME_ZONE = "Africa/Conakry";

function inZone(value: string | Date, tz = APP_TIME_ZONE): TZDate {
  return new TZDate(new Date(value).getTime(), tz);
}

/** « mardi 12 novembre 2026 à 14:30 » dans le fuseau de Conakry. */
export function formatDateTime(value: string | Date, tz = APP_TIME_ZONE): string {
  return format(inZone(value, tz), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr });
}

export function formatDate(value: string | Date, tz = APP_TIME_ZONE): string {
  return format(inZone(value, tz), "d MMMM yyyy", { locale: fr });
}

export function formatShortDate(value: string | Date, tz = APP_TIME_ZONE): string {
  return format(inZone(value, tz), "d MMM", { locale: fr });
}

export function formatTime(value: string | Date, tz = APP_TIME_ZONE): string {
  return format(inZone(value, tz), "HH:mm", { locale: fr });
}

export function timeAgo(value: string | Date): string {
  return formatDistanceToNow(new Date(value), { addSuffix: true, locale: fr });
}

/** Clé « aaaa-mm-jj » d'une date dans le fuseau de la plateforme (regroupement par jour). */
export function dayKey(value: string | Date, tz = APP_TIME_ZONE): string {
  return format(inZone(value, tz), "yyyy-MM-dd");
}

/**
 * Convertit une date et une heure saisies à Conakry (« 2026-11-12 », « 14:30 »)
 * en instant UTC (ISO). Renvoie null si la saisie est invalide.
 */
export function zonedInputToUtc(date: string, time: string, tz = APP_TIME_ZONE): string | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const [, y, m, day] = d.map(Number) as [number, number, number, number];
  const [, h, min] = t.map(Number) as [number, number, number];
  if (m < 1 || m > 12 || day < 1 || day > 31 || h > 23 || min > 59) return null;
  const zoned = new TZDate(y, m - 1, day, h, min, 0, tz);
  if (zoned.getDate() !== day) return null; // ex. 31 février
  return new Date(zoned.getTime()).toISOString();
}
