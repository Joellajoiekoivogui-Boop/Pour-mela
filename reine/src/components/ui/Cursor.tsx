"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { director } from "@/lib/director";

/** Curseur lumineux (ordinateur seulement) : un point d'or et son halo. */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 260, damping: 26, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 260, damping: 26, mass: 0.5 });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || director.quality.reducedMotion) return;
    const root = document.documentElement;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
    };
    const over = (event: PointerEvent) => {
      const target = event.target as Element | null;
      setHover(Boolean(target?.closest?.("a, button, [data-cursor]")));
    };
    const leave = () => setVisible(false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerleave", leave);
    root.classList.add("cursor-custom");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- activation unique, après détection de l'appareil
    setEnabled(true);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.removeEventListener("pointerleave", leave);
      root.classList.remove("cursor-custom");
    };
  }, [x, y]);

  if (!enabled) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70]" style={{ opacity: visible ? 1 : 0, transition: "opacity .3s" }}>
      <motion.div
        className="absolute left-0 top-0 h-9 w-9 rounded-full border border-or-clair/60"
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
        animate={{ scale: hover ? 1.7 : 1, opacity: hover ? 0.9 : 0.55 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      />
      <motion.div
        className="absolute left-0 top-0 h-[6px] w-[6px] rounded-full bg-or-clair shadow-[0_0_12px_3px_rgb(246_227_180/0.7)]"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      />
    </div>
  );
}
