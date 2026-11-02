"use client";

import { useEffect, useRef, useState } from "react";
import { Coffee } from "lucide-react";
import { useProgress } from "@/components/progress/ProgressProvider";
import { todayKey } from "@/lib/progress/engine";

const PAUSE_AFTER_MIN = 30;

/**
 * Mesure le temps de lecture active (onglet visible) pour l'espace parents,
 * et propose une pause après 30 minutes dans la journée.
 */
export function ReadingTracker() {
  const { dispatch, state } = useProgress();
  const seconds = useRef(0);
  const [suggestPause, setSuggestPause] = useState(false);
  const todayRef = useRef(state.readingSeconds[todayKey()] ?? 0);

  useEffect(() => {
    todayRef.current = state.readingSeconds[todayKey()] ?? 0;
  }, [state.readingSeconds]);

  useEffect(() => {
    const tick = setInterval(() => {
      if (document.visibilityState === "visible") seconds.current += 5;
      if (seconds.current >= 30) {
        dispatch({ type: "addReading", day: todayKey(), seconds: seconds.current });
        seconds.current = 0;
        if (todayRef.current >= PAUSE_AFTER_MIN * 60) setSuggestPause(true);
      }
    }, 5000);
    return () => {
      clearInterval(tick);
      if (seconds.current > 0) dispatch({ type: "addReading", day: todayKey(), seconds: seconds.current });
    };
  }, [dispatch]);

  if (!suggestPause) return null;
  return (
    <div role="status" className="fixed bottom-4 right-4 z-40 flex max-w-xs items-start gap-3 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-encre/10">
      <Coffee className="size-6 shrink-0 text-orange-600" aria-hidden />
      <div>
        <p className="font-black">Tu as beaucoup lu aujourd&apos;hui, bravo !</p>
        <p className="text-sm text-encre-doux">C&apos;est le moment de faire une pause : bouge, joue dehors, raconte ce que tu as appris.</p>
        <button onClick={() => setSuggestPause(false)} className="mt-2 text-sm font-extrabold text-orange-700">
          D&apos;accord
        </button>
      </div>
    </div>
  );
}
