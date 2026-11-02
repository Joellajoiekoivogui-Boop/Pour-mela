/**
 * Typographie française : espace fine insécable avant ? ! ; : et à l'intérieur
 * des guillemets, pour éviter qu'un signe se retrouve seul en début de ligne.
 */
export function frSpaces(s: string): string {
  return s
    .replace(/ ([?!;:»])/g, " $1")
    .replace(/« /g, "« ");
}

/** Applique frSpaces à toutes les chaînes d'une structure de données. */
export function frTypo<T>(value: T): T {
  if (typeof value === "string") return frSpaces(value) as T;
  if (Array.isArray(value)) return value.map(frTypo) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      // Les identifiants techniques ne sont pas modifiés.
      out[k] = ["slug", "id", "next", "start", "code", "url", "scene", "category", "scope", "quizSlug", "flag", "articles", "related", "icon", "color"].includes(k) ? v : frTypo(v);
    }
    return out as T;
  }
  return value;
}
