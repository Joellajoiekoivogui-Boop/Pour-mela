"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import type { ReactNode } from "react";
import { stage } from "@/lib/stage";

/** Enveloppe magnétique : l'élément est attiré par la souris qui s'approche. */
export function Magnetic({ children, strength = 0.35, className }: { children: ReactNode; strength?: number; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 });

  return (
    <motion.div
      className={className}
      style={{ x: sx, y: sy, display: "inline-block" }}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse" || stage.quality.reducedMotion) return;
        const rect = event.currentTarget.getBoundingClientRect();
        x.set((event.clientX - rect.left - rect.width / 2) * strength);
        y.set((event.clientY - rect.top - rect.height / 2) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
