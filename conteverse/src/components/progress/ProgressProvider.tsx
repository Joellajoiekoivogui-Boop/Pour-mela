"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { applyEvent, mergeProgress, summarize, type ProgressEvent } from "@/lib/progress/engine";
import { emptyProgress, type ProgressState } from "@/lib/progress/types";
import { currentUserId, pullProgress, pushAll, pushEvent } from "@/lib/progress/sync";
import { getBrowserSupabase } from "@/lib/supabase/client";

const STORAGE_KEY = "conteverse.progress.v1";

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as ProgressState;
    return parsed?.version === 1 ? { ...emptyProgress(), ...parsed } : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

function save(s: ProgressState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Stockage indisponible (navigation privée…) : la progression reste en mémoire.
  }
}

interface Ctx {
  state: ProgressState;
  ready: boolean;
  summary: ReturnType<typeof summarize>;
  dispatch: (ev: ProgressEvent) => string[];
  /** Badges à célébrer (file d'attente des notifications). */
  celebrations: string[];
  dismissCelebration: () => void;
  userId: string | null;
}

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [celebrations, setCelebrations] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const stateRef = useRef(state);

  // Chargement initial depuis l'appareil, puis fusion avec le compte si connecté.
  useEffect(() => {
    const local = load();
    stateRef.current = local;
    // Lecture unique du stockage de l'appareil après hydratation (indisponible côté serveur).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(local);
    setReady(true);

    let cancelled = false;
    const syncAccount = async () => {
      const id = await currentUserId();
      if (cancelled) return;
      setUserId(id);
      if (!id) return;
      const remote = await pullProgress(id);
      if (cancelled || !remote) return;
      const merged = mergeProgress(stateRef.current, remote);
      stateRef.current = merged;
      setState(merged);
      save(merged);
      void pushAll(id, merged);
    };
    void syncAccount();
    const sb = getBrowserSupabase();
    const sub = sb?.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") void syncAccount();
    });
    return () => {
      cancelled = true;
      sub?.data.subscription.unsubscribe();
    };
  }, []);

  const dispatch = useCallback(
    (ev: ProgressEvent) => {
      const { state: next, newBadges } = applyEvent(stateRef.current, ev);
      stateRef.current = next;
      setState(next);
      save(next);
      if (newBadges.length) setCelebrations((c) => [...c, ...newBadges]);
      if (userId) void pushEvent(userId, ev, next, newBadges);
      return newBadges;
    },
    [userId],
  );

  const value = useMemo<Ctx>(
    () => ({
      state,
      ready,
      summary: summarize(state),
      dispatch,
      celebrations,
      dismissCelebration: () => setCelebrations((c) => c.slice(1)),
      userId,
    }),
    [state, ready, dispatch, celebrations, userId],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress doit être utilisé dans <ProgressProvider>.");
  return ctx;
}
