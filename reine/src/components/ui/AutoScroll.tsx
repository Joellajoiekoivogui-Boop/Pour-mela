"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { director } from "@/lib/director";

/** Vitesse de base : une fraction de la hauteur d'écran par seconde. */
const BASE_SPEED = 0.075;
/** Après un toucher, la lecture reprend seule au bout de ce délai (ms). */
const RESUME_AFTER = 4500;
/** Le temps de voir son prénom s'élever avant de partir (ms). */
const START_DELAY = 6500;

/**
 * Lecture automatique : la page défile seule, plus lentement là où l'on lit
 * (attribut data-defilement="0.7" sur une section) et marque une pause sur
 * les moments forts (data-pause="3000"). Un toucher, la molette ou le
 * clavier la suspendent ; elle reprend d'elle-même ensuite.
 */
export function AutoScroll() {
  const [playing, setPlaying] = useState(() => !director.quality.reducedMotion);
  const [hint, setHint] = useState(false);
  const playingRef = useRef(playing);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let speed = 0;
    let carry = 0;
    let lastUser = 0;
    let factor = 1;
    let nextProbe = 0;
    let pauseUntil = performance.now() + START_DELAY;
    const paused = new WeakSet<Element>();

    const onUser = (event: Event) => {
      if ((event.target as Element | null)?.closest?.("[data-autoscroll]")) return;
      lastUser = performance.now();
    };
    const events = ["wheel", "touchstart", "touchmove", "keydown", "pointerdown"] as const;
    events.forEach((name) => window.addEventListener(name, onUser, { passive: true }));

    // Section au milieu de l'écran : son rythme, et ses moments de pause.
    const probe = (now: number) => {
      const middle = window.innerHeight / 2;
      factor = 1;
      document.querySelectorAll<HTMLElement>("[data-defilement]").forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= middle && rect.bottom >= middle) factor = Number(section.dataset.defilement) || 1;
      });
      document.querySelectorAll<HTMLElement>("[data-pause]").forEach((element) => {
        if (paused.has(element)) return;
        const rect = element.getBoundingClientRect();
        if (rect.top + rect.height / 2 <= middle) {
          paused.add(element);
          pauseUntil = Math.max(pauseUntil, now + (Number(element.dataset.pause) || 2500));
        }
      });
    };

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (now >= nextProbe) {
        probe(now);
        nextProbe = now + 250;
      }
      const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      const held = now < pauseUntil || now < director.holdUntil;
      const moving = playingRef.current && now - lastUser > RESUME_AFTER && !held && !atEnd;
      const target = moving ? window.innerHeight * BASE_SPEED * factor : 0;
      speed += (target - speed) * (1 - Math.exp(-dt * 2.2));
      carry += speed * dt;
      const step = Math.floor(carry);
      if (step >= 1) {
        window.scrollBy(0, step);
        carry -= step;
      }
      if (atEnd && playingRef.current && !held) setPlaying(false);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const showHint = window.setTimeout(() => setHint(playingRef.current), START_DELAY - 1500);
    const hideHint = window.setTimeout(() => setHint(false), START_DELAY + 4500);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(showHint);
      window.clearTimeout(hideHint);
      events.forEach((name) => window.removeEventListener(name, onUser));
    };
  }, []);

  const toggle = () => {
    // Relancer depuis la fin : on repart du début.
    if (!playing && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setPlaying((p) => !p);
  };

  return (
    <>
      <motion.button
        type="button"
        data-autoscroll
        data-cursor
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "Mettre en pause le défilement automatique" : "Lancer le défilement automatique"}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="fixed right-4 top-[calc(var(--safe-top)+66px)] z-50 flex h-11 w-11 items-center justify-center rounded-full border border-or/25 bg-encre/60 text-or-clair backdrop-blur-sm transition-colors hover:border-or/60"
      >
        {playing ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M7 4.5v15l12-7.5z" />
          </svg>
        )}
      </motion.button>

      <AnimatePresence>
        {hint ? (
          <motion.p
            data-autoscroll
            className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--safe-bottom)+18px)] z-50 mx-auto w-fit max-w-[90vw] rounded-full border border-or/25 bg-encre/80 px-5 py-2.5 text-center font-serif text-base italic text-champagne backdrop-blur-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.7 }}
          >
            L’histoire défile toute seule · touche l’écran pour faire une pause
          </motion.p>
        ) : null}
      </AnimatePresence>
    </>
  );
}
