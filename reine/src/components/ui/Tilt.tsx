"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { director } from "@/lib/director";

interface TiltProps {
  children: ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
}

/** Carte en 3D qui s'incline sous le doigt ou la souris, avec un reflet. */
export function Tilt({ children, className = "", max = 9, glare = true }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const gx = useMotionValue(50);
  const gy = useMotionValue(30);
  const glareOpacity = useMotionValue(0);
  const springRx = useSpring(rx, { stiffness: 160, damping: 18 });
  const springRy = useSpring(ry, { stiffness: 160, damping: 18 });
  const springGlare = useSpring(glareOpacity, { stiffness: 120, damping: 20 });
  const background = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgb(255 240 210 / 0.16), transparent 55%)`;

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (director.quality.reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    ry.set((px - 0.5) * 2 * max);
    rx.set(-(py - 0.5) * 2 * max);
    gx.set(px * 100);
    gy.set(py * 100);
    glareOpacity.set(1);
  };

  const onLeave = () => {
    rx.set(0);
    ry.set(0);
    glareOpacity.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerUp={onLeave}
      style={{ rotateX: springRx, rotateY: springRy, transformPerspective: 900, transformStyle: "preserve-3d" }}
      className={`relative ${className}`}
    >
      {children}
      {glare ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ background, opacity: springGlare }}
        />
      ) : null}
    </motion.div>
  );
}
