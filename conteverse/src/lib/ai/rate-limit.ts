// Limiteur simple en mémoire (par instance serveur). Suffisant pour un MVP ;
// en production à grande échelle, utiliser un stockage partagé (ex. Upstash, table Supabase).
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit = 15, windowMs = 60_000): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= limit) {
    hits.set(key, list);
    return false;
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return true;
}
