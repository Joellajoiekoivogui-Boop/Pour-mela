"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMusicState } from "@/hooks/useDirector";
import { music } from "@/lib/music";

/** Bouton son : un petit égaliseur qui danse quand la musique joue. */
export function SoundToggle() {
  const { started, enabled } = useMusicState();
  return (
    <AnimatePresence>
      {started ? (
        <motion.button
          type="button"
          key="son"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          onClick={() => music.toggle()}
          aria-pressed={enabled}
          aria-label={enabled ? "Couper la musique" : "Remettre la musique"}
          data-cursor
          className="fixed right-4 top-[calc(var(--safe-top)+14px)] z-50 flex h-11 w-11 items-end justify-center gap-[3px] rounded-full border border-or/25 bg-encre/60 pb-[13px] backdrop-blur-sm transition-colors hover:border-or/60"
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`block w-[2px] rounded-full bg-or-clair ${enabled ? "eq-bar" : ""}`}
              style={{
                height: enabled ? 14 : 3,
                animationDelay: `${i * 0.17}s`,
                animationDuration: `${0.9 + i * 0.13}s`,
                transition: "height 0.4s",
              }}
            />
          ))}
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
