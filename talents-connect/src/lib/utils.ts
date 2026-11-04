import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fullName(p: { first_name?: string | null; last_name?: string | null } | null | undefined): string {
  const name = `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim();
  return name || "Membre";
}

export function initials(p: { first_name?: string | null; last_name?: string | null } | null | undefined): string {
  const a = p?.first_name?.trim()?.[0] ?? "";
  const b = p?.last_name?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "TC";
}

/** Normalise un texte pour la comparaison : minuscules, sans accents. */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Accepte uniquement les chemins internes (évite les redirections ouvertes). */
export function safeInternalPath(path: string | null | undefined, fallback = "/espace"): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return fallback;
  return path;
}

export function pluralize(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`;
}
