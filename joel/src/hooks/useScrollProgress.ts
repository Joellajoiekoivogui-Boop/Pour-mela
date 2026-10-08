"use client";

import { useScroll, useSpring, type MotionValue } from "motion/react";
import type { RefObject } from "react";

/**
 * Avancée (0 → 1) du défilement : de la page entière, ou d'une section
 * pendant qu'elle traverse l'écran. Lissée par un ressort.
 */
export function useScrollProgress(
  target?: RefObject<HTMLElement | null>,
  offset: ["start start", "end end"] | ["start end", "end start"] = ["start start", "end end"],
): {
  raw: MotionValue<number>;
  smooth: MotionValue<number>;
} {
  const { scrollYProgress } = useScroll(target ? { target, offset } : undefined);
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  return { raw: scrollYProgress, smooth };
}
