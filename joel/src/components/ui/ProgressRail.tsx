"use client";

import { motion } from "motion/react";
import { CHAPITRES } from "@/config/joel";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { scrollToChapter } from "./Nav";

/** Le fil de progression à droite : un point par chapitre, le chapitre en cours s'allume. */
export function ProgressRail({ current }: { current: string }) {
  const { smooth: scaleY } = useScrollProgress();
  return (
    <>
      <motion.div
        aria-hidden
        className="fixed left-0 right-0 top-0 z-50 h-[2px] origin-left bg-gradient-to-r from-violet-500 via-fuchsia-300 to-white md:hidden"
        style={{ scaleX: scaleY }}
      />
      <nav aria-label="Progression" className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 md:block">
        <div className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-white/10" />
        <motion.div
          className="absolute left-1/2 top-0 w-px -translate-x-1/2 origin-top bg-gradient-to-b from-violet-400 to-fuchsia-300"
          style={{ scaleY, height: "100%" }}
        />
        <ol className="relative flex flex-col gap-5">
          {CHAPITRES.map((c) => {
            const active = c.id === current;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => scrollToChapter(c.id)}
                  aria-label={`Chapitre ${c.numero} : ${c.nom}`}
                  aria-current={active ? "step" : undefined}
                  className="group relative flex h-4 w-4 items-center justify-center"
                >
                  <span
                    className={`block rounded-full transition-all duration-500 ${active ? "h-2.5 w-2.5 bg-white shadow-[0_0_14px_#c4b5fd]" : "h-1.5 w-1.5 bg-white/40 group-hover:bg-white"}`}
                  />
                  <span className="label pointer-events-none absolute right-7 whitespace-nowrap text-white/0 transition group-hover:text-white/70">
                    {c.numero} · {c.nom}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
