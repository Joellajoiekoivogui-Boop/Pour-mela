"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect } from "react";
import { director } from "@/lib/director";

/**
 * Le fond : aurores de couleur (CSS, presque gratuites pour le GPU) qui
 * glissent lentement à l'opposé de la souris, pour une parallaxe de plus.
 */
export function Aurora() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 30, damping: 20 });
  const springY = useSpring(y, { stiffness: 30, damping: 20 });

  useEffect(() => {
    if (director.quality.reducedMotion) return;
    let frame = 0;
    const tick = () => {
      const p = director.pointer;
      x.set((p.active ? -p.nx * 26 : 0) - director.tilt.x * 30);
      y.set((p.active ? p.ny * 18 : 0) - director.tilt.y * 22);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [x, y]);

  return (
    <div aria-hidden className="aurora-frame">
      <motion.div className="aurora" style={{ x: springX, y: springY }}>
        <span />
        <span />
        <span />
      </motion.div>
    </div>
  );
}

export function Overlays() {
  return (
    <>
      <div aria-hidden className="vignette" />
      <div aria-hidden className="grain" />
    </>
  );
}

export function StaticSky() {
  return <div aria-hidden className="static-sky" />;
}
