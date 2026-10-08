"use client";

import { useEffect, useState } from "react";
import { joel } from "@/config/joel";
import { birthdayInfo, clockOffset, splitDuration, type BirthdayInfo, type Parts } from "@/lib/birthday";

export interface Countdown extends BirthdayInfo {
  parts: Parts;
  /** Faux pendant le rendu serveur et la toute première image. */
  ready: boolean;
}

const EMPTY: Countdown = {
  phase: "before",
  next: new Date(0),
  remaining: 0,
  parts: { days: 0, hours: 0, minutes: 0, seconds: 0 },
  ready: false,
};

/** Compte à rebours vivant vers le prochain 10 octobre (une mise à jour par seconde). */
export function useCountdown(): Countdown {
  const [state, setState] = useState<Countdown>(EMPTY);

  useEffect(() => {
    const offset = clockOffset(window.location.search);
    const { mois, jour } = joel.anniversaire;
    let timer = 0;
    const update = () => {
      const now = new Date(Date.now() + offset);
      const info = birthdayInfo(now, mois, jour, joel.joursApres);
      setState({ ...info, parts: splitDuration(info.remaining), ready: true });
      // On se recale sur la seconde pile pour que les chiffres changent ensemble.
      timer = window.setTimeout(update, 1000 - (now.getTime() % 1000) + 5);
    };
    update();
    return () => window.clearTimeout(timer);
  }, []);

  return state;
}
