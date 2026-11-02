import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** Vrai après l'hydratation, faux pendant le rendu serveur (sans effet ni setState). */
export function useIsClient() {
  return useSyncExternalStore(noop, () => true, () => false);
}
