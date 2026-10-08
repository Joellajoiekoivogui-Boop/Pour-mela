"use client";

import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { CHAPITRES, joel } from "@/config/joel";
import { burst } from "@/lib/fx";
import { ChapterLabel } from "../ui/ChapterLabel";

// Fenêtres de défilement (0 → 1) de chaque phrase.
const WINDOWS: [number, number][] = [
  [0.0, 0.22],
  [0.22, 0.36],
  [0.36, 0.5],
  [0.5, 0.64],
  [0.64, 0.78],
  [0.8, 1.01],
];

function useWindow(progress: MotionValue<number>, [a, b]: [number, number], last = false) {
  const span = b - a;
  return useTransform(progress, last ? [a, a + span * 0.25] : [a, a + span * 0.25, b - span * 0.2, b], last ? [0, 1] : [0, 1, 1, 0]);
}

/** Les mots de la phrase d'ouverture s'allument un à un au défilement. */
function LitWord({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  const blur = useTransform(progress, range, ["blur(4px)", "blur(0px)"]);
  return (
    <motion.span style={{ opacity, filter: blur }} className="inline-block">
      {word}&nbsp;
    </motion.span>
  );
}

/**
 * Chapitre 03 — « Une nouvelle année ». Récit au défilement : l'écran reste
 * fixe pendant que les phrases se succèdent, chacune avec son entrée.
 */
export function NewYear() {
  const c = CHAPITRES[2];
  const t = joel.nouvelleAnnee;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const fired = useRef(false);

  const o0 = useWindow(p, WINDOWS[0]);
  const o1 = useWindow(p, WINDOWS[1]);
  const o2 = useWindow(p, WINDOWS[2]);
  const o3 = useWindow(p, WINDOWS[3]);
  const o4 = useWindow(p, WINDOWS[4]);
  const o5 = useWindow(p, WINDOWS[5], true);

  // Une page qui se tourne.
  const r1 = useTransform(p, [WINDOWS[1][0], WINDOWS[1][0] + 0.06], [85, 0]);
  // Une idée qui s'allume.
  const s2 = useTransform(p, [WINDOWS[2][0], WINDOWS[2][0] + 0.07], [0.55, 1]);
  const b2 = useTransform(p, [WINDOWS[2][0], WINDOWS[2][0] + 0.07], ["blur(18px)", "blur(0px)"]);
  // Des projets qui arrivent de côté.
  const x3 = useTransform(p, [WINDOWS[3][0], WINDOWS[3][0] + 0.07, WINDOWS[3][1] - 0.03, WINDOWS[3][1]], ["-40%", "0%", "0%", "30%"]);
  const k3 = useTransform(p, [WINDOWS[3][0], WINDOWS[3][0] + 0.07], [-14, 0]);
  // Des défis : les lettres se resserrent.
  const ls4 = useTransform(p, [WINDOWS[4][0], WINDOWS[4][0] + 0.08], ["0.8em", "-0.02em"]);
  const y4 = useTransform(p, [WINDOWS[4][0], WINDOWS[4][0] + 0.08], [60, 0]);
  // La nouvelle ère : immense, puis à sa place.
  const s5 = useTransform(p, [WINDOWS[5][0], WINDOWS[5][0] + 0.1], [2.6, 1]);
  const b5 = useTransform(p, [WINDOWS[5][0], WINDOWS[5][0] + 0.1], ["blur(30px)", "blur(0px)"]);
  const ring = useTransform(p, [WINDOWS[5][0], 1], [0.2, 1.6]);
  const ringO = useTransform(p, [WINDOWS[5][0], WINDOWS[5][0] + 0.05, 0.98], [0, 0.9, 0.3]);
  const counter = useTransform(p, (v) => `0${Math.min(4, Math.max(0, Math.floor((v - 0.22) / 0.14) + 1))} / 04`);
  const bar = useTransform(p, [0, 1], [0, 1]);

  useMotionValueEvent(p, "change", (v) => {
    if (v > WINDOWS[5][0] + 0.09 && !fired.current) {
      fired.current = true;
      burst({ count: 140, power: 9 });
    } else if (v < WINDOWS[5][0] - 0.05) fired.current = false;
  });

  const words = t.ouverture.split(" ");
  const [a, b] = WINDOWS[0];
  const phrase = "font-display font-bold leading-[0.95] tracking-tight text-[clamp(2.4rem,8vw,7.5rem)]";

  return (
    <section ref={ref} id="nouvelle-annee" data-chapter="nouvelle-annee" className="relative h-[520vh] md:h-[620vh]">
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden px-6">
        <div className="absolute left-6 top-24 sm:left-10">
          <ChapterLabel numero={c.numero} texte={c.sousTitre} />
        </div>

        <motion.p style={{ opacity: o0 }} className="absolute max-w-5xl text-center font-display text-[clamp(1.8rem,5vw,4.2rem)] font-semibold leading-tight">
          {words.map((word, i) => (
            <LitWord key={i} word={word} progress={p} range={[a + ((b - a) * 0.7 * i) / words.length, a + ((b - a) * 0.7 * (i + 1)) / words.length]} />
          ))}
        </motion.p>

        <motion.p style={{ opacity: o1, rotateX: r1, transformPerspective: 900, transformOrigin: "50% 100%" }} className={`absolute text-center ${phrase}`}>
          {t.etapes[0]}
        </motion.p>
        <motion.p style={{ opacity: o2, scale: s2, filter: b2 }} className={`absolute text-center ${phrase} text-glow`}>
          {t.etapes[1]}
        </motion.p>
        <motion.p style={{ opacity: o3, x: x3, skewX: k3 }} className={`absolute text-center ${phrase}`}>
          {t.etapes[2]}
        </motion.p>
        <motion.p style={{ opacity: o4, letterSpacing: ls4, y: y4 }} className={`absolute text-center ${phrase}`}>
          {t.etapes[3]}
        </motion.p>

        <motion.div aria-hidden style={{ opacity: ringO, scale: ring }} className="era-ring absolute aspect-square w-[min(80vw,640px)] rounded-full" />
        <motion.h2
          style={{ opacity: o5, scale: s5, filter: b5 }}
          className="era-title absolute text-center font-display text-[clamp(3rem,12vw,11rem)] font-extrabold uppercase leading-[0.88] tracking-tight"
        >
          {t.final}
        </motion.h2>

        <div className="label absolute bottom-[calc(var(--safe-bottom)+24px)] left-6 right-6 flex items-center gap-4 text-white/40 sm:left-10 sm:right-10">
          <motion.span>{counter}</motion.span>
          <div className="h-px flex-1 bg-white/10">
            <motion.div className="h-full origin-left bg-gradient-to-r from-violet-400 to-fuchsia-300" style={{ scaleX: bar }} />
          </div>
          <span>{t.final.replace(".", "")}</span>
        </div>
      </div>
    </section>
  );
}
