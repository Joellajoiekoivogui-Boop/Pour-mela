// Le petit « bus » des effets : n'importe quel composant peut demander
// des confettis, une gerbe d'étincelles, un message éphémère ou la fête
// complète ; la couche d'effets et les toasts écoutent.

export interface BurstOptions {
  x?: number;
  y?: number;
  count?: number;
  /** Vitesse initiale (px par image). */
  power?: number;
  colors?: string[];
  /** Particules qui montent au lieu de tomber. */
  rise?: boolean;
}

export type FxEvent =
  | { type: "burst"; options: BurstOptions }
  | { type: "confetti"; options: BurstOptions }
  | { type: "flash"; strength: number }
  | { type: "shooting-star" }
  | { type: "toast"; text: string; tone?: "secret" | "party" }
  | { type: "celebrate"; big?: boolean }
  | { type: "secret"; id: SecretId };

export type SecretId = "logo" | "geste" | "clavier" | "etoile";

type Listener = (event: FxEvent) => void;
const listeners = new Set<Listener>();

export function onFx(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emit(event: FxEvent) {
  listeners.forEach((listener) => listener(event));
}

export const PARTY_COLORS = ["#a78bfa", "#8b5cf6", "#c4b5fd", "#f5f3ff", "#f9a8d4", "#93c5fd", "#ffffff"];

export function burst(options: BurstOptions = {}) {
  emit({ type: "burst", options });
}

export function confetti(options: BurstOptions = {}) {
  emit({ type: "confetti", options });
}

export function toast(text: string, tone?: "secret" | "party") {
  emit({ type: "toast", text, tone });
}

export function celebrate(big = false) {
  emit({ type: "celebrate", big });
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* non disponible (iOS) */
  }
}

/* Les secrets trouvés sont retenus sur l'appareil (simple confort). */
const KEY = "joel-secrets";

export function foundSecrets(): SecretId[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as SecretId[];
  } catch {
    return [];
  }
}

export function findSecret(id: SecretId): number {
  const list = foundSecrets();
  if (!list.includes(id)) list.push(id);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* navigation privée */
  }
  emit({ type: "secret", id });
  return list.length;
}
