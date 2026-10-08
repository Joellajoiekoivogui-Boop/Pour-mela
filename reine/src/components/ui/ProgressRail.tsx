"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useEffect, useState } from "react";

export const CHAPTERS = [
  { id: "ma-reine", label: "Ma Reine" },
  { id: "declaration", label: "Déclaration" },
  { id: "souvenirs", label: "Souvenirs" },
  { id: "royaume", label: "Son royaume" },
  { id: "revelation", label: "Révélation" },
] as const;

/** Fil d'or en haut de l'écran et, sur grand écran, les chapitres à droite. */
export function ProgressRail() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const [active, setActive] = useState<string>(CHAPTERS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    const timer = window.setTimeout(() => {
      for (const chapter of CHAPTERS) {
        const element = document.getElementById(chapter.id);
        if (element) observer.observe(element);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <motion.div
        aria-hidden
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-gradient-to-r from-or via-or-clair to-rose shadow-[0_0_12px_rgb(233_196_106/0.8)]"
        style={{ scaleX }}
      />
      <nav aria-label="Chapitres" className="fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-end gap-5 lg:flex">
        {CHAPTERS.map((chapter, i) => {
          const isActive = chapter.id === active;
          return (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(chapter.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group flex items-center gap-3"
              aria-current={isActive ? "step" : undefined}
            >
              <span
                className={`font-display text-[0.6rem] uppercase tracking-[0.3em] transition-all duration-500 ${
                  isActive ? "text-or-clair opacity-100" : "translate-x-2 text-champagne/50 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                }`}
              >
                {String(i + 1).padStart(2, "0")} · {chapter.label}
              </span>
              <span
                className={`block rounded-full transition-all duration-500 ${
                  isActive ? "h-2.5 w-2.5 bg-or-clair shadow-[0_0_14px_3px_rgb(233_196_106/0.7)]" : "h-1.5 w-1.5 bg-champagne/30 group-hover:bg-or/80"
                }`}
              />
            </a>
          );
        })}
      </nav>
    </>
  );
}
