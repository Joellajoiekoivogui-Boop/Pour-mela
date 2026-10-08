"use client";

import { useSyncExternalStore } from "react";
import { director, subscribe } from "@/lib/director";
import { music } from "@/lib/music";

/** Lit une valeur du réalisateur et se met à jour quand elle change. */
export function useDirector<T>(selector: (d: typeof director) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(director),
    () => selector(director),
  );
}

const subscribeMusic = (listener: () => void) => music.subscribe(listener);

export function useMusicState() {
  const started = useSyncExternalStore(subscribeMusic, () => music.started, () => false);
  const enabled = useSyncExternalStore(subscribeMusic, () => music.enabled, () => true);
  return { started, enabled };
}
